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
- [📊 Roadmap LLM Insights](#roadmap-llm-insights)
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

### Fossil-Backed Creation (Primary Pattern)

All GitHub objects (issues, labels, milestones) should be created using fossil-backed utilities. This ensures deduplication, traceability, and robust automation.

> **📝 Note on Labels vs Tags**: In the examples below, you'll see both `labels` and `tags` parameters. These are **different systems**:
> - **`labels`**: GitHub-specific metadata stored in GitHub's database for filtering and organization
> - **`tags`**: Fossil system metadata stored locally for semantic search and content relationships
> 
> See [Intelligent Tagging System](../docs/INTELLIGENT_TAGGING_SYSTEM.md#labels-vs-tags-understanding-the-distinction) for detailed explanation.

#### Fossil-Backed Issue Creation
```typescript
import { createFossilIssue } from '../src/utils/fossilIssue';
const result = await createFossilIssue({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'My Issue Title',
  body: 'My issue body',
  labels: ['automation', 'bug'],
  milestone: 'Sprint 1',
  type: 'action',
  tags: ['automation', 'bug'],
  purpose: 'Fix critical bug in authentication flow',
  checklist: '- [ ] Reproduce the bug\n- [ ] Write failing test\n- [ ] Implement fix\n- [ ] Add regression test',
  metadata: { priority: 'high', component: 'auth' }
});

if (result.deduplicated) {
  console.log(`⚠️ Issue already exists (Fossil ID: ${result.fossilId})`);
} else {
  console.log(`✅ Created issue #${result.issueNumber} (Fossil ID: ${result.fossilId})`);
}
```

#### Fossil-Backed Label Creation
```typescript
import { createFossilLabel } from '../src/utils/fossilLabel';
const result = await createFossilLabel({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  name: 'high-priority',
  description: 'High priority issues requiring immediate attention',
  color: 'ff0000',
  type: 'label',
  tags: ['priority', 'automation'],
  metadata: { category: 'priority' }
});
```

#### Fossil-Backed Milestone Creation
```typescript
import { createFossilMilestone } from '../src/utils/fossilMilestone';
const result = await createFossilMilestone({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'Sprint 1',
  description: 'First sprint focusing on core functionality',
  dueOn: '2024-08-01',
  type: 'milestone',
  tags: ['sprint', 'planning'],
  metadata: { sprintNumber: 1, team: 'core' }
});
```

#### CLI Usage
```sh
# Create fossil-backed issue
bun run src/cli/create-fossil-issue.ts \
  --owner barreraslzr \
  --repo automate_workloads \
  --title "My Issue Title" \
  --body "My issue body" \
  --labels "automation,bug" \
  --milestone "Sprint 1" \
  --type "action" \
  --tags "automation,bug" \
  --purpose "Fix critical bug in authentication flow"

# Create fossil-backed label
bun run src/cli/create-fossil-label.ts \
  --owner barreraslzr \
  --repo automate_workloads \
  --name "high-priority" \
  --description "High priority issues" \
  --color "ff0000"

# Create fossil-backed milestone
bun run src/cli/create-fossil-milestone.ts \
  --owner barreraslzr \
  --repo automate_workloads \
  --title "Sprint 1" \
  --description "First sprint" \
  --due-on "2024-08-01"
```

#### Benefits of Fossil-Backed Creation
- ✅ **Deduplication**: Prevents duplicate objects by content hash and title
- ✅ **Traceability**: Links GitHub objects to fossil system for progress tracking
- ✅ **Consistent Formatting**: Uses standardized templates and metadata
- ✅ **Progress Tracking**: Enables programmatic monitoring and reporting
- ✅ **Metadata Storage**: Stores rich metadata in fossil system
- ✅ **Automation-Friendly**: Supports automated workflows and CI/CD

> **Warning:** Direct `gh` CLI calls and `GitHubService.createIssue` are deprecated. Always use fossil-backed utilities for new objects.

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

### Centralized GitHub CLI Commands

Use the `GitHubCLICommands` utility for all GitHub operations to ensure type safety, consistent error handling, and proper escaping.

#### Basic Usage
```typescript
import { GitHubCLICommands } from '../src/utils/githubCliCommands';

const commands = new GitHubCLICommands('barreraslzr', 'automate_workloads');

// Create issue with type-safe parameters
const result = await commands.createIssue({
  title: 'My Issue Title',
  body: 'Issue body content',
  labels: ['automation', 'bug'],
  milestone: 'Sprint 1'
});

if (result.success) {
  console.log('✅ Issue created successfully');
} else {
  console.error(`❌ Failed: ${result.message}`);
}
```

#### Available Commands
```typescript
// Issue operations
await commands.createIssue(params);
await commands.listIssues(options);
await commands.viewIssue(number);

// Label operations
await commands.createLabel(params);
await commands.listLabels();
await commands.deleteLabel(name);

// Milestone operations
await commands.createMilestone(params);
await commands.listMilestones();
await commands.viewMilestone(number);

// Repository operations
await commands.getRepoInfo();
await commands.listBranches();
```

#### Error Handling
```typescript
const result = await commands.createIssue(params);

if (result.success) {
  console.log('✅ Operation successful');
  console.log('Output:', result.output);
} else {
  console.error('❌ Operation failed');
  console.error('Error:', result.message);
  console.error('Exit code:', result.exitCode);
  
  // Handle specific error types
  if (result.message.includes('already exists')) {
    console.log('⚠️ Resource already exists, skipping...');
  }
}
```

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

### Validation Patterns

All CLI arguments and function parameters use Zod schemas for runtime validation and type safety.

#### Params Object Pattern
```typescript
import { z } from 'zod';
import { CreateFossilIssueParamsSchema } from '../src/types/schemas';

// Define validation schema
const IssueParamsSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string().max(50)).max(100),
  milestone: z.string().optional(),
  type: z.enum(['action', 'observation', 'plan']).default('action'),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional()
});

