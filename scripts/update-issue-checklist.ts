#!/usr/bin/env bun
import { updateMarkdownChecklist, ChecklistUpdate } from "../src/utils/markdownChecklist";
import { execSync } from "child_process";
import * as fs from "fs";

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