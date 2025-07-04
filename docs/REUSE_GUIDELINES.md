# 🔄 Utility Reuse Guidelines

## 📋 Overview

This document provides comprehensive guidelines for reusing utilities across the automation ecosystem. It helps developers make informed decisions about when to reuse existing utilities versus creating new ones.

## 🎯 Reuse Principles

### 1. Reuse First, Create Second
Always check for existing utilities before creating new ones. The goal is to maximize reuse and minimize duplication.

### 2. Consistency Over Customization
Prefer consistent, well-tested utilities over custom implementations, even if they require slight adaptation.

### 3. Composition Over Inheritance
Build new functionality by composing existing utilities rather than duplicating their logic.

### 4. Documentation-Driven Reuse
Use documentation to discover and understand available utilities before implementing new ones.

## 🔍 Utility Discovery

### 1. Documentation Search
Before creating a new utility, search the documentation:
- `docs/API_REFERENCE.md` - Complete utility reference
- `docs/UTILITY_PATTERNS.md` - Pattern documentation
- `docs/CLI_COMMAND_INSIGHTS.md` - CLI utility insights

### 2. Codebase Search
Search the codebase for existing utilities:
```bash
# Search for utility functions
grep -r "export.*function" src/utils/

# Search for utility classes
grep -r "export.*class" src/utils/

# Search for specific functionality
grep -r "create.*issue" src/utils/
grep -r "validate.*params" src/utils/
```

### 3. Pattern Recognition
Look for common patterns that might have existing utilities:
- Fossil-backed creation
- CLI command execution
- Parameter validation
- Error handling
- Content processing

## 📚 Utility Categories

### 1. Fossil Management Utilities
**Location**: `src/utils/fossilManager.ts`

**Available Utilities**:
- `FossilManager.createIssue()` - Create fossil-backed issues
- `FossilManager.createLabel()` - Create fossil-backed labels
- `FossilManager.createMilestone()` - Create fossil-backed milestones
- `FossilManager.findExistingFossil()` - Search for existing fossils
- `FossilManager.updateFossil()` - Update existing fossils
- `FossilManager.deleteFossil()` - Delete fossils safely

**When to Reuse**:
- Creating any GitHub object (issue, label, milestone)
- Need for deduplication and traceability
- Want consistent fossil management

**Example Reuse**:
```typescript
// Instead of creating custom issue creation logic
import { FossilManager } from '../src/utils/fossilManager';

const manager = await createFossilManager(owner, repo);
const result = await manager.createIssue({
  title: 'My Issue',
  body: 'Issue description',
  type: 'action',
  tags: ['automation']
});
```

### 2. CLI Execution Utilities
**Location**: `src/utils/cli.ts`, `src/utils/githubCliCommands.ts`

**Available Utilities**:
- `executeCommand()` - Execute shell commands
- `executeCommandJSON()` - Execute commands and parse JSON output
- `executeCommandWithRetry()` - Execute commands with retry logic
- `GitHubCLICommands` - GitHub-specific CLI operations

**When to Reuse**:
- Executing any shell command
- GitHub CLI operations
- Need for consistent error handling
- Want type-safe command execution

**Example Reuse**:
```typescript
// Instead of direct execSync calls
import { executeCommand, executeCommandJSON } from '../src/utils/cli';

const result = executeCommand('gh issue list --json number,title');
const issues = executeCommandJSON<GitHubIssue[]>('gh issue list --json number,title,state');
```

### 3. Validation Utilities
**Location**: `src/types/schemas.ts`

**Available Utilities**:
- Zod schemas for all parameter types
- Type-safe validation patterns
- Consistent error messages

**When to Reuse**:
- Validating any input parameters
- CLI argument validation
- API response validation
- Data transformation validation

**Example Reuse**:
```typescript
// Instead of manual validation
import { IssueParamsSchema } from '../src/types/schemas';

const validatedParams = IssueParamsSchema.parse(params);
```

