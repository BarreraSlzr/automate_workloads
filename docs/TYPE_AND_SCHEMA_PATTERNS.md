# Type and Schema Patterns

This document describes the type and schema patterns used throughout the codebase for promoting reuse, centralization, and type safety.

## 🏗️ Architecture Overview

### Core Principles
- **Centralized Types**: All types are defined in `src/types/` for reuse across the codebase
- **Base Fossil Pattern**: All fossils extend a common `BaseFossil` interface
- **Zod Validation**: CLI arguments and external data are validated using Zod schemas
- **Type Safety**: Full TypeScript support with compile-time checking

## 📁 Type Organization

### Base Types (`src/types/base-fossil.ts`)
```typescript
export interface BaseFossil {
  type: string;
  source: string;
  createdBy: string;
  createdAt: string;
  fossilId?: string;
  fossilHash?: string;
  metadata?: Record<string, any>;
}
```

**Usage**: All fossils extend this base interface to ensure consistency.

### CLI Argument Schemas (`src/types/cli-args.ts`)
```typescript
export const BaseCLIArgsSchema = z.object({
  dryRun: z.boolean().default(false),
  test: z.boolean().default(false),
  verbose: z.boolean().default(false),
  help: z.boolean().default(false),
});
```

**Usage**: Provides type-safe CLI argument parsing with validation.

### GitHub CLI Schemas (`src/types/github-cli-schemas.ts`)
```typescript
export const GitHubIssueCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional(),
  // ... other fields
});
```

**Usage**: Validates GitHub CLI command parameters and provides type safety.

## 🔄 Pattern Extensions

### 1. Creating New Fossil Types

**Step 1**: Define the fossil interface extending `BaseFossil`
```typescript
// src/types/my-fossil.ts
import { BaseFossil } from './base-fossil';

export interface MyFossil extends BaseFossil {
  type: 'my_fossil';
  title: string;
  content: string;
  category: 'example' | 'test';
}
```

**Step 2**: Add to the main types index
```typescript
// src/types/index.ts
export * from './my-fossil';
```

**Step 3**: Create YAML/JSON storage
```yaml
# src/types/my-fossil.yaml
type: my_fossil
source: llm-human-collab
createdBy: llm+human
createdAt: 2024-07-01T12:00:00Z
title: "My Fossil Title"
content: "Fossil content here"
category: example
```

### 2. Creating New CLI Argument Schemas

**Step 1**: Define the schema
```typescript
// src/types/cli-args.ts
export const MyCLIArgsSchema = BaseCLIArgsSchema.extend({
  inputPath: z.string(),
  outputPath: z.string().optional(),
  format: z.enum(['yaml', 'json', 'markdown']).default('yaml'),
});
```

**Step 2**: Export the type
```typescript
export type MyCLIArgs = z.infer<typeof MyCLIArgsSchema>;
```

**Step 3**: Use in scripts
```typescript
import { parseCLIArgs, MyCLIArgsSchema } from '../src/types/cli-args';

const args = parseCLIArgs(MyCLIArgsSchema, process.argv.slice(2));
```

### 3. Creating New GitHub CLI Schemas

**Step 1**: Define the schema
```typescript
// src/types/github-cli-schemas.ts
export const GitHubMyOperationSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  // ... operation-specific fields
});
```

**Step 2**: Add to GitHubCLICommands utility
```typescript
// src/utils/githubCliCommands.ts
static buildMyOperationCommand(params: GitHubMyOperation): string[] {
  const validated = GitHubMyOperationSchema.parse(params);
  const args = ['my-operation', '--repo', `${validated.owner}/${validated.repo}`];
  // ... build command args
  return args;
}
```

## 🛠️ Utility Functions

### CLI Argument Parsing
```typescript
import { parseCLIArgs } from '../src/types/cli-args';

// Parse and validate CLI arguments
const args = parseCLIArgs(MyCLIArgsSchema, process.argv.slice(2));
```

### GitHub CLI Commands
```typescript
import { GitHubCLICommands } from '../src/utils/githubCliCommands';

// Build and execute GitHub CLI commands
const args = GitHubCLICommands.buildIssueCreateCommand({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'My Issue',
  body: 'Issue body'
});

const result = GitHubCLICommands.executeCommand(args);
```

### Fossil Management
```typescript
import { yamlToJson } from '../src/utils/yamlToJson';
import { roadmapToMarkdown } from '../src/utils/roadmapToMarkdown';

// Load fossil from YAML
const fossil = yamlToJson<MyFossil>('src/types/my-fossil.yaml');

// Convert to Markdown
const markdown = roadmapToMarkdown(fossil);
```

## 📋 Best Practices

### 1. Type Safety
- Always use TypeScript interfaces for fossils
- Validate external data with Zod schemas
- Use type inference from schemas

### 2. Reusability
- Extend base types instead of duplicating
- Create generic utilities for common operations
- Centralize shared types in `src/types/`

### 3. Validation
- Use Zod for runtime validation
- Provide meaningful error messages
- Handle validation failures gracefully

### 4. Documentation
- Document all new types and schemas
- Include usage examples
- Update this document when adding new patterns

## 🔧 Migration Guide

### From Manual CLI Parsing
**Before**:
```typescript
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const test = args.includes('--test');
```

**After**:
```typescript
import { parseCLIArgs, BaseCLIArgsSchema } from '../src/types/cli-args';

const args = parseCLIArgs(BaseCLIArgsSchema, process.argv.slice(2));
// args.dryRun, args.test are now type-safe
```

### From Direct GitHub CLI Calls
**Before**:
```typescript
execSync(`gh issue create --repo ${owner}/${repo} --title "${title}" --body "${body}"`);
```

**After**:
```typescript
import { GitHubCLICommands } from '../src/utils/githubCliCommands';

const args = GitHubCLICommands.buildIssueCreateCommand({
  owner, repo, title, body
});
const result = GitHubCLICommands.executeCommand(args);
```

## 🚀 Future Extensions

### Planned Patterns
- **Database Schemas**: Zod schemas for database operations
- **API Schemas**: Request/response validation for external APIs
- **Configuration Schemas**: Environment and config file validation
- **Test Schemas**: Test data and fixture validation

### Integration Points
- **CI/CD**: Schema validation in build pipelines
- **Documentation**: Auto-generated API docs from schemas
- **Testing**: Type-safe test utilities
- **Monitoring**: Schema validation in production

---

This pattern system provides a foundation for building type-safe, maintainable, and extensible automation tools. Follow these patterns when adding new features to ensure consistency and quality across the codebase. 