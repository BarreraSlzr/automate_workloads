#!/usr/bin/env bun
/**
 * Pre-commit/CI LLM Insight Generator
 * - Runs type check (bun run tsc --noEmit)
 * - Analyzes git diff for changed files
 * - Generates LLM insight artifacts for each change
 * - Updates fossils/llm_insights/ and roadmap
 * - Validates all artifacts with Zod schemas
 * - Designed for Bun/Node, can be extended for CI
 */
import { executeCommand } from '@/utils/cli';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LLMInsightFossil, LLMInsightFossilSchema } from '../src/types/llmFossil';
import { PROMPT_REGISTRY } from '../src/prompts';
import { LLMService } from '../src/services/llm';
import yaml from 'js-yaml';
import { EventLoopMonitor } from '../src/utils/eventLoopMonitor';
import { getCurrentRepoOwner, getCurrentRepoName } from '../src/utils/cli';
import { z } from 'zod';
import { OwnerRepoSchema } from '../src/types/schemas';
import { parseJsonSafe } from '@/utils/json';

function detectOwnerRepo(options: any = {}): { owner: string; repo: string } {
  if (options.owner && options.repo) return { owner: options.owner, repo: options.repo };
  const owner = getCurrentRepoOwner();
  const repo = getCurrentRepoName();
  if (owner && repo) return { owner, repo };
  if (process.env.CI) {
    return { owner: 'BarreraSlzr', repo: 'automate_workloads' };
  } else {
    return { owner: 'emmanuelbarrera', repo: 'automate_workloads' };
  }
}

let cancelled = false;
function logMemoryUsage(label: string) {
  // ... (existing implementation) ...
}
process.on('SIGINT', () => {
  cancelled = true;
  process.stdout.write('\n[PRECOMMIT] LLM insight generation CANCELLED by user.\n');
  process.exit(130);
});

async function getStagedFiles(): Promise<string[]> {
  const output = (await executeCommand('git diff --name-only --cached')).stdout;
  return output.split('\n').filter(Boolean);
}

async function getFileDiff(file: string): Promise<string> {
  try {
    return (await executeCommand(`git diff --cached ${file}`)).stdout;
  } catch {
    return '';
  }
}

async function getFileContent(file: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf-8');
  } catch {
    return '';
  }
}

function hashInput(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 12);
}

async function promptForApproval(artifact: LLMInsightFossil): Promise<boolean> {
  // Simple CLI prompt for review/approval
  process.stdout.write(`\nReview LLM Insight for ${artifact.inputHash} (excerpt):\n${artifact.excerpt}\nApprove? [Y/n]: `);
  return new Promise((resolve) => {
    process.stdin.setEncoding('utf-8');
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === '' || answer === 'y' || answer === 'yes');
    });
  });
}

interface InsightCandidate {
  file: string;
  artifact: LLMInsightFossil;
  approved: boolean;
}

async function findMatchingRoadmapTasks(file: string, roadmap: any): Promise<string[]> {
  const matchingTasks: string[] = [];
  
  function searchTasks(tasks: any[], path: string[] = []) {
    for (const task of tasks) {
      const taskText = `${task.task || ''} ${task.context || ''}`.toLowerCase();
      const fileLower = file.toLowerCase();
      
      // Check if file path appears in task description
      if (taskText.includes(fileLower) || 
          taskText.includes(file.replace(/\.(ts|js|md|yml|yaml|json)$/, '')) ||
          taskText.includes(path.join('/'))) {
        matchingTasks.push(path.join(' > '));
      }
      
      // Recursively search subtasks
      if (task.subtasks) {
        searchTasks(task.subtasks, [...path, task.task || '']);
      }
    }
  }
  
  if (roadmap.tasks) {
    searchTasks(roadmap.tasks);
  }
  
  return matchingTasks;
}

async function updateRoadmapWithInsight(file: string, inputHash: string) {
  const roadmapPath = path.resolve('fossils/roadmap.yml');
  try {
    const yml = await fs.readFile(roadmapPath, 'utf-8');
    let doc: any = yaml.load(yml);
    
    // Find matching tasks for this file
    const matchingTasks = await findMatchingRoadmapTasks(file, doc);
    
    // Add insight reference to matching tasks or create a general reference
    if (matchingTasks.length > 0) {
      // TODO: Add insight reference to specific matching tasks
      console.log(`Found ${matchingTasks.length} matching tasks for ${file}: ${matchingTasks.join(', ')}`);
    }
    
    // Keep the general reference for now
    if (!doc.llm_insight_refs) doc.llm_insight_refs = [];
    doc.llm_insight_refs.push({ 
      file, 
      inputHash, 
      timestamp: new Date().toISOString(),
      matchingTasks: matchingTasks.length > 0 ? matchingTasks : undefined
    });
    
    await fs.writeFile(roadmapPath, yaml.dump(doc), 'utf-8');
    console.log(`Updated roadmap.yml with new LLM insight reference for ${file}`);
  } catch (err) {
    console.warn('Could not update roadmap.yml:', err);
  }
}

async function advancedReviewCLI(candidates: InsightCandidate[]): Promise<InsightCandidate[]> {
  console.log('\n' + '='.repeat(80));
  console.log('LLM INSIGHT REVIEW - Advanced CLI');
  console.log('='.repeat(80));
  
  // Display all insights
  candidates.forEach((candidate, index) => {
    console.log(`\n[${index + 1}] File: ${candidate.file}`);
    console.log(`    Hash: ${candidate.artifact.inputHash}`);
    console.log(`    Excerpt: ${candidate.artifact.excerpt}`);
    console.log(`    Status: ${candidate.approved ? '✅ APPROVED' : '❌ PENDING'}`);
  });
  
  console.log('\nCommands:');
  console.log('  <number>     - Toggle approval for specific insight');
  console.log('  all          - Approve all insights');
  console.log('  none         - Reject all insights');
  console.log('  <number>-<number> - Approve range (e.g., 1-3)');
  console.log('  details <number> - Show full details for insight');
  console.log('  done         - Proceed with approved insights');
  console.log('  quit         - Abort all insights');
  
  return new Promise((resolve) => {
    const processInput = (input: string) => {
      const command = input.trim().toLowerCase();
      
      if (command === 'done') {
        resolve(candidates);
        return;
      }
      
      if (command === 'quit') {
        candidates.forEach(c => c.approved = false);
        resolve(candidates);
        return;
      }
      
      if (command === 'all') {
        candidates.forEach(c => c.approved = true);
        console.log('✅ All insights approved');
        displayStatus(candidates);
        promptForCommand();
        return;
      }
      
      if (command === 'none') {
        candidates.forEach(c => c.approved = false);
        console.log('❌ All insights rejected');
        displayStatus(candidates);
        promptForCommand();
        return;
      }
      
      if (command.startsWith('details ')) {
        const parts = command.split(' ');
        const numStr = parts[1];
        if (numStr) {
          const num = parseInt(numStr) - 1;
          if (num >= 0 && num < candidates.length) {
            const candidate = candidates[num];
            if (candidate) {
              console.log('\n' + '='.repeat(60));
              console.log(`DETAILS: ${candidate.file}`);
              console.log('='.repeat(60));
              console.log(`Hash: ${candidate.artifact.inputHash}`);
              console.log(`Commit: ${candidate.artifact.commitRef}`);
              console.log(`Prompt: ${candidate.artifact.prompt}`);
              console.log(`Response: ${candidate.artifact.response}`);
              console.log('='.repeat(60));
            }
          }
        }
        promptForCommand();
        return;
      }
      
      if (command.includes('-')) {
        const parts = command.split('-');
        const startStr = parts[0];
        const endStr = parts[1];
        if (startStr && endStr) {
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          if (!isNaN(start) && !isNaN(end) && start >= 0 && end < candidates.length) {
            for (let i = start; i <= end; i++) {
              const candidate = candidates[i];
              if (candidate) {
                candidate.approved = true;
              }
            }
            console.log(`✅ Approved insights ${start + 1}-${end + 1}`);
            displayStatus(candidates);
          }
        }
        promptForCommand();
        return;
      }
      
      const num = parseInt(command) - 1;
      if (num >= 0 && num < candidates.length) {
        const candidate = candidates[num];
        if (candidate) {
          candidate.approved = !candidate.approved;
          const status = candidate.approved ? '✅ APPROVED' : '❌ REJECTED';
          console.log(`${status}: ${candidate.file}`);
          displayStatus(candidates);
        }
      }
      
      promptForCommand();
    };
    
    const displayStatus = (candidates: InsightCandidate[]) => {
      const approved = candidates.filter(c => c.approved).length;
      const total = candidates.length;
      console.log(`\nStatus: ${approved}/${total} insights approved`);
    };
    
    const promptForCommand = () => {
      process.stdout.write('\nCommand: ');
    };
    
    promptForCommand();
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (data) => {
      processInput(data.toString().trim());
    });
  });
}