### 4. Content Processing Utilities
**Location**: `src/utils/` (various files)

**Available Utilities**:
- `gitDiffAnalyzer.ts` - Git diff analysis
- `timestampFilter.ts` - Timestamp operations
- `roadmapToMarkdown.ts` - Roadmap conversion
- `yamlToJson.ts` - YAML/JSON conversion

**When to Reuse**:
- Processing git diffs
- Working with timestamps
- Converting between formats
- Content analysis

## 🔧 Reuse Decision Matrix

### When to Reuse Existing Utilities

| Scenario | Decision | Reasoning |
|----------|----------|-----------|
| Creating GitHub objects | ✅ **Reuse** `FossilManager` | Ensures deduplication and traceability |
| Executing CLI commands | ✅ **Reuse** `executeCommand` | Provides error handling and retry logic |
| Validating parameters | ✅ **Reuse** Zod schemas | Ensures type safety and consistency |
| Processing content | ✅ **Reuse** existing processors | Avoids duplication of logic |
| Error handling | ✅ **Reuse** error patterns | Maintains consistency |

### When to Create New Utilities

| Scenario | Decision | Reasoning |
|----------|----------|-----------|
| Completely new functionality | ✅ **Create** new utility | No existing utility covers the need |
| Significant customization needed | ⚠️ **Consider** extension | May need to extend existing utility |
| Performance optimization | ⚠️ **Consider** optimization | May need specialized implementation |
| Experimental features | ✅ **Create** prototype | Test new patterns before integration |

## 🔄 Reuse Patterns

### 1. Direct Reuse Pattern
Use existing utilities directly without modification.

```typescript
// Direct reuse of fossil manager
import { createFossilIssue } from '../src/utils/fossilManager';

const result = await createFossilIssue({
  title: 'My Issue',
  body: 'Issue description',
  type: 'action'
});
```

### 2. Composition Pattern
Compose multiple utilities to create new functionality.

```typescript
// Compose CLI execution with validation
import { executeCommandJSON } from '../src/utils/cli';
import { IssueParamsSchema } from '../src/types/schemas';

async function createValidatedIssue(params: unknown) {
  // Validate parameters
  const validated = IssueParamsSchema.parse(params);
  
  // Execute command
  const result = await executeCommandJSON<GitHubIssue>(
    `gh issue create --json number,title --title "${validated.title}"`
  );
  
  return result;
}
```

### 3. Extension Pattern
Extend existing utilities with additional functionality.

```typescript
// Extend fossil manager with custom logic
import { FossilManager } from '../src/utils/fossilManager';

class CustomFossilManager extends FossilManager {
  async createIssueWithCustomLogic(params: any) {
    // Custom pre-processing
    const processedParams = this.preprocessParams(params);
    
    // Use parent method
    const result = await super.createIssue(processedParams);
    
    // Custom post-processing
    return this.postprocessResult(result);
  }
}
```

### 4. Wrapper Pattern
Wrap existing utilities with additional functionality.

```typescript
// Wrap fossil manager with logging
import { FossilManager } from '../src/utils/fossilManager';

class LoggingFossilManager {
  constructor(private manager: FossilManager) {}
  
  async createIssue(params: any) {
    console.log('Creating issue:', params.title);
    const result = await this.manager.createIssue(params);
    console.log('Issue created:', result);
    return result;
  }
}
```

## 🚫 Anti-Patterns to Avoid

### 1. Utility Duplication
❌ **Avoid**:
```typescript
// Duplicating fossil creation logic
function createIssue1(params) {
  // Custom implementation
}

function createIssue2(params) {
  // Similar implementation
}
```

✅ **Use Instead**:
```typescript
// Reuse existing utility
import { createFossilIssue } from '../src/utils/fossilManager';

const result1 = await createFossilIssue(params1);
const result2 = await createFossilIssue(params2);
```

### 2. Direct CLI Calls
❌ **Avoid**:
```typescript
// Direct execSync calls
execSync(`gh issue create --title "${title}" --body "${body}"`);
```

