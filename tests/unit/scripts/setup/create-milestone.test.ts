import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/setup/create-milestone.sh", "create-milestone.sh Test");

test("create-milestone.sh is executable", async () => {
  await tester.isExecutable();
});

test("create-milestone.sh shows usage with missing args", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Usage: ", "<owner> <repo> <title> <description> <due_on>"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});

test("create-milestone.sh outputs milestone creation info with dummy args", async () => {
  await tester.realMode({
    args: ["owner", "repo", "title", "desc", "2025-07-01T23:59:59Z"],
    expectedOutput: ["Creating milestone: title"],
    timeoutMs: 10000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});
