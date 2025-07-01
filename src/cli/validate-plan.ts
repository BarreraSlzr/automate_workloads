#!/usr/bin/env bun

/**
 * Plan Validation CLI
 * 
 * Validates generated LLM plans against expected results and quality standards.
 */

import { Command } from 'commander';
import { PlanValidator, type ValidationOptions } from '../utils/plan-validator';

const program = new Command();

program
  .name('validate-plan')
  .description('Validate LLM-generated plans against expected results')
  .version('1.0.0');

program
  .command('validate')
  .description('Validate a generated plan')
  .argument('<plan-file>', 'Path to the generated plan JSON file')
  .option('-e, --expected <file>', 'Path to expected plan JSON file')
  .option('-s, --strict', 'Enable strict mode (warnings become errors)')
  .option('--ignore-timeline', 'Ignore timeline differences')
  .option('--ignore-risks', 'Ignore risk differences')
  .option('--min-tasks <number>', 'Minimum number of tasks required', '3')
  .option('--max-tasks <number>', 'Maximum number of tasks allowed', '15')
  .option('--min-tags <number>', 'Minimum tags per task', '1')
  .option('--max-tags <number>', 'Maximum tags per task', '8')
  .option('--required-tags <tags>', 'Comma-separated list of required tags')
  .option('--forbidden-tags <tags>', 'Comma-separated list of forbidden tags')
  .option('--output <file>', 'Output validation report to file')
  .action(async (planFile, options) => {
    try {
      // Parse options
      const validationOptions: ValidationOptions = {
        strictMode: options.strict,
        ignoreTimeline: options.ignoreTimeline,
        ignoreRisks: options.ignoreRisks,
        minTasks: parseInt(options.minTasks),
        maxTasks: parseInt(options.maxTasks),
        minTagsPerTask: parseInt(options.minTags),
        maxTagsPerTask: parseInt(options.maxTags),
        requiredTags: options.requiredTags?.split(',').map((t: string) => t.trim()),
        forbiddenTags: options.forbiddenTags?.split(',').map((t: string) => t.trim()),
      };

      // Create validator
      const validator = new PlanValidator(validationOptions);

      // Validate plan
      const result = validator.validatePlan(planFile, options.expected);

      // Print report
      validator.printReport(result);

      // Save report to file if requested
      if (options.output) {
        const fs = await import('fs/promises');
        const report = {
          timestamp: new Date().toISOString(),
          planFile,
          expectedFile: options.expected,
          result,
        };
        await fs.writeFile(options.output, JSON.stringify(report, null, 2));
        console.log(`\n📄 Validation report saved to: ${options.output}`);
      }

      // Exit with appropriate code
      process.exit(result.isValid ? 0 : 1);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Validate multiple plans in batch')
  .argument('<plan-directory>', 'Directory containing plan JSON files')
  .option('-e, --expected-dir <dir>', 'Directory containing expected plan files')
  .option('-p, --pattern <pattern>', 'File pattern to match (default: *.json)', '*.json')
  .option('-s, --strict', 'Enable strict mode')
  .option('--output <file>', 'Output batch validation report to file')
  .action(async (planDirectory, options) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Find all plan files
      const files = await fs.readdir(planDirectory);
      const planFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(planDirectory, file));

      if (planFiles.length === 0) {
        console.log('No plan files found matching pattern:', planDirectory);
        return;
      }

      console.log(`Found ${planFiles.length} plan files to validate...\n`);

      const validator = new PlanValidator({ strictMode: options.strict });
      const results: Array<{ file: string; result: any }> = [];

      let totalScore = 0;
      let validPlans = 0;

      // Validate each plan
      for (const planFile of planFiles) {
        const fileName = path.basename(planFile);
        console.log(`Validating: ${fileName}`);

        // Try to find corresponding expected file
        let expectedFile: string | undefined;
        if (options.expectedDir) {
          const expectedPath = path.join(options.expectedDir, fileName);
          try {
            await fs.access(expectedPath);
            expectedFile = expectedPath;
          } catch {
            // Expected file doesn't exist, continue without it
          }
        }

        const result = validator.validatePlan(planFile, expectedFile);
        results.push({ file: fileName, result });

        totalScore += result.score;
        if (result.isValid) validPlans++;

        // Print brief result
        const status = result.isValid ? '✅' : '❌';
        console.log(`  ${status} Score: ${result.score}/100 (${result.errors.length} errors, ${result.warnings.length} warnings)`);
      }

      // Print batch summary
      console.log('\n📊 Batch Validation Summary');
      console.log('=' .repeat(50));
      console.log(`Total Plans: ${planFiles.length}`);
      console.log(`Valid Plans: ${validPlans}`);
      console.log(`Invalid Plans: ${planFiles.length - validPlans}`);
      console.log(`Average Score: ${(totalScore / planFiles.length).toFixed(1)}/100`);
      console.log(`Success Rate: ${((validPlans / planFiles.length) * 100).toFixed(1)}%`);

      // Save batch report if requested
      if (options.output) {
        const batchReport = {
          timestamp: new Date().toISOString(),
          planDirectory,
          expectedDirectory: options.expectedDir,
          pattern: options.pattern,
          summary: {
            totalPlans: planFiles.length,
            validPlans,
            invalidPlans: planFiles.length - validPlans,
            averageScore: totalScore / planFiles.length,
            successRate: (validPlans / planFiles.length) * 100,
          },
          results,
        };
        await fs.writeFile(options.output, JSON.stringify(batchReport, null, 2));
        console.log(`\n📄 Batch report saved to: ${options.output}`);
      }

      // Exit with appropriate code
      const allValid = validPlans === planFiles.length;
      process.exit(allValid ? 0 : 1);
    } catch (error) {
      console.error('❌ Batch validation failed:', error);
      process.exit(1);
    }
  });

program
  .command('create-expected')
  .description('Create an expected plan template from a generated plan')
  .argument('<plan-file>', 'Path to the generated plan JSON file')
  .option('-o, --output <file>', 'Output file for expected plan template')
  .action(async (planFile, options) => {
    try {
      const fs = await import('fs/promises');
      
      // Load the generated plan
      const planContent = await fs.readFile(planFile, 'utf-8');
      const plan = JSON.parse(planContent);

      // Create expected plan template
      const expectedPlan = {
        tasks: plan.tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          tags: task.tags || [],
        })),
        timeline: {
          startDate: plan.timeline?.startDate,
          endDate: plan.timeline?.endDate,
          milestones: plan.timeline?.milestones?.map((milestone: any) => ({
            date: milestone.date,
            description: milestone.description,
            tasks: milestone.tasks,
          })),
        },
        risks: plan.risks?.map((risk: any) => ({
          description: risk.description,
          probability: risk.probability,
          impact: risk.impact,
          mitigation: risk.mitigation,
        })),
      };

      const outputFile = options.output || planFile.replace('.json', '-expected.json');
      await fs.writeFile(outputFile, JSON.stringify(expectedPlan, null, 2));
      
      console.log(`✅ Expected plan template created: ${outputFile}`);
      console.log('📝 Edit this file to define your expected results, then use it for validation.');
    } catch (error) {
      console.error('❌ Failed to create expected plan template:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(); 