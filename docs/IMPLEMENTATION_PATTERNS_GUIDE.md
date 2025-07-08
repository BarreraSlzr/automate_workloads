# 🎯 Implementation Patterns Guide

## 📋 Overview

This guide demonstrates the correct patterns for importing from `@/types` and implementing the PARAMS OBJECT PATTERN throughout the codebase. These patterns ensure type safety, consistency, and maintainability.

## 🔧 Core Patterns

### 1. Import from @/types Pattern

#### ✅ Correct Import Patterns

**For Type Imports:**
```typescript
// Import types from the main types index
import type { ContextEntry, ContextQuery, BaseFossil } from '@/types';

// Import specific types from their modules
import type { GitHubIssue, GitHubIssueFossil } from '@/types/github';
import type { PerformanceMetrics, PerformanceLogEntry } from '@/types/performance';
import type { E2ERoadmap, E2ERoadmapTask } from '@/types/workflow';
```

**For Schema Imports:**
```typescript
// Import Zod schemas from the schemas registry
import { 
  BaseCLIArgsSchema, 
  GitHubIssueCreateSchema, 
  ContextEntrySchema 
} from '@/types/schemas';

// Import CLI utilities
import { parseCLIArgs, GitHubCLIArgs } from '@/types/cli';
```

**For Utility Functions:**
```typescript
// Import utility functions from types
import { parseCLIArgs } from '@/types/cli';
```

#### ❌ Incorrect Import Patterns

```typescript
// Don't import directly from individual type files
import type { ContextEntry } from '@/types/core';
import { BaseCLIArgsSchema } from '@/types/schemas';

// Don't use relative imports for types
import type { ContextEntry } from '../types/core';
import { BaseCLIArgsSchema } from '../types/schemas';
```

### 2. PARAMS OBJECT PATTERN

#### ✅ Correct Implementation

**Step 1: Define Params Interface**
```typescript
// In src/types/cli.ts or appropriate types file
export interface CreateFossilIssueParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  type: 'knowledge' | 'decision' | 'action' | 'observation' | 'plan' | 'result' | 'insight';
  tags?: string[];
  metadata?: Record<string, unknown>;
  dryRun?: boolean;
  verbose?: boolean;
}
```

**Step 2: Define Zod Schema**
```typescript
// In src/types/schemas.ts
export const CreateFossilIssueParamsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string()).default([]),
  type: z.enum(['knowledge', 'decision', 'action', 'observation', 'plan', 'result', 'insight']),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});
```

**Step 3: Export Type from Schema**
```typescript
// In src/types/cli.ts
export type CreateFossilIssueParams = z.infer<typeof CreateFossilIssueParamsSchema>;
```

**Step 4: Use in Implementation**
```typescript
// In your utility or CLI file
import type { CreateFossilIssueParams } from '@/types';
import { CreateFossilIssueParamsSchema } from '@/types/schemas';

export async function createFossilIssue(params: CreateFossilIssueParams) {
  // Validate params at runtime
  const validatedParams = CreateFossilIssueParamsSchema.parse(params);
  
  // Use validated params
  const { owner, repo, title, body, labels, type, tags, metadata, dryRun, verbose } = validatedParams;
  
  // Implementation...
}
```

**Step 5: Call with Object**
```typescript
// Always call with an object, not positional arguments
const result = await createFossilIssue({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'Implement new feature',
  body: 'This is the issue description',
  type: 'action',
  tags: ['feature', 'automation'],
  dryRun: false,
  verbose: true
});
```

#### ❌ Incorrect Implementation

```typescript
// Don't use positional arguments
export async function createFossilIssue(
  owner: string, 
  repo: string, 
  title: string, 
  body?: string
) {
  // Implementation...
}

// Don't skip validation
export async function createFossilIssue(params: CreateFossilIssueParams) {
  // Missing validation
  const { owner, repo, title } = params;
  // Implementation...
}

// Don't call with positional arguments
const result = await createFossilIssue('barreraslzr', 'automate_workloads', 'Title');
```

## 🔄 Implementation Examples

### 1. CLI Command Pattern

```typescript
#!/usr/bin/env bun

import { parseCLIArgs, GitHubIssuesCLIArgsSchema } from '@/types/cli';
import type { GitHubIssuesCLIArgs } from '@/types';

function showHelp(): void {
  console.log(`
