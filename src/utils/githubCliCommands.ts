import { executeCommand } from './cli';
import { CommandResult, IssueParams, LabelParams, MilestoneParams } from '../types/cli';
import { createFossilIssue } from './fossilIssue';
import { createFossilLabel } from './fossilLabel';
import { createFossilMilestone } from './fossilMilestone';

/**
 * Centralized GitHub CLI command utility for type-safe command construction
 * and consistent error handling across the codebase.
 */

export class GitHubCLICommands {
  constructor(private owner: string, private repo: string) {}
  
  /**
   * Create a GitHub issue with proper validation and error handling
   */
  async createIssue(params: IssueParams): Promise<CommandResult> {
    // Use fossil-backed utility
    const fossilService = undefined; // Use default or inject as needed
    const result = await createFossilIssue({
      fossilService,
      type: 'action',
      title: params.title,
      body: params.body || '',
      section: 'issues',
      tags: params.labels || [],
      metadata: {},
      parsedFields: {},
    });
    return {
      success: !result.deduplicated,
      stdout: JSON.stringify(result),
      stderr: '',
      exitCode: 0,
      message: result.deduplicated ? 'Issue already exists (deduplicated)' : 'Issue created via fossil-backed utility',
    };
  }
  
  /**
   * Create a GitHub label with proper validation and error handling
   */
  async createLabel(params: LabelParams): Promise<CommandResult> {
    // Use fossil-backed utility
    const fossilService = undefined; // Use default or inject as needed
    const result = await createFossilLabel({
      fossilService,
      type: 'action',
      title: params.name,
      body: params.description || '',
      section: 'labels',
      tags: [],
      metadata: { color: params.color },
      parsedFields: {},
    });
    return {
      success: !result.deduplicated,
      stdout: JSON.stringify(result),
      stderr: '',
      exitCode: 0,
      message: result.deduplicated ? 'Label already exists (deduplicated)' : 'Label created via fossil-backed utility',
    };
  }
  
  /**
   * Create a GitHub milestone with proper validation and error handling
   */
  async createMilestone(params: MilestoneParams): Promise<CommandResult> {
    // Use fossil-backed utility
    const fossilService = undefined; // Use default or inject as needed
    const result = await createFossilMilestone({
      fossilService,
      type: 'action',
      title: params.title,
      body: params.description || '',
      section: params.dueOn || 'general',
      tags: [],
      metadata: {},
      parsedFields: {},
    });
    return {
      success: !result.deduplicated,
      stdout: JSON.stringify(result),
      stderr: '',
      exitCode: 0,
      message: result.deduplicated ? 'Milestone already exists (deduplicated)' : 'Milestone created via fossil-backed utility',
    };
  }
  
  /**
   * List GitHub issues with filtering options
   */
  async listIssues(options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    assignee?: string;
  } = {}): Promise<CommandResult> {
    const cmd = this.buildIssueListCommand(options);
    return this.executeCommand(cmd);
  }
  
  /**
   * List GitHub labels
   */
  async listLabels(): Promise<CommandResult> {
    const cmd = `gh label list --repo ${this.owner}/${this.repo} --json name,description,color`;
    return this.executeCommand(cmd);
  }
  
  /**
   * List GitHub milestones
   */
  async listMilestones(): Promise<CommandResult> {
    const cmd = `gh api repos/${this.owner}/${this.repo}/milestones --field state=open`;
    return this.executeCommand(cmd);
  }
  
  /**
   * Execute GitHub API call
   */
  async apiCall(endpoint: string, options: { method?: string; fields?: Record<string, string> } = {}): Promise<CommandResult> {
    const { method = 'GET', fields = {} } = options;
    let cmd = `gh api repos/${this.owner}/${this.repo}/${endpoint}`;
    
    if (method !== 'GET') {
      cmd += ` --method ${method}`;
    }
    
    for (const [key, value] of Object.entries(fields)) {
      cmd += ` --field ${key}="${this.escapeString(value)}"`;
    }
    
    return this.executeCommand(cmd);
  }
  
  /**
   * Build issue list command with filtering
   */
  private buildIssueListCommand(options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    assignee?: string;
  }): string {
    const { state = 'open', labels, assignee } = options;
    let cmd = `gh issue list --repo ${this.owner}/${this.repo} --state ${state} --json number,title,state,body,labels,assignees,createdAt,updatedAt`;
    
    if (labels && labels.length > 0) {
      cmd += ` --label "${labels.map(l => this.escapeString(l)).join(',')}"`;
    }
    
    if (assignee) {
      cmd += ` --assignee "${this.escapeString(assignee)}"`;
    }
    
    return cmd;
  }
  
  /**
   * Escape special characters in strings for CLI commands
   */
  private escapeString(str: string): string {
    return str
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
  
  /**
   * Execute a command with comprehensive error handling
   */
  async executeCommand(cmd: string): Promise<CommandResult> {
    const result = executeCommand(cmd, { throwOnError: false });
    
    // Convert CLIExecuteResult to CommandResult
    const commandResult: CommandResult = {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      message: result.success ? 'Command executed successfully' : `CLI Error: ${result.stderr}`
    };
    
    // Handle common GitHub CLI errors
    if (!result.success) {
      const errorMessage = result.stderr;
      
      if (errorMessage.includes('already exists')) {
        return { 
          success: true, 
          stdout: '', 
          stderr: '', 
          message: 'Resource already exists',
          exitCode: 0
        };
      }
      
      if (errorMessage.includes('not found')) {
        return { 
          success: false, 
          stdout: '', 
          stderr: 'Resource not found', 
          exitCode: 404,
          message: 'Resource not found'
        };
      }
      
      if (errorMessage.includes('authentication')) {
        return { 
          success: false, 
          stdout: '', 
          stderr: 'Authentication failed', 
          exitCode: 401,
          message: 'Authentication failed'
        };
      }
    }
    
    return commandResult;
  }
} 