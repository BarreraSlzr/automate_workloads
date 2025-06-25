import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/migrations/001-improve-project-structure.sh", "001-improve-project-structure.sh Test");

test("001-improve-project-structure.sh is executable", async () => {
  await tester.isExecutable();
});

test("001-improve-project-structure.sh outputs migration start info", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: ["Starting migration", "improve-project-structure"],
    timeoutMs: 10000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});

test("001-improve-project-structure.sh warns if already applied", async () => {
  // Run twice: first time applies, second time should warn
  await tester.realMode({
    args: [],
    expectedOutput: ["Starting migration", "improve-project-structure"],
    timeoutMs: 10000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
  await tester.realMode({
    args: [],
    expectedOutput: ["Migration 001 has already been applied"],
    timeoutMs: 10000,
    normalize: output => output.replace(/\x1b\[[0-9;]*m/g, ""),
  });
});