GitHub Issues CLI

Usage: bun run src/cli/github-issues.ts [options]

Options:
  -o, --owner <owner>    Repository owner (default: BarreraSlzr)
  -r, --repo <repo>      Repository name (default: automate_workloads)
  -s, --state <state>    Issue state: open, closed, all (default: open)
  -f, --format <format>  Output format: text, json, table (default: text)
  -v, --verbose          Verbose output
  -h, --help             Show this help message
`);
}

async function main(): Promise<void> {
  try {
    // Check for help argument before parsing
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      showHelp();
      return;
    }
    
    // Parse command line arguments using PARAMS OBJECT PATTERN
    const options = parseCLIArgs(GitHubIssuesCLIArgsSchema, process.argv.slice(2));
    
    if (options.verbose) {
      console.log('Options:', JSON.stringify(options, null, 2));
    }

    // Use the validated options
    const { owner, repo, state, format, verbose } = options;
    
    // Implementation...
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
```

### 2. Utility Function Pattern

```typescript
import type { ContextEntry } from '@/types';
import { ContextEntrySchema } from '@/types/schemas';
import { createHash } from 'crypto';

// PARAMS OBJECT PATTERN for utility functions
export function generateContentHash(params: { 
  content: string; 
  type: string; 
  title: string 
}): string {
  const { content, type, title } = params;
  return createHash('sha256')
    .update(`${content}${type}${title}`)
    .digest('hex')
    .substring(0, 12);
}

export function toFossilEntry(params: {
  type: ContextEntry['type'];
  title: string;
  content: string;
  tags?: string[];
  source?: ContextEntry['source'];
  metadata?: Record<string, unknown>;
  parentId?: string;
  children?: string[];
  version?: number;
}): ContextEntry {
  // Validate params using Zod schema
  const PartialContextEntrySchema = ContextEntrySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
  
  const safeParams = {
    ...params,
    tags: params.tags ?? [],
    source: params.source ?? 'manual',
    metadata: params.metadata ?? {},
    children: params.children ?? [],
    version: params.version ?? 1,
  };
  
  PartialContextEntrySchema.parse(safeParams);
  
  const now = new Date().toISOString();
  const contentHash = generateContentHash({ 
    content: safeParams.content, 
    type: safeParams.type, 
    title: safeParams.title 
  });
  
  return {
    id: generateId({ content: safeParams.content, type: safeParams.type, title: safeParams.title }),
    type: safeParams.type,
    title: safeParams.title,
    content: safeParams.content,
    tags: safeParams.tags,
    metadata: {
      ...safeParams.metadata,
      contentHash,
    },
    source: safeParams.source,
    version: safeParams.version,
    parentId: safeParams.parentId,
    children: safeParams.children,
    createdAt: now,
    updatedAt: now,
  };
}
```

### 3. Service Class Pattern

```typescript
import type { GitHubIssue, GitHubIssueFossil } from '@/types';
import { GitHubIssueCreateSchema } from '@/types/schemas';
import type { GitHubIssueCreate } from '@/types';

export class GitHubService {
  constructor(private owner: string, private repo: string) {}

  async createIssue(params: GitHubIssueCreate): Promise<ServiceResponse<GitHubIssue>> {
    try {
      // Validate params
      const validatedParams = GitHubIssueCreateSchema.parse(params);
      
      const { title, body, labels, assignees, milestone } = validatedParams;
      
      // Implementation...
      
      return {
        success: true,
        data: issue,
        message: 'Issue created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getIssues(params: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    assignee?: string;
    milestone?: string;
  }): Promise<ServiceResponse<GitHubIssue[]>> {
    // Implementation...
  }
}
```

### 4. Fossil Management Pattern

