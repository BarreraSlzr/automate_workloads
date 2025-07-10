/**
 * GitHub service integration using GitHub CLI
 * @module services/github
 */

import { executeCommand, executeCommandJSON, isCommandAvailable } from "../utils/cli";
import type { GitHubIssue } from "@/types/github";
import type { ServiceResponse, CLIOptions } from "../types";
import * as fs from 'fs';
import * as path from 'path';
import type { AutomationTemplateFields } from '../types/github';
import type { GitHubOptions } from '@/types/cli';

// Utility to load and fill the automation issue template
export function loadAndFillAutomationTemplate(fields: AutomationTemplateFields): string {
  const templatePath = path.resolve('.github/ISSUE_TEMPLATE/automation_task.yml');
  const content = fs.readFileSync(templatePath, 'utf8');
  // Compose the body using the template's markdown and fields
  let body = '## Automation Task\n';
  if (fields.purpose) {
    body += `\n**Purpose:**\n${fields.purpose}\n`;
  }
  if (fields.checklist) {
    body += `\n**Checklist:**\n${fields.checklist}\n`;
  }
  if (fields.metadata) {
    body += `\n**Metadata:**\n${fields.metadata}\n`;
  }
  return body;
}

/**
 * GitHub service class for managing GitHub operations
 */
export class GitHubService {
  private owner: string;
  private repo: string;

