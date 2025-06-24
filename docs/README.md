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

We welcome contributions! Please see the [Contributing Guide](../CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 