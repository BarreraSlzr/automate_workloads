import { test } from 'bun:test';
import { ScriptTester } from '../base-tester.ts';
const tester = new ScriptTester("./scripts/monitoring/quick-status.sh", "monitoring/quick-status.sh Integration Test");

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
test("[integration] quick-status.sh outputs quick status info with dummy args", async () => {
  await tester.realMode({
    args: ["owner", "repo"],
    expectedOutput: ["Quick Status Check for owner/repo"],
    timeoutMs: 20000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
}); 