// Use in function
async function createIssue(params: z.infer<typeof IssueParamsSchema>) {
  // Validate at runtime
  const validatedParams = IssueParamsSchema.parse(params);
  
  // Use validated params
  const result = await createFossilIssue(validatedParams);
  return result;
}
```

#### CLI Argument Validation
```typescript
// In CLI script
import { parseArgs } from '../src/utils/cli';
import { CreateFossilIssueParamsSchema } from '../src/types/schemas';

async function main() {
  try {
    // Parse and validate CLI arguments
    const args = parseArgs(CreateFossilIssueParamsSchema, {
      type: 'action',
      tags: ['automation']
    });
    
    // Arguments are now type-safe and validated
    const result = await createFossilIssue(args);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}
```

#### Validation Error Handling
```typescript
// Comprehensive error handling for validation
try {
  const validatedParams = schema.parse(params);
  // Use validated params
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
    console.error('Validation failed:');
    error.errors.forEach(err => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
  } else if (error instanceof Error) {
    // Handle other errors
    console.error('Unexpected error:', error.message);
  } else {
    // Handle unknown errors
    console.error('Unknown error occurred');
  }
}
```

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

> ⚠️ **Warning:** LLM fossilization is temporarily disabled due to a circular dependency issue. A permanent fix is in progress. The canonical pattern requiring explicit owner/repo parameters is still required for all LLMService and fossilization utility usage.

### ML-Ready Fallback Funnel for LLM Calls

When fossilization is disabled or fails (due to circular dependency, memory leak, or process loop risk), **LLMService** and related utilities must:

- **Fall back to a minimal, ML-ready review funnel**: Instead of returning a generic mock, the system returns a canonical fallback response that is:
  - Traceable (includes metadata about the fallback event)
  - Minimal (no side effects, no unnecessary data)
  - Safe for downstream ML review and audit
- **Log the fallback event**: All fallback events are logged for auditability and future review.
- **Avoid memory leaks and process loops**: The fallback path must never introduce infinite recursion, circular dependencies, or resource leaks, even under integration or test conditions.
- **Test Philosophy**: Tests should verify that the fallback path is robust, traceable, and ML-ready—not just a dummy value. Integration tests should simulate fossilization failures and confirm the fallback is safe and auditable.

> This ensures that even when fossilization is unavailable, all LLM calls remain ML-ready, traceable, and safe for audit and review.

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

### Local LLM Setup

#### Prerequisites
```bash
# Install Ollama (recommended local LLM)
curl -fsSL https://ollama.ai/install.sh | sh

# Download models
ollama pull llama2
ollama pull mistral
ollama pull codellama

# Start Ollama service
ollama serve
```

#### Environment Configuration
```bash
# .env file
OPENAI_API_KEY=your_openai_key  # Fallback for complex tasks
OLLAMA_BASE_URL=http://localhost:11434  # Local LLM endpoint
PREFER_LOCAL_LLM=true  # Default preference
```

### Usage Patterns

#### Basic Local LLM Usage
```typescript
import { LLMService } from '../src/services/llm';

const llmService = new LLMService({
  // Required owner/repo parameters (prevents circular dependency)
  owner: 'BarreraSlzr',
  repo: 'automate_workloads'
});

// Use local LLM for simple tasks
const result = await llmService.callLLM({
  model: 'llama2',
  messages: [{ role: 'user', content: 'Explain TypeScript' }],
  routingPreference: 'local'
});
```

#### Intelligent Routing
```typescript
// Automatic routing based on task complexity
const result = await llmService.callLLM({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Complex analysis task' }],
  routingPreference: 'auto'  // Automatically chooses best provider
});

// Force local LLM
const localResult = await llmService.callLLM({
  model: 'llama2',
  messages: [{ role: 'user', content: 'Simple question' }],
  routingPreference: 'local'
});

// Force cloud LLM
const cloudResult = await llmService.callLLM({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Complex task' }],
  routingPreference: 'cloud'
});
```

#### CLI Usage
```bash
# Use local LLM
bun run src/cli/llm-usage.ts --prefer-local --local-backend ollama

# Use cloud LLM
bun run src/cli/llm-usage.ts --prefer-cloud

# Intelligent routing (default)
bun run src/cli/llm-usage.ts --auto

# Select specific local backend
bun run src/cli/llm-usage.ts --local-backend llama.cpp --prefer-local
```

#### Fossilization with Local LLM
```typescript
// Local LLM for fossil generation
const fossil = await fossilizeLLMInsight({
  type: 'insight',
  timestamp: new Date().toISOString(),
  model: 'llama2',
  provider: 'ollama',
  excerpt: 'Local LLM generated insight',
  prompt: 'Analyze this code',
  response: 'Analysis result...',
  routingPreference: 'local'
});
```

### Performance Optimization

#### Caching
```typescript
// Enable response caching
const llmService = new LLMService({ enableCaching: true });

// Cached responses for repeated queries
const result1 = await llmService.callLLM({ /* params */ });
const result2 = await llmService.callLLM({ /* same params */ }); // Uses cache
```

#### Batch Processing
```typescript
// Process multiple queries efficiently
const queries = [
  { content: 'Query 1' },
  { content: 'Query 2' },
  { content: 'Query 3' }
];

const results = await llmService.batchProcess(queries, {
  routingPreference: 'local',
  batchSize: 5
});
```

### Troubleshooting

#### Common Issues
```bash
# Check Ollama status
ollama list
ollama ps

# Test local LLM
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "Hello"}'

