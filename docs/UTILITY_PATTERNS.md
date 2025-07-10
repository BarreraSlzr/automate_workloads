# 2025-07 Refactor

- All utility patterns are now strictly canonical (no direct execSync, JSON.parse, or deprecated patterns)
- The validator enforces canonical usage project-wide, with a single exception for parseJsonSafe
- See [Canonical Fossil Management Guide](./CANONICAL_FOSSIL_MANAGEMENT_GUIDE.md) for details

# 🔧 Utility Patterns & Reuse Guidelines

## 📋 Overview

This document provides a comprehensive guide to utility patterns used throughout the automation ecosystem. It serves as a central reference for developers to understand, reuse, and extend utility patterns consistently.

## 🎯 Core Principles

### 1. Fossil-First Approach
All GitHub operations should use fossil-backed utilities to ensure deduplication, traceability, and consistency.

### 2. Type Safety First
All utilities should use Zod schemas for validation and TypeScript for type safety.

### 3. Consistent Error Handling
All utilities should follow standardized error handling patterns.

### 4. Reusability Over Duplication
Prefer reusing existing utilities over creating new ones with similar functionality.

## 🔧 Core Utility Patterns

### 1. Fossil Management Pattern

#### Pattern Description
The fossil management pattern ensures all GitHub objects (issues, labels, milestones) are created with fossil backing for deduplication and traceability.

#### Implementation
```typescript
// Use the unified FossilManager for all fossil operations
import { FossilManager } from '../src/utils/fossilManager';

const manager = await createFossilManager(owner, repo);

// Create fossil-backed GitHub objects
const issueResult = await manager.createIssue({
  title: 'My Issue',
  body: 'Issue description',
  type: 'action',
  tags: ['automation', 'bug'],
  metadata: { priority: 'high' }
});

const labelResult = await manager.createLabel({
  name: 'high-priority',
  description: 'High priority issues',
  color: 'ff0000',
  type: 'label',
  tags: ['priority']
});

const milestoneResult = await manager.createMilestone({
  title: 'Sprint 1',
  description: 'First sprint',
  dueOn: '2024-08-01',
  type: 'milestone',
  tags: ['sprint']
});
```

#### Benefits
- ✅ **Deduplication**: Prevents duplicate objects
- ✅ **Traceability**: Links GitHub objects to fossil system
- ✅ **Consistency**: Standardized creation process
- ✅ **Validation**: Built-in parameter validation

#### When to Use
- Creating any GitHub object (issue, label, milestone)
- Need for deduplication and traceability
- Want consistent error handling and validation

### 2. CLI Execution Pattern

#### Pattern Description
The CLI execution pattern provides type-safe, consistent command execution with proper error handling and retry logic.

#### Implementation
```typescript
// Use the centralized CLI utilities
import { executeCommand, executeCommandJSON } from '../src/utils/cli';
import { GitHubCLICommands } from '../src/utils/githubCliCommands';

// Basic command execution
const result = executeCommand('gh issue list --json number,title', {
  captureStderr: true,
  throwOnError: false
});

// JSON command execution
const issues = executeCommandJSON<GitHubIssue[]>('gh issue list --json number,title,state');

// GitHub-specific commands
const commands = new GitHubCLICommands(owner, repo);
const issueResult = await commands.createIssue({
  title: 'My Issue',
  body: 'Issue description',
  labels: ['automation']
});
```

#### Benefits
- ✅ **Type Safety**: TypeScript interfaces for all operations
- ✅ **Error Handling**: Consistent error responses
- ✅ **Retry Logic**: Built-in retry mechanisms
- ✅ **Validation**: Command output validation

#### When to Use
- Executing any shell command
- GitHub CLI operations
- Need for consistent error handling
- Want type-safe command execution

### 3. Validation Pattern

#### Pattern Description
The validation pattern uses Zod schemas to ensure type safety and data validation across all utilities.

#### Implementation
```typescript
import { z } from '../src/types/schemas';

// Define validation schemas
const IssueParamsSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string()).default([]),
  type: z.string().min(1),
  tags: z.array(z.string()).default([])
});

// Validate parameters
const validatedParams = IssueParamsSchema.parse(params);

// Use in utilities
export async function createIssue(params: unknown) {
  const validated = IssueParamsSchema.parse(params);
  // ... implementation
}
```

#### Benefits
- ✅ **Runtime Safety**: Validates data at runtime
- ✅ **Type Inference**: Automatic TypeScript type inference
- ✅ **Clear Errors**: Descriptive validation error messages
- ✅ **Consistency**: Standardized validation across utilities

#### When to Use
- Validating any input parameters
- CLI argument validation
- API response validation
- Data transformation validation

### 4. Error Handling Pattern

#### Pattern Description
The error handling pattern provides consistent error responses and handling across all utilities.

#### Implementation
```typescript
// Standard error handling pattern
export interface UtilityResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fossilId?: string;
  deduplicated?: boolean;
}

export async function utilityFunction(params: any): Promise<UtilityResult> {
  try {
    // Validate parameters
    const validated = Schema.parse(params);
    
    // Execute operation
    const result = await operation(validated);
    
    return {
      success: true,
      data: result,
      fossilId: result.fossilId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

#### Benefits
- ✅ **Consistency**: Standardized error responses
- ✅ **Debugging**: Clear error messages for debugging
- ✅ **Recovery**: Proper error recovery mechanisms
- ✅ **Logging**: Structured error logging

#### When to Use
- Any utility that can fail
- Need for consistent error responses
- Want proper error recovery
- Need structured error logging

## 🔄 Reuse Patterns

### 1. Parameter Reuse Pattern

#### Pattern Description
Reuse parameter interfaces across related utilities to ensure consistency.

#### Implementation
```typescript
// Base parameter interface
export interface BaseUtilityParams {
  dryRun?: boolean;
  verbose?: boolean;
  timeout?: number;
  retries?: number;
}

