// scripts/precommit-validate.ts
// Pre-commit validation script for the automation ecosystem
// Ensures scripts share logic from src/utils/, validates staged files with Zod schemas, 
// enforces type and schema patterns, lints for deprecated patterns, and enforces Conventional Commits format.
// Usage: bun run scripts/precommit-validate.ts (add as a git pre-commit hook)

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import {
  // Core schemas
  BaseCLIArgsSchema,
  FossilCLIArgsSchema,
  GitHubCLIArgsSchema,
  RoadmapCLIArgsSchema,
  
  // GitHub operation schemas
  GitHubIssueCreateSchema,
  GitHubMilestoneCreateSchema,
  GitHubLabelCreateSchema,
  GitHubIssueViewSchema,
  GitHubIssueListSchema,
  GitHubLabelListSchema,
  GitHubMilestoneListSchema,
  GitHubIssueEditSchema,
  GitHubProjectSchema,
  GitHubAuthSchema,
  
  // Fossil operation schemas
  CurateFossilParamsSchema,
  CreateFossilIssueParamsSchema,
  CreateFossilLabelParamsSchema,
  CreateFossilMilestoneParamsSchema,
  CheckExistingFossilParamsSchema,
  CreateFossilEntryParamsSchema,
  
  // Project status schemas
  UpdateProjectStatusParamsSchema,
  
  // Context schemas
  ContextEntrySchema,
  ContextQuerySchema,
  
  // Plan schemas
  PlanSchema,
  TaskSchema,
  MilestoneSchema,
  RiskSchema,
  
  // LLM schemas
  LLMInsightExportSchema,
  PlanRequestSchema,
  TaskBreakdownSchema,
  
  // Tracking schemas
  TrackingConfigSchema,
  ProgressMetricsSchema,
  TrendAnalysisSchema,
  
  // Analysis schemas
  GitDiffAnalysisSchema,
  DiffAnalysisResultSchema,
  CommitMessageAnalysisSchema,
  DocPatternMatchSchema,
  
  // Integration schemas
  IntegrationConfigSchema,
  IntegrationEventSchema,
  
  // Batch processing schemas
  BatchProcessingConfigSchema,
  BatchProcessingResultSchema,
  
  // Task matching schemas
  TaskMatchingConfigSchema,
  TaskMatchResultSchema,
  
  // Review schemas
  ExternalReviewSchema,
  ReviewRequestSchema,
  
  // Usage and optimization schemas
  UsageReportSchema,
  OptimizationConfigSchema,
} from "../src/types/schemas";

// Type and schema validation registry
const SCHEMA_REGISTRY = {
  // CLI argument schemas
  cli: {
    base: BaseCLIArgsSchema,
    fossil: FossilCLIArgsSchema,
    github: GitHubCLIArgsSchema,
    roadmap: RoadmapCLIArgsSchema,
  },
  
  // GitHub operation schemas
  github: {
    issueCreate: GitHubIssueCreateSchema,
    milestoneCreate: GitHubMilestoneCreateSchema,
    labelCreate: GitHubLabelCreateSchema,
    issueView: GitHubIssueViewSchema,
    issueList: GitHubIssueListSchema,
    labelList: GitHubLabelListSchema,
    milestoneList: GitHubMilestoneListSchema,
    issueEdit: GitHubIssueEditSchema,
    project: GitHubProjectSchema,
    auth: GitHubAuthSchema,
  },
  
  // Fossil operation schemas
  fossil: {
    curate: CurateFossilParamsSchema,
    createIssue: CreateFossilIssueParamsSchema,
    createLabel: CreateFossilLabelParamsSchema,
    createMilestone: CreateFossilMilestoneParamsSchema,
    checkExisting: CheckExistingFossilParamsSchema,
    createEntry: CreateFossilEntryParamsSchema,
  },
  
  // Project schemas
  project: {
    updateStatus: UpdateProjectStatusParamsSchema,
  },
  
  // Context schemas
  context: {
    entry: ContextEntrySchema,
    query: ContextQuerySchema,
  },
  
  // Plan schemas
  plan: {
    plan: PlanSchema,
    task: TaskSchema,
    milestone: MilestoneSchema,
    risk: RiskSchema,
    request: PlanRequestSchema,
    breakdown: TaskBreakdownSchema,
  },
  
  // LLM schemas
  llm: {
    insightExport: LLMInsightExportSchema,
  },
  
  // Tracking schemas
  tracking: {
    config: TrackingConfigSchema,
    metrics: ProgressMetricsSchema,
    trend: TrendAnalysisSchema,
  },
  
  // Analysis schemas
  analysis: {
    gitDiff: GitDiffAnalysisSchema,
    diffResult: DiffAnalysisResultSchema,
    commitMessage: CommitMessageAnalysisSchema,
    docPattern: DocPatternMatchSchema,
  },
  
  // Integration schemas
  integration: {
    config: IntegrationConfigSchema,
    event: IntegrationEventSchema,
  },
  
  // Batch processing schemas
  batch: {
    config: BatchProcessingConfigSchema,
    result: BatchProcessingResultSchema,
  },
  
  // Task matching schemas
  matching: {
    config: TaskMatchingConfigSchema,
    result: TaskMatchResultSchema,
  },
  
  // Review schemas
  review: {
    external: ExternalReviewSchema,
    request: ReviewRequestSchema,
  },
  
  // Usage schemas
  usage: {
    report: UsageReportSchema,
    optimization: OptimizationConfigSchema,
  },
};

