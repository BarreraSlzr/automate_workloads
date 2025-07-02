#!/usr/bin/env bun
// This file will be moved to scripts/migrations/003-migrate-legacy-issues.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import { extractJsonBlock, checklistToMarkdown, metadataToMarkdown } from '../src/utils/markdownChecklist';
import { GitHubService } from '../src/services/github';

function parseLegacySections(body: string) {
  const purposeMatch = body.match(/### Purpose\n([\s\S]*?)(\n###|$)/);
  const checklistMatch = body.match(/### Checklist\n([\s\S]*?)(\n###|$)/);
  const metadataMatch = body.match(/### Automation Metadata\n([\s\S]*?)(\n###|$)/);
  // Fallback: try to find first paragraph as purpose
  const fallbackPurpose = body.split('\n').find(line => line.trim() && !line.startsWith('#')) || '';
  // Parse checklist items
  let checklist: {task: string, checked: boolean}[] = [];
  if (checklistMatch) {
    checklist = (checklistMatch[1] || '').split('\n').map(line => {
      const m = line.match(/- \[( |x|X)\] (.+)/);
      if (m && m[1] && m[2]) return { task: m[2].trim(), checked: m[1].toLowerCase() === 'x' };
      return null;
    }).filter(Boolean) as {task: string, checked: boolean}[];
  }
  // Parse metadata as key: value pairs
  let automationMetadata: Record<string, any> = {};
  if (metadataMatch) {
    (metadataMatch[1] || '').split('\n').forEach(line => {
      const m = line.match(/^([\w\s]+):\s*(.+)$/);
      if (m && m[1] && m[2]) automationMetadata[m[1].trim()] = m[2].trim();
    });
  }
  return {
    purpose: (purposeMatch && purposeMatch[1]?.trim()) || fallbackPurpose,
    checklist,
    automationMetadata
  };
}

function buildModernBody({ title, purpose, checklist, automationMetadata }: { title: string, purpose: string, checklist: {task: string, checked: boolean}[], automationMetadata: Record<string, any> }) {
  return [
    `# [GH] Issue: ${title}`,
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
    '```json',
    JSON.stringify({ purpose, checklist, automationMetadata }, null, 2),
    '```'
  ].join('\n');
}

function hasModernJsonBlock(body: string): boolean {
  return !!extractJsonBlock(body);
}

// LLM guidance stub (replace with real LLM API call if available)
async function getLLMSuggestions(body: string): Promise<{purpose: string, checklist: {task: string, checked: boolean}[], automationMetadata: Record<string, any>}> {
  // In a real implementation, call your LLM API here
  // For now, return a basic summary
  return {
    purpose: `LLM summary: ${body.slice(0, 80)}...`,
    checklist: [],
    automationMetadata: { LLM: 'No legacy structure found, used LLM guidance.' }
  };
}

async function migrate() {
  const owner = process.env.GITHUB_OWNER || 'BarreraSlzr';
  const repo = process.env.GITHUB_REPO || 'automate_workloads';
  const github = new GitHubService(owner, repo);
  const response = await github.getIssues({ state: 'open' });
  if (!response.success || !response.data) {
    console.error('❌ Failed to fetch issues:', response.error);
    process.exit(1);
  }
  const issues = response.data;
  let migrated = 0;
  for (const issue of issues) {
    if (hasModernJsonBlock(issue.body || '')) {
      continue; // Already modern
    }
    let parsed = parseLegacySections(issue.body || '');
    let usedLLM = false;
    // If all fields are empty, use LLM guidance
    if (!parsed.purpose && (!parsed.checklist || parsed.checklist.length === 0) && (!parsed.automationMetadata || Object.keys(parsed.automationMetadata).length === 0)) {
      parsed = await getLLMSuggestions(issue.body || '');
      usedLLM = true;
    }
    const newBody = buildModernBody({
      title: issue.title,
      purpose: parsed.purpose,
      checklist: parsed.checklist,
      automationMetadata: parsed.automationMetadata
    });
    const tempFile = `.migrated-issue-body-${issue.number}.md`;
    fs.writeFileSync(tempFile, newBody);
    execSync(`gh issue edit ${issue.number} --body-file ${tempFile}`);
    fs.unlinkSync(tempFile);
    if (usedLLM) {
      console.log(`🤖 LLM guidance used for issue #${issue.number}: ${issue.title}`);
      console.log('LLM suggestion:', parsed);
    } else {
      console.log(`✅ Migrated issue #${issue.number}: ${issue.title}`);
    }
    migrated++;
  }
  console.log(`\nMigration complete. Migrated ${migrated} issues.`);
}

migrate(); 