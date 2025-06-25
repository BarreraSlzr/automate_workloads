#!/usr/bin/env bun

/**
 * Project Structure Migration Script
 * - Creates new directories
 * - Moves files to new locations
 * - Prints a summary of actions
 */

import { mkdirSync, existsSync, renameSync } from "fs";
import { join } from "path";

function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    console.log(`Created: ${path}`);
  }
}

function moveFile(src: string, dest: string) {
  if (existsSync(src)) {
    ensureDir(join(dest, ".."));
    renameSync(src, dest);
    console.log(`Moved: ${src} -> ${dest}`);
  }
}

// 1. Create new directories
const dirs = [
  "scripts/automation",
  "scripts/monitoring",
  "scripts/setup",
  "tests/unit/scripts/automation",
  "tests/unit/scripts/monitoring",
  "tests/unit/scripts/setup",
  "tests/integration",
  "tests/e2e",
];
dirs.forEach(ensureDir);

// 2. Move shell scripts
moveFile("scripts/backup-context.sh", "scripts/automation/backup-context.sh");
moveFile("scripts/github-projects-integration.sh", "scripts/automation/github-projects-integration.sh");
// ...repeat for all automation scripts

moveFile("scripts/check-issues.sh", "scripts/monitoring/check-issues.sh");
moveFile("scripts/quick-status.sh", "scripts/monitoring/quick-status.sh");

moveFile("scripts/create-milestone.sh", "scripts/setup/create-milestone.sh");
moveFile("scripts/ensure-demo-issue.ts", "src/cli/ensure-demo-issue.ts"); // If TypeScript

// 3. Move test files
moveFile("scripts/base.test.ts", "tests/unit/scripts/base.test.ts");
moveFile("scripts/check-issues.test.ts", "tests/unit/scripts/monitoring/check-issues.test.ts");
moveFile("scripts/check-issues.test.sh", "tests/unit/scripts/monitoring/check-issues.test.sh");

// 4. Print completion
console.log("✅ Project structure migration complete!");