import { test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";

test("plan-workflow CLI runs and outputs plan", () => {
  const outputFile = "tmp-plan.json";
  const result = spawnSync("bun", ["src/cli/plan-workflow.ts", "--output", outputFile], {
    encoding: "utf-8",
    env: { ...process.env, E2E_TEST: "1", OPENAI_API_KEY: "test" }
  });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("Plan written to");
  expect(existsSync(outputFile)).toBe(true);
  const output = JSON.parse(readFileSync(outputFile, "utf-8"));
  expect(output).toHaveProperty("perIssueChecklists");
  expect(output).toHaveProperty("nextStepsPlan");
  unlinkSync(outputFile);
});

// Note: We do not integration-test the scenario where OPENAI_API_KEY is missing,
// because Bun always loads .env automatically in all real usage and CI.
// This scenario is fully covered by unit tests for the config loader.
// Integration tests focus on real-world, supported usage. 