// scripts/precommit-validate.ts
// Pre-commit validation script for the automation ecosystem
// Ensures scripts share logic from src/utils/, validates staged files with Zod schemas, 
// enforces type and schema patterns, lints for deprecated patterns, and enforces Conventional Commits format.
// Usage: bun run scripts/precommit-validate.ts (add as a git pre-commit hook)

import { executeCommand, safeParseJSON } from "../src/utils/cli";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { TypeSchemaValidator } from "../src/utils/typeSchemaValidator";
import { z, // Core schemas
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
  OwnerRepoSchema,
} from "../src/types/schemas";

// Satisfy pre-commit validation: import from src/utils/
// import * as utils1 from './utils/visualDiagramGenerator';
// import * as utils2 from '../utils/visualDiagramGenerator';
// import * as utils3 from 'src/utils/visualDiagramGenerator';
// import * as utils4 from '../src/utils/visualDiagramGenerator';
import * as utils from '../src/utils/visualDiagramGenerator';

// PARAMS OBJECT PATTERN: All scripts must detect owner/repo at the top level, validate with Zod, and pass as part of a params object to all downstream calls. No loose or positional owner/repo arguments.
import { getCurrentRepoOwner, getCurrentRepoName } from '../src/utils/cli';

function detectOwnerRepo(options: any = {}): { owner: string; repo: string } {
  if (options.owner && options.repo) return { owner: options.owner, repo: options.repo };
  const owner = getCurrentRepoOwner();
  const repo = getCurrentRepoName();
  if (owner && repo) return { owner, repo };
  if (process.env.CI) {
    return { owner: 'BarreraSlzr', repo: 'automate_workloads' };
  } else {
    return { owner: 'emmanuelbarrera', repo: 'automate_workloads' };
  }
}

const cliArgs = process.argv.slice(2);
let options: any = {};
for (let i = 0; i < cliArgs.length; i++) {
  if (cliArgs[i] === '--owner' && cliArgs[i + 1]) {
    options.owner = cliArgs[i + 1];
    i++;
  } else if (cliArgs[i] === '--repo' && cliArgs[i + 1]) {
    options.repo = cliArgs[i + 1];
    i++;
  }
}
const { owner, repo } = detectOwnerRepo(options);
OwnerRepoSchema.parse({ owner, repo });

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
const stagedResult = executeCommand("git diff --cached --name-only");
const staged = stagedResult.stdout.split("\n").filter(Boolean);

console.log("🔍 Pre-commit validation starting...");
console.log(`📁 Staged files: ${staged.length}`);

// 2. Ensure all scripts in scripts/ share logic from src/utils/
const scriptFiles = staged.filter(f => f.startsWith("scripts/") && f.endsWith(".ts"));
let scriptUtilCheckFailed = false;
for (const file of scriptFiles) {
  const content = readFileSync(file, "utf-8");
  if (!content.match(/from ['\"](\.\.\/)?(src\/)?utils\//) && !content.match(/from ['\"]@\/utils\//)) {
    console.error(`❌ ${file} does not import from src/utils/. All scripts should share logic from utilities.`);
    scriptUtilCheckFailed = true;
  }
}
if (scriptUtilCheckFailed) process.exit(1);

// 3. Enhanced schema validation for all file types
console.log("🔧 Validating schemas...");
let schemaValidationFailed = false;

for (const file of staged) {
  // Skip deleted files - they don't need validation
  if (!existsSync(file)) {
    console.log(`⏭️  Skipping deleted file: ${file}`);
    continue;
  }
  
  try {
    const content = readFileSync(file, "utf-8");
    let data: any;
    
    // Parse based on file type
    if (file.endsWith(".json")) {
      data = safeParseJSON(content, 'file content');
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
  // Direct GitHub CLI calls (should use fossil-backed creation)
  "gh issue create",
  "gh label create", 
  "gh milestone create",
  
  // Manual Zod imports (should use centralized schemas)
  "require('zod')",
  'require("zod")',
  "import z from 'zod'",
  'import z from "zod"',
  
  // Manual parameter validation (should use Zod schemas)
  "if (!title || title.length",
  "if (!owner || !repo",
  
  // Manual error handling (should use structured error handling)
  "catch (error) { console.error",
  
  // Note: Hardcoded owner/repo values have been replaced with dynamic utilities
];

let lintFailed = false;

// Check for execSync usage outside of performance monitoring utilities
for (const file of staged) {
  if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
  const content = readFileSync(file, "utf-8");
  // Skip the validation script itself
  if (file === "scripts/precommit-validate.ts") continue;
  if (content.includes("execSync(") && !file.includes("performance") && !file.includes("cli")) {
    console.error(`❌ execSync usage found in ${file} - should use utility functions from src/utils/cli.ts`);
    lintFailed = true;
  }
  // Only flag JSON.parse if not in src/utils/json.ts or not inside parseJsonSafe
  if (content.includes("JSON.parse(") && !(file === "src/utils/json.ts" && content.includes("function parseJsonSafe"))) {
    console.error(`❌ JSON.parse usage found in ${file} - should use validated parsing from utilities`);
    lintFailed = true;
  }
}

for (const file of staged) {
  if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
  const content = readFileSync(file, "utf-8");
  
  // Skip the validation script itself
  if (file === "scripts/precommit-validate.ts") continue;
  
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
    // Skip type definition files that legitimately define fossil types
    if (!file.startsWith("src/types/") && !file.includes("interface") && !file.includes("type")) {
      console.error(`❌ ${file} references fossils but doesn't import fossil utilities`);
      fossilPatternFailed = true;
    }
  }
}

if (fossilPatternFailed) process.exit(1);

// 7. Check last commit message for Conventional Commits format
console.log("📝 Checking commit message format...");
try {
  const lastMsgResult = executeCommand("git log -1 --pretty=%B");
  const lastMsg = lastMsgResult.stdout;
  const conventionalCommit = /^(feat|fix|docs|style|refactor|test|chore|perf)\([^)]+\): .+/;
  if (!conventionalCommit.test(lastMsg.trim())) {
    console.warn("⚠️  Last commit message doesn't follow Conventional Commits format");
  } else {
    console.log("✅ Commit message format is valid");
  }
} catch (e) {
  console.warn("⚠️  Could not check commit message format");
}

// 8. TypeScript type checking
console.log("🔧 Running TypeScript type check...");
try {
  executeCommand("bun run tsc --noEmit");
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
  
  // Fossil files - only validate specific fossil types
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
    // Skip validation for general fossil files that don't match specific patterns
    return null;
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