#!/usr/bin/env bun

/**
 * Unified Pre-commit Script
 * - Updates evolving footprint
 * - Runs type and schema validation
 * - Runs LLM insight generation (optional)
 * - Validates commit message
 * - Exits nonzero on any failure
 *
 * Usage: bun run scripts/precommit-unified.ts
 */

import { executeCommand } from '@/utils/cli';

// PARAMS OBJECT PATTERN: All scripts must detect owner/repo at the top level, validate with Zod, and pass as part of a params object to all downstream calls. No loose or positional owner/repo arguments.
import { getCurrentRepoOwner, getCurrentRepoName } from '../src/utils/cli';
import { z } from 'zod';
import { OwnerRepoSchema } from '../src/types/schemas';

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

const { owner, repo } = detectOwnerRepo();
OwnerRepoSchema.parse({ owner, repo });

async function runStep(params: { description: string, command: string, options?: { optional?: boolean } }) {
  const { description, command, options = {} } = params;
  console.log(`\n🔹 ${description}`);
  try {
    const result = await executeCommand(command);
    if (result.success) {
      console.log(`✅ ${description} succeeded`);
      return true;
    } else {
      console.error(`❌ ${description} failed: ${result.stderr}`);
      if (!options.optional) process.exit(1);
      return false;
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(`❌ ${description} failed: ${e.message}`);
    } else {
      console.error(`❌ ${description} failed:`, e);
    }
    if (!options.optional) process.exit(1);
    return false;
  }
}

// 1. Update evolving footprint
await runStep({ description: 'Updating evolving footprint', command: `bun run footprint:evolving --update true --owner ${owner} --repo ${repo}` });

// 2. TypeScript type check
await runStep({ description: 'TypeScript type check', command: 'bun run tsc --noEmit' });

// 3. Schema and pattern validation
await runStep({ description: 'Schema and pattern validation', command: `bun run validate:pre-commit --owner ${owner} --repo ${repo}` });

// 4. LLM insight generation (optional, skip if not configured)
await runStep({ description: 'LLM insight generation (optional)', command: `bun run scripts/precommit-llm-insight.ts --owner ${owner} --repo ${repo}`, options: { optional: true } });

// 5. Commit message validation
await runStep({ description: 'Commit message validation', command: `bun run scripts/commit-message-validator.ts --pre-commit --strict --owner ${owner} --repo ${repo}` });

console.log('\n🎉 All pre-commit checks passed!');
process.exit(0); 