import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/llm-issue-manager.sh", "LLM Issue Manager Test");

test("llm-issue-manager.sh is executable", async () => {
  await tester.isExecutable();
});

test("llm-issue-manager.sh shows available actions on unknown action", async () => {
  await tester.realMode({
    args: ["--help"],
    expectedOutput: ["Available actions:"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 