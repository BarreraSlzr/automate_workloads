// scripts/precommit-validate.ts
// Pre-commit validation script for the automation ecosystem
// Ensures scripts share logic from src/utils/, validates staged files with Zod schemas, lints for deprecated patterns, and enforces Conventional Commits format.
// Usage: bun run scripts/precommit-validate.ts (add as a git pre-commit hook)

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import {
  CreateFossilIssueParamsSchema,
  LLMInsightExportSchema,
  CreateFossilLabelParamsSchema,
  CreateFossilMilestoneParamsSchema,
} from "../src/types/schemas";

// 1. Get staged files
const staged = execSync("git diff --cached --name-only").toString().split("\n").filter(Boolean);

// 2. Ensure all scripts in scripts/ share logic from src/utils/
const scriptFiles = staged.filter(f => f.startsWith("scripts/") && f.endsWith(".ts"));
let scriptUtilCheckFailed = false;
for (const file of scriptFiles) {
  const content = readFileSync(file, "utf-8");
  if (!content.match(/from ['\"](\.\.\/)?utils\//) && !content.match(/from ['\"]@\/utils\//)) {
    console.error(`❌ ${file} does not import from src/utils/. All scripts should share logic from utilities.`);
    scriptUtilCheckFailed = true;
  }
}
if (scriptUtilCheckFailed) process.exit(1);

// 3. Validate JSON files with Zod schemas
for (const file of staged) {
  if (file.endsWith(".json") && existsSync(file)) {
    try {
      const data = JSON.parse(readFileSync(file, "utf-8"));
      if (file.includes("fossil")) CreateFossilIssueParamsSchema.parse(data);
      if (file.includes("insight")) LLMInsightExportSchema.parse(data);
      if (file.includes("label")) CreateFossilLabelParamsSchema.parse(data);
      if (file.includes("milestone")) CreateFossilMilestoneParamsSchema.parse(data);
      // Add more as needed
      console.log(`✅ ${file} passed schema validation.`);
    } catch (e: any) {
      console.error(`❌ Schema validation failed for ${file}:`, e.errors || e.message);
      process.exit(1);
    }
  }
}

// 4. Lint for deprecated patterns
const badPatterns = [
  "execSync(",
  "require('zod')",
  'require("zod")',
  "gh issue create",
  "gh label create",
  "gh milestone create",
  "import z from 'zod'",
  'import z from "zod"',
];
let lintFailed = false;
for (const file of staged) {
  if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
  const content = readFileSync(file, "utf-8");
  for (const pattern of badPatterns) {
    if (content.includes(pattern)) {
      console.error(`❌ Deprecated pattern "${pattern}" found in ${file}`);
      lintFailed = true;
    }
  }
}
if (lintFailed) process.exit(1);

// 5. Check last commit message for Conventional Commits format
try {
  const lastMsg = execSync("git log -1 --pretty=%B").toString();
  const conventionalCommit = /^(feat|fix|docs|style|refactor|test|chore|perf)\([^)]+\): .+/;
  if (!conventionalCommit.test(lastMsg.trim())) {
    console.error("❌ Commit message does not follow Conventional Commits format.");
    process.exit(1);
  }
} catch (e) {
  // If no commits yet, skip this check
}

console.log("✅ Pre-commit validation passed! All checks succeeded."); 