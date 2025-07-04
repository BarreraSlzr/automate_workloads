# 🔄 Migration Guide: Consolidated Utilities

## 📋 Overview

This guide provides step-by-step instructions for migrating from the old utility structure to the new consolidated utilities. The migration focuses on improving cohesion, reducing duplication, and promoting reuse across the automation ecosystem.

## 🎯 Migration Goals

### 1. Consolidate Fossil Management
Migrate from separate fossil utilities (`fossilIssue.ts`, `fossilLabel.ts`, `fossilMilestone.ts`) to the unified `FossilManager` class.

### 2. Standardize CLI Operations
Migrate from direct CLI calls to centralized CLI utilities with proper error handling and validation.

### 3. Implement Consistent Patterns
Adopt standardized parameter patterns, error handling, and validation across all utilities.

### 4. Reduce Duplication
Eliminate duplicate functionality and promote reuse of existing utilities.

## 📊 Migration Status

### ✅ Completed Migrations
- **FossilManager**: Unified fossil management utility implemented
- **GitHubCLICommands**: Centralized GitHub CLI operations
- **CLI Utilities**: Core CLI execution utilities

### 🔄 In Progress Migrations
- **Content Processing**: Consolidating content processing utilities
- **Validation Patterns**: Standardizing validation across utilities
- **Error Handling**: Implementing consistent error handling

### 📋 Planned Migrations
- **Utility Consolidation**: Merging overlapping utilities
- **Pattern Registry**: Creating utility pattern registry
- **Cohesion Analysis**: Implementing cohesion monitoring

## 🔧 Migration Steps

### Step 1: Fossil Management Migration

#### Before Migration
```typescript
// OLD: Separate fossil utilities
import { createFossilIssue } from '../src/utils/fossilIssue';
import { createFossilLabel } from '../src/utils/fossilLabel';
import { createFossilMilestone } from '../src/utils/fossilMilestone';

// Creating GitHub objects
const issueResult = await createFossilIssue({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'My Issue',
  body: 'Issue description',
  type: 'action',
  tags: ['automation']
});

const labelResult = await createFossilLabel({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  name: 'high-priority',
  description: 'High priority issues',
  color: 'ff0000',
  type: 'label',
  tags: ['priority']
});

const milestoneResult = await createFossilMilestone({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'Sprint 1',
  description: 'First sprint',
  dueOn: '2024-08-01',
  type: 'milestone',
  tags: ['sprint']
});
```

#### After Migration
```typescript
// NEW: Unified FossilManager
import { FossilManager } from '../src/utils/fossilManager';

// Initialize manager
const manager = await createFossilManager('barreraslzr', 'automate_workloads');

// Create GitHub objects with unified interface
const issueResult = await manager.createIssue({
  title: 'My Issue',
  body: 'Issue description',
  type: 'action',
  tags: ['automation']
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

#### Migration Checklist
- [ ] **Update Imports**: Replace individual fossil utility imports with `FossilManager`
- [ ] **Update Function Calls**: Replace individual function calls with manager methods
- [ ] **Update Parameters**: Remove `owner` and `repo` from individual calls (now in manager)
- [ ] **Update Error Handling**: Use consistent error handling patterns
- [ ] **Test Functionality**: Verify all operations work correctly
- [ ] **Update Documentation**: Update any documentation referencing old utilities

### Step 2: CLI Operations Migration

#### Before Migration
```typescript
// OLD: Direct CLI calls
import { execSync } from 'child_process';

// Direct execSync calls
try {
  const result = execSync(`gh issue create --title "${title}" --body "${body}" --repo ${owner}/${repo}`);
  console.log('Issue created:', result.toString());
} catch (error) {
  console.error('Failed to create issue:', error.message);
}

// Manual command building
const cmd = `gh label create "${label}" --repo ${owner}/${repo} --color "${color}" --description "${description}"`;
execSync(cmd);
```

#### After Migration
```typescript
// NEW: Centralized CLI utilities
import { executeCommand } from '../src/utils/cli';
import { GitHubCLICommands } from '../src/utils/githubCliCommands';

// Use centralized CLI execution
const result = executeCommand(`gh issue create --title "${title}" --body "${body}" --repo ${owner}/${repo}`, {
  captureStderr: true,
  throwOnError: false
});

if (result.success) {
  console.log('✅ Issue created successfully');
} else {
  console.error('❌ Failed to create issue:', result.stderr);
}

