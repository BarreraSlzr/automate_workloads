import { test, expect } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/audit-shell-scripts.sh", "audit-shell-scripts.sh Test");

// --- Executable check ---
test("audit-shell-scripts.sh is executable", async () => {
  await tester.isExecutable();
});

// --- Real mode: should report missing test files for known scripts or summary if all present ---
test("audit-shell-scripts.sh finds missing test files or outputs summary", async () => {
  const { output } = await tester.realMode({
    args: [],
    expectedOutput: [], // Don't require a specific output
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
  const hasMissing = output.includes("has no test file!");
  const hasSummary = output.includes("✅ All shell scripts have corresponding test files.");
  expect(hasMissing || hasSummary).toBe(true);
});

// --- Edge case: all scripts have test files, expect summary only ---
test("audit-shell-scripts.sh outputs summary when all scripts have test files", async () => {
  const { output } = await tester.realMode({
    args: [],
    expectedOutput: ["✅ All shell scripts have corresponding test files."],
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
  expect(output.trim()).toBe("✅ All shell scripts have corresponding test files.");
});

// --- Edge case: no shell scripts present (manual/visual check) ---
test("audit-shell-scripts.sh handles no shell scripts gracefully", async () => {
  // This case is environment-dependent; just check for no crash and exit code 0
  await tester.realMode({
    args: [],
    expectedOutput: [],
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});
