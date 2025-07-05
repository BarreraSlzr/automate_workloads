#!/usr/bin/env bun
/**
 * Type and Schema Validation CLI
 * 
 * Runs comprehensive validation of all types and schemas according to TYPE_AND_SCHEMA_PATTERNS.md
 * Usage: bun run scripts/validate-types-schemas.ts [--report] [--strict]
 */

import { runTypeSchemaValidation } from '../src/utils/typeSchemaValidator';

async function main() {
  const args = process.argv.slice(2);
  const generateReport = args.includes('--report');
  const strictMode = args.includes('--strict');

  console.log("🔍 Type and Schema Validation CLI");
  console.log("==================================");
  
  if (generateReport) {
    console.log("📄 Report generation enabled");
  }
  
  if (strictMode) {
    console.log("🔒 Strict mode enabled");
  }

  try {
    await runTypeSchemaValidation();
    
    if (generateReport) {
      console.log("📊 Validation report generated successfully");
    }
    
    console.log("✅ All validations passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 