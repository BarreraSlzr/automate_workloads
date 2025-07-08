# Error, Snapshot, and Log Understanding Patterns

This document describes the robust pattern-based approach for error handling, snapshot generation, and log understanding across CLI, human, and LLM chat contexts. This implementation follows the project's centralized type and schema patterns as documented in `TYPE_AND_SCHEMA_PATTERNS.md`.

## 🏗️ Architecture Overview

### Core Principles
- **Centralized Types**: All error, snapshot, and log types are defined in `src/types/error-snapshot-log.ts`
- **Zod Validation**: All data structures are validated using Zod schemas for runtime safety
- **Object Params Pattern**: All functions follow the object params pattern for consistency
- **Fossil Integration**: Errors, snapshots, and log analyses can be fossilized for persistence
- **Multi-Format Output**: Support for text, JSON, YAML, Markdown, and table formats
- **CLI-Human-LLM Context**: Designed for seamless integration across different interfaces

## 📁 Type Organization

### Base Error Types (`src/types/error-snapshot-log.ts`)
```typescript
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
```

**Usage**: All errors follow this standardized structure with comprehensive context.

### Snapshot Types
```typescript
export const SnapshotSchema = z.object({
  id: z.string(),
  type: SnapshotTypeSchema,
  context: SnapshotContextSchema,
  data: SnapshotDataSchema,
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

**Usage**: Snapshots capture system state at specific points in time.

### Log Understanding Types
```typescript
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
```

**Usage**: Comprehensive log analysis with pattern detection and performance metrics.

## 🔄 Pattern Extensions

### 1. Creating New Error Types

**Step 1**: Use the existing error creation utility
```typescript
import { createError } from '../utils/errorSnapshotLogUtils';

const error = createError({
  message: 'Custom error message',
  severity: 'error',
  category: 'execution',
  operation: 'my-operation',
  component: 'my-component',
  function: 'myFunction',
  line: 42,
  column: 10,
  stackTrace: new Error().stack?.split('\n').slice(1),
  sessionId: 'session-123',
  requestId: 'request-456',
  userId: 'user-789',
  description: 'Detailed error description',
  originalError: originalError,
  suggestions: ['Fix suggestion 1', 'Fix suggestion 2'],
  actionable: true,
  retryable: true,
  metadata: { custom: 'data' }
});
```

**Step 2**: Handle the error with comprehensive options
```typescript
import { handleError } from '../utils/errorSnapshotLogUtils';

const result = await handleError({
  error,
  logToConsole: true,
  createSnapshot: true,
  generateReport: true,
  format: 'markdown'
});
```

### 2. Creating Snapshots

**Step 1**: Create error snapshots
```typescript
import { createErrorSnapshot } from '../utils/errorSnapshotLogUtils';

const snapshot = await createErrorSnapshot({
  error,
  includeContext: true,
  includeStackTrace: true,
  includeSuggestions: true,
  format: 'json'
});
```

**Step 2**: Create snapshot fossils for persistence
```typescript
import { createSnapshotFossil } from '../utils/errorSnapshotLogUtils';

const fossil = createSnapshotFossil({
  snapshot,
  analysis: logAnalysis,
  insights: ['Insight 1', 'Insight 2'],
  recommendations: ['Recommendation 1', 'Recommendation 2'],
  tags: ['error', 'snapshot', 'monitoring']
});
```

### 3. Analyzing Logs

**Step 1**: Analyze log entries
```typescript
import { analyzeLogs } from '../utils/errorSnapshotLogUtils';

const analysis = await analyzeLogs({
  logEntries,
  timeRange: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
  includePatterns: true,
  includeMetrics: true,
  format: 'text'
});
```

**Step 2**: Create log analysis fossils
```typescript
import { createLogAnalysisFossil } from '../utils/errorSnapshotLogUtils';

const fossil = createLogAnalysisFossil({
  analysis,
  patterns: analysis.errorPatterns,
  recommendations: ['Recommendation 1', 'Recommendation 2'],
  actionItems: ['Action 1', 'Action 2'],
  tags: ['log-analysis', 'monitoring']
});
```

## 🛠️ Utility Functions

### Error Handling
```typescript
import { createError, handleError } from '../utils/errorSnapshotLogUtils';

// Create and handle errors with comprehensive context
const error = createError({
  message: 'Operation failed',
  severity: 'error',
  category: 'execution',
  operation: 'database-query',
  component: 'database-service'
});

const result = await handleError({
  error,
  logToConsole: true,
  createSnapshot: true,
  generateReport: true,
  format: 'markdown'
});
```

### CLI Output Formatting
```typescript
import { formatCLIOutput } from '../utils/errorSnapshotLogUtils';

// Format output for different contexts
const output = await formatCLIOutput({
  content: 'Operation completed',
  format: 'markdown',
  errors: [error],
  warnings: ['Warning message'],
  suggestions: ['Suggestion 1', 'Suggestion 2'],
  includeMetadata: true
});
```

### LLM Chat Context
```typescript
import { createLLMChatContext } from '../utils/errorSnapshotLogUtils';

