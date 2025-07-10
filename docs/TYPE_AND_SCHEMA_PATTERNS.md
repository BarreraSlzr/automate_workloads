# Type and Schema Patterns

This document defines the canonical patterns for type definitions, schema validation, and parameter passing across the codebase.

## Core Principles

1. **Centralized Type Definitions**: All types are defined in `src/types/` for reuse
2. **Zod Schema Validation**: All external inputs are validated with Zod schemas
3. **PARAMS OBJECT PATTERN**: All functions use a single params object, validated by Zod
4. **Owner/Repo Detection**: Always use centralized utilities, never hardcode values

## PARAMS OBJECT PATTERN

All functions must accept a single params object that includes all necessary parameters:

```typescript
// ✅ Correct: Single params object with Zod validation
interface MyFunctionParams {
  owner: string;
  repo: string;
  data: any;
  options?: Partial<MyOptions>;
}

function myFunction(params: MyFunctionParams): Promise<Result> {
  MyFunctionParamsSchema.parse(params);
  // ... implementation
}

// ❌ Incorrect: Multiple parameters or loose strings
function myFunction(owner: string, repo: string, data: any): Promise<Result> {
  // ... implementation
}
```

## Owner/Repo Handling Patterns

### ✅ Canonical Pattern (CLI Entrypoints)

**CLI entrypoints and orchestrators** should detect owner/repo at the top level and pass them down:

```typescript
// In CLI entrypoints (src/cli/, scripts/)
function detectOwnerRepo(options: any = {}): { owner: string; repo: string } {
  if (options.owner && options.repo) return { owner: options.owner, repo: options.repo };
  const owner = getCurrentRepoOwner();
  const repo = getCurrentRepoName();
  if (owner && repo) return { owner, repo };
  // Fallback for CI/local development
  if (process.env.CI) {
    return { owner: 'BarreraSlzr', repo: 'automate_workloads' };
  } else {
    return { owner: 'emmanuelbarrera', repo: 'automate_workloads' };
  }
}

async function main() {
  const { owner, repo } = detectOwnerRepo(parsedArgs);
  OwnerRepoSchema.parse({ owner, repo });
  
  // Pass owner/repo to all downstream utilities
  const result = await someUtility({ owner, repo, ...otherParams });
}
```

### ✅ Canonical Pattern (Fossil/LLM Utilities)

**Fossil and LLM utilities** must receive owner/repo as params, never detect them internally:

```typescript
// In fossil/LLM utilities (src/services/, src/utils/)
export class LLMService {
  constructor(config: Partial<LLMOptimizationConfig> & { owner: string; repo: string }) {
    const { owner, repo, ...llmConfig } = config;
    // ... use owner/repo for fossilization
  }
}

export async function fossilizeLLMInsight(params: {
  owner: string;
  repo: string;
  // ... other params
}): Promise<any> {
  OwnerRepoSchema.parse(params);
  // ... implementation
}
```

### ❌ Anti-Pattern (Circular Dependency)

**NEVER** call repo detection utilities from within fossil/LLM code:

```typescript
// ❌ WRONG: This causes infinite recursion and 100% CPU usage
export class LLMService {
  private async initializeFossilization(): Promise<void> {
    // DON'T DO THIS: Calling getCurrentRepoName from within fossilization
    const repo = getCurrentRepoName(); // This triggers fossilization again!
    this.fossilManager = await createLLMFossilManager({
      owner: 'hardcoded',
      repo, // This causes circular dependency!
    });
  }
}

// ❌ WRONG: Fossil utilities calling repo detection
export async function fossilizeLLMInsight(params: any): Promise<any> {
  // DON'T DO THIS: Detecting repo inside fossil utility
  const owner = getCurrentRepoOwner(); // This can trigger fossilization!
  const repo = getCurrentRepoName();   // This causes infinite recursion!
  // ... implementation
}
```

## Schema Import Patterns

Always import schemas from the centralized location:

```typescript
// ✅ Correct: Import from centralized schemas
import { OwnerRepoSchema, CreateCommandSchema } from '../types/schemas';

// ❌ Incorrect: Define schemas locally or import from wrong location
const OwnerRepoSchema = z.object({ owner: z.string(), repo: z.string() });
```

## Error Handling Patterns

All functions must handle errors gracefully and provide meaningful error messages:

```typescript
// ✅ Correct: Proper error handling with context
async function myFunction(params: MyParams): Promise<Result> {
  try {
    MyParamsSchema.parse(params);
    // ... implementation
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }
    throw new Error(`Function failed: ${error.message}`);
  }
}
```

## Progress/Logging Patterns

All batch/async operations must include progress/logging:

```typescript
// ✅ Correct: Progress logging in loops
for (let i = 0; i < items.length; i++) {
  if (i % 10 === 0 || i === items.length - 1) {
    console.log(`🔄 Processing ${i + 1} of ${items.length}`);
  }
  // ... process item
}

// ✅ Correct: Progress logging in map operations
const results = items.map((item, index) => {
  if (index % 10 === 0 || index === items.length - 1) {
    console.log(`🔄 Processing ${index + 1} of ${items.length}`);
  }
  return processItem(item);
});
```

## Testing Patterns

All new functionality must include tests:

```typescript
// ✅ Correct: Comprehensive test coverage
describe('myFunction', () => {
  it('should validate params correctly', () => {
    const validParams = { owner: 'test', repo: 'test', data: {} };
    expect(() => myFunction(validParams)).not.toThrow();
  });

  it('should reject invalid params', () => {
    const invalidParams = { owner: '', repo: '', data: null };
    expect(() => myFunction(invalidParams)).toThrow();
  });
});
``` 