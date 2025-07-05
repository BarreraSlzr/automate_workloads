// Central Zod schema registry for the automation ecosystem
// All Zod schemas for Params, CLI, core types, and utilities should be defined and exported here.

import { z, ZodError } from 'zod';
export { ZodError };
export { z };

// ============================================================================
// FOSSIL MANAGER SCHEMAS (moved from src/utils/fossilManager.ts)
// ============================================================================

export const BaseFossilParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  type: z.string().min(1),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const IssueFossilParamsSchema = BaseFossilParamsSchema.extend({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string()).default([]),
  milestone: z.string().optional(),
  section: z.string().optional(),
  purpose: z.string().optional(),
  checklist: z.string().optional(),
  automationMetadata: z.string().optional(),
  extraBody: z.string().optional(),
});

export const LabelFossilParamsSchema = BaseFossilParamsSchema.extend({
  name: z.string().min(1).max(50),
  description: z.string().max(100),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/),
});

export const MilestoneFossilParamsSchema = BaseFossilParamsSchema.extend({
  title: z.string().min(1).max(100),
  description: z.string().max(200),
  dueOn: z.string().optional(),
});

// ============================================================================
// LLM INPUT VALIDATOR SCHEMAS (moved from src/utils/llmInputValidator.ts)
// ============================================================================

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

export const LLMInputSchema = z.object({
  model: z.string().min(1, 'Model name is required'),
  messages: z.array(MessageSchema).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  logit_bias: z.record(z.number()).optional(),
  user: z.string().optional(),
  n: z.number().positive().optional(),
  stream: z.boolean().optional(),
  suffix: z.string().optional(),
  echo: z.boolean().optional(),
  logprobs: z.number().min(0).max(5).optional(),
  best_of: z.number().positive().optional(),
});

// ============================================================================
// LLM FOSSIL MANAGER SCHEMAS (moved from src/utils/llmFossilManager.ts)
// ============================================================================

export const LLMFossilManagerParamsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  commitRef: z.string().optional(),
  sessionId: z.string().optional(),
  fossilStoragePath: z.string().default('fossils/llm_insights/'),
  enableAutoFossilization: z.boolean().default(true),
  enableQualityMetrics: z.boolean().default(true),
  enableValidationTracking: z.boolean().default(true)
});

// ============================================================================
// VISUAL DIAGRAM GENERATOR SCHEMAS (moved from src/utils/visualDiagramGenerator.ts)
// ============================================================================

export const WorkflowStepSchema = z.object({
  step: z.string(),
  description: z.string().optional(),
  type: z.enum(['start', 'process', 'decision', 'end']).default('process'),
  style: z.string().optional(),
});

export const ComponentSchema = z.object({
  name: z.string(),
  items: z.array(z.string()),
  style: z.string().optional(),
});

export const RiskSchema = z.object({
  risk: z.string(),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  probability: z.enum(['low', 'medium', 'high']),
  mitigation: z.string(),
});

export const DependencySchema = z.object({
  name: z.string(),
  type: z.enum(['blocking', 'dependent', 'related']),
  description: z.string().optional(),
});

// Type exports for visual diagram generation
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Dependency = z.infer<typeof DependencySchema>;

// ============================================================================
// LLM PREDICTIVE MONITORING SCHEMAS
// ============================================================================

export const LLMPredictiveMonitoringConfigSchema = z.object({
  enabled: z.boolean().default(true),
  enablePreCallMetrics: z.boolean().default(true),
  enableContextAnalysis: z.boolean().default(true),
  enableRiskAssessment: z.boolean().default(true),
  enablePredictiveAlerts: z.boolean().default(true),
  monitoringDataPath: z.string().default('fossils/monitoring/'),
  thresholds: z.object({
    highRisk: z.number().min(0).max(1).default(0.7),
    rateLimitProbability: z.number().min(0).max(1).default(0.6),
    costThreshold: z.number().positive().default(0.10),
    tokenThreshold: z.number().positive().default(4000),
    consecutiveFailures: z.number().positive().default(3)
  }),
  monitoringWindow: z.number().positive().default(60),
  enableRealTimeAlerts: z.boolean().default(true)
});

export const LLMPredictiveMetricsSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string(),
  preCallMetrics: z.object({
    estimatedTokens: z.number().nonnegative(),
    estimatedCost: z.number().nonnegative(),
    messageComplexity: z.number().min(0).max(1),
    requestUrgency: z.number().min(0).max(1),
    providerAvailable: z.boolean(),
    recentCallFrequency: z.number().nonnegative(),
    recentErrorRate: z.number().min(0).max(1),
    recentRateLimitEvents: z.number().nonnegative(),
    providerLoad: z.number().min(0).max(1),
    timeSinceLastSuccess: z.number().nonnegative(),
    sessionDuration: z.number().nonnegative(),
    memoryUsage: z.number().nonnegative(),
    cpuUsage: z.number().min(0).max(100),
    networkLatency: z.number().nonnegative()
  }),
  humanReadableContext: z.object({
    userIntent: z.string(),
    currentWorkflow: z.string(),
    recentActions: z.array(z.string()),
    currentFile: z.string().optional(),
    gitContext: z.object({
      branch: z.string(),
      status: z.string(),
      lastCommit: z.string(),
      uncommittedChanges: z.number().nonnegative()
    }).optional(),
    systemContext: z.object({
      timeOfDay: z.string(),
      dayOfWeek: z.string(),
      isBusinessHours: z.boolean(),
      isWeekend: z.boolean()
    }),
    errorContext: z.object({
      previousErrors: z.array(z.string()),
      errorPatterns: z.array(z.string()),
      lastErrorTime: z.string().optional()
    }).optional()
  }),
  riskAssessment: z.object({
    overallRisk: z.number().min(0).max(1),
    rateLimitProbability: z.number().min(0).max(1),
    costRisk: z.number().min(0).max(1),
    performanceRisk: z.number().min(0).max(1),
    securityRisk: z.number().min(0).max(1),
    riskFactors: z.array(z.string()),
    recommendations: z.array(z.string())
  }),
  alerts: z.object({
    highRisk: z.boolean(),
    rateLimitWarning: z.boolean(),
    costAlert: z.boolean(),
    performanceAlert: z.boolean(),
    messages: z.array(z.string())
  })
});

export const LLMContextAnalysisSchema = z.object({
  complexity: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  insights: z.array(z.string()),
  suggestions: z.array(z.string())
});