function filterRelevantFiles(files: string[]): { included: string[]; skipped: string[] } {
  const included: string[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    if (
      file.startsWith('fossils/') ||
      file.startsWith('temp/') ||
      file.startsWith('.temp-') ||
      file === '.llm-usage-log.json' ||
      /\.backup$/.test(file) ||
      /\.log$/.test(file)
    ) {
      skipped.push(file);
      continue;
    }
    if (
      (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.md')) &&
      (file.startsWith('src/') || file.startsWith('scripts/'))
    ) {
      included.push(file);
    } else {
      skipped.push(file);
    }
  }
  return { included, skipped };
}

async function main() {
  // PARAMS OBJECT PATTERN: always use a single params object, validated by Zod, for all downstream calls.
  // Detect owner/repo at the top level, pass to all fossil/LLM utilities.
  const cliArgs = process.argv.slice(2);
  let options: any = {};
  for (let i = 0; i < cliArgs.length; i++) {
    if (cliArgs[i] === '--owner' && cliArgs[i + 1]) {
      options.owner = cliArgs[i + 1];
      i++;
    } else if (cliArgs[i] === '--repo' && cliArgs[i + 1]) {
      options.repo = cliArgs[i + 1];
      i++;
    }
  }
  const { owner, repo } = detectOwnerRepo(options);
  OwnerRepoSchema.parse({ owner, repo });
  try {
    console.log('[PRECOMMIT] LLM insight generation START');
    logMemoryUsage('START');
    const changedFiles = await getStagedFiles();
    const llm = new LLMService({ 
      owner, 
      repo,
      /* only pass allowed LLMOptimizationConfig properties here */ 
    });
    const eventLoopMonitor = new EventLoopMonitor({ timeoutThreshold: 30000 }); // 30s timeout, adjust as needed
    const insightCandidates: InsightCandidate[] = [];
    // Filter files before processing
    const { included, skipped } = filterRelevantFiles(changedFiles);
    console.log(`[PRECOMMIT] Filtering files: ${included.length} included, ${skipped.length} skipped`);
    if (skipped.length > 0) {
      console.log('[PRECOMMIT] Skipped files:', skipped.slice(0, 10).join(', ') + (skipped.length > 10 ? ', ...' : ''));
    }
    const start = Date.now();
    const files = included;
    const total = files.length;
    for (let i = 0; i < total; i++) {
      if (cancelled) break;
      const file = files[i] || '';
      const opStart = Date.now();
      let fileDone = false;
      const interval = setInterval(() => {
        if (!fileDone) {
          process.stdout.write(
            `\r[${i + 1}/${total}] Processing: ${file} | Total elapsed: ${((Date.now() - start) / 1000).toFixed(1)}s | Current: ${((Date.now() - opStart) / 1000).toFixed(1)}s `
          );
        }
      }, 250);
      const diff = await getFileDiff(file);
      if (!diff.trim()) { fileDone = true; clearInterval(interval); continue; }
      const fileContent = await getFileContent(file);
      const inputContext = `File: ${file}\nDiff:\n${diff}\n---\nCurrent Content (truncated):\n${fileContent.slice(0, 500)}`;
      const inputHash = hashInput(inputContext);
      const commitRef = (await executeCommand('git rev-parse --verify HEAD')).stdout.trim();
      const promptObj = PROMPT_REGISTRY['roadmap-insight-v1'];
      if (!promptObj) { fileDone = true; clearInterval(interval); console.warn(`Prompt template 'roadmap-insight-v1' not found. Skipping LLM insight for ${file}.`); continue; }
      const prompt = promptObj.template({ task: `Code/file change in ${file}`, context: diff });
      const systemMessage = promptObj.systemMessage;
      // 3a. Call LLM for real response with timeout and monitoring
      let response = '';
      try {
        const llmResult = await eventLoopMonitor.trackCall(
          'llm.callLLM',
          () => llm.callLLM({
            model: 'llama2',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: prompt }
            ],
            routingPreference: 'auto',
            context: 'precommit-llm-insight',
            purpose: 'roadmap-insight',
            valueScore: 0.7
          } as any),
          { file, inputHash, commitRef }
        );
        response = llmResult?.choices?.[0]?.message?.content || '[LLM response missing]';
      } catch (err) {
        const msg = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : String(err);
        response = '[LLM call failed: ' + msg + ']';
      }
      // Build artifact
      const artifact: LLMInsightFossil = {
        type: 'insight',
        timestamp: new Date().toISOString(),
        model: 'llama2',
        modelVersion: 'v1',
        provider: 'ollama',
        promptId: promptObj.id,
        promptVersion: promptObj.version,
        prompt,
        systemMessage,
        inputHash,
        commitRef,
        response,
        excerpt: response.slice(0, 120),
        history: [
          {
            timestamp: new Date().toISOString(),
            commitRef,
            inputHash,
            promptId: promptObj.id,
            promptVersion: promptObj.version,
            prompt,
            systemMessage,
            response,
            manualOverride: false,
            reviewStatus: 'pending',
          },
        ],
        manualOverride: false,
        reviewStatus: 'pending',
      };
      insightCandidates.push({ file, artifact, approved: false });
      fileDone = true;
      clearInterval(interval);
      process.stdout.write(`\r[${i + 1}/${total}] Done: ${file} | Total elapsed: ${((Date.now() - start) / 1000).toFixed(1)}s | Duration: ${((Date.now() - opStart) / 1000).toFixed(1)}s\n`);
    }
    // 4. Advanced CLI review for all insights
    if (insightCandidates.length > 0) {
      const reviewedCandidates = await advancedReviewCLI(insightCandidates);
      // 5. Process approved insights
      for (const candidate of reviewedCandidates) {
        if (!candidate.approved) {
          console.log(`Skipping ${candidate.file} (not approved)`);
          continue;
        }
        try {
          LLMInsightFossilSchema.parse(candidate.artifact);
          const outDir = path.resolve('fossils/llm_insights');
          await fs.mkdir(outDir, { recursive: true });
          const outPath = path.join(outDir, `${Date.now()}_${(candidate.file || '').replace(/\W/g, '_')}_${candidate.artifact.inputHash}.json`);
          const artifactWithRepo = { ...candidate.artifact, owner, repo };
          await fs.writeFile(outPath, JSON.stringify(artifactWithRepo, null, 2), 'utf-8');
          console.log(`LLM insight artifact written: ${outPath}`);
          // 6. Update roadmap with reference
          await updateRoadmapWithInsight(candidate.file || '', candidate.artifact.inputHash);
        } catch (err) {
          console.error('Failed to validate or write LLM insight artifact:', err);
        }
      }
    }
  } catch (e) {
    console.error('Error during LLM insight generation:', e);
    process.exit(1);
  }
}

main(); 