# Type and Schema Validation Guide

This guide explains the comprehensive type and schema validation system implemented to enforce the patterns defined in `TYPE_AND_SCHEMA_PATTERNS.md`.

## Overview

The type and schema validation system ensures:
- **Schema Compliance**: All Zod schemas are properly defined and validated
- **Pattern Compliance**: Code follows established patterns (PARAMS OBJECT, fossil-backed creation, etc.)
- **Type Safety**: Proper TypeScript types and imports
- **CI/CD Integration**: Automated validation in pre-commit hooks and CI pipelines

## Components

### 1. Pre-commit Validation (`scripts/precommit-validate.ts`)

Enhanced pre-commit script that validates:
- Schema compliance for staged files
- Type pattern compliance (PARAMS OBJECT PATTERN)
- Fossil usage patterns
- CLI argument validation patterns
- Conventional Commits format

**Usage:**
```bash
bun run validate:pre-commit
```

### 2. Type and Schema Validator (`src/utils/typeSchemaValidator.ts`)

Comprehensive validation utility that:
- Validates all Zod schemas with test cases
- Checks type pattern compliance across the codebase
- Generates detailed validation reports
- Provides CLI interface for validation

**Usage:**
```bash
bun run validate:types-schemas
bun run validate:types-schemas --report
bun run validate:types-schemas --strict
```

### 3. Schema Validation Tests (`tests/unit/types/schemas.test.ts`)

Comprehensive test suite for all Zod schemas:
- Tests minimal and complete valid data
- Tests invalid data rejection
- Ensures schema constraints are enforced
- Provides coverage for all schema types

**Usage:**
```bash
bun test tests/unit/types/schemas.test.ts
```

### 4. CI/CD Integration (`.github/workflows/test-and-coverage.yml`)

Enhanced CI pipeline that includes:
- TypeScript type checking
- Schema validation tests
- Pre-commit validation
- Pattern compliance checks
- Validation report generation

## Validation Patterns

### 1. PARAMS OBJECT PATTERN

**What it checks:**
- Functions with multiple parameters must use a Params object
- Prevents function signatures with many individual parameters

**Example:**
```typescript
// ✅ Good
function createIssue(params: CreateIssueParams) {
  // implementation
}

// ❌ Bad
function createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]) {
  // implementation
}
```

### 2. Fossil-Backed Creation Pattern

**What it checks:**
- GitHub operations must use fossil-backed creation utilities
- Prevents direct GitHub CLI calls

**Example:**
```typescript
// ✅ Good
import { createFossilIssue } from '../utils/fossilIssue';
await createFossilIssue({ owner, repo, title });

// ❌ Bad
execSync(`gh issue create --title "${title}" --repo "${owner}/${repo}"`);
```

### 3. CLI Argument Validation Pattern

**What it checks:**
- CLI arguments must use `parseCLIArgs` utility
- Prevents manual `process.argv` parsing

**Example:**
```typescript
// ✅ Good
import { parseCLIArgs } from '../utils/cli';
const args = parseCLIArgs(BaseCLIArgsSchema);

// ❌ Bad
const args = {
  title: process.argv[2],
  owner: process.argv[3],
};
```

### 4. Type Safety Pattern

**What it checks:**
- Type definitions must be in `src/types/`
- Proper type imports and exports

**Example:**
```typescript
// ✅ Good - in src/types/index.ts
export interface CreateIssueParams {
  owner: string;
  repo: string;
  title: string;
}

// ❌ Bad - in src/utils/someUtil.ts
export interface CreateIssueParams {
  owner: string;
  repo: string;
  title: string;
}
```

### 5. Schema Registry Usage Pattern

**What it checks:**
- Zod schemas must be imported from schemas registry
- Prevents manual Zod schema definitions

**Example:**
```typescript
// ✅ Good
import { CreateFossilIssueParamsSchema } from '../types/schemas';

// ❌ Bad
import { z } from 'zod';
const CreateFossilIssueParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
});
```

## Available Scripts

### Package.json Scripts

```bash
# Basic validation
bun run validate:types-schemas

# Generate validation report
bun run validate:types-schemas --report

# Strict mode validation
bun run validate:types-schemas --strict

# Pre-commit validation
bun run validate:pre-commit

# All validations (types, schemas, pre-commit, type-check)
bun run validate:all
```

### Test Scripts

```bash
# Run schema validation tests
bun test tests/unit/types/schemas.test.ts

# Run with coverage
bun test tests/unit/types/schemas.test.ts --coverage

# Run all tests including schema validation
bun test
```

## CI/CD Integration

### GitHub Actions

