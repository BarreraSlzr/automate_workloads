// ============================================================================
// ERROR, SNAPSHOT, AND LOG UNDERSTANDING UTILITIES
// ============================================================================
// Utility functions for error handling, snapshot generation, and log understanding
// Following the project's object params pattern and Zod validation

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppError, 
  ErrorContext, 
  Snapshot, 
  LogEntry, 
  LogAnalysis, 
  CLIOutput,
  CreateErrorSnapshotParams,
  GenerateLogAnalysisParams,
  CreateCLIOutputParams,
  CreateLLMChatContextParams,
  LLMChatContext,
  ErrorSnapshotLogSchemas,
  ErrorFossil,
  SnapshotFossil,
  LogAnalysisFossil,
  CreateErrorParams,
  HandleErrorParams,
  CreateSnapshotFossilParams,
  CreateLogAnalysisFossilParams,
  CreateErrorFossilParams
} from '../types/error-snapshot-log';
import { BaseFossil } from '../types/core';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const createError = (params: CreateErrorParams): AppError => {
  const {
    message,
    severity,
    category,
    operation,
    component,
    function: func,
    line,
    column,
    stackTrace,
    sessionId,
    requestId,
    userId,
    description,
    originalError,
    suggestions,
    actionable = true,
    retryable = false,
    metadata
  } = params;

  const context: ErrorContext = {
    operation,
    component,
    function: func,
    line,
    column,
    stackTrace,
    timestamp: new Date().toISOString(),
    sessionId,
    requestId,
    userId,
    metadata
  };

  const error: AppError = {
    id: uuidv4(),
    severity,
    category,
    message,
    description,
    context,
    originalError,
    suggestions,
    actionable,
    retryable,
    createdAt: new Date().toISOString()
  };

  // Validate the error using Zod schema
  ErrorSnapshotLogSchemas.ErrorSchema.parse(error);
  
  return error;
};



