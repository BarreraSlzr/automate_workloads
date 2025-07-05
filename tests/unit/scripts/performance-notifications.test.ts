import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";

const tester = new ScriptTester("./scripts/performance-notifications.sh", "performance-notifications.sh Test");

test("performance-notifications.sh is executable", async () => {
  await tester.isExecutable();
});
