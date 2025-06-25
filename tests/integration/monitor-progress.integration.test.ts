import { test } from 'bun:test';
import { ScriptTester } from '../base-tester.ts';
const tester = new ScriptTester("./scripts/monitor-progress.sh", "monitor-progress.sh Integration Test");

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
test("[integration] monitor-progress.sh outputs progress info with dummy args", async () => {
  await tester.realMode({
    args: ["owner", "repo"],
    expectedOutput: ["progress", "monitor"],
    timeoutMs: 20000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
}); 