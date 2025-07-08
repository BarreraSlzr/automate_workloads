import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/manage-blog-branches.sh", "manage-blog-branches.sh Test");

test("manage-blog-branches.sh is executable", async () => {
  await tester.isExecutable();
});
