#!/usr/bin/env bun

/**
 * Implementation Patterns Demo
 * Demonstrates correct usage of @/types imports and PARAMS OBJECT PATTERN
 * @module examples/implementation-patterns-demo
 */

// ✅ CORRECT: Import types from @/types
import type { 
  ContextEntry, 
  ContextQuery, 
  BaseFossil,
  GitHubIssue,
  PerformanceMetrics 
} from '../src/types';

// ✅ CORRECT: Import schemas from @/types/schemas
import { 
  BaseCLIArgsSchema,
  GitHubIssueCreateSchema,
  ContextEntrySchema,
  ProgressMetricsSchema,
  z
} from '../src/types/schemas';

// ✅ CORRECT: Import CLI utilities from @/types/cli
import { parseCLIArgs, GitHubCLIArgs } from '../src/types/cli';

// ✅ CORRECT: Import specific types when needed
import type { E2ERoadmap, E2ERoadmapTask } from '../src/types/workflow';
import type { LLMInsightFossil } from '../src/types/llmFossil';

// ============================================================================
// PARAMS OBJECT PATTERN EXAMPLES
// ============================================================================

// ✅ CORRECT: Define params interface with Params suffix
export interface CreateContextEntryParams {
  type: ContextEntry['type'];
  title: string;
  content: string;
  tags?: string[];
  source?: ContextEntry['source'];
  metadata?: Record<string, unknown>;
  parentId?: string;
  children?: string[];
  version?: number;
  dryRun?: boolean;
  verbose?: boolean;
}

// ✅ CORRECT: Define Zod schema for validation
export const CreateContextEntryParamsSchema = BaseCLIArgsSchema.extend({
  type: ContextEntrySchema.shape.type,
  title: ContextEntrySchema.shape.title,
  content: ContextEntrySchema.shape.content,
  tags: ContextEntrySchema.shape.tags,
  source: ContextEntrySchema.shape.source.default('manual'),
  metadata: ContextEntrySchema.shape.metadata,
  parentId: ContextEntrySchema.shape.parentId,
  children: ContextEntrySchema.shape.children.default([]),
  version: ContextEntrySchema.shape.version.default(1),
});

// ✅ CORRECT: Export type from schema
export type CreateContextEntryParamsType = z.infer<typeof CreateContextEntryParamsSchema>;

