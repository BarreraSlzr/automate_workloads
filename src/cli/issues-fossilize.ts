import { GitHubService } from '../services/github';
import { ContextFossilService } from './context-fossil';
import type { ContextEntry } from '../types';
import { Command } from 'commander';
import { extractJsonBlock, checklistToMarkdown, metadataToMarkdown } from '../utils/markdownChecklist';

async function main() {
  const program = new Command();
  program
    .option('--state <state>', 'Issue state to pull (open, closed, all)', 'all');
  program.parse(process.argv);
  const opts = program.opts();
  const state = opts.state || 'all';

  const owner = process.env.GITHUB_OWNER || 'BarreraSlzr';
  const repo = process.env.GITHUB_REPO || 'automate_workloads';
  const github = new GitHubService(owner, repo);
  const fossil = new ContextFossilService();
  await fossil.initialize();

  // Fetch all issues as JSON
  const response = await github.getIssues({ state });
  if (!response.success || !response.data) {
    console.error('❌ Failed to fetch issues:', response.error);
    process.exit(1);
  }

  let fossilized = 0;
  let skipped = 0;

  const now = new Date().toISOString();

  for (const issue of response.data) {
    // Check if already fossilized by GitHub issue number
    const existing = await fossil.queryEntries({
      search: String(issue.number),
      type: 'action',
      limit: 1,
      offset: 0
    });
    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }
    // Ensure labels are an array of strings
    const labels: string[] = Array.isArray(issue.labels)
      ? issue.labels.map(l => typeof l === 'string' ? l : (l && typeof (l as any).name === 'string' ? (l as any).name : String(l)))
      : [];
    // Fetch the latest body and parse JSON block if present
    const jsonBlock = extractJsonBlock(issue.body || '');
    let purpose = jsonBlock?.purpose;
    let checklist = jsonBlock?.checklist;
    let automationMetadata = jsonBlock?.automationMetadata;

    // If no JSON block, fallback to markdown parsing (optional, not implemented here)
    // You can add a markdown parser for legacy issues if needed

    // Build improved markdown body from JSON (source of truth)
    const bodyLines = [
      `# [GH] Issue: ${issue.title}`,
      '',
      `**Number:** ${issue.number}`,
      `**State:** ${issue.state}`,
      `**Labels:** ${(labels && labels.length > 0) ? labels.join(', ') : 'None'}`,
      `**Assignees:** ${(issue.assignees && issue.assignees.length > 0) ? issue.assignees.map((a: any) => a.login || a).join(', ') : 'None'}`,
      `**Created At:** ${issue.created_at || 'N/A'}`,
      `**Updated At:** ${issue.updated_at || 'N/A'}`,
      '',
      '---',
      '',
      '## Purpose',
      purpose || '*No purpose provided*',
      '',
      '## Checklist',
      checklistToMarkdown(checklist),
      '',
      '## Automation Metadata',
      metadataToMarkdown(automationMetadata),
      '',
      '---',
      '',
      `Fossilized at: ${now}`,
      `Fossil Metadata:`,
      '```json',
      JSON.stringify({
        ...issue,
        githubIssueNumber: issue.number,
        githubIssueState: issue.state,
        purpose,
        checklist,
        automationMetadata,
        labels,
        assignees: issue.assignees,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }, null, 2),
      '```'
    ];
    const improvedBody = bodyLines.join('\n');
    const entry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'action',
      title: `[GH] Issue: ${issue.title}`,
      content: improvedBody,
      tags: ['github', 'issue', ...labels],
      source: 'api',
      metadata: {
        githubIssueNumber: issue.number,
        githubIssueState: issue.state,
        purpose,
        checklist,
        automationMetadata,
        ...issue
      },
      version: 1,
      children: [],
    };
    // If fossil exists, update it; otherwise, add new
    if (existing && existing.length > 0 && existing[0]) {
      await fossil.updateEntry(existing[0].id, entry);
      console.log(`📝 Updated fossil for issue #${issue.number}: ${issue.title}`);
      fossilized++;
    } else {
      await fossil.addEntry(entry);
      console.log(`🦴 Fossilized issue #${issue.number}: ${issue.title}`);
      fossilized++;
    }
  }

  // Query all [GH] Issue fossils
  const ghFossils = await fossil.queryEntries({
    search: '[GH] Issue',
    type: 'action',
    limit: 1000,
    offset: 0
  });
  console.log(`\n📊 [GH] Issue fossils in storage: ${ghFossils.length}`);
  ghFossils.forEach(f => {
    console.log(`- ${f.title} (GitHub #${f.metadata?.githubIssueNumber})`);
  });

  // Assert and print whether the number matches
  const totalIssues = response.data.length;
  if (ghFossils.length === totalIssues) {
    console.log(`\n✅ All GitHub issues are fossilized! (${ghFossils.length} / ${totalIssues})`);
  } else {
    console.warn(`\n⚠️  Not all GitHub issues are fossilized. Fossils: ${ghFossils.length}, GitHub issues: ${totalIssues}`);
  }

  console.log(`\n✅ Fossilization complete. Fossilized: ${fossilized}, Skipped (already fossilized): ${skipped}`);
}

if (import.meta.main) {
  main();
} 