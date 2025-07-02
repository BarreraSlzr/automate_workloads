// Central Zod schema registry for the automation ecosystem
// All Zod schemas for Params, CLI, core types, and utilities should be defined and exported here.

import { z } from 'zod';

// CLI Schemas
// Used in: docs/TYPE_AND_SCHEMA_PATTERNS.md
export const BaseCLIArgsSchema = z.object({
  dryRun: z.boolean().default(false),
  test: z.boolean().default(false),
  verbose: z.boolean().default(false),
  help: z.boolean().default(false),
});
// Used in: (no usage found outside types)
export const FossilCLIArgsSchema = BaseCLIArgsSchema.extend({
  inputPath: z.string(),
  outputPath: z.string().optional(),
  format: z.enum(['yaml', 'json', 'markdown']).default('yaml'),
  validate: z.boolean().default(true),
});
// Used in: (no usage found outside types)
export const GitHubCLIArgsSchema = BaseCLIArgsSchema.extend({
  owner: z.string().default('barreraslzr'),
  repo: z.string().default('automate_workloads'),
  token: z.string().optional(),
  branch: z.string().optional(),
});
// Used in: (no usage found outside types)
export const RoadmapCLIArgsSchema = GitHubCLIArgsSchema.extend({
  roadmapPath: z.string().default('src/types/e2e-roadmap.yaml'),
  createIssues: z.boolean().default(true),
  createMilestones: z.boolean().default(true),
  createLabels: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
});

// Used in: docs/TYPE_AND_SCHEMA_PATTERNS.md
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
// Used in: (no usage found outside types)
export const GitHubMilestoneCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueOn: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
// Used in: (no usage found outside types)
export const GitHubLabelCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
// Used in: (no usage found outside types)
export const GitHubIssueViewSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
  json: z.boolean().default(true),
  fields: z.array(z.string()).optional(),
});
// Used in: (no usage found outside types)
export const GitHubIssueListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(['open', 'closed']).optional(),
  labels: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  milestone: z.string().optional(),
  creator: z.string().optional(),
  mentioned: z.string().optional(),
  sort: z.string().optional(),
  direction: z.string().optional(),
  perPage: z.number().optional(),
  page: z.number().optional(),
});
// Used in: (no usage found outside types)
export const GitHubLabelListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  perPage: z.number().optional(),
  page: z.number().optional(),
});
// Used in: (no usage found outside types)
export const GitHubMilestoneListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(['open', 'closed', 'all']).optional(),
  sort: z.string().optional(),
  direction: z.string().optional(),
  perPage: z.number().optional(),
  page: z.number().optional(),
});
// Used in: (no usage found outside types)
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
// Used in: (no usage found outside types)
export const GitHubProjectSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  projectNumber: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
});
// Used in: (no usage found outside types)
export const GitHubAuthSchema = z.object({
  token: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
});
// Used in: src/utils/curateFossil.ts
export const CurateFossilParamsSchema = z.object({
  inputYaml: z.string(),
  outputDir: z.string().optional(),
  tag: z.string().optional(),
  fossilPath: z.string().optional(),
  dryRun: z.boolean().default(false),
  validate: z.boolean().default(true),
});
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

// Core/Config Schemas
export const envSchema = z.object({
  GITHUB_TOKEN: z.string().optional(),
  GMAIL_TOKEN: z.string().optional(),
  BUFFER_TOKEN: z.string().optional(),
  TWITTER_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

// Context/Fossil Schemas
export const ContextEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['knowledge', 'decision', 'action', 'observation', 'plan', 'result', 'insight']),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()).default({}),
  source: z.enum(['llm', 'terminal', 'api', 'manual', 'automated']),
  version: z.number(),
  parentId: z.string().optional(),
  children: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const ContextQuerySchema = z.object({
  limit: z.number().default(100),
  offset: z.number().default(0),
  type: z.enum(['knowledge', 'decision', 'action', 'observation', 'plan', 'result', 'insight']).optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['llm', 'terminal', 'api', 'manual', 'automated']).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  search: z.string().optional(),
});

// Plan/Validator Schemas
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});
export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string().optional(),
});
export const RiskSchema = z.object({
  id: z.string(),
  description: z.string(),
  likelihood: z.string(),
  impact: z.string(),
});
export const TimelineSchema = z.object({
  start: z.string(),
  end: z.string(),
});
export const PlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  tasks: z.array(TaskSchema),
  milestones: z.array(MilestoneSchema),
  risks: z.array(RiskSchema),
  timeline: TimelineSchema,
});

// Repo Orchestrator Schemas
export const RepoConfigSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
  token: z.string().optional(),
});
export const RepoAnalysisSchema = z.object({
  repo: z.string(),
  issues: z.number(),
  prs: z.number(),
  contributors: z.number(),
});

// LLM Plan Schemas
export const PlanRequestSchema = z.object({
  prompt: z.string(),
  context: z.string().optional(),
  goals: z.array(z.string()),
});
export const TaskBreakdownSchema = z.object({
  task: z.string(),
  subtasks: z.array(z.string()),
});

// Track Progress Schemas
export const TrackingConfigSchema = z.object({
  interval: z.number(),
  notify: z.boolean().default(false),
});
export const ProgressMetricsSchema = z.object({
  completed: z.number(),
  total: z.number(),
  percent: z.number(),
});
export const TrendAnalysisSchema = z.object({
  trend: z.string(),
  change: z.number(),
});

// Automate GitHub Fossils CLI Schema
export const CreateCommandSchema = z.object({
  fossilType: z.string(),
  input: z.string(),
  output: z.string().optional(),
  dryRun: z.boolean().default(false),
}); 