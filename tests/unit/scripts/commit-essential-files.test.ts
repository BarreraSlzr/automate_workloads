import { test } from "bun:test";
import { ScriptTester } from "../../base-tester";

const tester = new ScriptTester("./scripts/commit-essential-files.sh", "commit-essential-files.sh Test");

test("commit-essential-files.sh is executable", async () => {
  await tester.isExecutable();
});

test("commit-essential-files.sh runs without args", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Committing essential files", "Usage:"],
    expectedExitCode: 0,
    timeoutMs: 10000,
  });
});
