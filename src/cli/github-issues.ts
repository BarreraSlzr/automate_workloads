#!/usr/bin/env bun

/**
 * GitHub Issues CLI Command
 * Fetches and displays GitHub issues using the GitHub CLI
 * @module cli/github-issues
 */

import { GitHubService } from "../services/github";
import { validateConfig } from "../core/config";

/**
 * CLI options interface
 */
interface GitHubIssuesCLIOptions {
  /** Repository owner */
  owner?: string;
  /** Repository name */
  repo?: string;
  /** Issue state filter */
  state?: 'open' | 'closed' | 'all';
  /** Output format */
  format?: 'text' | 'json' | 'table';
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Parses command line arguments
 * 
 * @returns {GitHubIssuesCLIOptions} Parsed CLI options
 */
function parseArgs(): GitHubIssuesCLIOptions {
  const args = process.argv.slice(2);
  const options: GitHubIssuesCLIOptions = {
    owner: 'BarreraSlzr',
    repo: 'automate_workloads',
    state: 'open',
    format: 'text',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--owner':
      case '-o':
        options.owner = args[++i];
        break;
      case '--repo':
      case '-r':
        options.repo = args[++i];
        break;
      case '--state':
      case '-s':
        options.state = args[++i] as 'open' | 'closed' | 'all';
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'text' | 'json' | 'table';
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

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
    // Parse command line arguments
    const options = parseArgs();
    
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