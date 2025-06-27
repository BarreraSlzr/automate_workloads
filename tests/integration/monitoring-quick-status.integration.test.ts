import { test, expect } from 'bun:test';
import { runScript } from '../integration-base-tester';

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
test('monitoring/quick-status.sh outputs expected log for dummy repo', () => {
  const { stdout, stderr, exitCode } = runScript(
    './scripts/monitoring/quick-status.sh',
    ['owner', 'repo'],
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
  expect(stdout).toContain('Quick Status Check for owner/repo');
  expect(stdout).toContain('Checking dependencies');
  // ...add more as needed
}, 20000); // 20s timeout 