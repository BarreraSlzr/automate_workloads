// Centralized Bill of Materials (BOM) for all major utilities in src/utils
// Organized by conceptual section for discoverability, tooling, and automation.
// Usage: For introspection, documentation, or programmatic utility access.
// Example: UtilsTree.FossilManager.FossilManager

export { FossilManager, createFossilManager, createFossilIssue, createFossilLabel, createFossilMilestone } from './fossilManager';
export { LLMFossilManager } from './llmFossilManager';
export { LLMSnapshotExporter, exportLLMSnapshot } from './llmSnapshotExporter';
export { generateWorkflowDiagram, generateArchitectureDiagram, generateDependencyDiagram, generateRiskDiagram, generateSequenceDiagram, generateProgressDiagram, generateSystemOverviewDiagram, generateDecisionTreeDiagram, generateVisualIssueBody, generateVisualFossilPublication, shouldIncludeVisuals, extractVisualContext } from './visualDiagramGenerator';
export { executeCommand, executeCommandJSON, safeParseJSON, isCommandAvailable, executeCommandWithRetry, formatOutput, createServiceResponse, issueExists } from './cli';
export { updateMarkdownChecklistFile, updateJsonChecklistFile, updateYamlChecklistFile, updateChecklistFile, updateMultipleChecklistFiles, parseChecklistUpdates, generateUpdateReport } from './checklistUpdater';
export { TypeSchemaValidator, runTypeSchemaValidation } from './typeSchemaValidator';

/**
 * UtilsTree: Centralized Bill of Materials (BOM) for all major utilities in src/utils
 *
 * Organized by conceptual section for discoverability, tooling, and automation.
 *
 * Usage:
 *   - For introspection, documentation, or programmatic utility access.
 *   - Example: UtilsTree.FossilManager.FossilManager
 *
 * Sections:
 *   - FossilManager: Unified fossil-backed creation and management utilities for GitHub issues, labels, milestones.
 *   - LLM: LLM fossilization, snapshotting, and session management utilities.
 *   - Visuals: Utilities for generating diagrams (Mermaid, architecture, workflow, etc) for documentation and audit.
 *   - CLI: Type-safe shell/CLI execution and command utilities.
 *   - Checklist: Comprehensive checklist/roadmap update and reporting utilities.
 *   - Validation: Type/schema validation and compliance utilities.
 */
export const UtilsTree = {
  /**
   * FossilManager: Unified fossil-backed creation and management utilities for GitHub issues, labels, milestones.
   * - FossilManager: Main class for fossil operations
   * - createFossilManager: Factory for FossilManager
   * - createFossilIssue/Label/Milestone: One-shot fossil-backed creation helpers
   */
  FossilManager: {
    FossilManager: require('./fossilManager').FossilManager,
    createFossilManager: require('./fossilManager').createFossilManager,
    createFossilIssue: require('./fossilManager').createFossilIssue,
    createFossilLabel: require('./fossilManager').createFossilLabel,
    createFossilMilestone: require('./fossilManager').createFossilMilestone,
  },
  /**
   * LLM: LLM fossilization, snapshotting, and session management utilities.
   * - LLMFossilManager: Main class for LLM fossil management
   * - LLMSnapshotExporter/exportLLMSnapshot: Export LLM fossils for sharing/audit
   */
  LLM: {
    LLMFossilManager: require('./llmFossilManager').LLMFossilManager,
    LLMSnapshotExporter: require('./llmSnapshotExporter').LLMSnapshotExporter,
    exportLLMSnapshot: require('./llmSnapshotExporter').exportLLMSnapshot,
  },
  /**
   * Visuals: Utilities for generating diagrams (Mermaid, architecture, workflow, etc) for documentation and audit.
   * - generateWorkflowDiagram, generateArchitectureDiagram, ...: Diagram generators
   * - generateVisualIssueBody, generateVisualFossilPublication: Visual documentation helpers
   */
  Visuals: {
    generateWorkflowDiagram: require('./visualDiagramGenerator').generateWorkflowDiagram,
    generateArchitectureDiagram: require('./visualDiagramGenerator').generateArchitectureDiagram,
    generateDependencyDiagram: require('./visualDiagramGenerator').generateDependencyDiagram,
    generateRiskDiagram: require('./visualDiagramGenerator').generateRiskDiagram,
    generateSequenceDiagram: require('./visualDiagramGenerator').generateSequenceDiagram,
    generateProgressDiagram: require('./visualDiagramGenerator').generateProgressDiagram,
    generateSystemOverviewDiagram: require('./visualDiagramGenerator').generateSystemOverviewDiagram,
    generateDecisionTreeDiagram: require('./visualDiagramGenerator').generateDecisionTreeDiagram,
    generateVisualIssueBody: require('./visualDiagramGenerator').generateVisualIssueBody,
    generateVisualFossilPublication: require('./visualDiagramGenerator').generateVisualFossilPublication,
    shouldIncludeVisuals: require('./visualDiagramGenerator').shouldIncludeVisuals,
    extractVisualContext: require('./visualDiagramGenerator').extractVisualContext,
  },
  /**
   * CLI: Type-safe shell/CLI execution and command utilities.
   * - executeCommand/JSON/WithRetry: Shell command execution helpers
   * - isCommandAvailable: Check CLI tool availability
   * - formatOutput, createServiceResponse, issueExists: Output and result helpers
   */
  CLI: {
    executeCommand: require('./cli').executeCommand,
    executeCommandJSON: require('./cli').executeCommandJSON,
    safeParseJSON: require('./cli').safeParseJSON,
    isCommandAvailable: require('./cli').isCommandAvailable,
    executeCommandWithRetry: require('./cli').executeCommandWithRetry,
    formatOutput: require('./cli').formatOutput,
    createServiceResponse: require('./cli').createServiceResponse,
    issueExists: require('./cli').issueExists,
  },
  /**
   * Checklist: Comprehensive checklist/roadmap update and reporting utilities.
   * - updateMarkdownChecklistFile/updateJsonChecklistFile/updateYamlChecklistFile: File format-specific updaters
   * - updateChecklistFile/updateMultipleChecklistFiles: General updaters
   * - parseChecklistUpdates, generateUpdateReport: Parsing and reporting helpers
   */
  Checklist: {
    updateMarkdownChecklistFile: require('./checklistUpdater').updateMarkdownChecklistFile,
    updateJsonChecklistFile: require('./checklistUpdater').updateJsonChecklistFile,
    updateYamlChecklistFile: require('./checklistUpdater').updateYamlChecklistFile,
    updateChecklistFile: require('./checklistUpdater').updateChecklistFile,
    updateMultipleChecklistFiles: require('./checklistUpdater').updateMultipleChecklistFiles,
    parseChecklistUpdates: require('./checklistUpdater').parseChecklistUpdates,
    generateUpdateReport: require('./checklistUpdater').generateUpdateReport,
  },
  /**
   * Validation: Type/schema validation and compliance utilities.
   * - TypeSchemaValidator: Comprehensive type/schema validation class
   * - runTypeSchemaValidation: CLI entrypoint for validation
   */
  Validation: {
    TypeSchemaValidator: require('./typeSchemaValidator').TypeSchemaValidator,
    runTypeSchemaValidation: require('./typeSchemaValidator').runTypeSchemaValidation,
  },
}; 