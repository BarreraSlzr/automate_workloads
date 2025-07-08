import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/monitoring/notify.sh", "notify.sh Test");

test("notify.sh is executable", async () => {
  await tester.isExecutable();
});
