import { test, expect } from "bun:test";
import { spawnSync } from "child_process";
import fs from "fs";

const OUTPUT_FILE = "llm-plan-output.json";

test("plan-workflow CLI E2E mode produces expected output file", () => {
  // Clean up any previous output
  if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);

  // Run the CLI with E2E_TEST=1
  const result = spawnSync(
    "bun",
    ["run", "src/cli/plan-workflow.ts", "--output", OUTPUT_FILE],
    {
      env: { 
        ...process.env, 
        E2E_TEST: "1", 
        OPENAI_API_KEY: "dummy-key",
        GMAIL_TOKEN: "dummy-gmail-token",
        BUFFER_TOKEN: "dummy-buffer-token", 
        TWITTER_BEARER_TOKEN: "dummy-twitter-token"
      },
      encoding: "utf-8",
    }
  );

  if (result.status !== 0) {
    console.error("STDOUT:", result.stdout);
    console.error("STDERR:", result.stderr);
  }
  expect(result.status).toBe(0);
  expect(result.stdout + result.stderr).toContain("Plan written to");
  expect(fs.existsSync(OUTPUT_FILE)).toBe(true);

  // Check output file structure
  const output = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  expect(output).toHaveProperty("perIssueChecklists");
  expect(output).toHaveProperty("nextStepsPlan");
  expect(typeof output.nextStepsPlan).toBe("string");

  // Clean up
  fs.unlinkSync(OUTPUT_FILE);
});

// Note: We do not integration-test the scenario where OPENAI_API_KEY is missing,
// because Bun always loads .env automatically in all real usage and CI.
// This scenario is fully covered by unit tests for the config loader.
// Integration tests focus on real-world, supported usage. 