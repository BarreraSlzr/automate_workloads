#!/usr/bin/env bun
/**
 * Commit Insight Generator
 * 
 * Generates LLM insights for commits and integrates them with roadmap.yml
 * following the LLM Insights Commit Traceability System.
 * 
 * Usage:
 *   bun run scripts/commit-insight-generator.ts --commit HEAD
 *   bun run scripts/commit-insight-generator.ts --range HEAD~5..HEAD
 *   bun run scripts/commit-insight-generator.ts --staged
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { formatISO } from 'date-fns';
import { LLMService } from '../src/services/llm';
import { fossilizeLLMInsight } from '../src/utils/llmFossilManager';
import { executeCommand } from '@/utils/cli';
import { parseJsonSafe } from '@/utils/json';

// Types for commit insight system
interface CommitAnalysis {
  hash: string;
  message: string;
  author: string;
  date: string;
  changes: FileChange[];
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

interface LLMCommitInsight {
  commitHash: string;
  commitMessage: string;
  insights: {
    summary: string;
    impact: 'low' | 'medium' | 'high';
    category: string;
    blockers: string[];
    recommendations: string[];
    automationOpportunities: string[];
  };
  roadmapIntegration: {
    affectedTasks: string[];
    newTasks: string[];
    updatedStatus: string[];
  };
  fossilMetadata: {
    fossilId: string;
    timestamp: string;
    model: string;
    provider: string;
  };
}

interface RoadmapInsightUpdate {
  taskId: string;
  llmInsights: {
    summary: string;
    blockers: string[];
    recommendations: string[];
    impact: string;
    deadline?: string;
    done?: {
      retrospective: string;
      insights: string[];
      completedAt: string;
    };
  };
  commitReference: string;
  fossilId: string;
}

class CommitInsightGenerator {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService({ owner: 'BarreraSlzr', repo: 'automate_workloads' });
  }

  /**
   * Main entry point for commit insight generation
   */
  async generateInsights(params: {
    commit?: string;
    range?: string;
    staged?: boolean;
    outputFormat?: 'json' | 'yaml' | 'markdown';
  }): Promise<void> {
    try {
      console.log('🧠 Generating commit insights...');

      if (params.staged) {
        await this.generateStagedInsights();
      } else if (params.range) {
        await this.generateRangeInsights(params.range, params.outputFormat);
      } else if (params.commit) {
        await this.generateCommitInsights(params.commit);
      } else {
        console.error('❌ Please specify --commit, --range, or --staged');
        process.exit(1);
      }

      console.log('✅ Commit insights generated successfully');
    } catch (error) {
      console.error('❌ Error generating commit insights:', error);
      process.exit(1);
    }
  }

  /**
   * Generate insights for staged changes
   */
  private async generateStagedInsights(): Promise<void> {
    const stagedChanges = await this.getStagedChanges();
    const commitMessage = await this.getCommitMessage();
    
    const insights = await this.generateCommitInsight({
      commitHash: 'HEAD',
      commitMessage,
      changes: stagedChanges,
      llmService: this.llmService
    });

    await this.createInsightFossil(insights);
    await this.updateRoadmapWithInsights(insights);
    await this.enhanceCommitMessage(commitMessage, insights);
  }

  /**
   * Generate insights for a specific commit
   */
  private async generateCommitInsights(commitHash: string): Promise<void> {
    const commit = await this.getCommit(commitHash);
    const changes = await this.getCommitChanges(commitHash);
    
    const insights = await this.generateCommitInsight({
      commitHash,
      commitMessage: commit.message,
      changes,
      llmService: this.llmService
    });

    await this.createInsightFossil(insights);
    await this.updateRoadmapWithInsights(insights);
    
    console.log(`📊 Insights generated for commit ${commitHash}`);
    console.log(`   Summary: ${insights.insights.summary}`);
    console.log(`   Impact: ${insights.insights.impact}`);
    console.log(`   Fossil ID: ${insights.fossilMetadata.fossilId}`);
  }

  /**
   * Generate insights for a range of commits
   */
  private async generateRangeInsights(range: string, outputFormat?: string): Promise<void> {
    const commits = await this.getCommitsInRange(range);
    const results: LLMCommitInsight[] = [];

    console.log(`📈 Processing ${commits.length} commits in range ${range}...`);

    for (const commit of commits) {
      const changes = await this.getCommitChanges(commit.hash);
      const insights = await this.generateCommitInsight({
        commitHash: commit.hash,
        commitMessage: commit.message,
        changes,
        llmService: this.llmService
      });

      results.push(insights);
      await this.createInsightFossil(insights);
      await this.updateRoadmapWithInsights(insights);
    }

    // Generate batch report
    const report = await this.generateBatchReport(results, outputFormat);
    console.log(`✅ Processed ${results.length} commits`);
    console.log(`📄 Report saved to: ${report.path}`);
  }

  /**
   * Generate LLM insights for a commit
   */
  private async generateCommitInsight(params: {
    commitHash: string;
    commitMessage: string;
    changes: FileChange[];
    llmService: LLMService;
  }): Promise<LLMCommitInsight> {
    const commit = this.parseConventionalCommit(params.commitMessage);
    const changesAnalysis = await this.analyzeChanges(params.changes);
    const insights = await this.generateLLMInsights({
      commit,
      changes: changesAnalysis,
      llm: params.llmService
    });

    const llmCommitInsight: LLMCommitInsight = {
      commitHash: params.commitHash,
      commitMessage: params.commitMessage,
      insights,
      roadmapIntegration: await this.getRoadmapIntegration(insights),
      fossilMetadata: {
        fossilId: `commit-insight-${params.commitHash}`,
        timestamp: formatISO(new Date()),
        model: 'llama2',
        provider: 'ollama'
      }
    };

    await this.createInsightFossil(llmCommitInsight);
    
    return llmCommitInsight;
  }

  /**
   * Parse conventional commit message
   */
  private parseConventionalCommit(message: string): CommitAnalysis {
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:\s+(.+)$/;
    const match = message.match(conventionalRegex);
    
    return {
      hash: 'HEAD',
      message,
      author: '',
      date: '',
      changes: [],
      conventionalFormat: !!match,
      type: match?.[1] || undefined,
      scope: match?.[2]?.slice(1, -1) || undefined,
      description: match?.[3] || message,
      breakingChange: message.includes('BREAKING CHANGE'),
      issues: this.extractIssues(message)
    };
  }

  /**
   * Analyze file changes
   */
  private async analyzeChanges(changes: FileChange[]): Promise<any> {
    const analysis = {
      totalFiles: changes.length,
      totalAdditions: changes.reduce((sum, change) => sum + change.additions, 0),
      totalDeletions: changes.reduce((sum, change) => sum + change.deletions, 0),
      fileTypes: this.analyzeFileTypes(changes),
      patterns: this.analyzePatterns(changes)
    };

    return analysis;
  }

  /**
   * Generate LLM insights using the LLM service
   */
  private async generateLLMInsights(params: {
    commit: CommitAnalysis;
    changes: any;
    llm: LLMService;
  }): Promise<any> {
    const prompt = this.buildInsightPrompt(params.commit, params.changes);
    
    try {
      const response = await params.llm.callLLM({
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer and automation specialist. Analyze commits and provide actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama2',
        temperature: 0.3
      });

      return this.parseLLMResponse(response);
    } catch (error) {
      console.warn('⚠️ LLM call failed, using fallback analysis');
      return this.generateFallbackInsights(params.commit, params.changes);
    }
  }

  /**
   * Build prompt for LLM insight generation
   */
  private buildInsightPrompt(commit: CommitAnalysis, changes: any): string {
    return `
Analyze this commit and provide structured insights:

Commit: ${commit.message}
Type: ${commit.type || 'unknown'}
Scope: ${commit.scope || 'none'}
Breaking Change: ${commit.breakingChange}

Changes:
- Files modified: ${changes.totalFiles}
- Lines added: ${changes.totalAdditions}
- Lines deleted: ${changes.totalDeletions}
- File types: ${Object.keys(changes.fileTypes).join(', ')}

Provide insights in this JSON format:
{
  "summary": "Brief summary of the commit",
  "impact": "low|medium|high",
  "category": "feature|bugfix|refactor|docs|test|automation",
  "blockers": ["list of potential blockers"],
  "recommendations": ["actionable recommendations"],
  "automationOpportunities": ["automation opportunities"]
}
`;
  }

  /**
   * Parse LLM response into structured insights
   */
  private parseLLMResponse(response: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return parseJsonSafe(jsonMatch[0], 'scripts/commit-insight-generator:parseLLMResponse');
      }
      
      // Fallback parsing
      return {
        summary: response.split('\n')[0] || 'Analysis completed',
        impact: 'medium',
        category: 'general',
        blockers: [],
        recommendations: ['Review the changes manually'],
        automationOpportunities: []
      };
    } catch (error) {
      return this.generateFallbackInsights();
    }
  }

  /**
   * Generate fallback insights when LLM fails
   */
  private generateFallbackInsights(commit?: CommitAnalysis, changes?: any): any {
    return {
      summary: commit?.description || 'Commit analysis completed',
      impact: 'medium',
      category: 'general',
      blockers: [],
      recommendations: ['Review changes manually', 'Consider adding tests'],
      automationOpportunities: ['Automate similar changes in the future']
    };
  }

  /**
   * Create insight fossil
   */
  private async createInsightFossil(insights: LLMCommitInsight): Promise<any> {
    const fossil = {
      inputHash: insights.commitHash,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        qualityScore: 0.8
      },
      metadata: {
        model: 'llama2',
        context: 'commit-analysis',
        purpose: 'insight-generation',
        valueScore: 0.8,
        validationTime: 0,
        totalTime: 0
      }
    };

    await fossilizeLLMInsight(fossil);
    return fossil;
  }

  /**
   * Update roadmap with insights
   */
  private async updateRoadmapWithInsights(insights: LLMCommitInsight): Promise<void> {
    const roadmapPath = 'fossils/roadmap.yml';
    
    if (!existsSync(roadmapPath)) {
      console.warn('⚠️ Roadmap not found, skipping roadmap update');
      return;
    }

    try {
      const roadmap = this.loadRoadmap(roadmapPath);
      const matchedTasks = this.matchInsightsToTasks(insights, roadmap);
      
      for (const task of matchedTasks) {
        const update: RoadmapInsightUpdate = {
          taskId: task.id || 'unknown',
          llmInsights: insights.insights,
          commitReference: insights.commitHash,
          fossilId: insights.fossilMetadata.fossilId
        };
        
        await this.updateRoadmapTask(task, update);
      }
      
      this.saveRoadmap(roadmapPath, roadmap);
      console.log(`📋 Updated ${matchedTasks.length} roadmap tasks`);
    } catch (error) {
      console.warn('⚠️ Failed to update roadmap:', error);
    }
  }

  /**
   * Get roadmap integration for insights
   */
  private async getRoadmapIntegration(insights: any): Promise<any> {
    // This would typically match insights to roadmap tasks
    return {
      affectedTasks: [],
      newTasks: [],
      updatedStatus: []
    };
  }

  /**
   * Generate batch report
   */
  private async generateBatchReport(results: LLMCommitInsight[], format?: string): Promise<any> {
    const report = {
      timestamp: formatISO(new Date()),
      totalCommits: results.length,
      insights: results,
      summary: {
        averageImpact: this.calculateAverageImpact(results),
        automationOpportunities: this.extractAutomationOpportunities(results),
        categories: this.analyzeCategories(results)
      }
    };

    const reportPath = `fossils/commit_insights/batch-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return { path: reportPath, data: report };
  }

  /**
   * Utility methods for git operations
   */
  private async getStagedChanges(): Promise<FileChange[]> {
    const output = (await executeCommand('git diff --cached --name-status --numstat')).stdout;
    return this.parseGitDiff(output);
  }

  private async getCommitMessage(): Promise<string> {
    const output = (await executeCommand('git log -1 --pretty=%B')).stdout;
    return output.trim();
  }

  private async getCommit(hash: string): Promise<any> {
    const output = (await executeCommand(`git log -1 --pretty=format:"%H|%an|%ad|%s" ${hash}`)).stdout;
    const [commitHash, author, date, message] = output.split('|');
    return { hash: commitHash, author, date, message };
  }

  private async getCommitChanges(hash: string): Promise<FileChange[]> {
    const output = (await executeCommand(`git show --name-status --numstat ${hash}`)).stdout;
    return this.parseGitDiff(output);
  }

  private async getCommitsInRange(range: string): Promise<any[]> {
    const output = (await executeCommand(`git log --pretty=format:"%H|%s" ${range}`)).stdout;
    return output.trim().split('\n').map(line => {
      const [hash, message] = line.split('|');
      return { hash, message };
    });
  }

  private parseGitDiff(output: string): FileChange[] {
    const lines = output.trim().split('\n');
    const changes: FileChange[] = [];
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const status = parts[0] ?? '';
        const path = parts[2] ?? '';
        const additions = parseInt(parts[0] ?? '0') || 0;
        const deletions = parseInt(parts[1] ?? '0') || 0;
        
        if (path && status) {
          changes.push({
            path,
            status: this.parseStatus(status),
            additions,
            deletions
          });
        }
      }
    }
    
    return changes;
  }

  private parseStatus(status: string): 'added' | 'modified' | 'deleted' | 'renamed' {
    switch (status.charAt(0)) {
      case 'A': return 'added';
      case 'M': return 'modified';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      default: return 'modified';
    }
  }

  private extractIssues(message: string): string[] {
    const issuePattern = /#(\d+)/g;
    const matches = message.match(issuePattern);
    return matches ? matches.map(m => m.substring(1)) : [];
  }

  private analyzeFileTypes(changes: FileChange[]): Record<string, number> {
    const types: Record<string, number> = {};
    for (const change of changes) {
      const ext = change.path.split('.').pop() || 'unknown';
      types[ext] = (types[ext] || 0) + 1;
    }
    return types;
  }

  private analyzePatterns(changes: FileChange[]): string[] {
    const patterns: string[] = [];
    
    for (const change of changes) {
      if (change.path.includes('test')) patterns.push('testing');
      if (change.path.includes('docs')) patterns.push('documentation');
      if (change.path.includes('src/')) patterns.push('source-code');
      if (change.path.includes('scripts/')) patterns.push('automation');
    }
    
    return [...new Set(patterns)];
  }

  private calculateAverageImpact(results: LLMCommitInsight[]): string {
    const impacts = results.map(r => r.insights.impact);
    const impactScores = impacts.map(i => i === 'high' ? 3 : i === 'medium' ? 2 : 1);
    const average = impactScores.reduce((sum, score) => sum + score, 0) / impactScores.length;
    
    if (average >= 2.5) return 'high';
    if (average >= 1.5) return 'medium';
    return 'low';
  }

  private extractAutomationOpportunities(results: LLMCommitInsight[]): string[] {
    const opportunities: string[] = [];
    for (const result of results) {
      opportunities.push(...result.insights.automationOpportunities);
    }
    return [...new Set(opportunities)];
  }

  private analyzeCategories(results: LLMCommitInsight[]): Record<string, number> {
    const categories: Record<string, number> = {};
    for (const result of results) {
      const category = result.insights.category;
      categories[category] = (categories[category] || 0) + 1;
    }
    return categories;
  }

  private loadRoadmap(path: string): any {
    const content = readFileSync(path, 'utf8');
    // Simple YAML parsing - in production, use a proper YAML parser
    return { tasks: [] }; // Simplified for demo
  }

  private matchInsightsToTasks(insights: LLMCommitInsight, roadmap: any): any[] {
    // Simplified matching - in production, use more sophisticated matching
    return roadmap.tasks || [];
  }

  private async updateRoadmapTask(task: any, update: RoadmapInsightUpdate): Promise<void> {
    // Simplified update - in production, implement proper roadmap updating
    if (!task.llmInsights) {
      task.llmInsights = [];
    }
    task.llmInsights.push(update);
  }

  private saveRoadmap(path: string, roadmap: any): void {
    // Simplified save - in production, use proper YAML serialization
    writeFileSync(path, JSON.stringify(roadmap, null, 2));
  }

  private async enhanceCommitMessage(message: string, insights: LLMCommitInsight): Promise<void> {
    const enhancedMessage = `${message}

LLM-Insights: fossil:${insights.fossilMetadata.fossilId}
Roadmap-Impact: ${insights.insights.impact}
Automation-Scope: ${insights.insights.category}`;

    // Note: In a real implementation, you would update the commit message
    console.log('📝 Enhanced commit message:');
    console.log(enhancedMessage);
  }

  private async getRepoInfo(): Promise<{ owner: string; repo: string }> {
    // Use canonical utilities for owner/repo detection
    const { getCurrentRepoOwner, getCurrentRepoName } = await import('../src/utils/cli');
    const owner = getCurrentRepoOwner();
    const repo = getCurrentRepoName();
    // Optionally validate with Zod schema
    const { OwnerRepoSchema } = await import('../src/types/schemas');
    OwnerRepoSchema.parse({ owner, repo });
    return { owner, repo };
  }
}

// CLI argument parsing
function parseArgs(): any {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--commit':
        params.commit = args[++i];
        break;
      case '--range':
        params.range = args[++i];
        break;
      case '--staged':
        params.staged = true;
        break;
      case '--format':
        params.outputFormat = args[++i];
        break;
      case '--help':
        console.log(`
Usage: bun run scripts/commit-insight-generator.ts [options]

Options:
  --commit <hash>     Generate insights for specific commit
  --range <range>     Generate insights for commit range (e.g., HEAD~5..HEAD)
  --staged           Generate insights for staged changes
  --format <format>  Output format: json, yaml, markdown
  --help             Show this help message

Examples:
  bun run scripts/commit-insight-generator.ts --commit HEAD
  bun run scripts/commit-insight-generator.ts --range HEAD~5..HEAD
  bun run scripts/commit-insight-generator.ts --staged
        `);
        process.exit(0);
    }
  }

  return params;
}

// Main execution
async function main() {
  const params = parseArgs();
  const generator = new CommitInsightGenerator();
  await generator.generateInsights(params);
}

if (import.meta.main) {
  main().catch(console.error);
} 