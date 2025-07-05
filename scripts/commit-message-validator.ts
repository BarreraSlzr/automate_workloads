#!/usr/bin/env bun
/**
 * Commit Message Validator
 * 
 * Enhanced validation for commit messages including conventional commit format
 * and LLM insights metadata validation for proper traceability.
 * 
 * Usage:
 *   bun run scripts/commit-message-validator.ts --message "feat(cli): add new feature"
 *   bun run scripts/commit-message-validator.ts --file .git/COMMIT_EDITMSG
 *   bun run scripts/commit-message-validator.ts --pre-commit
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Commit message validation schema
const CommitMessageSchema = z.object({
  message: z.string().min(1),
  conventionalFormat: z.boolean(),
  type: z.enum(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']).optional(),
  scope: z.string().optional(),
  description: z.string().min(1),
  body: z.string().optional(),
  footer: z.string().optional(),
  breakingChange: z.boolean().default(false),
  issues: z.array(z.string()).default([]),
  llmInsightsRef: z.string().optional(),
  roadmapImpact: z.enum(['low', 'medium', 'high']).optional(),
  automationScope: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).default([]),
  score: z.number().min(0).max(100),
  valid: z.boolean()
});

interface CommitMessageValidation {
  message: string;
  conventionalFormat: boolean;
  type?: string;
  scope?: string;
  description: string;
  body?: string;
  footer?: string;
  breakingChange: boolean;
  issues: string[];
  llmInsightsRef?: string;
  roadmapImpact?: 'low' | 'medium' | 'high';
  automationScope?: string[];
  suggestions: string[];
  score: number;
  valid: boolean;
}

class CommitMessageValidator {
  private conventionalCommitRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:\s+(.+)$/;
  private llmInsightsRegex = /LLM-Insights:\s*fossil:([^\n]+)/;
  private roadmapImpactRegex = /Roadmap-Impact:\s*(low|medium|high)/;
  private automationScopeRegex = /Automation-Scope:\s*([^\n]+)/;
  private issueRegex = /#(\d+)/g;

  /**
   * Validate commit message from command line arguments
   */
  async validateFromArgs(args: {
    message?: string;
    file?: string;
    preCommit?: boolean;
    strict?: boolean;
  }): Promise<CommitMessageValidation> {
    let message = '';

    if (args.message) {
      message = args.message;
    } else if (args.file) {
      message = this.readCommitMessageFile(args.file);
    } else if (args.preCommit) {
      message = this.getLastCommitMessage();
    } else {
      throw new Error('No message, file, or pre-commit flag provided');
    }

    return this.validateCommitMessage(message, args.strict || false);
  }

  /**
   * Validate a commit message
   */
  validateCommitMessage(message: string, strict: boolean = false): CommitMessageValidation {
    const lines = message.trim().split('\n');
    const firstLine = lines[0] || '';
    const body = lines.slice(1).join('\n');

    // Parse conventional commit format
    const conventionalMatch = firstLine.match(this.conventionalCommitRegex);
    const conventionalFormat = !!conventionalMatch;

    // Extract basic components
    const type = conventionalMatch?.[1];
    const scope = conventionalMatch?.[2]?.slice(1, -1);
    const description = conventionalMatch?.[3] || firstLine || '';

    // Extract metadata from body
    const llmInsightsRef = this.extractLLMInsightsRef(body);
    const roadmapImpact = this.extractRoadmapImpact(body);
    const automationScope = this.extractAutomationScope(body);
    const issues = this.extractIssues(message);
    const breakingChange = message.includes('BREAKING CHANGE');

    // Generate suggestions
    const suggestions = this.generateSuggestions(message, conventionalFormat, strict);

    // Calculate score
    const score = this.calculateScore(message, conventionalFormat, llmInsightsRef, roadmapImpact);

    // Determine validity
    const valid = this.isValid(message, conventionalFormat, strict);

    const validation: CommitMessageValidation = {
      message,
      conventionalFormat,
      type,
      scope,
      description,
      body,
      breakingChange,
      issues,
      llmInsightsRef,
      roadmapImpact,
      automationScope,
      suggestions,
      score,
      valid
    };

    // Validate with Zod schema
    try {
      CommitMessageSchema.parse(validation);
    } catch (error) {
      console.error('❌ Commit message validation failed:', error);
      validation.valid = false;
    }

    return validation;
  }

  /**
   * Extract LLM insights reference from commit body
   */
  private extractLLMInsightsRef(body: string): string | undefined {
    const match = body.match(this.llmInsightsRegex);
    return match?.[1]?.trim();
  }

  /**
   * Extract roadmap impact from commit body
   */
  private extractRoadmapImpact(body: string): 'low' | 'medium' | 'high' | undefined {
    const match = body.match(this.roadmapImpactRegex);
    return match?.[1] as 'low' | 'medium' | 'high' | undefined;
  }

  /**
   * Extract automation scope from commit body
   */
  private extractAutomationScope(body: string): string[] | undefined {
    const match = body.match(this.automationScopeRegex);
    if (!match) return undefined;
    
    return (match[1] || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Extract issue references from message
   */
  private extractIssues(message: string): string[] {
    const matches = message.match(this.issueRegex);
    return matches ? matches.map(match => match.slice(1)) : [];
  }

  /**
   * Generate suggestions for improving commit message
   */
  private generateSuggestions(message: string, conventionalFormat: boolean, strict: boolean): string[] {
    const suggestions: string[] = [];

    if (!conventionalFormat) {
      suggestions.push('Use conventional commit format: type(scope): description');
      suggestions.push('Add scope to indicate affected area (e.g., feat(github): add issue creation)');
    }

    if (message.length < 10) {
      suggestions.push('Provide more descriptive commit message');
    }

    if (message.length > 72) {
      suggestions.push('Keep commit message under 72 characters for first line');
    }

    if (strict) {
      // Strict mode suggestions
      if (!this.extractLLMInsightsRef(message)) {
        suggestions.push('Consider adding LLM-Insights: fossil:reference for traceability');
      }

      if (!this.extractRoadmapImpact(message)) {
        suggestions.push('Consider adding Roadmap-Impact: low|medium|high for tracking');
      }

      if (!this.extractAutomationScope(message)) {
        suggestions.push('Consider adding Automation-Scope: area1,area2 for automation tracking');
      }
    }

    return suggestions;
  }

  /**
   * Calculate commit message score
   */
  private calculateScore(message: string, conventionalFormat: boolean, llmInsightsRef?: string, roadmapImpact?: string): number {
    let score = 0;

    // Base score for conventional format
    if (conventionalFormat) score += 40;

    // Length score
    if (message.length >= 10 && message.length <= 72) score += 20;

    // Scope score
    if (message.includes('(') && message.includes(')')) score += 15;

    // Issue references score
    if (this.extractIssues(message).length > 0) score += 10;

    // LLM insights reference score
    if (llmInsightsRef) score += 10;

    // Roadmap impact score
    if (roadmapImpact) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Determine if commit message is valid
   */
  private isValid(message: string, conventionalFormat: boolean, strict: boolean): boolean {
    if (!conventionalFormat) return false;
    if (message.length < 5) return false;
    if (message.length > 500) return false;

    if (strict) {
      // In strict mode, require LLM insights reference for feature commits
      if (message.includes('feat(') && !this.extractLLMInsightsRef(message)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Read commit message from file
   */
  private readCommitMessageFile(filePath: string): string {
    if (!existsSync(filePath)) {
      throw new Error(`Commit message file not found: ${filePath}`);
    }
    return readFileSync(filePath, 'utf8');
  }

  /**
   * Get last commit message
   */
  private getLastCommitMessage(): string {
    try {
      return execSync('git log -1 --pretty=%B', { encoding: 'utf8' });
    } catch (error) {
      throw new Error('Failed to get last commit message');
    }
  }

  /**
   * Display validation results
   */
  displayResults(validation: CommitMessageValidation): void {
    console.log('📝 Commit Message Validation Results');
    console.log('='.repeat(50));

    if (validation.valid) {
      console.log('✅ Commit message is valid');
    } else {
      console.log('❌ Commit message is invalid');
    }

    console.log(`📊 Score: ${validation.score}/100`);
    console.log(`🔧 Conventional Format: ${validation.conventionalFormat ? '✅' : '❌'}`);
    
    if (validation.type) {
      console.log(`📋 Type: ${validation.type}`);
    }
    
    if (validation.scope) {
      console.log(`🎯 Scope: ${validation.scope}`);
    }

    console.log(`📄 Description: ${validation.description}`);

    if (validation.llmInsightsRef) {
      console.log(`🧠 LLM Insights: ${validation.llmInsightsRef}`);
    }

    if (validation.roadmapImpact) {
      console.log(`🗺️ Roadmap Impact: ${validation.roadmapImpact}`);
    }

    if (validation.automationScope && validation.automationScope.length > 0) {
      console.log(`🤖 Automation Scope: ${validation.automationScope.join(', ')}`);
    }

    if (validation.issues.length > 0) {
      console.log(`🔗 Issues: ${validation.issues.join(', ')}`);
    }

    if (validation.breakingChange) {
      console.log('⚠️ Breaking Change: Yes');
    }

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

  /**
   * Generate example commit message
   */
  generateExample(type: string = 'feat', scope: string = 'cli'): string {
    return `# Example commit message with LLM insights metadata

${type}(${scope}): add new feature with comprehensive validation

This commit adds a new feature that includes:
- Enhanced validation patterns
- Improved error handling
- Better user experience

LLM-Insights: fossil:insight-commit-hash-123
Roadmap-Impact: high
Automation-Scope: cli, fossilization, validation

Closes #123
Fixes #456`;
  }
}

// CLI argument parsing
function parseArgs(): any {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
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
      case '--example':
        params.example = true;
        break;
      case '--help':
        console.log(`
Usage: bun run scripts/commit-message-validator.ts [options]

Options:
  --message <msg>     Validate specific commit message
  --file <path>       Validate commit message from file
  --pre-commit        Validate last commit message (for pre-commit hooks)
  --strict            Enable strict validation (requires LLM insights metadata)
  --example           Generate example commit message
  --help              Show this help message

Examples:
  bun run scripts/commit-message-validator.ts --message "feat(cli): add new feature"
  bun run scripts/commit-message-validator.ts --file .git/COMMIT_EDITMSG
  bun run scripts/commit-message-validator.ts --pre-commit --strict
  bun run scripts/commit-message-validator.ts --example
        `);
        process.exit(0);
    }
  }

  return params;
}

// Main execution
async function main() {
  const args = parseArgs();
  const validator = new CommitMessageValidator();

  try {
    if (args.example) {
      console.log(validator.generateExample());
      return;
    }

    const validation = await validator.validateFromArgs(args);
    validator.displayResults(validation);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
} 