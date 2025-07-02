/**
 * Consolidated type definitions for the automation ecosystem
 * @module types
 * 
 * This file serves as the main entry point for all type definitions,
 * organized by domain with clear separation of concerns.
 */

// Core types - fundamental interfaces and types
export {
  EnvironmentConfig,
  BaseFossil,
  ContextEntry,
  ContextQuery,
  ServiceResponse,
  CLIOptions,
  Status,
  Priority,
  Impact,
  FossilType,
  FossilSource,
  FossilCreator,
  FossilMetadata,
  FossilQuery,
  FossilResult,
  FossilValidation,
  FossilCollection
} from './core';

// GitHub types - all GitHub-related interfaces
export {
  GitHubIssue,
  GitHubIssueFossil,
  GitHubMilestoneFossil,
  GitHubLabelFossil,
  GitHubPRFossil,
  GitHubFossilCollection,
  ProjectDocumentationFossil,
  GitHubOptions,
  AutomationTemplateFields,
  WorkflowStep,
  GitHubPerformanceMetrics
} from './github';

// CLI types - command-line interface schemas and types
export {
  BaseCLIArgsSchema,
  GitHubCLIArgsSchema,
  FossilCLIArgsSchema,
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
  BaseCLIArgs,
  GitHubCLIArgs,
  FossilCLIArgs,
  RoadmapCLIArgs,
  GitHubIssueCreate,
  GitHubMilestoneCreate,
  GitHubLabelCreate,
  GitHubIssueView,
  GitHubIssueList,
  GitHubLabelList,
  GitHubMilestoneList,
  GitHubIssueEdit,
  GitHubProject,
  GitHubAuth,
  CommandResult,
  IssueParams,
  LabelParams,
  MilestoneParams,
  parseCLIArgs
} from './cli';

// Workflow types - roadmap and plan-related interfaces
export {
  E2ERoadmapTask,
  E2ERoadmap,
  Issue as WorkflowIssue,
  Task,
  Plan,
  PerIssuePlanOutput,
  WorkflowStep as WorkflowStepType,
  WorkflowContext,
  WorkflowConfig
} from './workflow';

// External service types - non-GitHub service interfaces
export {
  TwitterTweet,
  GmailMessage,
  BufferPost,
  ObsidianNote,
  ExternalServiceMetrics,
  ExternalServiceConfig,
  ExternalServiceStatus
} from './external';

// Legacy fossil management types (for backward compatibility)
// These are now consolidated in core.ts but exported here for existing code
export type {
  FossilTransform,
  FossilStorage,
  FossilExport,
  FossilImport,
  FossilSync,
  FossilBackup,
  FossilRestore,
  FossilMigration,
  FossilAnalytics,
  FossilHealth,
  FossilMonitoring,
  FossilSecurity,
  FossilPerformance,
  FossilConfig,
  FossilEnvironment,
  FossilDeployment,
  FossilVersion,
  FossilBranch,
  FossilMerge,
  FossilCollaboration,
  FossilWorkflow,
  FossilIntegration,
  FossilAutomation,
  FossilReport,
  FossilTemplate,
  FossilPlugin,
  FossilMarketplace,
  FossilCommunity,
  FossilRoadmap,
  FossilChangelog,
  FossilDocumentation,
  FossilSupport,
  FossilLicense,
  FossilCompliance,
  FossilGovernance,
  FossilLifecycle,
  FossilQuality,
  FossilLineage,
  FossilImpact,
  FossilRisk,
  FossilCost,
  FossilValue,
  FossilMaturity,
  FossilInnovation,
  FossilSustainability,
  FossilResilience,
  FossilTransformation,
  FossilEcosystem,
  FossilFuture
} from './legacy-fossil';

// Re-export commonly used types for convenience
export type {
  // Core types
  BaseFossil as Fossil,
  ContextEntry as Entry,
  ServiceResponse as Response
} from './core';

export type {
  // GitHub types
  GitHubIssueFossil as IssueFossil,
  GitHubMilestoneFossil as MilestoneFossil,
  GitHubLabelFossil as LabelFossil
} from './github';

export type {
  // Workflow types
  E2ERoadmap as Roadmap,
  E2ERoadmapTask as RoadmapTask
} from './workflow';

export type {
  // CLI types
  CommandResult as CLIResult,
  IssueParams as CreateIssueParams,
  LabelParams as CreateLabelParams,
  MilestoneParams as CreateMilestoneParams
} from './cli'; 