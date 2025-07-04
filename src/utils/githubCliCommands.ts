import { execSync } from 'child_process';

/**
 * Centralized GitHub CLI command utility for type-safe command construction
 * and consistent error handling across the codebase.
 */

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  message?: string;
}

export interface IssueParams {
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  assignees?: string[];
}

export interface LabelParams {
  name: string;
  description: string;
  color: string;
}

export interface MilestoneParams {
  title: string;
  description: string;
  dueOn?: string;
}

export class GitHubCLICommands {
  constructor(private owner: string, private repo: string) {}
  
  /**
   * Create a GitHub issue with proper validation and error handling
   */
  async createIssue(params: IssueParams): Promise<CommandResult> {
    const cmd = this.buildIssueCreateCommand(params);
    return this.executeCommand(cmd);
  }
  
  /**
   * Create a GitHub label with proper validation and error handling
   */
  async createLabel(params: LabelParams): Promise<CommandResult> {
    const cmd = this.buildLabelCreateCommand(params);
    return this.executeCommand(cmd);
  }
  
  /**
   * Create a GitHub milestone with proper validation and error handling
   */
  async createMilestone(params: MilestoneParams): Promise<CommandResult> {
    const cmd = this.buildMilestoneCreateCommand(params);
    return this.executeCommand(cmd);
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
   * Build issue creation command with proper escaping
   */
  private buildIssueCreateCommand(params: IssueParams): string {
    const { title, body, labels, milestone, assignees } = params;
    let cmd = `gh issue create --repo ${this.owner}/${this.repo} --title "${this.escapeString(title)}"`;
    
    if (body) {
      cmd += ` --body "${this.escapeString(body)}"`;
    }
    
    if (labels && labels.length > 0) {
      cmd += ` --label "${labels.map(l => this.escapeString(l)).join(',')}"`;
    }
    
    if (milestone) {
      cmd += ` --milestone "${this.escapeString(milestone)}"`;
    }
    
    if (assignees && assignees.length > 0) {
      cmd += ` --assignee "${assignees.map(a => this.escapeString(a)).join(',')}"`;
    }
    
    return cmd;
  }
  
  /**
   * Build label creation command with proper escaping
   */
  private buildLabelCreateCommand(params: LabelParams): string {
    const { name, description, color } = params;
    return `gh label create "${this.escapeString(name)}" --repo ${this.owner}/${this.repo} --color "${this.escapeString(color)}" --description "${this.escapeString(description)}"`;
  }
  
  /**
   * Build milestone creation command with proper escaping
   */
  private buildMilestoneCreateCommand(params: MilestoneParams): string {
    const { title, description, dueOn } = params;
    let cmd = `gh api repos/${this.owner}/${this.repo}/milestones --method POST --field title="${this.escapeString(title)}" --field description="${this.escapeString(description)}"`;
    
    if (dueOn) {
      cmd += ` --field due_on="${new Date(dueOn).toISOString()}"`;
    }
    
    return cmd;
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
    try {
      const result = execSync(cmd, { encoding: 'utf8' });
      return { 
        success: true, 
        stdout: result, 
        stderr: '',
        message: 'Command executed successfully'
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle common GitHub CLI errors
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
      
      return { 
        success: false, 
        stdout: '', 
        stderr: errorMessage,
        exitCode: error.status || 1,
        message: `CLI Error: ${errorMessage}`
      };
    }
  }
} 