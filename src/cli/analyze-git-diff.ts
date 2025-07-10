#!/usr/bin/env bun

/**
 * Git Diff Analysis CLI
 * Analyzes git diffs and provides insights using documentation patterns
 */

import { GitDiffAnalyzer } from '../utils/gitDiffAnalyzer';
import { parseCLIArgs, GitDiffAnalysisParamsSchema } from '../types/cli';
import { getCurrentRepoOwner, getCurrentRepoName } from '../utils/cli';
import { z } from 'zod';
import { OwnerRepoSchema } from '../types/schemas';

function detectOwnerRepo(options: any = {}): { owner: string; repo: string } {
  if (options.owner && options.repo) return { owner: options.owner, repo: options.repo };
  const owner = getCurrentRepoOwner();
  const repo = getCurrentRepoName();
  if (owner && repo) return { owner, repo };
  if (process.env.CI) {
    return { owner: 'BarreraSlzr', repo: 'automate_workloads' };
  } else {
    return { owner: 'emmanuelbarrera', repo: 'automate_workloads' };
  }
}

function showHelp(): void {
  console.log(`
Git Diff Analysis CLI

Usage: bun run src/cli/analyze-git-diff.ts [options]

Options:
  --commit-hash <hash>     Analyze specific commit
  --include-staged         Include staged changes
  --include-unstaged       Include unstaged changes
  --max-files <number>     Maximum files to analyze (default: 100)
  --analysis-depth <level> Analysis depth: shallow, medium, deep (default: medium)
  --format <format>        Output format: json, text, table (default: table)
  --output <file>          Output file path
  --batch                  Batch analyze recent commits
  --batch-size <number>    Batch size for analysis (default: 50)
  -h, --help              Show this help message

Examples:
  # Analyze current unstaged changes
  bun run src/cli/analyze-git-diff.ts --include-unstaged

  # Analyze specific commit
  bun run src/cli/analyze-git-diff.ts --commit-hash abc123

  # Batch analyze recent commits
  bun run src/cli/analyze-git-diff.ts --batch --batch-size 10

  # Export to JSON
  bun run src/cli/analyze-git-diff.ts --format json --output analysis.json
`);
}

async function main(): Promise<void> {
  try {
    const options = parseCLIArgs(GitDiffAnalysisParamsSchema, process.argv.slice(2));
    const { owner, repo } = detectOwnerRepo(options);
    OwnerRepoSchema.parse({ owner, repo });
    
    // Handle help
    if (options.help || options.h) {
      showHelp();
      process.exit(0);
    }
    
    // Set defaults
    if (!options.includeStaged && !options.includeUnstaged && !options.commitHash) {
      options.includeUnstaged = true;
    }
    
    const analyzer = new GitDiffAnalyzer();
    
    if (options.batch) {
      console.log('🔄 Starting batch analysis...');
      
      const result = await analyzer.batchAnalyze({
        batchSize: options.batchSize || 50,
        maxConcurrency: 5,
        owner,
        repo,
        progressCallback: (processed: number, total: number) => {
          const percent = Math.round((processed / total) * 100);
          process.stdout.write(`\r📊 Progress: ${processed}/${total} (${percent}%)`);
        }
      });
      
      console.log('\n✅ Batch analysis completed!');
      console.log(`📊 Results: ${result.successfulItems} successful, ${result.failedItems} failed`);
      console.log(`⏱️ Processing time: ${result.processingTime}ms`);
      
      if (options.format === 'json') {
        const output = JSON.stringify(result, null, 2);
        if (options.output) {
          await Bun.write(options.output, output);
          console.log(`💾 Results saved to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        displayBatchResults(result);
      }
    } else {
      console.log('🔍 Analyzing git diff...');
      
      const result = await analyzer.analyzeDiff({
        commitHash: options.commitHash,
        includeStaged: options.includeStaged,
        includeUnstaged: options.includeUnstaged,
        maxFiles: options.maxFiles || 100,
        analysisDepth: options.analysisDepth || 'medium',
        owner,
        repo
      });
      
      console.log('✅ Analysis completed!');
      
      if (options.format === 'json') {
        const output = JSON.stringify(result, null, 2);
        if (options.output) {
          await Bun.write(options.output, output);
          console.log(`💾 Results saved to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        displayAnalysisResults(result);
      }
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function displayAnalysisResults(result: any): void {
  console.log('\n📊 Git Diff Analysis Results');
  console.log('=' .repeat(50));
  
  console.log(`📁 Files Changed: ${result.filesChanged}`);
  console.log(`➕ Lines Added: ${result.linesAdded}`);
  console.log(`➖ Lines Deleted: ${result.linesDeleted}`);
  
  if (result.files.length > 0) {
    console.log('\n📄 File Changes:');
    result.files.forEach((file: any) => {
      const status = file.status === 'added' ? '🆕' : 
                    file.status === 'deleted' ? '🗑️' : 
                    file.status === 'renamed' ? '🔄' : '✏️';
      
      console.log(`${status} ${file.path}`);
      console.log(`   Type: ${file.changeType}, Impact: ${file.impact}`);
      console.log(`   Changes: +${file.linesAdded} -${file.linesDeleted}`);
      
      if (file.recommendations.length > 0) {
        console.log(`   💡 Recommendations:`);
        file.recommendations.forEach((rec: string) => {
          console.log(`      - ${rec}`);
        });
      }
      console.log('');
    });
  }
  
  if (result.patterns.length > 0) {
    console.log('🔍 Documentation Patterns Found:');
    result.patterns.forEach((pattern: any) => {
      console.log(`   📋 ${pattern.pattern}: ${pattern.count} matches in ${pattern.files.length} files`);
    });
    console.log('');
  }
  
  if (result.insights.length > 0) {
    console.log('🧠 LLM Insights:');
    result.insights.forEach((insight: any) => {
      console.log(`   💭 ${insight.type}: ${insight.description}`);
      console.log(`      Confidence: ${Math.round(insight.confidence * 100)}%`);
      if (insight.recommendations.length > 0) {
        console.log(`      Recommendations:`);
        insight.recommendations.forEach((rec: string) => {
          console.log(`        - ${rec}`);
        });
      }
      console.log('');
    });
  }
}

function displayBatchResults(result: any): void {
  console.log('\n📊 Batch Analysis Results');
  console.log('=' .repeat(50));
  
  console.log(`📈 Total Items: ${result.totalItems}`);
  console.log(`✅ Successful: ${result.successfulItems}`);
  console.log(`❌ Failed: ${result.failedItems}`);
  console.log(`⏱️ Processing Time: ${result.processingTime}ms`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error: any) => {
      console.log(`   ${error.itemId}: ${error.error}`);
    });
  }
  
  if (result.results.length > 0) {
    console.log('\n📊 Sample Results:');
    const sample = result.results.slice(0, 3);
    sample.forEach((item: any) => {
      console.log(`   ${item.itemId}: ${item.result.filesChanged} files changed`);
    });
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
} 