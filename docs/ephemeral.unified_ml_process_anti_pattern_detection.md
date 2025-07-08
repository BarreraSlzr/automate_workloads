# Unified ML Process Anti-Pattern Detection

## Overview

The **Unified ML Process Anti-Pattern Detection** system is a comprehensive framework for detecting and handling anti-patterns in the unified ML process context. It provides runtime context validation, LLM availability checking, and fallback handling for the `compute.ts`, `machine.ts`, and `learn.ts` processes.

## Key Concepts

### What are Anti-Patterns?

Anti-patterns are problematic patterns that should be avoided in the unified ML process:

1. **Fallback Patterns**: `fallback`, `backup`, `alternative`, `secondary`, `emergency`
2. **Snapshot Patterns**: `snapshot`, `backup`, `copy`, `duplicate`, `mirror`
3. **Detailed Patterns**: `detailed`, `verbose`, `comprehensive`, `extensive`, `thorough`
4. **Data Patterns**: `data`, `raw`, `unprocessed`, `source`, `input`
5. **Legacy Patterns**: `legacy`, `old`, `deprecated`, `outdated`, `vintage`

### Why Avoid These Patterns?

- **Fallback**: Creates dependency on secondary systems instead of unified context
- **Snapshot**: Creates redundant copies instead of unified context with timestamps
- **Detailed**: Creates verbose descriptions instead of structured metadata
- **Data**: Creates redundant naming instead of minimal fossil principle
- **Legacy**: Creates outdated patterns instead of canonical fossil patterns

## Architecture

### Core Components

```typescript
// Anti-pattern detection schemas
export const AntiPatternDetectionSchema = z.object({
  antiPatterns: z.object({
    fallback: z.object({ detected: z.boolean(), patterns: z.array(z.string()), severity: z.enum(['low', 'medium', 'high', 'critical']) }),
    snapshot: z.object({ detected: z.boolean(), patterns: z.array(z.string()), severity: z.enum(['low', 'medium', 'high', 'critical']) }),
    detailed: z.object({ detected: z.boolean(), patterns: z.array(z.string()), severity: z.enum(['low', 'medium', 'high', 'critical']) }),
    data: z.object({ detected: z.boolean(), patterns: z.array(z.string()), severity: z.enum(['low', 'medium', 'high', 'critical']) }),
    legacy: z.object({ detected: z.boolean(), patterns: z.array(z.string()), severity: z.enum(['low', 'medium', 'high', 'critical']) }),
  }),
  runtimeContext: z.object({
    llmAvailable: z.boolean(),
    localLLM: z.object({ available: z.boolean(), model: z.string().optional(), provider: z.string().optional() }),
    remoteLLM: z.object({ available: z.boolean(), provider: z.string().optional(), apiKey: z.boolean() }),
    fallbackMode: z.boolean(),
    fallbackReason: z.string().optional(),
  }),
  unifiedCompliance: z.object({
    compliant: z.boolean(),
    score: z.number().min(0).max(100),
    violations: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      location: z.string(),
      suggestion: z.string(),
    })),
  }),
  mlProcessing: z.object({
    timestamp: z.string(),
    sessionId: z.string(),
    processType: z.enum(['compute', 'machine', 'learn']),
    inputHash: z.string(),
    outputHash: z.string(),
    processingTime: z.number(),
    success: z.boolean(),
    errors: z.array(z.string()),
  }),
});
```

### Runtime Context Detection

The system automatically detects:

- **Environment**: Node.js version, Bun version, OS, architecture
- **Available Utils**: Checks `@/utils` directory for available utilities
- **LLM Providers**: Tests local (Ollama) and remote (OpenAI) LLM availability
- **Ephemeral Context**: Analyzes recent ephemeral files and searchable patterns
- **Fallback Triggers**: Detects conditions that trigger fallback mode

### Unified ML Process Snapshot

Each process creates a comprehensive snapshot:

```typescript
export const UnifiedMLProcessSnapshotSchema = z.object({
  snapshotId: z.string(),
  timestamp: z.string(),
  processType: z.enum(['compute', 'machine', 'learn']),
  context: z.object({
    inputPath: z.string(),
    outputPath: z.string(),
    workingDirectory: z.string(),
    gitContext: z.object({
      branch: z.string(),
      commit: z.string(),
      status: z.string(),
    }),
  }),
  antiPatternAnalysis: AntiPatternDetectionSchema,
  runtimeContext: RuntimeContextDetectionSchema,
  processingResult: z.object({
    success: z.boolean(),
    duration: z.number(),
    outputSize: z.number(),
    qualityScore: z.number().min(0).max(100),
    mlReady: z.boolean(),
  }),
  ephemeralIntegration: z.object({
    filesCreated: z.array(z.string()),
    filesUpdated: z.array(z.string()),
    searchQueries: z.array(z.string()),
    patternsFound: z.array(z.string()),
  }),
  fallbackHandling: z.object({
    triggered: z.boolean(),
    reason: z.string().optional(),
    alternativeUsed: z.string().optional(),
    success: z.boolean(),
  }),
});
```

