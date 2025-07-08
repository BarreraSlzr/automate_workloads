import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/canonical-commit.sh", "canonical-commit.sh Test");

test("canonical-commit.sh is executable", async () => {
  await tester.isExecutable();
});
