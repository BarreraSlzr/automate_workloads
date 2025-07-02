#!/usr/bin/env bun
// This file will be moved to scripts/migrations/003-migrate-legacy-issues.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import { extractJsonBlock, checklistToMarkdown, metadataToMarkdown } from '../../src/utils/markdownChecklist';
import { GitHubService } from '../../src/services/github';
import path from 'path';
import { callOpenAIChat } from '../../src/services/llm';

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
      if (m) return { task: m[2].trim(), checked: m[1].toLowerCase() === 'x' };
      return null;
    }).filter(Boolean) as {task: string, checked: boolean}[];
  }
  // Parse metadata as key: value pairs
  let automationMetadata: Record<string, any> = {};
  if (metadataMatch) {
    (metadataMatch[1] || '').split('\n').forEach(line => {
      const m = line.match(/^([\w\s]+):\s*(.+)$/);
      if (m) automationMetadata[m[1].trim()] = m[2].trim();
    });
  }
  return {
    purpose: (purposeMatch && purposeMatch[1].trim()) || fallbackPurpose,
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Extract the following structured data from the markdown below:\n\n- purpose: a concise summary of the main goal or intent\n- checklist: an array of objects with {task, checked} for each checklist item\n- automationMetadata: any key-value pairs or metadata blocks\n\nReturn a JSON object with { purpose, checklist, automationMetadata }.\n\nMarkdown:\n\n${body}`;
      const response = await callOpenAIChat({
        model: 'gpt-3.5-turbo',
        apiKey,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that extracts structured data from markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 512
      });
      const content = response.choices?.[0]?.message?.content;
      if (content) {
        // Try to extract JSON from a code block first
        let json;
        const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          try {
            json = JSON.parse(jsonBlockMatch[1]);
          } catch {}
        }
        // If not found, try to find the first valid JSON object in the string
        if (!json) {
          const firstCurly = content.indexOf('{');
          if (firstCurly !== -1) {
            let lastCurly = content.lastIndexOf('}');
            while (lastCurly > firstCurly) {
              try {
                json = JSON.parse(content.substring(firstCurly, lastCurly + 1));
                break;
              } catch {
                lastCurly = content.lastIndexOf('}', lastCurly - 1);
              }
            }
          }
        }
        if (json && typeof json === 'object') {
          return {
            purpose: json.purpose || '',
            checklist: Array.isArray(json.checklist) ? json.checklist : [],
            automationMetadata: typeof json.automationMetadata === 'object' && json.automationMetadata ? json.automationMetadata : {}
          };
        }
      }
    } catch (e) {
      console.warn('⚠️  OpenAI LLM extraction failed, falling back to local extraction:', e);
    }
  }
  // Fallback: Extract all checklist items from the markdown
  const checklistRegex = /^([ \t]*[-*] \[)( |x|X)(\] )(.*)$/gm;
  const checklist: {task: string, checked: boolean}[] = [];
  let match;
  while ((match = checklistRegex.exec(body)) !== null) {
    checklist.push({
      task: match[4].trim(),
      checked: match[2].toLowerCase() === 'x'
    });
  }
  // Try to extract a purpose from the first non-header, non-checklist paragraph
  const lines = body.split('\n');
  let purpose = '';
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && !line.match(/^[-*] \[( |x|X)\]/)) {
      purpose = line.trim();
      break;
    }
  }
  // If nothing found, fallback to a generic summary
  if (!purpose) {
    purpose = `LLM summary: ${body.slice(0, 80)}...`;
  }
  return {
    purpose,
    checklist,
    automationMetadata: { LLM: 'No legacy structure found, used improved LLM guidance.' }
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
    let parsed = parseLegacySections(issue.body || '');
    let usedLLM = false;
    // If all fields are empty, use LLM guidance
    if (!parsed.purpose || !parsed.checklist || parsed.checklist.length === 0 || !parsed.automationMetadata || Object.keys(parsed.automationMetadata).length === 0) {
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

// CLI: allow updating a single issue from a file, with LLM processing
if (process.argv[2] === '--update' && process.argv[3] && process.argv[4]) {
  (async () => {
    const issueNumber = parseInt(process.argv[3], 10);
    const filePath = process.argv[4];
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    const markdown = fs.readFileSync(filePath, 'utf-8');
    // LLM process the markdown
    const parsed = await getLLMSuggestions(markdown);
    // Build modern body
    const newBody = buildModernBody({
      title: `Issue #${issueNumber}`,
      purpose: parsed.purpose,
      checklist: parsed.checklist,
      automationMetadata: parsed.automationMetadata
    });
    const tempFile = `.update-issue-body-${issueNumber}.md`;
    fs.writeFileSync(tempFile, newBody);
    execSync(`gh issue edit ${issueNumber} --body-file ${tempFile}`);
    fs.unlinkSync(tempFile);
    console.log(`✅ Updated issue #${issueNumber} with LLM-processed markdown.`);
    process.exit(0);
  })();
}

migrate(); 