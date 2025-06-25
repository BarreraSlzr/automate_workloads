import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/review-workflow.sh", "Review Workflow Script Test");

test("review-workflow.sh is executable", async () => {
  await tester.isExecutable();
});

test("review-workflow.sh outputs review info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["review", "workflow"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("review-workflow.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 