import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/reset-timestamp-changes.sh", "reset-timestamp-changes.sh Test");

test("reset-timestamp-changes.sh is executable", async () => {
  await tester.isExecutable();
});
