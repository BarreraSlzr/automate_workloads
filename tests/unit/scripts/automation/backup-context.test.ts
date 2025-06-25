import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/backup-context.sh", "Backup Context Script Test");

test("backup-context.sh is executable", async () => {
  await tester.isExecutable();
});

test("backup-context.sh outputs backup info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["backup", "context"],
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
});

test("backup-context.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.trim(),
  });
}); 