import { test } from "bun:test";
import { ScriptTester } from "./base.test.js";

const tester = new ScriptTester("./scripts/check-issues.sh", "[TEST MODE] check-issues.sh ran successfully.");

// Script-specific test cases
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

// Script-specific edge cases
const checkIssuesEdgeCases = [
  { args: ["label with spaces"], desc: "label with spaces" },
  { args: ["", "milestone with spaces"], desc: "milestone with spaces" },
  { args: ["special-chars!@#"], desc: "special characters in label" },
  { args: ["", ""], desc: "empty strings" }
];

// Focused test suite - avoids timeouts from real GitHub CLI calls
test("check-issues.sh basic functionality", async () => {
  // Test mode validation
  await tester.testMode();
  await tester.testMode(["test-label"]);
  
  // Integration test
  await tester.isExecutable();
});

// Separate test for real mode (can be run independently)
test("check-issues.sh real mode validation", async () => {
  // Test basic real mode without complex validation
  await tester.realMode([], ["Listing issues for repo:"]);
});

// Comprehensive test (can be run separately to avoid timeouts)
test("check-issues.sh comprehensive suite", async () => {
    // Test mode with representative arguments
    await tester.testMode();
    await tester.testMode(["test-label"]);
    await tester.testMode(["", "test-milestone"]);
  
    // Real mode with output validation
    for (const { args, expectedOutput, notExpectedOutput = [] } of checkIssuesTestCases) {
      await tester.realMode(args, expectedOutput, notExpectedOutput);
    }
  
    // Edge cases
    await tester.testEdgeCases(checkIssuesEdgeCases, "Listing issues for repo:");
  
    // Integration
    await tester.isExecutable();
}); 