// Use GitHub-specific CLI commands
const commands = new GitHubCLICommands(owner, repo);
const labelResult = await commands.createLabel({
  name: label,
  description: description,
  color: color
});

if (labelResult.success) {
  console.log('✅ Label created successfully');
} else {
  console.error('❌ Failed to create label:', labelResult.message);
}
```

#### Migration Checklist
- [ ] **Replace execSync**: Replace all `execSync` calls with `executeCommand`
- [ ] **Use GitHubCLICommands**: Use `GitHubCLICommands` for GitHub operations
- [ ] **Update Error Handling**: Implement consistent error handling
- [ ] **Add Validation**: Add parameter validation where missing
- [ ] **Test Commands**: Verify all CLI commands work correctly
- [ ] **Update Scripts**: Update any scripts using direct CLI calls

### Step 3: Validation Pattern Migration

#### Before Migration
```typescript
// OLD: Manual validation
function createIssue(params: any) {
  // Manual validation
  if (!params.title || params.title.length > 256) {
    throw new Error('Invalid title');
  }
  if (!params.owner || !params.repo) {
    throw new Error('Missing owner or repo');
  }
  
  // Implementation
  return createGitHubIssue(params);
}
```

#### After Migration
```typescript
// NEW: Zod validation
import { z } from '../src/types/schemas';

// Define validation schema
const IssueParamsSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  type: z.string().min(1),
  tags: z.array(z.string()).default([])
});

function createIssue(params: unknown) {
  // Validate parameters
  const validated = IssueParamsSchema.parse(params);
  
  // Implementation
  return createGitHubIssue(validated);
}
```

#### Migration Checklist
- [ ] **Define Schemas**: Create Zod schemas for all parameter types
- [ ] **Replace Manual Validation**: Replace manual validation with Zod schemas
- [ ] **Update Type Definitions**: Update TypeScript types to match schemas
- [ ] **Test Validation**: Verify validation works correctly
- [ ] **Update Error Messages**: Ensure clear error messages
- [ ] **Document Schemas**: Document all validation schemas

### Step 4: Error Handling Migration

#### Before Migration
```typescript
// OLD: Inconsistent error handling
try {
  const result = await createIssue(params);
  console.log('Issue created:', result);
} catch (error) {
  console.error('Failed:', error.message);
}

// Different error handling patterns
if (result.success) {
  // Handle success
} else {
  // Handle failure
}
```

#### After Migration
```typescript
// NEW: Consistent error handling
interface UtilityResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fossilId?: string;
  deduplicated?: boolean;
}

