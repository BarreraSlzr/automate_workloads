#!/usr/bin/env bun

/**
 * Git Diff Analyzer
 * Analyzes git diffs and leverages documentation patterns to provide insights
 * and recommendations for commit organization and automation.
 */

import { executeCommand } from '@/utils/cli';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  GitDiffAnalysisSchema, 
  DiffAnalysisResultSchema,
  CommitMessageAnalysisSchema,
  DocPatternMatchSchema,
  BatchProcessingConfigSchema,
  BatchProcessingResultSchema
} from '../types/schemas';
import { LLMService } from '../services/llm';
import { fossilizeLLMInsight } from './fossilize';
import { LLMInsightFossil } from '../types/llmFossil';
import { getCurrentRepoOwner, getCurrentRepoName } from '@/utils/cli';

export class GitDiffAnalyzer {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService({
      owner: getCurrentRepoOwner(),
      repo: getCurrentRepoName(),
    });
  }

  /**
   * Analyze git diff and provide insights using documentation patterns
   */
  async analyzeDiff(config: any): Promise<any> {
    const validatedConfig = GitDiffAnalysisSchema.parse(config);
    
    try {
      // Get git diff
      const diff = this.getGitDiff(validatedConfig);
      
      // Analyze files changed
      const fileAnalysis = this.analyzeFiles(diff, validatedConfig);
      
      // Match documentation patterns
      const patternMatches = await this.matchDocPatterns(fileAnalysis);
      
      // Generate insights using LLM
      const insights = await this.generateInsights(fileAnalysis, patternMatches);
      
      // Create fossil for traceability
      await this.createAnalysisFossil(fileAnalysis, patternMatches, insights);
      
      return DiffAnalysisResultSchema.parse({
        filesChanged: fileAnalysis.files.length,
        linesAdded: fileAnalysis.totalLinesAdded,
        linesDeleted: fileAnalysis.totalLinesDeleted,
        files: fileAnalysis.files,
        patterns: patternMatches,
        insights: insights
      });
    } catch (error) {
      console.error('❌ Git diff analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get git diff based on configuration
   */
  private getGitDiff(config: any): string {
    const args: string[] = [];
    
    if (config.commitHash) {
      args.push(config.commitHash);
    } else {
      if (config.includeStaged) {
        args.push('--cached');
      }
      if (config.includeUnstaged) {
        args.push('HEAD');
      }
    }
    
    if (config.filePatterns) {
      args.push('--', ...config.filePatterns);
    }
    
    try {
      const result = executeCommand(`git diff ${args.join(' ')}`);
      return result.stdout;
    } catch (error) {
      console.warn('⚠️ Git diff command failed, using empty diff');
      return '';
    }
  }

  /**
   * Analyze files in the diff
   */
  private analyzeFiles(diff: string, config: any): any {
    const files: any[] = [];
    let totalLinesAdded = 0;
    let totalLinesDeleted = 0;
    
    // Parse diff output
    const fileBlocks = diff.split('diff --git');
    
    for (const block of fileBlocks) {
      if (!block.trim()) continue;
      
      const lines = block.split('\n');
      const filePath = this.extractFilePath(lines[0] || '');
      
      if (!filePath) continue;
      
      const stats = this.extractFileStats(block);
      const changeType = this.determineChangeType(filePath);
      const impact = this.assessImpact(stats, changeType);
      
      files.push({
        path: filePath,
        status: this.determineFileStatus(block),
        linesAdded: stats.added,
        linesDeleted: stats.deleted,
        changeType: changeType,
        impact: impact,
        recommendations: this.generateRecommendations(filePath, changeType, impact)
      });
      
      totalLinesAdded += stats.added;
      totalLinesDeleted += stats.deleted;
    }
    
    return {
      files: files.slice(0, config.maxFiles),
      totalLinesAdded,
      totalLinesDeleted
    };
  }

  /**
   * Match documentation patterns in changed files
   */
  private async matchDocPatterns(fileAnalysis: any): Promise<any[]> {
    const patterns: any[] = [];
    
    // Define documentation patterns to match
    const docPatterns = [
      {
        name: 'conventional-commits',
        pattern: /^(feat|fix|docs|style|refactor|test|chore|perf)\([^)]+\):/,
        type: 'docs' as const
      },
      {
        name: 'fossil-backed-creation',
        pattern: /createFossilIssue|createFossilLabel|createFossilMilestone/,
        type: 'code' as const
      },
      {
        name: 'zod-validation',
        pattern: /z\.object\(|z\.enum\(|z\.string\(\)/,
        type: 'code' as const
      },
      {
        name: 'llm-integration',
        pattern: /LLMService|callLLM|routingPreference/,
        type: 'code' as const
      },
      {
        name: 'error-handling',
        pattern: /try\s*\{|catch\s*\(|throw new Error/,
        type: 'code' as const
      }
    ];
    
    for (const file of fileAnalysis.files) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        
        for (const docPattern of docPatterns) {
          const matches = this.findPatternMatches(content, docPattern.pattern, file.path);
          
          if (matches.length > 0) {
            patterns.push({
              pattern: docPattern.name,
              count: matches.length,
              files: [file.path],
              type: docPattern.type,
              matches: matches
            });
          }
        }
      } catch (error) {
        // File might not exist or be readable
        continue;
      }
    }
    
    return patterns;
  }

  /**
   * Generate insights using LLM
   */
  private async generateInsights(fileAnalysis: any, patternMatches: any[]): Promise<any[]> {
    const insights: any[] = [];
    
    try {
      const prompt = `Analyze the following git diff changes and provide insights:

Files Changed: ${fileAnalysis.files.length}
Lines Added: ${fileAnalysis.totalLinesAdded}
Lines Deleted: ${fileAnalysis.totalLinesDeleted}

Files:
${fileAnalysis.files.map((f: any) => `- ${f.path} (${f.changeType}, ${f.impact} impact)`).join('\n')}

Documentation Patterns Found:
${patternMatches.map((p: any) => `- ${p.pattern}: ${p.count} matches`).join('\n')}

Provide insights in this format:
- type: insight type
- description: what this change means
- confidence: 0-1 confidence score
- recommendations: actionable next steps

Focus on:
1. Documentation coherence
2. Code quality patterns
3. Automation opportunities
4. Potential issues or improvements`;

      const response = await this.llmService.callLLM({
        model: 'llama2',
        messages: [
          { role: 'system', content: 'You are an expert code reviewer and automation specialist.' },
          { role: 'user', content: prompt }
        ],
        routingPreference: 'local',
        apiKey: process.env.OPENAI_API_KEY || ''
      });

      const content = response.choices?.[0]?.message?.content || '';
      const insightBlocks = content.split('- type:').slice(1);
      
      for (const block of insightBlocks) {
        const lines = block.split('\n');
        const insight = {
          type: lines[0]?.trim() || 'general',
          description: lines.find((l: string) => l.includes('description:'))?.split('description:')[1]?.trim() || '',
          confidence: parseFloat(lines.find((l: string) => l.includes('confidence:'))?.split('confidence:')[1]?.trim() || '0.5'),
          recommendations: lines.filter((l: string) => l.includes('recommendations:')).map((l: string) => l.split('recommendations:')[1]?.trim()).filter(Boolean)
        };
        
        if (insight.description) {
          insights.push(insight);
        }
      }
    } catch (error) {
      console.warn('⚠️ LLM insight generation failed:', error);
    }
    
    return insights;
  }

  /**
   * Create fossil for analysis traceability
   */
  private async createAnalysisFossil(fileAnalysis: any, patternMatches: any[], insights: any[]): Promise<void> {
    try {
      const fossil: LLMInsightFossil = {
        type: 'insight',
        timestamp: new Date().toISOString(),
        model: 'llama2',
        provider: 'ollama',
        excerpt: `Git diff analysis: ${fileAnalysis.files.length} files changed, ${patternMatches.length} patterns matched`,
        prompt: 'Analyze git diff changes and provide insights',
        response: JSON.stringify({
          fileAnalysis,
          patternMatches,
          insights
        }, null, 2),
        promptId: 'git-diff-analysis',
        promptVersion: 'v1',
        systemMessage: 'You are an expert code reviewer and automation specialist.',
        inputHash: 'git-diff-analysis',
        commitRef: 'HEAD'
      };
      
      await fossilizeLLMInsight(fossil);
    } catch (error) {
      console.warn('⚠️ Failed to create analysis fossil:', error);
    }
  }

  /**
   * Analyze commit message for conventional format
   */
  analyzeCommitMessage(message: string): any {
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:\s+(.+)$/;
    const match = message.match(conventionalRegex);
    
    const analysis = {
      message,
      conventionalFormat: !!match,
      type: match?.[1] || undefined,
      scope: match?.[2]?.slice(1, -1) || undefined,
      description: match?.[3] || message,
      body: '',
      footer: '',
      breakingChange: message.includes('BREAKING CHANGE'),
      issues: this.extractIssues(message),
      suggestions: this.generateCommitSuggestions(message, !!match),
      score: this.calculateCommitScore(message, !!match)
    };
    
    return CommitMessageAnalysisSchema.parse(analysis);
  }

  /**
   * Batch process multiple analyses
   */
  async batchAnalyze(config: any): Promise<any> {
    const validatedConfig = BatchProcessingConfigSchema.parse(config);
    
    const startTime = Date.now();
    const results: any[] = [];
    const errors: any[] = [];
    
    // Get list of recent commits
    const commits = this.getRecentCommits(validatedConfig.batchSize);
    
    for (let i = 0; i < commits.length; i += validatedConfig.batchSize) {
      const batch = commits.slice(i, i + validatedConfig.batchSize);
      
      const batchPromises = batch.map(async (commit, index) => {
        try {
          const result = await this.analyzeDiff({ commitHash: commit });
          return { itemId: commit, result };
        } catch (error) {
          return { itemId: commit, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if ('error' in result) {
          errors.push(result);
        } else {
          results.push(result);
        }
      }
      
      if (validatedConfig.progressCallback) {
        validatedConfig.progressCallback(i + batch.length, commits.length);
      }
    }
    
    return BatchProcessingResultSchema.parse({
      totalItems: commits.length,
      processedItems: commits.length,
      successfulItems: results.length,
      failedItems: errors.length,
      skippedItems: 0,
      processingTime: Date.now() - startTime,
      errors,
      results
    });
  }

  // Helper methods
  private extractFilePath(diffLine: string): string | null {
    const match = diffLine.match(/a\/(.+) b\/(.+)/);
    return match ? match[2] || null : null;
  }

  private extractFileStats(block: string): { added: number; deleted: number } {
    const addedMatch = block.match(/(\d+) insertions?/);
    const deletedMatch = block.match(/(\d+) deletions?/);
    
    return {
      added: parseInt(addedMatch?.[1] || '0'),
      deleted: parseInt(deletedMatch?.[1] || '0')
    };
  }

  private determineFileStatus(block: string): string {
    if (block.includes('new file')) return 'added';
    if (block.includes('deleted file')) return 'deleted';
    if (block.includes('rename')) return 'renamed';
    return 'modified';
  }

  private determineChangeType(filePath: string): string {
    if (filePath.includes('docs/')) return 'docs';
    if (filePath.includes('test') || filePath.includes('.test.')) return 'test';
    if (filePath.includes('src/')) return 'code';
    if (filePath.includes('package.json') || filePath.includes('.config.')) return 'config';
    return 'other';
  }

  private assessImpact(stats: any, changeType: string): string {
    const totalChanges = stats.added + stats.deleted;
    
    if (totalChanges > 100) return 'critical';
    if (totalChanges > 50) return 'high';
    if (totalChanges > 10) return 'medium';
    return 'low';
  }

  private generateRecommendations(filePath: string, changeType: string, impact: string): string[] {
    const recommendations: string[] = [];
    
    if (changeType === 'docs' && impact === 'high') {
      recommendations.push('Review documentation for accuracy and completeness');
    }
    
    if (changeType === 'code' && impact === 'critical') {
      recommendations.push('Add comprehensive tests for new functionality');
      recommendations.push('Update API documentation if interfaces changed');
    }
    
    if (changeType === 'test') {
      recommendations.push('Verify test coverage for related functionality');
    }
    
    return recommendations;
  }

  private findPatternMatches(content: string, pattern: RegExp, filePath: string): any[] {
    const matches: any[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (pattern.test(line)) {
        matches.push({
          file: filePath,
          line: i + 1,
          content: line.trim(),
          context: lines.slice(Math.max(0, i - 2), i + 3).join('\n'),
          relevance: 1.0
        });
      }
    }
    
    return matches;
  }

  private extractIssues(message: string): string[] {
    const issueRegex = /#(\d+)/g;
    const matches = message.match(issueRegex);
    return matches ? matches.map(m => m.slice(1)).filter(Boolean) : [];
  }

  private generateCommitSuggestions(message: string, isConventional: boolean): string[] {
    const suggestions: string[] = [];
    
    if (!isConventional) {
      suggestions.push('Use conventional commit format: type(scope): description');
      suggestions.push('Add scope to indicate affected area (e.g., feat(github): add issue creation)');
    }
    
    if (message.length < 10) {
      suggestions.push('Provide more descriptive commit message');
    }
    
    if (message.length > 72) {
      suggestions.push('Keep commit message under 72 characters for first line');
    }
    
    return suggestions;
  }

  private calculateCommitScore(message: string, isConventional: boolean): number {
    let score = 0;
    
    if (isConventional) score += 40;
    if (message.length >= 10 && message.length <= 72) score += 30;
    if (message.includes('(') && message.includes(')')) score += 20;
    if (this.extractIssues(message).length > 0) score += 10;
    
    return Math.min(score, 100);
  }

  private getRecentCommits(limit: number): string[] {
    try {
      const result = executeCommand(`git log --oneline -${limit}`);
      return result.stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split(' ');
          return parts[0] || '';
        })
        .filter(Boolean);
    } catch (error) {
      console.warn('⚠️ Failed to get recent commits:', error);
      return [];
    }
  }
} 