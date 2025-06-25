import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/github-projects-integration.sh", "GitHub Projects Integration Script Test");

test("github-projects-integration.sh is executable", async () => {
  await tester.isExecutable();
});

test("github-projects-integration.sh outputs integration info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["github", "project", "integration"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("github-projects-integration.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 