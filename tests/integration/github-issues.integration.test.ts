import { test, expect } from "bun:test";
import { spawnSync } from "node:child_process";

test("github-issues CLI outputs valid JSON", () => {
  const result = spawnSync("bun", ["run", "src/cli/github-issues.ts", "--json"], { encoding: "utf-8" });
  expect(result.status).toBe(0);
  expect(() => JSON.parse(result.stdout)).not.toThrow();
}); 