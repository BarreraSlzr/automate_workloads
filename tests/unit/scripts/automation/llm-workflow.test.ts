import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/llm-workflow.sh", "LLM Workflow Script Test");

test("llm-workflow.sh is executable", async () => {
  await tester.isExecutable();
});

test("llm-workflow.sh outputs workflow info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["workflow", "✅ LLM workflow completed successfully"],
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("llm-workflow.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 