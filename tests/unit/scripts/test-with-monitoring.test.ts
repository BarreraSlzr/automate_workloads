import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/test-with-monitoring.sh", "test-with-monitoring.sh Test");

test("test-with-monitoring.sh is executable", async () => {
  await tester.isExecutable();
});
