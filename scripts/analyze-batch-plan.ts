#!/usr/bin/env bun

// scripts/analyze-batch-plan.ts
// Analyze and display the detailed batch plan for staged files

import { execSync } from "child_process";

interface FileAnalysis {
  path: string;
  category: string;
  type: string;
  description: string;
}

interface BatchPlan {
  batchNumber: number;
  files: FileAnalysis[];
  commitType: string;
  scope: string;
  message: string;
}

function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only", { encoding: "utf8" });
    return output.split("\n").filter(line => line.trim() !== "");
  } catch (error) {
    console.error("Error getting staged files:", error);
    return [];
  }
}

function categorizeFile(filePath: string): FileAnalysis {
  const path = filePath;
  let category = "";
  let type = "";
  let description = "";

  if (path.startsWith("src/cli/")) {
    category = "CLI Commands";
    type = "cli";
    description = "New CLI command implementation";
  } else if (path.startsWith("src/utils/")) {
    category = "Utilities";
    type = "utils";
    description = "Core utility function";
  } else if (path.startsWith("src/types/")) {
    category = "Type Definitions";
    type = "types";
    description = "TypeScript type definition";
  } else if (path.startsWith("src/services/")) {
    category = "Services";
    type = "services";
    description = "Service implementation";
  } else if (path.startsWith("scripts/")) {
    category = "Scripts";
    type = "scripts";
    description = "Automation script";
  } else if (path.startsWith("docs/")) {
    category = "Documentation";
    type = "docs";
    description = "Documentation file";
  } else if (path.startsWith("fossils/")) {
    category = "Fossils";
    type = "fossils";
    description = "Fossil data file";
  } else if (path.startsWith("tests/")) {
    category = "Tests";
    type = "tests";
    description = "Test file";
  } else if (path.includes("package.json") || path.includes("bun.lock")) {
    category = "Configuration";
    type = "config";
    description = "Project configuration";
  } else if (path.includes(".husky/")) {
    category = "Git Hooks";
    type = "hooks";
    description = "Git hook configuration";
  } else {
    category = "Other";
    type = "other";
    description = "Project file";
  }

  return { path, category, type, description };
}

function generateCommitMessage(files: FileAnalysis[]): { type: string; scope: string; message: string } {
  const categories = [...new Set(files.map(f => f.category))];
  const types = [...new Set(files.map(f => f.type))];

  let commitType = "feat";
  let scope = "";
  let message = "";

  // Determine commit type and scope based on file categories
  if (categories.includes("Documentation")) {
    commitType = "docs";
    scope = "documentation";
    message = "update documentation";
  } else if (categories.includes("Tests")) {
    commitType = "test";
    scope = "testing";
    message = "add test coverage";
  } else if (categories.includes("Scripts")) {
    commitType = "feat";
    scope = "automation";
    message = "add automation scripts";
  } else if (categories.includes("CLI Commands")) {
    commitType = "feat";
    scope = "cli";
    message = "add CLI commands";
  } else if (categories.includes("Utilities")) {
    commitType = "feat";
    scope = "utils";
    message = "add utility functions";
  } else if (categories.includes("Type Definitions")) {
    commitType = "feat";
    scope = "types";
    message = "add type definitions";
  } else if (categories.includes("Services")) {
    commitType = "feat";
    scope = "services";
    message = "add service implementations";
  } else if (categories.includes("Fossils")) {
    commitType = "feat";
    scope = "fossils";
    message = "update fossil data";
  } else if (categories.includes("Configuration")) {
    commitType = "chore";
    scope = "config";
    message = "update configuration";
  } else {
    commitType = "feat";
    scope = "project";
    message = "update project files";
  }

  return { type: commitType, scope, message };
}

function createBatchPlan(files: FileAnalysis[], batchSize: number = 5): BatchPlan[] {
  const batches: BatchPlan[] = [];
  let currentBatch: FileAnalysis[] = [];
  let batchNumber = 1;

  for (const file of files) {
    currentBatch.push(file);

    if (currentBatch.length >= batchSize) {
      const { type, scope, message } = generateCommitMessage(currentBatch);
      batches.push({
        batchNumber,
        files: [...currentBatch],
        commitType: type,
        scope,
        message: `${type}(${scope}): ${message}`
      });
      currentBatch = [];
      batchNumber++;
    }
  }

  // Handle remaining files
  if (currentBatch.length > 0) {
    const { type, scope, message } = generateCommitMessage(currentBatch);
    batches.push({
      batchNumber,
      files: [...currentBatch],
      commitType: type,
      scope,
      message: `${type}(${scope}): ${message}`
    });
  }

  return batches;
}

function displayBatchPlan(batches: BatchPlan[]): void {
  console.log("🎯 DETAILED BATCH COMMIT PLAN");
  console.log("=" .repeat(50));
  console.log(`📦 Total batches: ${batches.length}`);
  console.log(`📄 Total files: ${batches.reduce((sum, batch) => sum + batch.files.length, 0)}`);
  console.log(`📊 Average batch size: ${Math.round(batches.reduce((sum, batch) => sum + batch.files.length, 0) / batches.length)}`);
  console.log("");

  batches.forEach((batch, index) => {
    console.log(`📦 BATCH ${batch.batchNumber}/${batches.length} (${batch.files.length} files)`);
    console.log(`📝 Commit: ${batch.message}`);
    console.log(`🏷️  Type: ${batch.commitType}(${batch.scope})`);
    console.log("");
    
    // Group files by category
    const filesByCategory = batch.files.reduce((acc, file) => {
      if (!acc[file.category]) acc[file.category] = [];
      acc[file.category]!.push(file);
      return acc;
    }, {} as Record<string, FileAnalysis[]>);

    Object.entries(filesByCategory).forEach(([category, files]) => {
      console.log(`  📁 ${category} (${files.length}):`);
      files.forEach(file => {
        console.log(`    ✅ ${file.path}`);
      });
      console.log("");
    });

    if (index < batches.length - 1) {
      console.log("─" .repeat(50));
      console.log("");
    }
  });
}

function main(): void {
  console.log("🔍 Analyzing staged files for batch commit plan...\n");

  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log("❌ No staged files found");
    return;
  }

  console.log(`📋 Found ${stagedFiles.length} staged files\n`);

  // Categorize files
  const fileAnalyses = stagedFiles.map(categorizeFile);

  // Group by category for overview
  const filesByCategory = fileAnalyses.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category]!.push(file);
    return acc;
  }, {} as Record<string, FileAnalysis[]>);

  console.log("📊 FILE CATEGORIES:");
  Object.entries(filesByCategory).forEach(([category, files]) => {
    console.log(`  📁 ${category}: ${files.length} files`);
  });
  console.log("");

  // Create batch plans with different sizes
  const batchSizes = [3, 5, 7, 10];
  
  batchSizes.forEach(batchSize => {
    console.log(`\n🎯 BATCH PLAN (${batchSize} files per batch):`);
    console.log("=" .repeat(40));
    
    const batches = createBatchPlan(fileAnalyses, batchSize);
    displayBatchPlan(batches);
  });

  // Show recommended batch size
  console.log("\n💡 RECOMMENDATION:");
  console.log("For the best balance of reviewability and efficiency, use batch size 5:");
  console.log("  bun run commit:batch:ready --batch-size 5");
  console.log("");
  console.log("This will create logical commits that are easy to review and understand.");
}

if (import.meta.main) {
  main();
} 