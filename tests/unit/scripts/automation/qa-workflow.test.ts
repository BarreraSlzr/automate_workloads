import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/qa-workflow.sh", "QA Workflow Script Test");

test("qa-workflow.sh is executable", async () => {
  await tester.isExecutable();
});

test("qa-workflow.sh runs without recursion", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["✅ QA workflow completed"],
    timeoutMs: 10000,
    normalize: output => output.trim(),
  });
}); 