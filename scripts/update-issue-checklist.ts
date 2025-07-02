#!/usr/bin/env bun
import { updateMarkdownChecklist, ChecklistUpdate, extractJsonBlock, checklistToMarkdown, metadataToMarkdown } from "../src/utils/markdownChecklist";
import { execSync } from "child_process";
import * as fs from "fs";
import { ContextFossilService } from '../src/cli/context-fossil';
import type { ContextEntry } from '../src/types';

// Usage: bun scripts/update-issue-checklist.ts <issue_number>
// Pass checklist updates as env var: CHECKLIST_UPDATES='{"Task A":true,"Task B":false}'

const [,, issueArg] = process.argv;
const issueNumber = issueArg ? parseInt(issueArg, 10) : undefined;
const updatesEnv = process.env.CHECKLIST_UPDATES;

if (!issueNumber || !updatesEnv) {
  console.error("Usage: bun scripts/update-issue-checklist.ts <issue_number> (with CHECKLIST_UPDATES env var)");
  process.exit(1);
}

let updates: ChecklistUpdate;
try {
  updates = JSON.parse(updatesEnv);
} catch (e) {
  console.error("Invalid CHECKLIST_UPDATES JSON:", updatesEnv);
  process.exit(1);
}

// 1. Fetch the current issue body
const body = execSync(`gh issue view ${issueNumber} --json body -q ".body"`).toString();

// 2. Update the checklist
const updatedBody = updateMarkdownChecklist(body, updates);

// 3. Write to a temp file
const tempFile = `.issue_body_${issueNumber}.md`;
fs.writeFileSync(tempFile, updatedBody);

// 4. Update the issue on GitHub
execSync(`gh issue edit ${issueNumber} --body-file ${tempFile}`);

console.log(`Updated issue #${issueNumber} checklist with:`, updates);
fs.unlinkSync(tempFile);

// --- Fossilize the updated issue ---
(async () => {
  const fossil = new ContextFossilService();
  await fossil.initialize();
  // Fetch the updated issue body
  const ghBody = execSync(`gh issue view ${issueNumber} --json title,body,number,state,labels,assignees,created_at,updated_at -q "."`).toString();
  const issue = JSON.parse(ghBody);
  const labels = Array.isArray(issue.labels)
    ? issue.labels.map((l: any) => typeof l === 'string' ? l : (l && typeof l.name === 'string' ? l.name : String(l)))
    : [];
  const jsonBlock = extractJsonBlock(issue.body || '');
  let purpose = jsonBlock?.purpose;
  let checklist = jsonBlock?.checklist;
  let automationMetadata = jsonBlock?.automationMetadata;
  const now = new Date().toISOString();
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
  // Check for existing fossil
  const existing = await fossil.queryEntries({ search: String(issue.number), type: 'action', limit: 1, offset: 0 });
  if (existing && existing.length > 0 && existing[0]) {
    await fossil.updateEntry(existing[0].id, entry);
    console.log(`📝 Updated fossil for issue #${issue.number}: ${issue.title}`);
  } else {
    await fossil.addEntry(entry);
    console.log(`🦴 Fossilized issue #${issue.number}: ${issue.title}`);
  }
})(); 