export const handleError = async (params: HandleErrorParams): Promise<{
  error: AppError;
  snapshot?: Snapshot;
  report?: CLIOutput;
}> => {
  const { error, logToConsole = true, createSnapshot = false, generateReport = false, format = 'text' } = params;

  // Log to console if requested
  if (logToConsole) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${error.severity.toUpperCase()}: ${error.message}`;
    const contextInfo = `Component: ${error.context.component}, Operation: ${error.context.operation}`;
    
    switch (error.severity) {
      case 'debug':
        console.debug(logMessage, contextInfo);
        break;
      case 'info':
        console.info(logMessage, contextInfo);
        break;
      case 'warning':
        console.warn(logMessage, contextInfo);
        break;
      case 'error':
      case 'critical':
        console.error(logMessage, contextInfo);
        if (error.context.stackTrace) {
          console.error('Stack trace:', error.context.stackTrace.join('\n'));
        }
        break;
    }
  }

  let snapshot: Snapshot | undefined;
  let report: CLIOutput | undefined;

  // Create snapshot if requested
  if (createSnapshot) {
    snapshot = await createErrorSnapshot({
      error,
      includeContext: true,
      includeStackTrace: true,
      includeSuggestions: true,
      format
    });
  }

  // Generate report if requested
  if (generateReport) {
    report = await formatCLIOutput({
      content: `Error Report: ${error.message}`,
      format,
      errors: [error],
      warnings: error.suggestions?.map(s => `Suggestion: ${s}`) || [],
      suggestions: error.suggestions || [],
      includeMetadata: true
    });
  }

  return { error, snapshot, report };
};

// ============================================================================
// SNAPSHOT UTILITIES
// ============================================================================

export const createErrorSnapshot = async (params: CreateErrorSnapshotParams): Promise<Snapshot> => {
  const { error, includeContext = true, includeStackTrace = false, includeSuggestions = true, format = 'json' } = params;

  const snapshotData = {
    state: {
      errorId: error.id,
      severity: error.severity,
      category: error.category,
      message: error.message,
      description: error.description,
      actionable: error.actionable,
      retryable: error.retryable,
      createdAt: error.createdAt
    },
    metrics: {
      errorCount: 1,
      severityLevel: error.severity,
      categoryType: error.category
    },
    errors: [error],
    warnings: includeSuggestions ? error.suggestions || [] : [],
    context: includeContext ? error.context : undefined
  };

  const snapshot: Snapshot = {
    id: uuidv4(),
    type: 'error',
    context: {
      trigger: 'error_occurred',
      source: error.context.component,
      component: error.context.component,
      operation: error.context.operation,
      timestamp: new Date().toISOString(),
      sessionId: error.context.sessionId,
      requestId: error.context.requestId,
      metadata: {
        includeStackTrace,
        format
      }
    },
    data: snapshotData,
    createdAt: new Date().toISOString(),
    tags: ['error', error.category, error.severity]
  };

  // Validate the snapshot using Zod schema
  ErrorSnapshotLogSchemas.SnapshotSchema.parse(snapshot);
  
  return snapshot;
};



export const createSnapshotFossil = (params: CreateSnapshotFossilParams): SnapshotFossil => {
  const { snapshot, analysis, insights = [], recommendations = [], tags = [] } = params;

  const fossil: SnapshotFossil = {
    type: 'snapshot_fossil',
    source: 'error-snapshot-log-utils',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    fossilId: uuidv4(),
    fossilHash: `snapshot-${snapshot.id}`,
    snapshot,
    analysis,
    insights,
    recommendations,
    tags: [...tags, 'snapshot', snapshot.type],
    metadata: {
      snapshotId: snapshot.id,
      snapshotType: snapshot.type,
      createdAt: snapshot.createdAt
    }
  };

  return fossil;
};

// ============================================================================
// LOG ANALYSIS UTILITIES
// ============================================================================

export const analyzeLogs = async (params: GenerateLogAnalysisParams): Promise<LogAnalysis> => {
  const { logEntries, timeRange, includePatterns = true, includeMetrics = true } = params;

  // Calculate basic statistics
  const totalEntries = logEntries.length;
  const errorCount = logEntries.filter(entry => entry.level === 'error' || entry.level === 'fatal').length;
  const warningCount = logEntries.filter(entry => entry.level === 'warn').length;
  const infoCount = logEntries.filter(entry => entry.level === 'info').length;
  const debugCount = logEntries.filter(entry => entry.level === 'debug').length;

  // Determine time range
  const actualTimeRange = timeRange || {
    start: logEntries.length > 0 ? logEntries[0]?.timestamp || '' : new Date().toISOString(),
    end: logEntries.length > 0 ? logEntries[logEntries.length - 1]?.timestamp || '' : new Date().toISOString()
  };

  // Detect error patterns if requested
  const errorPatterns = includePatterns ? await detectErrorPatterns(logEntries) : [];

  // Calculate performance metrics if requested
  const performanceMetrics = includeMetrics ? calculatePerformanceMetrics(logEntries) : undefined;

  const analysis: LogAnalysis = {
    totalEntries,
    errorCount,
    warningCount,
    infoCount,
    debugCount,
    timeRange: actualTimeRange,
    errorPatterns,
    performanceMetrics
  };

  // Validate the analysis using Zod schema
  ErrorSnapshotLogSchemas.LogAnalysisSchema.parse(analysis);
  
  return analysis;
};

export const detectErrorPatterns = async (entries: LogEntry[]): Promise<LogAnalysis['errorPatterns']> => {
  const errorEntries = entries.filter(entry => entry.level === 'error' || entry.level === 'fatal');
  const patterns: Record<string, { count: number; examples: string[] }> = {};

  for (const entry of errorEntries) {
    const message = entry.message.toLowerCase();
    
    // Simple pattern detection - can be enhanced with more sophisticated algorithms
    let pattern = 'unknown';
    
    if (message.includes('timeout')) pattern = 'timeout';
    else if (message.includes('permission') || message.includes('access')) pattern = 'permission';
    else if (message.includes('network') || message.includes('connection')) pattern = 'network';
    else if (message.includes('validation') || message.includes('invalid')) pattern = 'validation';
    else if (message.includes('resource') || message.includes('memory')) pattern = 'resource';
    else if (message.includes('configuration') || message.includes('config')) pattern = 'configuration';
    else if (message.includes('dependency') || message.includes('module')) pattern = 'dependency';

    if (!patterns[pattern]) {
      patterns[pattern] = { count: 0, examples: [] };
    }
    
    const patternData = patterns[pattern];
    if (patternData) {
      patternData.count++;
      if (patternData.examples.length < 3) {
        patternData.examples.push(entry.message);
      }
    }
  }

  return Object.entries(patterns).map(([pattern, data]) => ({
    pattern,
    count: data.count,
    examples: data.examples
  }));
};

export const calculatePerformanceMetrics = (entries: LogEntry[]): LogAnalysis['performanceMetrics'] => {
  const errorRate = entries.length > 0 ? 
    entries.filter(entry => entry.level === 'error' || entry.level === 'fatal').length / entries.length : 0;

  return {
    errorRate,
    // Additional metrics can be calculated based on available data
    averageResponseTime: undefined,
    peakMemoryUsage: undefined
  };
};



export const createLogAnalysisFossil = (params: CreateLogAnalysisFossilParams): LogAnalysisFossil => {
  const { analysis, patterns, recommendations = [], actionItems = [], tags = [] } = params;

  const fossil: LogAnalysisFossil = {
    type: 'log_analysis_fossil',
    source: 'error-snapshot-log-utils',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    fossilId: uuidv4(),
    fossilHash: `log-analysis-${analysis.totalEntries}-${analysis.errorCount}`,
    analysis,
    patterns,
    recommendations,
    actionItems,
    tags: [...tags, 'log-analysis', 'monitoring'],
    metadata: {
      totalEntries: analysis.totalEntries,
      errorCount: analysis.errorCount,
      timeRange: analysis.timeRange
    }
  };

  return fossil;
};

// ============================================================================
// CLI OUTPUT FORMATTING UTILITIES
// ============================================================================

export const formatCLIOutput = async (params: CreateCLIOutputParams): Promise<CLIOutput> => {
  const { content, format, errors = [], warnings = [], suggestions = [], includeMetadata = false } = params;

  let formattedContent = content;

  switch (format) {
    case 'text':
      formattedContent = formatAsText(content, errors, warnings, suggestions);
      break;
    case 'json':
      formattedContent = formatAsJSON(content, errors, warnings, suggestions, includeMetadata);
      break;
    case 'yaml':
      formattedContent = formatAsYAML(content, errors, warnings, suggestions, includeMetadata);
      break;
    case 'markdown':
      formattedContent = formatAsMarkdown(content, errors, warnings, suggestions);
      break;
    case 'table':
      formattedContent = formatAsTable(content, errors, warnings, suggestions);
      break;
  }

  const output: CLIOutput = {
    format,
    content: formattedContent,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    metadata: includeMetadata ? {
      timestamp: new Date().toISOString(),
      format,
      errorCount: errors.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length
    } : undefined
  };

  // Validate the output using Zod schema
  ErrorSnapshotLogSchemas.CLIOutputSchema.parse(output);
  
  return output;
};

const formatAsText = (content: string, errors: AppError[], warnings: string[], suggestions: string[]): string => {
  let output = content + '\n\n';
  
  if (errors.length > 0) {
    output += 'Errors:\n';
    errors.forEach(error => {
      output += `  [${error.severity.toUpperCase()}] ${error.message}\n`;
      if (error.description) output += `    ${error.description}\n`;
    });
    output += '\n';
  }
  
  if (warnings.length > 0) {
    output += 'Warnings:\n';
    warnings.forEach(warning => output += `  - ${warning}\n`);
    output += '\n';
  }
  
  if (suggestions.length > 0) {
    output += 'Suggestions:\n';
    suggestions.forEach(suggestion => output += `  - ${suggestion}\n`);
  }
  
  return output;
};

const formatAsJSON = (content: string, errors: AppError[], warnings: string[], suggestions: string[], includeMetadata: boolean): string => {
  const data: any = { content };
  
  if (errors.length > 0) data.errors = errors;
  if (warnings.length > 0) data.warnings = warnings;
  if (suggestions.length > 0) data.suggestions = suggestions;
  if (includeMetadata) {
    data.metadata = {
      timestamp: new Date().toISOString(),
      errorCount: errors.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length
    };
  }
  
  return JSON.stringify(data, null, 2);
};

const formatAsYAML = (content: string, errors: AppError[], warnings: string[], suggestions: string[], includeMetadata: boolean): string => {
  let output = `content: ${content}\n`;
  
  if (errors.length > 0) {
    output += 'errors:\n';
    errors.forEach(error => {
      output += `  - id: ${error.id}\n`;
      output += `    severity: ${error.severity}\n`;
      output += `    message: ${error.message}\n`;
      if (error.description) output += `    description: ${error.description}\n`;
    });
  }
  
  if (warnings.length > 0) {
    output += 'warnings:\n';
    warnings.forEach(warning => output += `  - ${warning}\n`);
  }
  
  if (suggestions.length > 0) {
    output += 'suggestions:\n';
    suggestions.forEach(suggestion => output += `  - ${suggestion}\n`);
  }
  
  if (includeMetadata) {
    output += `metadata:\n`;
    output += `  timestamp: ${new Date().toISOString()}\n`;
    output += `  errorCount: ${errors.length}\n`;
    output += `  warningCount: ${warnings.length}\n`;
    output += `  suggestionCount: ${suggestions.length}\n`;
  }
  
  return output;
};

const formatAsMarkdown = (content: string, errors: AppError[], warnings: string[], suggestions: string[]): string => {
  let output = `# ${content}\n\n`;
  
  if (errors.length > 0) {
    output += '## Errors\n\n';
    errors.forEach(error => {
      output += `### ${error.severity.toUpperCase()}: ${error.message}\n\n`;
      if (error.description) output += `${error.description}\n\n`;
      output += `- **Component**: ${error.context.component}\n`;
      output += `- **Operation**: ${error.context.operation}\n`;
      output += `- **Category**: ${error.category}\n`;
      if (error.suggestions && error.suggestions.length > 0) {
        output += `- **Suggestions**:\n`;
        error.suggestions.forEach(suggestion => output += `  - ${suggestion}\n`);
      }
      output += '\n';
    });
  }
  
  if (warnings.length > 0) {
    output += '## Warnings\n\n';
    warnings.forEach(warning => output += `- ${warning}\n`);
    output += '\n';
  }
  
  if (suggestions.length > 0) {
    output += '## Suggestions\n\n';
    suggestions.forEach(suggestion => output += `- ${suggestion}\n`);
  }
  
  return output;
};

