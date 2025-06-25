import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/monitor-progress.sh", "monitor-progress.sh Test");

test("monitor-progress.sh is executable", async () => {
  await tester.isExecutable();
});

test("monitor-progress.sh shows usage with missing args", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Usage: ", "<owner> <repo>"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
