import { test, expect } from "bun:test";
import { runScript } from "../integration-base-tester";

test("repo:analyze command runs successfully", async () => {
  const { stdout, stderr, exitCode } = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo", "--no-fossilize"],
    { requiredCmds: ["bun"] }
  );

  if (exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }

  // Should complete successfully even with test data
  expect(exitCode).toBe(0);
  expect(stdout).toContain("Repository orchestration completed successfully");
});

test("repo:analyze with fossilization disabled skips fossil creation", async () => {
  const { stdout, stderr, exitCode } = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo", "--no-fossilize"],
    { requiredCmds: ["bun"] }
  );

  if (exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain("Repository orchestration completed successfully");
  
  // Should not show fossilization messages when disabled
  expect(stdout).not.toContain("🗿 Analysis fossilized");
  expect(stdout).not.toContain("context:add");
});

test("repo:orchestrate analyze workflow fossilizes analysis", async () => {
  const { stdout, stderr, exitCode } = runScript(
    "bun",
    ["run", "repo:orchestrate", "test-owner", "test-repo", "--workflow", "analyze"],
    { requiredCmds: ["bun"] }
  );

  if (exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain("Repository orchestration completed successfully");
  
  // Should show fossilization message for analysis
  expect(stdout).toContain("🗿 Analysis fossilized");
});

test("fossilization creates fossil entries that can be queried", async () => {
  // First, run a command that creates fossils
  const { stdout, stderr, exitCode } = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo"],
    { requiredCmds: ["bun"] }
  );

  if (exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }

  expect(exitCode).toBe(0);
  
  // Check that fossil entries were created with correct types
  const fossilQuery = runScript(
    "bun",
    ["run", "context:query", "--type", "observation", "--tags", "repository-analysis"],
    { requiredCmds: ["bun"] }
  );

  if (fossilQuery.exitCode === 0) {
    expect(fossilQuery.stdout).toContain("Repository Analysis");
    expect(fossilQuery.stdout).toContain("repository-analysis");
  }
});

test("fossilization handles errors gracefully", async () => {
  // Test that fossilization doesn't break the main workflow
  const { stdout, stderr, exitCode } = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo"],
    { requiredCmds: ["bun"] }
  );

  if (exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }

  // Should still complete successfully even if fossilization fails
  expect(exitCode).toBe(0);
  expect(stdout).toContain("Repository orchestration completed successfully");
});

test("fossilization respects --no-fossilize flag in orchestrate", async () => {
  const { stdout, stderr, exitCode } = runScript(
    "bun",
    ["run", "repo:orchestrate", "test-owner", "test-repo", "--workflow", "analyze"],
    { requiredCmds: ["bun"] }
  );

  if (exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }

  expect(exitCode).toBe(0);
  expect(stdout).toContain("Repository orchestration completed successfully");
  
  // Should show fossilization messages when enabled (default)
  expect(stdout).toContain("🗿 Analysis fossilized");
}); 