#!/usr/bin/env bun
/**
 * CLI command to update checklists in markdown, JSON, and YAML files
 * 
 * Usage:
 *   bun src/cli/update-checklist.ts <file_path> --updates '{"Task A": true, "Task B": "done"}'
 *   bun src/cli/update-checklist.ts <file_path> --updates '[{"id": "Task A", "status": "done", "comment": "Completed"}]'
 *   bun src/cli/update-checklist.ts --batch '{"file1.md": {"Task A": true}, "file2.yaml": {"Task B": "done"}}'
 */

import { Command } from 'commander';
import { 
  updateChecklistFile, 
  updateMultipleChecklistFiles,
  parseChecklistUpdates,
  generateUpdateReport,
  ChecklistItemUpdate 
} from '../utils/checklistUpdater';
import * as fs from 'fs';

const program = new Command();

program
  .name('update-checklist')
  .description('Update checklists in markdown, JSON, and YAML files')
  .version('1.0.0');

program
  .command('file')
  .description('Update a single checklist file')
  .argument('<filePath>', 'Path to the checklist file')
  .option('-u, --updates <updates>', 'JSON string of updates to apply')
  .option('-f, --updates-file <file>', 'Path to JSON file containing updates')
  .option('--dry-run', 'Show what would be updated without making changes')
  .option('--no-backup', 'Skip creating backup files')
  .action(async (filePath: string, options: any) => {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }

      // Get updates from command line or file
      let updatesString: string;
      if (options.updates) {
        updatesString = options.updates;
      } else if (options.updatesFile) {
        if (!fs.existsSync(options.updatesFile)) {
          console.error(`❌ Updates file not found: ${options.updatesFile}`);
          process.exit(1);
        }
        updatesString = fs.readFileSync(options.updatesFile, 'utf8');
      } else {
        console.error('❌ Must provide either --updates or --updates-file');
        process.exit(1);
      }

      // Parse updates
      const updates = parseChecklistUpdates(updatesString);
      
      if (updates.length === 0) {
        console.error('❌ No valid updates found');
        process.exit(1);
      }

      console.log(`📝 Updating ${filePath} with ${updates.length} changes...`);
      
      if (options.dryRun) {
        console.log('🔍 Dry run - showing what would be updated:');
        updates.forEach(update => {
          console.log(`  - ${update.id}: ${update.status}${update.comment ? ` (${update.comment})` : ''}`);
        });
        return;
      }

      // Perform update
      const result = updateChecklistFile(filePath, updates);
      
      if (result.success) {
        console.log(`✅ Successfully updated ${result.updatedCount} items`);
        if (result.notFoundCount > 0) {
          console.log(`⚠️  ${result.notFoundCount} items not found`);
        }
        if (result.backupPath) {
          console.log(`💾 Backup created: ${result.backupPath}`);
        }
      } else {
        console.error(`❌ Update failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Update multiple checklist files')
  .option('-c, --config <file>', 'Path to JSON config file with file paths and updates')
  .option('-u, --updates <updates>', 'JSON string mapping file paths to updates')
  .option('--dry-run', 'Show what would be updated without making changes')
  .option('--report <file>', 'Save update report to file')
  .action(async (options: any) => {
    try {
      // Get batch configuration
      let batchConfig: Record<string, any>;
      
      if (options.config) {
        if (!fs.existsSync(options.config)) {
          console.error(`❌ Config file not found: ${options.config}`);
          process.exit(1);
        }
        batchConfig = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      } else if (options.updates) {
        batchConfig = JSON.parse(options.updates);
      } else {
        console.error('❌ Must provide either --config or --updates');
        process.exit(1);
      }

      // Validate all files exist
      const missingFiles = Object.keys(batchConfig).filter(file => !fs.existsSync(file));
      if (missingFiles.length > 0) {
        console.error(`❌ Files not found: ${missingFiles.join(', ')}`);
        process.exit(1);
      }

      // Prepare updates
      const files = Object.entries(batchConfig).map(([path, updates]) => ({
        path,
        updates: parseChecklistUpdates(JSON.stringify(updates))
      }));

      const totalUpdates = files.reduce((sum, f) => sum + f.updates.length, 0);
      console.log(`📝 Updating ${files.length} files with ${totalUpdates} total changes...`);

      if (options.dryRun) {
        console.log('🔍 Dry run - showing what would be updated:');
        files.forEach(({ path, updates }) => {
          console.log(`\n📄 ${path}:`);
          updates.forEach(update => {
            console.log(`  - ${update.id}: ${update.status}${update.comment ? ` (${update.comment})` : ''}`);
          });
        });
        return;
      }

      // Perform batch update
      const results = updateMultipleChecklistFiles(files);
      
      // Generate and display report
      const report = generateUpdateReport(results);
      console.log('\n' + report);

      // Save report if requested
      if (options.report) {
        fs.writeFileSync(options.report, report);
        console.log(`📊 Report saved to: ${options.report}`);
      }

      // Exit with error if any files failed
      const failedFiles = results.filter(r => !r.result.success);
      if (failedFiles.length > 0) {
        console.error(`❌ ${failedFiles.length} files failed to update`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('roadmap')
  .description('Update roadmap tasks in YAML/JSON files')
  .argument('<filePath>', 'Path to the roadmap file')
  .option('-t, --task <task>', 'Task name to update')
  .option('-s, --status <status>', 'New status (pending, ready, partial, done)')
  .option('-c, --comment <comment>', 'Comment or context for the task')
  .option('--dry-run', 'Show what would be updated without making changes')
  .action(async (filePath: string, options: any) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }

      if (!options.task || !options.status) {
        console.error('❌ Must provide both --task and --status');
        process.exit(1);
      }

      const updates: ChecklistItemUpdate[] = [{
        id: options.task,
        status: options.status as any,
        comment: options.comment
      }];

      console.log(`📝 Updating roadmap task: ${options.task} -> ${options.status}`);
      
      if (options.dryRun) {
        console.log('🔍 Dry run - would update:');
        console.log(`  - Task: ${options.task}`);
        console.log(`  - Status: ${options.status}`);
        if (options.comment) {
          console.log(`  - Comment: ${options.comment}`);
        }
        return;
      }

      const result = updateChecklistFile(filePath, updates);
      
      if (result.success) {
        console.log(`✅ Successfully updated roadmap task`);
        if (result.backupPath) {
          console.log(`💾 Backup created: ${result.backupPath}`);
        }
      } else {
        console.error(`❌ Update failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(); 