// Central Zod schema registry for the automation ecosystem
// All Zod schemas for Params, CLI, core types, and utilities should be defined and exported here.

import { z, ZodError } from 'zod';
export { ZodError };
export { z };

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
  goal: z.string().min(1, 'Goal is required'),
  context: z.record(z.unknown()).optional(),
  constraints: z.array(z.string()).optional(),
  timeline: z.string().optional(),
});

export const TaskBreakdownSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
    dependencies: z.array(z.string()),
    estimatedEffort: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    assignee: z.string().optional(),
  })),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    milestones: z.array(z.object({
      date: z.string(),
      description: z.string(),
      tasks: z.array(z.string()),
    })),
  }),
  risks: z.array(z.object({
    description: z.string(),
    probability: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    mitigation: z.string(),
  })),
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
  owner: z.string(),
  repo: z.string(),
  roadmap: z.string(),
  createLabels: z.boolean().default(true),
  createMilestones: z.boolean().default(true),
  createIssues: z.boolean().default(true),
  output: z.string().optional(),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
  test: z.boolean().default(false)
});

// Project Status Update Schemas
// Used in: scripts/update-project-status.ts
export const UpdateProjectStatusParamsSchema = z.object({
  rootDirs: z.array(z.string()).default([
    'src/cli',
    'src/services', 
    'src/utils',
    'src/core',
    'src/types',
    'scripts',
  ]),
  testDirs: z.array(z.string()).default(['tests', 'test']),
  fossilKeywords: z.array(z.string()).default([
    'toFossilEntry', 
    'outputFossil', 
    'writeFossilToFile'
  ]),
  statusTags: z.array(z.string()).default([
    '@planned', '@todo', '@blocked', '@documented', 
    '@in-progress', '@implemented', '@tested', '@reviewed', '@deprecated'
  ]),
  outputPath: z.string().default('fossils/project_status.yml'),
  enableLLM: z.boolean().default(true),
  verbose: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

// File Analysis Schemas
export const ClassInfoSchema = z.object({
  name: z.string(),
  status: z.string(),
});

export const FunctionInfoSchema = z.object({
  name: z.string(),
  status: z.string(),
});

export const CliCommandSchema = z.object({
  name: z.string(),
  options: z.array(z.string()),
  required: z.array(z.string()),
});

export const FileAnalysisSchema = z.object({
  file: z.string(),
  classes: z.array(ClassInfoSchema),
  functions: z.array(FunctionInfoSchema),
  cli_commands: z.array(z.string()),
  cli_details: z.array(CliCommandSchema),
  fossilized_output: z.boolean(),
});

export const DirectoryScanSchema = z.array(FileAnalysisSchema);

// Test Mapping Schema
export const TestMappingSchema = z.record(z.string(), z.array(z.string()));

// Project Status Structure Schemas
export const FileEntrySchema = z.object({
  functions: z.array(z.string()),
  fossilized_output: z.boolean(),
  cli_commands: z.array(z.string()).optional(),
  cli_details: z.array(CliCommandSchema).optional(),
  tests: z.array(z.string()).optional(),
});

export const ModuleFileSchema = z.record(z.string(), FileEntrySchema);

export const ModuleSchema = z.object({
  path: z.string(),
  files: z.array(ModuleFileSchema),
});

export const ModulesSchema = z.record(z.string(), ModuleSchema);

// Overall Summary Schema
export const OverallSummarySchema = z.object({
  modules_total: z.number(),
  files_total: z.number(),
  fossilized_outputs: z.number(),
  tests_total: z.number(),
  completion_percent: z.number(),
});

// Fossilization Summary Schema
export const FossilizationSummarySchema = z.object({
  fossilized_outputs: z.array(z.string()),
  tests_using_fossils: z.array(z.string()),
  next_to_fossilize: z.array(z.string()),
});

// Developer Summary Schemas
export const CliEntrySchema = z.object({
  file: z.string(),
  commands: z.array(z.string()),
  functions: z.array(z.string()),
  hasTests: z.boolean(),
  testFiles: z.array(z.string()),
});

export const UtilsEntrySchema = z.object({
  file: z.string(),
  functions: z.array(z.string()),
  hasTests: z.boolean(),
  testFiles: z.array(z.string()),
});

export const ServicesEntrySchema = z.object({
  file: z.string(),
  functions: z.array(z.string()),
  hasTests: z.boolean(),
  testFiles: z.array(z.string()),
});

export const ExamplesEntrySchema = z.object({
  file: z.string(),
  description: z.string(),
  demonstrates: z.array(z.string()),
});

export const DeveloperSummarySchema = z.object({
  cli: z.array(CliEntrySchema),
  utils: z.array(UtilsEntrySchema),
  services: z.array(ServicesEntrySchema),
  examples: z.array(ExamplesEntrySchema),
  summary: z.object({
    totalCLI: z.number(),
    totalUtils: z.number(),
    totalServices: z.number(),
    totalExamples: z.number(),
    testedCLI: z.number(),
    testedUtils: z.number(),
    testedServices: z.number(),
    coverage: z.number(),
  }),
  recommendations: z.array(z.string()),
});

// Complete Project Status Schema
export const ProjectStatusSchema = z.object({
  project_status: z.object({
    modules: ModulesSchema,
    overall_summary: OverallSummarySchema.optional(),
    fossilization_summary: FossilizationSummarySchema.optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  developer_summary: DeveloperSummarySchema.optional(),
});

export const UsageReportSchema = z.object({
  format: z.enum(['text', 'json', 'csv']).optional(),
  days: z.number().min(1).max(365).optional(),
  purpose: z.string().optional(),
  provider: z.string().optional(),
});

export const OptimizationConfigSchema = z.object({
  maxTokensPerCall: z.number().min(100).max(32000).optional(),
  maxCostPerCall: z.number().min(0.01).max(10).optional(),
  minValueScore: z.number().min(0).max(1).optional(),
  enableLocalLLM: z.boolean().optional(),
  enableCaching: z.boolean().optional(),
  cacheExpiryHours: z.number().min(1).max(168).optional(),
  retryAttempts: z.number().min(1).max(10).optional(),
  retryDelayMs: z.number().min(100).max(10000).optional(),
  rateLimitDelayMs: z.number().min(1000).max(300000).optional(),
});

// Issue Fossil Manager Params Schemas
// Used in: src/utils/fossilIssue.ts
export const CheckExistingFossilParamsSchema = z.object({
  fossilService: z.any(), // ContextFossilService instance
  contentHash: z.string().optional(),
  title: z.string(),
  content: z.string(),
  type: z.enum(["knowledge", "decision", "action", "observation", "plan", "result", "insight"]),
});

export const CreateFossilEntryParamsSchema = z.object({
  fossilService: z.any(), // ContextFossilService instance
  type: z.enum(["knowledge", "decision", "action", "observation", "plan", "result", "insight"]),
  title: z.string(),
  body: z.string(),
  section: z.string(),
  tags: z.array(z.string()),
  metadata: z.record(z.any()),
  issueNumber: z.string().optional(),
  parsedFields: z.record(z.any()),
}); 