const formatAsTable = (content: string, errors: AppError[], warnings: string[], suggestions: string[]): string => {
  let output = `# ${content}\n\n`;
  
  if (errors.length > 0) {
    output += '## Errors\n\n';
    output += '| Severity | Message | Component | Operation | Category |\n';
    output += '|----------|---------|-----------|-----------|----------|\n';
    errors.forEach(error => {
      output += `| ${error.severity.toUpperCase()} | ${error.message} | ${error.context.component} | ${error.context.operation} | ${error.category} |\n`;
    });
    output += '\n';
  }
  
  if (warnings.length > 0) {
    output += '## Warnings\n\n';
    output += '| Warning |\n';
    output += '|---------|\n';
    warnings.forEach(warning => output += `| ${warning} |\n`);
    output += '\n';
  }
  
  if (suggestions.length > 0) {
    output += '## Suggestions\n\n';
    output += '| Suggestion |\n';
    output += '|------------|\n';
    suggestions.forEach(suggestion => output += `| ${suggestion} |\n`);
  }
  
  return output;
};

// ============================================================================
// LLM CHAT CONTEXT UTILITIES
// ============================================================================

export const createLLMChatContext = async (params: CreateLLMChatContextParams): Promise<LLMChatContext> => {
  const {
    sessionId,
    conversationId,
    userQuery,
    systemContext,
    errorContext = [],
    snapshotContext = [],
    logContext = [],
    includeSuggestions = true
  } = params;

  const suggestions = includeSuggestions ? generateContextSuggestions(errorContext, snapshotContext, logContext) : [];

  const context: LLMChatContext = {
    sessionId,
    conversationId,
    timestamp: new Date().toISOString(),
    userQuery,
    systemContext,
    errorContext: errorContext.length > 0 ? errorContext : undefined,
    snapshotContext: snapshotContext.length > 0 ? snapshotContext : undefined,
    logContext: logContext.length > 0 ? logContext : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    metadata: {
      errorCount: errorContext.length,
      snapshotCount: snapshotContext.length,
      logEntryCount: logContext.length,
      suggestionCount: suggestions.length
    }
  };

  // Validate the context using Zod schema
  ErrorSnapshotLogSchemas.LLMChatContextSchema.parse(context);
  
  return context;
};

