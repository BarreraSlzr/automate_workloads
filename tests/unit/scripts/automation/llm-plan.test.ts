import { test, expect } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("src/cli/llm-plan.ts", "LLM Plan CLI Test");

test("llm:plan review-comments outputs review comments JSON", async () => {
  const { output, exitCode } = await tester.realMode({
    args: ["review-comments", "123"],
    expectedExitCode: 0,
    normalize: o => o.trim(),
  });
  expect(output).toContain('"pr": "123"');
  expect(output).toContain('"comments"');
  expect(output).toContain('"summary"');
}); 