# Check logs
ollama logs
```

#### Fallback Strategy
```typescript
// Automatic fallback to cloud LLM if local fails
const result = await llmService.callLLM({
  model: 'llama2',
  messages: [{ role: 'user', content: 'Task' }],
  routingPreference: 'local',
  fallbackToCloud: true  // Falls back to OpenAI if Ollama fails
});
```

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
const llmService = new LLMService({
  // Required owner/repo parameters (prevents circular dependency)
  owner: 'BarreraSlzr',
  repo: 'automate_workloads'
});
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

## 🦴 Fossil Publication Workflow

The fossil publication workflow converts curated YAML fossils into public-facing markdown and JSON for blogs, APIs, and automation.

### Workflow: YAML → JSON → Markdown

```typescript
import { publishFossil } from '../src/utils/fossilPublication';

// Publish project status fossil
await publishFossil({
  source: 'fossils/project_status.yml',
  outputs: {
    markdown: 'fossils/public/blog/project_status.post.md',
    json: 'fossils/public/api/project_status_public.json'
  },
  metadata: {
    audience: 'public',
    category: 'project-status',
    tags: ['automation', 'status']
  }
});
```

### Folder Structure
```
fossils/
  project_status.yml              # Canonical YAML fossil
  roadmap.yml
  setup_status.yml
  public/
    blog/
      project_status.post.md      # Public markdown with frontmatter
      roadmap.post.md
    api/
      project_status_public.json  # Public JSON with metadata
      roadmap_public.json
```

### CLI Usage
```bash
# Publish single fossil
bun run src/cli/publish-fossil.ts \
  --source fossils/project_status.yml \
  --output-markdown fossils/public/blog/project_status.post.md \
  --output-json fossils/public/api/project_status_public.json

# Publish all fossils
bun run src/cli/publish-all-fossils.ts

# Validate publication
bun run src/cli/validate-publication.ts
```

### Markdown Output Format
```markdown
---
title: "Project Status Update"
date: "2024-07-15T10:30:00Z"
audience: "public"
category: "project-status"
tags: ["automation", "status", "progress"]
source: "fossils/project_status.yml"
---

# Project Status Update

Generated from canonical fossil data...

## Key Metrics
- Health Score: 85/100
- Automation Progress: 75%
- Test Coverage: 92%

