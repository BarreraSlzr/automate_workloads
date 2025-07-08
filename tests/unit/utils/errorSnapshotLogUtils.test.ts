// ============================================================================
// ERROR, SNAPSHOT, AND LOG UNDERSTANDING UTILITIES TESTS
// ============================================================================
// Unit tests for error handling, snapshot generation, and log understanding utilities
// Validates the robust pattern-based approach aligned with TYPE_AND_SCHEMA_PATTERNS.md

import { describe, it, expect, beforeEach } from 'bun:test';
import { 
  createError,
  handleError,
  createErrorSnapshot,
  analyzeLogs,
  formatCLIOutput,
  createLLMChatContext,
  createErrorFossil,
  createSnapshotFossil,
  createLogAnalysisFossil,
  detectErrorPatterns,
  calculatePerformanceMetrics,
  generateContextSuggestions
} from '../../../src/utils/errorSnapshotLogUtils';
import { 
  ErrorSnapshotLogSchemas,
  AppError,
  Snapshot,
  LogEntry,
  LogAnalysis,
  CLIOutput,
  LLMChatContext,
  ErrorFossil,
  SnapshotFossil,
  LogAnalysisFossil
} from '../../../src/types/error-snapshot-log';

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Error, Snapshot, and Log Understanding Utilities', () => {
  let sampleError: AppError;
  let sampleLogEntries: LogEntry[];

  beforeEach(() => {
    // Create a sample error for testing
    sampleError = createError({
      message: 'Test error message',
      severity: 'error',
      category: 'execution',
      operation: 'test-operation',
      component: 'test-component',
      function: 'testFunction',
      line: 42,
      column: 10,
      stackTrace: ['Error: Test error', '    at testFunction (test.ts:42:10)'],
      sessionId: 'test-session',
      requestId: 'test-request',
      userId: 'test-user',
      description: 'This is a test error for unit testing',
      originalError: new Error('Original test error'),
      suggestions: [
        'Check the test parameters',
        'Verify the test environment',
        'Review the test logic'
      ],
      actionable: true,
      retryable: true,
      metadata: {
        test: true,
        source: 'unit-test'
      }
    });

    // Create sample log entries for testing
    sampleLogEntries = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Application started',
        component: 'test-component',
        operation: 'test-operation',
        context: { test: true },
        metadata: { source: 'unit-test' }
      },
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Test error occurred',
        component: 'test-component',
        operation: 'test-operation',
        context: { test: true },
        metadata: { source: 'unit-test' }
      },
      {
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Test warning message',
        component: 'test-component',
        operation: 'test-operation',
        context: { test: true },
        metadata: { source: 'unit-test' }
      }
    ];
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('createError', () => {
    it('should create a valid error with all required fields', () => {
      const error = createError({
        message: 'Test error',
        severity: 'error',
        category: 'execution',
        operation: 'test',
        component: 'test'
      });

      expect(error).toBeDefined();
      expect(error.id).toBeDefined();
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe('error');
      expect(error.category).toBe('execution');
      expect(error.context.operation).toBe('test');
      expect(error.context.component).toBe('test');
      expect(error.createdAt).toBeDefined();
    });

    it('should validate error using Zod schema', () => {
      const error = createError({
        message: 'Test error',
        severity: 'error',
        category: 'execution',
        operation: 'test',
        component: 'test'
      });

      // This should not throw if the error is valid
      expect(() => ErrorSnapshotLogSchemas.ErrorSchema.parse(error)).not.toThrow();
    });

    it('should include optional fields when provided', () => {
      const error = createError({
        message: 'Test error',
        severity: 'error',
        category: 'execution',
        operation: 'test',
        component: 'test',
        function: 'testFunction',
        line: 42,
        column: 10,
        stackTrace: ['Error: Test'],
        sessionId: 'test-session',
        requestId: 'test-request',
        userId: 'test-user',
        description: 'Test description',
        originalError: new Error('Original'),
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        actionable: true,
        retryable: true,
        metadata: { test: true }
      });

      expect(error.context.function).toBe('testFunction');
      expect(error.context.line).toBe(42);
      expect(error.context.column).toBe(10);
      expect(error.context.stackTrace).toEqual(['Error: Test']);
      expect(error.context.sessionId).toBe('test-session');
      expect(error.context.requestId).toBe('test-request');
      expect(error.context.userId).toBe('test-user');
      expect(error.description).toBe('Test description');
      expect(error.originalError).toBeDefined();
      expect(error.suggestions).toEqual(['Suggestion 1', 'Suggestion 2']);
      expect(error.actionable).toBe(true);
      expect(error.retryable).toBe(true);
      expect(error.context.metadata).toEqual({ test: true });
    });

    it('should set default values correctly', () => {
      const error = createError({
        message: 'Test error',
        severity: 'error',
        category: 'execution',
        operation: 'test',
        component: 'test'
      });

      expect(error.actionable).toBe(true);
      expect(error.retryable).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should handle error with console logging', async () => {
      const result = await handleError({
        error: sampleError,
        logToConsole: true,
        createSnapshot: false,
        generateReport: false
      });

      expect(result.error).toBe(sampleError);
    });

    it('should create snapshot when requested', async () => {
      const result = await handleError({
        error: sampleError,
        logToConsole: false,
        createSnapshot: true,
        generateReport: false
      });

      expect(result.snapshot).toBeDefined();
      expect(result.snapshot?.type).toBe('error');
      expect(result.snapshot?.context.trigger).toBe('error_occurred');
      expect(result.snapshot?.data.errors).toContain(sampleError);
    });

    it('should generate report when requested', async () => {
      const result = await handleError({
        error: sampleError,
        logToConsole: false,
        createSnapshot: false,
        generateReport: true,
        format: 'text'
      });

      expect(result.report).toBeDefined();
      expect(result.report?.format).toBe('text');
      expect(result.report?.content).toContain('Error Report');
      expect(result.report?.errors).toContain(sampleError);
    });

    it('should handle different severity levels correctly', async () => {
      const debugError = createError({
        message: 'Debug error',
        severity: 'debug',
        category: 'execution',
        operation: 'test',
        component: 'test'
      });

      const warningError = createError({
        message: 'Warning error',
        severity: 'warning',
        category: 'execution',
        operation: 'test',
        component: 'test'
      });

      await handleError({ error: debugError, logToConsole: true });
      await handleError({ error: warningError, logToConsole: true });

      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // SNAPSHOT TESTS
  // ============================================================================

  describe('createErrorSnapshot', () => {
    it('should create a valid snapshot', async () => {
      const snapshot = await createErrorSnapshot({
        error: sampleError,
        includeContext: true,
        includeStackTrace: true,
        includeSuggestions: true,
        format: 'json'
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.type).toBe('error');
      expect(snapshot.context.trigger).toBe('error_occurred');
      expect(snapshot.context.source).toBe(sampleError.context.component);
      expect(snapshot.context.component).toBe(sampleError.context.component);
      expect(snapshot.context.operation).toBe(sampleError.context.operation);
      expect(snapshot.data.errors).toContain(sampleError);
      expect(snapshot.createdAt).toBeDefined();
      expect(snapshot.tags).toContain('error');
      expect(snapshot.tags).toContain(sampleError.category);
      expect(snapshot.tags).toContain(sampleError.severity);
    });

    it('should validate snapshot using Zod schema', async () => {
      const snapshot = await createErrorSnapshot({
        error: sampleError,
        includeContext: true,
        includeStackTrace: false,
        includeSuggestions: true,
        format: 'json'
      });

      expect(() => ErrorSnapshotLogSchemas.SnapshotSchema.parse(snapshot)).not.toThrow();
    });

    it('should include context when requested', async () => {
      const snapshot = await createErrorSnapshot({
        error: sampleError,
        includeContext: true,
        includeStackTrace: false,
        includeSuggestions: false,
        format: 'json'
      });

      expect(snapshot.data.context).toBeDefined();
      expect(snapshot.data.context).toEqual(sampleError.context);
    });

    it('should include suggestions when requested', async () => {
      const snapshot = await createErrorSnapshot({
        error: sampleError,
        includeContext: false,
        includeStackTrace: false,
        includeSuggestions: true,
        format: 'json'
      });

      expect(snapshot.data.warnings).toEqual(sampleError.suggestions || []);
    });

    it('should not include context when not requested', async () => {
      const snapshot = await createErrorSnapshot({
        error: sampleError,
        includeContext: false,
        includeStackTrace: false,
        includeSuggestions: false,
        format: 'json'
      });

      expect(snapshot.data.context).toBeUndefined();
    });
  });

  describe('createSnapshotFossil', () => {
    it('should create a valid snapshot fossil', async () => {
      const snapshot = await createErrorSnapshot({
        error: sampleError,
        includeContext: true,
        includeStackTrace: false,
        includeSuggestions: true,
        format: 'json'
      });

      const fossil = createSnapshotFossil({
        snapshot,
        insights: ['Test insight'],
        recommendations: ['Test recommendation'],
        tags: ['test-tag']
      });

      expect(fossil).toBeDefined();
      expect(fossil.type).toBe('snapshot_fossil');
      expect(fossil.source).toBe('error-snapshot-log-utils');
      expect(fossil.createdBy).toBe('system');
      expect(fossil.fossilId).toBeDefined();
      expect(fossil.fossilHash).toBe(`snapshot-${snapshot.id}`);
      expect(fossil.snapshot).toBe(snapshot);
      expect(fossil.insights).toEqual(['Test insight']);
      expect(fossil.recommendations).toEqual(['Test recommendation']);
      expect(fossil.tags).toContain('test-tag');
      expect(fossil.tags).toContain('snapshot');
      expect(fossil.tags).toContain(snapshot.type);
    });
  });

  // ============================================================================
  // LOG ANALYSIS TESTS
  // ============================================================================

  describe('analyzeLogs', () => {
    it('should analyze logs and return valid analysis', async () => {
      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        includePatterns: true,
        includeMetrics: true,
        format: 'text'
      });

      expect(analysis).toBeDefined();
      expect(analysis.totalEntries).toBe(3);
      expect(analysis.errorCount).toBe(1);
      expect(analysis.warningCount).toBe(1);
      expect(analysis.infoCount).toBe(1);
      expect(analysis.debugCount).toBe(0);
      expect(analysis.timeRange).toBeDefined();
      expect(analysis.errorPatterns).toBeDefined();
      expect(analysis.performanceMetrics).toBeDefined();
    });

    it('should validate analysis using Zod schema', async () => {
      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        includePatterns: true,
        includeMetrics: true,
        format: 'text'
      });

      expect(() => ErrorSnapshotLogSchemas.LogAnalysisSchema.parse(analysis)).not.toThrow();
    });

    it('should calculate time range from log entries', async () => {
      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        includePatterns: false,
        includeMetrics: false,
        format: 'text'
      });

      expect(analysis.timeRange?.start).toBe(sampleLogEntries[0]?.timestamp || '');
      expect(analysis.timeRange?.end).toBe(sampleLogEntries[sampleLogEntries.length - 1]?.timestamp || '');
    });

    it('should use provided time range when available', async () => {
      const customTimeRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      };

      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        timeRange: customTimeRange,
        includePatterns: false,
        includeMetrics: false,
        format: 'text'
      });

      expect(analysis.timeRange).toEqual(customTimeRange);
    });

    it('should include patterns when requested', async () => {
      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        includePatterns: true,
        includeMetrics: false,
        format: 'text'
      });

      expect(analysis.errorPatterns).toBeDefined();
      expect(Array.isArray(analysis.errorPatterns)).toBe(true);
    });

    it('should include metrics when requested', async () => {
      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        includePatterns: false,
        includeMetrics: true,
        format: 'text'
      });

      expect(analysis.performanceMetrics).toBeDefined();
      expect(analysis.performanceMetrics?.errorRate).toBeDefined();
    });
  });

  describe('detectErrorPatterns', () => {
    it('should detect error patterns in log entries', async () => {
      const errorEntries = [
        {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: 'Connection timeout occurred',
          component: 'test',
          operation: 'test',
          context: {},
          metadata: {}
        },
        {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: 'Permission denied for file access',
          component: 'test',
          operation: 'test',
          context: {},
          metadata: {}
        },
        {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: 'Network connection failed',
          component: 'test',
          operation: 'test',
          context: {},
          metadata: {}
        }
      ];

      const patterns = await detectErrorPatterns(errorEntries);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);

      const timeoutPattern = patterns.find(p => p.pattern === 'timeout');
      const permissionPattern = patterns.find(p => p.pattern === 'permission');
      const networkPattern = patterns.find(p => p.pattern === 'network');

      expect(timeoutPattern).toBeDefined();
      expect(permissionPattern).toBeDefined();
      expect(networkPattern).toBeDefined();

      expect(timeoutPattern?.count).toBe(1);
      expect(permissionPattern?.count).toBe(1);
      expect(networkPattern?.count).toBe(1);
    });

    it('should limit examples to 3 per pattern', async () => {
      const errorEntries = Array.from({ length: 5 }, (_, i) => ({
        timestamp: new Date().toISOString(),
        level: 'error' as const,
        message: `Timeout error ${i + 1}`,
        component: 'test',
        operation: 'test',
        context: {},
        metadata: {}
      }));

      const patterns = await detectErrorPatterns(errorEntries);

      const timeoutPattern = patterns.find(p => p.pattern === 'timeout');
      expect(timeoutPattern).toBeDefined();
      expect(timeoutPattern?.count).toBe(5);
      expect(timeoutPattern?.examples.length).toBeLessThanOrEqual(3);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate error rate correctly', () => {
      const metrics = calculatePerformanceMetrics(sampleLogEntries);

      expect(metrics).toBeDefined();
      expect(metrics?.errorRate).toBe(1 / 3); // 1 error out of 3 total entries
    });

    it('should handle empty log entries', () => {
      const metrics = calculatePerformanceMetrics([]);

      expect(metrics).toBeDefined();
      expect(metrics?.errorRate).toBe(0);
    });
  });

  describe('createLogAnalysisFossil', () => {
    it('should create a valid log analysis fossil', async () => {
      const analysis = await analyzeLogs({
        logEntries: sampleLogEntries,
        includePatterns: true,
        includeMetrics: true,
        format: 'text'
      });

      const fossil = createLogAnalysisFossil({
        analysis,
        patterns: analysis.errorPatterns,
        recommendations: ['Test recommendation'],
        actionItems: ['Test action item'],
        tags: ['test-tag']
      });

      expect(fossil).toBeDefined();
      expect(fossil.type).toBe('log_analysis_fossil');
      expect(fossil.source).toBe('error-snapshot-log-utils');
      expect(fossil.createdBy).toBe('system');
      expect(fossil.fossilId).toBeDefined();
      expect(fossil.fossilHash).toBe(`log-analysis-${analysis.totalEntries}-${analysis.errorCount}`);
      expect(fossil.analysis).toBe(analysis);
      expect(fossil.patterns).toBe(analysis.errorPatterns);
      expect(fossil.recommendations).toEqual(['Test recommendation']);
      expect(fossil.actionItems).toEqual(['Test action item']);
      expect(fossil.tags).toContain('test-tag');
      expect(fossil.tags).toContain('log-analysis');
      expect(fossil.tags).toContain('monitoring');
    });
  });

  // ============================================================================
  // CLI OUTPUT FORMATTING TESTS
  // ============================================================================

  describe('formatCLIOutput', () => {
    it('should format output as text', async () => {
      const output = await formatCLIOutput({
        content: 'Test content',
        format: 'text',
        errors: [sampleError],
        warnings: ['Test warning'],
        suggestions: ['Test suggestion'],
        includeMetadata: true
      });

      expect(output).toBeDefined();
      expect(output.format).toBe('text');
      expect(output.content).toContain('Test content');
      expect(output.content).toContain('Errors:');
      expect(output.content).toContain('Warnings:');
      expect(output.content).toContain('Suggestions:');
      expect(output.errors).toContain(sampleError);
      expect(output.warnings).toContain('Test warning');
      expect(output.suggestions).toContain('Test suggestion');
      expect(output.metadata).toBeDefined();
    });

    it('should format output as JSON', async () => {
      const output = await formatCLIOutput({
        content: 'Test content',
        format: 'json',
        errors: [sampleError],
        warnings: ['Test warning'],
        suggestions: ['Test suggestion'],
        includeMetadata: true
      });

      expect(output).toBeDefined();
      expect(output.format).toBe('json');
      expect(output.content).toContain('"content": "Test content"');
      expect(output.content).toContain('"errors"');
      expect(output.content).toContain('"warnings"');
      expect(output.content).toContain('"suggestions"');
      expect(output.content).toContain('"metadata"');
    });

    it('should format output as YAML', async () => {
      const output = await formatCLIOutput({
        content: 'Test content',
        format: 'yaml',
        errors: [sampleError],
        warnings: ['Test warning'],
        suggestions: ['Test suggestion'],
        includeMetadata: true
      });

      expect(output).toBeDefined();
      expect(output.format).toBe('yaml');
      expect(output.content).toContain('content: Test content');
      expect(output.content).toContain('errors:');
      expect(output.content).toContain('warnings:');
      expect(output.content).toContain('suggestions:');
      expect(output.content).toContain('metadata:');
    });

    it('should format output as markdown', async () => {
      const output = await formatCLIOutput({
        content: 'Test content',
        format: 'markdown',
        errors: [sampleError],
        warnings: ['Test warning'],
        suggestions: ['Test suggestion'],
        includeMetadata: false
      });

      expect(output).toBeDefined();
      expect(output.format).toBe('markdown');
      expect(output.content).toContain('# Test content');
      expect(output.content).toContain('## Errors');
      expect(output.content).toContain('## Warnings');
      expect(output.content).toContain('## Suggestions');
      expect(output.metadata).toBeUndefined();
    });

    it('should format output as table', async () => {
      const output = await formatCLIOutput({
        content: 'Test content',
        format: 'table',
        errors: [sampleError],
        warnings: ['Test warning'],
        suggestions: ['Test suggestion'],
        includeMetadata: false
      });

      expect(output).toBeDefined();
      expect(output.format).toBe('table');
      expect(output.content).toContain('# Test content');
      expect(output.content).toContain('## Errors');
      expect(output.content).toContain('## Warnings');
      expect(output.content).toContain('## Suggestions');
      expect(output.content).toContain('|');
    });

    it('should validate output using Zod schema', async () => {
      const output = await formatCLIOutput({
        content: 'Test content',
        format: 'text',
        errors: [sampleError],
        warnings: ['Test warning'],
        suggestions: ['Test suggestion'],
        includeMetadata: true
      });

      expect(() => ErrorSnapshotLogSchemas.CLIOutputSchema.parse(output)).not.toThrow();
    });
  });

  // ============================================================================
  // LLM CHAT CONTEXT TESTS
  // ============================================================================

  describe('createLLMChatContext', () => {
    it('should create a valid LLM chat context', async () => {
      const context = await createLLMChatContext({
        sessionId: 'test-session',
        conversationId: 'test-conversation',
        userQuery: 'How to fix this error?',
        systemContext: 'You are a helpful assistant',
        errorContext: [sampleError],
        logContext: sampleLogEntries,
        includeSuggestions: true
      });

      expect(context).toBeDefined();
      expect(context.sessionId).toBe('test-session');
      expect(context.conversationId).toBe('test-conversation');
      expect(context.userQuery).toBe('How to fix this error?');
      expect(context.systemContext).toBe('You are a helpful assistant');
      expect(context.errorContext).toContain(sampleError);
      expect(context.logContext).toEqual(sampleLogEntries);
      expect(context.suggestions).toBeDefined();
      expect(context.metadata).toBeDefined();
    });

    it('should validate context using Zod schema', async () => {
      const context = await createLLMChatContext({
        sessionId: 'test-session',
        conversationId: 'test-conversation',
        userQuery: 'How to fix this error?',
        systemContext: 'You are a helpful assistant',
        errorContext: [sampleError],
        logContext: sampleLogEntries,
        includeSuggestions: true
      });

      expect(() => ErrorSnapshotLogSchemas.LLMChatContextSchema.parse(context)).not.toThrow();
    });

    it('should generate suggestions when requested', async () => {
      const context = await createLLMChatContext({
        sessionId: 'test-session',
        conversationId: 'test-conversation',
        userQuery: 'How to fix this error?',
        errorContext: [sampleError],
        logContext: sampleLogEntries,
        includeSuggestions: true
      });

      expect(context.suggestions).toBeDefined();
      expect(Array.isArray(context.suggestions)).toBe(true);
      expect(context.suggestions?.length).toBeGreaterThan(0);
    });

    it('should not include suggestions when not requested', async () => {
      const context = await createLLMChatContext({
        sessionId: 'test-session',
        conversationId: 'test-conversation',
        userQuery: 'How to fix this error?',
        errorContext: [sampleError],
        logContext: sampleLogEntries,
        includeSuggestions: false
      });

      expect(context.suggestions).toBeUndefined();
    });

    it('should handle empty error and log contexts', async () => {
      const context = await createLLMChatContext({
        sessionId: 'test-session',
        conversationId: 'test-conversation',
        userQuery: 'How to fix this error?',
        includeSuggestions: true
      });

      expect(context).toBeDefined();
      expect(context.errorContext).toBeUndefined();
      expect(context.logContext).toBeUndefined();
      expect(context.suggestions).toBeUndefined();
    });
  });

  describe('generateContextSuggestions', () => {
    it('should generate suggestions based on errors', () => {
      const suggestions = generateContextSuggestions([sampleError], [], []);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('Check the test parameters');
      expect(suggestions).toContain('Verify the test environment');
      expect(suggestions).toContain('Review the test logic');
    });

    it('should generate suggestions based on error categories', () => {
      const timeoutError = createError({
        message: 'Timeout error',
        severity: 'error',
        category: 'timeout',
        operation: 'test',
        component: 'test'
      });

      const suggestions = generateContextSuggestions([timeoutError], [], []);

      expect(suggestions).toContain('Consider increasing timeout limits or optimizing the operation');
    });

    it('should generate suggestions based on log patterns', () => {
      const errorLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: 'Error 1',
          component: 'test',
          operation: 'test',
          context: {},
          metadata: {}
        },
        {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: 'Error 2',
          component: 'test',
          operation: 'test',
          context: {},
          metadata: {}
        }
      ];

      const suggestions = generateContextSuggestions([], [], errorLogs);

      expect(suggestions).toContain('Review 2 error log entries for patterns');
    });

    it('should generate suggestions based on snapshots', () => {
      const suggestions = generateContextSuggestions([], [{ id: 'snapshot-1', type: 'error', context: { trigger: 'test', source: 'test', component: 'test', operation: 'test', timestamp: new Date().toISOString() }, data: { state: {}, metrics: {}, errors: [], warnings: [] }, createdAt: new Date().toISOString(), tags: [] }], []);

      expect(suggestions).toContain('Analyze 1 snapshots for system state insights');
    });

    it('should remove duplicate suggestions', () => {
      const error1 = createError({
        message: 'Error 1',
        severity: 'error',
        category: 'execution',
        operation: 'test',
        component: 'test',
        suggestions: ['Suggestion 1', 'Suggestion 2']
      });

      const error2 = createError({
        message: 'Error 2',
        severity: 'error',
        category: 'execution',
        operation: 'test',
        component: 'test',
        suggestions: ['Suggestion 2', 'Suggestion 3']
      });

      const suggestions = generateContextSuggestions([error1, error2], [], []);

      expect(suggestions).toContain('Suggestion 1');
      expect(suggestions).toContain('Suggestion 2');
      expect(suggestions).toContain('Suggestion 3');
      expect(suggestions.filter(s => s === 'Suggestion 2')).toHaveLength(1);
    });
  });

  // ============================================================================
  // FOSSIL CREATION TESTS
  // ============================================================================

  describe('createErrorFossil', () => {
    it('should create a valid error fossil', () => {
      const fossil = createErrorFossil({
        error: sampleError,
        relatedErrors: ['error-1', 'error-2'],
        resolution: 'Fixed by restarting service',
        impact: 'high',
        tags: ['test-tag']
      });

      expect(fossil).toBeDefined();
      expect(fossil.type).toBe('error_fossil');
      expect(fossil.source).toBe('error-snapshot-log-utils');
      expect(fossil.createdBy).toBe('system');
      expect(fossil.fossilId).toBeDefined();
      expect(fossil.fossilHash).toBe(`error-${sampleError.id}`);
      expect(fossil.error).toBe(sampleError);
      expect(fossil.relatedErrors).toEqual(['error-1', 'error-2']);
      expect(fossil.resolution).toBe('Fixed by restarting service');
      expect(fossil.impact).toBe('high');
      expect(fossil.tags).toContain('test-tag');
      expect(fossil.tags).toContain('error');
      expect(fossil.tags).toContain(sampleError.category);
      expect(fossil.tags).toContain(sampleError.severity);
      expect(fossil.tags).toContain('high');
    });

    it('should handle null resolution', () => {
      const fossil = createErrorFossil({
        error: sampleError,
        relatedErrors: [],
        resolution: undefined,
        impact: 'medium',
        tags: []
      });

      expect(fossil.resolution).toBe(null);
      expect(fossil.metadata?.resolved).toBe(false);
    });

    it('should handle resolved errors', () => {
      const fossil = createErrorFossil({
        error: sampleError,
        relatedErrors: [],
        resolution: 'Fixed',
        impact: 'low',
        tags: []
      });

      expect(fossil.resolution).toBe('Fixed');
      expect(fossil.metadata?.resolved).toBe(true);
    });
  });
}); 