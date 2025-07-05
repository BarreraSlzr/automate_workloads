/**
 * CLI-related type definitions and schemas
 * @module types/cli
 */

import { z } from './schemas';
import {
  BaseCLIArgsSchema,
  FossilCLIArgsSchema,
  GitHubCLIArgsSchema,
  RoadmapCLIArgsSchema,
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
  CurateFossilParamsSchema,
  CreateFossilIssueParamsSchema,
  CreateFossilLabelParamsSchema,
  CreateFossilMilestoneParamsSchema,
  UpdateProjectStatusParamsSchema,
  CheckExistingFossilParamsSchema,
  CreateFossilEntryParamsSchema,
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
  // Enhanced Commit Message System Schemas
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
  GitDiffAnalysisParamsSchema,
  IssuesCreateParamsSchema,
  ValidationResultSchema,
  FossilSummarySchema,
  CLIConfigSchema,
  PerformanceResultSchema,
  TimestampFilterParamsSchema,
  TimestampFilterCLIParamsSchema,
  GitHubIssuesCLIArgsSchema
} from './schemas';

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


// CLI Command Result Interface
// Used in: src/utils/githubCliCommands.ts
export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  message?: string;
}

// CLI Parameter Interfaces (Params Suffix)
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

export type CurateFossilParams = z.infer<typeof CurateFossilParamsSchema>;
export type CreateFossilIssueParams = z.infer<typeof CreateFossilIssueParamsSchema>;
export type CreateFossilLabelParams = z.infer<typeof CreateFossilLabelParamsSchema>;
export type CreateFossilMilestoneParams = z.infer<typeof CreateFossilMilestoneParamsSchema>;
export type CheckExistingFossilParams = z.infer<typeof CheckExistingFossilParamsSchema>;
export type CreateFossilEntryParams = z.infer<typeof CreateFossilEntryParamsSchema>;

export type UpdateProjectStatusParams = z.infer<typeof UpdateProjectStatusParamsSchema>;
export type ClassInfo = z.infer<typeof ClassInfoSchema>;
export type FunctionInfo = z.infer<typeof FunctionInfoSchema>;
export type CliCommand = z.infer<typeof CliCommandSchema>;
export type FileAnalysis = z.infer<typeof FileAnalysisSchema>;
export type DirectoryScan = z.infer<typeof DirectoryScanSchema>;
export type TestMapping = z.infer<typeof TestMappingSchema>;
export type FileEntry = z.infer<typeof FileEntrySchema>;
export type ModuleFile = z.infer<typeof ModuleFileSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Modules = z.infer<typeof ModulesSchema>;
export type OverallSummary = z.infer<typeof OverallSummarySchema>;
export type FossilizationSummary = z.infer<typeof FossilizationSummarySchema>;
export type CliEntry = z.infer<typeof CliEntrySchema>;
export type UtilsEntry = z.infer<typeof UtilsEntrySchema>;
export type ServicesEntry = z.infer<typeof ServicesEntrySchema>;
export type ExamplesEntry = z.infer<typeof ExamplesEntrySchema>;
export type DeveloperSummary = z.infer<typeof DeveloperSummarySchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

// Enhanced Commit Message System Types
export type EnhancedCommitValidationParams = z.infer<typeof EnhancedCommitValidationParamsSchema>;
export type CommitAuditParams = z.infer<typeof CommitAuditParamsSchema>;
export type CommitFixParams = z.infer<typeof CommitFixParamsSchema>;
export type CommitTrackingParams = z.infer<typeof CommitTrackingParamsSchema>;
export type CommitTemplateCreateParams = z.infer<typeof CommitTemplateCreateParamsSchema>;
export type CommitTemplateFromJsonParams = z.infer<typeof CommitTemplateFromJsonParamsSchema>;
export type CommitTemplateToJsonParams = z.infer<typeof CommitTemplateToJsonParamsSchema>;
export type CommitTemplateValidateParams = z.infer<typeof CommitTemplateValidateParamsSchema>;
export type CommitTemplateGenerateParams = z.infer<typeof CommitTemplateGenerateParamsSchema>;
export type CommitMessageValidation = z.infer<typeof CommitMessageValidationSchema>;
export type GitDiffData = z.infer<typeof GitDiffDataSchema>;
export type FileChange = z.infer<typeof FileChangeSchema>;
export type LLMInsightData = z.infer<typeof LLMInsightDataSchema>;
export type CommitFix = z.infer<typeof CommitFixSchema>;
export type CommitAuditData = z.infer<typeof CommitAuditDataSchema>;
export type AuditReport = z.infer<typeof AuditReportSchema>;
export type CommitMessageTemplate = z.infer<typeof CommitMessageTemplateSchema>;
export type GitDiffAnalysisParams = z.infer<typeof GitDiffAnalysisParamsSchema>;
export type IssuesCreateParams = z.infer<typeof IssuesCreateParamsSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type FossilSummary = z.infer<typeof FossilSummarySchema>;
export type CLIConfig = z.infer<typeof CLIConfigSchema>;
export type PerformanceResult = z.infer<typeof PerformanceResultSchema>;
export type TimestampFilterParams = z.infer<typeof TimestampFilterParamsSchema>;
export type TimestampFilterCLIParams = z.infer<typeof TimestampFilterCLIParamsSchema>;
export type GitHubIssuesCLIArgs = z.infer<typeof GitHubIssuesCLIArgsSchema>;

// Schema Exports
export {
  UpdateProjectStatusParamsSchema,
  CheckExistingFossilParamsSchema,
  CreateFossilEntryParamsSchema,
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
  // Enhanced Commit Message System Schemas
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
  GitDiffAnalysisParamsSchema,
  IssuesCreateParamsSchema,
  ValidationResultSchema,
  FossilSummarySchema,
  CLIConfigSchema,
  PerformanceResultSchema,
  TimestampFilterParamsSchema,
  TimestampFilterCLIParamsSchema,
  GitHubIssuesCLIArgsSchema
};

