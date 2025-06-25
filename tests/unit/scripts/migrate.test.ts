import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/migrate.sh", "migrate.sh Test");

test("migrate.sh is executable", async () => {
  await tester.isExecutable();
});

test("migrate.sh shows migration status with no args", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Migration Status"],
    timeoutMs: 10000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});

test("migrate.sh outputs migration status info", async () => {
  await tester.realMode({
    args: ["status"],
    expectedOutput: ["Migration Status"],
    timeoutMs: 10000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});