async function createIssue(params: any): Promise<UtilityResult> {
  try {
    // Validate parameters
    const validated = IssueParamsSchema.parse(params);
    
    // Execute operation
    const result = await createGitHubIssue(validated);
    
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

// Consistent usage
const result = await createIssue(params);
if (result.success) {
  console.log('✅ Issue created:', result.data);
} else {
  console.error('❌ Failed:', result.error);
}
```

#### Migration Checklist
- [ ] **Define Result Interface**: Create consistent result interfaces
- [ ] **Update Functions**: Update all functions to return consistent results
- [ ] **Update Error Handling**: Implement consistent error handling
- [ ] **Update Usage**: Update all usage to handle consistent results
- [ ] **Test Error Scenarios**: Test error handling thoroughly
- [ ] **Document Patterns**: Document error handling patterns

## 🔍 Migration Analysis Tools

### 1. Migration Impact Analysis
```bash
#!/bin/bash
# migration-impact.sh
echo "=== Migration Impact Analysis ==="
echo ""

echo "1. Files using old fossil utilities:"
grep -r "import.*fossilIssue\|import.*fossilLabel\|import.*fossilMilestone" src/ | wc -l

echo ""
echo "2. Files using direct execSync:"
grep -r "execSync" src/ | wc -l

echo ""
echo "3. Files without Zod validation:"
find src/utils/ -name "*.ts" -exec grep -L "z\." {} \;

echo ""
echo "4. Files with inconsistent error handling:"
grep -r "try.*catch" src/utils/ | wc -l
```

### 2. Migration Progress Tracking
```bash
#!/bin/bash
# migration-progress.sh
echo "=== Migration Progress ==="
echo ""

echo "1. Fossil Management Migration:"
grep -r "FossilManager" src/ | wc -l
echo "Target: All fossil operations use FossilManager"

echo ""
echo "2. CLI Operations Migration:"
grep -r "executeCommand\|GitHubCLICommands" src/ | wc -l
echo "Target: No direct execSync calls"

echo ""
echo "3. Validation Migration:"
grep -r "Schema\.parse\|z\." src/utils/ | wc -l
echo "Target: All utilities use Zod validation"

echo ""
echo "4. Error Handling Migration:"
grep -r "UtilityResult\|success.*error" src/utils/ | wc -l
echo "Target: All utilities use consistent error handling"
```

### 3. Migration Validation
```bash
#!/bin/bash
# migration-validation.sh
echo "=== Migration Validation ==="
echo ""

echo "1. Running tests..."
npm test

echo ""
echo "2. Type checking..."
npx tsc --noEmit

echo ""
echo "3. Linting..."
npx eslint src/utils/ --format json

echo ""
echo "4. Duplication check..."
npx jscpd src/utils/ --reporters console
```

## 📋 Migration Checklist

### Pre-Migration
- [ ] **Backup Code**: Create backup of current codebase
- [ ] **Run Tests**: Ensure all tests pass before migration
- [ ] **Document Current State**: Document current utility usage
- [ ] **Plan Migration**: Create detailed migration plan
- [ ] **Set Up Monitoring**: Set up monitoring for migration progress

### During Migration
- [ ] **Migrate Incrementally**: Migrate utilities one at a time
- [ ] **Test Each Step**: Test after each migration step
- [ ] **Update Documentation**: Update documentation as you go
- [ ] **Monitor Progress**: Track migration progress
- [ ] **Handle Issues**: Address any issues that arise

### Post-Migration
- [ ] **Run Full Test Suite**: Ensure all tests pass
- [ ] **Validate Functionality**: Verify all functionality works
- [ ] **Update Documentation**: Complete documentation updates
- [ ] **Clean Up**: Remove deprecated utilities
- [ ] **Monitor Performance**: Monitor performance impact

## 🚨 Common Migration Issues

### 1. Import Path Issues
**Issue**: Import paths may change during migration
**Solution**: Use search and replace to update all import paths
```bash
# Update import paths
find src/ -name "*.ts" -exec sed -i 's/from.*fossilIssue/from "..\/utils\/fossilManager"/g' {} \;
```

### 2. Parameter Mismatches
**Issue**: Parameter interfaces may change
**Solution**: Update parameter objects to match new interfaces
```typescript
// Before
const params = { owner, repo, title, body };

// After
const params = { title, body }; // owner/repo now in manager
```

### 3. Error Handling Changes
**Issue**: Error handling patterns may change
**Solution**: Update error handling to use new patterns
```typescript
// Before
try {
  const result = await createIssue(params);
} catch (error) {
  console.error('Failed:', error.message);
}

// After
const result = await createIssue(params);
if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Failed:', result.error);
}
```

### 4. Type Definition Issues
**Issue**: TypeScript types may not match new interfaces
**Solution**: Update type definitions to match new schemas
```typescript
// Before
interface IssueParams {
  owner: string;
  repo: string;
  title: string;
}

// After
interface IssueParams {
  title: string;
  body?: string;
  type: string;
  tags?: string[];
}
```

## 📚 Migration Resources

### Documentation
- `docs/UTILITY_PATTERNS.md` - Utility pattern documentation
- `docs/REUSE_GUIDELINES.md` - Utility reuse guidelines
- `docs/API_REFERENCE.md` - Complete utility reference

### Examples
- `examples/migration/` - Migration examples
- `tests/migration/` - Migration tests
- `scripts/migration/` - Migration scripts

### Tools
- TypeScript compiler for type checking
- ESLint for code quality
- Jest for testing migrations

## 🎯 Success Criteria

### Migration Completion
- [ ] **100% FossilManager Usage**: All fossil operations use `FossilManager`
- [ ] **0 Direct CLI Calls**: No direct `execSync` calls remain
- [ ] **100% Zod Validation**: All utilities use Zod validation
- [ ] **100% Consistent Error Handling**: All utilities use consistent error handling

### Quality Metrics
- [ ] **All Tests Pass**: No test failures after migration
- [ ] **No Type Errors**: TypeScript compilation succeeds
- [ ] **No Lint Errors**: ESLint passes without errors
- [ ] **No Duplication**: Code duplication reduced by 80%

### Performance Metrics
- [ ] **No Performance Regression**: Performance remains the same or improves
- [ ] **Reduced Bundle Size**: Utility bundle size reduced by 25%
- [ ] **Faster Development**: Development speed improves

This migration guide provides a comprehensive approach to transitioning to the new consolidated utility structure while maintaining functionality and improving code quality. 