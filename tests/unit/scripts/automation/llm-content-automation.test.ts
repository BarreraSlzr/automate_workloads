import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/llm-content-automation.sh", "LLM Content Automation Script Test");

test("llm-content-automation.sh is executable", async () => {
  await tester.isExecutable();
});

test("llm-content-automation.sh outputs content automation info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["content", "automation"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("llm-content-automation.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 