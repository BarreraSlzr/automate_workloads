import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/monitoring/memory-monitor.sh", "memory-monitor.sh Test");

test("memory-monitor.sh is executable", async () => {
  await tester.isExecutable();
});
