# 🛠️ Development Guide

A comprehensive guide for building maintainable, scalable, and developer-friendly automation projects with Bun and TypeScript.

## 📋 Table of Contents

- [Code Style Guidelines](#code-style-guidelines)
- [Documentation Standards](#documentation-standards)
- [Testing Strategy](#testing-strategy)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Service Development](#service-development)
- [CLI Development](#cli-development)
- [Type Safety](#type-safety)
- [Error Handling](#error-handling)
- [Contributing Workflow](#contributing-workflow)

---

## 🎨 Code Style Guidelines

### Core Principles

1. **Bun-First Development**: Leverage Bun's speed and TypeScript support
2. **CLI-First Integration**: Prefer CLI tools over SDKs when available
3. **Consistency Over Perfection**: Choose a style and stick to it across the entire codebase
4. **Readability First**: Code should be self-documenting and easy to understand
5. **Explicit Over Implicit**: Avoid magic numbers, unclear variable names, and hidden behavior
6. **Single Responsibility**: Each function, class, and module should have one clear purpose

### Export Patterns

**Use Named Exports Only**
```typescript
// ✅ Good
export { GitHubService } from './github';
export type { GitHubIssue, ServiceResponse } from './types';

// ❌ Bad
export default GitHubService;
export * from './github';
```

**Index File Structure**
```typescript
/**
 * GitHub service module.
 * Provides GitHub integration using GitHub CLI.
 * 
 * @see ./github.ts for implementation details
 * @see ./types.ts for type definitions
 */
export { GitHubService } from './github';
export type { GitHubIssue, GitHubOptions } from './types';
export { validateGitHubConfig } from './validation';
```

### Naming Conventions

- **Files**: `kebab-case` for directories, `camelCase` for files
- **Functions**: `camelCase`, descriptive verbs (e.g., `createIssue`, `validateConfig`)
- **Constants**: `UPPER_SNAKE_CASE` for global constants, `camelCase` for module constants
- **Types/Interfaces**: `PascalCase` (e.g., `GitHubIssue`, `ServiceResponse`)
- **Booleans**: Start with `is`, `has`, `can`, `should` (e.g., `isReady`, `hasPermission`)
- **Services**: `Service` suffix (e.g., `GitHubService`, `TwitterService`)

---

## 📚 Documentation Standards

### JSDoc Requirements

**Every exported value must have JSDoc documentation:**

```typescript
/**
 * GitHub issue information.
 * Contains core issue data and metadata.
 */
export interface GitHubIssue {
  /** Unique issue number */
  number: number;
  /** Issue title */
  title: string;
  /** Issue state (open, closed) */
  state: 'open' | 'closed';
  /** When the issue was created */
  createdAt: string;
}

/**
 * Creates a new GitHub issue.
 * Validates input data and creates the issue via GitHub CLI.
 * 
 * @param title - Issue title
 * @param body - Issue body content
 * @param options - Issue options (labels, assignee)
 * @returns Promise resolving to the created issue
 * @throws {ValidationError} When input data is invalid
 * @throws {CLIError} When GitHub CLI command fails
 */
export async function createIssue(
  title: string,
  body: string,
  options: GitHubOptions = {}
): Promise<ServiceResponse<GitHubIssue>> {
  // Implementation
}
```

### File-Level Documentation

**Every file should start with a summary comment:**

```typescript
/**
 * GitHub service integration using GitHub CLI.
 * 
 * This module provides:
 * - Issue management (create, read, update, close)
 * - Repository information
 * - CLI-based authentication
 * - Error handling and validation
 * 
 * @see ../types/index.ts for centralized type exports
 * @see ../utils/cli.ts for CLI execution utilities
 */
```

### README Structure

```markdown
# Automation Ecosystem

A comprehensive automation suite integrating GitHub, Twitter, Gmail, Buffer, and Obsidian.

## 🚀 Quick Start

```bash
bun install
bun run issues
```

## 📚 Documentation

- [API Reference](docs/API_REFERENCE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Environment Guide](docs/ENVIRONMENT_GUIDE.md)

## 🛠️ Development

- [Contributing Guide](docs/CONTRIBUTING_GUIDE.md)
- [Testing Guide](docs/testing.md)
- [Deployment Guide](docs/deployment.md)
```

---

## 🧪 Testing Strategy

### Testing Framework: Bun Test

**Recommended Setup:**
```json
{
  "scripts": {
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  }
}
```

### Test Organization

**Directory Structure:**

See [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) for the current directory structure and explanations.

**Test File Naming:**
- `*.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests

### Testing Patterns

**Unit Test Example:**
```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { GitHubService } from "../services/github";

describe('GitHubService', () => {
  let github: GitHubService;

  beforeEach(() => {
    github = new GitHubService('test-owner', 'test-repo');
  });

  describe('formatIssues', () => {
    it('should format issues as table', () => {
      const issues = [
        { number: 1, title: 'Test Issue', state: 'open', labels: [], assignees: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ];

      const result = github.formatIssues(issues, 'table');
      expect(result).toContain('Test Issue');
      expect(result).toContain('1');
    });

    it('should handle empty issues array', () => {
      const result = github.formatIssues([], 'table');
      expect(result).toBe('No issues found');
    });
  });
});
```

**Integration Test Example:**
```typescript
import { describe, it, expect, beforeAll } from "bun:test";
import { executeCommand } from "../utils/cli";

describe('CLI Integration', () => {
  it('should execute echo command successfully', () => {
    const result = executeCommand('echo "test"');
    expect(result.success).toBe(true);
    expect(result.stdout.trim()).toBe('test');
  });

  it('should handle command not found gracefully', () => {
    const result = executeCommand('nonexistent-command', { throwOnError: false });
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(127);
  });
});
```

---

## 🔧 Environment Configuration

### Environment File Structure

```
project/
├── .env.example          # Template with all variables (committed)
├── .env.local            # Local development (gitignored)
├── .env.test             # Test environment (gitignored)
├── src/
│   └── core/
│       └── config.ts     # Environment validation
```

### Environment Variables

**`.env.example`:**
```bash
# =============================================================================
# AUTOMATION ECOSYSTEM CONFIGURATION
# =============================================================================

# GitHub (optional - uses gh CLI by default)
GITHUB_TOKEN=your_github_token

# Twitter API v2
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Gmail API
GMAIL_TOKEN=your_gmail_oauth_token

# Buffer API
BUFFER_TOKEN=your_buffer_access_token

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================

# Debug mode
DEBUG=false
VERBOSE=false

# Test settings
TEST_MODE=false
MOCK_SERVICES=false
```

### Configuration Validation

```typescript
import { z } from "zod";

export const envSchema = z.object({
  githubToken: z.string().optional(),
  twitterToken: z.string().optional(),
  gmailToken: z.string().optional(),
  bufferToken: z.string().optional(),
  debug: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export function getEnv() {
  // Implementation with validation
}
```

---

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) for the canonical, up-to-date project structure, directory tree, and explanations.

### Recommended Structure

```
automate_workloads/
├── src/
│   ├── core/             # Core configuration and utilities
│   │   ├── config.ts     # Environment management
│   │   └── validation.ts # Validation schemas
│   ├── services/         # Service integrations
│   │   ├── github.ts     # GitHub service
│   │   ├── twitter.ts    # Twitter service
│   │   ├── gmail.ts      # Gmail service
│   │   └── buffer.ts     # Buffer service
│   ├── cli/             # CLI command implementations
│   │   ├── github-issues.ts
│   │   ├── twitter-mentions.ts
│   │   └── gmail-drafts.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   └── utils/           # Shared utility functions
│       ├── cli.ts       # CLI execution utilities
│       └── validation.ts # Validation utilities
├── docs/                # Documentation
├── examples/            # Usage examples
├── tests/               # Test files
└── scripts/             # Build and utility scripts
```

### Module Organization

**Service Module Structure:**
```typescript
// src/services/github.ts
/**
 * GitHub service integration using GitHub CLI.
 */
export class GitHubService {
  // Constructor and properties
  
  // Public methods
  async getIssues(): Promise<ServiceResponse<GitHubIssue[]>> {}
  async createIssue(): Promise<ServiceResponse<GitHubIssue>> {}
  
  // Private helper methods
  private validateInput() {}
  private formatOutput() {}
}

// Export types
export type { GitHubIssue, GitHubOptions };
```

---

## 🔌 Service Development

### Service Class Pattern

```typescript
/**
 * Base service class with common functionality.
 */
abstract class BaseService {
  protected abstract serviceName: string;
  
  /**
   * Validates that the service is ready for use.
   */
  abstract isReady(): Promise<boolean>;
  
  /**
   * Creates a standardized service response.
   */
  protected createResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    statusCode?: number
  ): ServiceResponse<T> {
    return { success, data, error, statusCode };
  }
  
  /**
   * Handles service errors consistently.
   */
  protected handleError(error: unknown): ServiceResponse<never> {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return this.createResponse(false, undefined, message, 500);
  }
}

/**
 * GitHub service implementation.
 */
export class GitHubService extends BaseService {
  protected serviceName = 'GitHub';
  
  async isReady(): Promise<boolean> {
    // Implementation
  }
}
```

### CLI Integration Pattern

```typescript
/**
 * Service that integrates with CLI tools.
 */
export class CLIService extends BaseService {
  protected command: string;
  
  constructor(command: string) {
    super();
    this.command = command;
  }
  
  async isReady(): Promise<boolean> {
    return isCommandAvailable(this.command);
  }
  
  protected async executeCommand(args: string[]): Promise<CLIExecuteResult> {
    const fullCommand = `${this.command} ${args.join(' ')}`;
    return executeCommand(fullCommand);
  }
}
```

---

## 🖥️ CLI Development

### CLI Command Structure

```typescript
#!/usr/bin/env bun

/**
 * CLI command for GitHub issues management.
 */
import { GitHubService } from "../services/github";
import { parseArgs, showHelp } from "../utils/cli";

interface CLIOptions {
  owner?: string;
  repo?: string;
  state?: 'open' | 'closed' | 'all';
  format?: 'text' | 'json' | 'table';
  verbose?: boolean;
}

function parseArgs(): CLIOptions {
  // Argument parsing logic
}

function showHelp(): void {
  // Help display logic
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    
    if (options.verbose) {
      console.log('Starting GitHub Issues CLI...');
    }
    
    const github = new GitHubService(options.owner!, options.repo!);
    const isReady = await github.isReady();
    
    if (!isReady) {
      console.error('❌ GitHub CLI is not ready');
      process.exit(1);
    }
    
    const response = await github.getIssues({ state: options.state });
    
    if (response.success && response.data) {
      const formatted = github.formatIssues(response.data, options.format);
      console.log(formatted);
    } else {
      console.error('❌ Failed to fetch issues:', response.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
}
```

### CLI Utility Functions

```typescript
/**
 * Parses command line arguments.
 */
export function parseArgs<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  defaults: Partial<T> = {}
): T {
  const args = process.argv.slice(2);
  const options = { ...defaults };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      // Add more argument parsing logic
    }
  }
  
  return schema.parse(options);
}

/**
 * Displays help information.
 */
export function showHelp(): void {
  console.log(`
CLI Command Help

Usage: bun run <command> [options]

Options:
  -h, --help     Show this help message
  -v, --verbose  Verbose output
`);
}
```

---

## 🔒 Type Safety

### Type Definitions

**Centralized Types:**
```typescript
// src/types/index.ts
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface CLIOptions {
  verbose?: boolean;
  format?: 'text' | 'json' | 'table';
  dryRun?: boolean;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  body?: string;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Service-Specific Types:**
```typescript
// src/services/github.ts
export interface GitHubOptions extends CLIOptions {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
}
```

### Validation Schemas

```typescript
import { z } from "zod";

export const githubOptionsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  state: z.enum(['open', 'closed', 'all']).optional(),
  labels: z.array(z.string()).optional(),
  assignee: z.string().optional(),
});

export const issueCreateSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignee: z.string().optional(),
});
```

---

## 🛡️ Error Handling

### Error Patterns

**Service Response Pattern:**
```typescript
const response = await service.method();
if (response.success && response.data) {
  // Handle success
  processData(response.data);
} else {
  // Handle error
  handleError(response.error);
}
```

**Try-Catch with Specific Error Types:**
```typescript
try {
  const config = getEnv();
  console.log('Configuration loaded successfully');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation error:', error.errors);
  } else if (error instanceof Error) {
    console.error('Configuration error:', error.message);
  } else {
    console.error('Unknown configuration error');
  }
}
```

**Graceful Degradation:**
```typescript
const result = executeCommand('command', { throwOnError: false });
if (result.success) {
  console.log('Command executed successfully');
} else {
  console.log('Command failed, but handled gracefully');
}
```

### Custom Error Classes

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class CLIError extends Error {
  constructor(
    message: string,
    public command: string,
    public exitCode?: number
  ) {
    super(message);
    this.name = 'CLIError';
  }
}
```

---

## 🔄 Contributing Workflow

### Development Process

1. **Plan your changes**
   - Create an issue describing the problem/feature
   - Discuss the approach with maintainers
   - Get approval before starting implementation

2. **Implement your changes**
   - Follow coding standards (see above)
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run all tests
   bun test
   
   # Run tests with coverage
   bun test --coverage
   
   # Run linting
   bun run lint
   
   # Run type checking
   bun run type-check
   ```

4. **Commit your changes**
   ```bash
   # Stage your changes
   git add .
   
   # Commit with conventional message
   git commit -m "feat(github): add issue creation functionality"
   
   # Push to your fork
   git push origin feature/your-feature-name
   ```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(github): add issue creation functionality
fix(cli): handle missing GitHub CLI gracefully
docs(api): update API reference with new endpoints
test(github): add integration tests for issue management
refactor(services): extract common service patterns
```

---

## 📚 Additional Resources

- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Environment Guide](ENVIRONMENT_GUIDE.md) - Configuration management
- [Contributing Guide](CONTRIBUTING_GUIDE.md) - How to contribute
- [Bun Documentation](https://bun.sh/docs) - Bun runtime documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide 