#!/usr/bin/env bun
// ============================================================================
// ERROR, SNAPSHOT, AND LOG UNDERSTANDING CLI
// ============================================================================
// CLI command for error handling, snapshot generation, and log understanding
// Demonstrates the robust pattern-based approach aligned with TYPE_AND_SCHEMA_PATTERNS.md

import { z } from 'zod';
import { 
  createError, 
  handleError, 
  createErrorSnapshot, 
  analyzeLogs, 
  formatCLIOutput,
  createLLMChatContext,
  createErrorFossil,
  createSnapshotFossil,
  createLogAnalysisFossil
} from '../utils/errorSnapshotLogUtils';
import { 
  ErrorSnapshotLogSchemas,
  CLIOutputFormat,
  LogLevel,
  CreateErrorCLIParams,
  HandleErrorCLIParams,
  CreateSnapshotCLIParams,
  AnalyzeLogsCLIParams,
  FormatOutputCLIParams,
  CreateContextCLIParams,
  CreateFossilsCLIParams
} from '../types/error-snapshot-log';
import { BaseCLIArgsSchema } from '../types/schemas';
import { parseCLIArgs } from '../types/cli';

// ============================================================================
// CLI ARGUMENT SCHEMAS (FOLLOWING PROJECT PATTERNS)
// ============================================================================

export const ErrorSnapshotLogCLIArgsSchema = BaseCLIArgsSchema.extend({
  command: z.enum(['create-error', 'handle-error', 'create-snapshot', 'analyze-logs', 'format-output', 'create-context', 'create-fossils']),
  message: z.string().optional(),
  severity: z.enum(['debug', 'info', 'warning', 'error', 'critical']).optional(),
  category: z.enum(['validation', 'execution', 'timeout', 'resource', 'network', 'permission', 'configuration', 'dependency', 'unknown']).optional(),
  operation: z.string().optional(),
  component: z.string().optional(),
  format: z.enum(['text', 'json', 'yaml', 'markdown', 'table']).default('text'),
  includeContext: z.boolean().default(true),
  includeStackTrace: z.boolean().default(false),
  includeSuggestions: z.boolean().default(true),
  logToConsole: z.boolean().default(true),
  createSnapshot: z.boolean().default(false),
  generateReport: z.boolean().default(false),
  inputFile: z.string().optional(),
  outputFile: z.string().optional(),
  sessionId: z.string().optional(),
  conversationId: z.string().optional(),
  userQuery: z.string().optional(),
  systemContext: z.string().optional(),
  impact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string()).default([]),
});

// ============================================================================
// CLI COMMAND IMPLEMENTATIONS
// ============================================================================



export const createErrorCLI = async (params: CreateErrorCLIParams): Promise<void> => {
  const {
    message,
    severity,
    category,
    operation,
    component,
    format,
    includeContext = true,
    includeStackTrace = false,
    includeSuggestions = true,
    logToConsole = true,
    createSnapshot = false,
    generateReport = false,
    outputFile
  } = params;

  // Create error using the utility function
  const error = createError({
    message,
    severity,
    category,
    operation,
    component,
    function: 'createErrorCLI',
    line: 1,
    column: 1,
    stackTrace: includeStackTrace ? new Error().stack?.split('\n').slice(1) : undefined,
    sessionId: 'cli-session',
    requestId: 'cli-request',
    description: `Error created via CLI command`,
    suggestions: includeSuggestions ? [
      'Review the operation parameters',
      'Check component configuration',
      'Verify system resources'
    ] : undefined,
    actionable: true,
    retryable: category === 'timeout' || category === 'network',
    metadata: {
      source: 'cli',
      command: 'create-error'
    }
  });

  // Handle the error
  const result = await handleError({
    error,
    logToConsole,
    createSnapshot,
    generateReport,
    format
  });

  // Output results
  if (result.report) {
    console.log(result.report.content);
  } else {
    const output = await formatCLIOutput({
      content: `Error created successfully: ${error.message}`,
      format,
      errors: [error],
      includeMetadata: true
    });
    console.log(output.content);
  }

  // Save to file if requested
  if (outputFile) {
    const fs = await import('fs/promises');
    const output = await formatCLIOutput({
      content: `Error Report: ${error.message}`,
      format: 'json',
      errors: [error],
      includeMetadata: true
    });
    await fs.writeFile(outputFile, output.content);
    console.log(`Error saved to: ${outputFile}`);
  }
};



export const handleErrorCLI = async (params: HandleErrorCLIParams): Promise<void> => {
  const {
    errorId,
    format,
    logToConsole = true,
    createSnapshot = false,
    generateReport = false,
    outputFile
  } = params;

  // Create a sample error for demonstration
  const error = createError({
    message: errorId ? `Handling error: ${errorId}` : 'Sample error for handling',
    severity: 'error',
    category: 'execution',
    operation: 'handleErrorCLI',
    component: 'cli',
    function: 'handleErrorCLI',
    sessionId: 'cli-session',
    requestId: 'cli-request',
    description: 'Error handled via CLI command',
    suggestions: [
      'Review the error context',
      'Check system logs',
      'Consider retrying the operation'
    ],
    actionable: true,
    retryable: true,
    metadata: {
      source: 'cli',
      command: 'handle-error'
    }
  });

  // Handle the error
  const result = await handleError({
    error,
    logToConsole,
    createSnapshot,
    generateReport,
    format
  });

  // Output results
  if (result.report) {
    console.log(result.report.content);
  }

  // Save to file if requested
  if (outputFile) {
    const fs = await import('fs/promises');
    const output = await formatCLIOutput({
      content: `Error Handling Report: ${error.message}`,
      format: 'json',
      errors: [error],
      includeMetadata: true
    });
    await fs.writeFile(outputFile, output.content);
    console.log(`Report saved to: ${outputFile}`);
  }
};


export const createSnapshotCLI = async (params: CreateSnapshotCLIParams): Promise<void> => {
  const {
    errorId,
    format,
    includeContext = true,
    includeStackTrace = false,
    includeSuggestions = true,
    outputFile
  } = params;

  // Create a sample error for snapshot
  const error = createError({
    message: errorId ? `Snapshot for error: ${errorId}` : 'Sample error for snapshot',
    severity: 'error',
    category: 'execution',
    operation: 'createSnapshotCLI',
    component: 'cli',
    function: 'createSnapshotCLI',
    sessionId: 'cli-session',
    requestId: 'cli-request',
    description: 'Error snapshot created via CLI command',
    suggestions: [
      'Analyze the snapshot data',
      'Review system state',
      'Check for patterns'
    ],
    actionable: true,
    retryable: false,
    metadata: {
      source: 'cli',
      command: 'create-snapshot'
    }
  });

  // Create snapshot
  const snapshot = await createErrorSnapshot({
    error,
    includeContext,
    includeStackTrace,
    includeSuggestions,
    format
  });

  // Format and output
  const output = await formatCLIOutput({
    content: `Snapshot created: ${snapshot.id}`,
    format,
    errors: [error],
    includeMetadata: true
  });

  console.log(output.content);

  // Save to file if requested
  if (outputFile) {
    const fs = await import('fs/promises');
    const snapshotOutput = await formatCLIOutput({
      content: `Snapshot Report: ${snapshot.id}`,
      format: 'json',
      errors: [error],
      includeMetadata: true
    });
    await fs.writeFile(outputFile, snapshotOutput.content);
    console.log(`Snapshot saved to: ${outputFile}`);
  }
};


export const analyzeLogsCLI = async (params: AnalyzeLogsCLIParams): Promise<void> => {
  const {
    inputFile,
    format,
    includePatterns = true,
    includeMetrics = true,
    outputFile
  } = params;

  // Create sample log entries for demonstration
  const logEntries = [
    {
      timestamp: new Date().toISOString(),
      level: 'info' as LogLevel,
      message: 'Application started',
      component: 'cli',
      operation: 'analyzeLogsCLI',
      context: { source: 'cli' },
      metadata: { command: 'analyze-logs' }
    },
    {
      timestamp: new Date().toISOString(),
      level: 'error' as LogLevel,
      message: 'Sample error for analysis',
      component: 'cli',
      operation: 'analyzeLogsCLI',
      context: { source: 'cli' },
      metadata: { command: 'analyze-logs' }
    },
    {
      timestamp: new Date().toISOString(),
      level: 'warn' as LogLevel,
      message: 'Sample warning for analysis',
      component: 'cli',
      operation: 'analyzeLogsCLI',
      context: { source: 'cli' },
      metadata: { command: 'analyze-logs' }
    }
  ];

  // Analyze logs
  const analysis = await analyzeLogs({
    logEntries,
    includePatterns,
    includeMetrics,
    format
  });

  // Format and output
  const output = await formatCLIOutput({
    content: `Log Analysis Report`,
    format,
    warnings: [`Total entries: ${analysis.totalEntries}`, `Error count: ${analysis.errorCount}`],
    includeMetadata: true
  });

  console.log(output.content);

  // Save to file if requested
  if (outputFile) {
    const fs = await import('fs/promises');
    const analysisOutput = await formatCLIOutput({
      content: `Log Analysis Report`,
      format: 'json',
      warnings: [`Total entries: ${analysis.totalEntries}`, `Error count: ${analysis.errorCount}`],
      includeMetadata: true
    });
    await fs.writeFile(outputFile, analysisOutput.content);
    console.log(`Analysis saved to: ${outputFile}`);
  }
};


export const formatOutputCLI = async (params: FormatOutputCLIParams): Promise<void> => {
  const {
    content,
    format,
    errors = [],
    warnings = [],
    suggestions = [],
    outputFile
  } = params;

  // Create sample errors for formatting
  const sampleErrors = errors.map((message, index) => createError({
    message,
    severity: 'error',
    category: 'execution',
    operation: 'formatOutputCLI',
    component: 'cli',
    function: 'formatOutputCLI',
    sessionId: 'cli-session',
    requestId: 'cli-request',
    description: `Formatted error ${index + 1}`,
    actionable: true,
    retryable: false,
    metadata: {
      source: 'cli',
      command: 'format-output'
    }
  }));

  // Format output
  const output = await formatCLIOutput({
    content,
    format,
    errors: sampleErrors,
    warnings,
    suggestions,
    includeMetadata: true
  });

  console.log(output.content);

  // Save to file if requested
  if (outputFile) {
    const fs = await import('fs/promises');
    await fs.writeFile(outputFile, output.content);
    console.log(`Output saved to: ${outputFile}`);
  }
};


export const createContextCLI = async (params: CreateContextCLIParams): Promise<void> => {
  const {
    sessionId,
    conversationId,
    userQuery,
    systemContext,
    format,
    includeSuggestions = true,
    outputFile
  } = params;

  // Create sample errors and logs for context
  const sampleError = createError({
    message: 'Sample error for context',
    severity: 'error',
    category: 'execution',
    operation: 'createContextCLI',
    component: 'cli',
    function: 'createContextCLI',
    sessionId,
    requestId: 'cli-request',
    description: 'Error for LLM chat context',
    suggestions: ['Review the error', 'Check logs'],
    actionable: true,
    retryable: true,
    metadata: {
      source: 'cli',
      command: 'create-context'
    }
  });

  const sampleLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info' as LogLevel,
      message: 'Sample log for context',
      component: 'cli',
      operation: 'createContextCLI',
      context: { source: 'cli' },
      metadata: { command: 'create-context' }
    }
  ];

  // Create context
  const context = await createLLMChatContext({
    sessionId,
    conversationId,
    userQuery,
    systemContext,
    errorContext: [sampleError],
    logContext: sampleLogs,
    includeSuggestions
  });

  // Format and output
  const output = await formatCLIOutput({
    content: `LLM Chat Context created: ${context.conversationId}`,
    format,
    warnings: [`Session: ${context.sessionId}`, `Query: ${context.userQuery}`],
    includeMetadata: true
  });

  console.log(output.content);

  // Save to file if requested
  if (outputFile) {
    const fs = await import('fs/promises');
    const contextOutput = await formatCLIOutput({
      content: `LLM Chat Context Report`,
      format: 'json',
      warnings: [`Session: ${context.sessionId}`, `Query: ${context.userQuery}`],
      includeMetadata: true
    });
    await fs.writeFile(outputFile, contextOutput.content);
    console.log(`Context saved to: ${outputFile}`);
  }
};


