import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/repo-orchestrator.sh", "Repo Orchestrator Script Test");

test("repo-orchestrator.sh is executable", async () => {
  await tester.isExecutable();
});

test("repo-orchestrator.sh outputs orchestrator info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["orchestrator"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("repo-orchestrator.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: ["orchestrator"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 