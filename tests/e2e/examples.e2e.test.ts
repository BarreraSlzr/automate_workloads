import { test, expect } from 'bun:test';
import { runCommand } from './utils';

const EXAMPLE_TEST_CASES = [
  {
    name: 'cli-usage-demo runs and outputs summary',
    command: ['bun', 'run', 'examples/cli-usage-demo.ts'],
    expectedOutput: ['CLI Usage Demo', '📊 Demo Summary:'],
    expectedExitCode: 0
  },
  {
    name: 'curate-fossil-demo runs and outputs curation',
    command: ['bun', 'run', 'examples/curate-fossil-demo.ts'],
    expectedOutput: ['Curating', 'Curated fossil saved at:'],
    expectedExitCode: 0
  }
];

for (const testCase of EXAMPLE_TEST_CASES) {
  test(testCase.name, async () => {
    const result = await runCommand(testCase.command);
    for (const expected of testCase.expectedOutput) {
      expect(result.stdout + result.stderr).toContain(expected);
    }
    expect(result.exitCode).toBe(testCase.expectedExitCode);
  }, 15000);
} 