import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/commit-with-footprint.sh", "commit-with-footprint.sh Test");

test("commit-with-footprint.sh is executable", async () => {
  await tester.isExecutable();
});