export const createFossilsCLI = async (params: CreateFossilsCLIParams): Promise<void> => {
  const { errorId, impact, tags, outputFile } = params;
  
  // Create error snapshot fossil
  const snapshotFossil = {
    errorId,
    impact: impact || 'medium',
    tags: tags || [],
    timestamp: new Date().toISOString(),
    fossilized: true,
    canonical: true
  };
  
  // Use canonical fossil manager instead of direct file creation
  try {
    const { CanonicalFossilManager } = await import('./canonical-fossil-manager');
    const fossilManager = new CanonicalFossilManager();
    
    // Save as analysis result using canonical fossil manager
    const analysisData = {
      timestamp: snapshotFossil.timestamp,
      commit_hash: 'error-snapshot',
      analysis_type: 'Error Snapshot Fossil',
      insights: [
        {
          type: 'error-snapshot',
          severity: impact || 'medium',
          description: `Error snapshot created for ${errorId}`,
          recommendations: []
        }
      ],
      summary: {
        total_insights: 1,
        critical_insights: impact === 'critical' ? 1 : 0,
        high_insights: impact === 'high' ? 1 : 0,
        medium_insights: impact === 'medium' ? 1 : 0,
        low_insights: impact === 'low' ? 1 : 0,
        overall_status: impact || 'medium'
      },
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: 1,
        errorId,
        tags
      }
    };
    
    await fossilManager.updateAnalysisResults(analysisData, { generateYaml: true });
    console.log(`✅ Error snapshot fossil created using canonical fossil manager`);
    
  } catch (error) {
    console.warn('⚠️  Failed to create fossil using canonical manager, falling back to direct save:', error);
    
    // Fallback to direct file creation for backward compatibility
    const fs = await import('fs/promises');
    const fossilsData = {
      snapshotFossil,
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'cli',
        command: 'create-fossils'
      }
    };
    await fs.writeFile(outputFile || 'fossils/error-snapshot.json', JSON.stringify(fossilsData, null, 2));
    console.log(`Fossils saved to: ${outputFile || 'fossils/error-snapshot.json'}`);
  }
};

// ============================================================================
// MAIN CLI FUNCTION
// ============================================================================

