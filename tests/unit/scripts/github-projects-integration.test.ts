import { test } from "bun:test";
import { ScriptTester } from "../../base-tester";
const tester = new ScriptTester("./scripts/github-projects-integration.sh", "github-projects-integration.sh Test");

test("github-projects-integration.sh is executable", async () => {
  await tester.isExecutable();
});

test("github-projects-integration.sh shows usage with missing args", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Usage: ", "<owner> <repo>"],
    expectedExitCode: 1,
    timeoutMs: 5000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
