import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester";

const tester = new ScriptTester("./scripts/automation/testing-status.sh", "testing-status.sh Test");

test("testing-status.sh is executable", async () => {
  await tester.isExecutable();
});

test("testing-status.sh outputs testing status info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: [
      "Testing Status Report",
      "Unit Tests:",
      "Integration Tests:",
      "Coverage Information"
    ],
    expectedExitCode: 0
  });
});

test("testing-status.sh handles unexpected argument", async () => {
  await tester.realMode({
    args: ["unexpected"],
    expectedOutput: [
      "❌ Unknown option: unexpected",
      "💡 Use --help for usage information"
    ],
    expectedExitCode: 1
  });
});
