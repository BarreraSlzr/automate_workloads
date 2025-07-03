import { test, expect, mock } from 'bun:test';
import { runScript } from '../integration-base-tester';

// Mock GitHub CLI for testing
const originalExecSync = require('child_process').execSync;
require('child_process').execSync = mock(() => {
  return 'Issue #123 created successfully';
});

const CLI_PATH = 'src/cli/automate-github-fossils.ts';

function expectExitCodeAndOutput({ stdout, exitCode }: { stdout: string; exitCode: number | null }, expectedExit = 0, expectedStrings: string[] = []) {
  expect(exitCode).toBe(expectedExit);
  for (const str of expectedStrings) {
    expect(stdout).toContain(str);
  }
}

test('GitHub fossil automation dry-run mode', async () => {
  const result = runScript(
    'bun',
    ['run', CLI_PATH, 'create', '--owner', 'barreraslzr', '--repo', 'automate_workloads', '--roadmap', 'fossils/roadmap.yml', '--dry-run'],
    { requiredCmds: ['bun'] }
  );

  if (result.exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expectExitCodeAndOutput(result, 0, [
    'Dry run',
    'would create:',
    'Issue:'
  ]);
});

test('GitHub fossil automation test mode', async () => {
  const result = runScript(
    'bun',
    ['run', CLI_PATH, 'create', '--owner', 'barreraslzr', '--repo', 'automate_workloads', '--roadmap', 'fossils/roadmap.yml', '--test'],
    { requiredCmds: ['bun'] }
  );

  if (result.exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expectExitCodeAndOutput(result, 0, [
    'Test mode',
    'Starting GitHub fossil automation'
  ]);
});

test('GitHub fossil automation creates fossil collection', async () => {
  const result = runScript(
    'bun',
    ['run', CLI_PATH, 'create', '--owner', 'barreraslzr', '--repo', 'automate_workloads', '--roadmap', 'fossils/roadmap.yml'],
    { requiredCmds: ['bun'] }
  );

  if (result.exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expectExitCodeAndOutput(result, 0, [
    'Created',
    'fossil collection',
    'Summary:'
  ]);
});

// Restore original execSync
require('child_process').execSync = originalExecSync; 