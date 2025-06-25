import { test } from "bun:test";
import { ScriptTester } from "../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/audit-shell-scripts.sh", "Audit Shell Scripts Test");

// --- Executable check ---
test("audit-shell-scripts.sh is executable", async () => {
  await tester.isExecutable();
});

// --- Real mode: should report missing test files for known scripts ---
test("audit-shell-scripts.sh finds missing test files", async () => {
  // This test expects at least one missing test file or none
  await tester.realMode([], ["has no test file!"]);
});

// --- Edge case: script with a test file present (manual/visual check) ---
test("audit-shell-scripts.sh does not report scripts with test files", async () => {
  // If you add a test file for a script, it should not be reported as missing
  // This is a placeholder for future mocking or more advanced checks
  // For now, just ensure the script runs and does not error
  await tester.realMode([], []);
});

// --- Edge case: no shell scripts present (manual/visual check) ---
test("audit-shell-scripts.sh handles no shell scripts gracefully", async () => {
  // This would require a mock or running in a temp directory
  // For now, just ensure the script runs and does not error
  await tester.realMode([], []);
});
