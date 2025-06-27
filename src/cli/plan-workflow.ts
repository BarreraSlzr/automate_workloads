#!/usr/bin/env bun

/**
 * plan-workflow.ts
 *
 * Orchestrates the workflow: reads GitHub issues, summarizes them, plans with LLM, and updates issues.
 * Usage:
 *   bun run src/cli/plan-workflow.ts [options]
 *
 * This script is designed to be run locally or in CI (e.g., GitHub Actions).
 *
 * Steps:
 *   1. Reads open GitHub issues (using src/cli/github-issues.ts logic)
 *   2. Summarizes issues and sends to LLM planner (src/cli/llm-plan.ts logic)
 *   3. Outputs plan as JSON (required for update:checklist)
 *   4. Optionally calls update:checklist to update issues
 *
 * Requirements:
 *   - OPENAI_API_KEY must be set in the environment
 *   - GitHub token must be available for issue updates
 *
 * Example:
 *   bun run src/cli/plan-workflow.ts --update
 */

import { Command } from 'commander';
import { execSync } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import type { Issue, Plan, PerIssuePlanOutput } from '../types/plan-workflow.js';

const program = new Command();

program
  .option('--update', 'Update issues with the generated plan')
  .option('--output <file>', 'Output plan JSON to file', 'llm-plan-output.json')
  .option('--per-issue', 'Generate checklists and a next-steps plan per issue (default: true)', true)
  .parse(process.argv);

const options = program.opts();

function readIssues(): Issue[] {
  // Use the issues script alias to get issues as JSON
  try {
    const issuesJson = execSync('bun run issues --json', { encoding: 'utf-8', env: { ...process.env } });
    return JSON.parse(issuesJson);
  } catch (e) {
    console.error('Failed to read issues as JSON. Ensure the issues script supports --json.');
    process.exit(1);
  }
}

function summarizeIssues(issues: Issue[]): string {
  // Simple summary: concatenate titles and bodies
  return issues.map(i => `#${i.number}: ${i.title}\n${i.body || ''}`).join('\n---\n');
}

function planWithLLM(summary: string, context?: any): Plan {
  // Call llm:plan decompose with the summary as the goal and context
  try {
    let contextArg = '';
    if (context) {
      contextArg = ` --context '${JSON.stringify(context)}'`;
    }
    const planJson = execSync(`bun run llm:plan decompose "${summary.replace(/"/g, '\"')}"${contextArg} --json`, { encoding: 'utf-8' });
    return JSON.parse(planJson);
  } catch (e) {
    console.error('Failed to generate plan with LLM.');
    process.exit(1);
  }
}

function outputPlan(plan: Plan, file: string): void {
  fs.writeFileSync(file, JSON.stringify(plan, null, 2));
  console.log(`Plan written to ${file}`);
}

function updateIssuesWithPlan(file: string): void {
  // Call update:checklist with the plan file using the script alias
  try {
    execSync(`bun run update:checklist ${file}`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to update issues with checklist.');
    process.exit(1);
  }
}

async function runPerIssueWorkflow() {
  const issues = readIssues();
  const perIssueChecklists: Record<string, string> = {};
  for (const issue of issues) {
    const plan = planWithLLM(issue.title, { body: issue.body });
    if (plan && plan.tasks && plan.tasks[0] && typeof plan.tasks[0].description === 'string') {
      perIssueChecklists[issue.number] = plan.tasks[0].description;
    }
  }
  // Aggregate all checklists into context
  const context = { checklists: perIssueChecklists };
  // Generate a next-steps plan for the project
  const nextStepsPrompt = 'Given the following checklists for all open issues, generate a concise, actionable next-steps plan for the project. Output in Markdown checklist format.';
  const nextStepsPlan = planWithLLM(nextStepsPrompt, context);
  const nextStepsMarkdown = (nextStepsPlan && nextStepsPlan.tasks && nextStepsPlan.tasks[0] && typeof nextStepsPlan.tasks[0].description === 'string') ? nextStepsPlan.tasks[0].description : '';
  // Output both per-issue checklists and the global plan
  // Fix: outputPlan expects a Plan, not PerIssuePlanOutput. Write to file directly here.
  const output: PerIssuePlanOutput = {
    perIssueChecklists,
    nextStepsPlan: nextStepsMarkdown
  };
  fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
  console.log(`Plan written to ${options.output}`);
  if (options.update) {
    // Optionally update each issue with its checklist
    for (const issueNumber in perIssueChecklists) {
      const checklist = perIssueChecklists[issueNumber];
      if (typeof checklist === 'string') {
        // Here, updateIssuesWithPlan expects a file, but we have a checklist string.
        // If you want to update issues with the output file, use options.output.
        // If you want to update each issue with its checklist, you need to write each checklist to a temp file or refactor updateIssuesWithPlan.
        // For now, update with the output file (which contains all checklists).
        updateIssuesWithPlan(options.output);
        break; // Only need to call once for the output file
      }
    }
  }
}

function main() {
  if (options.perIssue) {
    runPerIssueWorkflow();
  } else {
    // Fallback to old behavior
    const issues = readIssues();
    const summary = summarizeIssues(issues);
    const plan = planWithLLM(summary);
    outputPlan(plan, options.output);
    if (options.update) {
      updateIssuesWithPlan(options.output);
    }
  }
}

// ESM-compatible entry-point check
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse(process.argv);
  main();
}

export { readIssues, summarizeIssues, planWithLLM, outputPlan, updateIssuesWithPlan }; 