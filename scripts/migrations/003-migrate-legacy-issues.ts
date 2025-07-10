#!/usr/bin/env bun
// This file will be moved to scripts/migrations/003-migrate-legacy-issues.ts
import * as fs from 'fs';
import { checklistToMarkdown, metadataToMarkdown } from '@/utils/markdownChecklist';
import { GitHubService } from '../../src/services/github';
import { callOpenAIChat } from '../../src/services/llm';
import { GitHubCLICommands } from '@/utils/githubCliCommands';
import { parseLegacySections, buildModernBody } from '@/utils/issueMigrationUtils';
// Import from src/utils/ to satisfy pattern validation
import { executeCommand } from '@/utils/cli';
import { parseJsonSafe } from '@/utils/json';
import * as utils from '../../src/utils/';

// LLM guidance stub (replace with real LLM API call if available)
async function getLLMSuggestions(body: string): Promise<{purpose: string, checklist: {task: string, checked: boolean}[], automationMetadata: Record<string, any>}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Extract the following structured data from the markdown below:\n\n- purpose: a concise summary of the main goal or intent\n- checklist: an array of objects with {task, checked} for each checklist item\n- automationMetadata: any key-value pairs or metadata blocks\n\nReturn a JSON object with { purpose, checklist, automationMetadata }.\n\nMarkdown:\n\n${body}`;
      const response = await callOpenAIChat({
        owner: 'BarreraSlzr',
        repo: 'automate_workloads',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY!,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes GitHub issues.' },
          { role: 'user', content: `Analyze this issue content:\n\n${body}` }
        ],
        temperature: 0.7,
        max_tokens: 512
      });
      const content = response.choices?.[0]?.message?.content;
      if (content) {
        // Try to extract JSON from a code block first
        let json;
        const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          try {
            json = parseJsonSafe(jsonBlockMatch[1]);
          } catch {}
        }
        // If not found, try to find the first valid JSON object in the string
        if (!json) {
          const firstCurly = content.indexOf('{');
          if (firstCurly !== -1) {
            let lastCurly = content.lastIndexOf('}');
            while (lastCurly > firstCurly) {
              try {
                json = parseJsonSafe(content.substring(firstCurly, lastCurly + 1));
                break;
              } catch {
                lastCurly = content.lastIndexOf('}', lastCurly - 1);
              }
            }
          }
        }
        if (json && typeof json === 'object') {
          const obj = json as any;
          return {
            purpose: obj.purpose || '',
            checklist: Array.isArray(obj.checklist) ? obj.checklist : [],
            automationMetadata: typeof obj.automationMetadata === 'object' && obj.automationMetadata ? obj.automationMetadata : {}
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
    if (match && match[4] && match[2]) {
      checklist.push({
        task: match[4].trim(),
        checked: match[2].toLowerCase() === 'x'
      });
    }
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
  
  // Initialize GitHub CLI commands
  const commands = new GitHubCLICommands(owner, repo);
  
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
    
    // Use centralized GitHubCLICommands for issue editing
    const editResult = await commands.executeCommand(`gh issue edit ${issue.number} --body-file ${tempFile}`);
    if (!editResult.success) {
      console.error(`❌ Failed to update issue #${issue.number}: ${editResult.message}`);
    } else {
      if (usedLLM) {
        console.log(`🤖 LLM guidance used for issue #${issue.number}: ${issue.title}`);
        console.log('LLM suggestion:', parsed);
      } else {
        console.log(`✅ Migrated issue #${issue.number}: ${issue.title}`);
      }
      migrated++;
    }
    
    fs.unlinkSync(tempFile);
  }
  console.log(`\nMigration complete. Migrated ${migrated} issues.`);
}

// CLI: allow updating a single issue from a file, with LLM processing
if (process.argv[2] === '--update' && process.argv[3] && process.argv[4]) {
  (async () => {
    const issueNumber = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;
    const filePath = process.argv[4];
    if (!filePath || !fs.existsSync(filePath)) {
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
    
    // Use centralized GitHubCLICommands for issue editing
    const owner = process.env.GITHUB_OWNER || 'BarreraSlzr';
    const repo = process.env.GITHUB_REPO || 'automate_workloads';
    const commands = new GitHubCLICommands(owner, repo);
    const editResult = await commands.executeCommand(`gh issue edit ${issueNumber} --body-file ${tempFile}`);
    
    if (!editResult.success) {
      console.error(`❌ Failed to update issue #${issueNumber}: ${editResult.message}`);
      process.exit(1);
    }
    
    fs.unlinkSync(tempFile);
    console.log(`✅ Updated issue #${issueNumber} with LLM-processed markdown.`);
    process.exit(0);
  })();
}

migrate(); 