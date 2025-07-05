import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";

const tester = new ScriptTester("./scripts/performance-monitor.sh", "performance-monitor.sh Test");

test("performance-monitor.sh is executable", async () => {
  await tester.isExecutable();
});
