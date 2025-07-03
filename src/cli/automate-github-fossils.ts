#!/usr/bin/env bun

/**
 * GitHub Fossil Automation CLI
 * Creates GitHub issues, milestones, and labels from roadmap fossils
 * @module cli/automate-github-fossils
 */

import { Command } from 'commander';
import { z } from 'zod';
import { GitHubFossilManager } from '../utils/githubFossilManager';
import { yamlToJson } from '../utils/yamlToJson';
import { E2ERoadmap } from '../types';
import { GitHubService } from '../services/github';
import { validateConfig } from '../core/config';
import * as fs from 'fs';

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
      const CreateCommandSchema = z.object({
        owner: z.string().min(1, 'Owner is required'),
        repo: z.string().min(1, 'Repository is required'),
        roadmap: z.string().min(1, 'Roadmap path is required'),
        createLabels: z.boolean().optional(),
        createMilestones: z.boolean().optional(),
        createIssues: z.boolean().optional(),
        output: z.string().optional(),
        dryRun: z.boolean().optional(),
        verbose: z.boolean().optional(),
        test: z.boolean().optional()
      });

      const validatedArgs = CreateCommandSchema.parse(options);
      const { owner, repo, roadmap: roadmapPath, createLabels, createMilestones, createIssues, output, dryRun, verbose, test: testMode } = validatedArgs;

      if (testMode) {
        console.log('Test mode');
        console.log('Starting GitHub fossil automation');
        // Simulate actions (no real API calls)
        // Optionally print what would be done
        return;
      }

      if (verbose) {
        console.log('🚀 Starting GitHub fossil automation...');
        console.log('Options:', JSON.stringify(validatedArgs, null, 2));
      }

      // Validate configuration
      const configValidation = validateConfig();
      if (verbose) {
        console.log('Configuration validation:', configValidation);
      }

      // Check if roadmap file exists
      if (!fs.existsSync(roadmapPath)) {
        console.error(`❌ Roadmap file not found: ${roadmapPath}`);
        process.exit(1);
      }

      // Initialize GitHub service and check readiness
      const github = new GitHubService(owner, repo);
      const isReady = await github.isReady();
      if (!isReady) {
        console.error('❌ GitHub CLI is not ready. Please run: gh auth login');
        process.exit(1);
      }

      if (verbose) {
        console.log('✅ GitHub CLI is ready');
      }

      // Load roadmap from YAML
      const roadmap = yamlToJson<E2ERoadmap>(roadmapPath);
      if (verbose) {
        console.log(`📖 Loaded roadmap with ${roadmap.tasks.length} tasks`);
      }

      // Initialize GitHub fossil manager
      const manager = new GitHubFossilManager(owner, repo);

      if (dryRun) {
        console.log('Dry run');
        console.log('would create:');
        for (const task of roadmap.tasks) {
          if (!task.issues || task.issues.length === 0) {
            console.log(`Issue: ${task.task}`);
            if (task.milestone) {
              console.log(`Milestone: ${task.milestone}`);
            }
          }
        }
        return;
      }

      // Create GitHub objects based on CLI options
      let labels: any[] = [];
      let milestones: any[] = [];
      let issues: any[] = [];

      if (createLabels) {
        console.log('🏷️  Creating labels...');
        labels = await manager.createLabelsForRoadmap();
        console.log(`✅ Created ${labels.length} labels`);
      }

      if (createMilestones) {
        console.log('🎯 Creating milestones...');
        milestones = await manager.createMilestonesFromRoadmap(roadmap);
        console.log(`✅ Created ${milestones.length} milestones`);
      }

      if (createIssues) {
        console.log('📝 Creating issues...');
        issues = await manager.createIssuesFromRoadmap(roadmap);
        console.log(`✅ Created ${issues.length} issues`);
      }

      // Create fossil collection
      const collection = manager.createFossilCollection(issues, milestones, labels);
      
      // Save fossil collection
      const outputPath = options.output || 'src/types/github-fossil-collection.json';
      fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
      console.log('Created');
      console.log('fossil collection');
      console.log(`💾 Saved fossil collection to ${outputPath}`);

      // Summary
      console.log('Summary:');
      console.log(`  - Issues created: ${issues.length}`);
      console.log(`  - Milestones created: ${milestones.length}`);
      console.log(`  - Labels created: ${labels.length}`);
      console.log(`  - Fossil collection saved to: ${outputPath}`);

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

      // Check if roadmap file exists
      if (!fs.existsSync(options.roadmap)) {
        console.error(`❌ Roadmap file not found: ${options.roadmap}`);
        process.exit(1);
      }

      // Load and validate roadmap
      const roadmap = yamlToJson<E2ERoadmap>(options.roadmap);
      
      console.log('✅ Roadmap validation successful');
      console.log(`📊 Roadmap contains ${roadmap.tasks.length} tasks`);
      
      // Show task summary
      const taskSummary = roadmap.tasks.map(task => ({
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

program
  .command('list')
  .description('List existing GitHub fossils')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .option('--type <type>', 'Filter by fossil type (issues, milestones, labels)')
  .option('--format <format>', 'Output format (text, json, table)', 'text')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        console.log('📋 Listing GitHub fossils...');
      }

      // Initialize GitHub service
      const github = new GitHubService(options.owner, options.repo);
      const isReady = await github.isReady();
      if (!isReady) {
        console.error('❌ GitHub CLI is not ready. Please run: gh auth login');
        process.exit(1);
      }

      // Fetch and display fossils based on type
      switch (options.type) {
        case 'issues':
          const issuesResponse = await github.getIssues();
          if (issuesResponse.success && issuesResponse.data) {
            console.log(github.formatIssues(issuesResponse.data, options.format as any));
          }
          break;
          
        case 'milestones':
          // TODO: Add milestone listing functionality
          console.log('⚠️  Milestone listing not yet implemented');
          break;
          
        case 'labels':
          // TODO: Add label listing functionality
          console.log('⚠️  Label listing not yet implemented');
          break;
          
        default:
          console.log('📋 Available fossil types: issues, milestones, labels');
          console.log('Use --type to filter by specific type');
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Show help if no command is provided
if (process.argv.length === 2) {
  program.help();
}

if (import.meta.main) {
  program.parse(process.argv);
}