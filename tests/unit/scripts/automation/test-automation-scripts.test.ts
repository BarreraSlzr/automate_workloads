import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester";

const tester = new ScriptTester("./scripts/automation/test-automation-scripts.sh", "test-automation-scripts.sh Test");

test("test-automation-scripts.sh is executable", async () => {
  await tester.isExecutable();
});
