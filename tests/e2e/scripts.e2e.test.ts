import { test, expect } from 'bun:test';
import { runCommand } from './utils';

const SCRIPT_TEST_CASES = [
  {
    name: 'update-project-status script runs and outputs YAML',
    command: ['bun', 'run', 'scripts/update-project-status.ts'],
    expectedOutput: ['project_status:', 'modules:'],
    expectedExitCode: 0,
    description: 'Should generate project_status.yml output'
  },
  {
    name: 'cleanup-fossils script runs and outputs cleanup summary',
    command: ['bun', 'run', 'scripts/cleanup-fossils.ts'],
    expectedOutput: ['Cleanup', 'fossil', 'summary'],
    expectedExitCode: 0,
    description: 'Should clean up fossil files and print a summary'
  },
  {
    name: 'cleanup-test-fossils script runs and outputs cleanup summary',
    command: ['bun', 'run', 'scripts/cleanup-test-fossils.ts'],
    expectedOutput: ['Cleanup', 'test', 'fossil'],
    expectedExitCode: 0,
    description: 'Should clean up test fossil files and print a summary'
  },
  {
    name: 'fossil-summary-json script runs and outputs JSON',
    command: ['bun', 'run', 'scripts/fossil-summary-json.ts'],
    expectedOutput: ['{', '}'],
    expectedExitCode: 0,
    description: 'Should output a JSON summary of fossils'
  },
  {
    name: 'fossil-summary-md script runs and outputs Markdown',
    command: ['bun', 'run', 'scripts/fossil-summary-md.ts'],
    expectedOutput: ['#', 'Fossil', 'Summary'],
    expectedExitCode: 0,
    description: 'Should output a Markdown summary of fossils'
  },
  {
    name: 'update-issue-checklist script runs and outputs update info',
    command: ['bun', 'run', 'scripts/update-issue-checklist.ts'],
    expectedOutput: ['Update', 'checklist'],
    expectedExitCode: 0,
    description: 'Should update issue checklists and print update info'
  },
  {
    name: 'update-checklist-demo script runs and outputs demo info',
    command: ['bun', 'run', 'scripts/update-checklist-demo.ts'],
    expectedOutput: ['Demo', 'checklist', 'update'],
    expectedExitCode: 0,
    description: 'Should run the checklist update demo and print info'
  },
  {
    name: 'migrate-legacy-issues script runs and outputs migration info',
    command: ['bun', 'run', 'scripts/migrate-legacy-issues.ts'],
    expectedOutput: ['Migrate', 'legacy', 'issue'],
    expectedExitCode: 0,
    description: 'Should migrate legacy issues and print migration info'
  },
  // Add more script test cases here as needed
];

for (const testCase of SCRIPT_TEST_CASES) {
  test(testCase.name, async () => {
    const result = await runCommand(testCase.command);
    for (const expected of testCase.expectedOutput) {
      expect(result.stdout + result.stderr).toContain(expected);
    }
    expect(result.exitCode).toBe(testCase.expectedExitCode);
  });
} 