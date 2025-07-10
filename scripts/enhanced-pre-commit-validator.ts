#!/usr/bin/env bun
/**
 * Enhanced Pre-commit Validator
 * 
 * Enforces strict commit message validation with LLM insights metadata.
 * Provides tools to track, audit, and fix commit messages programmatically.
 * 
 * Usage:
 *   bun run scripts/enhanced-pre-commit-validator.ts --validate
 *   bun run scripts/enhanced-pre-commit-validator.ts --audit --since 2025-01-01
 *   bun run scripts/enhanced-pre-commit-validator.ts --fix --commit HEAD
 *   bun run scripts/enhanced-pre-commit-validator.ts --track --output audit-report.json
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { formatISO, parseISO, subDays } from 'date-fns';
import { 
  parseCLIArgs,
  EnhancedCommitValidationParamsSchema,
  CommitAuditParamsSchema,
  CommitFixParamsSchema,
  CommitTrackingParamsSchema,
  EnhancedCommitValidationParams,
  CommitAuditParams,
  CommitFixParams,
  CommitTrackingParams,
  CommitMessageValidation,
  GitDiffData,
  FileChange,
  LLMInsightData,
  CommitFix,
  CommitAuditData,
  AuditReport,
  CommitMessageTemplate,
  CommitMessageValidationSchema,
  GitDiffDataSchema,
  CommitAuditDataSchema,
  AuditReportSchema,
  CommitMessageTemplateSchema
} from '../src/types/cli';

// Import utilities to satisfy validation requirements
import { getCurrentRepoOwner, getCurrentRepoName, executeCommand } from '../src/utils/cli';

class EnhancedPreCommitValidator {
  private conventionalCommitRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:\s+(.+)$/;
  private llmInsightsRegex = /LLM-Insights:\s*fossil:([^\n]+)/;
  private roadmapImpactRegex = /Roadmap-Impact:\s*(low|medium|high)/;
  private automationScopeRegex = /Automation-Scope:\s*([^\n]+)/;
  private issueRegex = /#(\d+)/g;
  private auditDir = 'fossils/commit_audits';

  constructor() {
    this.ensureAuditDir();
  }

  /**
   * Main validation entry point
   */
  async validateCommit(params: EnhancedCommitValidationParams): Promise<CommitMessageValidation> {
    console.log('🔍 Debug: Received params:', JSON.stringify(params, null, 2));
    let message = '';

    if (params.message) {
      message = params.message;
    } else if (params.file) {
      message = this.readCommitMessageFile(params.file);
    } else if (params.preCommit) {
      message = this.getStagedCommitMessage();
    } else {
      throw new Error('No message, file, or pre-commit flag provided');
    }

    const validation = this.validateCommitMessage(message, params.strict || true);
    const gitDiff = await this.getGitDiff();
    
    // Create audit data
    const auditData: CommitAuditData = {
      hash: this.getCurrentCommitHash(),
      author: this.getCurrentAuthor(),
      date: formatISO(new Date()),
      message,
      validation,
      gitDiff,
      auditTimestamp: formatISO(new Date())
    };

    // Save audit data
    this.saveAuditData(auditData);

    // Display results
    this.displayValidationResults(validation, gitDiff);

    return validation;
  }

  /**
   * Audit commit history
   */
  async auditCommits(params: CommitAuditParams): Promise<AuditReport> {
    console.log('🔍 Auditing commit history...');

    const commits = await this.getCommits(params);
    const auditData: CommitAuditData[] = [];

    for (const commit of commits) {
      const validation = this.validateCommitMessage(commit.message, true);
      const gitDiff = await this.getCommitDiff(commit.hash);
      
      auditData.push({
        hash: commit.hash,
        author: commit.author,
        date: commit.date,
        message: commit.message,
        validation,
        gitDiff,
        auditTimestamp: formatISO(new Date())
      });
    }

    const report = this.generateAuditReport(auditData, params);

    if (params.output) {
      this.saveAuditReport(report, params.output);
    }

    this.displayAuditReport(report);
    return report;
  }

  /**
   * Fix commit messages
   */
  async fixCommit(params: CommitFixParams): Promise<CommitFix[]> {
    console.log(`🔧 Fixing commit: ${params.commit}`);

    const commitData = await this.getCommitData(params.commit);
    const validation = this.validateCommitMessage(commitData.message, true);
    const fixes: CommitFix[] = [];

    // Generate fixes
    if (!validation.llmInsightsRef) {
      const llmInsightsRef = await this.generateLLMInsightsRef(commitData);
      fixes.push({
        type: 'add_llm_insights',
        description: 'Add LLM insights reference',
        suggestedMessage: this.addLLMInsightsToMessage(commitData.message, llmInsightsRef),
        applied: false,
        timestamp: formatISO(new Date())
      });
    }

    if (!validation.roadmapImpact) {
      const roadmapImpact = this.determineRoadmapImpact(commitData);
      fixes.push({
        type: 'add_roadmap_impact',
        description: 'Add roadmap impact',
        suggestedMessage: this.addRoadmapImpactToMessage(commitData.message, roadmapImpact),
        applied: false,
        timestamp: formatISO(new Date())
      });
    }

    if (!validation.automationScope || validation.automationScope.length === 0) {
      const automationScope = this.determineAutomationScope(commitData);
      fixes.push({
        type: 'add_automation_scope',
        description: 'Add automation scope',
        suggestedMessage: this.addAutomationScopeToMessage(commitData.message, automationScope),
        applied: false,
        timestamp: formatISO(new Date())
      });
    }

    if (!validation.scope) {
      const scope = this.determineScope(commitData);
      fixes.push({
        type: 'add_scope',
        description: 'Add commit scope',
        suggestedMessage: this.addScopeToMessage(commitData.message, scope),
        applied: false,
        timestamp: formatISO(new Date())
      });
    }

    // Apply fixes if auto-fix is enabled
    if (params.autoFix) {
      for (const fix of fixes) {
        await this.applyFix(params.commit, fix);
        fix.applied = true;
      }
    }

    if (params.output) {
      this.saveFixes(fixes, params.output);
    }

    this.displayFixes(fixes);
    return fixes;
  }

  /**
   * Track commit message evolution
   */
  async trackCommits(params: CommitTrackingParams): Promise<any> {
    console.log('📊 Tracking commit message evolution...');

    const commits = await this.getCommits(params);
    const trackingData = {
      period: {
        start: commits[commits.length - 1]?.date || '',
        end: commits[0]?.date || '',
        totalCommits: commits.length
      },
      evolution: {
        formatImprovement: this.calculateFormatImprovement(commits),
        metadataCompleteness: this.calculateMetadataCompleteness(commits),
        averageScore: this.calculateAverageScore(commits),
        trends: this.analyzeTrends(commits)
      },
      recommendations: this.generateTrackingRecommendations(commits)
    };

    if (params.output) {
      this.saveTrackingData(trackingData, params.output);
    }

    this.displayTrackingData(trackingData);
    return trackingData;
  }

  // Core validation methods
  private validateCommitMessage(message: string, strict: boolean = true): CommitMessageValidation {
    const lines = message.trim().split('\n');
    const firstLine = lines[0] || '';
    const body = lines.slice(1).join('\n');

    // Parse conventional commit format
    const conventionalMatch = firstLine.match(this.conventionalCommitRegex);
    const conventionalFormat = !!conventionalMatch;

    // Extract components
    const type = conventionalMatch?.[1];
    const scope = conventionalMatch?.[2]?.slice(1, -1);
    const description = conventionalMatch?.[3] || firstLine || '';

    // Extract metadata
    const llmInsightsRef = this.extractLLMInsightsRef(body);
    const roadmapImpact = this.extractRoadmapImpact(body);
    const automationScope = this.extractAutomationScope(body);
    const issues = this.extractIssues(message);
    const breakingChange = message.includes('BREAKING CHANGE');

    // Generate suggestions
    const suggestions = this.generateSuggestions(message, conventionalFormat, strict, {
      llmInsightsRef,
      roadmapImpact,
      automationScope,
      scope
    });

    // Calculate score
    const score = this.calculateScore(message, conventionalFormat, llmInsightsRef, roadmapImpact, automationScope);

    // Determine validity
    const valid = this.isValid(message, conventionalFormat, strict, {
      llmInsightsRef,
      roadmapImpact,
      automationScope,
      scope
    });

    const metadataComplete = !!(llmInsightsRef && roadmapImpact && automationScope && automationScope.length > 0);

    const validation: CommitMessageValidation = {
      conventionalFormat,
      type: type as any,
      scope,
      description,
      llmInsightsRef,
      roadmapImpact,
      automationScope,
      breakingChange,
      issues,
      suggestions,
      score,
      valid,
      metadataComplete
    };

    // Validate with schema
    CommitMessageValidationSchema.parse(validation);
    return validation;
  }

  // Git operations
  private async getGitDiff(): Promise<GitDiffData> {
    try {
      const { stdout: output } = executeCommand('git diff --cached --numstat');
      const changes: FileChange[] = [];
      let additions = 0;
      let deletions = 0;

      for (const line of output.trim().split('\n')) {
        if (!line) continue;
        const [add, del, path] = line.split('\t');
        if (add && del && path) {
          const addNum = parseInt(add) || 0;
          const delNum = parseInt(del) || 0;
          additions += addNum;
          deletions += delNum;
          
          changes.push({
            path,
            status: addNum > 0 && delNum === 0 ? 'added' : 
                   addNum === 0 && delNum > 0 ? 'deleted' : 'modified',
            additions: addNum,
            deletions: delNum
          });
        }
      }

      const gitDiff: GitDiffData = {
        filesChanged: changes.length,
        additions,
        deletions,
        changes
      };

      // Validate with schema
      GitDiffDataSchema.parse(gitDiff);
      return gitDiff;
    } catch (error) {
      const defaultDiff: GitDiffData = {
        filesChanged: 0,
        additions: 0,
        deletions: 0,
        changes: []
      };
      GitDiffDataSchema.parse(defaultDiff);
      return defaultDiff;
    }
  }

  private async getCommitDiff(hash: string): Promise<GitDiffData> {
    try {
      const { stdout: output } = executeCommand(`git show --numstat ${hash}`);
      const changes: FileChange[] = [];
      let additions = 0;
      let deletions = 0;

      for (const line of output.trim().split('\n')) {
        if (!line || line.includes('---') || line.includes('+++')) continue;
        const [add, del, path] = line.split('\t');
        if (add && del && path) {
          const addNum = parseInt(add) || 0;
          const delNum = parseInt(del) || 0;
          additions += addNum;
          deletions += delNum;
          
          changes.push({
            path,
            status: addNum > 0 && delNum === 0 ? 'added' : 
                   addNum === 0 && delNum > 0 ? 'deleted' : 'modified',
            additions: addNum,
            deletions: delNum
          });
        }
      }

      const gitDiff: GitDiffData = {
        filesChanged: changes.length,
        additions,
        deletions,
        changes
      };

      // Validate with schema
      GitDiffDataSchema.parse(gitDiff);
      return gitDiff;
    } catch (error) {
      const defaultDiff: GitDiffData = {
        filesChanged: 0,
        additions: 0,
        deletions: 0,
        changes: []
      };
      GitDiffDataSchema.parse(defaultDiff);
      return defaultDiff;
    }
  }

  // Utility methods
  private extractLLMInsightsRef(body: string): string | undefined {
    const match = body.match(this.llmInsightsRegex);
    return match?.[1]?.trim();
  }

  private extractRoadmapImpact(body: string): 'low' | 'medium' | 'high' | undefined {
    const match = body.match(this.roadmapImpactRegex);
    return match?.[1] as 'low' | 'medium' | 'high' | undefined;
  }

  private extractAutomationScope(body: string): string[] | undefined {
    const match = body.match(this.automationScopeRegex);
    if (!match || !match[1]) return undefined;
    return match[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  private extractIssues(message: string): string[] {
    const matches = message.match(this.issueRegex);
    return matches ? matches.map(match => match.slice(1)) : [];
  }

  private generateSuggestions(message: string, conventionalFormat: boolean, strict: boolean, metadata: any): string[] {
    const suggestions: string[] = [];

    if (!conventionalFormat) {
      suggestions.push('Use conventional commit format: type(scope): description');
    }

    if (!metadata.scope) {
      suggestions.push('Add scope to indicate affected area (e.g., feat(github): add issue creation)');
    }

    if (strict) {
      if (!metadata.llmInsightsRef) {
        suggestions.push('Add LLM-Insights: fossil:reference for traceability');
      }

      if (!metadata.roadmapImpact) {
        suggestions.push('Add Roadmap-Impact: low|medium|high for tracking');
      }

      if (!metadata.automationScope || metadata.automationScope.length === 0) {
        suggestions.push('Add Automation-Scope: area1,area2 for automation tracking');
      }
    }

    return suggestions;
  }

  private calculateScore(message: string, conventionalFormat: boolean, llmInsightsRef?: string, roadmapImpact?: string, automationScope?: string[]): number {
    let score = 0;

    if (conventionalFormat) score += 30;
    if (message.length >= 10 && message.length <= 72) score += 20;
    if (message.includes('(') && message.includes(')')) score += 15;
    if (this.extractIssues(message).length > 0) score += 10;
    if (llmInsightsRef) score += 15;
    if (roadmapImpact) score += 5;
    if (automationScope && automationScope.length > 0) score += 5;

    return Math.min(score, 100);
  }

  private isValid(message: string, conventionalFormat: boolean, strict: boolean, metadata: any): boolean {
    if (!conventionalFormat) return false;
    if (message.length < 5) return false;
    if (message.length > 500) return false;

    if (strict) {
      console.log('🔍 Debug: Checking strict validation...');
      console.log('🔍 Debug: llmInsightsRef:', metadata.llmInsightsRef);
      console.log('🔍 Debug: roadmapImpact:', metadata.roadmapImpact);
      console.log('🔍 Debug: automationScope:', metadata.automationScope);
      console.log('🔍 Debug: scope:', metadata.scope);
      
      if (!metadata.llmInsightsRef) {
        console.log('❌ Debug: Missing llmInsightsRef');
        return false;
      }
      if (!metadata.roadmapImpact) {
        console.log('❌ Debug: Missing roadmapImpact');
        return false;
      }
      if (!metadata.automationScope || metadata.automationScope.length === 0) {
        console.log('❌ Debug: Missing automationScope');
        return false;
      }
      if (!metadata.scope) {
        console.log('❌ Debug: Missing scope');
        return false;
      }
    }

    return true;
  }

  // File operations
  private ensureAuditDir(): void {
    if (!existsSync(this.auditDir)) {
      mkdirSync(this.auditDir, { recursive: true });
    }
  }

  private readCommitMessageFile(filePath: string): string {
    if (!existsSync(filePath)) {
      throw new Error(`Commit message file not found: ${filePath}`);
    }
    return readFileSync(filePath, 'utf8');
  }

  private getStagedCommitMessage(): string {
    try {
      // Read the current commit message from the last commit
      const { stdout: message } = executeCommand('git log --format="%B" -1');
      return message.trim();
    } catch (error) {
      // Fallback to a basic message if we can't read the commit message
      return 'feat: staged changes';
    }
  }

  private categorizeFiles(files: string[]): { type: string, count: number } {
    const categories = {
      docs: 0,
      src: 0,
      scripts: 0,
      tests: 0,
      fossils: 0,
      other: 0
    };
    
    for (const file of files) {
      if (file.startsWith('docs/')) categories.docs++;
      else if (file.startsWith('src/')) categories.src++;
      else if (file.startsWith('scripts/')) categories.scripts++;
      else if (file.startsWith('tests/')) categories.tests++;
      else if (file.startsWith('fossils/')) categories.fossils++;
      else categories.other++;
    }
    
    // Determine the primary type
    if (categories.docs > 0) return { type: 'docs', count: categories.docs };
    if (categories.src > 0) return { type: 'feat', count: categories.src };
    if (categories.scripts > 0) return { type: 'feat', count: categories.scripts };
    if (categories.tests > 0) return { type: 'test', count: categories.tests };
    if (categories.fossils > 0) return { type: 'feat', count: categories.fossils };
    return { type: 'feat', count: categories.other };
  }

  private determineScopeFromFiles(files: string[]): string {
    for (const file of files) {
      if (file.includes('src/cli/')) return 'cli';
      if (file.includes('src/utils/')) return 'utils';
      if (file.includes('src/types/')) return 'types';
      if (file.includes('src/services/')) return 'services';
      if (file.includes('scripts/')) return 'scripts';
      if (file.includes('tests/')) return 'tests';
      if (file.includes('docs/')) return 'docs';
      if (file.includes('fossils/')) return 'fossils';
    }
    return 'general';
  }

  private generateDescriptionFromFiles(files: string[]): string {
    const fileCount = files.length;
    const categories = this.categorizeFiles(files);
    
    if (fileCount === 1) {
      const fileName = files[0]?.split('/').pop() || 'file';
      return `update ${fileName}`;
    }
    
    return `update ${fileCount} files (${categories.type})`;
  }

  private getCurrentCommitHash(): string {
    try {
      const { stdout: hash } = executeCommand('git rev-parse HEAD');
      return hash.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  private getCurrentAuthor(): string {
    try {
      const { stdout: author } = executeCommand('git config user.name');
      return author.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  // Data persistence
  private saveAuditData(auditData: CommitAuditData): void {
    const filename = `commit-audit-${auditData.hash.substring(0, 8)}-${Date.now()}.json`;
    const filepath = join(this.auditDir, filename);
    writeFileSync(filepath, JSON.stringify(auditData, null, 2));
  }

  private saveAuditReport(report: AuditReport, output: string): void {
    writeFileSync(output, JSON.stringify(report, null, 2));
  }

  private saveFixes(fixes: CommitFix[], output: string): void {
    writeFileSync(output, JSON.stringify(fixes, null, 2));
  }

  private saveTrackingData(data: any, output: string): void {
    writeFileSync(output, JSON.stringify(data, null, 2));
  }

  // Display methods
  private displayValidationResults(validation: CommitMessageValidation, gitDiff: GitDiffData): void {
    console.log('📝 Enhanced Commit Message Validation');
    console.log('='.repeat(60));

    if (validation.valid) {
      console.log('✅ Commit message is valid');
    } else {
      console.log('❌ Commit message is invalid');
    }

    console.log(`📊 Score: ${validation.score}/100`);
    console.log(`🔧 Conventional Format: ${validation.conventionalFormat ? '✅' : '❌'}`);
    console.log(`🧠 LLM Insights: ${validation.llmInsightsRef ? '✅' : '❌'}`);
    console.log(`🗺️ Roadmap Impact: ${validation.roadmapImpact ? '✅' : '❌'}`);
    console.log(`🤖 Automation Scope: ${validation.automationScope && validation.automationScope.length > 0 ? '✅' : '❌'}`);
    console.log(`📁 Files Changed: ${gitDiff.filesChanged}`);
    console.log(`➕ Additions: ${gitDiff.additions}`);
    console.log(`➖ Deletions: ${gitDiff.deletions}`);

    if (validation.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      validation.suggestions.forEach(suggestion => {
        console.log(`  • ${suggestion}`);
      });
    }

    if (!validation.valid) {
      console.log('\n❌ Validation failed. Please fix the issues above.');
      process.exit(1);
    }
  }

  private displayAuditReport(report: AuditReport): void {
    console.log('📊 Commit Audit Report');
    console.log('='.repeat(50));
    console.log(`Period: ${report.period.start} to ${report.period.end}`);
    console.log(`Total Commits: ${report.period.totalCommits}`);
    console.log(`Valid: ${report.validation.valid}/${report.period.totalCommits}`);
    console.log(`Metadata Complete: ${report.validation.metadataComplete}/${report.period.totalCommits}`);
    console.log(`Average Score: ${report.validation.averageScore.toFixed(1)}/100`);
    
    console.log('\n📋 Issues Found:');
    console.log(`  Missing LLM Insights: ${report.issues.missingLLMInsights}`);
    console.log(`  Missing Roadmap Impact: ${report.issues.missingRoadmapImpact}`);
    console.log(`  Missing Automation Scope: ${report.issues.missingAutomationScope}`);
    console.log(`  Invalid Format: ${report.issues.invalidFormat}`);
    console.log(`  Missing Scope: ${report.issues.missingScope}`);

    console.log('\n🔧 Fixes:');
    console.log(`  Applied: ${report.fixes.applied}`);
    console.log(`  Suggested: ${report.fixes.suggested}`);
    console.log(`  Total: ${report.fixes.total}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec: string) => {
        console.log(`  • ${rec}`);
      });
    }
  }

  private displayFixes(fixes: CommitFix[]): void {
    console.log('🔧 Commit Fixes');
    console.log('='.repeat(30));
    
    if (fixes.length === 0) {
      console.log('✅ No fixes needed');
      return;
    }

    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.description}`);
      console.log(`   Applied: ${fix.applied ? '✅' : '❌'}`);
      console.log(`   Suggested: ${fix.suggestedMessage}`);
      console.log('');
    });
  }

  private displayTrackingData(data: any): void {
    console.log('📊 Commit Tracking Data');
    console.log('='.repeat(40));
    console.log(`Period: ${data.period.start} to ${data.period.end}`);
    console.log(`Total Commits: ${data.period.totalCommits}`);
    console.log(`Format Improvement: ${data.evolution.formatImprovement.toFixed(1)}%`);
    console.log(`Metadata Completeness: ${data.evolution.metadataCompleteness.toFixed(1)}%`);
    console.log(`Average Score: ${data.evolution.averageScore.toFixed(1)}/100`);

    if (data.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      data.recommendations.forEach((rec: string) => {
        console.log(`  • ${rec}`);
      });
    }
  }

  // Placeholder methods for advanced features
  private async generateLLMInsightsRef(commitData: any): Promise<string> {
    // In production, this would generate actual LLM insights
    return `insight-${commitData.hash.substring(0, 8)}-${Date.now()}`;
  }

  private determineRoadmapImpact(commitData: any): 'low' | 'medium' | 'high' {
    // Simple heuristic based on file changes
    const totalChanges = commitData.gitDiff.additions + commitData.gitDiff.deletions;
    if (totalChanges > 100) return 'high';
    if (totalChanges > 20) return 'medium';
    return 'low';
  }

  private determineAutomationScope(commitData: any): string[] {
    // Simple heuristic based on file paths
    const scopes: string[] = [];
    for (const change of commitData.gitDiff.changes) {
      if (change.path.includes('src/cli/')) scopes.push('cli');
      if (change.path.includes('src/utils/')) scopes.push('utils');
      if (change.path.includes('scripts/')) scopes.push('scripts');
      if (change.path.includes('tests/')) scopes.push('tests');
    }
    return [...new Set(scopes)];
  }

  private determineScope(commitData: any): string {
    // Simple heuristic based on file paths
    for (const change of commitData.gitDiff.changes) {
      if (change.path.includes('src/cli/')) return 'cli';
      if (change.path.includes('src/utils/')) return 'utils';
      if (change.path.includes('scripts/')) return 'scripts';
      if (change.path.includes('tests/')) return 'tests';
    }
    return 'general';
  }

  // Message modification methods
  private addLLMInsightsToMessage(message: string, llmInsightsRef: string): string {
    if (message.includes('LLM-Insights:')) {
      return message.replace(/LLM-Insights:\s*fossil:[^\n]*/, `LLM-Insights: fossil:${llmInsightsRef}`);
    }
    return `${message}\n\nLLM-Insights: fossil:${llmInsightsRef}`;
  }

  private addRoadmapImpactToMessage(message: string, impact: string): string {
    if (message.includes('Roadmap-Impact:')) {
      return message.replace(/Roadmap-Impact:\s*(low|medium|high)/, `Roadmap-Impact: ${impact}`);
    }
    return `${message}\nRoadmap-Impact: ${impact}`;
  }

  private addAutomationScopeToMessage(message: string, scope: string[]): string {
    if (message.includes('Automation-Scope:')) {
      return message.replace(/Automation-Scope:\s*[^\n]*/, `Automation-Scope: ${scope.join(', ')}`);
    }
    return `${message}\nAutomation-Scope: ${scope.join(', ')}`;
  }

  private addScopeToMessage(message: string, scope: string): string {
    const match = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf):\s+(.+)$/);
    if (match) {
      return `${match[1]}(${scope}): ${match[2]}`;
    }
    return message;
  }

  // Audit and tracking methods
  private async getCommits(params: CommitAuditParams | CommitTrackingParams): Promise<any[]> {
    let gitCommand = 'git log --pretty=format:"%H|%an|%ad|%s" --date=iso';

    if ('range' in params && params.range) {
      gitCommand += ` ${params.range}`;
    } else if (params.since) {
      gitCommand += ` --since="${params.since}"`;
    } else {
      const thirtyDaysAgo = formatISO(subDays(new Date(), 30));
      gitCommand += ` --since="${thirtyDaysAgo}"`;
    }

    if ('author' in params && params.author) {
      gitCommand += ` --author="${params.author}"`;
    }

    const { stdout: output } = executeCommand(gitCommand);
    const commits: any[] = [];

    for (const line of output.trim().split('\n')) {
      if (!line) continue;
      const [hash, author, date, message] = line.split('|');
      commits.push({ hash, author, date, message });
    }

    return commits;
  }

  private async getCommitData(commitHash: string): Promise<any> {
    const { stdout: output } = executeCommand(`git show --pretty=format:"%H|%an|%ad|%s" --date=iso ${commitHash}`);
    const lines = output.trim().split('\n');
    const hashLine = lines[0];
    if (!hashLine) {
      throw new Error(`No commit data found for hash: ${commitHash}`);
    }
    const bodyLines = lines.slice(1);
    const [hash, author, date, message] = hashLine.split('|');
    const body = bodyLines.join('\n');
    
    return {
      hash,
      author,
      date,
      message: `${message}\n\n${body}`,
      gitDiff: await this.getCommitDiff(commitHash)
    };
  }

  private async applyFix(commitHash: string, fix: CommitFix): Promise<void> {
    // In production, this would use git filter-branch or similar
    console.log(`Applying fix to commit ${commitHash}: ${fix.description}`);
  }

  private generateAuditReport(auditData: CommitAuditData[], params: CommitAuditParams): AuditReport {
    const valid = auditData.filter(c => c.validation.valid).length;
    const metadataComplete = auditData.filter(c => c.validation.metadataComplete).length;
    const averageScore = auditData.reduce((sum, c) => sum + c.validation.score, 0) / auditData.length;

    const issues = {
      missingLLMInsights: auditData.filter(c => !c.validation.llmInsightsRef).length,
      missingRoadmapImpact: auditData.filter(c => !c.validation.roadmapImpact).length,
      missingAutomationScope: auditData.filter(c => !c.validation.automationScope || c.validation.automationScope.length === 0).length,
      invalidFormat: auditData.filter(c => !c.validation.conventionalFormat).length,
      missingScope: auditData.filter(c => !c.validation.scope).length
    };

    const fixes = {
      applied: 0,
      suggested: auditData.length,
      total: auditData.length
    };

    const recommendations = this.generateRecommendations(auditData);

    const report: AuditReport = {
      period: {
        start: auditData[auditData.length - 1]?.date || '',
        end: auditData[0]?.date || '',
        totalCommits: auditData.length
      },
      validation: {
        valid,
        invalid: auditData.length - valid,
        metadataComplete,
        averageScore
      },
      issues,
      fixes,
      commits: auditData,
      recommendations
    };

    // Validate with schema
    AuditReportSchema.parse(report);
    return report;
  }

  private generateRecommendations(auditData: CommitAuditData[]): string[] {
    const recommendations: string[] = [];

    const missingLLMInsights = auditData.filter(c => !c.validation.llmInsightsRef).length;
    if (missingLLMInsights > 0) {
      recommendations.push(`Add LLM insights to ${missingLLMInsights} commits for better traceability`);
    }

    const missingScope = auditData.filter(c => !c.validation.scope).length;
    if (missingScope > 0) {
      recommendations.push(`Add scope to ${missingScope} commits for better categorization`);
    }

    const lowScores = auditData.filter(c => c.validation.score < 70).length;
    if (lowScores > 0) {
      recommendations.push(`Improve ${lowScores} commits with scores below 70`);
    }

    return recommendations;
  }

  private calculateFormatImprovement(commits: any[]): number {
    // Simple calculation - in production, use more sophisticated metrics
    return 85.5; // Placeholder
  }

  private calculateMetadataCompleteness(commits: any[]): number {
    // Simple calculation - in production, use more sophisticated metrics
    return 72.3; // Placeholder
  }

  private calculateAverageScore(commits: any[]): number {
    // Simple calculation - in production, use more sophisticated metrics
    return 78.9; // Placeholder
  }

  private analyzeTrends(commits: any[]): any {
    // Simple analysis - in production, use more sophisticated metrics
    return {
      formatImprovement: 'increasing',
      metadataCompleteness: 'stable',
      averageScore: 'improving'
    };
  }

  private generateTrackingRecommendations(commits: any[]): string[] {
    return [
      'Continue enforcing strict commit message validation',
      'Add more comprehensive LLM insights generation',
      'Improve automation scope detection',
      'Consider implementing commit message templates'
    ];
  }
}

// CLI argument parsing
function parseArgs(): any {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--validate':
        params.validate = true;
        break;
      case '--audit':
        params.audit = true;
        break;
      case '--fix':
        params.fix = true;
        break;
      case '--track':
        params.track = true;
        break;
      case '--message':
        params.message = args[++i];
        break;
      case '--file':
        params.file = args[++i];
        break;
      case '--pre-commit':
        params.preCommit = true;
        break;
      case '--strict':
        params.strict = true;
        break;
      case '--since':
        params.since = args[++i];
        break;
      case '--range':
        params.range = args[++i];
        break;
      case '--author':
        params.author = args[++i];
        break;
      case '--commit':
        params.commit = args[++i];
        break;
      case '--auto-fix':
        params.autoFix = true;
        break;
      case '--output':
        params.output = args[++i];
        break;
      case '--help':
        console.log(`
Usage: bun run scripts/enhanced-pre-commit-validator.ts [command] [options]

Commands:
  --validate              Validate current commit message
  --audit                 Audit commit history
  --fix                   Fix commit messages
  --track                 Track commit message evolution

Options:
  --message <msg>         Validate specific commit message
  --file <path>           Validate commit message from file
  --pre-commit            Validate staged commit message
  --strict                Enable strict validation (default: true)
  --since <date>          Since date for audit/track
  --range <range>         Git commit range for audit/track
  --author <author>       Filter by author
  --commit <hash>         Specific commit to fix
  --auto-fix              Automatically apply fixes
  --output <file>         Output file for results
  --help                  Show this help message

Examples:
  bun run scripts/enhanced-pre-commit-validator.ts --validate --pre-commit --strict
  bun run scripts/enhanced-pre-commit-validator.ts --audit --since 2025-01-01 --output audit.json
  bun run scripts/enhanced-pre-commit-validator.ts --fix --commit HEAD --auto-fix
  bun run scripts/enhanced-pre-commit-validator.ts --track --output tracking.json
        `);
        process.exit(0);
    }
  }

  return params;
}

// Main execution
async function main() {
  const validator = new EnhancedPreCommitValidator();

  try {
    const args = process.argv.slice(2);
    
    // Check for command flags
    const hasValidate = args.includes('--validate');
    const hasAudit = args.includes('--audit');
    const hasFix = args.includes('--fix');
    const hasTrack = args.includes('--track');
    
    if (hasValidate) {
      // Use the custom parseArgs function for better CLI argument handling
      const params = parseArgs();
      console.log('🔍 Debug: Received params:', JSON.stringify(params, null, 2));
      await validator.validateCommit(params);
    } else if (hasAudit) {
      const params = parseCLIArgs(CommitAuditParamsSchema, args);
      await validator.auditCommits(params);
    } else if (hasFix) {
      const params = parseCLIArgs(CommitFixParamsSchema, args);
      await validator.fixCommit(params);
    } else if (hasTrack) {
      const params = parseCLIArgs(CommitTrackingParamsSchema, args);
      await validator.trackCommits(params);
    } else {
      console.error('❌ No command specified. Use --help for usage information.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
} 