## Usage

### Basic Usage

```typescript
import { AntiPatternDetector, detectAntiPatterns, createUnifiedSnapshot } from '@/utils/antiPatternDetector';

// Create detector instance
const detector = new AntiPatternDetector({
  enabled: true,
  strictMode: false,
  autoFix: false,
});

// Analyze content for anti-patterns
const analysis = await detector.analyze({
  content: 'This uses fallback patterns and detailed data processing.',
  processType: 'compute',
});

// Create unified snapshot
const snapshot = await detector.createSnapshot({
  processType: 'compute',
  inputPath: '/path/to/input.yml',
  outputPath: '/path/to/output.json',
  analysis,
});
```

### Integration with Subprocesses

#### compute.ts Integration

```typescript
// Anti-pattern detection and unified ML process analysis
const antiPatternAnalysis = await detectAntiPatterns(ymlContent, 'compute');

// Create unified ML process snapshot
const snapshot = await createUnifiedSnapshot({
  processType: 'compute',
  inputPath,
  outputPath: '', // Will be set below
  analysis: antiPatternAnalysis,
});

// Add anti-pattern analysis and snapshot to enriched data
const mlReadyEnriched = {
  ...enriched,
  anti_pattern_analysis: antiPatternAnalysis,
  unified_ml_snapshot: snapshot,
  ml_ready: antiPatternAnalysis.unifiedCompliance.compliant,
  compliance_score: antiPatternAnalysis.unifiedCompliance.score,
  fallback_triggered: antiPatternAnalysis.runtimeContext.fallbackMode,
};
```

#### machine.ts Integration

```typescript
// Anti-pattern detection for machine process
const inputContent = readFileSync(ymlPath, 'utf8');
const antiPatternAnalysis = await detectAntiPatterns(inputContent, 'machine');

// Create unified ML process snapshot
const snapshot = await createUnifiedSnapshot({
  processType: 'machine',
  inputPath,
  outputPath: vectorPath,
  analysis: antiPatternAnalysis,
});

// Save snapshot for ML processing
const snapshotPath = join(dirname(vectorPath), `${basename(vectorPath, '.json')}.unified.snapshot.json`);
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
```

#### learn.ts Integration

```typescript
// Anti-pattern detection for learn process
const antiPatternAnalysis = await detectAntiPatterns(jsonContent, 'learn');

// Add anti-pattern recommendations to markdown
if (antiPatternAnalysis.antiPatterns.fallback.detected) {
  recommendations += '- **Anti-pattern detected**: Avoid fallback patterns, use unified context instead.\n';
}
if (antiPatternAnalysis.antiPatterns.snapshot.detected) {
  recommendations += '- **Anti-pattern detected**: Avoid snapshot patterns, use unified context with timestamps.\n';
}
// ... more pattern checks

// Add compliance information
if (antiPatternAnalysis.unifiedCompliance.compliant) {
  recommendations += `- ✅ **Unified ML Process Compliant** (Score: ${antiPatternAnalysis.unifiedCompliance.score}%)\n`;
} else {
  recommendations += `- ⚠️ **Unified ML Process Violations** (Score: ${antiPatternAnalysis.unifiedCompliance.score}%)\n`;
}
```

## Configuration

### Anti-Pattern Detection Config

```typescript
export const AntiPatternDetectionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  strictMode: z.boolean().default(false),
  autoFix: z.boolean().default(false),
  patterns: z.object({
    fallback: z.array(z.string()).default(['fallback', 'backup', 'alternative', 'secondary', 'emergency']),
    snapshot: z.array(z.string()).default(['snapshot', 'backup', 'copy', 'duplicate', 'mirror']),
    detailed: z.array(z.string()).default(['detailed', 'verbose', 'comprehensive', 'extensive', 'thorough']),
    data: z.array(z.string()).default(['data', 'raw', 'unprocessed', 'source', 'input']),
    legacy: z.array(z.string()).default(['legacy', 'old', 'deprecated', 'outdated', 'vintage']),
  }),
  severityThresholds: z.object({
    low: z.number().min(0).max(1).default(0.3),
    medium: z.number().min(0).max(1).default(0.6),
    high: z.number().min(0).max(1).default(0.8),
    critical: z.number().min(0).max(1).default(0.9),
  }),
  runtimeChecks: z.object({
    checkLLMAvailability: z.boolean().default(true),
    checkUtilsAvailability: z.boolean().default(true),
    checkEphemeralContext: z.boolean().default(true),
    validateUnifiedPatterns: z.boolean().default(true),
  }),
});
```

### CLI Parameters