export const LLMRiskAssessmentSchema = z.object({
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    probability: z.number().min(0).max(1),
    impact: z.number().min(0).max(1),
    description: z.string()
  })),
  mitigations: z.array(z.object({
    strategy: z.string(),
    effectiveness: z.number().min(0).max(1),
    effort: z.enum(['low', 'medium', 'high']),
    description: z.string()
  })),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  riskScore: z.number().min(0).max(1)
});

export const LLMPredictiveAlertSchema = z.object({
  type: z.enum(['risk', 'rate_limit', 'cost', 'performance', 'security']),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string(),
  timestamp: z.string(),
  context: z.record(z.any()),
  actions: z.array(z.string())
});

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
  color: z.string().regex(/^[0-9a-fA-F]{6}$/),
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
});

// ============================================================================
// LLM SNAPSHOT PROCESSING SCHEMAS
// ============================================================================

export const SnapshotAnalysisParamsSchema = z.object({
  timeRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  filters: z.object({
    tags: z.array(z.string()).default(['llm']),
    types: z.array(z.string()).optional(),
    purposes: z.array(z.string()).optional(),
    contexts: z.array(z.string()).optional(),
  }).optional(),
  includeMetadata: z.boolean().default(true),
  includeValidation: z.boolean().default(true),
  includeQualityMetrics: z.boolean().default(true),
  limit: z.number().positive().max(1000).default(100),
  offset: z.number().nonnegative().default(0),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const SnapshotExportParamsSchema = z.object({
  format: z.enum(['yaml', 'json', 'markdown', 'chat']).default('yaml'),
  includeMetadata: z.boolean().default(true),
  includeTimestamps: z.boolean().default(true),
  includeValidation: z.boolean().default(true),
  includePreprocessing: z.boolean().default(false),
  includeQualityMetrics: z.boolean().default(false),
  filters: z.object({
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    types: z.array(z.string()).optional(),
    purposes: z.array(z.string()).optional(),
  }).optional(),
  outputPath: z.string().optional(),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const FossilBrowserParamsSchema = z.object({
  viewMode: z.enum(['list', 'grid', 'timeline']).default('list'),
  sortBy: z.enum(['timestamp', 'quality', 'purpose', 'context', 'model']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filters: z.object({
    tags: z.array(z.string()).default(['llm']),
    types: z.array(z.string()).optional(),
    purposes: z.array(z.string()).optional(),
    contexts: z.array(z.string()).optional(),
    models: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
  limit: z.number().positive().max(100).default(50),
  offset: z.number().nonnegative().default(0),
  selectedFossils: z.array(z.string()).default([]),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const PatternAnalysisParamsSchema = z.object({
  fossils: z.array(z.any()).optional(), // Will be populated from query
  analysisTypes: z.array(z.enum(['purposes', 'contexts', 'quality', 'models', 'trends'])).default(['purposes', 'contexts', 'quality']),
  timeRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  includeInsights: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
  qualityThresholds: z.object({
    excellent: z.number().min(0).max(1).default(0.9),
    good: z.number().min(0).max(1).default(0.8),
    fair: z.number().min(0).max(1).default(0.7),
    poor: z.number().min(0).max(1).default(0.6),
  }).optional(),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const AuditReportParamsSchema = z.object({
  fossils: z.array(z.any()).optional(), // Will be populated from query
  complianceChecks: z.array(z.enum(['apiKeySanitization', 'traceability', 'validation', 'quality'])).default(['apiKeySanitization', 'traceability', 'validation']),
  riskAssessment: z.boolean().default(true),
  qualityMetrics: z.boolean().default(true),
  coverageAnalysis: z.boolean().default(true),
  recommendations: z.boolean().default(true),
  timeRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  outputFormat: z.enum(['json', 'markdown', 'yaml']).default('markdown'),
  outputPath: z.string().optional(),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const QualityTrendParamsSchema = z.object({
  fossils: z.array(z.any()).optional(), // Will be populated from query
  timeRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum(['quality', 'success', 'cost', 'tokens'])).default(['quality', 'success']),
  includePredictions: z.boolean().default(false),
  includeTrends: z.boolean().default(true),
  outputFormat: z.enum(['json', 'markdown', 'chart']).default('json'),
  outputPath: z.string().optional(),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const WorkflowIntegrationParamsSchema = z.object({
  filePath: z.string().optional(),
  contextType: z.enum(['currentFile', 'workspace', 'repository']).default('currentFile'),
  integrationTypes: z.array(z.enum(['context', 'highlight', 'completion', 'navigation'])).default(['context', 'highlight']),
  fossilTypes: z.array(z.string()).default(['llm']),
  includeMetadata: z.boolean().default(true),
  includeValidation: z.boolean().default(true),
  limit: z.number().positive().max(50).default(10),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
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

// Track Progress CLI Schemas
export const TrackProgressCLIArgsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  mode: z.enum(['comprehensive', 'action-plan', 'health-only', 'automation-progress']).default('comprehensive'),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
  outputDir: z.string().default('.orchestration-reports'),
  trends: z.boolean().default(true),
  trigger: z.boolean().default(true),
  output: z.string().optional(),
});

export const TrackProgressStatusCLIArgsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
});

// Track Progress Schemas
export const TrackingConfigSchema = z.object({
  mode: z.enum(['comprehensive', 'action-plan', 'health-only', 'automation-progress']).default('comprehensive'),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
  outputDir: z.string().default('.orchestration-reports'),
  includeTrends: z.boolean().default(true),
  triggerNextSteps: z.boolean().default(true),
});

export const ProgressMetricsSchema = z.object({
  healthScore: z.number().min(0).max(100),
  actionPlanCompletion: z.number().min(0).max(100),
  automationCompletion: z.number().min(0).max(100),
  totalActionPlans: z.number(),
  completedActionPlans: z.number(),
  openActionPlans: z.number(),
  totalAutomationIssues: z.number(),
  completedAutomationIssues: z.number(),
  openAutomationIssues: z.number(),
  timestamp: z.string(),
});

export const TrendAnalysisSchema = z.object({
  trend: z.enum(['improving', 'declining', 'stable', 'insufficient_data']),
  firstScore: z.number().optional(),
  lastScore: z.number().optional(),
  improvement: z.number().optional(),
  dataPoints: z.number().optional(),
});

// Legacy schemas for backward compatibility
export const LegacyTrackingConfigSchema = z.object({
  interval: z.number(),
  notify: z.boolean().default(false),
});

export const LegacyProgressMetricsSchema = z.object({
  completed: z.number(),
  total: z.number(),
  percent: z.number(),
});

export const LegacyTrendAnalysisSchema = z.object({
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

// GitHub Issues CLI Schema
export const GitHubIssuesCLIArgsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required').default('BarreraSlzr'),
  repo: z.string().min(1, 'Repository name is required').default('automate_workloads'),
  state: z.enum(['open', 'closed', 'all']).default('open'),
  format: z.enum(['text', 'json', 'table']).default('text'),
  verbose: z.boolean().default(false),
});

// Update Checklist CLI Schemas
export const UpdateChecklistFileCLIArgsSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  updates: z.string().optional(),
  updatesFile: z.string().optional(),
  dryRun: z.boolean().default(false),
  backup: z.boolean().default(true),
});

export const UpdateChecklistBatchCLIArgsSchema = z.object({
  config: z.string().optional(),
  updates: z.string().optional(),
  dryRun: z.boolean().default(false),
  report: z.string().optional(),
});

export const UpdateChecklistRoadmapCLIArgsSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  task: z.string().min(1, 'Task name is required'),
  status: z.enum(['pending', 'ready', 'partial', 'done']),
  comment: z.string().optional(),
  dryRun: z.boolean().default(false),
});

// LLM Insights Export Schemas
export const LLMInsightExportSchema = z.object({
  format: z.enum(['json', 'yaml', 'markdown', 'csv', 'html']).default('json'),
  filters: z.object({
    type: z.enum(['insight', 'benchmark', 'discovery']).optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    model: z.string().optional(),
    provider: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  outputPath: z.string().optional(),
  includeMetadata: z.boolean().default(true),
  includeRawResponse: z.boolean().default(false),
});

// External Review Integration Schemas
export const ExternalReviewSchema = z.object({
  reviewId: z.string(),
  fossilId: z.string(),
  reviewer: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'needs_changes']),
  comments: z.array(z.object({
    id: z.string(),
    author: z.string(),
    content: z.string(),
    timestamp: z.string(),
    lineNumber: z.number().optional(),
  })),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReviewRequestSchema = z.object({
  fossilIds: z.array(z.string()),
  reviewers: z.array(z.string()),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  context: z.string().optional(),
  autoApprove: z.boolean().default(false),
});

// Task Matching Algorithm Schemas
export const TaskMatchingConfigSchema = z.object({
  algorithm: z.enum(['exact', 'fuzzy', 'semantic', 'hybrid']).default('hybrid'),
  similarityThreshold: z.number().min(0).max(1).default(0.8),
  maxResults: z.number().min(1).max(100).default(10),
  weights: z.object({
    title: z.number().min(0).max(1).default(0.4),
    content: z.number().min(0).max(1).default(0.3),
    tags: z.number().min(0).max(1).default(0.2),
    metadata: z.number().min(0).max(1).default(0.1),
  }).optional(),
  useLLM: z.boolean().default(true),
  llmModel: z.string().default('llama2'),
});

export const TaskMatchResultSchema = z.object({
  query: z.string(),
  matches: z.array(z.object({
    fossilId: z.string(),
    title: z.string(),
    type: z.string(),
    similarity: z.number(),
    confidence: z.number(),
    matchedFields: z.array(z.string()),
    metadata: z.record(z.any()).optional(),
  })),
  totalResults: z.number(),
  processingTime: z.number(),
  algorithm: z.string(),
});

// Batch Processing Schemas
export const BatchProcessingConfigSchema = z.object({
  batchSize: z.number().min(1).max(1000).default(50),
  maxConcurrency: z.number().min(1).max(20).default(5),
  retryAttempts: z.number().min(0).max(10).default(3),
  retryDelayMs: z.number().min(100).max(10000).default(1000),
  timeoutMs: z.number().min(1000).max(300000).default(30000),
  progressCallback: z.function().optional(),
  errorHandler: z.function().optional(),
});

export const BatchProcessingResultSchema = z.object({
  totalItems: z.number(),
  processedItems: z.number(),
  successfulItems: z.number(),
  failedItems: z.number(),
  skippedItems: z.number(),
  processingTime: z.number(),
  errors: z.array(z.object({
    itemId: z.string(),
    error: z.string(),
    retryCount: z.number(),
  })),
  results: z.array(z.record(z.any())),
});

// Git Diff Analysis Schemas
export const GitDiffAnalysisSchema = z.object({
  commitHash: z.string().optional(),
  filePatterns: z.array(z.string()).optional(),
  includeStaged: z.boolean().default(true),
  includeUnstaged: z.boolean().default(true),
  maxFiles: z.number().min(1).max(1000).default(100),
  analysisDepth: z.enum(['shallow', 'medium', 'deep']).default('medium'),
});

export const DiffAnalysisResultSchema = z.object({
  filesChanged: z.number(),
  linesAdded: z.number(),
  linesDeleted: z.number(),
  files: z.array(z.object({
    path: z.string(),
    status: z.enum(['modified', 'added', 'deleted', 'renamed']),
    linesAdded: z.number(),
    linesDeleted: z.number(),
    changeType: z.enum(['docs', 'code', 'config', 'test', 'other']),
    impact: z.enum(['low', 'medium', 'high', 'critical']),
    recommendations: z.array(z.string()),
  })),
  patterns: z.array(z.object({
    pattern: z.string(),
    count: z.number(),
    files: z.array(z.string()),
  })),
  insights: z.array(z.object({
    type: z.string(),
    description: z.string(),
    confidence: z.number(),
    recommendations: z.array(z.string()),
  })),
});

// Commit Message Analysis Schemas
export const CommitMessageAnalysisSchema = z.object({
  message: z.string(),
  conventionalFormat: z.boolean(),
  type: z.string().optional(),
  scope: z.string().optional(),
  description: z.string().optional(),
  body: z.string().optional(),
  footer: z.string().optional(),
  breakingChange: z.boolean().default(false),
  issues: z.array(z.string()).optional(),
  suggestions: z.array(z.string()),
  score: z.number().min(0).max(100),
});

// Missing schema exports (auto-generated for compatibility)
export const GitHubLabelListSchema = GitHubLabelCreateSchema;
export const GitHubMilestoneListSchema = GitHubMilestoneCreateSchema;
export const GitHubIssueEditSchema = GitHubIssueListSchema;
export const GitHubProjectSchema = z.object({ id: z.number(), name: z.string() });
export const GitHubAuthSchema = z.object({ token: z.string() });
export const CurateFossilParamsSchema = BaseFossilParamsSchema;
export const CreateFossilIssueParamsSchema = CreateFossilEntryParamsSchema;
export const CreateFossilLabelParamsSchema = CreateFossilEntryParamsSchema;
export const CreateFossilMilestoneParamsSchema = CreateFossilEntryParamsSchema;
export const DocPatternMatchSchema = z.object({
  pattern: z.string(),
  matches: z.array(z.object({
    file: z.string(),
    line: z.number(),
    content: z.string(),
    context: z.string(),
    relevance: z.number(),
  })),
  totalMatches: z.number(),
  patternType: z.enum(['code', 'docs', 'config', 'test']),
});

// Integration Schemas
export const IntegrationConfigSchema = z.object({
  type: z.enum(['github', 'slack', 'discord', 'email', 'webhook']),
  config: z.record(z.any()),
  enabled: z.boolean().default(true),
  webhookUrl: z.string().optional(),
  apiKey: z.string().optional(),
  channel: z.string().optional(),
  template: z.string().optional(),
});

export const IntegrationEventSchema = z.object({
  eventType: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  recipients: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

// ============================================================================
// ENHANCED COMMIT MESSAGE SYSTEM SCHEMAS
// ============================================================================

// Enhanced Pre-commit Validator Schemas
export const EnhancedCommitValidationParamsSchema = BaseCLIArgsSchema.extend({
  message: z.string().optional(),
  file: z.string().optional(),
  preCommit: z.boolean().default(false),
  strict: z.boolean().default(true),
});

export const CommitAuditParamsSchema = BaseCLIArgsSchema.extend({
  since: z.string().optional(),
  range: z.string().optional(),
  author: z.string().optional(),
  output: z.string().optional(),
});

export const CommitFixParamsSchema = BaseCLIArgsSchema.extend({
  commit: z.string(),
  autoFix: z.boolean().default(false),
  output: z.string().optional(),
});

export const CommitTrackingParamsSchema = BaseCLIArgsSchema.extend({
  since: z.string().optional(),
  output: z.string().optional(),
});

// Commit Message Template Schemas
export const CommitTemplateCreateParamsSchema = BaseCLIArgsSchema.extend({
  type: z.enum(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']),
  scope: z.string(),
  description: z.string(),
  body: z.string().optional(),
  llmInsightsRef: z.string().optional(),
  roadmapImpact: z.enum(['low', 'medium', 'high']).optional(),
  automationScope: z.array(z.string()).optional(),
  output: z.string().optional(),
  format: z.enum(['json', 'yaml']).default('json'),
});

export const CommitTemplateFromJsonParamsSchema = BaseCLIArgsSchema.extend({
  file: z.string(),
});

export const CommitTemplateToJsonParamsSchema = BaseCLIArgsSchema.extend({
  message: z.string(),
});

export const CommitTemplateValidateParamsSchema = BaseCLIArgsSchema.extend({
  file: z.string(),
});

export const CommitTemplateGenerateParamsSchema = BaseCLIArgsSchema.extend({
  type: z.enum(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']),
  scope: z.string(),
  description: z.string(),
  autoAnalyze: z.boolean().default(false),
  output: z.string().optional(),
});

// Commit Message Data Schemas
export const CommitMessageValidationSchema = z.object({
  conventionalFormat: z.boolean(),
  type: z.enum(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']).optional(),
  scope: z.string().optional(),
  description: z.string(),
  llmInsightsRef: z.string().optional(),
  roadmapImpact: z.enum(['low', 'medium', 'high']).optional(),
  automationScope: z.array(z.string()).optional(),
  breakingChange: z.boolean().default(false),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  score: z.number().min(0).max(100),
  valid: z.boolean(),
  metadataComplete: z.boolean(),
});

export const GitDiffDataSchema = z.object({
  filesChanged: z.number(),
  additions: z.number(),
  deletions: z.number(),
  changes: z.array(z.object({
    path: z.string(),
    status: z.enum(['added', 'modified', 'deleted', 'renamed']),
    additions: z.number(),
    deletions: z.number(),
  })),
});

export const FileChangeSchema = z.object({
  path: z.string(),
  status: z.enum(['added', 'modified', 'deleted', 'renamed']),
  additions: z.number(),
  deletions: z.number(),
});

export const LLMInsightDataSchema = z.object({
  summary: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  category: z.string(),
  blockers: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  automationOpportunities: z.array(z.string()).default([]),
  roadmapImpact: z.object({
    level: z.enum(['low', 'medium', 'high']),
    affectedTasks: z.array(z.string()).default([]),
    newTasks: z.array(z.string()).default([]),
    completedTasks: z.array(z.string()).default([]),
  }).optional(),
});

export const CommitFixSchema = z.object({
  type: z.enum(['add_llm_insights', 'add_roadmap_impact', 'add_automation_scope', 'fix_format', 'add_scope']),
  description: z.string(),
  suggestedMessage: z.string(),
  applied: z.boolean(),
  timestamp: z.string(),
});

export const CommitAuditDataSchema = z.object({
  hash: z.string(),
  author: z.string(),
  date: z.string(),
  message: z.string(),
  validation: CommitMessageValidationSchema,
  gitDiff: GitDiffDataSchema,
  llmInsights: LLMInsightDataSchema.optional(),
  fixes: z.array(CommitFixSchema).optional(),
  auditTimestamp: z.string(),
});

export const AuditReportSchema = z.object({
  period: z.object({
    start: z.string(),
    end: z.string(),
    totalCommits: z.number(),
  }),
  validation: z.object({
    valid: z.number(),
    invalid: z.number(),
    metadataComplete: z.number(),
    averageScore: z.number(),
  }),
  issues: z.object({
    missingLLMInsights: z.number(),
    missingRoadmapImpact: z.number(),
    missingAutomationScope: z.number(),
    invalidFormat: z.number(),
    missingScope: z.number(),
  }),
  fixes: z.object({
    applied: z.number(),
    suggested: z.number(),
    total: z.number(),
  }),
  commits: z.array(CommitAuditDataSchema),
  recommendations: z.array(z.string()),
});

export const CommitMessageTemplateSchema = z.object({
  metadata: z.object({
    version: z.string().default('1.0.0'),
    templateId: z.string(),
    createdAt: z.string(),
    author: z.string(),
    validator: z.string().default('enhanced-pre-commit-validator'),
  }),
  commit: z.object({
    type: z.enum(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']),
    scope: z.string(),
    description: z.string().min(5).max(72),
    body: z.string().optional(),
    footer: z.string().optional(),
    breakingChange: z.boolean().default(false),
    issues: z.array(z.string()).default([]),
  }),
  llmInsights: z.object({
    reference: z.string(),
    summary: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    category: z.string(),
    blockers: z.array(z.string()).default([]),
    recommendations: z.array(z.string()).default([]),
    automationOpportunities: z.array(z.string()).default([]),
    roadmapImpact: z.object({
      level: z.enum(['low', 'medium', 'high']),
      affectedTasks: z.array(z.string()).default([]),
      newTasks: z.array(z.string()).default([]),
      completedTasks: z.array(z.string()).default([]),
    }),
    automationScope: z.array(z.string()).min(1),
  }),
  audit: z.object({
    timestamp: z.string(),
    score: z.number().min(0).max(100),
    valid: z.boolean(),
    metadataComplete: z.boolean(),
    suggestions: z.array(z.string()).default([]),
  }),
});

// Git Diff Analysis CLI Parameters
export const GitDiffAnalysisParamsSchema = z.object({
  commitHash: z.string().optional(),
  includeStaged: z.boolean().optional(),
  includeUnstaged: z.boolean().optional(),
  maxFiles: z.number().optional(),
  analysisDepth: z.enum(['shallow', 'medium', 'deep']).optional(),
  format: z.enum(['json', 'text', 'table']).optional(),
  output: z.string().optional(),
  batch: z.boolean().optional(),
  batchSize: z.number().optional(),
  help: z.boolean().optional(),
  h: z.boolean().optional()
});

// Issues Create CLI Parameters
export const IssuesCreateParamsSchema = z.object({
  purpose: z.string().optional(),
  checklist: z.string().optional(),
  metadata: z.string().optional(),
  debug: z.boolean().optional()
});

// Validation Result Schema
export const ValidationResultSchema = z.object({
  timestamp: z.string(),
  commit_hash: z.string(),
  branch: z.string(),
  author: z.string(),
  email: z.string(),
  validation_steps: z.array(z.object({
    step: z.string(),
    status: z.enum(['pass', 'fail']),
    duration_ms: z.number().optional(),
    errors: z.array(z.string()).optional(),
  })),
  summary: z.object({
    total_steps: z.number(),
    passed_steps: z.number(),
    failed_steps: z.number(),
    overall_status: z.enum(['pass', 'fail']),
  }),
});

// Fossil Summary Schema
export const FossilSummarySchema = z.object({
  timestamp: z.string(),
  total_fossils: z.number(),
  fossil_categories: z.record(z.number()),
  recent_fossils: z.array(z.object({
    category: z.string(),
    filename: z.string(),
    timestamp: z.string(),
  })),
  summary: z.object({
    validation_fossils: z.number(),
    performance_fossils: z.number(),
    llm_insights_fossils: z.number(),
    other_fossils: z.number(),
  }),
});

// CLI Configuration Schema
export const CLIConfigSchema = z.object({
  logDir: z.string().optional(),
  logFile: z.string().optional(),
  summaryFile: z.string().optional(),
  reportFile: z.string().optional(),
  verbose: z.boolean().optional(),
  timeout: z.number().optional(),
  captureOutput: z.boolean().optional(),
});

// Performance Result Schema
export const PerformanceResultSchema = z.object({
  timestamp: z.string(),
  commit_hash: z.string(),
  branch: z.string(),
  author: z.string(),
  email: z.string(),
  performance_data: z.array(z.object({
    script: z.string(),
    execution_time: z.number(),
    memory_usage: z.number(),
    cpu_usage: z.number(),
    exit_code: z.number(),
    output_summary: z.string(),
  })),
  summary: z.object({
    total_scripts: z.number(),
    avg_execution_time: z.number(),
    total_memory_usage: z.number(),
    performance_status: z.enum(['pass', 'fail', 'warning']),
  }),
});

// Timestamp Filter CLI Parameters
export const TimestampFilterParamsSchema = z.object({
  check: z.boolean().optional(),
  createHook: z.boolean().optional(),
  verbose: z.boolean().optional(),
  ignoreTimestampOnly: z.boolean().optional(),
});

// Timestamp Filter CLI Parameters (for CLI file)
export const TimestampFilterCLIParamsSchema = z.object({
  check: z.boolean().optional(),
  createHook: z.boolean().optional(),
  verbose: z.boolean().optional(),
  skipIfOnly: z.boolean().optional(),
  help: z.boolean().optional(),
  h: z.boolean().optional(),
});

// ============================================================================
// VS CODE AI INTEGRATION SCHEMAS
// ============================================================================

export const VSCodeAIConfigSchema = z.object({
  provider: z.enum(['copilot', 'claude', 'auto']).default('auto').describe('VS Code AI provider to use'),
  enabled: z.boolean().default(true).describe('Whether to enable VS Code AI integration'),
  vscodePath: z.string().optional().describe('Path to VS Code executable'),
  workspacePath: z.string().optional().describe('Workspace folder to use'),
  useChatInterface: z.boolean().default(true).describe('Whether to use VS Code chat interface'),
  useCommandPalette: z.boolean().default(true).describe('Whether to use VS Code command palette'),
  timeout: z.number().min(1000).max(300000).default(30000).describe('Timeout for VS Code AI calls (ms)'),
  enableFossilization: z.boolean().default(true).describe('Whether to fossilize VS Code AI interactions'),
  fossilStoragePath: z.string().default('fossils/vscode_ai/').describe('Fossil storage path for VS Code AI interactions'),
  enableSnapshotProcessing: z.boolean().default(true).describe('Whether to enable snapshot processing through VS Code AI'),
  enableDirectCalls: z.boolean().default(true).describe('Whether to enable direct LLM calls through VS Code AI'),
  customCommands: z.object({
    chat: z.string().optional().describe('Custom chat command'),
    analyze: z.string().optional().describe('Custom analyze command'),
    explain: z.string().optional().describe('Custom explain command'),
    generate: z.string().optional().describe('Custom generate command')
  }).optional().describe('Custom VS Code commands for AI interaction')
});

export const VSCodeAIProviderSchema = z.object({
  name: z.string().describe('Provider name'),
  isAvailable: z.function().describe('Function to check provider availability'),
  call: z.function().describe('Function to make AI calls'),
  processSnapshot: z.function().describe('Function to process snapshots'),
  estimateTokens: z.function().describe('Function to estimate tokens'),
  estimateCost: z.function().describe('Function to estimate cost')
});

export const VSCodeAICallParamsSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']).describe('Message role'),
    content: z.string().describe('Message content')
  })).describe('Messages to send to AI'),
  model: z.string().optional().describe('AI model to use'),
  temperature: z.number().min(0).max(2).optional().describe('Temperature for AI response'),
  maxTokens: z.number().min(1).max(100000).optional().describe('Maximum tokens for response'),
  context: z.string().optional().describe('Context for the call'),
  purpose: z.string().optional().describe('Purpose of the call'),
  valueScore: z.number().min(0).max(1).default(0.8).describe('Value score for the call'),
  useChat: z.boolean().default(true).describe('Whether to use chat interface'),
  useCommandPalette: z.boolean().default(false).describe('Whether to use command palette')
});

export const VSCodeAISnapshotParamsSchema = z.object({
  snapshotPath: z.string().describe('Path to the snapshot file to process'),
  analysisType: z.enum(['summary', 'insights', 'recommendations', 'audit']).describe('Type of analysis to perform'),
  context: z.string().optional().describe('Context for the analysis'),
  purpose: z.string().optional().describe('Purpose of the analysis'),
  valueScore: z.number().min(0).max(1).default(0.8).describe('Value score for the analysis')
});

export const VSCodeAIResponseSchema = z.object({
  content: z.string().describe('AI response content'),
  model: z.string().describe('AI model used'),
  provider: z.string().describe('AI provider used'),
  tokens: z.number().describe('Number of tokens used'),
  cost: z.number().describe('Cost of the call'),
  duration: z.number().describe('Duration of the call (ms)'),
  metadata: z.object({
    callId: z.string().describe('Unique call identifier'),
    inputHash: z.string().describe('Input hash for deduplication'),
    sessionId: z.string().describe('Session identifier'),
    timestamp: z.string().describe('Call timestamp'),
    success: z.boolean().describe('Whether the call was successful'),
    error: z.string().optional().describe('Error message if call failed')
  }).describe('Call metadata')
});

export const VSCodeAIFossilSchema = z.object({
  id: z.string().describe('Fossil identifier'),
  type: z.enum(['vscode-ai-call', 'vscode-ai-snapshot']).describe('Type of VS Code AI interaction'),
  timestamp: z.string().describe('Interaction timestamp'),
  provider: z.string().describe('AI provider used'),
  model: z.string().describe('AI model used'),
  input: z.union([VSCodeAICallParamsSchema, VSCodeAISnapshotParamsSchema]).describe('Input to the AI'),
  response: VSCodeAIResponseSchema.describe('AI response'),
  metadata: z.object({
    workspacePath: z.string().describe('VS Code workspace path'),
    fileContext: z.string().optional().describe('Current file context'),
    gitBranch: z.string().optional().describe('Current git branch'),
    gitCommit: z.string().optional().describe('Current git commit')
  }).describe('Additional metadata')
});

// ============================================================================
// END OF SCHEMA REGISTRY
// ============================================================================

/**
 * SchemasTree: Bill of Materials (BOM) for all Zod schemas in this file.
 * Organized by conceptual section for discoverability, tooling, and automation.
 *
 * Usage: For introspection, documentation, or programmatic schema access.
 * Example: SchemasTree['FossilManager'].BaseFossilParamsSchema
 *
 * Sections:
 *   - FossilManager: Base fossil parameters and GitHub object creation schemas
 *   - LLMInputValidator: LLM input validation and message schemas
 *   - LLMFossilManager: LLM fossil management and session schemas
 *   - VisualDiagramGenerator: Diagram generation and visual documentation schemas
 *   - LLMPredictiveMonitoring: LLM monitoring, metrics, and risk assessment schemas
 *   - CLI: Command-line interface argument validation schemas
 *   - SnapshotProcessing: LLM snapshot analysis and export schemas
 *   - Env: Environment configuration schemas
 *   - ContextFossil: Context entry and query schemas
 *   - PlanValidator: Task, milestone, and plan validation schemas
 *   - RepoOrchestrator: Repository configuration and analysis schemas
 *   - LLMPlan: LLM planning and task breakdown schemas
 *   - TrackProgress: Progress tracking and metrics schemas
 *   - GitHubFossilsCLI: GitHub fossil automation CLI schemas
 *   - ProjectStatus: Project status analysis and reporting schemas
 *   - Usage: Usage reporting and optimization schemas
 *   - FossilIssue: Fossil issue management schemas
 *   - GitHubIssuesCLI: GitHub issues CLI schemas
 *   - UpdateChecklistCLI: Checklist update CLI schemas
 *   - LLMInsightsExport: LLM insights export schemas
 *   - ExternalReview: External review and collaboration schemas
 *   - TaskMatching: Task matching and similarity schemas
 *   - BatchProcessing: Batch processing configuration and result schemas
 *   - GitDiffAnalysis: Git diff analysis and commit message schemas
 *   - CommitMessageAnalysis: Commit message validation and analysis schemas
 *   - DocPatternMatch: Documentation pattern matching schemas
 *   - Integration: Integration configuration and event schemas
 *   - EnhancedCommitMessageSystem: Enhanced commit message validation and template schemas
 *   - VSCodeAIIntegration: VS Code AI integration and fossil schemas
 */
export const SchemasTree = {
  /**
   * FossilManager: Base fossil parameters and GitHub object creation schemas.
   * - BaseFossilParamsSchema: Base parameters for all fossil operations
   * - IssueFossilParamsSchema: GitHub issue creation with fossil backing
   * - LabelFossilParamsSchema: GitHub label creation with fossil backing
   * - MilestoneFossilParamsSchema: GitHub milestone creation with fossil backing
   */
  FossilManager: {
    BaseFossilParamsSchema,
    IssueFossilParamsSchema,
    LabelFossilParamsSchema,
    MilestoneFossilParamsSchema,
  },
  /**
   * LLMInputValidator: LLM input validation and message schemas.
   * - MessageSchema: LLM message structure validation
   * - LLMInputSchema: Complete LLM input validation with all parameters
   */
  LLMInputValidator: {
    MessageSchema,
    LLMInputSchema,
  },
  /**
   * LLMFossilManager: LLM fossil management and session schemas.
   * - LLMFossilManagerParamsSchema: Parameters for LLM fossil management
   */
  LLMFossilManager: {
    LLMFossilManagerParamsSchema,
  },
  /**
   * VisualDiagramGenerator: Diagram generation and visual documentation schemas.
   * - WorkflowStepSchema: Workflow step definition for diagrams
   * - ComponentSchema: Component definition for architecture diagrams
   * - RiskSchema: Risk assessment for risk diagrams
   * - DependencySchema: Dependency definition for dependency diagrams
   */
  VisualDiagramGenerator: {
    WorkflowStepSchema,
    ComponentSchema,
    RiskSchema,
    DependencySchema,
  },
  /**
   * LLMPredictiveMonitoring: LLM monitoring, metrics, and risk assessment schemas.
   * - LLMPredictiveMonitoringConfigSchema: Monitoring configuration
   * - LLMPredictiveMetricsSchema: Comprehensive LLM metrics
   * - LLMContextAnalysisSchema: Context analysis results
   * - LLMRiskAssessmentSchema: Risk assessment and mitigation
   * - LLMPredictiveAlertSchema: Alert and notification schemas
   */
  LLMPredictiveMonitoring: {
    LLMPredictiveMonitoringConfigSchema,
    LLMPredictiveMetricsSchema,
    LLMContextAnalysisSchema,
    LLMRiskAssessmentSchema,
    LLMPredictiveAlertSchema,
  },
  /**
   * CLI: Command-line interface argument validation schemas.
   * - BaseCLIArgsSchema: Base CLI arguments (dryRun, verbose, etc.)
   * - FossilCLIArgsSchema: Fossil-specific CLI arguments
   * - GitHubCLIArgsSchema: GitHub-specific CLI arguments
   * - RoadmapCLIArgsSchema: Roadmap-specific CLI arguments
   * - GitHubIssueCreateSchema: GitHub issue creation CLI arguments
   * - GitHubMilestoneCreateSchema: GitHub milestone creation CLI arguments
   * - GitHubLabelCreateSchema: GitHub label creation CLI arguments
   * - GitHubIssueViewSchema: GitHub issue viewing CLI arguments
   * - GitHubIssueListSchema: GitHub issue listing CLI arguments
   */
  CLI: {
    BaseCLIArgsSchema,
    FossilCLIArgsSchema,
    GitHubCLIArgsSchema,
    RoadmapCLIArgsSchema,
    GitHubIssueCreateSchema,
    GitHubMilestoneCreateSchema,
    GitHubLabelCreateSchema,
    GitHubIssueViewSchema,
    GitHubIssueListSchema,
  },
  /**
   * SnapshotProcessing: LLM snapshot analysis and export schemas.
   * - SnapshotAnalysisParamsSchema: Snapshot analysis parameters
   * - SnapshotExportParamsSchema: Snapshot export parameters
   * - FossilBrowserParamsSchema: Fossil browser parameters
   * - PatternAnalysisParamsSchema: Pattern analysis parameters
   * - AuditReportParamsSchema: Audit report parameters
   * - QualityTrendParamsSchema: Quality trend analysis parameters
   * - WorkflowIntegrationParamsSchema: Workflow integration parameters
   */
  SnapshotProcessing: {
    SnapshotAnalysisParamsSchema,
    SnapshotExportParamsSchema,
    FossilBrowserParamsSchema,
    PatternAnalysisParamsSchema,
    AuditReportParamsSchema,
    QualityTrendParamsSchema,
    WorkflowIntegrationParamsSchema,
  },
  /**
   * Env: Environment configuration schemas.
   * - envSchema: Environment variables validation
   */
  Env: {
    envSchema,
  },
  /**
   * ContextFossil: Context entry and query schemas.
   * - ContextEntrySchema: Context entry structure validation
   * - ContextQuerySchema: Context query parameters validation
   */
  ContextFossil: {
    ContextEntrySchema,
    ContextQuerySchema,
  },
  /**
   * PlanValidator: Task, milestone, and plan validation schemas.
   * - TaskSchema: Task definition validation
   * - MilestoneSchema: Milestone definition validation
   * - TimelineSchema: Timeline definition validation
   * - PlanSchema: Complete plan validation
   */
  PlanValidator: {
    TaskSchema,
    MilestoneSchema,
    TimelineSchema,
    PlanSchema,
  },
  /**
   * RepoOrchestrator: Repository configuration and analysis schemas.
   * - RepoConfigSchema: Repository configuration validation
   * - RepoAnalysisSchema: Repository analysis results validation
   */
  RepoOrchestrator: {
    RepoConfigSchema,
    RepoAnalysisSchema,
  },
  /**
   * LLMPlan: LLM planning and task breakdown schemas.
   * - PlanRequestSchema: LLM plan request validation
   * - TaskBreakdownSchema: Task breakdown and timeline validation
   */
  LLMPlan: {
    PlanRequestSchema,
    TaskBreakdownSchema,
  },
  /**
   * TrackProgress: Progress tracking and metrics schemas.
   * - TrackProgressCLIArgsSchema: Progress tracking CLI arguments
   * - TrackProgressStatusCLIArgsSchema: Progress status CLI arguments
   * - TrackingConfigSchema: Progress tracking configuration
   * - ProgressMetricsSchema: Progress metrics validation
   * - TrendAnalysisSchema: Trend analysis validation
   * - LegacyTrackingConfigSchema: Legacy tracking configuration
   * - LegacyProgressMetricsSchema: Legacy progress metrics
   * - LegacyTrendAnalysisSchema: Legacy trend analysis
   */
  TrackProgress: {
    TrackProgressCLIArgsSchema,
    TrackProgressStatusCLIArgsSchema,
    TrackingConfigSchema,
    ProgressMetricsSchema,
    TrendAnalysisSchema,
    LegacyTrackingConfigSchema,
    LegacyProgressMetricsSchema,
    LegacyTrendAnalysisSchema,
  },
  /**
   * GitHubFossilsCLI: GitHub fossil automation CLI schemas.
   * - CreateCommandSchema: GitHub fossil creation command parameters
   */
  GitHubFossilsCLI: {
    CreateCommandSchema,
  },
  /**
   * ProjectStatus: Project status analysis and reporting schemas.
   * - UpdateProjectStatusParamsSchema: Project status update parameters
   * - ClassInfoSchema: Class information validation
   * - FunctionInfoSchema: Function information validation
   * - CliCommandSchema: CLI command structure validation
   * - FileAnalysisSchema: File analysis results validation
   * - DirectoryScanSchema: Directory scan results validation
   * - TestMappingSchema: Test mapping validation
   * - FileEntrySchema: File entry structure validation
   * - ModuleFileSchema: Module file structure validation
   * - ModuleSchema: Module structure validation
   * - ModulesSchema: Modules structure validation
   * - OverallSummarySchema: Overall summary validation
   * - FossilizationSummarySchema: Fossilization summary validation
   * - CliEntrySchema: CLI entry structure validation
   * - UtilsEntrySchema: Utils entry structure validation
   * - ServicesEntrySchema: Services entry structure validation
   * - ExamplesEntrySchema: Examples entry structure validation
   * - DeveloperSummarySchema: Developer summary validation
   * - ProjectStatusSchema: Complete project status validation
   */
  ProjectStatus: {
    UpdateProjectStatusParamsSchema,
    ClassInfoSchema,
    FunctionInfoSchema,
    CliCommandSchema,
    FileAnalysisSchema,
    DirectoryScanSchema,
    TestMappingSchema,
    FileEntrySchema,
    ModuleFileSchema,
    ModuleSchema,
    ModulesSchema,
    OverallSummarySchema,
    FossilizationSummarySchema,
    CliEntrySchema,
    UtilsEntrySchema,
    ServicesEntrySchema,
    ExamplesEntrySchema,
    DeveloperSummarySchema,
    ProjectStatusSchema,
  },
  /**
   * Usage: Usage reporting and optimization schemas.
   * - UsageReportSchema: Usage report validation
   * - OptimizationConfigSchema: Optimization configuration validation
   */
  Usage: {
    UsageReportSchema,
    OptimizationConfigSchema,
  },
  /**
   * FossilIssue: Fossil issue management schemas.
   * - CheckExistingFossilParamsSchema: Check existing fossil parameters
   * - CreateFossilEntryParamsSchema: Create fossil entry parameters
   */
  FossilIssue: {
    CheckExistingFossilParamsSchema,
    CreateFossilEntryParamsSchema,
  },
  /**
   * GitHubIssuesCLI: GitHub issues CLI schemas.
   * - GitHubIssuesCLIArgsSchema: GitHub issues CLI arguments
   */
  GitHubIssuesCLI: {
    GitHubIssuesCLIArgsSchema,
  },
  /**
   * UpdateChecklistCLI: Checklist update CLI schemas.
   * - UpdateChecklistFileCLIArgsSchema: Update checklist file CLI arguments
   * - UpdateChecklistBatchCLIArgsSchema: Update checklist batch CLI arguments
   * - UpdateChecklistRoadmapCLIArgsSchema: Update checklist roadmap CLI arguments
   */
  UpdateChecklistCLI: {
    UpdateChecklistFileCLIArgsSchema,
    UpdateChecklistBatchCLIArgsSchema,
    UpdateChecklistRoadmapCLIArgsSchema,
  },
  /**
   * LLMInsightsExport: LLM insights export schemas.
   * - LLMInsightExportSchema: LLM insight export parameters
   */
  LLMInsightsExport: {
    LLMInsightExportSchema,
  },
  /**
   * ExternalReview: External review and collaboration schemas.
   * - ExternalReviewSchema: External review structure validation
   * - ReviewRequestSchema: Review request parameters validation
   */
  ExternalReview: {
    ExternalReviewSchema,
    ReviewRequestSchema,
  },
  /**
   * TaskMatching: Task matching and similarity schemas.
   * - TaskMatchingConfigSchema: Task matching configuration
   * - TaskMatchResultSchema: Task matching results validation
   */
  TaskMatching: {
    TaskMatchingConfigSchema,
    TaskMatchResultSchema,
  },
  /**
   * BatchProcessing: Batch processing configuration and result schemas.
   * - BatchProcessingConfigSchema: Batch processing configuration
   * - BatchProcessingResultSchema: Batch processing results validation
   */
  BatchProcessing: {
    BatchProcessingConfigSchema,
    BatchProcessingResultSchema,
  },
  /**
   * GitDiffAnalysis: Git diff analysis and commit message schemas.
   * - GitDiffAnalysisSchema: Git diff analysis parameters
   * - DiffAnalysisResultSchema: Git diff analysis results validation
   */
  GitDiffAnalysis: {
    GitDiffAnalysisSchema,
    DiffAnalysisResultSchema,
  },
  /**
   * CommitMessageAnalysis: Commit message validation and analysis schemas.
   * - CommitMessageAnalysisSchema: Commit message analysis validation
   */
  CommitMessageAnalysis: {
    CommitMessageAnalysisSchema,
  },
  /**
   * DocPatternMatch: Documentation pattern matching schemas.
   * - DocPatternMatchSchema: Documentation pattern matching validation
   */
  DocPatternMatch: {
    DocPatternMatchSchema,
  },
  /**
   * Integration: Integration configuration and event schemas.
   * - IntegrationConfigSchema: Integration configuration validation
   * - IntegrationEventSchema: Integration event validation
   */
  Integration: {
    IntegrationConfigSchema,
    IntegrationEventSchema,
  },
  /**
   * EnhancedCommitMessageSystem: Enhanced commit message validation and template schemas.
   * - EnhancedCommitValidationParamsSchema: Enhanced commit validation parameters
   * - CommitAuditParamsSchema: Commit audit parameters
   * - CommitFixParamsSchema: Commit fix parameters
   * - CommitTrackingParamsSchema: Commit tracking parameters
   * - CommitTemplateCreateParamsSchema: Commit template creation parameters
   * - CommitTemplateFromJsonParamsSchema: Commit template from JSON parameters
   * - CommitTemplateToJsonParamsSchema: Commit template to JSON parameters
   * - CommitTemplateValidateParamsSchema: Commit template validation parameters
   * - CommitTemplateGenerateParamsSchema: Commit template generation parameters
   * - CommitMessageValidationSchema: Commit message validation structure
   * - GitDiffDataSchema: Git diff data validation
   * - FileChangeSchema: File change validation
   * - LLMInsightDataSchema: LLM insight data validation
   * - CommitFixSchema: Commit fix structure validation
   * - CommitAuditDataSchema: Commit audit data validation
   * - AuditReportSchema: Audit report validation
   * - CommitMessageTemplateSchema: Commit message template validation
   */
  EnhancedCommitMessageSystem: {
    EnhancedCommitValidationParamsSchema,
    CommitAuditParamsSchema,
    CommitFixParamsSchema,
    CommitTrackingParamsSchema,
    CommitTemplateCreateParamsSchema,
    CommitTemplateFromJsonParamsSchema,
    CommitTemplateToJsonParamsSchema,
    CommitTemplateValidateParamsSchema,
    CommitTemplateGenerateParamsSchema,
    CommitMessageValidationSchema,
    GitDiffDataSchema,
    FileChangeSchema,
    LLMInsightDataSchema,
    CommitFixSchema,
    CommitAuditDataSchema,
    AuditReportSchema,
    CommitMessageTemplateSchema,
  },
  /**
   * VSCodeAIIntegration: VS Code AI integration and fossil schemas.
   * - VSCodeAIConfigSchema: VS Code AI configuration validation
   * - VSCodeAIProviderSchema: VS Code AI provider validation
   * - VSCodeAICallParamsSchema: VS Code AI call parameters
   * - VSCodeAISnapshotParamsSchema: VS Code AI snapshot parameters
   * - VSCodeAIResponseSchema: VS Code AI response validation
   * - VSCodeAIFossilSchema: VS Code AI fossil validation
   */
  VSCodeAIIntegration: {
    VSCodeAIConfigSchema,
    VSCodeAIProviderSchema,
    VSCodeAICallParamsSchema,
    VSCodeAISnapshotParamsSchema,
    VSCodeAIResponseSchema,
    VSCodeAIFossilSchema,
  },
}; 