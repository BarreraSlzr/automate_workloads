import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";
const tester = new ScriptTester("./scripts/blog-workflow.sh", "blog-workflow.sh Test");

test("blog-workflow.sh is executable", async () => {
  await tester.isExecutable();
});
