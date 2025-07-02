import { test, expect, mock } from 'bun:test';
import { runScript } from '../integration-base-tester';

// Mock GitHub CLI for testing
const originalExecSync = require('child_process').execSync;
require('child_process').execSync = mock(() => {
  return 'Issue #123 created successfully';
});

test('GitHub fossil automation dry-run mode', async () => {
  const { stdout, exitCode } = runScript(
    'bun',
    ['run', 'scripts/automate-github-fossils.ts', '--dry-run'],
    { requiredCmds: ['bun'] }
  );

  if (exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain('Dry run: Yes');
  expect(stdout).toContain('would create:');
  expect(stdout).toContain('Issue:');
});

test('GitHub fossil automation test mode', async () => {
  const { stdout, exitCode } = runScript(
    'bun',
    ['run', 'scripts/automate-github-fossils.ts', '--test'],
    { requiredCmds: ['bun'] }
  );

  if (exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain('Test mode: Using test repository');
  expect(stdout).toContain('Starting GitHub fossil automation');
});

test('GitHub fossil automation creates fossil collection', async () => {
  const { stdout, exitCode } = runScript(
    'bun',
    ['run', 'scripts/automate-github-fossils.ts'],
    { requiredCmds: ['bun'] }
  );

  if (exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain('Created');
  expect(stdout).toContain('fossil collection');
  expect(stdout).toContain('Summary:');
});

// Restore original execSync
require('child_process').execSync = originalExecSync; 