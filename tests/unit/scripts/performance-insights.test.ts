import { test } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";

const tester = new ScriptTester("./scripts/performance-insights.sh", "performance-insights.sh Test");

test("performance-insights.sh is executable", async () => {
  await tester.isExecutable();
});