// 1. Get staged files
const staged = execSync("git diff --cached --name-only").toString().split("\n").filter(Boolean);

console.log("🔍 Pre-commit validation starting...");
console.log(`📁 Staged files: ${staged.length}`);

// 2. Ensure all scripts in scripts/ share logic from src/utils/
const scriptFiles = staged.filter(f => f.startsWith("scripts/") && f.endsWith(".ts"));
let scriptUtilCheckFailed = false;
for (const file of scriptFiles) {
  const content = readFileSync(file, "utf-8");
  if (!content.match(/from ['\"](\.\.\/)?utils\//) && !content.match(/from ['\"]@\/utils\//)) {
    console.error(`❌ ${file} does not import from src/utils/. All scripts should share logic from utilities.`);
    scriptUtilCheckFailed = true;
  }
}
if (scriptUtilCheckFailed) process.exit(1);

// 3. Enhanced schema validation for all file types
console.log("🔧 Validating schemas...");
let schemaValidationFailed = false;

for (const file of staged) {
  if (!existsSync(file)) continue;
  
  try {
    const content = readFileSync(file, "utf-8");
    let data: any;
    
    // Parse based on file type
    if (file.endsWith(".json")) {
      data = JSON.parse(content);
    } else if (file.endsWith(".yml") || file.endsWith(".yaml")) {
      const yaml = await import("js-yaml");
      data = yaml.load(content);
    } else {
      continue; // Skip non-data files
    }
    
    // Determine appropriate schema based on file path and content
    const schema = determineSchemaForFile(file, data);
    if (schema) {
      schema.parse(data);
      console.log(`✅ ${file} passed schema validation (${schema.description || 'unknown schema'})`);
    }
  } catch (e: any) {
    console.error(`❌ Schema validation failed for ${file}:`, e.errors || e.message);
    schemaValidationFailed = true;
  }
}

if (schemaValidationFailed) process.exit(1);

// 4. Type pattern validation
console.log("🔍 Validating type patterns...");
let typePatternFailed = false;

for (const file of staged) {
  if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
  
  const content = readFileSync(file, "utf-8");
  
  // Check for PARAMS OBJECT PATTERN compliance
  if (content.includes("function") || content.includes("class")) {
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)/g) || [];
    const classMethodMatches = content.match(/\w+\s*\([^)]*\)\s*\{/g) || [];
    
    for (const match of [...functionMatches, ...classMethodMatches]) {
      // Check if function has multiple parameters (should use Params object)
      const params = match.match(/\(([^)]*)\)/)?.[1] || "";
      const paramCount = params.split(",").filter(p => p.trim()).length;
      
      if (paramCount > 2 && !params.includes("Params") && !params.includes("params")) {
        console.error(`❌ Function in ${file} has multiple parameters but doesn't use Params object pattern: ${match}`);
        typePatternFailed = true;
      }
    }
  }
  
  // Check for proper Zod schema usage
  if (content.includes("z.object") || content.includes("z.enum")) {
    if (!content.includes("import") || !content.includes("zod")) {
      console.error(`❌ ${file} uses Zod schemas but doesn't import from schemas registry`);
      typePatternFailed = true;
    }
  }
  
  // Check for proper type imports
  if (content.includes("interface") || content.includes("type")) {
    if (content.includes("export interface") || content.includes("export type")) {
      // Check if it's in the right location
      if (file.startsWith("src/") && !file.startsWith("src/types/")) {
        console.error(`❌ ${file} defines types but should be in src/types/`);
        typePatternFailed = true;
      }
    }
  }
}

if (typePatternFailed) process.exit(1);

// 5. Enhanced linting for deprecated patterns
console.log("🚫 Checking for deprecated patterns...");
const badPatterns = [
  // Direct CLI calls
  "execSync(",
  "gh issue create",
  "gh label create", 
  "gh milestone create",
  
  // Manual Zod imports
  "require('zod')",
  'require("zod")',
  "import z from 'zod'",
  'import z from "zod"',
  
  // Manual parameter validation
  "if (!title || title.length",
  "if (!owner || !repo",
  
  // Direct JSON parsing without validation
  "JSON.parse(",
  
  // Manual error handling
  "catch (error) { console.error",
  
  // Hardcoded values
  "owner: 'barreraslzr'",
  "repo: 'automate_workloads'",
];

