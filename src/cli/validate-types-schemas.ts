#!/usr/bin/env bun

import { Command } from 'commander';
import { z } from 'zod';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { glob } from 'glob';

interface SchemaValidationResult {
  file: string;
  issues: string[];
  warnings: string[];
  isValid: boolean;
}

interface CohesionValidationResult {
  circularDependencies: string[];
  missingExports: string[];
  inconsistentTypes: string[];
  schemaConflicts: string[];
  overallValid: boolean;
}

// PARAMS OBJECT PATTERN - Define parameter interfaces
interface DetectCircularDependencyParams {
  currentFile: string;
  importPath: string;
  importMap: Map<string, string[]>;
}

interface OutputResultsParams {
  schemaResults: SchemaValidationResult[];
  cohesionResults: CohesionValidationResult;
  summary: any;
  options: any;
}

const program = new Command();

program
  .name('validate-types-schemas')
  .description('Validate type and schema cohesion across types/schemas/')
  .option('--cohesion', 'Check for transversal cohesion issues')
  .option('--strict', 'Fail on warnings')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const startTime = Date.now();
    console.log('🔍 [Type/Schema Validation] Starting comprehensive validation...');
    
    try {
      // Step 1: Validate individual schema files
      const schemaResults = await validateSchemaFiles();
      
      // Step 2: Check transversal cohesion
      const cohesionResults = await validateCohesion();
      
      // Step 3: Generate summary
      const summary = generateSummary(schemaResults, cohesionResults);
      
      // Step 4: Output results
      outputResults({
        schemaResults,
        cohesionResults,
        summary,
        options
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️  Validation completed in ${duration}ms`);
      
      // Exit with appropriate code
      if (!summary.overallValid || (options.strict && summary.totalWarnings > 0)) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

async function validateSchemaFiles(): Promise<SchemaValidationResult[]> {
  const results: SchemaValidationResult[] = [];
  
  // Find all TypeScript files in types/ and src/types/
  const typeFiles = await glob('{types,src/types}/**/*.{ts,js}', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
  });
  
  for (const file of typeFiles) {
    const result: SchemaValidationResult = {
      file,
      issues: [],
      warnings: [],
      isValid: true
    };
    
    try {
      const content = await readFile(file, 'utf-8');
      
             // Check for basic schema issues
       if (content.includes('z.object(') || content.includes('z.array(')) {
         // Validate Zod schema syntax
         if (!content.includes('import { z }') && !content.includes('from "zod"') && !content.includes('import { z, ZodError }')) {
           result.issues.push('Missing Zod import');
         }
        
        // Check for proper schema exports
        if (content.includes('export const') && !content.includes('Schema')) {
          result.warnings.push('Consider naming exported schemas with "Schema" suffix');
        }
      }
      
      // Check for type definition issues
      if (content.includes('interface ') || content.includes('type ')) {
        if (!content.includes('export ')) {
          result.warnings.push('Consider exporting type definitions for reusability');
        }
      }
      
      // Check for circular dependency indicators
      if (content.includes('import.*from.*types') && content.includes('export')) {
        result.warnings.push('Potential circular dependency - review imports');
      }
      
    } catch (error) {
      result.issues.push(`File read error: ${error}`);
      result.isValid = false;
    }
    
    results.push(result);
  }
  
  return results;
}

async function validateCohesion(): Promise<CohesionValidationResult> {
  const result: CohesionValidationResult = {
    circularDependencies: [],
    missingExports: [],
    inconsistentTypes: [],
    schemaConflicts: [],
    overallValid: true
  };
  
  try {
    // Check for circular dependencies by analyzing import patterns
    const importMap = new Map<string, string[]>();
    const typeFiles = await glob('{types,src/types}/**/*.{ts,js}', {
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
    });
    
    for (const file of typeFiles) {
      const content = await readFile(file, 'utf-8');
      const imports = extractImports(content);
      importMap.set(file, imports);
    }
    
    // Detect circular dependencies
         for (const [file, imports] of importMap) {
       for (const importPath of imports) {
         if (importPath && (importPath.includes('types') || importPath.includes('schemas'))) {
           const circular = detectCircularDependency({
             currentFile: file,
             importPath,
             importMap
           });
           if (circular) {
             result.circularDependencies.push(`${file} -> ${importPath}`);
             result.overallValid = false;
           }
         }
       }
     }
    
    // Check for schema conflicts (same name, different definitions)
    const schemaNames = new Map<string, string[]>();
    for (const file of typeFiles) {
      const content = await readFile(file, 'utf-8');
      const schemas = extractSchemaNames(content);
      for (const schema of schemas) {
        if (!schemaNames.has(schema)) {
          schemaNames.set(schema, []);
        }
        schemaNames.get(schema)!.push(file);
      }
    }
    
         for (const [schemaName, files] of schemaNames) {
       if (files.length > 1) {
         result.schemaConflicts.push(`${schemaName} defined in multiple files: ${files.filter(Boolean).join(', ')}`);
         result.overallValid = false;
       }
     }
    
  } catch (error) {
    result.inconsistentTypes.push(`Cohesion analysis error: ${error}`);
    result.overallValid = false;
  }
  
  return result;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }
  
  return imports;
}

function extractSchemaNames(content: string): string[] {
  const schemas: string[] = [];
  const schemaRegex = /export\s+const\s+(\w+Schema)\s*=/g;
  let match;
  
  while ((match = schemaRegex.exec(content)) !== null) {
    if (match[1]) {
      schemas.push(match[1]);
    }
  }
  
  return schemas;
}

function detectCircularDependency(params: DetectCircularDependencyParams): boolean {
  const { currentFile, importPath, importMap } = params;
  const visited = new Set<string>();
  const stack = new Set<string>();
  
  function dfs(file: string): boolean {
    if (stack.has(file)) {
      return true; // Circular dependency detected
    }
    
    if (visited.has(file)) {
      return false;
    }
    
    visited.add(file);
    stack.add(file);
    
    const imports = importMap.get(file) || [];
    for (const importPath of imports) {
      if (importPath && (importPath.includes('types') || importPath.includes('schemas'))) {
        if (dfs(importPath)) {
          return true;
        }
      }
    }
    
    stack.delete(file);
    return false;
  }
  
  return dfs(currentFile);
}

function generateSummary(
  schemaResults: SchemaValidationResult[], 
  cohesionResults: CohesionValidationResult
) {
  const totalFiles = schemaResults.length;
  const validFiles = schemaResults.filter(r => r.isValid).length;
  const totalIssues = schemaResults.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = schemaResults.reduce((sum, r) => sum + r.warnings.length, 0);
  
  return {
    totalFiles,
    validFiles,
    invalidFiles: totalFiles - validFiles,
    totalIssues,
    totalWarnings,
    circularDependencies: cohesionResults.circularDependencies.length,
    schemaConflicts: cohesionResults.schemaConflicts.length,
    overallValid: validFiles === totalFiles && cohesionResults.overallValid
  };
}

function outputResults(params: OutputResultsParams) {
  const { schemaResults, cohesionResults, summary, options } = params;
  
  console.log('\n📊 Validation Summary:');
  console.log(`  📁 Files analyzed: ${summary.totalFiles}`);
  console.log(`  ✅ Valid files: ${summary.validFiles}`);
  console.log(`  ❌ Invalid files: ${summary.invalidFiles}`);
  console.log(`  🚨 Issues found: ${summary.totalIssues}`);
  console.log(`  ⚠️  Warnings: ${summary.totalWarnings}`);
  console.log(`  🔄 Circular dependencies: ${summary.circularDependencies}`);
  console.log(`  ⚔️  Schema conflicts: ${summary.schemaConflicts}`);
  
  if (options.verbose || summary.totalIssues > 0) {
    console.log('\n🔍 Detailed Issues:');
    for (const result of schemaResults) {
      if (result.issues.length > 0 || result.warnings.length > 0) {
        console.log(`  📄 ${result.file}:`);
        for (const issue of result.issues) {
          console.log(`    ❌ ${issue}`);
        }
        for (const warning of result.warnings) {
          console.log(`    ⚠️  ${warning}`);
        }
      }
    }
  }
  
  if (cohesionResults.circularDependencies.length > 0) {
    console.log('\n🔄 Circular Dependencies:');
    for (const dep of cohesionResults.circularDependencies) {
      console.log(`  ❌ ${dep}`);
    }
  }
  
  if (cohesionResults.schemaConflicts.length > 0) {
    console.log('\n⚔️ Schema Conflicts:');
    for (const conflict of cohesionResults.schemaConflicts) {
      console.log(`  ❌ ${conflict}`);
    }
  }
  
  console.log(`\n${summary.overallValid ? '✅' : '❌'} Overall validation: ${summary.overallValid ? 'PASSED' : 'FAILED'}`);
}

program.parse(); 