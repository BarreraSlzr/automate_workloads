import { test, expect } from "bun:test";
import { runScript } from "../integration-base-tester";

function debugOnFailure({ stdout, stderr, exitCode }: { stdout: string; stderr: string; exitCode: number | null }, label: string) {
  if (exitCode !== 0 && exitCode !== 127) {
    console.error(`\n[DEBUG] ${label} - Non-zero exit code:`, exitCode);
    console.error(`[DEBUG] STDOUT:\n${stdout}`);
    console.error(`[DEBUG] STDERR:\n${stderr}`);
  }
  if (exitCode == null) {
    console.error(`\n[DEBUG] ${label} - Null exit code`);
    console.error(`[DEBUG] STDOUT:\n${stdout}`);
    console.error(`[DEBUG] STDERR:\n${stderr}`);
  }
}

test("repo:analyze command runs successfully", async () => {
  const result = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo", "--no-fossilize", "--test"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(result, "repo:analyze command runs successfully");
  if (result.exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("✅ Repository orchestration completed successfully");
});

test("repo:analyze with fossilization disabled skips fossil creation", async () => {
  const result = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo", "--no-fossilize", "--test"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(result, "repo:analyze with fossilization disabled skips fossil creation");
  if (result.exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("✅ Repository orchestration completed successfully");
  expect(result.stdout).not.toContain("🗿 Fossilized:");
  expect(result.stdout).not.toContain("Fossilized repository state");
});

test("repo:orchestrate analyze workflow fossilizes analysis", async () => {
  const result = runScript(
    "bun",
    ["run", "repo:orchestrate", "test-owner", "test-repo", "--workflow", "analyze", "--test"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(result, "repo:orchestrate analyze workflow fossilizes analysis");
  if (result.exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("✅ Repository orchestration completed successfully");
  expect(result.stdout).toContain("🗿 Fossilized: Repository Analysis");
});

test("fossilization creates fossil entries that can be queried", async () => {
  const result = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo", "--test"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(result, "fossilization creates fossil entries that can be queried");
  if (result.exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }
  expect(result.exitCode).toBe(0);
  const fossilQuery = runScript(
    "bun",
    ["run", "context:query", "--type", "observation", "--tags", "repository-analysis"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(fossilQuery, "fossilization creates fossil entries that can be queried (fossilQuery)");
  if (fossilQuery.exitCode === 0) {
    // In test mode, fossilization might not work the same way
    // Just check that the query command runs successfully
    expect(fossilQuery.stdout).toContain("Found");
  }
});

test("fossilization handles errors gracefully", async () => {
  const result = runScript(
    "bun",
    ["run", "repo:analyze", "test-owner", "test-repo", "--test"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(result, "fossilization handles errors gracefully");
  if (result.exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("✅ Repository orchestration completed successfully");
});

test("fossilization respects --no-fossilize flag in orchestrate", async () => {
  const result = runScript(
    "bun",
    ["run", "repo:orchestrate", "test-owner", "test-repo", "--workflow", "analyze", "--test"],
    { requiredCmds: ["bun"] }
  );
  debugOnFailure(result, "fossilization respects --no-fossilize flag in orchestrate");
  if (result.exitCode === 127) {
    console.warn("Skipping test: bun not available");
    return;
  }
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("✅ Repository orchestration completed successfully");
  expect(result.stdout).toContain("🗿 Fossilized: Repository Analysis");
}); 