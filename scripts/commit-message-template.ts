#!/usr/bin/env bun
/**
 * Commit Message Template System
 * 
 * Provides structured commit message templates in JSON/YAML format
 * for better programmatic mapping and audit processes.
 * 
 * Usage:
 *   bun run scripts/commit-message-template.ts --create --type feat --scope cli
 *   bun run scripts/commit-message-template.ts --from-json template.json
 *   bun run scripts/commit-message-template.ts --to-json "feat(cli): add new feature"
 *   bun run scripts/commit-message-template.ts --validate template.json
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { formatISO } from 'date-fns';
import { 
  parseCLIArgs,
  CommitTemplateCreateParamsSchema,
  CommitTemplateFromJsonParamsSchema,
  CommitTemplateToJsonParamsSchema,
  CommitTemplateValidateParamsSchema,
  CommitTemplateCreateParams,
  CommitTemplateToJsonParams,
  CommitTemplateValidateParams,
  CommitTemplateGenerateParams,
  CommitMessageTemplate,
  CommitMessageTemplateSchema
} from '../src/types/cli';
import { parseJsonSafe } from '@/utils/json';
import { executeCommand } from '@/utils/cli';

class CommitMessageTemplateSystem {
  private templatesDir = 'fossils/commit_templates';

  constructor() {
    this.ensureTemplatesDir();
  }

  /**
   * Create a new commit message template
   */
  async createTemplate(params: CommitTemplateCreateParams): Promise<CommitMessageTemplate> {
    const templateId = `${params.type}-${params.scope}-${Date.now()}`;
    
    const template: CommitMessageTemplate = {
      metadata: {
        version: '1.0.0',
        templateId,
        createdAt: formatISO(new Date()),
        author: this.getCurrentAuthor(),
        validator: 'enhanced-pre-commit-validator'
      },
      commit: {
        type: params.type,
        scope: params.scope,
        description: params.description,
        body: params.body,
        footer: '',
        breakingChange: false,
        issues: []
      },
      llmInsights: {
        reference: params.llmInsightsRef || `insight-${templateId}`,
        summary: `Commit ${params.type}(${params.scope}): ${params.description}`,
        impact: params.roadmapImpact || 'medium',
        category: this.determineCategory(params.type),
        blockers: [],
        recommendations: this.generateRecommendations(params.type, params.scope),
        automationOpportunities: this.generateAutomationOpportunities(params.type, params.scope),
        roadmapImpact: {
          level: params.roadmapImpact || 'medium',
          affectedTasks: [],
          newTasks: [],
          completedTasks: []
        },
        automationScope: params.automationScope || [params.scope]
      },
      audit: {
        timestamp: formatISO(new Date()),
        score: this.calculateTemplateScore(params),
        valid: true,
        metadataComplete: true,
        suggestions: []
      }
    };

    // Validate template
    const validatedTemplate = CommitMessageTemplateSchema.parse(template);

    // Save template
    if (params.output) {
      this.saveTemplate(validatedTemplate, params.output, params.format || 'json');
    } else {
      const defaultOutput = join(this.templatesDir, `${templateId}.json`);
      this.saveTemplate(validatedTemplate, defaultOutput, 'json');
    }

    return validatedTemplate;
  }

  /**
   * Convert conventional commit message to template
   */
  async fromConventionalMessage(params: CommitTemplateToJsonParams): Promise<CommitMessageTemplate> {
    const lines = params.message.trim().split('\n');
    const firstLine = lines[0] || '';
    const body = lines.slice(1).join('\n');

    // Parse conventional commit format
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:\s+(.+)$/;
    const match = firstLine.match(conventionalRegex);

    if (!match) {
      throw new Error('Invalid conventional commit format');
    }

    const [, type, scopeMatch, description] = match;
    const scope = scopeMatch ? scopeMatch.slice(1, -1) : 'general';
    const commitType = type as 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'perf';
    const commitDescription = description || '';

    // Extract metadata from body
    const llmInsightsRef = this.extractLLMInsightsRef(body);
    const roadmapImpact = this.extractRoadmapImpact(body);
    const automationScope = this.extractAutomationScope(body);
    const issues = this.extractIssues(params.message);

    const template: CommitMessageTemplate = {
      metadata: {
        version: '1.0.0',
        templateId: `converted-${commitType}-${scope}-${Date.now()}`,
        createdAt: formatISO(new Date()),
        author: this.getCurrentAuthor(),
        validator: 'enhanced-pre-commit-validator'
      },
      commit: {
        type: commitType,
        scope,
        description: commitDescription,
        body: body || undefined,
        footer: '',
        breakingChange: params.message.includes('BREAKING CHANGE'),
        issues
      },
      llmInsights: {
        reference: llmInsightsRef || `insight-${commitType}-${scope}-${Date.now()}`,
        summary: `Commit ${commitType}(${scope}): ${commitDescription}`,
        impact: roadmapImpact || 'medium',
        category: this.determineCategory(commitType),
        blockers: [],
        recommendations: this.generateRecommendations(commitType, scope),
        automationOpportunities: this.generateAutomationOpportunities(commitType, scope),
        roadmapImpact: {
          level: roadmapImpact || 'medium',
          affectedTasks: [],
          newTasks: [],
          completedTasks: []
        },
        automationScope: automationScope || [scope]
      },
      audit: {
        timestamp: formatISO(new Date()),
        score: this.calculateMessageScore(params.message, commitType, scope, llmInsightsRef, roadmapImpact),
        valid: true,
        metadataComplete: !!(llmInsightsRef && roadmapImpact && automationScope),
        suggestions: this.generateSuggestions(params.message, commitType, scope, llmInsightsRef, roadmapImpact)
      }
    };

    return CommitMessageTemplateSchema.parse(template);
  }

  /**
   * Convert template to conventional commit message
   */
  toConventionalMessage(template: CommitMessageTemplate): string {
    let message = `${template.commit.type}(${template.commit.scope}): ${template.commit.description}`;

    if (template.commit.body) {
      message += `\n\n${template.commit.body}`;
    }

    // Add LLM insights metadata
    message += `\n\nLLM-Insights: fossil:${template.llmInsights.reference}`;
    message += `\nRoadmap-Impact: ${template.llmInsights.roadmapImpact.level}`;
    message += `\nAutomation-Scope: ${template.llmInsights.automationScope.join(', ')}`;

    // Add issue references
    if (template.commit.issues.length > 0) {
      message += `\n\nCloses ${template.commit.issues.map(issue => `#${issue}`).join(', ')}`;
    }

    return message;
  }

  /**
   * Validate template
   */
  validateTemplate(params: CommitTemplateValidateParams): { valid: boolean; errors: string[] } {
    try {
      const template = this.loadTemplate(params.file);
      CommitMessageTemplateSchema.parse(template);
      return { valid: true, errors: [] };
    } catch (error: any) {
      const errors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || [error.message];
      return { valid: false, errors };
    }
  }

  /**
   * Load template from file
   */
  loadTemplate(filePath: string): CommitMessageTemplate {
    if (!existsSync(filePath)) {
      throw new Error(`Template file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf8');
    let template: any;

    if (filePath.endsWith('.json')) {
      template = parseJsonSafe(content, 'scripts:commit-message-template:content');
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      // In production, use proper YAML parser
      template = parseJsonSafe(content, 'scripts:commit-message-template:content');
    } else {
      throw new Error('Unsupported file format. Use .json or .yaml');
    }

    const validation = this.validateTemplate({ 
      file: filePath,
      dryRun: false,
      test: false,
      verbose: false,
      help: false
    });
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    return template;
  }

  /**
   * Save template to file
   */
  saveTemplate(template: CommitMessageTemplate, filePath: string, format: 'json' | 'yaml' = 'json'): void {
    let content: string;

    if (format === 'json') {
      content = JSON.stringify(template, null, 2);
    } else {
      // In production, use proper YAML serializer
      content = JSON.stringify(template, null, 2);
    }

    writeFileSync(filePath, content);
    console.log(`📄 Template saved to: ${filePath}`);
  }

  /**
   * Generate template from git diff
   */
  async generateFromGitDiff(params: CommitTemplateGenerateParams): Promise<CommitMessageTemplate> {
    const gitDiff = await this.getGitDiff();
    
    let llmInsightsRef = `insight-${params.type}-${params.scope}-${Date.now()}`;
    let roadmapImpact: 'low' | 'medium' | 'high' = 'medium';
    let automationScope = [params.scope];

    if (params.autoAnalyze) {
      // Analyze git diff to determine metadata
      roadmapImpact = this.analyzeGitDiffImpact(gitDiff);
      automationScope = this.analyzeGitDiffScope(gitDiff);
      llmInsightsRef = await this.generateLLMInsightsRef(gitDiff, params);
    }

    return this.createTemplate({
      ...params,
      llmInsightsRef,
      roadmapImpact,
      automationScope,
      output: params.output,
      format: 'json'
    });
  }

  /**
   * Create template from interactive input
   */
  async createInteractive(): Promise<CommitMessageTemplate> {
    // In production, this would use a proper interactive CLI
    console.log('Interactive template creation not implemented yet.');
    console.log('Use --create with specific parameters instead.');
    process.exit(1);
  }

  // Utility methods
  private ensureTemplatesDir(): void {
    if (!existsSync(this.templatesDir)) {
      const fs = require('fs');
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  private getCurrentAuthor(): string {
    try {
      const result = executeCommand('git config user.name');
      return result.success ? result.stdout.trim() : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  private determineCategory(type: string): string {
    const categories: Record<string, string> = {
      feat: 'feature',
      fix: 'bugfix',
      docs: 'documentation',
      style: 'style',
      refactor: 'refactoring',
      test: 'testing',
      chore: 'maintenance',
      perf: 'performance'
    };
    return categories[type] || 'general';
  }

  private generateRecommendations(type: string, scope: string): string[] {
    const recommendations: string[] = [];

    if (type === 'feat') {
      recommendations.push('Add tests for the new feature');
      recommendations.push('Update documentation');
    } else if (type === 'fix') {
      recommendations.push('Add regression tests');
      recommendations.push('Review similar code for potential issues');
    }

    if (scope === 'cli') {
      recommendations.push('Test CLI functionality');
      recommendations.push('Update help documentation');
    }

    return recommendations;
  }

  private generateAutomationOpportunities(type: string, scope: string): string[] {
    const opportunities: string[] = [];

    if (type === 'docs') {
      opportunities.push('Automate documentation generation');
    } else if (type === 'test') {
      opportunities.push('Automate test execution');
    } else if (type === 'chore') {
      opportunities.push('Automate build and deployment');
    }

    if (scope === 'cli') {
      opportunities.push('Automate CLI testing');
    }

    return opportunities;
  }

  private calculateTemplateScore(params: CommitTemplateCreateParams): number {
    let score = 0;

    // Base score for having all required fields
    score += 40;

    // Type and scope score
    if (params.type && params.scope) score += 20;

    // Description length score
    if (params.description && params.description.length >= 10 && params.description.length <= 72) score += 20;

    // Metadata score
    if (params.llmInsightsRef) score += 10;
    if (params.roadmapImpact) score += 5;
    if (params.automationScope && params.automationScope.length > 0) score += 5;

    return Math.min(score, 100);
  }

  private calculateMessageScore(message: string, type: string, scope: string, llmInsightsRef?: string, roadmapImpact?: string): number {
    let score = 0;

    // Conventional format score
    score += 30;

    // Type and scope score
    if (type && scope) score += 20;

    // Length score
    if (message.length >= 10 && message.length <= 72) score += 20;

    // Metadata score
    if (llmInsightsRef) score += 15;
    if (roadmapImpact) score += 10;
    if (message.includes('(') && message.includes(')')) score += 5;

    return Math.min(score, 100);
  }

  private generateSuggestions(message: string, type: string, scope: string, llmInsightsRef?: string, roadmapImpact?: string): string[] {
    const suggestions: string[] = [];

    if (!llmInsightsRef) {
      suggestions.push('Add LLM-Insights: fossil:reference for traceability');
    }

    if (!roadmapImpact) {
      suggestions.push('Add Roadmap-Impact: low|medium|high for tracking');
    }

    if (!scope || scope === 'general') {
      suggestions.push('Add specific scope to indicate affected area');
    }

    return suggestions;
  }

  private extractLLMInsightsRef(body: string): string | undefined {
    const match = body.match(/LLM-Insights:\s*fossil:([^\n]+)/);
    return match?.[1]?.trim();
  }

  private extractRoadmapImpact(body: string): 'low' | 'medium' | 'high' | undefined {
    const match = body.match(/Roadmap-Impact:\s*(low|medium|high)/);
    return match?.[1] as 'low' | 'medium' | 'high' | undefined;
  }

  private extractAutomationScope(body: string): string[] | undefined {
    const match = body.match(/Automation-Scope:\s*([^\n]+)/);
    if (!match || !match[1]) return undefined;
    return match[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  private extractIssues(message: string): string[] {
    const issueRegex = /#(\d+)/g;
    const matches = message.match(issueRegex);
    return matches ? matches.map(match => match.slice(1)) : [];
  }

  private async getGitDiff(): Promise<any> {
    try {
      const result = executeCommand('git diff --cached --numstat');
      if (!result.success) throw new Error(result.stderr);
      const output = result.stdout;
      const changes: any[] = [];
      let additions = 0;
      let deletions = 0;

      for (const line of output.trim().split('\n')) {
        if (!line) continue;
        const parts = line.split('\t');
        if (parts.length < 3) continue;
        const [add, del, path] = parts;
        if ((add ?? '') !== '' && (del ?? '') !== '' && (path ?? '') !== '') {
          const addNum = parseInt(add ?? '0') || 0;
          const delNum = parseInt(del ?? '0') || 0;
          additions += addNum;
          deletions += delNum;
          changes.push({
            path: path ?? '',
            status: addNum > 0 && delNum === 0 ? 'added' : 
                   addNum === 0 && delNum > 0 ? 'deleted' : 'modified',
            additions: addNum,
            deletions: delNum
          });
        }
      }

      return {
        filesChanged: changes.length,
        additions,
        deletions,
        changes
      };
    } catch (error) {
      return {
        filesChanged: 0,
        additions: 0,
        deletions: 0,
        changes: []
      };
    }
  }

  private analyzeGitDiffImpact(gitDiff: any): 'low' | 'medium' | 'high' {
    const totalChanges = gitDiff.additions + gitDiff.deletions;
    if (totalChanges > 100) return 'high';
    if (totalChanges > 20) return 'medium';
    return 'low';
  }

  private analyzeGitDiffScope(gitDiff: any): string[] {
    const scopes: string[] = [];
    for (const change of gitDiff.changes || []) {
      if (change.path && change.path.includes('src/cli/')) scopes.push('cli');
      if (change.path && change.path.includes('src/utils/')) scopes.push('utils');
      if (change.path && change.path.includes('scripts/')) scopes.push('scripts');
      if (change.path && change.path.includes('tests/')) scopes.push('tests');
    }
    return [...new Set(scopes)];
  }

  private async generateLLMInsightsRef(gitDiff: any, params: CommitTemplateGenerateParams): Promise<string> {
    // In production, this would generate actual LLM insights
    return `insight-${params.type}-${params.scope}-${Date.now()}`;
  }
}

// CLI argument parsing
function parseArgs(): any {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--create':
        params.create = true;
        break;
      case '--from-json':
        params.fromJson = args[++i];
        break;
      case '--to-json':
        params.toJson = args[++i];
        break;
      case '--validate':
        params.validate = args[++i];
        break;
      case '--type':
        params.type = args[++i];
        break;
      case '--scope':
        params.scope = args[++i];
        break;
      case '--description':
        params.description = args[++i];
        break;
      case '--body':
        params.body = args[++i];
        break;
      case '--llm-insights-ref':
        params.llmInsightsRef = args[++i];
        break;
      case '--roadmap-impact':
        params.roadmapImpact = args[++i];
        break;
      case '--automation-scope':
        params.automationScope = (args[++i] || '').split(',').map(s => s.trim());
        break;
      case '--output':
        params.output = args[++i];
        break;
      case '--format':
        params.format = args[++i];
        break;
      case '--auto-analyze':
        params.autoAnalyze = true;
        break;
      case '--interactive':
        params.interactive = true;
        break;
      case '--help':
        console.log(`
Usage: bun run scripts/commit-message-template.ts [command] [options]

Commands:
  --create                    Create new template
  --from-json <file>          Load template from JSON file
  --to-json <message>         Convert conventional message to template
  --validate <file>           Validate template file
  --interactive               Create template interactively

Options:
  --type <type>               Commit type (feat, fix, docs, etc.)
  --scope <scope>             Commit scope
  --description <desc>        Commit description
  --body <body>               Commit body
  --llm-insights-ref <ref>    LLM insights reference
  --roadmap-impact <level>    Roadmap impact (low, medium, high)
  --automation-scope <scopes> Comma-separated automation scopes
  --output <file>             Output file
  --format <format>           Output format (json, yaml)
  --auto-analyze              Auto-analyze git diff for metadata
  --help                      Show this help message

Examples:
  bun run scripts/commit-message-template.ts --create --type feat --scope cli --description "add new feature"
  bun run scripts/commit-message-template.ts --from-json template.json
  bun run scripts/commit-message-template.ts --to-json "feat(cli): add new feature"
  bun run scripts/commit-message-template.ts --validate template.json
        `);
        process.exit(0);
    }
  }

  return params;
}

// Main execution
async function main() {
  const args = parseArgs();
  const templateSystem = new CommitMessageTemplateSystem();

  try {
    if (args.create) {
      if (!args.type || !args.scope || !args.description) {
        console.error('❌ --create requires --type, --scope, and --description');
        process.exit(1);
      }

      const params = parseCLIArgs(CommitTemplateCreateParamsSchema, process.argv.slice(2));
      const template = await templateSystem.createTemplate(params);
      console.log('✅ Template created successfully');
      console.log(JSON.stringify(template, null, 2));
    } else if (args.fromJson) {
      const params = parseCLIArgs(CommitTemplateFromJsonParamsSchema, process.argv.slice(2));
      const template = templateSystem.loadTemplate(params.file);
      const message = templateSystem.toConventionalMessage(template);
      console.log('📝 Conventional commit message:');
      console.log(message);
    } else if (args.toJson) {
      const params = parseCLIArgs(CommitTemplateToJsonParamsSchema, process.argv.slice(2));
      const template = await templateSystem.fromConventionalMessage(params);
      console.log('📄 Template:');
      console.log(JSON.stringify(template, null, 2));
    } else if (args.validate) {
      const params = parseCLIArgs(CommitTemplateValidateParamsSchema, process.argv.slice(2));
      const validation = templateSystem.validateTemplate(params);
      if (validation.valid) {
        console.log('✅ Template is valid');
      } else {
        console.log('❌ Template is invalid:');
        validation.errors.forEach(error => console.log(`  • ${error}`));
        process.exit(1);
      }
    } else if (args.interactive) {
      await templateSystem.createInteractive();
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