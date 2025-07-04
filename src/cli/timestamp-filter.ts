#!/usr/bin/env bun

import { TimestampFilter } from '../utils/timestampFilter';

/**
 * CLI for timestamp filtering
 * 
 * Usage:
 *   bun run src/cli/timestamp-filter.ts [options]
 * 
 * Options:
 *   --check          Check if current diff has only timestamp changes
 *   --create-hook    Create a git pre-commit hook
 *   --verbose        Show detailed analysis
 *   --skip-if-only   Skip commit if only timestamp changes (exit 0)
 *   --help           Show this help
 */
async function main() {
  const args = process.argv.slice(2);
  const filter = new TimestampFilter();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🕐 Timestamp Filter CLI

Detects and filters timestamp-only changes in git diffs to avoid unnecessary commits.

Usage:
  bun run src/cli/timestamp-filter.ts [options]

Options:
  --check          Check if current diff has only timestamp changes
  --create-hook    Create a git pre-commit hook
  --verbose        Show detailed analysis
  --skip-if-only   Skip commit if only timestamp changes (exit 0)
  --help, -h       Show this help

Examples:
  # Check current diff
  bun run src/cli/timestamp-filter.ts --check

  # Create git hook
  bun run src/cli/timestamp-filter.ts --create-hook

  # Analyze with details
  bun run src/cli/timestamp-filter.ts --verbose
`);
    return;
  }

  if (args.includes('--create-hook')) {
    try {
      await filter.createGitHook();
      console.log('✅ Git hook created at .git/hooks/pre-commit');
      console.log('   The hook will warn you about timestamp-only changes before committing.');
    } catch (error) {
      console.error('❌ Failed to create git hook:', error);
      process.exit(1);
    }
    return;
  }

  if (args.includes('--check')) {
    const analysis = await filter.analyzeTimestampChanges({ verbose: true });
    const recommendations = filter.getRecommendations(analysis);
    
    console.log('\n' + recommendations.join('\n'));
    
    if (args.includes('--skip-if-only') && analysis.hasOnlyTimestampChanges) {
      console.log('\n🔄 Skipping commit due to timestamp-only changes');
      process.exit(0);
    }
    
    // Exit with code 0 if only timestamp changes, 1 otherwise
    process.exit(analysis.hasOnlyTimestampChanges ? 0 : 1);
  }

  // Default: analyze and show results
  const verbose = args.includes('--verbose');
  const analysis = await filter.analyzeTimestampChanges({ verbose });
  const recommendations = filter.getRecommendations(analysis);
  
  console.log('\n' + recommendations.join('\n'));
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
} 