  /**
   * Creates a new GitHub service instance
   * 
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * 
   * @example
   * ```typescript
   * const github = new GitHubService('BarreraSlzr', 'automate_workloads');
   * ```
   */
  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Checks if GitHub CLI is available and authenticated
   * 
   * @returns {Promise<boolean>} True if GitHub CLI is ready
   * 
   * @example
   * ```typescript
   * const isReady = await github.isReady();
   * if (!isReady) {
   *   console.log('Please run: gh auth login');
   * }
   * ```
   */
  async isReady(): Promise<boolean> {
    if (!isCommandAvailable('gh')) {
      return false;
    }

    try {
      const result = executeCommand('gh auth status');
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Fetches all issues from the repository
   * 
   * @param {Partial<GitHubOptions>} options - Fetch options
   * @returns {Promise<ServiceResponse<GitHubIssue[]>>} Issues response
   * 
   * @example
   * ```typescript
   * const response = await github.getIssues({ state: 'open' });
   * if (response.success) {
   *   console.log(`Found ${response.data?.length} open issues`);
   * }
   * ```
   */
  async getIssues(options: Partial<GitHubOptions> = {}): Promise<ServiceResponse<GitHubIssue[]>> {
    try {
      const { state = 'open', labels, assignee } = options;
      
      let command = `gh issue list --repo ${this.owner}/${this.repo} --state ${state} --json number,title,state,body,labels,assignees,createdAt,updatedAt`;
      
      if (labels && labels.length > 0) {
        command += ` --label "${labels.join(',')}"`;
      }
      
      if (assignee) {
        command += ` --assignee "${assignee}"`;
      }

      const issues = executeCommandJSON<GitHubIssue[]>(command);
      
      return {
        success: true,
        data: issues,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch issues',
        statusCode: 500,
      };
    }
  }

  /**
   * Create a GitHub issue using fossil-backed creation for deduplication and traceability
   */
  async createIssue(
    title: string,
    body: string,
    options: Partial<GitHubOptions> = {}
  ): Promise<ServiceResponse<GitHubIssue>> {
    try {
      // Import createFossilIssue dynamically to avoid circular dependencies
      const { createFossilIssue } = await import('../utils/fossilIssue');
      
      const result = await createFossilIssue({
        body: body,
        title: title,
        section: options.section || 'general',
        metadata: { source: 'github-service', ...options.metadata },
        type: 'action',
        tags: ['github-service'],
        parsedFields: {}
      });
      
      if (result.deduplicated) {
        return {
          success: true,
          data: { 
            title, 
            number: parseInt(result.issueNumber || '0'), 
            state: 'open',
            body,
            labels: options.labels || [],
            assignees: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          statusCode: 200
        };
      }
      
      return {
        success: true,
        data: { 
          title, 
          number: parseInt(result.issueNumber || '0'), 
          state: 'open',
          body,
          labels: options.labels || [],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create issue',
        statusCode: 500,
      };
    }
  }

  /**
   * Closes an issue
   * 
   * @param {number} issueNumber - Issue number to close
   * @param {string} comment - Optional closing comment
   * @returns {Promise<ServiceResponse<boolean>>} Close operation response
   * 
   * @example
   * ```typescript
   * const response = await github.closeIssue(123, 'Fixed in v1.2.0');
   * ```
   */
  async closeIssue(issueNumber: number, comment?: string): Promise<ServiceResponse<boolean>> {
    try {
      let command = `gh issue close ${issueNumber} --repo ${this.owner}/${this.repo}`;
      
      const trimmedComment = comment?.trim();
      if (trimmedComment) {
        command += ` --reason completed --comment "${trimmedComment}"`;
      }

      const result = executeCommand(command);
      
      return {
        success: result.success,
        data: result.success,
        error: result.success ? undefined : result.stderr,
        statusCode: result.exitCode,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close issue',
        statusCode: 500,
      };
    }
  }

  /**
   * Adds a comment to an issue
   * 
   * @param {number} issueNumber - Issue number
   * @param {string} comment - Comment content
   * @returns {Promise<ServiceResponse<boolean>>} Comment operation response
   * 
   * @example
   * ```typescript
   * const response = await github.addComment(123, 'This is a comment');
   * ```
   */
  async addComment(issueNumber: number, comment: string): Promise<ServiceResponse<boolean>> {
    try {
      const command = `gh issue comment ${issueNumber} --repo ${this.owner}/${this.repo} --body "${comment}"`;
      const result = executeCommand(command);
      
      return {
        success: result.success,
        data: result.success,
        error: result.success ? undefined : result.stderr,
        statusCode: result.exitCode,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment',
        statusCode: 500,
      };
    }
  }

  /**
   * Gets repository information
   * 
   * @returns {Promise<ServiceResponse<any>>} Repository information
   * 
   * @example
   * ```typescript
   * const response = await github.getRepoInfo();
   * ```
   */
  async getRepoInfo(): Promise<ServiceResponse<any>> {
    try {
      const command = `gh repo view ${this.owner}/${this.repo} --json name,description,url,createdAt,updatedAt,issues`;
      const repoInfo = executeCommandJSON(command);
      
      return {
        success: true,
        data: repoInfo,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repository info',
        statusCode: 500,
      };
    }
  }

  /**
   * Formats issues for display
   * 
   * @param {GitHubIssue[]} issues - Issues to format
   * @param {string} format - Output format
   * @returns {string} Formatted issues
   * 
   * @example
   * ```typescript
   * const response = await github.getIssues();
   * if (response.success && response.data) {
   *   console.log(github.formatIssues(response.data, 'table'));
   * }
   * ```
   */
  formatIssues(issues: GitHubIssue[], format: 'text' | 'json' | 'table' = 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(issues, null, 2);
      case 'table':
        if (issues.length === 0) return 'No issues found';
        
        const headers = ['#', 'Title', 'State', 'Labels', 'Created'];
        const rows = issues.map(issue => [
          issue.number.toString(),
          issue.title,
          issue.state,
          (issue.labels ?? []).join(', '),
          new Date(issue.created_at ?? Date.now()).toLocaleDateString(),
        ]);
        
        const table = [
          headers.join(' | '),
          headers.map(() => '---').join(' | '),
          ...rows.map(row => row.join(' | '))
        ];
        
        return table.join('\n');
      default:
        return issues.map(issue => 
          `#${issue.number}: ${issue.title} [${issue.state}]`
        ).join('\n');
    }
  }

  /**
   * Checks if an issue with the given title exists in the repository
   * @param {string} title - Issue title to search for
   * @param {'open' | 'all'} state - Issue state to search (default: 'open')
   * @returns {boolean} True if an issue with the title exists
   */
  issueExistsByTitle(title: string, state: 'open' | 'all' = 'open'): boolean {
    // Use the shared utility
    const { issueExists } = require('../utils/cli');
    return issueExists({ owner: this.owner, repo: this.repo, title, state });
  }
} 