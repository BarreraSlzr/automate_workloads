import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/simple-monitor.sh", "Simple Monitor Script Test");

test("simple-monitor.sh is executable", async () => {
  await tester.isExecutable();
});

test("simple-monitor.sh outputs monitor info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["monitor", "simple"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("simple-monitor.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 