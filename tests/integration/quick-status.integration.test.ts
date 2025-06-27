import { test, expect } from 'bun:test';
import { runScript } from '../integration-base-tester';

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
test('quick-status.sh outputs expected log for dummy repo', () => {
  const { stdout, stderr, exitCode } = runScript(
    './scripts/quick-status.sh',
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
  // Optionally check for health/plan/automation warnings if dummy repo
  // expect(stdout).toContain('Could not analyze health');
}, 20000); // 20s timeout

// Optionally, you can add more tests here
// test('quick-status.sh outputs expected log for another repo', () => {
//   const { stdout, exitCode } = runScript('./scripts/quick-status.sh', ['another-owner', 'another-repo']);
//   expect(exitCode).toBe(0);
//   expect(stdout).toContain('Quick Status Check for another-owner/another-repo');
//   expect(stdout).toContain('Checking dependencies');
//   // Optionally check for health/plan/automation warnings if another repo
//   // expect(stdout).toContain('Could not analyze health');
// }); 