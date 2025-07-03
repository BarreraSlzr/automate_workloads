# 📖 API Reference

This document provides a comprehensive reference for all services, CLI commands, types, and utilities in the Automation Ecosystem.

## 🚀 Onboarding & Automated Setup

The recommended way to set up your environment is via the automated onboarding script and canonical fossil:

- **Run:** `bash scripts/setup.sh` to automatically:
  - Check/install all required tools (Bun, GitHub CLI, yq, etc.)
  - Validate and install project dependencies
  - Ensure `.env` is present
  - Check and download required Ollama LLM models
  - Update the fossil after each step for traceability and CI
- The script is idempotent and safe to run multiple times.
- Onboarding will fail if no LLM provider is available (local or cloud).

**Canonical onboarding fossil:**
- The status of each onboarding step is tracked in `fossils/setup_status.yml`.
- See this file for troubleshooting and to audit onboarding state.

**Troubleshooting:**
- If onboarding fails, see `fossils/setup_status.yml` for detailed step status and notes.
- For LLM issues, ensure Ollama is running and models are available, or provide a valid cloud LLM API key in `.env`.

---

## 📋 Table of Contents

- [Core Configuration](#core-configuration)
- [GitHub Service](#github-service)
- [CLI Utilities](#cli-utilities)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Service Response Patterns](#service-response-patterns)
- [Fossil Entry Schema](#fossil-entry-schema)
- [🦴 Migration & Issue Update CLI](#migration-issue-update-cli)
- [🦴 LLM Fossilization Utilities](#llm-fossilization-utilities)
- [🧠 Intelligent LLM Routing](#intelligent-llm-routing)

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

### Fossil-Backed Issue Creation (Preferred)

All new issues should be created using the fossil-backed utility or CLI. This ensures deduplication, traceability, and robust automation.

#### Utility Usage
```typescript
import { createFossilIssue } from '../src/utils/fossilIssue';
const result = await createFossilIssue({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'My Issue Title',
  body: 'My issue body',
  labels: ['automation', 'bug'],
  milestone: 'Sprint 1',
});
```

#### CLI Usage
```sh
bun run src/cli/create-fossil-issue.ts \
  --owner barreraslzr \
  --repo automate_workloads \
  --title "My Issue Title" \
  --body "My issue body" \
  --labels "automation,bug" \
  --milestone "Sprint 1"
```

> **Warning:** `GitHubService.createIssue` is deprecated. Do NOT use direct `gh issue create` for new issues.

### GitHubService Class

> **Deprecated:** Use createFossilIssue for all new issue creation.

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

##### `createIssue (deprecated)`
```typescript
// Deprecated: Use createFossilIssue instead
const response = await github.createIssue('title', 'body', { labels: ['bug'] });
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

## Fossil Entry Schema

- `excerpt` (string): LLM-generated one-sentence summary for quick preview. Always present for new fossils.

### Example Fossil JSON
```json
{
  "type": "observation",
  "title": "Orchestration Output - barreraslzr/automate_workloads",
  "excerpt": "This fossil summarizes the orchestration output for the repo, including analysis, execution, and monitoring results.",
  ...
}
```

### Repository Orchestrator CLI (`repo-orchestrator.ts`)

Handles all planning, orchestration, and fossilization workflows. Supports per-issue, global, or both planning modes.

#### Usage

```sh
bun run repo-orchestrator orchestrate <owner> <repo> --workflow plan --plan-mode both --output plan.json
```

#### Options
- `--plan-mode <mode>`: `per-issue`, `global`, or `both` (default: `both`).
- `--output <file>`: Output file for the unified plan JSON.

#### Output

```json
{
  "perIssueChecklists": { "12": "- [ ] Fix bug\n- [ ] Add test" },
  "globalPlan": "- [ ] Review all open issues\n- [ ] Deploy to staging",
  "allTasks": [
    { "issue": 12, "task": "Fix bug" },
    { "issue": 12, "task": "Add test" },
    { "issue": null, "task": "Review all open issues" },
    { "issue": null, "task": "Deploy to staging" }
  ],
  "fossilId": "fossil_..."
}
```

## 🦴 Migration & Issue Update CLI

### scripts/migrations/003-migrate-legacy-issues.ts

- **Update a single issue:**
  ```sh
  bun run scripts/migrations/003-migrate-legacy-issues.ts --update <issue_number> <markdown_file>
  ```
- **Batch migrate all open issues:**
  ```sh
  bun run scripts/migrations/003-migrate-legacy-issues.ts
  ```
- Uses OpenAI LLM (if `OPENAI_API_KEY` is set) for robust extraction of purpose, checklist, and metadata from markdown. Falls back to local extraction if LLM is unavailable or fails.

### getLLMSuggestions
- Now uses OpenAI LLM (via `callOpenAIChat`) if `OPENAI_API_KEY` is set.
- Extracts structured data (purpose, checklist, metadata) from markdown.
- Falls back to robust local extraction if LLM is unavailable or fails.

### Utilities
- **Checklist Extraction:** Now extracts all checklist items from any markdown, not just a specific section.
- **Canonical Issue Body:** All issues and fossils use a markdown + JSON block format for automation and deduplication.

### Environment Variables
- `OPENAI_API_KEY`: Enables LLM-powered extraction for migration and updates.

## 🦴 LLM Fossilization Utilities

### Types
- `LLMInsightFossil`, `LLMBenchmarkFossil`, `LLMDiscoveryFossil` (see `src/types/llmFossil.ts`)

### Utility Functions (from `src/utils/fossilize.ts`)
- `fossilizeLLMInsight(fossil: LLMInsightFossil): Promise<string>`
- `fossilizeLLMBenchmark(fossil: LLMBenchmarkFossil): Promise<string>`
- `fossilizeLLMDiscovery(fossil: LLMDiscoveryFossil): Promise<string>`

All fossils are stored in `fossils/llm_insights/`.

#### Example: Fossilizing an LLM Insight
```typescript
import { fossilizeLLMInsight } from '../src/utils/fossilize';
import { LLMInsightFossil } from '../src/types/llmFossil';

const fossil: LLMInsightFossil = {
  type: 'insight',
  timestamp: new Date().toISOString(),
  model: 'gpt-4',
  provider: 'openai',
  excerpt: 'Test insight',
  prompt: 'What is AI?',
  response: 'AI is ...',
};
await fossilizeLLMInsight(fossil);
```

#### See Also
- Integration test: `tests/integration/llm-fossilization.integration.test.ts`

## 🧠 Intelligent LLM Routing

The LLMService supports intelligent routing between local and cloud LLMs based on task complexity, cost, and user preference.

### Routing Modes
- **auto** (default): Uses intelligent analysis to select the best provider for each task.
- **local**: Forces use of local LLM for all tasks (if available).
- **cloud**: Forces use of cloud LLM for all tasks.

### CLI Usage

```sh
bun run src/cli/llm-usage.ts --prefer-local   # Always use local LLM
bun run src/cli/llm-usage.ts --prefer-cloud   # Always use cloud LLM
bun run src/cli/llm-usage.ts --auto           # Use intelligent routing (default)
```

You can also select the local backend:

```sh
bun run src/cli/llm-usage.ts --local-backend llama.cpp --prefer-local
```

### Programmatic Usage

```typescript
import { LLMService } from '../src/services/llm';
const llmService = new LLMService();
llmService.setRoutingPreference('auto'); // or 'local', 'cloud'
const result = await llmService.callLLM({
  model: 'gpt-4',
  apiKey: '...',
  messages: [...],
  routingPreference: 'local', // override per-call
});
```

See also: [🦴 LLM Fossilization Utilities](#llm-fossilization-utilities)

## Public API Outputs

All public JSON outputs (e.g., `fossils/public/api/project_status_public.json`) are generated from curated YAML fossils and can be served as API endpoints for dashboards, integrations, or external tools. See [Fossil Publication Workflow](./FOSSIL_PUBLICATION_WORKFLOW.md) for details. 