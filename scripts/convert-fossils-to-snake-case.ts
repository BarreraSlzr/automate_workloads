#!/usr/bin/env bun

import { execSync } from 'child_process';
import { readdir, stat, rename, rmdir } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';

/**
 * Convert camelCase or kebab-case to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-_]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

/**
 * Convert a filename to snake_case while preserving extension
 */
function convertFilename(filename: string): string {
  const ext = extname(filename);
  const nameWithoutExt = basename(filename, ext);
  const snakeCaseName = toSnakeCase(nameWithoutExt);
  return snakeCaseName + ext;
}

/**
 * Recursively convert directory names to snake_case
 */
async function convertDirectoryNames(dirPath: string): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Convert directory name to snake_case
        const newName = toSnakeCase(entry.name);
        const newPath = join(dirPath, newName);
        
        if (newName !== entry.name) {
          console.log(`📁 Renaming directory: ${entry.name} → ${newName}`);
          await rename(fullPath, newPath);
        }
        
        // Recursively process subdirectories
        await convertDirectoryNames(newPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

/**
 * Recursively convert file names to snake_case
 */
async function convertFileNames(dirPath: string): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively process subdirectories
        await convertFileNames(fullPath);
      } else if (entry.isFile()) {
        // Convert file name to snake_case
        const newName = convertFilename(entry.name);
        const newPath = join(dirPath, newName);
        
        if (newName !== entry.name) {
          console.log(`📄 Renaming file: ${entry.name} → ${newName}`);
          await rename(fullPath, newPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing files in ${dirPath}:`, error);
  }
}

/**
 * Remove empty directories recursively
 */
async function removeEmptyDirectories(dirPath: string): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    // Process subdirectories first
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(dirPath, entry.name);
        await removeEmptyDirectories(fullPath);
      }
    }
    
    // Check if current directory is empty (after processing subdirectories)
    const remainingEntries = await readdir(dirPath, { withFileTypes: true });
    
    if (remainingEntries.length === 0) {
      console.log(`🗑️  Removing empty directory: ${dirPath}`);
      await rmdir(dirPath);
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

/**
 * Update file paths in code files
 */
function updateFilePaths(): void {
  const fossilDir = 'fossils';
  
  // Define path mappings (old → new)
  const pathMappings = [
    // Directory renames
    ['fossils/commit_audits', 'fossils/commit_audits'], // Already snake_case
    ['fossils/llm_insights', 'fossils/llm_insights'], // Already snake_case
    ['fossils/roadmap_insights', 'fossils/roadmap_insights'], // Already snake_case
    ['fossils/test_integration_analysis', 'fossils/test_integration_analysis'], // Already snake_case
    ['fossils/commit_templates', 'fossils/commit_templates'], // Already snake_case
    
    // File renames
    ['fossils/setup_status.yml', 'fossils/setup_status.yml'],
    ['fossils/current_fossil_structure_source_of_truth.md', 'fossils/current_fossil_structure_source_of_truth.md'],
    ['fossils/fossil_structure_tree_diagram.md', 'fossils/fossil_structure_tree_diagram.md'],
    ['fossils/structure_definition.yml', 'fossils/structure_definition.yml'],
    
    // Canonical directory files
    ['fossils/canonical/git_diff_results.json', 'fossils/canonical/git_diff_results.json'],
    ['fossils/canonical/footprint_results.json', 'fossils/canonical/footprint_results.json'],
    ['fossils/canonical/analysis_results.json', 'fossils/canonical/analysis_results.json'],
    ['fossils/canonical/llm_snapshots.json', 'fossils/canonical/llm_snapshots.json'],
    ['fossils/canonical/roadmap_insights.json', 'fossils/canonical/roadmap_insights.json'],
    ['fossils/canonical/coverage_report.json', 'fossils/canonical/coverage_report.json'],
    ['fossils/canonical/commit_audits_summary.json', 'fossils/canonical/commit_audits_summary.json'],
    ['fossils/canonical/migration_report.json', 'fossils/canonical/migration_report.json'],
    ['fossils/canonical/canonical_context.yml', 'fossils/canonical/canonical_context.yml'],
    ['fossils/canonical/ml_ready_analysis.json', 'fossils/canonical/ml_ready_analysis.json'],
    ['fossils/canonical/test_integration_analysis.json', 'fossils/canonical/test_integration_analysis.json'],
    ['fossils/canonical/roadmap_insights_api.json', 'fossils/canonical/roadmap_insights_api.json'],
    ['fossils/canonical/roadmap-insights-collection.json', 'fossils/canonical/roadmap_insights_collection.json'],
    ['fossils/canonical/roadmap-insights-web.json', 'fossils/canonical/roadmap_insights_web.json'],
    ['fossils/canonical/roadmap-insights-summary.json', 'fossils/canonical/roadmap_insights_summary.json'],
    ['fossils/canonical/validation-results.json', 'fossils/canonical/validation_results.json'],
    ['fossils/canonical/curated_roadmap_manual.json', 'fossils/canonical/curated_roadmap_manual.json'],
    
    // Context directory files
    ['fossils/context/canonical-context.yml', 'fossils/context/canonical_context.yml'],
    
    // Performance directory files
    ['fossils/performance/performance_data.json', 'fossils/performance/performance_data.json'], // Already snake_case
    ['fossils/performance/performance_log.json', 'fossils/performance/performance_log.json'], // Already snake_case
    
    // Test directory files
            ['fossils/tests/learning_insights.md', 'fossils/tests/learning_insights.md'],
        ['fossils/tests/learning_model.json', 'fossils/tests/learning_model.json'],
        ['fossils/tests/monitoring_data.json', 'fossils/tests/monitoring_data.json'],
        ['fossils/tests/monitoring_report.md', 'fossils/tests/monitoring_report.md'],
        ['fossils/tests/monitoring_wrapper.ts', 'fossils/tests/monitoring_wrapper.ts'],
  ];
  
  console.log('\n🔄 Updating file paths in code files...');
  
  // Update TypeScript and JavaScript files
  const codeFiles = [
    'src/**/*.ts',
    'src/**/*.js',
    'scripts/**/*.ts',
    'scripts/**/*.js',
    'tests/**/*.ts',
    'tests/**/*.js',
    'examples/**/*.ts',
    'examples/**/*.js'
  ];
  
  for (const [oldPath, newPath] of pathMappings) {
    if (oldPath !== newPath) {
      console.log(`  ${oldPath} → ${newPath}`);
      
      // Use sed to replace paths in all code files
      try {
        execSync(`find . -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.md" \\) -exec sed -i '' 's|${oldPath}|${newPath}|g' {} +`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (error) {
        console.warn(`Warning: Could not update path ${oldPath} → ${newPath}:`, error);
      }
    }
  }
}

/**
 * Main conversion function
 */
async function main(): Promise<void> {
  console.log('🦴 Converting fossils directory to snake_case...\n');
  
  const fossilsDir = 'fossils';
  
  try {
    // Step 1: Convert directory names to snake_case
    console.log('📁 Converting directory names to snake_case...');
    await convertDirectoryNames(fossilsDir);
    
    // Step 2: Convert file names to snake_case
    console.log('\n📄 Converting file names to snake_case...');
    await convertFileNames(fossilsDir);
    
    // Step 3: Remove empty directories
    console.log('\n🗑️  Removing empty directories...');
    await removeEmptyDirectories(fossilsDir);
    
    // Step 4: Update file paths in code
    console.log('\n🔄 Updating file paths in code files...');
    updateFilePaths();
    
    console.log('\n✅ Fossil directory conversion completed!');
    console.log('\n📋 Summary of changes:');
    console.log('  - All directory names converted to snake_case');
    console.log('  - All file names converted to snake_case');
    console.log('  - Empty directories removed');
    console.log('  - File paths updated in code files');
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

// Run the conversion
if (require.main === module) {
  main().catch(console.error);
} 