import { test } from "bun:test";
import { ScriptTester } from "../../../base-tester.ts";
const tester = new ScriptTester("./scripts/monitoring/bun-test-safe.sh", "bun-test-safe.sh Test");

test("bun-test-safe.sh is executable", async () => {
  await tester.isExecutable();
});
