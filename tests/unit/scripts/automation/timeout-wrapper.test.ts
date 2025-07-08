import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/timeout-wrapper.sh", "timeout-wrapper.sh Test");

test("timeout-wrapper.sh is executable", async () => {
  await tester.isExecutable();
});