// ✅ CORRECT: Utility function using PARAMS OBJECT PATTERN
export function createContextEntry(params: CreateContextEntryParams): ContextEntry {
  // Validate params at runtime
  const validatedParams = CreateContextEntryParamsSchema.parse(params);
  
  // Use object destructuring for clean code
  const { 
    type, 
    title, 
    content, 
    tags, 
    source, 
    metadata, 
    parentId, 
    children, 
    version,
    dryRun,
    verbose 
  } = validatedParams;

  if (verbose) {
    console.log('Creating context entry with params:', JSON.stringify(validatedParams, null, 2));
  }

  if (dryRun) {
    console.log('DRY RUN: Would create context entry:', { type, title, content });
    return {} as ContextEntry; // Return empty for dry run
  }

  const now = new Date().toISOString();
  
  return {
    id: generateId({ content, type, title }),
    type,
    title,
    content,
    tags: tags ?? [],
    metadata: {
      ...metadata,
      contentHash: generateContentHash({ content, type, title }),
    },
    source: source ?? 'manual',
    version: version ?? 1,
    parentId,
    children: children ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

// ✅ CORRECT: Service class using PARAMS OBJECT PATTERN
export class ContextFossilService {
  constructor(private owner: string, private repo: string) {}

  async createEntry(params: CreateContextEntryParams): Promise<ServiceResponse<ContextEntry>> {
    try {
      // Validate params
      const validatedParams = CreateContextEntryParamsSchema.parse(params);
      
      if (validatedParams.verbose) {
        console.log('Creating context entry...');
      }

      // Check for existing fossil
      const existing = await this.checkExistingFossil({
        fossilService: this,
        contentHash: this.generateContentHash(validatedParams),
        title: validatedParams.title,
        content: validatedParams.content,
        type: validatedParams.type
      });

      if (existing.success && existing.data) {
        return {
          success: true,
          data: existing.data,
          message: 'Entry already exists',
          fossilId: existing.fossilId
        };
      }

      // Create new entry
      const entry = createContextEntry(validatedParams);
      
      // Save to storage
      await this.saveEntry(entry);

      return {
        success: true,
        data: entry,
        message: 'Context entry created successfully',
        fossilId: entry.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async queryEntries(params: {
    limit?: number;
    offset?: number;
    type?: ContextEntry['type'];
    tags?: string[];
    search?: string;
    verbose?: boolean;
  }): Promise<ServiceResponse<ContextEntry[]>> {
    try {
      // Use default values
      const queryParams = {
        limit: 100,
        offset: 0,
        ...params
      };

      if (queryParams.verbose) {
        console.log('Querying entries with params:', JSON.stringify(queryParams, null, 2));
      }

      // Implementation...
      const entries: ContextEntry[] = [];

      return {
        success: true,
        data: entries,
        message: `Found ${entries.length} entries`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkExistingFossil(params: {
    fossilService: ContextFossilService;
    contentHash: string;
    title: string;
    content: string;
    type: ContextEntry['type'];
  }): Promise<ServiceResponse<ContextEntry>> {
    // Implementation...
    return { success: false, error: 'Not implemented' };
  }

  private generateContentHash(params: CreateContextEntryParams): string {
    const { content, type, title } = params;
    return require('crypto').createHash('sha256')
      .update(`${content}${type}${title}`)
      .digest('hex')
      .substring(0, 12);
  }

  private async saveEntry(entry: ContextEntry): Promise<void> {
    // Implementation...
  }
}

// ✅ CORRECT: CLI command using PARAMS OBJECT PATTERN
export async function contextFossilCLI(): Promise<void> {
  try {
    // Parse CLI arguments using PARAMS OBJECT PATTERN
    const options = parseCLIArgs(BaseCLIArgsSchema, process.argv.slice(2));
    
    if (options.verbose) {
      console.log('CLI Options:', JSON.stringify(options, null, 2));
    }

    // Create service instance
    const service = new ContextFossilService('barreraslzr', 'automate_workloads');

    // Create entry using PARAMS OBJECT PATTERN
    const result = await service.createEntry({
      type: 'action',
      title: 'Implement new feature',
      content: 'This is a new feature implementation',
      tags: ['feature', 'automation'],
      source: 'manual',
      dryRun: options.dryRun,
      verbose: options.verbose
    });

    if (result.success) {
      console.log('✅ Success:', result.message);
      if (result.data) {
        console.log('Entry ID:', result.data.id);
      }
    } else {
      console.error('❌ Error:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// ✅ CORRECT: Function calls using objects
export function demonstrateCorrectUsage(): void {
  // ✅ CORRECT: Call with object
  const entry = createContextEntry({
    type: 'knowledge',
    title: 'Implementation Patterns',
    content: 'This demonstrates correct usage patterns',
    tags: ['patterns', 'typescript'],
    verbose: true
  });

  // ✅ CORRECT: Service usage
  const service = new ContextFossilService('owner', 'repo');
  
  service.createEntry({
    type: 'decision',
    title: 'Use PARAMS OBJECT PATTERN',
    content: 'Always use objects for function parameters',
    tags: ['decision', 'architecture'],
    dryRun: true,
    verbose: true
  });

  service.queryEntries({
    limit: 10,
    type: 'knowledge',
    tags: ['patterns'],
    verbose: true
  });
}

// ❌ INCORRECT: Examples of what NOT to do

export function demonstrateIncorrectUsage(): void {
  // ❌ INCORRECT: Positional arguments
  // function createEntry(type: string, title: string, content: string) {}
  // createEntry('knowledge', 'Title', 'Content');

  // ❌ INCORRECT: Missing validation
  // function createEntry(params: CreateContextEntryParams) {
  //   const { type, title } = params; // No validation!
  // }

  // ❌ INCORRECT: Wrong imports
  // import type { ContextEntry } from '../types/core';
  // import { BaseCLIArgsSchema } from '../types/schemas';

  // ❌ INCORRECT: Inconsistent naming
  // interface CreateEntryOptions {}
  // interface EntryCreationConfig {}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(params: { content: string; type: string; title: string }): string {
  const { content, type, title } = params;
  const contentHash = generateContentHash(params);
  const timestamp = Date.now();
  return `fossil_${contentHash}_${timestamp}`;
}

function generateContentHash(params: { content: string; type: string; title: string }): string {
  const { content, type, title } = params;
  return require('crypto').createHash('sha256')
    .update(`${content}${type}${title}`)
    .digest('hex')
    .substring(0, 12);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fossilId?: string;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  console.log('🎯 Implementation Patterns Demo');
  console.log('================================');
  
  demonstrateCorrectUsage();
  
  console.log('\n✅ All patterns demonstrated correctly!');
  console.log('\n📚 See docs/IMPLEMENTATION_PATTERNS_GUIDE.md for more details');
} 