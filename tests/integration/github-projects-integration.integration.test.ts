import { test } from 'bun:test';
import { ScriptTester } from '../base-tester';

const tester = new ScriptTester("./scripts/github-projects-integration.sh", "github-projects-integration.sh Integration Test");

// [integration] This test should only be run in a fully provisioned environment with all dependencies.
test("[integration] github-projects-integration.sh outputs integration info with dummy args", async () => {
  await tester.realMode({
    args: ["-p", "123", "owner", "repo"],
    expectedOutput: ["GitHub Projects Integration", "Repository: owner/repo", "Project ID: 123"],
    timeoutMs: 20000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
}); 