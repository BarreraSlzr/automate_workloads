/**
 * CLI-related type definitions and schemas
 * @module types/cli
 */

import { z } from 'zod';
import { CLIOptions } from './core';
import type { ContextEntry } from './core';

// PARAMS OBJECT PATTERN
// ---------------------
// All utility and CLI functions that take multiple or complex arguments
// MUST accept a single object parameter, typed as a `Params` interface.
// - For every Params object, define a Zod schema and infer the type from it (e.g., CurateFossilParamsSchema and CurateFossilParams).
// - Always validate params at runtime in utilities using the schema.
// - Name the interface with a `Params` suffix (e.g., `CurateFossilParams`).
// - Define the interface and schema in `src/types/cli.ts` (or a relevant types file).
// - Re-export from `src/types/index.ts` for discoverability.
// - Always call the function with an object, not positional arguments.
//
// This ensures type safety, extensibility, and consistency across the codebase.
//
// -------------------------------------------------------------
//
// (See CONTRIBUTING.md for more details.)

// 1. Base/Shared Schemas and Types
// Used in: scripts/automate-github-fossils.ts (via extension)
export const BaseCLIArgsSchema = z.object({
  dryRun: z.boolean().default(false),
  test: z.boolean().default(false),
  verbose: z.boolean().default(false),
  help: z.boolean().default(false),
});

// 2. CLI Argument Schemas and Types
// Used in:
export const GitHubCLIArgsSchema = BaseCLIArgsSchema.extend({
  owner: z.string().default('barreraslzr'),
  repo: z.string().default('automate_workloads'),
  token: z.string().optional(),
  branch: z.string().optional(),
});

// Used in:
export const FossilCLIArgsSchema = BaseCLIArgsSchema.extend({
  inputPath: z.string(),
  outputPath: z.string().optional(),
  format: z.enum(['yaml', 'json', 'markdown']).default('yaml'),
  validate: z.boolean().default(true),
});

// Used in:
export const RoadmapCLIArgsSchema = GitHubCLIArgsSchema.extend({
  roadmapPath: z.string().default('src/types/e2e-roadmap.yaml'),
  createIssues: z.boolean().default(true),
  createMilestones: z.boolean().default(true),
  createLabels: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
});

// 3. GitHub CLI Operation Schemas and Types
// Used in:
export const GitHubIssueCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional(),
  bodyFile: z.string().optional(),
  labels: z.array(z.string()).default([]),
  assignees: z.array(z.string()).default([]),
  milestone: z.string().optional(),
  project: z.string().optional(),
  template: z.string().optional(),
  web: z.boolean().default(false),
  editor: z.boolean().default(false),
});

// Used in:
export const GitHubMilestoneCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueOn: z.string().optional(), // ISO 8601 date string
  state: z.enum(['open', 'closed']).default('open'),
});

// Used in:
export const GitHubLabelCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/), // 6-digit hex color
});

// Used in:
export const GitHubIssueViewSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
  json: z.boolean().default(true),
  fields: z.array(z.string()).optional(),
});

// Used in:
export const GitHubIssueListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(['open', 'closed', 'all']).default('open'),
  labels: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  milestone: z.string().optional(),
  limit: z.number().min(1).max(100).default(30),
  json: z.boolean().default(true),
});

// Used in:
export const GitHubLabelListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  json: z.boolean().default(true),
});

// Used in:
export const GitHubMilestoneListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(['open', 'closed', 'all']).default('open'),
  json: z.boolean().default(true),
});

// Used in:
export const GitHubIssueEditSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  bodyFile: z.string().optional(),
  addLabels: z.array(z.string()).optional(),
  removeLabels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
});

// Used in:
export const GitHubProjectSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  projectNumber: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
});

// Used in:
export const GitHubAuthSchema = z.object({
  token: z.string().optional(),
  status: z.boolean().default(false),
  login: z.boolean().default(false),
});

// 4. CLI Command Result Interface
// Used in: src/utils/githubCliCommands.ts
export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  message?: string;
}

// 5. CLI Parameter Interfaces (Params Suffix)
// Used in: src/utils/githubCliCommands.ts
export interface IssueParams {
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  assignees?: string[];
}

// Used in: src/utils/githubCliCommands.ts, src/utils/fossilLabel.ts
export interface LabelParams {
  name: string;
  description: string;
  color: string;
}

// Used in: src/utils/githubCliCommands.ts, src/utils/fossilMilestone.ts
export interface MilestoneParams {
  title: string;
  description: string;
  dueOn?: string;
}

// 6. Fossil/Custom Utility Params and Schemas
// Used in: src/utils/curateFossil.ts, examples/curate-fossil-demo.ts
export const CurateFossilParamsSchema = z.object({
  inputYaml: z.string(),
  tag: z.string().optional(),
  outputDir: z.string().optional(),
});
export type CurateFossilParams = z.infer<typeof CurateFossilParamsSchema>;

// Used in: src/utils/fossilIssue.ts
export const CreateFossilIssueParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  milestone: z.string().optional(),
  section: z.string().optional(),
  type: z.enum(['action', 'knowledge', 'decision', 'observation', 'plan', 'result', 'insight']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  purpose: z.string().optional(),
  checklist: z.string().optional(),
  automationMetadata: z.string().optional(),
  extraBody: z.string().optional(),
});

// Used in: src/utils/fossilLabel.ts
export const CreateFossilLabelParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Used in: src/utils/fossilMilestone.ts
export const CreateFossilMilestoneParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  description: z.string(),
  dueOn: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// 7. Utility Functions
// Used in: scripts/automate-github-fossils.ts
export function parseCLIArgs<T extends z.ZodSchema>(
  schema: T,
  args: string[]
): z.infer<T> {
  const parsed: Record<string, unknown> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!arg) continue;
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        parsed[key] = nextArg;
        i++; // Skip next arg since we used it
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      parsed[key] = true;
    }
  }
  
  return schema.parse(parsed);
}

// 8. Type Exports
export type BaseCLIArgs = z.infer<typeof BaseCLIArgsSchema>;
export type GitHubCLIArgs = z.infer<typeof GitHubCLIArgsSchema>;
export type FossilCLIArgs = z.infer<typeof FossilCLIArgsSchema>;
export type RoadmapCLIArgs = z.infer<typeof RoadmapCLIArgsSchema>;
export type GitHubIssueCreate = z.infer<typeof GitHubIssueCreateSchema>;
export type GitHubMilestoneCreate = z.infer<typeof GitHubMilestoneCreateSchema>;
export type GitHubLabelCreate = z.infer<typeof GitHubLabelCreateSchema>;
export type GitHubIssueView = z.infer<typeof GitHubIssueViewSchema>;
export type GitHubIssueList = z.infer<typeof GitHubIssueListSchema>;
export type GitHubLabelList = z.infer<typeof GitHubLabelListSchema>;
export type GitHubMilestoneList = z.infer<typeof GitHubMilestoneListSchema>;
export type GitHubIssueEdit = z.infer<typeof GitHubIssueEditSchema>;
export type GitHubProject = z.infer<typeof GitHubProjectSchema>;
export type GitHubAuth = z.infer<typeof GitHubAuthSchema>; 

export type CreateFossilIssueParams = z.infer<typeof CreateFossilIssueParamsSchema>;
export type CreateFossilLabelParams = z.infer<typeof CreateFossilLabelParamsSchema>;
export type CreateFossilMilestoneParams = z.infer<typeof CreateFossilMilestoneParamsSchema>;