export const generateContextSuggestions = (
  errors: AppError[], 
  snapshots: Snapshot[], 
  logs: LogEntry[]
): string[] => {
  const suggestions: string[] = [];

  // Generate suggestions based on errors
  errors.forEach(error => {
    if (error.suggestions) {
      suggestions.push(...error.suggestions);
    }
    
    // Add contextual suggestions based on error type
    switch (error.category) {
      case 'timeout':
        suggestions.push('Consider increasing timeout limits or optimizing the operation');
        break;
      case 'resource':
        suggestions.push('Check system resources and consider scaling or optimization');
        break;
      case 'permission':
        suggestions.push('Verify user permissions and access rights');
        break;
      case 'validation':
        suggestions.push('Review input data and validation rules');
        break;
      case 'network':
        suggestions.push('Check network connectivity and service availability');
        break;
    }
  });

  // Generate suggestions based on log patterns
  const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'fatal');
  if (errorLogs.length > 0) {
    suggestions.push(`Review ${errorLogs.length} error log entries for patterns`);
  }

  // Generate suggestions based on snapshots
  if (snapshots.length > 0) {
    suggestions.push(`Analyze ${snapshots.length} snapshots for system state insights`);
  }

  return [...new Set(suggestions)]; // Remove duplicates
};

// ============================================================================
// FOSSIL CREATION UTILITIES
// ============================================================================



export const createErrorFossil = (params: CreateErrorFossilParams): ErrorFossil => {
  const { error, relatedErrors = [], resolution = null, impact = 'medium', tags = [] } = params;

  const fossil: ErrorFossil = {
    type: 'error_fossil',
    source: 'error-snapshot-log-utils',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    fossilId: uuidv4(),
    fossilHash: `error-${error.id}`,
    error,
    relatedErrors,
    resolution,
    impact,
    tags: [...tags, 'error', error.category, error.severity, impact],
    metadata: {
      errorId: error.id,
      severity: error.severity,
      category: error.category,
      impact,
      resolved: !!resolution
    }
  };

  return fossil;
}; 