// Extend for specific utilities
export interface FossilParams extends BaseUtilityParams {
  owner: string;
  repo: string;
  type: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CLIParams extends BaseUtilityParams {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}
```

### 2. Service Response Pattern

#### Pattern Description
Use consistent service response patterns across all utilities.

#### Implementation
```typescript
// Standard service response
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

// Use in utilities
export async function utilityFunction(): Promise<ServiceResponse<ResultType>> {
  try {
    const result = await operation();
    return {
      success: true,
      data: result,
      message: 'Operation completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### 3. Configuration Pattern

#### Pattern Description
Use consistent configuration patterns for utility initialization and customization.

#### Implementation
```typescript
// Configuration interface
export interface UtilityConfig {
  dryRun?: boolean;
  verbose?: boolean;
  timeout?: number;
  retries?: number;
  env?: Record<string, string>;
}

// Configuration class
export class UtilityConfig {
  constructor(private config: UtilityConfig = {}) {}
  
  get dryRun(): boolean { return this.config.dryRun ?? false; }
  get verbose(): boolean { return this.config.verbose ?? false; }
  get timeout(): number { return this.config.timeout ?? 30000; }
  get retries(): number { return this.config.retries ?? 3; }
}
```

## 🚫 Anti-Patterns to Avoid

### 1. Direct CLI Calls
❌ **Avoid**:
```typescript
// Direct execSync calls
execSync(`gh issue create --title "${title}" --body "${body}"`);
```

✅ **Use Instead**:
```typescript
// Fossil-backed creation
await createFossilIssue({ title, body, type: 'action' });
```

### 2. Manual Parameter Validation
❌ **Avoid**:
```typescript
// Manual validation
if (!title || title.length > 256) {
  throw new Error('Invalid title');
}
```

✅ **Use Instead**:
```typescript
// Zod validation
const validated = IssueParamsSchema.parse(params);
```

### 3. Inconsistent Error Handling
❌ **Avoid**:
```typescript
// Inconsistent error handling
try {
  await operation();
} catch (error) {
  console.error('Failed:', error);
}
```

✅ **Use Instead**:
```typescript
// Consistent error handling
const result = await utilityFunction(params);
if (result.success) {
  console.log('✅ Success:', result.data);
} else {
  console.error('❌ Failed:', result.error);
}
```

### 4. Utility Duplication
❌ **Avoid**:
```typescript
// Duplicating functionality
function createIssue1(params) { /* implementation */ }
function createIssue2(params) { /* similar implementation */ }
```

✅ **Use Instead**:
```typescript
// Reuse existing utility
import { createFossilIssue } from '../src/utils/fossilManager';
```

## 📚 Pattern Registry

### Fossil Patterns
- `fossil-creation`: Create fossils with deduplication
- `fossil-search`: Search fossils by criteria
- `fossil-update`: Update existing fossils
- `fossil-deletion`: Delete fossils safely

### CLI Patterns
- `cli-execution`: Execute commands with retry
- `cli-validation`: Validate command output
- `cli-parsing`: Parse command output
- `cli-formatting`: Format command output

### Validation Patterns
- `zod-validation`: Validate with Zod schemas
- `type-validation`: Runtime type checking
- `format-validation`: Format validation
- `business-validation`: Business rule validation

### Error Patterns
- `error-handling`: Standard error handling
- `error-recovery`: Error recovery mechanisms
- `error-logging`: Structured error logging
- `error-reporting`: Error reporting to users

## 🔧 Pattern Usage Guidelines

### When Creating New Utilities
1. **Check Existing Patterns**: Look for existing patterns that can be reused
2. **Follow Established Patterns**: Use the patterns documented here
3. **Validate Parameters**: Always use Zod validation
4. **Handle Errors**: Use consistent error handling
5. **Document Usage**: Document how the utility follows patterns

### When Extending Utilities
1. **Maintain Compatibility**: Don't break existing interfaces
2. **Extend Patterns**: Add new functionality while following patterns
3. **Update Documentation**: Keep pattern documentation current
4. **Test Thoroughly**: Ensure pattern compliance

### When Refactoring Utilities
1. **Identify Patterns**: Recognize existing patterns
2. **Consolidate Similar**: Merge utilities with similar patterns
3. **Standardize Interfaces**: Use consistent parameter patterns
4. **Update References**: Update all references to use new patterns

## 📈 Pattern Metrics

### Usage Metrics
- **Pattern Adoption**: Percentage of utilities using documented patterns
- **Pattern Compliance**: Percentage of utilities following all patterns
- **Pattern Effectiveness**: Reduction in bugs and issues
- **Pattern Efficiency**: Improvement in development speed

### Quality Metrics
- **Code Duplication**: Reduction in duplicate code
- **Type Safety**: Percentage of utilities with full type coverage
- **Error Handling**: Consistency in error handling patterns
- **Documentation**: Completeness of pattern documentation

This pattern guide serves as the foundation for consistent, reusable, and maintainable utility development across the automation ecosystem. 