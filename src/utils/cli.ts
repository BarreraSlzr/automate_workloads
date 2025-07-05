/**
 * CLI utility functions for executing shell commands and parsing output
 * @module utils/cli
 */

import { execSync, spawnSync } from "child_process";
import type { ServiceResponse } from "../types";

// TEST VIOLATION: This type should be in src/types/ but is here to test validation
export interface TestViolationType {
  name: string;
  value: number;
  description: string;
}

/**
 * Options for executing CLI commands
 */
export interface CLIExecuteOptions {
  /** Whether to capture stderr in the output */
  captureStderr?: boolean;
  /** Whether to throw on non-zero exit code */
  throwOnError?: boolean;
  /** Working directory for the command */
  cwd?: string;
  /** Environment variables to set */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of CLI command execution
 */
export interface CLIExecuteResult {
  /** Command output (stdout) */
  stdout: string;
  /** Error output (stderr) */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Whether the command succeeded */
  success: boolean;
}

/**
 * Executes a shell command synchronously with comprehensive error handling
 * 
 * @param {string} command - The command to execute
 * @param {CLIExecuteOptions} options - Execution options
 * @returns {CLIExecuteResult} Command execution result
 * 
 * @example
 * ```typescript
 * const result = executeCommand('gh issue list --json number,title');
 * if (result.success) {
 *   const issues = JSON.parse(result.stdout);
 * }
 * ```
 */
export function executeCommand(
  command: string,
  options: CLIExecuteOptions = {}
): CLIExecuteResult {
  const {
    captureStderr = false,
    throwOnError = true,
    cwd = process.cwd(),
    env = process.env,
    timeout = 30000,
  } = options;

  try {
    const result = spawnSync(command, {
      shell: true,
      encoding: 'utf8',
      cwd,
      env,
      timeout,
      stdio: captureStderr ? 'pipe' : ['pipe', 'pipe', 'pipe'],
    });

    const cliResult: CLIExecuteResult = {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
      success: result.status === 0,
    };

    if (throwOnError && !cliResult.success) {
      throw new Error(`Command failed with exit code ${cliResult.exitCode}: ${cliResult.stderr}`);
    }

    return cliResult;
  } catch (error) {
    if (error instanceof Error) {
      return {
        stdout: '',
        stderr: error.message,
        exitCode: -1,
        success: false,
      };
    }
    throw error;
  }
}

/**
 * Executes a command and returns JSON output
 * 
 * @param {string} command - The command to execute
 * @param {CLIExecuteOptions} options - Execution options
 * @returns {T} Parsed JSON output
 * @throws {Error} If command fails or output is not valid JSON
 * 
 * @example
 * ```typescript
 * const issues = executeCommandJSON<GitHubIssue[]>('gh issue list --json number,title,state');
 * ```
 */
export function executeCommandJSON<T>(
  command: string,
  options: CLIExecuteOptions = {}
): T {
  const result = executeCommand(command, { ...options, captureStderr: true });
  
  if (!result.success) {
    throw new Error(`Command failed: ${result.stderr}`);
  }

  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely parses JSON with error handling
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {string} context - Context for error messages
 * @returns {T} Parsed JSON object
 * @throws {Error} If parsing fails
 * 
 * @example
 * ```typescript
 * const data = safeParseJSON<MyType>(jsonString, 'package.json');
 * ```
 */
export function safeParseJSON<T>(jsonString: string, context: string = 'JSON'): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if a command is available in the system PATH
 * 
 * @param {string} command - The command to check
 * @returns {boolean} True if the command is available
 * 
 * @example
 * ```typescript
 * if (isCommandAvailable('gh')) {
 *   // GitHub CLI is available
 * }
 * ```
 */
export function isCommandAvailable(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Executes a command with retry logic
 * 
 * @param {string} command - The command to execute
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @param {CLIExecuteOptions} options - Execution options
 * @returns {CLIExecuteResult} Command execution result
 * 
 * @example
 * ```typescript
 * const result = executeCommandWithRetry('gh issue list', 3, 1000);
 * ```
 */
export function executeCommandWithRetry(params: { command: string; maxRetries?: number; delayMs?: number; options?: CLIExecuteOptions }): CLIExecuteResult {
  const { command, maxRetries = 3, delayMs = 1000, options = {} } = params;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = executeCommand(command, { ...options, throwOnError: true });
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt < maxRetries) {
        // Wait before retrying
        const delay = delayMs * attempt; // Exponential backoff
        new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Command failed after all retry attempts');
}

/**
 * Formats command output for display
 * 
 * @param {string} output - Raw command output
 * @param {string} format - Output format (text, json, table)
 * @returns {string} Formatted output
 * 
 * @example
 * ```typescript
 * const formatted = formatOutput(result.stdout, 'table');
 * console.log(formatted);
 * ```
 */
export function formatOutput(output: string, format: 'text' | 'json' | 'table' = 'text'): string {
  switch (format) {
    case 'json':
      try {
        const parsed = JSON.parse(output);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return output;
      }
    case 'table':
      // Simple table formatting for JSON arrays
      try {
        const parsed = JSON.parse(output);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const headers = Object.keys(parsed[0]);
          const table = [
            headers.join(' | '),
            headers.map(() => '---').join(' | '),
            ...parsed.map(row => headers.map(header => row[header]).join(' | '))
          ];
          return table.join('\n');
        }
      } catch {
        // Fall back to text if not JSON
      }
      return output;
    default:
      return output;
  }
}

/**
 * Creates a service response from CLI execution result
 * 
 * @param {CLIExecuteResult} result - CLI execution result
 * @param {T} data - Parsed data (optional)
 * @returns {ServiceResponse<T>} Service response
 * 
 * @example
 * ```typescript
 * const result = executeCommand('gh issue list --json number,title');
 * const response = createServiceResponse(result, JSON.parse(result.stdout));
 * ```
 */
export function createServiceResponse<T>(
  result: CLIExecuteResult,
  data?: T
): ServiceResponse<T> {
  if (result.success) {
    return {
      success: true,
      data,
      statusCode: 200,
    };
  } else {
    return {
      success: false,
      error: result.stderr || 'Command failed',
      statusCode: result.exitCode,
    };
  }
}

/**
 * Checks if an issue with the given title exists in the repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} title - Issue title to search for
 * @param {'open' | 'all'} state - Issue state to search (default: 'open')
 * @returns {boolean} True if an issue with the title exists
 */
export function issueExists(params: { owner: string; repo: string; title: string; state?: 'open' | 'all' }): boolean {
  const { owner, repo, title, state = 'open' } = params;
  try {
    const result = executeCommand(
      `gh issue list --repo ${owner}/${repo} --state ${state} --json title`,
      { captureStderr: true, throwOnError: false }
    );
    if (!result.success) return false;
    const issues = JSON.parse(result.stdout);
    return issues.some((issue: any) => issue.title.trim() === title.trim());
  } catch {
    return false;
  }
}

/**
 * Gets the current repository owner from git config
 * 
 * @returns {string} Repository owner
 * @throws {Error} If git config is not available
 * 
 * @example
 * ```typescript
 * const owner = getCurrentRepoOwner();
 * ```
 */
export function getCurrentRepoOwner(): string {
  try {
    const result = executeCommand('git config --get remote.origin.url');
    if (!result.success) {
      throw new Error('Could not get git remote origin URL');
    }
    
    // Parse git remote URL to extract owner
    const url = result.stdout.trim();
    const match = url.match(/github\.com[:/]([^/]+)/);
    if (!match || !match[1]) {
      throw new Error('Could not parse owner from git remote URL');
    }
    
    return match[1];
  } catch (error) {
    throw new Error(`Failed to get repository owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the current repository name from git config
 * 
 * @returns {string} Repository name
 * @throws {Error} If git config is not available
 * 
 * @example
 * ```typescript
 * const repo = getCurrentRepoName();
 * ```
 */
export function getCurrentRepoName(): string {
  try {
    const result = executeCommand('git config --get remote.origin.url');
    if (!result.success) {
      throw new Error('Could not get git remote origin URL');
    }
    
    // Parse git remote URL to extract repo name
    const url = result.stdout.trim();
    const match = url.match(/github\.com[:/][^\/]+\/([^\/.]+)/);
    if (!match || !match[1]) {
      throw new Error('Could not parse repository name from git remote URL');
    }
    
    return match[1];
  } catch (error) {
    throw new Error(`Failed to get repository name: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the current repository info (owner and name) from git config
 * 
 * @returns {{owner: string, repo: string}} Repository info
 * @throws {Error} If git config is not available
 * 
 * @example
 * ```typescript
 * const { owner, repo } = getCurrentRepoInfo();
 * ```
 */
export function getCurrentRepoInfo(): { owner: string; repo: string } {
  return {
    owner: getCurrentRepoOwner(),
    repo: getCurrentRepoName()
  };
} 