// Create context for LLM interactions
const context = await createLLMChatContext({
  sessionId: 'session-123',
  conversationId: 'conv-456',
  userQuery: 'How to fix this error?',
  systemContext: 'You are a helpful assistant',
  errorContext: [error],
  logContext: logEntries,
  includeSuggestions: true
});
```

## 📋 Best Practices

### 1. Error Creation
- Always provide meaningful error messages
- Include relevant context (operation, component, function)
- Add actionable suggestions when possible
- Use appropriate severity levels
- Include stack traces for debugging

### 2. Snapshot Management
- Create snapshots for important state changes
- Include relevant context and metadata
- Use appropriate tags for categorization
- Consider expiration times for temporary snapshots

### 3. Log Analysis
- Analyze logs in appropriate time ranges
- Look for patterns and trends
- Generate actionable insights
- Track performance metrics

### 4. Output Formatting
- Choose appropriate formats for different contexts
- Include metadata for traceability
- Provide clear error messages and suggestions
- Use consistent formatting across the application

### 5. Fossil Integration
- Fossilize important errors, snapshots, and analyses
- Use meaningful tags for categorization
- Include relevant metadata for future reference
- Follow the project's fossil patterns

## 🔧 CLI Usage

### Basic Commands
```bash
# Create an error
bun run error-snapshot-log create-error "Database connection failed" error network database-connect database-service json

# Handle an error with snapshot and report
bun run error-snapshot-log handle-error --create-snapshot --generate-report --format markdown

# Create a snapshot
bun run error-snapshot-log create-snapshot --include-context --include-suggestions --format json

# Analyze logs
bun run error-snapshot-log analyze-logs --include-patterns --include-metrics --format text

# Format output
bun run error-snapshot-log format-output "Operation completed" markdown --output report.md

# Create LLM chat context
bun run error-snapshot-log create-context session-123 conv-456 "How to fix this error?" json

# Create fossils
bun run error-snapshot-log create-fossils --impact high --tag monitoring --output fossils.json
```

### Advanced Options
```bash
# Create error with full context
bun run error-snapshot-log create-error "Complex error" error execution complex-op complex-component json \
  --include-context \
  --include-stack-trace \
  --include-suggestions \
  --create-snapshot \
  --generate-report \
  --output error-report.json

# Analyze logs with custom time range
bun run error-snapshot-log analyze-logs \
  --input logs.json \
  --output analysis.json \
  --format markdown \
  --include-patterns \
  --include-metrics

# Create context with system context
bun run error-snapshot-log create-context session-123 conv-456 "Fix database error" json \
  --system "You are a database expert" \
  --include-suggestions \
  --output context.json
```

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
bun run error-snapshot-log:test

# Run specific test file
bun test tests/unit/utils/errorSnapshotLogUtils.test.ts

# Run with coverage
bun test tests/unit/utils/errorSnapshotLogUtils.test.ts --coverage
```

### Test Coverage
The test suite covers:
- Error creation and validation
- Error handling with different options
- Snapshot creation and management
- Log analysis and pattern detection
- CLI output formatting
- LLM chat context creation
- Fossil creation and validation

## 🔄 Integration Points

### 1. Event Loop Monitoring
```typescript
import { createError } from '../utils/errorSnapshotLogUtils';

// Create errors for hanging operations
const error = createError({
  message: 'Operation hanging detected',
  severity: 'warning',
  category: 'timeout',
  operation: 'event-loop-monitor',
  component: 'monitoring',
  suggestions: ['Check for infinite loops', 'Review async operations']
});
```

### 2. Performance Monitoring
```typescript
import { analyzeLogs } from '../utils/errorSnapshotLogUtils';

// Analyze performance logs
const analysis = await analyzeLogs({
  logEntries: performanceLogs,
  includePatterns: true,
  includeMetrics: true,
  format: 'json'
});
```

### 3. CI/CD Integration
```typescript
import { handleError } from '../utils/errorSnapshotLogUtils';

// Handle errors in CI/CD pipelines
const result = await handleError({
  error,
  logToConsole: true,
  createSnapshot: true,
  generateReport: true,
  format: 'markdown'
});

// Exit with appropriate code
process.exit(result.error.severity === 'critical' ? 1 : 0);
```

## 🚀 Future Extensions

### Planned Features
- **Error Correlation**: Link related errors across time and components
- **Predictive Analysis**: Use historical data to predict potential issues
- **Automated Resolution**: Suggest and potentially execute fixes
- **Integration APIs**: REST APIs for external system integration
- **Real-time Monitoring**: WebSocket-based real-time error streaming
- **Advanced Pattern Detection**: Machine learning-based pattern recognition

### Integration Opportunities
- **APM Tools**: Integration with Application Performance Monitoring tools
- **Log Aggregators**: Support for centralized log management systems
- **Alert Systems**: Integration with notification and alerting systems
- **Dashboard Tools**: Real-time dashboards for error and performance monitoring

## 📊 Metrics and Monitoring

### Key Metrics
- **Error Rate**: Percentage of operations that result in errors
- **Resolution Time**: Time from error detection to resolution
- **Pattern Frequency**: How often specific error patterns occur
- **Performance Impact**: Effect of errors on system performance

### Monitoring Dashboards
- **Error Overview**: High-level error statistics and trends
- **Component Health**: Error rates by component and operation
- **Pattern Analysis**: Common error patterns and their frequency
- **Performance Impact**: Correlation between errors and performance

## 🔒 Security Considerations

### Data Privacy
- **PII Handling**: Ensure no personally identifiable information in error logs
- **Sensitive Data**: Sanitize sensitive data in error messages and snapshots
- **Access Control**: Implement appropriate access controls for error data

### Compliance
- **Audit Trails**: Maintain audit trails for error handling and resolution
- **Data Retention**: Implement appropriate data retention policies
- **Regulatory Compliance**: Ensure compliance with relevant regulations

---

This pattern system provides a comprehensive foundation for error handling, snapshot generation, and log understanding across the entire application ecosystem. Follow these patterns when implementing error handling, monitoring, and debugging features to ensure consistency, maintainability, and extensibility. 