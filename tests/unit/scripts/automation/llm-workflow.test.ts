import { test, expect } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/llm-workflow.sh", "LLM Workflow Script Test");

test("llm-workflow.sh is executable", async () => {
  await tester.isExecutable();
});

test("llm-workflow.sh requires arguments", async () => {
  // Test that the script fails gracefully when no arguments are provided
  const result = await Bun.spawn(["./scripts/automation/llm-workflow.sh"], {
    cwd: process.cwd(),
    env: { ...process.env, SKIP_BUN_TEST: "1" },
  });
  
  const exitCode = await result.exited;
  expect(exitCode).not.toBe(0); // Should fail without arguments
}); 