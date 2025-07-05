#!/usr/bin/env bun
/**
 * Git History Insights CLI
 * 
 * Command-line interface for extracting and analyzing LLM insights from git history.
 * Provides easy access to historical insights for roadmap progress tracking and project analysis.
 * 
 * Usage:
 *   bun run src/cli/git-history-insights.ts --summary
 *   bun run src/cli/git-history-insights.ts --insights --range HEAD~30..HEAD
 *   bun run src/cli/git-history-insights.ts --roadmap-progress --since 2025-01-01
 *   bun run src/cli/git-history-insights.ts --done-tasks --author emmanuelbarrera
 *   bun run src/cli/git-history-insights.ts --automation-opportunities
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface CLIArgs {
  summary?: boolean;
  insights?: boolean;
  roadmapProgress?: boolean;
  doneTasks?: boolean;
  automationOpportunities?: boolean;
  range?: string;
  since?: string;
  author?: string;
  format?: 'json' | 'yaml' | 'markdown' | 'table';
  output?: string;
  limit?: number;
  filter?: string;
}

class GitHistoryInsightsCLI {
  private args: CLIArgs;

  constructor(args: CLIArgs) {
    this.args = args;
  }

  /**
   * Main CLI entry point
   */
  async run(args: CLIArgs): Promise<void> {
    try {
      if (args.summary) {
        await this.showSummary(args);
      } else if (args.insights) {
        await this.showInsights(args);
      } else if (args.roadmapProgress) {
        await this.showRoadmapProgress(args);
      } else if (args.doneTasks) {
        await this.showDoneTasks(args);
      } else if (args.automationOpportunities) {
        await this.showAutomationOpportunities(args);
      } else {
        // Default: show summary
        await this.showSummary(args);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  }

  /**
   * Show historical summary
   */
  private async showSummary(args: CLIArgs): Promise<void> {
    console.log('📊 Generating git history summary...');
    
    const summary = await this.getHistoricalSummary(args);
    
    if (args.format === 'table') {
      this.displaySummaryTable(summary);
    } else if (args.format === 'markdown') {
      this.displaySummaryMarkdown(summary);
    } else {
      this.displaySummaryJSON(summary, args.format);
    }
  }

  /**
   * Show individual insights
   */
  private async showInsights(args: CLIArgs): Promise<void> {
    console.log('💡 Extracting individual insights...');
    
    const summary = await this.getHistoricalSummary(args);
    const insights = summary.insights.slice(0, args.limit || 50);
    
    if (args.filter) {
      const filteredInsights = insights.filter((insight: any) => 
        insight.summary.toLowerCase().includes(args.filter!.toLowerCase()) ||
        insight.category.toLowerCase().includes(args.filter!.toLowerCase())
      );
      
      if (args.format === 'table') {
        this.displayInsightsTable(filteredInsights);
      } else {
        this.displayInsightsJSON(filteredInsights, args.format);
      }
    } else {
      if (args.format === 'table') {
        this.displayInsightsTable(insights);
      } else {
        this.displayInsightsJSON(insights, args.format);
      }
    }
  }

  /**
   * Show roadmap progress
   */
  private async showRoadmapProgress(args: CLIArgs): Promise<void> {
    console.log('🗺️ Analyzing roadmap progress...');
    
    const summary = await this.getHistoricalSummary(args);
    const roadmapProgress = summary.progress || [];
    
    if (args.format === 'table') {
      this.displayRoadmapProgressTable(roadmapProgress);
    } else {
      this.displayRoadmapProgressJSON(roadmapProgress, args.format);
    }
  }

  /**
   * Show completed tasks
   */
  private async showDoneTasks(args: CLIArgs): Promise<void> {
    console.log('✅ Finding completed tasks...');
    
    const summary = await this.getHistoricalSummary(args);
    const doneTasks = summary.progress.completedTasks;
    
    if (args.format === 'table') {
      this.displayDoneTasksTable(doneTasks);
    } else {
      this.displayDoneTasksJSON(doneTasks, args.format);
    }
  }

  /**
   * Show automation opportunities
   */
  private async showAutomationOpportunities(args: CLIArgs): Promise<void> {
    console.log('🤖 Finding automation opportunities...');
    
    const summary = await this.getHistoricalSummary(args);
    const opportunities = summary.progress.automationOpportunities;
    
    if (args.format === 'table') {
      this.displayAutomationOpportunitiesTable(opportunities);
    } else {
      this.displayAutomationOpportunitiesJSON(opportunities, args.format);
    }
  }

  /**
   * Get historical summary
   */
  private async getHistoricalSummary(args: CLIArgs): Promise<any> {
    // Try to load existing summary first
    const summaryPath = this.findLatestSummary();
    if (summaryPath && !args.range && !args.since) {
      try {
        return JSON.parse(readFileSync(summaryPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Failed to load existing summary, generating new one...');
      }
    }

    // Generate new summary using the git-history-llm-insights script
    console.log('🔄 Generating new insights summary...');
    // Note: This would need to call the actual git-history-llm-insights script
    // For now, we'll just create a placeholder summary

    // Load the newly generated summary
    const newSummaryPath = this.findLatestSummary();
    if (newSummaryPath) {
      return JSON.parse(readFileSync(newSummaryPath, 'utf8'));
    }

    throw new Error('Failed to generate or load historical summary');
  }

  /**
   * Find latest summary file
   */
  private findLatestSummary(): string | null {
    const reportsDir = join('fossils/git_history_insights/reports');
    if (!existsSync(reportsDir)) return null;

    const files = readdirSync(reportsDir)
      .filter(file => file.startsWith('git-history-report-') && file.endsWith('.json'))
      .sort()
      .reverse();

    return files.length > 0 ? join(reportsDir, files[0] || '') : null;
  }

  // Display methods for different formats
  private displaySummaryTable(summary: any): void {
    console.log('\n📊 Git History Summary');
    console.log('='.repeat(50));
    console.log(`Period: ${summary.period.start} to ${summary.period.end}`);
    console.log(`Duration: ${summary.period.duration} commits`);
    console.log(`Total Commits: ${summary.progress.totalCommits}`);
    console.log(`Total Insights: ${summary.progress.totalInsights}`);
    console.log(`Average Impact: ${summary.progress.averageImpact}`);
    console.log(`Completion Rate: ${summary.roadmapProgress.completionRate.toFixed(1)}%`);
    console.log(`Velocity: ${summary.roadmapProgress.velocity.toFixed(2)} commits/day`);
    
    console.log('\n📈 Categories:');
    Object.entries(summary.progress.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\n🤖 Automation Opportunities:');
    summary.progress.automationOpportunities.slice(0, 5).forEach((opp: any) => {
      console.log(`  • ${opp}`);
    });
    
    console.log('\n✅ Completed Tasks:');
    summary.progress.completedTasks.slice(0, 5).forEach((task: any) => {
      console.log(`  • ${task}`);
    });
  }

  private displaySummaryMarkdown(summary: any): void {
    const markdown = `# Git History Summary

## Period
- **Start**: ${summary.period.start}
- **End**: ${summary.period.end}
- **Duration**: ${summary.period.duration} commits

## Progress
- **Total Commits**: ${summary.progress.totalCommits}
- **Total Insights**: ${summary.progress.totalInsights}
- **Average Impact**: ${summary.progress.averageImpact}
- **Completion Rate**: ${summary.roadmapProgress.completionRate.toFixed(1)}%
- **Velocity**: ${summary.roadmapProgress.velocity.toFixed(2)} commits/day

## Categories
${Object.entries(summary.progress.categories)
  .map(([category, count]) => `- **${category}**: ${count}`)
  .join('\n')}

## Automation Opportunities
${summary.progress.automationOpportunities
  .map((opp: any) => `- ${opp}`)
  .join('\n')}

## Completed Tasks
${summary.progress.completedTasks
  .map((task: any) => `- ${task}`)
  .join('\n')}
`;

    if (this.args.output) {
      writeFileSync(this.args.output, markdown);
      console.log(`📄 Markdown saved to: ${this.args.output}`);
    } else {
      console.log(markdown);
    }
  }

  private displaySummaryJSON(summary: any, format?: string): void {
    const output = format === 'yaml' ? 
      this.convertToYAML(summary) : 
      JSON.stringify(summary, null, 2);

    if (this.args.output) {
      writeFileSync(this.args.output, output);
      console.log(`📄 ${format?.toUpperCase() || 'JSON'} saved to: ${this.args.output}`);
    } else {
      console.log(output);
    }
  }

  private displayInsightsTable(insights: any[]): void {
    console.log('\n💡 LLM Insights');
    console.log('='.repeat(100));
    console.log('Date | Impact | Category | Summary');
    console.log('-'.repeat(100));
    
    insights.forEach(insight => {
      const summary = insight.summary.length > 60 ? 
        insight.summary.substring(0, 60) + '...' : 
        insight.summary;
      console.log(`${insight.date || 'N/A'} | ${insight.impact} | ${insight.category} | ${summary}`);
    });
  }

  private displayInsightsJSON(insights: any[], format?: string): void {
    const output = format === 'yaml' ? 
      this.convertToYAML(insights) : 
      JSON.stringify(insights, null, 2);

    if (this.args.output) {
      writeFileSync(this.args.output, output);
      console.log(`📄 ${format?.toUpperCase() || 'JSON'} saved to: ${this.args.output}`);
    } else {
      console.log(output);
    }
  }

  private displayRoadmapProgressTable(progress: any[]): void {
    console.log('\n🗺️ Roadmap Progress');
    console.log('='.repeat(120));
    console.log('Task | Status | Velocity | Completion | Last Update');
    console.log('-'.repeat(120));
    
    progress.forEach(task => {
      const completion = task.progress.completionDate ? 
        new Date(task.progress.completionDate).toLocaleDateString() : 
        'In Progress';
      const lastUpdate = new Date(task.progress.lastUpdate).toLocaleDateString();
      console.log(`${task.taskTitle.substring(0, 30)} | ${task.status} | ${task.progress.velocity.toFixed(2)} | ${completion} | ${lastUpdate}`);
    });
  }

  private displayRoadmapProgressJSON(progress: any[], format?: string): void {
    const output = format === 'yaml' ? 
      this.convertToYAML(progress) : 
      JSON.stringify(progress, null, 2);

    if (this.args.output) {
      writeFileSync(this.args.output, output);
      console.log(`📄 ${format?.toUpperCase() || 'JSON'} saved to: ${this.args.output}`);
    } else {
      console.log(output);
    }
  }

  private displayDoneTasksTable(tasks: string[]): void {
    console.log('\n✅ Completed Tasks');
    console.log('='.repeat(50));
    
    if (tasks.length === 0) {
      console.log('No completed tasks found in the specified period.');
      return;
    }
    
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task}`);
    });
  }

  private displayDoneTasksJSON(tasks: string[], format?: string): void {
    const output = format === 'yaml' ? 
      this.convertToYAML(tasks) : 
      JSON.stringify(tasks, null, 2);

    if (this.args.output) {
      writeFileSync(this.args.output, output);
      console.log(`📄 ${format?.toUpperCase() || 'JSON'} saved to: ${this.args.output}`);
    } else {
      console.log(output);
    }
  }

  private displayAutomationOpportunitiesTable(opportunities: string[]): void {
    console.log('\n🤖 Automation Opportunities');
    console.log('='.repeat(50));
    
    if (opportunities.length === 0) {
      console.log('No automation opportunities found in the specified period.');
      return;
    }
    
    opportunities.forEach((opportunity, index) => {
      console.log(`${index + 1}. ${opportunity}`);
    });
  }

  private displayAutomationOpportunitiesJSON(opportunities: string[], format?: string): void {
    const output = format === 'yaml' ? 
      this.convertToYAML(opportunities) : 
      JSON.stringify(opportunities, null, 2);

    if (this.args.output) {
      writeFileSync(this.args.output, output);
      console.log(`📄 ${format?.toUpperCase() || 'JSON'} saved to: ${this.args.output}`);
    } else {
      console.log(output);
    }
  }

  private convertToYAML(data: any): string {
    // Simplified YAML conversion - in production, use proper YAML library
    return JSON.stringify(data, null, 2);
  }
}

// CLI setup
const program = new Command();

program
  .name('git-history-insights')
  .description('Extract and analyze LLM insights from git history')
  .version('1.0.0');

program
  .option('--summary', 'Show historical summary')
  .option('--insights', 'Show individual insights')
  .option('--roadmap-progress', 'Show roadmap progress')
  .option('--done-tasks', 'Show completed tasks')
  .option('--automation-opportunities', 'Show automation opportunities')
  .option('--range <range>', 'Git commit range (e.g., HEAD~30..HEAD)')
  .option('--since <date>', 'Since date (e.g., 2025-01-01)')
  .option('--author <author>', 'Filter by author')
  .option('--format <format>', 'Output format: json, yaml, markdown, table', 'json')
  .option('--output <file>', 'Output file')
  .option('--limit <number>', 'Limit number of results', '50')
  .option('--filter <text>', 'Filter results by text');

program.action(async (options) => {
  const cli = new GitHistoryInsightsCLI({});
  await cli.run(options);
});

// Main execution
if (import.meta.main) {
  program.parse();
} 