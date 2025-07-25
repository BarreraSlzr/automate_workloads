# CLI Command Insights & Best Practices

## Overview
This document captures insights from developing and testing CLI commands for GitHub automation, fossil management, and issue creation. It addresses concerns about untested usage, inconsistent patterns, and code duplication.

## Key Issues Identified

### 1. Untested CLI Command Usage

#### Problem: Direct GitHub CLI Commands Without Validation
- **Issue**: Commands like `gh issue create` are called directly without proper validation
- **Risk**: Bad body format, missing checklists, inconsistent issue structure
- **Example**: 
  ```bash
  # BAD: Direct command without validation
  gh issue create --title "Test" --body "Some body"
  
  # GOOD: Use fossil-backed creation with validation
  createFossilIssue({ title: "Test", body: "Validated body", checklist: "- [ ] Task" })
  ```

#### Solution: Fossil-Backed Issue Creation
- **Pattern**: Always use `createFossilIssue()` from `src/utils/fossilIssue.ts`
- **Benefits**: 
  - Automatic deduplication
  - Consistent body format
  - Checklist validation
  - Fossil traceability
  - Error handling

### 2. Inconsistent Code Patterns

#### Problem: Duplicated Command Building Logic
- **Issue**: Multiple places build GitHub CLI commands differently
- **Risk**: Inconsistent quoting, argument handling, error responses
- **Examples**:
  ```typescript
  // BAD: Inconsistent command building
  const cmd1 = `gh issue create --title "${title}" --body "${body}"`;
  const cmd2 = `gh label create "${label}" --repo ${owner}/${repo}`;
  
  // GOOD: Centralized command building
  const cmd = GitHubCLICommands.createIssue({ title, body, repo: `${owner}/${repo}` });
  ```

#### Solution: Centralized CLI Command Utilities
- **Pattern**: Use `GitHubCLICommands` utility class
- **Benefits**:
  - Type-safe command construction
  - Consistent argument quoting
  - Proper error handling
  - Reusable across codebase

### 3. Missing Validation and Error Handling

#### Problem: Commands Fail Silently or with Unclear Errors
- **Issue**: No validation of command arguments, unclear error messages
- **Risk**: Broken automation, hard to debug issues
- **Example**:
  ```typescript
  // BAD: No validation, unclear errors
  execSync(`gh issue create --title "${title}"`);
  
  // GOOD: Validated with clear error handling
  const result = await createFossilIssue({
    title: validateTitle(title),
    body: validateBody(body),
    // ... other validated params
  });
  ```

#### Solution: Comprehensive Validation
- **Pattern**: Use Zod schemas for CLI argument validation
- **Benefits**:
  - Runtime type safety
  - Clear error messages
  - Consistent validation rules

## Best Practices Established

### 1. Fossil-First Approach
```typescript
// ALWAYS use fossil-backed creation
const result = await createFossilIssue({
  owner,
  repo,
  title,
  body,
  labels,
  milestone,
  section,
  type: 'action',
  tags: ['automation'],
  metadata: { source: 'cli' },
  purpose: 'Clear purpose statement',
  checklist: '- [ ] Task 1\n- [ ] Task 2',
  automationMetadata: JSON.stringify(metadata, null, 2)
});
```

### 2. Centralized Command Building
```typescript
// Use GitHubCLICommands for all GitHub operations
import { GitHubCLICommands } from '../src/utils/githubCliCommands';

const commands = new GitHubCLICommands(owner, repo);

// Type-safe issue creation
const result = await commands.createIssue({
  title: 'Validated Title',
  body: 'Validated Body',
  labels: ['automation'],
  milestone: 'v1.0'
});

// Type-safe label creation
const labelResult = await commands.createLabel({
  name: 'high-priority',
  description: 'High priority issues',
  color: 'ff0000'
});

// Type-safe milestone creation
const milestoneResult = await commands.createMilestone({
  title: 'Sprint 1',
  description: 'First sprint',
  dueOn: '2024-08-01'
});

// Comprehensive error handling
if (result.success) {
  console.log('✅ Operation successful');
  console.log('Output:', result.output);
} else {
  console.error('❌ Operation failed');
  console.error('Error:', result.message);
  console.error('Exit code:', result.exitCode);
}
```