```typescript
export const AntiPatternDetectionCLIArgsSchema = BaseCLIArgsSchema.extend({
  input: z.string().describe('Input file or directory to analyze'),
  output: z.string().optional().describe('Output file for analysis results'),
  config: z.string().optional().describe('Path to anti-pattern detection config'),
  mode: z.enum(['detect', 'test', 'fix', 'validate']).default('detect'),
  includeRuntime: z.boolean().default(true),
  includeEphemeral: z.boolean().default(true),
  generateSnapshot: z.boolean().default(false),
  format: z.enum(['json', 'yaml', 'markdown']).default('json'),
});
```

## Testing

### Test Cases

The system includes comprehensive test cases for:

1. **Pattern Detection**: Tests for each anti-pattern type
2. **Runtime Context**: Tests for LLM availability and utils
3. **Compliance Scoring**: Tests for score calculation and violations
4. **Unified Snapshots**: Tests for snapshot creation and git context
5. **Utility Functions**: Tests for direct function usage
6. **Configuration**: Tests for custom configuration settings
7. **Severity Calculation**: Tests for pattern density-based severity

### Example Test

```typescript
it('should detect fallback patterns', async () => {
  const content = `
    This is a fallback mechanism for when the primary system fails.
    We use backup data and alternative processing methods.
    In emergency situations, we have secondary options.
  `;

  const analysis = await detector.analyze({
    content,
    processType: 'compute',
  });

  expect(analysis.antiPatterns.fallback.detected).toBe(true);
  expect(analysis.antiPatterns.fallback.patterns).toContain('fallback');
  expect(analysis.antiPatterns.fallback.patterns).toContain('backup');
  expect(analysis.antiPatterns.fallback.patterns).toContain('alternative');
  expect(analysis.antiPatterns.fallback.severity).toBe('high');
});
```

## ML Processing

### ML-Ready Output

The system produces ML-ready output with:

- **Structured Data**: All outputs follow Zod schemas for validation
- **Compliance Scores**: Numerical scores for automated decision making
- **Pattern Detection**: Boolean flags for pattern presence
- **Severity Levels**: Categorical severity for prioritization
- **Recommendations**: Actionable suggestions for improvement
- **Runtime Context**: Environment and availability information
- **Git Integration**: Version control context for traceability

### Snapshot Files

Each process creates two types of files:

1. **Traceable JSON**: Enhanced with anti-pattern analysis and compliance data
2. **Unified Snapshot**: Comprehensive snapshot for ML processing and analysis

### Search and Discovery

The system enables:

- **Pattern Search**: Search for specific anti-patterns across files
- **Compliance Analysis**: Analyze compliance scores over time
- **Fallback Detection**: Identify when fallback mode is triggered
- **Runtime Monitoring**: Monitor LLM availability and utils
- **Git Integration**: Track changes and compliance over time

## Best Practices

### Avoiding Anti-Patterns

1. **Instead of fallback**: Use unified context with graceful degradation
2. **Instead of snapshot**: Use unified context with timestamps
3. **Instead of detailed**: Use structured metadata and semantic tags
4. **Instead of data**: Use minimal fossil principle for naming
5. **Instead of legacy**: Migrate to canonical fossil patterns

### Compliance Guidelines

- **Score ≥ 80%**: Considered compliant
- **Score < 80%**: Requires review and refactoring
- **Critical violations**: Immediate attention required
- **High violations**: Priority for next iteration
- **Medium violations**: Address during regular maintenance
- **Low violations**: Monitor and address as needed

### Runtime Considerations

- **LLM Availability**: Always check before processing
- **Utils Availability**: Ensure required utilities are available
- **Ephemeral Context**: Leverage existing ephemeral files
- **Fallback Handling**: Implement graceful degradation
- **Git Context**: Maintain version control integration

## Integration Points

### With Existing Systems

- **Type System**: Integrates with `@/types` and `@/schemas`
- **CLI System**: Integrates with existing CLI argument validation
- **Utils System**: Checks availability of `@/utils` utilities
- **Fossil System**: Integrates with canonical fossil patterns
- **Ephemeral System**: Leverages ephemeral context management

### Future Extensions

- **Auto-Fix**: Automatic correction of detected anti-patterns
- **Learning**: ML-based pattern detection improvement
- **Integration**: Integration with external LLM providers
- **Monitoring**: Real-time compliance monitoring
- **Reporting**: Automated compliance reporting

## Conclusion

The Unified ML Process Anti-Pattern Detection system provides a comprehensive framework for maintaining high-quality, compliant code in the unified ML process context. By detecting and avoiding anti-patterns, the system ensures:

- **Consistency**: Unified patterns across all processes
- **Quality**: High compliance scores and ML-ready output
- **Maintainability**: Clear guidelines and automated detection
- **Traceability**: Comprehensive snapshots and git integration
- **Reliability**: Runtime context validation and fallback handling

This system enables the project to achieve the **Major Achievement: Unified ML Process for Snapshot LLM Chat Context** by explicitly defining and avoiding problematic patterns while ensuring 100% CI/CD pass rates and enabling successful batch commit orchestration. 