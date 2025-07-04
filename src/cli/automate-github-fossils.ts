#!/usr/bin/env bun

/**
 * GitHub Fossil Automation CLI
 * Creates GitHub issues, milestones, and labels from roadmap fossils
 * @module cli/automate-github-fossils
 */

import { Command } from 'commander';
import { CreateCommandSchema } from '@/types/schemas';
import { githubFossilSync } from './githubFossilSyncCore';
import * as fs from 'fs';
import type { E2ERoadmap } from '../types';

const program = new Command();

program
  .name('automate-github-fossils')
  .description('Automate GitHub fossil creation from roadmap YAML files')
  .version('1.0.0');

program
  .command('create')
  .description('Create GitHub fossils from roadmap')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .requiredOption('--roadmap <path>', 'Path to roadmap YAML file')
  .option('--create-labels', 'Create labels for roadmap automation')
  .option('--create-milestones', 'Create milestones from roadmap tasks')
  .option('--create-issues', 'Create issues from roadmap tasks')
  .option('--output <path>', 'Output path for fossil collection JSON')
  .option('--dry-run', 'Show what would be created without actually creating')
  .option('--verbose', 'Verbose output')
  .option('--test', 'Run in test mode (simulate actions)')
  .action(async (options) => {
    try {
      // Validate CLI arguments with Zod
      const validatedArgs = CreateCommandSchema.parse(options);
      const result = await githubFossilSync({
        owner: validatedArgs.owner,
        repo: validatedArgs.repo,
        roadmapPath: validatedArgs.roadmap,
        createLabels: validatedArgs.createLabels,
        createMilestones: validatedArgs.createMilestones,
        createIssues: validatedArgs.createIssues,
        dryRun: validatedArgs.dryRun,
        verbose: validatedArgs.verbose,
        testMode: validatedArgs.test,
        output: validatedArgs.output
      });

      if (validatedArgs.test) {
        console.log('Test mode');
        console.log(result.summary);
        return;
      }
      if (validatedArgs.dryRun) {
        console.log('Dry run');
        console.log(result.summary);
        return;
      }
      console.log('Created');
      console.log('fossil collection');
      if (result.outputPath) {
        console.log(`💾 Saved fossil collection to ${result.outputPath}`);
      }
      console.log('Summary:');
      console.log(result.summary);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate roadmap YAML file')
  .requiredOption('--roadmap <path>', 'Path to roadmap YAML file')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        console.log('🔍 Validating roadmap...');
      }
      if (!fs.existsSync(options.roadmap)) {
        console.error(`❌ Roadmap file not found: ${options.roadmap}`);
        process.exit(1);
      }
      const { yamlToJson } = await import('../utils/yamlToJson');
      const roadmap = yamlToJson<E2ERoadmap>(options.roadmap);
      console.log('✅ Roadmap validation successful');
      console.log(`📊 Roadmap contains ${roadmap.tasks.length} tasks`);
      const taskSummary = roadmap.tasks.map((task: any) => ({
        task: task.task,
        status: task.status,
        milestone: task.milestone,
        owner: task.owner
      }));
      if (options.verbose) {
        console.log('\n📋 Task Summary:');
        console.table(taskSummary);
      }
    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);