export const main = async (): Promise<void> => {
  try {
    // Parse CLI arguments using the project's parseCLIArgs utility
    const parsedArgs = parseCLIArgs(ErrorSnapshotLogCLIArgsSchema, process.argv.slice(2));
    
    // Show help if requested
    if (parsedArgs.help) {
      console.log(`
Error, Snapshot, and Log Understanding CLI

Usage: bun run error-snapshot-log <command> [options]

Commands:
  create-error <message> <severity> <category> <operation> <component> [format]
  handle-error [errorId] [format]
  create-snapshot [errorId] [format]
  analyze-logs [inputFile] [format]
  format-output <content> [format]
  create-context <sessionId> <conversationId> <userQuery> [format]
  create-fossils [errorId] [impact]

Options:
  --format <format>           Output format (text, json, yaml, markdown, table)
  --include-context          Include context in snapshots
  --include-stack-trace      Include stack trace in snapshots
  --include-suggestions      Include suggestions in output
  --no-console              Don't log to console
  --create-snapshot         Create snapshot when handling errors
  --generate-report         Generate detailed report
  --input <file>            Input file path
  --output <file>           Output file path
  --session <id>            Session ID for context
  --conversation <id>       Conversation ID for context
  --query <text>            User query for context
  --system <text>           System context
  --impact <level>          Impact level (low, medium, high, critical)
  --tag <tag>               Add tag (can be used multiple times)
  --dry-run                 Show what would be done without executing
  --test                    Run in test mode
  --verbose                 Enable verbose output
  --help                    Show this help message

Examples:
  bun run error-snapshot-log create-error "Test error" error execution test-operation cli json
  bun run error-snapshot-log handle-error --create-snapshot --generate-report --format markdown
  bun run error-snapshot-log analyze-logs --input logs.json --output analysis.json
  bun run error-snapshot-log create-context session-123 conv-456 "How to fix this error?" json
`);
      return;
    }



    // Execute command based on parsed arguments
    switch (parsedArgs.command) {
      case 'create-error':
        if (!parsedArgs.message || !parsedArgs.severity || !parsedArgs.category || !parsedArgs.operation || !parsedArgs.component) {
          throw new Error('Missing required arguments for create-error command');
        }
        await createErrorCLI({
          message: parsedArgs.message,
          severity: parsedArgs.severity,
          category: parsedArgs.category,
          operation: parsedArgs.operation,
          component: parsedArgs.component,
          format: parsedArgs.format,
          includeContext: parsedArgs.includeContext,
          includeStackTrace: parsedArgs.includeStackTrace,
          includeSuggestions: parsedArgs.includeSuggestions,
          logToConsole: parsedArgs.logToConsole,
          createSnapshot: parsedArgs.createSnapshot,
          generateReport: parsedArgs.generateReport,
          outputFile: parsedArgs.outputFile
        });
        break;

      case 'handle-error':
        await handleErrorCLI({
          errorId: parsedArgs.message,
          format: parsedArgs.format,
          logToConsole: parsedArgs.logToConsole,
          createSnapshot: parsedArgs.createSnapshot,
          generateReport: parsedArgs.generateReport,
          outputFile: parsedArgs.outputFile
        });
        break;

      case 'create-snapshot':
        await createSnapshotCLI({
          errorId: parsedArgs.message,
          format: parsedArgs.format,
          includeContext: parsedArgs.includeContext,
          includeStackTrace: parsedArgs.includeStackTrace,
          includeSuggestions: parsedArgs.includeSuggestions,
          outputFile: parsedArgs.outputFile
        });
        break;

      case 'analyze-logs':
        await analyzeLogsCLI({
          inputFile: parsedArgs.inputFile,
          format: parsedArgs.format,
          includePatterns: true,
          includeMetrics: true,
          outputFile: parsedArgs.outputFile
        });
        break;

      case 'format-output':
        if (!parsedArgs.message) {
          throw new Error('Missing content for format-output command');
        }
        await formatOutputCLI({
          content: parsedArgs.message,
          format: parsedArgs.format,
          outputFile: parsedArgs.outputFile
        });
        break;

      case 'create-context':
        if (!parsedArgs.sessionId || !parsedArgs.conversationId || !parsedArgs.userQuery) {
          throw new Error('Missing required arguments for create-context command');
        }
        await createContextCLI({
          sessionId: parsedArgs.sessionId,
          conversationId: parsedArgs.conversationId,
          userQuery: parsedArgs.userQuery,
          systemContext: parsedArgs.systemContext,
          format: parsedArgs.format,
          includeSuggestions: parsedArgs.includeSuggestions,
          outputFile: parsedArgs.outputFile
        });
        break;

      case 'create-fossils':
        await createFossilsCLI({
          errorId: parsedArgs.message,
          impact: parsedArgs.impact,
          tags: parsedArgs.tags,
          outputFile: parsedArgs.outputFile
        });
        break;

      default:
        throw new Error(`Unknown command: ${parsedArgs.command}`);
    }

  } catch (error) {
    // Use our error handling utilities
    const cliError = createError({
      message: error instanceof Error ? error.message : 'Unknown CLI error',
      severity: 'error',
      category: 'execution',
      operation: 'main',
      component: 'cli',
      function: 'main',
      sessionId: 'cli-session',
      requestId: 'cli-request',
      description: 'Error occurred during CLI execution',
      originalError: error,
      suggestions: [
        'Check command syntax',
        'Verify required arguments',
        'Review help documentation'
      ],
      actionable: true,
      retryable: false,
      metadata: {
        source: 'cli',
        command: 'main'
      }
    });

    await handleError({
      error: cliError,
      logToConsole: true,
      createSnapshot: false,
      generateReport: true,
      format: 'text'
    });

    process.exit(1);
  }
};

// Run the CLI if this file is executed directly
if (import.meta.main) {
  main();
} 