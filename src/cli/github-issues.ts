#!/usr/bin/env bun

/**
 * GitHub Issues CLI Command
 * Fetches and displays GitHub issues using the GitHub CLI
 * @module cli/github-issues
 */

import { GitHubService } from "../services/github";
import { validateConfig } from "../core/config";
import { parseCLIArgs, GitHubIssuesCLIArgsSchema } from "@/types/cli";

/**
 * Displays help information
 */
function showHelp(): void {
  console.log(`
GitHub Issues CLI

Usage: bun run src/cli/github-issues.ts [options]

Options:
  -o, --owner <owner>    Repository owner (default: BarreraSlzr)
  -r, --repo <repo>      Repository name (default: automate_workloads)
  -s, --state <state>    Issue state: open, closed, all (default: open)
  -f, --format <format>  Output format: text, json, table (default: text)
  -v, --verbose          Verbose output
  -h, --help             Show this help message

Examples:
  bun run src/cli/github-issues.ts
  bun run src/cli/github-issues.ts --state closed --format table
  bun run src/cli/github-issues.ts --owner octocat --repo Hello-World
`);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    // Check for help argument before parsing
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      showHelp();
      return;
    }
    
    // Parse command line arguments
    const options = parseCLIArgs(GitHubIssuesCLIArgsSchema, process.argv.slice(2));
    
    if (options.verbose) {
      console.log('GitHub Issues CLI - Starting...');
      console.log('Options:', JSON.stringify(options, null, 2));
    }

    // Validate configuration
    const configValidation = validateConfig();
    if (options.verbose) {
      console.log('Configuration validation:', configValidation);
    }

    // Create GitHub service instance
    const github = new GitHubService(options.owner!, options.repo!);
    
    // Check if GitHub CLI is ready
    const isReady = await github.isReady();
    if (!isReady) {
      console.error('❌ GitHub CLI is not ready. Please run: gh auth login');
      process.exit(1);
    }

    if (options.verbose) {
      console.log('✅ GitHub CLI is ready');
    }

    // Fetch issues
    const response = await github.getIssues({
      state: options.state,
    });

    if (!response.success) {
      console.error('❌ Failed to fetch issues:', response.error);
      process.exit(1);
    }

    if (!response.data) {
      console.log('No issues found');
      return;
    }

    // Display issues
    const formattedOutput = github.formatIssues(response.data, options.format);
    console.log(formattedOutput);

    if (options.verbose) {
      console.log(`\n📊 Found ${response.data.length} ${options.state} issues`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (import.meta.main) {
  main();
} 