let lintFailed = false;
for (const file of staged) {
  if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
  const content = readFileSync(file, "utf-8");
  for (const pattern of badPatterns) {
    if (content.includes(pattern)) {
      console.error(`❌ Deprecated pattern "${pattern}" found in ${file}`);
      lintFailed = true;
    }
  }
}
if (lintFailed) process.exit(1);

// 6. Check for proper fossil usage
console.log("🦴 Checking fossil usage patterns...");
let fossilPatternFailed = false;

for (const file of staged) {
  if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
  const content = readFileSync(file, "utf-8");
  
  // Check if GitHub operations use fossil-backed creation
  if (content.includes("gh issue create") || content.includes("gh label create") || content.includes("gh milestone create")) {
    if (!content.includes("createFossilIssue") && !content.includes("createFossilLabel") && !content.includes("createFossilMilestone")) {
      console.error(`❌ ${file} uses direct GitHub CLI calls instead of fossil-backed creation`);
      fossilPatternFailed = true;
    }
  }
  
  // Check for proper fossil imports
  if (content.includes("fossil") && !content.includes("import") && !content.includes("from")) {
    console.error(`❌ ${file} references fossils but doesn't import fossil utilities`);
    fossilPatternFailed = true;
  }
}

if (fossilPatternFailed) process.exit(1);

// 7. Check last commit message for Conventional Commits format
console.log("📝 Checking commit message format...");
try {
  const lastMsg = execSync("git log -1 --pretty=%B").toString();
  const conventionalCommit = /^(feat|fix|docs|style|refactor|test|chore|perf)\([^)]+\): .+/;
  if (!conventionalCommit.test(lastMsg.trim())) {
    console.error("❌ Commit message does not follow Conventional Commits format.");
    console.error("Expected format: type(scope): description");
    console.error("Example: feat(schemas): add comprehensive validation patterns");
    process.exit(1);
  }
} catch (e) {
  // If no commits yet, skip this check
}

// 8. TypeScript type checking
console.log("🔧 Running TypeScript type check...");
try {
  execSync("bun run tsc --noEmit", { stdio: 'inherit' });
  console.log("✅ TypeScript type check passed");
} catch (e) {
  console.error("❌ TypeScript type check failed");
  process.exit(1);
}

console.log("✅ Pre-commit validation passed! All checks succeeded.");

// Helper function to determine appropriate schema for a file
function determineSchemaForFile(filePath: string, data: any): z.ZodSchema | null {
  const fileName = filePath.toLowerCase();
  const dataType = data?.type || data?.kind || '';
  
  // Fossil files
  if (fileName.includes('fossil') || dataType.includes('fossil')) {
    if (fileName.includes('issue') || dataType.includes('issue')) {
      return SCHEMA_REGISTRY.fossil.createIssue;
    }
    if (fileName.includes('label') || dataType.includes('label')) {
      return SCHEMA_REGISTRY.fossil.createLabel;
    }
    if (fileName.includes('milestone') || dataType.includes('milestone')) {
      return SCHEMA_REGISTRY.fossil.createMilestone;
    }
    return SCHEMA_REGISTRY.fossil.curate;
  }
  
  // LLM insight files
  if (fileName.includes('insight') || dataType.includes('insight')) {
    return SCHEMA_REGISTRY.llm.insightExport;
  }
  
  // Plan files
  if (fileName.includes('plan') || dataType.includes('plan')) {
    return SCHEMA_REGISTRY.plan.plan;
  }
  
  // Project status files
  if (fileName.includes('status') || dataType.includes('status')) {
    return SCHEMA_REGISTRY.project.updateStatus;
  }
  
  // Context files
  if (fileName.includes('context') || dataType.includes('context')) {
    return SCHEMA_REGISTRY.context.entry;
  }
  
  // Tracking files
  if (fileName.includes('track') || dataType.includes('track')) {
    return SCHEMA_REGISTRY.tracking.config;
  }
  
  // Analysis files
  if (fileName.includes('analysis') || dataType.includes('analysis')) {
    return SCHEMA_REGISTRY.analysis.gitDiff;
  }
  
  // Integration files
  if (fileName.includes('integration') || dataType.includes('integration')) {
    return SCHEMA_REGISTRY.integration.config;
  }
  
  // Batch processing files
  if (fileName.includes('batch') || dataType.includes('batch')) {
    return SCHEMA_REGISTRY.batch.config;
  }
  
  // Review files
  if (fileName.includes('review') || dataType.includes('review')) {
    return SCHEMA_REGISTRY.review.external;
  }
  
  // Usage files
  if (fileName.includes('usage') || dataType.includes('usage')) {
    return SCHEMA_REGISTRY.usage.report;
  }
  
  return null;
} 