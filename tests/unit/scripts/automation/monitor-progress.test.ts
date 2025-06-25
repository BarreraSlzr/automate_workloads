import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/monitor-progress.sh", "Monitor Progress Script Test");

// --- Executable check ---
test("monitor-progress.sh is executable", async () => {
  await tester.isExecutable();
});

// --- Real mode: should output something recognizable ---
test("monitor-progress.sh outputs progress info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["progress", "monitor"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

// --- Edge case: unexpected argument ---
test("monitor-progress.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 