# 📚 Automation Ecosystem Documentation

Welcome to the comprehensive documentation for the Automation Ecosystem. This guide covers everything you need to know about setting up, using, and extending the automation suite.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Service Integrations](#service-integrations)
4. [CLI Commands](#cli-commands)
5. [Development Guide](#development-guide)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Fossil Publication Workflow](#fossil-publication-workflow)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh)** - Fast JavaScript runtime
- **[GitHub CLI](https://cli.github.com/)** - GitHub command-line tool
- **Node.js 18+** (optional, for some tools)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BarreraSlzr/automate_workloads.git
   cd automate_workloads
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up authentication:**
   ```bash
   # GitHub CLI authentication
   gh auth login
   
   # Set up environment variables (optional)
   cp .env.example .env
   # Edit .env with your tokens
   ```

### Quick Test

Test that everything is working:

```bash
# Check GitHub CLI
bun run src/cli/github-issues.ts --help

# Fetch issues from your repository
bun run src/cli/github-issues.ts --verbose
```

## 🏗️ Architecture Overview

The automation ecosystem is built with a modular, service-oriented architecture:

```
src/
├── core/           # Core configuration and utilities
│   └── config.ts   # Environment and configuration management
├── services/       # Service integrations
│   ├── github.ts   # GitHub API integration
│   ├── twitter.ts  # Twitter API integration
│   ├── gmail.ts    # Gmail API integration
│   ├── buffer.ts   # Buffer API integration
│   └── obsidian.ts # Obsidian file operations
├── cli/           # CLI command implementations
│   └── github-issues.ts
├── types/         # TypeScript type definitions
│   └── index.ts
└── utils/         # Shared utility functions
    └── cli.ts     # CLI execution utilities
```

### Key Design Principles

1. **CLI-First**: Prefer CLI tools over SDKs when available
2. **Type Safety**: Full TypeScript support with comprehensive types
3. **Validation**: Runtime validation using Zod schemas
4. **Modularity**: Each service is independent and composable
5. **Documentation**: Comprehensive JSDoc comments throughout

## 🏷️ Labels vs Tags: Important Distinction

**Important**: GitHub **labels** and fossil **tags** are **NOT the same** and serve different purposes:

### **GitHub Labels** 
- **Purpose**: GitHub-specific metadata for issues, PRs, and other GitHub objects
- **Storage**: GitHub's database
- **Usage**: Visual filtering and organization in GitHub interface
- **Example**: `['automation', 'bug', 'status:pending']`

### **Fossil Tags**
- **Purpose**: Local content organization and semantic search
- **Storage**: Local fossil system (`fossils/` directory)
- **Usage**: Intelligent categorization, relationship mapping, semantic search
- **Example**: `['github', 'issue', 'automation', 'roadmap']`

### **How They Work Together**

```typescript
const result = await createFossilIssue({
  labels: ['automation', 'bug'],        // GitHub labels
  tags: ['automation', 'bug'],          // Fossil tags
  // ... other parameters
});
```

> **📖 For detailed explanation**: See [Intelligent Tagging System](INTELLIGENT_TAGGING_SYSTEM.md#labels-vs-tags-understanding-the-distinction)

## 🔌 Service Integrations

### GitHub Integration

The GitHub service uses the GitHub CLI (`gh`) for all operations, providing:

- **Issue Management**: Create, list, close, and comment on issues
- **Repository Information**: Fetch repository metadata
- **Authentication**: Uses `gh auth login` for secure authentication

**Example Usage:**
```typescript
import { GitHubService } from '../services/github';

const github = new GitHubService('owner', 'repo');
const issues = await github.getIssues({ state: 'open' });
```

### Twitter Integration

Twitter integration uses the Twitter API v2 with bearer token authentication:

- **Tweet Management**: Post tweets, fetch mentions
- **User Information**: Get user profiles and metrics
- **Rate Limiting**: Built-in rate limit handling

### Gmail Integration

Gmail integration provides:

- **Email Management**: Send, read, and search emails
- **Draft Creation**: Create and manage email drafts
- **Label Management**: Organize emails with labels

### Buffer Integration

Buffer integration enables:

- **Post Scheduling**: Schedule social media posts
- **Content Management**: Manage post content and timing
- **Analytics**: Track post performance

### Obsidian Integration

Obsidian integration offers:

- **Note Management**: Read and write Obsidian notes
- **Daily Notes**: Automate daily note creation
- **Template Processing**: Use templates for content generation

## 🖥️ CLI Commands

### GitHub Issues Command

**Command:** `bun run src/cli/github-issues.ts`

**Options:**
- `--owner, -o`: Repository owner (default: BarreraSlzr)
- `--repo, -r`: Repository name (default: automate_workloads)
- `--state, -s`: Issue state filter (open|closed|all)
- `--format, -f`: Output format (text|json|table)
- `--verbose, -v`: Verbose output
- `--help, -h`: Show help

**Examples:**
```bash
# List open issues
bun run src/cli/github-issues.ts

# List closed issues in table format
bun run src/cli/github-issues.ts --state closed --format table

# List issues from a different repository
bun run src/cli/github-issues.ts --owner octocat --repo Hello-World
```

## 🛠️ Development Guide

### Adding a New Service

1. **Create the service file:**
   ```typescript
   // src/services/newservice.ts
   import { executeCommand } from "../utils/cli";
   import type { ServiceResponse } from "../types";
   
   export class NewService {
     async doSomething(): Promise<ServiceResponse<any>> {
       // Implementation
     }
   }
   ```

2. **Add types:**
   ```typescript
   // src/types/index.ts
   export interface NewServiceData {
     // Type definitions
   }
   ```

3. **Create CLI command:**
   ```typescript
   // src/cli/newservice-command.ts
   import { NewService } from "../services/newservice";
   
   async function main() {
     const service = new NewService();
     // CLI implementation
   }
   ```

4. **Update documentation:**
   - Add service documentation here
   - Update README.md
   - Add examples

### Code Style Guidelines

- **JSDoc Comments**: All functions must have comprehensive JSDoc comments
- **Type Safety**: Use TypeScript strict mode
- **Error Handling**: Always handle errors gracefully
- **Validation**: Validate inputs with Zod schemas
- **Testing**: Write tests for new functionality

### Environment Variables

The system supports multiple ways to configure environment variables:

1. **Raycast Environment**: For Raycast extensions
2. **Process Environment**: For CLI usage
3. **Configuration Files**: For persistent settings

**Required Variables:**
- `GITHUB_TOKEN`: GitHub personal access token (optional, uses gh CLI)
- `TWITTER_BEARER_TOKEN`: Twitter API v2 bearer token
- `GMAIL_TOKEN`: Gmail API OAuth token
- `BUFFER_TOKEN`: Buffer API access token

## 📖 API Reference

### Core Configuration

#### `getEnv()`
Loads and validates environment configuration.

**Returns:** `EnvironmentConfig`

**Example:**
```typescript
import { getEnv } from '../core/config';
const config = getEnv();
```

#### `validateConfig()`
Validates the current configuration.

**Returns:** `ConfigValidationResult`

### CLI Utilities

#### `executeCommand(command, options)`
Executes a shell command with comprehensive error handling.

**Parameters:**
- `command`: Command string to execute
- `options`: Execution options

**Returns:** `CLIExecuteResult`

#### `executeCommandJSON<T>(command, options)`
Executes a command and returns parsed JSON output.

**Parameters:**
- `command`: Command string to execute
- `options`: Execution options

**Returns:** `T` (parsed JSON)

### GitHub Service

#### `GitHubService(owner, repo)`
Creates a new GitHub service instance.

**Methods:**
- `getIssues(options)`: Fetch repository issues
- `createIssue(title, body, options)`: Create a new issue
- `closeIssue(number, comment)`: Close an issue
- `addComment(number, comment)`: Add a comment to an issue
- `getRepoInfo()`: Get repository information

## 🔧 Troubleshooting

### Common Issues

#### GitHub CLI Not Authenticated
**Error:** `GitHub CLI is not ready. Please run: gh auth login`

**Solution:**
```bash
gh auth login
```

#### Missing Environment Variables
**Error:** `Invalid environment configuration`

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

### Debug Mode

Enable verbose output for debugging:

```bash
bun run src/cli/github-issues.ts --verbose
```

### Getting Help

- **Documentation**: Check this documentation
- **Issues**: Create an issue on GitHub
- **Examples**: See the `examples/` directory

## 🤝 Contributing

We welcome contributions! **All commits must use the Conventional Commits format.**

See [Development Guide](docs/DEVELOPMENT_GUIDE.md#commit-message-format) and [Contributing Guide](CONTRIBUTING_GUIDE.md#conventional-commits-format) for details and examples.

Please see the [Contributing Guide](../CONTRIBUTING_GUIDE.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 

## Project Structure
- All automation, scripts, and integration tests are local to this repository.
- There is no `remote-repo` or cross-repo simulation; all references are to the local repository.

## Integration Testing
- Integration tests for all major shell scripts are required and included in the `tests/integration/` directory.
- Integration tests are included in coverage metrics and must be maintained as part of overall test coverage.
- Pre-commit hooks use a unified validation system that runs comprehensive checks and blocks commits on any failure.

## Best Practices
- **Argument Validation:** Always check that required arguments (e.g., owner, repo) are provided and non-empty in scripts.
- **Timeouts:** Wrap all external commands (e.g., `gh`, `bun`, `jq`) with a timeout to prevent hanging.
- **Clean Output:** Remove debug output from production scripts for clarity in CI and logs.

## Running Integration Tests
```sh
bun test tests/integration --coverage
```

## Pre-commit Expectations

The unified pre-commit system (`bun run precommit:unified`) validates:

- ✅ TypeScript type checking (`bun run tsc --noEmit`)
- ✅ Schema and pattern validation (`bun run validate:pre-commit`)
- ✅ Evolving footprint updates (`bun run footprint:evolving --update true`)
- ✅ Commit message validation (`bun run scripts/commit-message-validator.ts --pre-commit --strict`)
- ✅ Optional LLM insight generation (`bun run scripts/precommit-llm-insight.ts`)

All validation steps must pass before commits are allowed. 

## Repository Orchestrator: Unified Planning & Automation

The `repo-orchestrator.ts` script now handles all planning, orchestration, and fossilization workflows. It supports both per-issue and global LLM-powered planning via the `--plan-mode` option.

### Usage

```sh
bun run repo-orchestrator orchestrate <owner> <repo> --workflow plan --plan-mode both --output plan.json
```

- `--plan-mode`: `per-issue`, `global`, or `both` (default: `both`).
- `--output <file>`: (Optional) Output file for the unified plan JSON (for legacy/manual use).
- `--summary`: Print only a chat/LLM-friendly summary of the latest plan fossil (for piping into chat tools).

### Example: Get a chat-ready summary for LLM context

```sh
bun run repo-orchestrator orchestrate barreraslzr automate_workloads --workflow plan --plan-mode both --summary | cursor chat
```

### Example Workflow

```sh
bun run repo-orchestrator orchestrate barreraslzr automate_workloads --workflow plan --plan-mode both --output plan.json
```

This will:
1. Read open GitHub issues
2. Generate per-issue checklists and a global plan using LLM
3. Output a unified plan object (per-issue, global, all tasks)
4. Fossilize the plan in the context store

### Integration with GitHub Actions

You can call this script from a GitHub Actions workflow for full automation.

---

## LLM Plan CLI: `llm-plan.ts`

### New `--issue-mode` Flag

- Use `--issue-mode` with the `decompose` command to generate a Markdown checklist for a GitHub issue:

```sh
bun run llm:plan decompose "Fix bug in login flow" --issue-mode
```

- Without `--issue-mode`, the command will perform general goal decomposition:

```sh
bun run llm:plan decompose "Launch new product feature"
```

### When to Use
- Use `--issue-mode` for GitHub issues or any context where you want a checklist of actionable steps.
- Use the default mode for broader project or goal planning.

---

## Automated Workloads Summary

- **Per-issue checklist generation:** Each GitHub issue gets a Markdown checklist of actionable steps.
- **Project-wide next-steps planning:** Aggregates all issue checklists and generates a global next-steps plan.
- **Automated updating:** Updates GitHub issues with generated checklists using a single command.
- **Flexible LLM planning:** Supports both issue-specific and general goal decomposition.
- **CI/CD ready:** Can be run locally or in GitHub Actions for continuous automation.

---

## Learnings & Best Practices

- Use LLMs to automate repetitive planning and checklist generation, but always review outputs for accuracy.
- Use the `--issue-mode` flag for issue-centric workflows to get actionable Markdown checklists.
- Aggregate per-issue results for higher-level project planning.
- Keep your scripts modular and composable for easy integration in CI/CD.
- Document your automation workflows and update them as your project evolves.

---

## Test Strategy: Bun vs. Jest

- **Bun** is used for most unit, integration, and logic tests. Run all Bun-compatible tests with:
  ```sh
  bun test
  ```
- **Jest** is used for tests that require deep mocking of built-in modules (e.g., `child_process`, `fs`), such as the CLI orchestrator. These tests are named with `.jest.ts` and run with:
  ```sh
  bun run test:jest
  # or
  npx jest
  ```

### Why the Split?
- Bun's test runner is fast and native, but does not support robust mocking of built-in modules or subprocesses.
- Jest provides powerful mocking and is ideal for CLI/agent tests that need to simulate subprocesses or file system operations.

### Example
- Run all Bun tests:
  ```sh
  bun test
  ```
- Run only Jest tests:
  ```sh
  bun run test:jest
  # or
  npx jest
  ```

Keep `.jest.ts` files for Jest-only tests and `.test.ts` for Bun tests. This ensures clarity and reliability in your test suite. 

---

## Jest Experiment: Learnings and Cleanup

- **Jest was explored for deep mocking and CLI testing.**
- **Key issues:**
  - Jest/ts-jest does not fully support ESM features (like import.meta) in Bun/TypeScript projects.
  - ts-jest could not be made to recognize the correct module config for ESM, even with custom tsconfig.
  - Node.js built-in modules and globals were not always recognized in the Jest/ESM/TypeScript setup.
- **Decision:**
  - Remove Jest and all related config and test files.
  - Use only Bun's test runner for all tests in this project.
  - For advanced mocking or CLI testing, consider refactoring for dependency injection or use manual/integration tests.

**Cleanup:**
- Removed all Jest-related files and configs.
- Removed Jest-specific test files.
- If you see any Jest dependencies in package.json, you can remove them with:
  ```sh
  bun remove jest ts-jest @types/jest
  ``` 

## Automation Issue Template

This project uses a dedicated issue template for automation/programmatically created issues: `.github/ISSUE_TEMPLATE/automation_task.yml`.

- All issues created by scripts or bots (e.g., repository orchestration) will use this template structure.
- The template includes fields for purpose, checklist, and automation metadata.
- This ensures consistency and clarity for all automation-related issues.

## Programmatic Issue Creation

When scripts create issues automatically, they now read from the automation issue template to populate the issue body. This makes it easy to update the format for all automation issues in one place. 

## 🏠 Local LLM Integration & Fossilization (New)

- The system now supports pluggable local LLM backends (Ollama-first, extensible).
- Use the CLI option `--local-backend <name>` to select/switch local LLMs.
- All LLM outputs (insights, benchmarks, discoveries) can be fossilized for traceability using utilities in `src/utils/fossilize.ts`.
- See `tests/integration/llm-fossilization.integration.test.ts` for working examples.

### Example CLI Usage
```sh
bun run src/cli/llm-usage.ts --local-backend ollama
```

### Example: Fossilizing an LLM Insight
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

## 🧠 Intelligent LLM Routing (New)

The system supports intelligent routing between local and cloud LLMs. You can control routing with CLI flags:

- `--prefer-local`: Always use local LLM (if available)
- `--prefer-cloud`: Always use cloud LLM
- `--auto`: Use intelligent routing (default)

**Examples:**
```sh
bun run src/cli/llm-usage.ts --prefer-local
bun run src/cli/llm-usage.ts --prefer-cloud
bun run src/cli/llm-usage.ts --auto
```

You can also select the local backend:
```sh
bun run src/cli/llm-usage.ts --local-backend llama.cpp --prefer-local
```

In code:
```typescript
import { LLMService } from '../src/services/llm';
const llmService = new LLMService();
llmService.setRoutingPreference('auto'); // or 'local', 'cloud'
const result = await llmService.callLLM({
  model: 'gpt-4',
  apiKey: '...',
  messages: [...],
  routingPreference: 'cloud', // override per-call
});
``` 

## 🦴 Fossil Publication Workflow

All public-facing documentation, blog posts, and API outputs are now generated from curated YAML fossils (e.g., `fossils/project_status.yml`).
See [Fossil Publication Workflow](./FOSSIL_PUBLICATION_WORKFLOW.md) for details on the YAML → JSON → Markdown process, folder structure, and future-proofing for automation and integrations. 

### Fossil File Naming and Curation Policy

- Only stable, curated fossil files (e.g., `insight.json`, `benchmark.json`, `discovery.json`, `fossil-export-latest.json`) should be committed to the repository.
- Timestamped fossil files and ad-hoc exports (e.g., `fossil-export-2025-07-03T06-51-07-887Z.json`) are for local use only and must not be committed.
- Test/demo fossil outputs (including any file named `demo-fossil.json`) must be cleaned up after tests or written to a `.gitignore`d directory.
- The export command now supports a `stable` option to always write to a canonical filename for reporting/automation. 

## 🦴 Migration Guide: CLI & Fossil Automation Patterns

To ensure robust, maintainable, and testable automation, follow these migration steps:

- Use fossil-backed utilities (`createFossilIssue`, `createFossilLabel`, `createFossilMilestone`) for all GitHub object creation.
- Use the `GitHubCLICommands` utility for all GitHub CLI command construction and execution.
- Validate all CLI arguments using Zod schemas from `@/types`.
- Use centralized error handling (e.g., `ErrorHandler`).
- Always check for existing fossils before creating new issues, labels, or milestones.
- Define all types and Zod schemas in `src/types/`.
- Test all CLI commands and fossil utilities for validation, deduplication, and error handling.
- Update documentation and code examples to use the new patterns.
- Remove or clearly mark deprecated code and patterns (e.g., direct `execSync`, manual string building, ad-hoc validation).

See [CLI_COMMAND_INSIGHTS.md](./CLI_COMMAND_INSIGHTS.md) for the full migration guide, checklist, and code examples. 