✅ **Use Instead**:
```typescript
// Use CLI utilities
import { executeCommand } from '../src/utils/cli';

const result = executeCommand(`gh issue create --title "${title}" --body "${body}"`);
```

### 3. Manual Validation
❌ **Avoid**:
```typescript
// Manual parameter validation
if (!title || title.length > 256) {
  throw new Error('Invalid title');
}
```

✅ **Use Instead**:
```typescript
// Use Zod validation
import { IssueParamsSchema } from '../src/types/schemas';

const validated = IssueParamsSchema.parse(params);
```

### 4. Inconsistent Error Handling
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
// Use consistent error handling
const result = await utilityFunction(params);
if (result.success) {
  console.log('✅ Success:', result.data);
} else {
  console.error('❌ Failed:', result.error);
}
```

## 📋 Reuse Checklist

### Before Creating a New Utility
- [ ] **Search Documentation**: Check `docs/API_REFERENCE.md` for existing utilities
- [ ] **Search Codebase**: Look for similar functionality in `src/utils/`
- [ ] **Check Patterns**: Review `docs/UTILITY_PATTERNS.md` for applicable patterns
- [ ] **Consider Composition**: Can existing utilities be composed?
- [ ] **Evaluate Customization**: Is significant customization really needed?

### When Reusing Utilities
- [ ] **Understand Interface**: Read the utility's documentation and types
- [ ] **Check Dependencies**: Ensure all dependencies are available
- [ ] **Test Integration**: Verify the utility works in your context
- [ ] **Handle Errors**: Use the utility's error handling patterns
- [ ] **Document Usage**: Document how you're using the utility

### After Reusing Utilities
- [ ] **Verify Functionality**: Test that the reused utility meets your needs
- [ ] **Check Performance**: Ensure performance is acceptable
- [ ] **Update Documentation**: Update any relevant documentation
- [ ] **Share Knowledge**: Share successful reuse patterns with the team

## 📈 Reuse Metrics

### Adoption Metrics
- **Utility Reuse Rate**: Percentage of utilities that are reused
- **Duplication Reduction**: Reduction in duplicate functionality
- **Pattern Adoption**: Percentage of utilities following documented patterns

### Quality Metrics
- **Bug Reduction**: Reduction in bugs due to reused, tested utilities
- **Development Speed**: Improvement in development speed
- **Maintenance Effort**: Reduction in maintenance effort

### Efficiency Metrics
- **Code Reduction**: Reduction in total code size
- **Complexity Reduction**: Reduction in code complexity
- **Consistency Improvement**: Improvement in code consistency

## 🔧 Reuse Tools

### 1. Utility Discovery Script
```bash
#!/bin/bash
# Find utilities by functionality
echo "Searching for utilities..."
grep -r "export.*function\|export.*class" src/utils/ | grep -i "$1"
```

### 2. Reuse Analysis Script
```bash
#!/bin/bash
# Analyze utility reuse patterns
echo "Analyzing utility reuse..."
find src/utils/ -name "*.ts" -exec grep -l "import.*utils" {} \;
```

### 3. Duplication Detection
```bash
#!/bin/bash
# Detect duplicate functionality
echo "Detecting duplicates..."
jscpd src/utils/ --reporters console
```

## 📚 Additional Resources

### Documentation
- `docs/API_REFERENCE.md` - Complete utility reference
- `docs/UTILITY_PATTERNS.md` - Pattern documentation
- `docs/CLI_COMMAND_INSIGHTS.md` - CLI utility insights

### Examples
- `examples/` - Usage examples for utilities
- `tests/` - Test examples showing utility usage
- `scripts/` - Script examples using utilities

### Tools
- TypeScript compiler for type checking
- ESLint for code quality
- Jest for testing utilities

This reuse guide helps developers make informed decisions about utility reuse, promoting consistency and reducing duplication across the automation ecosystem. 