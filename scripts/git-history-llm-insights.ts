#!/usr/bin/env bun
/**
 * Git History LLM Insights Extractor
 * 
 * Extracts LLM insights from git history, generates historical summaries,
 * and tracks roadmap progress with structured data for project progress tracking.
 * 
 * Usage:
 *   bun run scripts/git-history-llm-insights.ts --range HEAD~30..HEAD
 *   bun run scripts/git-history-llm-insights.ts --since 2025-01-01
 *   bun run scripts/git-history-llm-insights.ts --author emmanuelbarrera
 *   bun run scripts/git-history-llm-insights.ts --roadmap-progress
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { formatISO, parseISO, subDays } from 'date-fns';
import { LLMService } from '../src/services/llm';
import { fossilizeLLMInsight } from '../src/utils/fossilize';
import { LLMInsightFossil } from '../src/types/llmFossil';

// Types for git history analysis
interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  changes: FileChange[];
  llmInsights?: LLMInsightData;
  conventionalFormat: boolean;
  type?: string;
  scope?: string;
  description?: string;
  breakingChange: boolean;
  issues: string[];
}

interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  content?: string;
}

interface LLMInsightData {
  summary: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  blockers: string[];
  recommendations: string[];
  automationOpportunities: string[];
  roadmapImpact?: {
    affectedTasks: string[];
    newTasks: string[];
    completedTasks: string[];
  };
  done?: {
    retrospective: string;
    insights: string[];
    completedAt: string;
    lessonsLearned: string[];
  };
}

interface HistoricalSummary {
  period: {
    start: string;
    end: string;
    duration: number;
  };
  commits: GitCommit[];
  insights: LLMInsightData[];
  progress: {
    totalCommits: number;
    totalInsights: number;
    averageImpact: string;
    categories: Record<string, number>;
    automationOpportunities: string[];
    completedTasks: string[];
    newTasks: string[];
  };
  roadmapProgress: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksPlanned: number;
    completionRate: number;
    velocity: number;
  };
  fossils: {
    created: number;
    updated: number;
    insights: string[];
  };
}

interface RoadmapProgress {
  taskId: string;
  taskTitle: string;
  status: string;
  progress: {
    startDate: string;
    lastUpdate: string;
    completionDate?: string;
    commits: string[];
    insights: LLMInsightData[];
    velocity: number;
    blockers: string[];
    achievements: string[];
  };
  llmInsights: {
    summary: string;
    blockers: string[];
    recommendations: string[];
    impact: string;
    done?: {
      retrospective: string;
      insights: string[];
      completedAt: string;
    };
  };
}

class GitHistoryLLMInsightsExtractor {
  private llmService: LLMService;
  private fossilsDir: string;

  constructor() {
    this.llmService = new LLMService();
    this.fossilsDir = 'fossils/git_history_insights';
    this.ensureFossilsDir();
  }

  /**
   * Ensure fossils directory exists
   */
  private ensureFossilsDir(): void {
    if (!existsSync(this.fossilsDir)) {
      mkdirSync(this.fossilsDir, { recursive: true });
    }
  }

  /**
   * Main entry point for git history analysis
   */
  async extractInsights(params: {
    range?: string;
    since?: string;
    author?: string;
    roadmapProgress?: boolean;
    outputFormat?: 'json' | 'yaml' | 'markdown';
  }): Promise<void> {
    try {
      console.log('🧠 Extracting LLM insights from git history...');

      // 1. Get git commits
      const commits = await this.getGitCommits(params);
      console.log(`📊 Found ${commits.length} commits to analyze`);

      // 2. Extract LLM insights from commits
      const commitsWithInsights = await this.extractCommitInsights(commits);
      console.log(`💡 Extracted insights from ${commitsWithInsights.length} commits`);

      // 3. Generate historical summary
      const summary = await this.generateHistoricalSummary(commitsWithInsights);
      console.log(`📈 Generated historical summary for period: ${summary.period.start} to ${summary.period.end}`);

      // 4. Track roadmap progress if requested
      if (params.roadmapProgress) {
        const roadmapProgress = await this.trackRoadmapProgress(commitsWithInsights);
        console.log(`🗺️ Tracked progress for ${roadmapProgress.length} roadmap tasks`);
      }

      // 5. Create fossils
      await this.createHistoricalFossils(summary);
      console.log(`🦴 Created historical fossils`);

      // 6. Generate reports
      await this.generateReports(summary, params.outputFormat);
      console.log(`📄 Generated reports in ${params.outputFormat || 'json'} format`);

      console.log('✅ Git history LLM insights extraction completed');
    } catch (error) {
      console.error('❌ Error extracting git history insights:', error);
      process.exit(1);
    }
  }

  /**
   * Get git commits based on parameters
   */
  private async getGitCommits(params: any): Promise<GitCommit[]> {
    const { range, since, author } = params;
    
    let gitCommand = 'git log --pretty=format:"%H|%an|%ad|%s" --date=iso';
    
    if (range) {
      gitCommand += ` ${range}`;
    } else if (since) {
      gitCommand += ` --since="${since}"`;
    }
    
    if (author) {
      gitCommand += ` --author="${author}"`;
    }
    
    const output = execSync(gitCommand, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    
    const commits: GitCommit[] = [];
    
    for (const line of lines) {
      const [hash, author, date, message] = line.split('|');
      
      if (hash && author && date && message) {
        const changes = await this.getCommitChanges(hash);
        const conventionalFormat = this.isConventionalCommit(message);
        
        commits.push({
          hash,
          author,
          date,
          message,
          changes,
          conventionalFormat,
          type: conventionalFormat ? this.extractCommitType(message) : undefined,
          scope: conventionalFormat ? this.extractCommitScope(message) : undefined,
          description: conventionalFormat ? this.extractCommitDescription(message) : message,
          breakingChange: message.includes('BREAKING CHANGE'),
          issues: conventionalFormat ? this.extractIssues(message) : []
        });
      }
    }
    
    return commits;
  }

  /**
   * Extract LLM insights from commits
   */
  private async extractCommitInsights(commits: GitCommit[]): Promise<GitCommit[]> {
    const commitsWithInsights: GitCommit[] = [];

    for (const commit of commits) {
      try {
        // Check if commit already has LLM insights in message
        const existingInsights = this.extractLLMInsightsFromMessage(commit.message);
        
        if (existingInsights) {
          commit.llmInsights = existingInsights;
        } else {
          // Generate new insights using LLM
          commit.llmInsights = await this.generateCommitInsights(commit);
        }

        commitsWithInsights.push(commit);
      } catch (error) {
        console.warn(`⚠️ Failed to extract insights for commit ${commit.hash}:`, error);
        commitsWithInsights.push(commit);
      }
    }

    return commitsWithInsights;
  }

  /**
   * Extract LLM insights from commit message
   */
  private extractLLMInsightsFromMessage(message: string): LLMInsightData | null {
    if (!message) return null;
    
    const insight = {
      type: this.extractCommitType(message) || 'unknown',
      scope: this.extractCommitScope(message) || 'none',
      description: this.extractCommitDescription(message),
      breakingChange: message.includes('BREAKING CHANGE'),
      issues: this.extractIssues(message)
    };

    return {
      summary: insight.description,
      impact: 'medium',
      category: insight.type,
      blockers: [],
      recommendations: [],
      automationOpportunities: [],
      roadmapImpact: {
        affectedTasks: [],
        newTasks: [],
        completedTasks: []
      },
      done: {
        retrospective: 'Commit completed',
        insights: ['Standard commit analysis'],
        completedAt: new Date().toISOString(),
        lessonsLearned: []
      }
    };
  }

  /**
   * Generate LLM insights for a commit
   */
  private async generateCommitInsights(commit: GitCommit): Promise<LLMInsightData> {
    const prompt = this.buildInsightPrompt(commit);
    
    try {
      const response = await this.llmService.callLLM({
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer and automation specialist. Analyze commits and provide structured insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama2',
        temperature: 0.3
      });

      return this.parseInsightResponse(response, commit);
    } catch (error) {
      console.warn(`⚠️ LLM call failed for commit ${commit.hash}, using fallback`);
      return this.generateFallbackInsights(commit);
    }
  }

  /**
   * Build prompt for LLM insight generation
   */
  private buildInsightPrompt(commit: GitCommit): string {
    const changeSummary = commit.changes.map(change => 
      `${change.status}: ${change.path} (+${change.additions}, -${change.deletions})`
    ).join('\n');

    return `
Analyze this commit and provide structured insights:

Commit: ${commit.message}
Type: ${commit.type || 'unknown'}
Scope: ${commit.scope || 'none'}
Breaking Change: ${commit.breakingChange}
Issues: ${commit.issues.join(', ')}

Changes:
${changeSummary}

Provide insights in this JSON format:
{
  "summary": "Brief summary of the commit",
  "impact": "low|medium|high",
  "category": "feature|bugfix|refactor|docs|test|automation|fossilization",
  "blockers": ["list of potential blockers"],
  "recommendations": ["actionable recommendations"],
  "automationOpportunities": ["automation opportunities"],
  "roadmapImpact": {
    "affectedTasks": ["task IDs or descriptions"],
    "newTasks": ["new tasks to consider"],
    "completedTasks": ["completed tasks"]
  },
  "done": {
    "retrospective": "What was accomplished",
    "insights": ["key insights learned"],
    "completedAt": "${commit.date}",
    "lessonsLearned": ["lessons learned from this work"]
  }
}
`;
  }

  /**
   * Parse LLM response into structured insights
   */
  private parseInsightResponse(response: string, commit: GitCommit): LLMInsightData {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          done: parsed.done ? {
            ...parsed.done,
            completedAt: commit.date
          } : undefined
        };
      }
      
      return this.generateFallbackInsights(commit);
    } catch (error) {
      return this.generateFallbackInsights(commit);
    }
  }

  /**
   * Generate fallback insights
   */
  private generateFallbackInsights(commit: GitCommit): LLMInsightData {
    return {
      summary: commit.description || 'Commit analysis completed',
      impact: 'medium',
      category: 'general',
      blockers: [],
      recommendations: ['Review changes manually', 'Consider adding tests'],
      automationOpportunities: ['Automate similar changes in the future'],
      roadmapImpact: {
        affectedTasks: [],
        newTasks: [],
        completedTasks: []
      },
      done: {
        retrospective: 'Commit completed successfully',
        insights: ['Manual review recommended'],
        completedAt: commit.date,
        lessonsLearned: ['Consider automated testing']
      }
    };
  }

  /**
   * Generate historical summary
   */
  private async generateHistoricalSummary(commits: GitCommit[]): Promise<HistoricalSummary> {
    const insights = commits.map(c => c.llmInsights).filter(Boolean) as LLMInsightData[];
    
    const summary: HistoricalSummary = {
      period: {
        start: commits[commits.length - 1]?.date || '',
        end: commits[0]?.date || '',
        duration: commits.length
      },
      commits,
      insights,
      progress: {
        totalCommits: commits.length,
        totalInsights: insights.length,
        averageImpact: this.calculateAverageImpact(insights),
        categories: this.analyzeCategories(insights),
        automationOpportunities: this.extractAutomationOpportunities(insights),
        completedTasks: this.extractCompletedTasks(insights),
        newTasks: this.extractNewTasks(insights)
      },
      roadmapProgress: await this.calculateRoadmapProgress(commits, insights),
      fossils: {
        created: insights.length,
        updated: 0,
        insights: insights.map(i => i.summary)
      }
    };

    return summary;
  }

  /**
   * Track roadmap progress
   */
  private async trackRoadmapProgress(commits: GitCommit[]): Promise<RoadmapProgress[]> {
    const roadmapPath = 'fossils/roadmap.yml';
    
    if (!existsSync(roadmapPath)) {
      console.warn('⚠️ Roadmap not found, skipping roadmap progress tracking');
      return [];
    }

    try {
      const roadmap = this.loadRoadmap(roadmapPath);
      const progress: RoadmapProgress[] = [];

      for (const task of roadmap.tasks || []) {
        const taskCommits = this.findCommitsForTask(commits, task);
        const taskInsights = taskCommits.map(c => c.llmInsights).filter(Boolean) as LLMInsightData[];

        if (taskCommits.length > 0) {
          progress.push({
            taskId: task.id || 'unknown',
            taskTitle: task.task || 'Unknown Task',
            status: task.status || 'unknown',
            progress: {
              startDate: taskCommits[taskCommits.length - 1]?.date || '',
              lastUpdate: taskCommits[0]?.date || '',
              completionDate: task.status === 'done' ? taskCommits[0]?.date : undefined,
              commits: taskCommits.map(c => c.hash),
              insights: taskInsights,
              velocity: this.calculateTaskVelocity(taskCommits),
              blockers: this.extractTaskBlockers(taskInsights),
              achievements: this.extractTaskAchievements(taskInsights)
            },
            llmInsights: this.aggregateTaskInsights(taskInsights)
          });
        }
      }

      return progress;
    } catch (error) {
      console.warn('⚠️ Failed to track roadmap progress:', error);
      return [];
    }
  }

  /**
   * Create historical fossils
   */
  private async createHistoricalFossils(summary: HistoricalSummary): Promise<void> {
    const fossil: LLMInsightFossil = {
      type: 'insight',
      timestamp: formatISO(new Date()),
      model: 'llama2',
      provider: 'ollama',
      excerpt: `Historical summary: ${summary.progress.totalCommits} commits, ${summary.progress.totalInsights} insights`,
      promptId: 'git-history-analysis-v1',
      promptVersion: 'v1',
      prompt: `Analyze git history for period ${summary.period.start} to ${summary.period.end}`,
      systemMessage: 'You are an expert project analyst and automation specialist.',
      inputHash: `history-${summary.period.start}-${summary.period.end}`,
      commitRef: 'HEAD',
      response: JSON.stringify(summary, null, 2)
    };

    await fossilizeLLMInsight(fossil);

    // Save detailed summary
    const summaryPath = join(this.fossilsDir, `historical-summary-${Date.now()}.json`);
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }

  /**
   * Generate reports
   */
  private async generateReports(summary: HistoricalSummary, format?: string): Promise<void> {
    const reportsDir = join(this.fossilsDir, 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = formatISO(new Date());
    const baseName = `git-history-report-${timestamp}`;

    switch (format) {
      case 'yaml':
        const yamlPath = join(reportsDir, `${baseName}.yml`);
        writeFileSync(yamlPath, this.convertToYAML(summary));
        console.log(`📄 YAML report: ${yamlPath}`);
        break;

      case 'markdown':
        const mdPath = join(reportsDir, `${baseName}.md`);
        writeFileSync(mdPath, this.convertToMarkdown(summary));
        console.log(`📄 Markdown report: ${mdPath}`);
        break;

      default:
        const jsonPath = join(reportsDir, `${baseName}.json`);
        writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
        console.log(`📄 JSON report: ${jsonPath}`);
    }
  }

  // Utility methods for git operations
  private async getCommitChanges(hash: string): Promise<FileChange[]> {
    const output = execSync(`git show --name-status --numstat ${hash}`, { encoding: 'utf8' });
    return this.parseGitDiff(output);
  }

  private parseGitDiff(output: string): FileChange[] {
    const changes: FileChange[] = [];
    const lines = output.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        changes.push({
          path: parts[2] || '',
          status: this.parseStatus(parts[0] || ''),
          additions: parseInt(parts[0] || '0') || 0,
          deletions: parseInt(parts[1] || '0') || 0
        });
      }
    }
    
    return changes;
  }

  private parseStatus(status: string): 'added' | 'modified' | 'deleted' | 'renamed' {
    switch (status) {
      case 'A': return 'added';
      case 'M': return 'modified';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      default: return 'modified';
    }
  }

  private isConventionalCommit(message: string): boolean {
    return /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:/.test(message);
  }

  private extractCommitType(message: string): string | undefined {
    const match = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf)/);
    return match?.[1];
  }

  private extractCommitScope(message: string): string | undefined {
    const match = message.match(/^[^(]+\(([^)]+)\):/);
    return match?.[1];
  }

  private extractCommitDescription(message: string): string {
    const match = message.match(/^[^:]+:\s*(.+)$/);
    return match?.[1] || message;
  }

  private extractIssues(message: string): string[] {
    const issueRegex = /#(\d+)/g;
    const matches = message.match(issueRegex);
    return matches ? matches.map(match => match.slice(1)) : [];
  }

  // Analysis methods
  private calculateAverageImpact(insights: LLMInsightData[]): string {
    if (insights.length === 0) return 'medium';
    
    const impactScores = insights.map(i => i.impact === 'high' ? 3 : i.impact === 'medium' ? 2 : 1);
    const average = impactScores.reduce((sum, score) => sum + score, 0) / impactScores.length;
    
    if (average >= 2.5) return 'high';
    if (average >= 1.5) return 'medium';
    return 'low';
  }

  private analyzeCategories(insights: LLMInsightData[]): Record<string, number> {
    const categories: Record<string, number> = {};
    for (const insight of insights) {
      categories[insight.category] = (categories[insight.category] || 0) + 1;
    }
    return categories;
  }

  private extractAutomationOpportunities(insights: LLMInsightData[]): string[] {
    const opportunities: string[] = [];
    for (const insight of insights) {
      opportunities.push(...insight.automationOpportunities);
    }
    return [...new Set(opportunities)];
  }

  private extractCompletedTasks(insights: LLMInsightData[]): string[] {
    const tasks: string[] = [];
    for (const insight of insights) {
      if (insight.roadmapImpact?.completedTasks) {
        tasks.push(...insight.roadmapImpact.completedTasks);
      }
    }
    return [...new Set(tasks)];
  }

  private extractNewTasks(insights: LLMInsightData[]): string[] {
    const tasks: string[] = [];
    for (const insight of insights) {
      if (insight.roadmapImpact?.newTasks) {
        tasks.push(...insight.roadmapImpact.newTasks);
      }
    }
    return [...new Set(tasks)];
  }

  private async calculateRoadmapProgress(commits: GitCommit[], insights: LLMInsightData[]): Promise<any> {
    // Simplified calculation - in production, load actual roadmap
    const completedTasks = this.extractCompletedTasks(insights);
    const totalTasks = completedTasks.length + Math.floor(insights.length * 0.3); // Estimate
    
    return {
      tasksCompleted: completedTasks.length,
      tasksInProgress: Math.floor(insights.length * 0.2),
      tasksPlanned: Math.floor(insights.length * 0.1),
      completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
      velocity: commits.length / 30 // commits per day (assuming 30-day period)
    };
  }

  private findCommitsForTask(commits: GitCommit[], task: any): GitCommit[] {
    // Simplified matching - in production, use more sophisticated matching
    return commits.filter(commit => 
      commit.message.toLowerCase().includes(task.task?.toLowerCase() || '') ||
      commit.llmInsights?.roadmapImpact?.affectedTasks?.some(t => 
        t.toLowerCase().includes(task.task?.toLowerCase() || '')
      )
    );
  }

  private calculateTaskVelocity(commits: GitCommit[]): number {
    if (commits.length < 2) return 0;
    
    const firstCommit = parseISO(commits[commits.length - 1]?.date || new Date().toISOString());
    const lastCommit = parseISO(commits[0]?.date || new Date().toISOString());
    const days = (lastCommit.getTime() - firstCommit.getTime()) / (1000 * 60 * 60 * 24);
    
    return days > 0 ? commits.length / days : 0;
  }

  private extractTaskBlockers(insights: LLMInsightData[]): string[] {
    const blockers: string[] = [];
    for (const insight of insights) {
      blockers.push(...insight.blockers);
    }
    return [...new Set(blockers)];
  }

  private extractTaskAchievements(insights: LLMInsightData[]): string[] {
    const achievements: string[] = [];
    for (const insight of insights) {
      if (insight.done?.insights) {
        achievements.push(...insight.done.insights);
      }
    }
    return [...new Set(achievements)];
  }

  private aggregateTaskInsights(insights: LLMInsightData[]): any {
    if (insights.length === 0) {
      return {
        summary: 'No insights available',
        blockers: [],
        recommendations: [],
        impact: 'medium'
      };
    }

    const latestInsight = insights[0];
    return {
      summary: latestInsight?.summary || 'No insights available',
      blockers: this.extractTaskBlockers(insights),
      recommendations: this.aggregateRecommendations(insights),
      impact: this.calculateAverageImpact(insights),
      done: latestInsight?.done || false
    };
  }

  private aggregateRecommendations(insights: LLMInsightData[]): string[] {
    const recommendations: string[] = [];
    for (const insight of insights) {
      recommendations.push(...insight.recommendations);
    }
    return [...new Set(recommendations)];
  }

  private loadRoadmap(path: string): any {
    const content = readFileSync(path, 'utf8');
    // Simplified parsing - in production, use proper YAML parser
    return { tasks: [] };
  }

  private convertToYAML(summary: HistoricalSummary): string {
    // Simplified YAML conversion - in production, use proper YAML library
    return JSON.stringify(summary, null, 2);
  }

  private convertToMarkdown(summary: HistoricalSummary): string {
    return `# Git History LLM Insights Report

## Period
- **Start**: ${summary.period.start}
- **End**: ${summary.period.end}
- **Duration**: ${summary.period.duration} commits

## Progress Summary
- **Total Commits**: ${summary.progress.totalCommits}
- **Total Insights**: ${summary.progress.totalInsights}
- **Average Impact**: ${summary.progress.averageImpact}
- **Completion Rate**: ${summary.roadmapProgress.completionRate.toFixed(1)}%

## Categories
${Object.entries(summary.progress.categories)
  .map(([category, count]) => `- **${category}**: ${count}`)
  .join('\n')}

## Automation Opportunities
${summary.progress.automationOpportunities
  .map(opp => `- ${opp}`)
  .join('\n')}

## Completed Tasks
${summary.progress.completedTasks
  .map(task => `- ${task}`)
  .join('\n')}

## New Tasks
${summary.progress.newTasks
  .map(task => `- ${task}`)
  .join('\n')}

## Fossils Created
- **Total**: ${summary.fossils.created}
- **Updated**: ${summary.fossils.updated}

## Key Insights
${summary.fossils.insights
  .slice(0, 10)
  .map(insight => `- ${insight}`)
  .join('\n')}
`;
  }
}

