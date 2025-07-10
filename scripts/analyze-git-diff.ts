#!/usr/bin/env bun

/**
 * Git Diff Analysis Script
 * 
 * Automatically analyzes git diff to:
 * - Track changes in predictive monitoring system
 * - Identify new log patterns and monitoring data
 * - Ensure automatic procedures are working
 * - Generate summaries of system evolution
 */

import { executeCommand } from '../src/utils/cli';
import { promises as fs } from 'fs';

interface DiffAnalysis {
  timestamp: string;
  commitHash: string;
  filesChanged: string[];
  monitoringFiles: string[];
  schemaChanges: string[];
  cliChanges: string[];
  logPatterns: string[];
  summary: string;
  recommendations: string[];
}

interface FileChange {
  file: string;
  additions: number;
  deletions: number;
  type: 'added' | 'modified' | 'deleted';
  impact: 'high' | 'medium' | 'low';
}

/**
 * Analyze git diff for monitoring and logging changes
 */
async function analyzeGitDiff(options: {
  since?: string;
  until?: string;
  output?: string;
  verbose?: boolean;
} = {}): Promise<DiffAnalysis> {
  const { since, until, output, verbose = false } = options;
  
  console.log('🔍 Analyzing Git Diff for Monitoring Changes\n');
  
  try {
    // Get current commit hash
    const commitHash = executeCommand('git rev-parse HEAD').stdout.trim();
    
    // Build git diff command
    let diffCommand = 'git diff --stat --name-status';
    if (since) {
      diffCommand += ` ${since}..HEAD`;
    } else if (until) {
      diffCommand += ` HEAD~1..${until}`;
    } else {
      diffCommand += ' HEAD~1..HEAD';
    }
    
    // Get diff statistics
    const diffStats = executeCommand(diffCommand).stdout;
    
    // Parse file changes
    const fileChanges = parseFileChanges(diffStats);
    
    // Analyze changes by category
    const monitoringFiles = fileChanges.filter(f => 
      f.file.includes('monitoring') || 
      f.file.includes('fossils/monitoring') ||
      f.file.includes('llmPredictiveMonitoring')
    );
    
    const schemaChanges = fileChanges.filter(f => 
      f.file.includes('schemas.ts') || 
      f.file.includes('types/')
    );
    
    const cliChanges = fileChanges.filter(f => 
      f.file.includes('cli/') || 
      f.file.includes('scripts/')
    );
    
    // Analyze log patterns
    const logPatterns = await analyzeLogPatterns(fileChanges);
    
    // Generate summary
    const summary = generateSummary({ fileChanges, monitoringFiles, schemaChanges, cliChanges });
    
    // Generate recommendations
    const recommendations = generateRecommendations(fileChanges, logPatterns);
    
    const analysis: DiffAnalysis = {
      timestamp: new Date().toISOString(),
      commitHash,
      filesChanged: fileChanges.map(f => f.file),
      monitoringFiles: monitoringFiles.map(f => f.file),
      schemaChanges: schemaChanges.map(f => f.file),
      cliChanges: cliChanges.map(f => f.file),
      logPatterns,
      summary,
      recommendations
    };
    
    // Display results
    if (verbose) {
      displayDetailedAnalysis(analysis);
    } else {
      displaySummary(analysis);
    }
    
    // Save analysis
    if (output) {
      await fs.writeFile(output, JSON.stringify(analysis, null, 2));
      console.log(`\n💾 Analysis saved to: ${output}`);
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Git diff analysis failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Parse file changes from git diff output
 */
function parseFileChanges(diffStats: string): FileChange[] {
  const lines = diffStats.split('\n').filter(line => line.trim());
  const changes: FileChange[] = [];
  
  for (const line of lines) {
    // Parse git diff --stat format
    const match = line.match(/^(.+?)\s+\|\s+(\d+)\s+(\+*)(-*)$/);
    if (match) {
      const [, file, total, additions, deletions] = match;
      if (file && additions && deletions) {
        changes.push({
          file: file.trim(),
          additions: additions.length,
          deletions: deletions.length,
          type: 'modified',
          impact: determineImpact(additions.length, deletions.length)
        });
      }
    } else {
      // Parse git diff --name-status format
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const [status, file] = parts;
        if (status && file) {
          changes.push({
            file,
            additions: status === 'A' ? 1 : 0,
            deletions: status === 'D' ? 1 : 0,
            type: status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified',
            impact: 'medium'
          });
        }
      }
    }
  }
  
  return changes;
}

/**
 * Determine impact level based on changes
 */
function determineImpact(additions: number, deletions: number): 'high' | 'medium' | 'low' {
  const total = additions + deletions;
  if (total > 100) return 'high';
  if (total > 20) return 'medium';
  return 'low';
}

/**
 * Analyze log patterns in changed files
 */
async function analyzeLogPatterns(fileChanges: FileChange[]): Promise<string[]> {
  const patterns: string[] = [];
  
  for (const change of fileChanges) {
    if (change.type === 'deleted') continue;
    
    try {
      const content = await fs.readFile(change.file, 'utf-8');
      
      // Look for log patterns
      if (content.includes('console.log')) patterns.push('console.log statements');
      if (content.includes('console.warn')) patterns.push('console.warn statements');
      if (content.includes('console.error')) patterns.push('console.error statements');
      if (content.includes('fossilize')) patterns.push('fossilization calls');
      if (content.includes('monitoring')) patterns.push('monitoring references');
      if (content.includes('predictive')) patterns.push('predictive monitoring');
      if (content.includes('rate limit')) patterns.push('rate limit handling');
      if (content.includes('LLM')) patterns.push('LLM service usage');
      
    } catch (error) {
      // File might not exist or be readable
      continue;
    }
  }
  
  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Generate summary of changes
 */
function generateSummary(params: { fileChanges: FileChange[], monitoringFiles: FileChange[], schemaChanges: FileChange[], cliChanges: FileChange[] }) {
  const totalFiles = params.fileChanges.length;
  const totalAdditions = params.fileChanges.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = params.fileChanges.reduce((sum, f) => sum + f.deletions, 0);
  const highImpact = params.fileChanges.filter(f => f.impact === 'high').length;
  const newFiles = params.fileChanges.filter(f => f.type === 'added').length;
  return `Changed ${totalFiles} files (+${totalAdditions} -${totalDeletions} lines). ` +
         `${newFiles} new files, ${highImpact} high-impact changes. ` +
         `${params.monitoringFiles.length} monitoring files, ${params.schemaChanges.length} schema changes, ${params.cliChanges.length} CLI changes.`;
}

/**
 * Generate recommendations based on changes
 */
function generateRecommendations(fileChanges: FileChange[], logPatterns: string[]): string[] {
  const recommendations: string[] = [];
  
  // Check for monitoring files
  const hasMonitoringChanges = fileChanges.some(f => f.file.includes('monitoring'));
  if (hasMonitoringChanges) {
    recommendations.push('Run predictive monitoring tests to validate new features');
    recommendations.push('Check if new monitoring data is being generated correctly');
  }
  
  // Check for schema changes
  const hasSchemaChanges = fileChanges.some(f => f.file.includes('schemas'));
  if (hasSchemaChanges) {
    recommendations.push('Run type checking to ensure schema compatibility');
    recommendations.push('Update any dependent code that uses changed schemas');
  }
  
  // Check for CLI changes
  const hasCLIChanges = fileChanges.some(f => f.file.includes('cli'));
  if (hasCLIChanges) {
    recommendations.push('Test new CLI commands and options');
    recommendations.push('Update documentation for new CLI features');
  }
  
  // Check for log patterns
  if (logPatterns.includes('console.log')) {
    recommendations.push('Review console.log statements for production readiness');
  }
  
  if (logPatterns.includes('rate limit')) {
    recommendations.push('Test rate limit handling with real API calls');
  }
  
  return recommendations;
}

/**
 * Display detailed analysis
 */
function displayDetailedAnalysis(analysis: DiffAnalysis): void {
  console.log('📊 Git Diff Analysis Results');
  console.log('============================');
  console.log(`Timestamp: ${analysis.timestamp}`);
  console.log(`Commit: ${analysis.commitHash.substring(0, 8)}`);
  console.log(`Summary: ${analysis.summary}`);
  
  console.log('\n📁 Files Changed:');
  analysis.filesChanged.forEach(file => {
    console.log(`   ${file}`);
  });
  
  if (analysis.monitoringFiles.length > 0) {
    console.log('\n🔍 Monitoring Files:');
    analysis.monitoringFiles.forEach(file => {
      console.log(`   ${file}`);
    });
  }
  
  if (analysis.schemaChanges.length > 0) {
    console.log('\n📋 Schema Changes:');
    analysis.schemaChanges.forEach(file => {
      console.log(`   ${file}`);
    });
  }
  
  if (analysis.cliChanges.length > 0) {
    console.log('\n🖥️ CLI Changes:');
    analysis.cliChanges.forEach(file => {
      console.log(`   ${file}`);
    });
  }
  
  if (analysis.logPatterns.length > 0) {
    console.log('\n📝 Log Patterns Detected:');
    analysis.logPatterns.forEach(pattern => {
      console.log(`   • ${pattern}`);
    });
  }
  
  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
}

/**
 * Display summary analysis
 */
function displaySummary(analysis: DiffAnalysis): void {
  console.log('📊 Git Diff Summary');
  console.log('===================');
  console.log(`Commit: ${analysis.commitHash.substring(0, 8)}`);
  console.log(`Files: ${analysis.filesChanged.length}`);
  console.log(`Monitoring: ${analysis.monitoringFiles.length}`);
  console.log(`Schemas: ${analysis.schemaChanges.length}`);
  console.log(`CLI: ${analysis.cliChanges.length}`);
  console.log(`Log Patterns: ${analysis.logPatterns.length}`);
  console.log(`\nSummary: ${analysis.summary}`);
  
  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Top Recommendations:');
    analysis.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
}

/**
 * Track monitoring data evolution
 */
async function trackMonitoringEvolution(options: {
  days?: number;
  output?: string;
} = {}): Promise<void> {
  const { days = 7, output } = options;
  
  console.log(`📈 Tracking Monitoring Evolution (Last ${days} days)\n`);
  
  try {
    // Get commits from last N days
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];
    
    // Get commit history
    const commits = executeCommand(`git log --since="${sinceStr}" --oneline`).stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, ...message] = line.split(' ');
        return { hash, message: message.join(' ') };
      });
    
    console.log(`Found ${commits.length} commits in the last ${days} days`);
    
    // Analyze each commit for monitoring changes
    const evolution = [];
    
    for (const commit of commits) {
      try {
        const diff = executeCommand(`git show --stat --name-only ${commit.hash}`).stdout;
        
        if (diff.includes('monitoring') || diff.includes('predictive') || diff.includes('llm')) {
          evolution.push({
            commit: commit.hash,
            message: commit.message,
            timestamp: executeCommand(`git show -s --format=%ci ${commit.hash}`).stdout.trim(),
            hasMonitoringChanges: true
          });
        }
      } catch (error) {
        // Skip commits that can't be analyzed
        continue;
      }
    }
    
    console.log(`\n📊 Monitoring Evolution Summary:`);
    console.log(`   Commits with monitoring changes: ${evolution.length}`);
    
    if (evolution.length > 0) {
      console.log('\n🔄 Recent Monitoring Changes:');
      evolution.slice(0, 5).forEach(item => {
        if (item.commit) {
          console.log(`   ${item.commit.substring(0, 8)} - ${item.message}`);
        }
      });
    }
    
    if (output) {
      const evolutionData = {
        period: `${days} days`,
        totalCommits: commits.length,
        monitoringCommits: evolution.length,
        evolution
      };
      
      await fs.writeFile(output, JSON.stringify(evolutionData, null, 2));
      console.log(`\n💾 Evolution data saved to: ${output}`);
    }
    
  } catch (error) {
    console.error('❌ Evolution tracking failed:', error instanceof Error ? error.message : error);
  }
}

// Export functions for use in other scripts
export { analyzeGitDiff, trackMonitoringEvolution };

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'analyze':
      const since = args.find(arg => arg.startsWith('--since='))?.split('=')[1];
      const until = args.find(arg => arg.startsWith('--until='))?.split('=')[1];
      const output = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
      const verbose = args.includes('--verbose');
      
      await analyzeGitDiff({ since, until, output, verbose });
      break;
      
    case 'track':
      const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '7');
      const trackOutput = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
      
      await trackMonitoringEvolution({ days, output: trackOutput });
      break;
      
    default:
      console.log('Usage:');
      console.log('  bun run analyze-git-diff.ts analyze [--since=YYYY-MM-DD] [--until=YYYY-MM-DD] [--output=file.json] [--verbose]');
      console.log('  bun run analyze-git-diff.ts track [--days=7] [--output=evolution.json]');
      break;
  }
} 