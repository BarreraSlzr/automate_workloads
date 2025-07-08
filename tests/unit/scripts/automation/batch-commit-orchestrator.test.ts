import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/automation/batch-commit-orchestrator.sh", "batch-commit-orchestrator.sh Test");

test("batch-commit-orchestrator.sh is executable", async () => {
  await tester.isExecutable();
});
