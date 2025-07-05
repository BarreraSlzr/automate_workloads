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

import { execSync } from 'child_process';

function runStep(description: string, command: string, options: { optional?: boolean } = {}) {
  console.log(`\n🔹 ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} succeeded`);
    return true;
  } catch (e) {
    console.error(`❌ ${description} failed`);
    if (!options.optional) process.exit(1);
    return false;
  }
}

// 1. Update evolving footprint
runStep('Updating evolving footprint', 'bun run footprint:evolving --update true');

// 2. TypeScript type check
runStep('TypeScript type check', 'bun run tsc --noEmit');

// 3. Schema and pattern validation
runStep('Schema and pattern validation', 'bun run validate:pre-commit');

// 4. LLM insight generation (optional, skip if not configured)
runStep('LLM insight generation (optional)', 'bun run scripts/precommit-llm-insight.ts', { optional: true });

// 5. Commit message validation
runStep('Commit message validation', 'bun run scripts/commit-message-validator.ts --pre-commit --strict');

console.log('\n🎉 All pre-commit checks passed!');
process.exit(0); 