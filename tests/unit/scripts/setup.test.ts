import { test, expect } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
import * as fs from "fs";
import * as yaml from "js-yaml";

const tester = new ScriptTester("./scripts/setup.sh", "setup.sh Test");

// Test that setup.sh is executable

test("setup.sh is executable", async () => {
  await tester.isExecutable();
});

test("setup.sh initializes and updates fossil", async () => {
  // Remove fossils/setup_status.yml if it exists to simulate a fresh run
  if (fs.existsSync("fossils/setup_status.yml")) {
    fs.unlinkSync("fossils/setup_status.yml");
  }

  // Run the setup script
  const { exitCode } = await tester.realMode({
    args: [],
    expectedExitCode: 0,
    timeoutMs: 300000, // 5 minutes
    normalize: o => o.replace(/\x1b\[[0-9;]*m/g, ""),
  });
  expect(exitCode).toBe(0);

  // Validate the fossil was created and has the expected structure
  expect(fs.existsSync("fossils/setup_status.yml")).toBe(true);
  const fossil = yaml.load(fs.readFileSync("fossils/setup_status.yml", "utf-8")) as any;
  expect(fossil).toHaveProperty("summary");
  expect(fossil).toHaveProperty("steps");
  // Check a few expected step keys
  const expectedSteps = ["bun", "github_cli", "ollama", "dependencies", "env_file", "fossil_storage"];
  for (const key of expectedSteps) {
    expect(fossil.steps).toHaveProperty(key);
  }
}, 300_000); // 5 minutes timeout
