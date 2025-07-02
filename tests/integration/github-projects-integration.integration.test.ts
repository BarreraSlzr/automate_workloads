import { test, expect } from 'bun:test';
import { runScript } from '../integration-base-tester';

test('github-projects-integration.sh outputs expected log for dummy repo', () => {
  const { stdout, stderr, exitCode } = runScript(
    './scripts/automation/github-projects-integration.sh',
    ['-p', '123', 'owner', 'repo'],
    { requiredCmds: ['gh', 'bun', 'jq'] }
  );

  if (exitCode === 127) {
    console.warn('Skipping test:', stderr);
    return;
  }

  if (exitCode !== 0) {
    console.error('Script failed. STDOUT:', stdout);
    console.error('STDERR:', stderr);
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain('GitHub Projects Integration');
  expect(stdout).toContain('Repository: owner/repo');
  expect(stdout).toContain('Project ID: 123');
  // ...add more as needed
}, 20000); // 20s timeout 