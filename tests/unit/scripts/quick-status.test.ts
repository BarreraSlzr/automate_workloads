import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/quick-status.sh", "quick-status.sh Test");

test("quick-status.sh is executable", async () => {
  await tester.isExecutable();
});

test("quick-status.sh shows usage with missing args", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Usage: ", "<owner> <repo>"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});