### 3. Comprehensive Error Handling
```typescript
// Always handle errors with context
try {
  const result = await createFossilIssue(params);
  if (result.deduplicated) {
    console.log(`⚠️ Issue already exists (Fossil ID: ${result.fossilId})`);
  } else {
    console.log(`✅ Created issue #${result.issueNumber} (Fossil ID: ${result.fossilId})`);
  }
} catch (error) {
  console.error(`❌ Failed to create issue: ${error.message}`);
  // Log detailed error for debugging
  console.debug('Error details:', error);
}
```

### 4. Validation-First Development
```typescript
// Validate all inputs before CLI operations
const schema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string()).default([]),
  milestone: z.string().optional()
});

const validatedParams = schema.parse(params);
```

## Fossilization Sync, Deduplication, and Reporting Patterns

- **Deduplication**: All CLI tools should check for existing issues, milestones, and labels before creating new ones, using fossil-backed utilities (e.g., `createFossilIssue`, `createFossilMilestone`, `createFossilLabel`).
- **Fossilization Percentage**: CLI tools should calculate and report the percentage of roadmap tasks that are fossilized (i.e., have corresponding GitHub artifacts). This can be shown in CLI output or as part of a summary report.
- **Recommendations**: If fossilization is incomplete, CLI tools should recommend which tasks to sync next, which labels/milestones are missing, or which items may be duplicates.
- **Glue Pattern**: CLI tools should always use the local fossils (e.g., `fossils/roadmap.yml`, `github-fossil-collection.json`) as the source of truth, syncing with GitHub as needed and updating fossils to reflect the current state.
- **Example CLI Output**:
  ```
  Fossilization Summary:
  - 8 tasks in fossils/roadmap.yml
  - 5 issues created on GitHub
  - 3 tasks pending fossilization
  - Fossilization: 62.5%
  Recommendations:
  - Sync tasks: "Implement deduplication logic", "Add reporting script"
  - Create missing label: "deduplication"
  ```

## Code Duplication Patterns to Avoid

### 1. Direct GitHub CLI Calls
❌ **Avoid**:
```typescript
// Direct execSync calls scattered throughout codebase
execSync(`gh issue create --title "${title}" --body "${body}"`);
execSync(`gh label create "${label}" --repo ${owner}/${repo}`);
execSync(`gh milestone create "${milestone}" --repo ${owner}/${repo}`);
```

✅ **Use Instead**:
```typescript
// Centralized fossil-backed creation
await createFossilIssue({ title, body, labels, milestone });
```

### 2. Manual Command Building
❌ **Avoid**:
```typescript
// Manual string concatenation for commands
const cmd = `gh issue create --repo ${owner}/${repo} --title "${title}" --body "${body}"`;
if (labels.length > 0) cmd += ` --label "${labels.join(',')}"`;
if (milestone) cmd += ` --milestone "${milestone}"`;
```

✅ **Use Instead**:
```typescript
// Type-safe command building
const commands = new GitHubCLICommands(owner, repo);
const result = await commands.createIssue({ title, body, labels, milestone });
```

### 3. Duplicated Error Handling
❌ **Avoid**:
```typescript
// Repeated error handling patterns
try {
  execSync(cmd);
} catch (error) {
  console.error('Command failed:', error.message);
  return { success: false, error: error.message };
}
```

✅ **Use Instead**:
```typescript
// Centralized error handling with context
const result = await executeCommandWithRetry(cmd, {
  maxRetries: 3,
  context: 'issue creation',
  fallback: () => ({ success: false, error: 'Command failed after retries' })
});
```

## Testing Patterns

### 1. Mock GitHub CLI Commands
```typescript
// Mock GitHub CLI responses for testing
mock.module('child_process', () => ({
  execSync: (cmd: string) => {
    if (cmd.includes('gh issue create')) {
      return 'Issue #123 created successfully';
    }
    if (cmd.includes('gh label list')) {
      return JSON.stringify([{ name: 'automation' }]);
    }
    throw new Error('Unknown command');
  }
}));
```

### 2. Test Fossil Deduplication
```typescript
test('createFossilIssue deduplicates existing fossils', async () => {
  // Mock existing fossil
  mock.module('../../../src/cli/context-fossil.ts', () => ({
    ContextFossilService: class {
      async queryEntries() { return [{ id: 'existing-fossil' }]; }
    }
  }));
  
  const result = await createFossilIssue(params);
  expect(result.deduplicated).toBe(true);
  expect(result.fossilId).toBe('existing-fossil');
});
```

### 3. Test Command Validation
```typescript
test('createFossilIssue validates required parameters', async () => {
  await expect(createFossilIssue({} as any)).rejects.toThrow();
  await expect(createFossilIssue({ title: '' } as any)).rejects.toThrow();
  await expect(createFossilIssue({ title: 'a'.repeat(300) } as any)).rejects.toThrow();
});
```

## Migration Guide

### From Direct CLI Calls to Fossil-Backed Creation

1. **Identify direct CLI calls**:
   ```bash
   grep -r "execSync.*gh issue create" src/
   grep -r "execSync.*gh label create" src/
   ```

2. **Replace with fossil-backed creation**:
   ```typescript
   // Before
   execSync(`gh issue create --title "${title}" --body "${body}"`);
   
   // After
   await createFossilIssue({ title, body, type: 'action' });
   ```

3. **Update error handling**:
   ```typescript
   // Before
   try {
     execSync(cmd);
   } catch (error) {
     console.error('Failed:', error.message);
   }
   
   // After
   const result = await createFossilIssue(params);
   if (result.deduplicated) {
     console.log('Issue already exists');
   } else {
     console.log(`Created issue #${result.issueNumber}`);
   }
   ```

### From Manual Command Building to Centralized Utilities

1. **Create GitHubCLICommands utility**:
   ```typescript
   export class GitHubCLICommands {
     constructor(private owner: string, private repo: string) {}
     
     async createIssue(params: IssueParams): Promise<CommandResult> {
       // Type-safe command building
     }
   }
   ```

2. **Replace manual command building**:
   ```typescript
   // Before
   const cmd = `gh issue create --repo ${owner}/${repo} --title "${title}"`;
   
   // After
   const commands = new GitHubCLICommands(owner, repo);
   const result = await commands.createIssue({ title });
   ```

## Future Improvements

### 1. Command Templates
```typescript
// Define command templates for consistency
const COMMAND_TEMPLATES = {
  issue: {
    create: 'gh issue create --repo {repo} --title "{title}" --body-file "{bodyFile}"',
    view: 'gh issue view {number} --repo {repo} --json {fields}',
    list: 'gh issue list --repo {repo} --state {state} --json {fields}'
  }
} as const;
```

### 2. Validation Schemas
```typescript
// Comprehensive validation schemas
export const IssueCreationSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string().max(50)).max(100),
  milestone: z.string().optional(),
  assignees: z.array(z.string()).optional()
});
```

### 3. Retry Logic
```typescript
// Robust retry logic for transient failures
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Implement exponential backoff, circuit breaker, etc.
}
```

## Conclusion

The key insights from this analysis:

1. **Always use fossil-backed creation** for GitHub issues to ensure consistency and traceability
2. **Centralize command building** to avoid duplication and ensure type safety
3. **Validate all inputs** before CLI operations to prevent runtime errors
4. **Test CLI commands thoroughly** with proper mocking and error scenarios
5. **Document patterns and best practices** to maintain consistency across the codebase

This approach ensures robust, maintainable, and testable CLI automation while preventing the issues identified in the git diff analysis.

## 🎯 Systematic Thinking Patterns Applied

### 1. Pattern Recognition
**Learning**: Identify recurring problems and create systematic solutions.

**Applied to CLI Commands**:
- **Identified**: Inconsistent CLI command patterns across codebase
- **Applied**: Centralized utility class for all GitHub operations
- **Result**: Consistent, type-safe, and maintainable code

### 2. Systematic Improvement
**Learning**: Address root causes rather than symptoms.

**Applied to Fossil Management**:
- **Identified**: Missing fossil management for milestones and labels
- **Applied**: Extended fossil-backed creation to all GitHub objects
- **Result**: Complete fossil ecosystem with deduplication

### 3. Error Prevention
**Learning**: Build validation and safety into the system.

**Applied to CLI Validation**:
- **Identified**: Runtime errors from unvalidated CLI arguments
- **Applied**: Zod validation schemas for all inputs
- **Result**: Type-safe operations with clear error messages

### 4. Integration Patterns
**Learning**: Ensure all parts work together seamlessly.

**Applied to System Architecture**:
- **Identified**: Disconnected utilities without shared patterns
- **Applied**: Consistent interfaces and error handling
- **Result**: Seamless integration between all components

The systematic thinking patterns applied here demonstrate how to transform disconnected utilities into a cohesive, powerful automation ecosystem that can handle complex scenarios while maintaining traceability and preventing duplication. 

# 🦴 Migration Guide: CLI & Fossil Automation Patterns

## Migration Checklist

- [ ] Replace all direct `gh` CLI calls with fossil-backed utilities (`createFossilIssue`, `createFossilLabel`, `createFossilMilestone`).
- [ ] Refactor all manual command building to use `GitHubCLICommands`.
- [ ] Add Zod validation to all CLI scripts (import schemas from `@/types`).
- [ ] Use centralized error handling for all CLI/fossil operations (`ErrorHandler`).
- [ ] Ensure deduplication checks before creating any GitHub object.
- [ ] Move all type and schema definitions to `src/types/`.
- [ ] Update and add tests for new patterns (validation, deduplication, error handling).
- [ ] Update documentation and code comments to reflect new best practices.
- [ ] Remove or clearly mark deprecated code and patterns.

## Migration Steps

1. **Fossil-Backed Creation**
   - Replace all direct `gh` CLI calls (e.g., `execSync('gh issue create ...')`) with fossil-backed utilities.
   - Never call `GitHubService.createIssue` directly; it should delegate to `createFossilIssue`.
2. **Centralized CLI Command Utility**
   - Use `GitHubCLICommands` for all GitHub CLI command construction and execution.
3. **Zod Validation for CLI Arguments**
   - Validate all CLI arguments using Zod schemas from `@/types`.
4. **Consistent Error Handling**
   - Use a centralized error handler (e.g., `ErrorHandler.handleCLIError`).
5. **Deduplication and Traceability**
   - Always check for existing fossils before creating new issues, labels, or milestones.
6. **Type and Schema Centralization**
   - Define all types and Zod schemas in `src/types/`.
7. **Testing and Mocking**
   - Test all CLI commands and fossil utilities for validation, deduplication, and error handling.
8. **Documentation and Examples**
   - Update all documentation and code examples to use the new patterns.

## Deprecated Patterns (Do NOT Use)
- Direct `execSync` or manual string building for GitHub CLI commands
- Ad-hoc error handling or validation
- Duplicated command logic in multiple files
- Unvalidated CLI argument parsing

---

*See the top of this document for code examples and best practices for each new pattern.* 

> **Note:** All commit messages must use the Conventional Commits format. See [Development Guide](DEVELOPMENT_GUIDE.md#commit-message-format) and [Contributing Guide](CONTRIBUTING_GUIDE.md#conventional-commits-format) for details and examples. 