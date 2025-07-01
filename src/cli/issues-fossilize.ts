import { GitHubService } from '../services/github';
import { ContextFossilService } from './context-fossil';
import type { ContextEntry } from '../types';

async function main() {
  const owner = process.env.GITHUB_OWNER || 'BarreraSlzr';
  const repo = process.env.GITHUB_REPO || 'automate_workloads';
  const github = new GitHubService(owner, repo);
  const fossil = new ContextFossilService();
  await fossil.initialize();

  // Fetch all issues as JSON
  const response = await github.getIssues({ state: 'all' });
  if (!response.success || !response.data) {
    console.error('❌ Failed to fetch issues:', response.error);
    process.exit(1);
  }

  let fossilized = 0;
  let skipped = 0;

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
    // Create fossil entry
    const now = new Date().toISOString();
    const entry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'action',
      title: `[GH] Issue: ${issue.title}`,
      content: issue.body || '',
      tags: ['github', 'issue', ...labels],
      source: 'api',
      metadata: {
        githubIssueNumber: issue.number,
        githubIssueState: issue.state,
        ...issue
      },
      version: 1,
      children: [],
    };
    await fossil.addEntry(entry);
    fossilized++;
    console.log(`🦴 Fossilized issue #${issue.number}: ${issue.title}`);
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