## Recent Achievements
...
```

### JSON Output Format
```json
{
  "metadata": {
    "title": "Project Status Update",
    "timestamp": "2024-07-15T10:30:00Z",
    "audience": "public",
    "category": "project-status",
    "source": "fossils/project_status.yml"
  },
  "data": {
    "healthScore": 85,
    "automationProgress": 75,
    "testCoverage": 92,
    "recentAchievements": [...]
  }
}
```

### Future Integrations
The publication workflow supports future integrations with:
- **React/MDX**: Frontmatter metadata enables MDX processing
- **Next.js/Remix**: Structured data for dynamic rendering
- **API Endpoints**: JSON outputs serve as REST API responses
- **Automation**: CI/CD integration for automatic publication

---

## 📊 Roadmap LLM Insights

The roadmap LLM insights system provides external analysis and generation of insights from `roadmap.yml`, replacing the previous embedded `llmInsights` approach for better maintainability and advanced analysis capabilities.

### Overview

Instead of embedding LLM insights directly in `roadmap.yml`, the system now:
- **Analyzes** the roadmap externally using sophisticated LLM analysis
- **Generates** insights for tasks, milestones, and overall progress
- **Fossilizes** all insights with proper metadata and traceability
- **Publishes** insights in multiple formats for different use cases

### Core Scripts

#### Remove Embedded LLM Insights
```bash
# Remove all llmInsights from roadmap.yml
bun run scripts/remove-llm-insights-from-roadmap.ts
```

This script:
- Creates a backup of the current roadmap with LLM insights
- Removes all `llmInsights` properties from tasks and subtasks
- Preserves all other roadmap structure and metadata

#### Generate External LLM Insights
```bash
# Analyze roadmap and generate fresh insights
bun run scripts/analyze-roadmap-llm-insights.ts
```

This script:
- Analyzes each task individually for insights
- Analyzes milestone progress and completion
- Analyzes overall roadmap health and progress
- Fossilizes all insights with proper metadata

#### Extract Insights for Publication
```bash
# Extract insights for web publication and reports
bun run scripts/extract-roadmap-insights.ts
```

This script:
- Creates a collection of all insights
- Generates web-friendly publication format
- Creates markdown reports for human consumption
- Maintains traceability back to the roadmap

### Analysis Capabilities

#### Task-Level Analysis
Each task is analyzed for:
- **Priority**: High/medium/low based on status, tags, and context
- **Impact**: High/medium/low based on task scope and dependencies
- **Blockers**: Identified dependencies or issues
- **Recommendations**: Specific next steps
- **Category**: Classification (implementation, testing, documentation, etc.)
- **Progress**: Assessment based on status and subtasks

#### Milestone Analysis
Each milestone is analyzed for:
- **Completion**: Percentage of completion
- **Priority**: Based on completion and task importance
- **Blockers**: Issues preventing completion
- **Recommendations**: Steps to advance the milestone
- **Risk**: Assessment of completion risk

#### Overall Progress Analysis
The entire roadmap is analyzed for:
- **Health**: Excellent/good/fair/poor based on progress distribution
- **Priorities**: Top 3 priority areas to focus on
- **Risks**: Key concerns for roadmap completion
- **Recommendations**: Strategic recommendations
- **Next Quarter**: Key objectives for the next quarter

### File Structure

```
fossils/
├── roadmap.yml                    # Clean roadmap without embedded insights
├── roadmap_insights/             # Directory for LLM insight fossils
│   ├── analysis_summary.json     # Summary of all generated insights
│   └── [individual fossil files] # Individual insight fossils
├── roadmap_insights_collection.json  # Collection of all insights
├── roadmap_insights_web.json     # Web publication format
└── public/
    └── roadmap_progress.md       # Human-readable markdown report
```

### Usage Patterns

#### For Developers
```bash
# Generate fresh insights after roadmap updates
bun run scripts/analyze-roadmap-llm-insights.ts

# Extract insights for web publication
bun run scripts/extract-roadmap-insights.ts
```

#### For Project Managers
- Review `fossils/roadmap_insights/analysis_summary.json` for overview
- Check `fossils/public/roadmap_progress.md` for human-readable report
- Use milestone analysis for progress tracking
- Reference task insights for prioritization

#### For LLM Systems
- Parse `fossils/roadmap_insights_collection.json` for structured data
- Use `fossils/roadmap_insights_web.json` for web integration
- Reference individual fossils for detailed analysis

### Integration with CI/CD

```yaml
# Example GitHub Actions workflow
- name: Analyze Roadmap Insights
  run: |
    bun run scripts/analyze-roadmap-llm-insights.ts
    bun run scripts/extract-roadmap-insights.ts
```

### Migration from Embedded Insights

If you have existing scripts that access `task.llmInsights`, update them to:
1. Use the insights collection files
2. Reference individual fossil files
3. Use the web publication format

See [Roadmap LLM Insights Migration Guide](./ROADMAP_LLM_INSIGHTS_MIGRATION.md) for detailed migration instructions. 