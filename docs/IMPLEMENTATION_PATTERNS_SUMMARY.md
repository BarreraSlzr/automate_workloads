# 🎯 Implementation Patterns Summary

## 📋 Quick Reference

This document provides a quick reference for the correct implementation patterns for importing from `@/types` and using the PARAMS OBJECT PATTERN.

## 🔧 Core Patterns

### 1. Import from @/types Pattern

#### ✅ Correct Imports
```typescript
// Types from main index
import type { ContextEntry, BaseFossil, GitHubIssue } from '@/types';

// Schemas from schemas registry
import { BaseCLIArgsSchema, ContextEntrySchema, z } from '@/types/schemas';

// CLI utilities
import { parseCLIArgs, GitHubCLIArgs } from '@/types/cli';

// Specific types when needed
import type { E2ERoadmap } from '@/types/workflow';
import type { LLMInsightFossil } from '@/types/llmFossil';
```

#### ❌ Incorrect Imports
```typescript
// Don't import directly from individual files
import type { ContextEntry } from '@/types/core';
import { BaseCLIArgsSchema } from '@/types/schemas';

// Don't use relative imports for types
import type { ContextEntry } from '../types/core';
```

### 2. PARAMS OBJECT PATTERN

#### ✅ Correct Implementation
```typescript
// 1. Define params interface with Params suffix
export interface CreateFossilIssueParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  type: 'action' | 'knowledge' | 'decision';
  tags?: string[];
  dryRun?: boolean;
  verbose?: boolean;
}

// 2. Define Zod schema for validation
export const CreateFossilIssueParamsSchema = BaseCLIArgsSchema.extend({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  type: z.enum(['action', 'knowledge', 'decision']),
  tags: z.array(z.string()).default([]),
});

// 3. Export type from schema
export type CreateFossilIssueParams = z.infer<typeof CreateFossilIssueParamsSchema>;

// 4. Use in implementation
export async function createFossilIssue(params: CreateFossilIssueParams) {
  // Validate params at runtime
  const validatedParams = CreateFossilIssueParamsSchema.parse(params);
  
  // Use object destructuring
  const { owner, repo, title, body, type, tags, dryRun, verbose } = validatedParams;
  
  // Implementation...
}

// 5. Call with object
const result = await createFossilIssue({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'Implement new feature',
  type: 'action',
  tags: ['feature', 'automation'],
  dryRun: false,
  verbose: true
});
```

#### ❌ Incorrect Implementation
```typescript
// Don't use positional arguments
function createIssue(owner: string, repo: string, title: string) {}

// Don't skip validation
function createIssue(params: CreateFossilIssueParams) {
  const { owner, repo, title } = params; // No validation!
}

// Don't call with positional arguments
createIssue('owner', 'repo', 'title');
```

## 🔄 Common Patterns

### CLI Command Pattern
```typescript
#!/usr/bin/env bun

import { parseCLIArgs, BaseCLIArgsSchema } from '@/types/schemas';
import type { BaseCLIArgs } from '@/types';

async function main(): Promise<void> {
  try {
    // Parse CLI arguments
    const options = parseCLIArgs(BaseCLIArgsSchema, process.argv.slice(2));
    
    if (options.verbose) {
      console.log('Options:', JSON.stringify(options, null, 2));
    }

    // Use validated options
    const { dryRun, verbose } = options;
    
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

### Service Class Pattern
```typescript
import type { ContextEntry } from '@/types';
import { ContextEntrySchema } from '@/types/schemas';

export class ContextFossilService {
  async createEntry(params: CreateContextEntryParams): Promise<ServiceResponse<ContextEntry>> {
    try {
      // Validate params
      const validatedParams = CreateContextEntryParamsSchema.parse(params);
      
      // Implementation...
      
      return {
        success: true,
        data: entry,
        message: 'Entry created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
```

### Utility Function Pattern
```typescript
import type { ContextEntry } from '@/types';
import { ContextEntrySchema } from '@/types/schemas';

export function toFossilEntry(params: {
  type: ContextEntry['type'];
  title: string;
  content: string;
  tags?: string[];
  source?: ContextEntry['source'];
  metadata?: Record<string, unknown>;
}): ContextEntry {
  // Validate params
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
  };
  
  PartialContextEntrySchema.parse(safeParams);
  
  // Implementation...
  return entry;
}
```

## 📋 Checklist

When implementing new functionality:

- [ ] Import types from `@/types` (main index)
- [ ] Import schemas from `@/types/schemas`
- [ ] Import CLI utilities from `@/types/cli`
- [ ] Define params interface with `Params` suffix
- [ ] Create Zod schema for validation
- [ ] Export type from schema using `z.infer`
- [ ] Validate params at function start
- [ ] Use object destructuring for clean code
- [ ] Call functions with objects, not positional args
- [ ] Add proper error handling
- [ ] Include verbose logging options

## 🚫 Anti-Patterns to Avoid

1. **Positional Arguments**: Always use objects for function parameters
2. **Missing Validation**: Always validate params with Zod schemas
3. **Incorrect Imports**: Use `@/types` imports, not relative paths
4. **Inconsistent Naming**: Use `Params` suffix for all parameter interfaces
5. **Direct CLI Calls**: Use fossil-backed utilities instead of direct exec calls

## 📚 References

- [Implementation Patterns Guide](./IMPLEMENTATION_PATTERNS_GUIDE.md) - Comprehensive guide
- [Type and Schema Patterns](./TYPE_AND_SCHEMA_PATTERNS.md) - Type system patterns
- [Utility Patterns](./UTILITY_PATTERNS.md) - Utility function patterns
- [Contributing Guide](../CONTRIBUTING_GUIDE.md) - Development guidelines

## 🎯 Example Files

- [Implementation Patterns Demo](../examples/implementation-patterns-demo.ts) - Working examples
- [GitHub Issues CLI](../src/cli/github-issues.ts) - CLI pattern example
- [Fossilize Utility](../src/utils/fossilize.ts) - Utility pattern example 