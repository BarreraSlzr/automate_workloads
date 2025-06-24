# 📖 API Reference

This document provides a comprehensive reference for all services, CLI commands, types, and utilities in the Automation Ecosystem.

## 📋 Table of Contents

- [Core Configuration](#core-configuration)
- [GitHub Service](#github-service)
- [CLI Utilities](#cli-utilities)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Service Response Patterns](#service-response-patterns)

---

## ⚙️ Core Configuration

### Environment Configuration

The system supports multiple authentication methods and environment configurations:

- **GitHub CLI**: Uses `gh auth login` for CLI operations
- **Bearer Tokens**: For Twitter, Gmail, Buffer APIs
- **Raycast Environment**: For Raycast extensions
- **Process Environment**: For CLI usage

### Configuration Object

```typescript
interface EnvironmentConfig {
  /** GitHub personal access token (optional - uses gh CLI by default) */
  githubToken?: string;
  /** Gmail API OAuth token */
  gmailToken?: string;
  /** Buffer API access token */
  bufferToken?: string;
  /** Twitter API v2 bearer token */
  twitterToken?: string;
}
```

### Configuration Functions

#### `getEnv()`
Loads and validates environment configuration.

**Returns:** `EnvironmentConfig`

**Example:**
```typescript
import { getEnv } from '../src/core/config';

const config = getEnv();
console.log(config.twitterToken); // Twitter bearer token
```

#### `validateConfig()`
Validates the current configuration and returns detailed status.

**Returns:** `ConfigValidationResult`

**Example:**
```typescript
import { validateConfig } from '../src/core/config';

const validation = validateConfig();
if (!validation.isValid) {
  console.log('Missing services:', validation.missingServices);
}
```

---

## 🔗 GitHub Service

### GitHubService Class

The GitHub service provides comprehensive GitHub integration using the GitHub CLI.

#### Constructor

```typescript
new GitHubService(owner: string, repo: string)
```

**Parameters:**
- `owner`: Repository owner (e.g., 'BarreraSlzr')
- `repo`: Repository name (e.g., 'automate_workloads')

**Example:**
```typescript
import { GitHubService } from '../src/services/github';

const github = new GitHubService('BarreraSlzr', 'automate_workloads');
```

#### Methods

##### `isReady()`
Checks if GitHub CLI is available and authenticated.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isReady = await github.isReady();
if (!isReady) {
  console.log('Please run: gh auth login');
}
```

##### `getIssues(options)`
Fetches issues from the repository.

**Parameters:**
```typescript
interface GitHubOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
}
```

**Returns:** `Promise<ServiceResponse<GitHubIssue[]>>`

**Example:**
```typescript
const response = await github.getIssues({ 
  state: 'open',
  labels: ['bug', 'enhancement']
});

if (response.success && response.data) {
  console.log(`Found ${response.data.length} issues`);
}
```

##### `createIssue(title, body, options)`
Creates a new issue in the repository.

**Parameters:**
- `title`: Issue title
- `body`: Issue body content
- `options`: Issue options (labels, assignee)

**Returns:** `Promise<ServiceResponse<GitHubIssue>>`

**Example:**
```typescript
const response = await github.createIssue(
  'New feature request',
  'Please add support for...',
  { labels: ['enhancement'] }
);
```

##### `closeIssue(number, comment)`
Closes an issue with an optional comment.

**Parameters:**
- `number`: Issue number
- `comment`: Optional closing comment

**Returns:** `Promise<ServiceResponse<boolean>>`

**Example:**
```typescript
const response = await github.closeIssue(123, 'Fixed in v1.2.0');
```

##### `addComment(number, comment)`
Adds a comment to an issue.

**Parameters:**
- `number`: Issue number
- `comment`: Comment content

**Returns:** `Promise<ServiceResponse<boolean>>`

**Example:**
```typescript
const response = await github.addComment(123, 'This is a comment');
```

##### `getRepoInfo()`
Gets repository information.

**Returns:** `Promise<ServiceResponse<any>>`

**Example:**
```typescript
const response = await github.getRepoInfo();
if (response.success && response.data) {
  console.log('Repository:', response.data.name);
}
```

##### `formatIssues(issues, format)`
Formats issues for display.

**Parameters:**
- `issues`: Array of GitHub issues
- `format`: Output format ('text', 'json', 'table')

**Returns:** `string`

**Example:**
```typescript
const formatted = github.formatIssues(issues, 'table');
console.log(formatted);
```

---

## 🖥️ CLI Utilities

### Command Execution

#### `executeCommand(command, options)`
Executes a shell command with comprehensive error handling.

**Parameters:**
```typescript
interface CLIExecuteOptions {
  captureStderr?: boolean;
  throwOnError?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}
```

**Returns:** `CLIExecuteResult`

**Example:**
```typescript
import { executeCommand } from '../src/utils/cli';

const result = executeCommand('gh issue list --json number,title');
if (result.success) {
  console.log(result.stdout);
}
```

#### `executeCommandJSON<T>(command, options)`
Executes a command and returns parsed JSON output.

**Parameters:**
- `command`: Command string to execute
- `options`: Execution options

**Returns:** `T` (parsed JSON)

**Example:**
```typescript
import { executeCommandJSON } from '../src/utils/cli';

const issues = executeCommandJSON<GitHubIssue[]>('gh issue list --json number,title,state');
console.log(issues);
```

#### `isCommandAvailable(command)`
Checks if a command is available in the system PATH.

**Parameters:**
- `command`: Command to check

**Returns:** `boolean`

**Example:**
```typescript
import { isCommandAvailable } from '../src/utils/cli';

if (isCommandAvailable('gh')) {
  console.log('GitHub CLI is available');
}
```

#### `executeCommandWithRetry(command, maxRetries, delayMs, options)`
Executes a command with retry logic.

**Parameters:**
- `command`: Command to execute
- `maxRetries`: Maximum number of retry attempts
- `delayMs`: Delay between retries in milliseconds
- `options`: Execution options

**Returns:** `CLIExecuteResult`

**Example:**
```typescript
import { executeCommandWithRetry } from '../src/utils/cli';

const result = executeCommandWithRetry('gh issue list', 3, 1000);
```

#### `formatOutput(output, format)`
Formats command output for display.

**Parameters:**
- `output`: Raw command output
- `format`: Output format ('text', 'json', 'table')

**Returns:** `string`

**Example:**
```typescript
import { formatOutput } from '../src/utils/cli';

const formatted = formatOutput(result.stdout, 'table');
console.log(formatted);
```

---

## 📝 Type Definitions

### Core Types

#### `ServiceResponse<T>`
Generic service response wrapper.

```typescript
interface ServiceResponse<T> {
  /** Success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message */
  error?: string;
  /** HTTP status code */
  statusCode?: number;
}
```

#### `GitHubIssue`
GitHub issue information.

```typescript
interface GitHubIssue {
  /** Issue number */
  number: number;
  /** Issue title */
  title: string;
  /** Issue state (open, closed) */
  state: 'open' | 'closed';
  /** Issue body content */
  body?: string;
  /** Issue labels */
  labels: string[];
  /** Issue assignees */
  assignees: string[];
  /** Creation date */
  createdAt: string;
  /** Last updated date */
  updatedAt: string;
}
```

#### `CLIOptions`
CLI command options.

```typescript
interface CLIOptions {
  /** Repository owner (for GitHub operations) */
  owner?: string;
  /** Repository name (for GitHub operations) */
  repo?: string;
  /** Output format (json, text, table) */
  format?: 'json' | 'text' | 'table';
  /** Verbose output */
  verbose?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
}
```

#### `CLIExecuteResult`
Result of CLI command execution.

```typescript
interface CLIExecuteResult {
  /** Command output (stdout) */
  stdout: string;
  /** Error output (stderr) */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Whether the command succeeded */
  success: boolean;
}
```

---

## 🛡️ Error Handling

### Error Patterns

The automation ecosystem uses consistent error handling patterns:

#### 1. Service Response Pattern
All service methods return a `ServiceResponse<T>` object:

```typescript
const response = await github.getIssues();
if (response.success) {
  // Handle success
  console.log(response.data);
} else {
  // Handle error
  console.error(response.error);
}
```

#### 2. Try-Catch with Specific Error Types
```typescript
try {
  const config = getEnv();
  console.log('Configuration loaded successfully');
} catch (error) {
  if (error instanceof Error) {
    console.error('Configuration error:', error.message);
  } else {
    console.error('Unknown configuration error');
  }
}
```

#### 3. Graceful Degradation
```typescript
const result = executeCommand('nonexistent-command', { throwOnError: false });
if (result.success) {
  console.log('Command executed successfully');
} else {
  console.log('Command failed, but handled gracefully');
}
```

### Common Error Scenarios

#### GitHub CLI Not Available
**Error:** `GitHub CLI is not ready. Please run: gh auth login`

**Solution:**
```bash
gh auth login
```

#### Invalid Environment Configuration
**Error:** `Invalid environment configuration: missing required variables`

**Solution:**
1. Create a `.env` file
2. Add required environment variables
3. Or use CLI tools that don't require tokens

#### Command Not Found
**Error:** `Command failed: command not found`

**Solution:**
1. Install the required CLI tool
2. Ensure it's in your PATH
3. Check the tool's documentation

---

## 🔄 Service Response Patterns

### Success Response
```typescript
{
  success: true,
  data: {
    // Response data
  },
  statusCode: 200
}
```

### Error Response
```typescript
{
  success: false,
  error: "Error description",
  statusCode: 500
}
```

### Usage Pattern
```typescript
const response = await service.method();
if (response.success && response.data) {
  // Process successful response
  processData(response.data);
} else {
  // Handle error
  handleError(response.error);
}
```

---

## 📚 Additional Resources

- [Development Guide](DEVELOPMENT_GUIDE.md) - Development best practices
- [Environment Guide](ENVIRONMENT_GUIDE.md) - Configuration management
- [Contributing Guide](CONTRIBUTING_GUIDE.md) - How to contribute
- [Examples](../examples/basic-usage.ts) - Usage examples 