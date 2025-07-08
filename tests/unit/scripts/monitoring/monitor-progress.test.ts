import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/monitoring/monitor-progress.sh", "monitor-progress.sh Test");

test("monitor-progress.sh is executable", async () => {
  await tester.isExecutable();
});