```typescript
import type { 
  BaseFossilParams, 
  IssueFossilParams, 
  LabelFossilParams, 
  MilestoneFossilParams 
} from '@/types';
import { 
  BaseFossilParamsSchema,
  IssueFossilParamsSchema,
  LabelFossilParamsSchema,
  MilestoneFossilParamsSchema
} from '@/types/schemas';

export class FossilManager {
  constructor(private owner: string, private repo: string) {}

  async createIssue(params: IssueFossilParams): Promise<FossilResult> {
    // Validate params
    const validatedParams = IssueFossilParamsSchema.parse(params);
    
    // Check for existing fossil
    const existing = await this.checkExistingFossil({
      fossilService: this,
      contentHash: this.generateContentHash(validatedParams),
      title: validatedParams.title,
      content: validatedParams.body || '',
      type: 'action'
    });

    if (existing.success && existing.deduplicated) {
      return {
        success: true,
        fossilId: existing.fossilId,
        deduplicated: true
      };
    }

    // Create new fossil
    const fossilEntry = await this.createFossilEntry({
      fossilService: this,
      type: 'action',
      title: validatedParams.title,
      body: validatedParams.body || '',
      section: validatedParams.section || '',
      tags: validatedParams.tags || [],
      metadata: validatedParams.metadata || {},
      issueNumber: undefined,
      parsedFields: {}
    });

    return {
      success: true,
      fossilId: fossilEntry.fossilId
    };
  }

  async createLabel(params: LabelFossilParams): Promise<FossilResult> {
    const validatedParams = LabelFossilParamsSchema.parse(params);
    // Implementation...
  }

  async createMilestone(params: MilestoneFossilParams): Promise<FossilResult> {
    const validatedParams = MilestoneFossilParamsSchema.parse(params);
    // Implementation...
  }
}
```

## 📋 Best Practices

### 1. Type Safety
- Always use TypeScript interfaces for params
- Validate all params with Zod schemas at runtime
- Use type inference from schemas (`z.infer<typeof Schema>`)

### 2. Import Organization
- Import types from `@/types` (main index)
- Import schemas from `@/types/schemas`
- Import CLI utilities from `@/types/cli`
- Use `import type` for type-only imports

### 3. Parameter Design
- Name all param interfaces with `Params` suffix
- Include common fields like `dryRun`, `verbose`, `timeout`
- Make optional fields explicit with `?`
- Provide sensible defaults in schemas

### 4. Validation
- Always validate params at the start of functions
- Use descriptive error messages in schemas
- Handle validation errors gracefully
- Log validation failures in verbose mode

### 5. Function Calls
- Always call functions with objects, never positional arguments
- Use object destructuring for clean code
- Provide meaningful parameter names
- Use TypeScript for compile-time checking

## 🚫 Anti-Patterns to Avoid

### 1. Positional Arguments
```typescript
// ❌ Don't do this
function createIssue(owner: string, repo: string, title: string) {}

// ✅ Do this instead
function createIssue(params: CreateIssueParams) {}
```

### 2. Missing Validation
```typescript
// ❌ Don't do this
function createIssue(params: CreateIssueParams) {
  const { owner, repo, title } = params; // No validation
}

// ✅ Do this instead
function createIssue(params: CreateIssueParams) {
  const validatedParams = CreateIssueParamsSchema.parse(params);
  const { owner, repo, title } = validatedParams;
}
```

### 3. Incorrect Imports
```typescript
// ❌ Don't do this
import type { ContextEntry } from '../types/core';
import { BaseCLIArgsSchema } from '../types/schemas';

// ✅ Do this instead
import type { ContextEntry } from '@/types';
import { BaseCLIArgsSchema } from '@/types/schemas';
```

### 4. Inconsistent Naming
```typescript
// ❌ Don't do this
interface CreateIssueOptions {}
interface IssueCreationConfig {}

// ✅ Do this instead
interface CreateIssueParams {}
interface CreateLabelParams {}
```

## 🔧 Migration Checklist

When implementing new functionality:

- [ ] Define params interface with `Params` suffix
- [ ] Create Zod schema for validation
- [ ] Export type from schema using `z.infer`
- [ ] Import types from `@/types`
- [ ] Import schemas from `@/types/schemas`
- [ ] Validate params at function start
- [ ] Use object destructuring for clean code
- [ ] Call functions with objects, not positional args
- [ ] Add proper error handling
- [ ] Include verbose logging options

## 📚 Reference

- [Type and Schema Patterns](../docs/TYPE_AND_SCHEMA_PATTERNS.md)
- [Utility Patterns](../docs/UTILITY_PATTERNS.md)
- [Contributing Guide](../CONTRIBUTING_GUIDE.md)
- [Type System Organization](../docs/TYPE_SYSTEM_REORGANIZATION.md) 