The CI pipeline automatically runs:
1. **TypeScript type check**: `bun run tsc --noEmit`
2. **Schema validation tests**: `bun test tests/unit/types/schemas.test.ts --coverage`
3. **Pre-commit validation**: `bun run scripts/precommit-validate.ts`
4. **Pattern compliance checks**: Automated pattern validation
5. **Validation report generation**: Creates detailed reports

### Pre-commit Hook

To set up pre-commit validation:

1. Install pre-commit hooks:
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
bun run validate:pre-commit
```

2. Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Validation Reports

### Generated Reports

The validation system generates detailed reports:

1. **Console Output**: Real-time validation status
2. **Markdown Report**: `type-schema-validation-report.md`
3. **CI Artifacts**: Uploaded to GitHub Actions

### Report Structure

```markdown
# Type and Schema Validation Report
Generated: 2024-01-01T00:00:00Z

## Summary
- **Overall Status**: ✅ PASSED
- **Schemas Validated**: 45/45
- **Patterns Compliant**: 5/5

## Schema Coverage
- ✅ Core CLI schemas
- ✅ GitHub operation schemas
- ✅ Fossil operation schemas
- ✅ Context schemas
- ✅ Plan schemas
- ✅ LLM schemas
- ✅ Tracking schemas
- ✅ Analysis schemas
- ✅ Integration schemas
- ✅ Batch processing schemas
- ✅ Task matching schemas
- ✅ Review schemas
- ✅ Usage schemas

## Pattern Compliance
- ✅ PARAMS OBJECT PATTERN
- ✅ Fossil-backed creation
- ✅ CLI argument validation
- ✅ Type safety
- ✅ Schema registry usage
```

## Troubleshooting

### Common Issues

1. **Schema Validation Failures**
   - Check schema definitions in `src/types/schemas.ts`
   - Ensure test cases match schema constraints
   - Verify required fields are present

2. **Pattern Compliance Failures**
   - Review the specific pattern requirements
   - Check for deprecated patterns in your code
   - Use the provided utilities instead of manual implementations

3. **Type Safety Issues**
   - Move type definitions to `src/types/`
   - Use proper imports from type registry
   - Ensure TypeScript configuration is correct

### Debug Mode

Enable debug output:
```bash
DEBUG=type-schema-validator bun run validate:types-schemas
```

### Fixing Issues

1. **Schema Issues**: Update schema definitions and test cases
2. **Pattern Issues**: Refactor code to follow established patterns
3. **Type Issues**: Move types to proper locations and update imports

## Best Practices

### 1. Schema Development

- Always define schemas in `src/types/schemas.ts`
- Include comprehensive test cases
- Use descriptive schema names
- Add proper validation constraints

### 2. Pattern Compliance

- Follow PARAMS OBJECT PATTERN for functions
- Use fossil-backed creation for GitHub operations
- Use `parseCLIArgs` for CLI argument handling
- Keep types in `src/types/` directory

### 3. Testing

- Write tests for all schemas
- Include both valid and invalid test cases
- Maintain high test coverage
- Run validation before committing

### 4. CI/CD

- Include validation in all CI pipelines
- Generate and archive validation reports
- Fail builds on validation errors
- Monitor validation trends over time

## Migration Guide

### From Manual Validation

If you're migrating from manual validation:

1. **Install new scripts**:
```bash
bun install
```

2. **Run initial validation**:
```bash
bun run validate:all
```

3. **Fix any issues** identified by the validation

4. **Update CI/CD** to include new validation steps

5. **Set up pre-commit hooks** for automated validation

### From Other Validation Systems

1. **Review existing patterns** against new requirements
2. **Update code** to follow established patterns
3. **Replace custom validation** with the new system
4. **Update documentation** to reflect new patterns

## Contributing

### Adding New Schemas

1. Define schema in `src/types/schemas.ts`
2. Add test cases in `tests/unit/types/schemas.test.ts`
3. Update schema registry in `src/utils/typeSchemaValidator.ts`
4. Run validation to ensure compliance

### Adding New Patterns

1. Define pattern requirements
2. Implement validation logic in `TypeSchemaValidator`
3. Add pattern to pre-commit validation
4. Update documentation and tests

### Reporting Issues

1. Check existing documentation
2. Run validation with debug mode
3. Create detailed issue report
4. Include validation output and error messages

## Conclusion

The type and schema validation system ensures code quality, consistency, and maintainability across the project. By following the established patterns and running regular validation, you can maintain high code standards and prevent common issues.

For questions or issues, refer to:
- `TYPE_AND_SCHEMA_PATTERNS.md` for pattern definitions
- `src/types/schemas.ts` for schema definitions
- `tests/unit/types/schemas.test.ts` for test cases
- CI/CD logs for validation results 