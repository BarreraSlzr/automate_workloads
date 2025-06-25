import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester";

// Use the correct path to your script
const tester = new ScriptTester("./scripts/monitoring/check-issues.sh", "[TEST MODE] check-issues.sh ran successfully.");

// --- Fast, always-run tests (no real GitHub calls) ---

test("check-issues.sh: test mode basic", async () => {
  await tester.testMode();
  await tester.testMode(["test-label"]);
});

test("check-issues.sh: script is executable", async () => {
  await tester.isExecutable();
});

// --- Real mode (integration) tests ---

test("check-issues.sh: real mode minimal output", async () => {
  // This should not timeout, but skip if you have no network or GitHub CLI
  await tester.realMode({
    args: [],
    expectedOutput: ["Listing issues for repo:"]
  });
});

// --- Comprehensive/slow tests (each case is a separate test) ---

const checkIssuesTestCases = [
  {
    args: [],
    expectedOutput: ["Listing issues for repo:"],
    notExpectedOutput: ["With label:", "With milestone:"]
  },
  {
    args: ["test-label"],
    expectedOutput: ["Listing issues for repo:", "With label: test-label"],
    notExpectedOutput: ["With milestone:"]
  },
  {
    args: ["", "test-milestone"],
    expectedOutput: ["Listing issues for repo:", "With milestone: test-milestone"],
    notExpectedOutput: ["With label:"]
  },
  {
    args: ["test-label", "test-milestone"],
    expectedOutput: ["Listing issues for repo:", "With label: test-label", "With milestone: test-milestone"]
  }
];

checkIssuesTestCases.forEach(({ args, expectedOutput, notExpectedOutput = [] }, i) => {
  test(`check-issues.sh: comprehensive case #${i + 1} args=${JSON.stringify(args)}`, async () => {
    await tester.realMode({
      args,
      expectedOutput,
      notExpectedOutput
    });
  });
});

const checkIssuesEdgeCases = [
  { args: ["label with spaces"], desc: "label with spaces" },
  { args: ["", "milestone with spaces"], desc: "milestone with spaces" },
  { args: ["special-chars!@#"], desc: "special characters in label" },
  { args: ["", ""], desc: "empty strings" }
];

checkIssuesEdgeCases.forEach(({ args, desc }, i) => {
  test(`check-issues.sh: edge case #${i + 1} (${desc}) args=${JSON.stringify(args)}`, async () => {
    await tester.realMode({
      args,
      expectedOutput: ["Listing issues for repo:"]
    });
  });
}); 