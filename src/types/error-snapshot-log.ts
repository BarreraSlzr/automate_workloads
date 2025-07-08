// ============================================================================
// ERROR, SNAPSHOT, AND LOG UNDERSTANDING TYPE DEFINITIONS
// ============================================================================
// Centralized type definitions for error handling, snapshot generation, 
// and log understanding across CLI, human, and LLM chat contexts

import { z } from 'zod';
import { BaseFossil } from './core';

// ============================================================================
// BASE ERROR TYPES
// ============================================================================

export const ErrorSeveritySchema = z.enum(['debug', 'info', 'warning', 'error', 'critical']);
export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;

export const ErrorCategorySchema = z.enum([
  'validation', 'execution', 'timeout', 'resource', 'network', 
  'permission', 'configuration', 'dependency', 'unknown'
]);
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

export const ErrorContextSchema = z.object({
  operation: z.string(),
  component: z.string(),
  function: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  stackTrace: z.array(z.string()).optional(),
  timestamp: z.string(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const ErrorSchema = z.object({
  id: z.string(),
  severity: ErrorSeveritySchema,
  category: ErrorCategorySchema,
  message: z.string(),
  description: z.string().optional(),
  context: ErrorContextSchema,
  originalError: z.any().optional(),
  suggestions: z.array(z.string()).optional(),
  actionable: z.boolean().default(true),
  retryable: z.boolean().default(false),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================

export const SnapshotTypeSchema = z.enum([
  'error', 'performance', 'state', 'validation', 'execution', 'monitoring'
]);
export type SnapshotType = z.infer<typeof SnapshotTypeSchema>;

export const SnapshotContextSchema = z.object({
  trigger: z.string(),
  source: z.string(),
  component: z.string(),
  operation: z.string(),
  timestamp: z.string(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const SnapshotDataSchema = z.object({
  state: z.record(z.any()),
  metrics: z.record(z.any()).optional(),
  errors: z.array(ErrorSchema).optional(),
  warnings: z.array(z.string()).optional(),
  context: z.record(z.any()).optional(),
});

export const SnapshotSchema = z.object({
  id: z.string(),
  type: SnapshotTypeSchema,
  context: SnapshotContextSchema,
  data: SnapshotDataSchema,
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// LOG UNDERSTANDING TYPES
// ============================================================================

export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogEntrySchema = z.object({
  timestamp: z.string(),
  level: LogLevelSchema,
  message: z.string(),
  component: z.string(),
  operation: z.string().optional(),
  context: z.record(z.any()).optional(),
  error: ErrorSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export const LogAnalysisSchema = z.object({
  totalEntries: z.number(),
  errorCount: z.number(),
  warningCount: z.number(),
  infoCount: z.number(),
  debugCount: z.number(),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  errorPatterns: z.array(z.object({
    pattern: z.string(),
    count: z.number(),
    examples: z.array(z.string()),
  })),
  performanceMetrics: z.object({
    averageResponseTime: z.number().optional(),
    peakMemoryUsage: z.number().optional(),
    errorRate: z.number(),
  }).optional(),
});

// ============================================================================
// CLI OUTPUT TYPES
// ============================================================================

export const CLIOutputFormatSchema = z.enum(['text', 'json', 'yaml', 'markdown', 'table']);
export type CLIOutputFormat = z.infer<typeof CLIOutputFormatSchema>;

export const CLIOutputSchema = z.object({
  format: CLIOutputFormatSchema,
  content: z.string(),
  errors: z.array(ErrorSchema).optional(),
  warnings: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// LLM CHAT CONTEXT TYPES
// ============================================================================

export const LLMChatContextSchema = z.object({
  sessionId: z.string(),
  conversationId: z.string(),
  timestamp: z.string(),
  userQuery: z.string(),
  systemContext: z.string().optional(),
  errorContext: z.array(ErrorSchema).optional(),
  snapshotContext: z.array(SnapshotSchema).optional(),
  logContext: z.array(LogEntrySchema).optional(),
  suggestions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// FOSSIL TYPES (EXTENDING BASE FOSSIL)
// ============================================================================

export interface ErrorFossil extends BaseFossil {
  type: 'error_fossil';
  error: z.infer<typeof ErrorSchema>;
  relatedErrors: string[]; // Array of error IDs
  resolution: string | null;
  impact: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface SnapshotFossil extends BaseFossil {
  type: 'snapshot_fossil';
  snapshot: z.infer<typeof SnapshotSchema>;
  analysis?: z.infer<typeof LogAnalysisSchema>;
  insights: string[];
  recommendations: string[];
  tags: string[];
}

export interface LogAnalysisFossil extends BaseFossil {
  type: 'log_analysis_fossil';
  analysis: z.infer<typeof LogAnalysisSchema>;
  patterns: z.infer<typeof LogAnalysisSchema>['errorPatterns'];
  recommendations: string[];
  actionItems: string[];
  tags: string[];
}

// ============================================================================
// PARAMS OBJECT PATTERNS
// ============================================================================

export interface CreateErrorSnapshotParams {
  error: AppError;
  includeContext?: boolean;
  includeStackTrace?: boolean;
  includeSuggestions?: boolean;
  format?: CLIOutputFormat;
}

export interface CreateErrorParams {
  message: string;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  category: 'validation' | 'execution' | 'timeout' | 'resource' | 'network' | 'permission' | 'configuration' | 'dependency' | 'unknown';
  operation: string;
  component: string;
  function?: string;
  line?: number;
  column?: number;
  stackTrace?: string[];
  sessionId?: string;
  requestId?: string;
  userId?: string;
  description?: string;
  originalError?: any;
  suggestions?: string[];
  actionable?: boolean;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

export interface HandleErrorParams {
  error: AppError;
  logToConsole?: boolean;
  createSnapshot?: boolean;
  generateReport?: boolean;
  format?: 'text' | 'json' | 'yaml' | 'markdown' | 'table';
}

export interface CreateSnapshotFossilParams {
  snapshot: Snapshot;
  analysis?: LogAnalysis;
  insights?: string[];
  recommendations?: string[];
  tags?: string[];
}

export interface CreateLogAnalysisFossilParams {
  analysis: LogAnalysis;
  patterns: LogAnalysis['errorPatterns'];
  recommendations?: string[];
  actionItems?: string[];
  tags?: string[];
}

export interface CreateErrorFossilParams {
  error: AppError;
  relatedErrors?: string[];
  resolution?: string;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

// ============================================================================
// CLI PARAMS INTERFACES
// ============================================================================

export interface CreateErrorCLIParams {
  message: string;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  category: 'validation' | 'execution' | 'timeout' | 'resource' | 'network' | 'permission' | 'configuration' | 'dependency' | 'unknown';
  operation: string;
  component: string;
  format: CLIOutputFormat;
  includeContext?: boolean;
  includeStackTrace?: boolean;
  includeSuggestions?: boolean;
  logToConsole?: boolean;
  createSnapshot?: boolean;
  generateReport?: boolean;
  outputFile?: string;
}

export interface HandleErrorCLIParams {
  errorId?: string;
  format: CLIOutputFormat;
  logToConsole?: boolean;
  createSnapshot?: boolean;
  generateReport?: boolean;
  outputFile?: string;
}

export interface CreateSnapshotCLIParams {
  errorId?: string;
  format: CLIOutputFormat;
  includeContext?: boolean;
  includeStackTrace?: boolean;
  includeSuggestions?: boolean;
  outputFile?: string;
}

export interface AnalyzeLogsCLIParams {
  inputFile?: string;
  format: CLIOutputFormat;
  includePatterns?: boolean;
  includeMetrics?: boolean;
  outputFile?: string;
}

export interface FormatOutputCLIParams {
  content: string;
  format: CLIOutputFormat;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
  outputFile?: string;
}

export interface CreateContextCLIParams {
  sessionId: string;
  conversationId: string;
  userQuery: string;
  systemContext?: string;
  format: CLIOutputFormat;
  includeSuggestions?: boolean;
  outputFile?: string;
}

export interface CreateFossilsCLIParams {
  errorId?: string;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  outputFile?: string;
}

export interface GenerateLogAnalysisParams {
  logEntries: z.infer<typeof LogEntrySchema>[];
  timeRange?: {
    start: string;
    end: string;
  };
  includePatterns?: boolean;
  includeMetrics?: boolean;
  format?: CLIOutputFormat;
}

export interface CreateCLIOutputParams {
  content: string;
  format: CLIOutputFormat;
  errors?: AppError[];
  warnings?: string[];
  suggestions?: string[];
  includeMetadata?: boolean;
}

export interface CreateLLMChatContextParams {
  sessionId: string;
  conversationId: string;
  userQuery: string;
  systemContext?: string;
  errorContext?: AppError[];
  snapshotContext?: z.infer<typeof SnapshotSchema>[];
  logContext?: z.infer<typeof LogEntrySchema>[];
  includeSuggestions?: boolean;
}

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

export const ErrorSnapshotLogSchemas = {
  ErrorSeveritySchema,
  ErrorCategorySchema,
  ErrorContextSchema,
  ErrorSchema,
  SnapshotTypeSchema,
  SnapshotContextSchema,
  SnapshotDataSchema,
  SnapshotSchema,
  LogLevelSchema,
  LogEntrySchema,
  LogAnalysisSchema,
  CLIOutputFormatSchema,
  CLIOutputSchema,
  LLMChatContextSchema,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AppError = z.infer<typeof ErrorSchema>;
export type ErrorContext = z.infer<typeof ErrorContextSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type SnapshotContext = z.infer<typeof SnapshotContextSchema>;
export type SnapshotData = z.infer<typeof SnapshotDataSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type LogAnalysis = z.infer<typeof LogAnalysisSchema>;
export type CLIOutput = z.infer<typeof CLIOutputSchema>;
export type LLMChatContext = z.infer<typeof LLMChatContextSchema>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ErrorHandler {
  handleError: (error: AppError) => Promise<void>;
  createSnapshot: (error: AppError) => Promise<Snapshot>;
  generateReport: (errors: AppError[]) => Promise<CLIOutput>;
}

export interface SnapshotManager {
  createSnapshot: (params: CreateErrorSnapshotParams) => Promise<Snapshot>;
  getSnapshot: (id: string) => Promise<Snapshot | null>;
  listSnapshots: (filters?: Record<string, any>) => Promise<Snapshot[]>;
  deleteSnapshot: (id: string) => Promise<boolean>;
}

export interface LogAnalyzer {
  analyzeLogs: (params: GenerateLogAnalysisParams) => Promise<LogAnalysis>;
  detectPatterns: (entries: LogEntry[]) => Promise<LogAnalysis['errorPatterns']>;
  generateInsights: (analysis: LogAnalysis) => Promise<string[]>;
}

export interface CLIOutputFormatter {
  formatOutput: (params: CreateCLIOutputParams) => Promise<CLIOutput>;
  formatError: (error: AppError, format: CLIOutputFormat) => Promise<string>;
  formatSnapshot: (snapshot: Snapshot, format: CLIOutputFormat) => Promise<string>;
}

export interface LLMChatContextManager {
  createContext: (params: CreateLLMChatContextParams) => Promise<LLMChatContext>;
  updateContext: (contextId: string, updates: Partial<LLMChatContext>) => Promise<LLMChatContext>;
  getContext: (contextId: string) => Promise<LLMChatContext | null>;
} 