// CLI argument parsing
function parseArgs(): any {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--range':
        params.range = args[++i];
        break;
      case '--since':
        params.since = args[++i];
        break;
      case '--author':
        params.author = args[++i];
        break;
      case '--roadmap-progress':
        params.roadmapProgress = true;
        break;
      case '--format':
        params.outputFormat = args[++i];
        break;
      case '--help':
        console.log(`
Usage: bun run scripts/git-history-llm-insights.ts [options]

Options:
  --range <range>         Analyze commit range (e.g., HEAD~30..HEAD)
  --since <date>          Analyze commits since date (e.g., 2025-01-01)
  --author <author>       Filter by author
  --roadmap-progress      Track roadmap progress
  --format <format>       Output format: json, yaml, markdown
  --help                  Show this help message

Examples:
  bun run scripts/git-history-llm-insights.ts --range HEAD~30..HEAD
  bun run scripts/git-history-llm-insights.ts --since 2025-01-01
  bun run scripts/git-history-llm-insights.ts --author emmanuelbarrera --roadmap-progress
        `);
        process.exit(0);
    }
  }

  return params;
}

// Main execution
async function main() {
  const params = parseArgs();
  const extractor = new GitHistoryLLMInsightsExtractor();
  await extractor.extractInsights(params);
}

if (import.meta.main) {
  main().catch(console.error);
} 