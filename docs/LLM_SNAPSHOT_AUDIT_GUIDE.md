# LLM Snapshot Audit Guide

This guide explains how to audit LLM call snapshots and analyze bun test snapshot changes that require LLM call insights for proper fossilization and audit trails.

## Overview

The LLM snapshot audit system provides comprehensive analysis of:
- **LLM Call Snapshots**: Quality, validation, and fossilization status
- **Test Changes**: Files that need LLM insights for proper fossilization
- **Fossilization Gaps**: Missing validation, preprocessing, or quality metrics
- **Risk Assessment**: Identifying high-risk changes requiring immediate attention

## Audit Tools

### 1. LLM Snapshot Auditor (`scripts/audit-llm-snapshots.ts`)

Comprehensive audit of all LLM call snapshots and test changes.

```bash
# Full audit with markdown report
bun run scripts/audit-llm-snapshots.ts audit

# Export snapshots for analysis
bun run scripts/audit-llm-snapshots.ts export-snapshot --format yaml

# Analyze test changes specifically
bun run scripts/audit-llm-snapshots.ts analyze-test-changes --output analysis.json
```

### 2. Bun Test Snapshot Analyzer (`scripts/analyze-bun-test-snapshots.ts`)

Specialized analysis of bun test snapshot changes requiring LLM insights.

```bash
# Full analysis with markdown report
bun run scripts/analyze-bun-test-snapshots.ts analyze

# Quick check for critical issues
bun run scripts/analyze-bun-test-snapshots.ts quick-check
```

## Audit Workflow

### Step 1: Run Comprehensive Audit

```bash
# Audit all LLM snapshots and test changes
bun run scripts/audit-llm-snapshots.ts audit --format markdown
```

This generates a comprehensive report including:
- **Quality Metrics**: Average quality scores, validation success rates
- **Test Changes**: Files that need LLM insights
- **Fossilization Status**: Pending, completed, or failed fossilization
- **Insights & Recommendations**: Actionable guidance

### Step 2: Analyze Test-Specific Changes

```bash
# Focus on test files that need LLM insights
bun run scripts/analyze-bun-test-snapshots.ts analyze --format markdown
```

This provides detailed analysis of:
- **LLM Pattern Detection**: Identifies files with LLM-related code
- **Risk Assessment**: Categorizes files by complexity and risk level
- **Priority Ranking**: Critical, high, medium, low priority needs
- **Effort Estimation**: Time estimates for LLM insight generation

### Step 3: Quick Health Check

```bash
# Quick check for critical issues
bun run scripts/analyze-bun-test-snapshots.ts quick-check
```

Use this for daily monitoring to identify urgent issues.

## Understanding Audit Results

### Quality Metrics

The audit system calculates several quality indicators:

```typescript
interface QualityMetrics {
  averageQualityScore: number;           // 0-1 scale
  qualityDistribution: {                 // Count by quality level
    excellent: number;                   // 80-100%
    good: number;                        // 60-80%
    fair: number;                        // 40-60%
    poor: number;                        // 20-40%
    veryPoor: number;                    // 0-20%
  };
  validationSuccessRate: number;         // Percentage of valid fossils
  preprocessingSuccessRate: number;      // Percentage of successful preprocessing
  commonIssues: Array<{                  // Most frequent problems
    issue: string;
    frequency: number;
    impact: string;
  }>;
}
```

### Test Change Analysis

Each test file is analyzed for:

```typescript
interface TestFileAnalysis {
  file: string;                          // File path
  changeType: 'added' | 'modified' | 'deleted';
  linesChanged: number;                  // Number of changed lines
  testPatterns: string[];                // Test framework patterns
  llmPatterns: string[];                 // LLM-related patterns
  fossilizationStatus: 'pending' | 'completed' | 'failed' | 'not_needed';
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}
```

### LLM Insight Needs

Files requiring LLM insights are prioritized:

```typescript
interface LLMInsightNeed {
  file: string;
  reason: string;                        // Why insights are needed
  patterns: string[];                    // Detected LLM patterns
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: string;               // Time estimate
  impact: string;                        // Impact description
}
```

## LLM Pattern Detection

The audit system detects various LLM-related patterns:

### Content Patterns
- `callLLM`: Direct LLM service calls
- `LLMService`: LLM service usage
- `fossilization`: Fossilization logic
- `snapshot`: Snapshot operations
- `validation`: Input/output validation
- `preprocessing`: Data preprocessing
- `quality_analysis`: Quality assessment
- `enhanced_llm`: Enhanced LLM features

### Diff Patterns (New Code)
- `new_callLLM`: New LLM calls added
- `new_LLMService`: New LLM service usage
- `new_fossilization`: New fossilization code
- `new_snapshot`: New snapshot operations
- `new_validation`: New validation logic

## Risk Assessment

### Complexity Factors
- **Lines of Code**: File size and change magnitude
- **Test Functions**: Number of test cases
- **Async Operations**: Async/await usage
- **Mock Operations**: Test mocking complexity

### Risk Levels
- **Low Risk**: Simple changes with minimal LLM interaction
- **Medium Risk**: Moderate complexity with some LLM patterns
- **High Risk**: Complex changes with extensive LLM usage

### Priority Calculation
Priority is determined by:
- Risk level (high = +3, medium = +2, low = +1)
- Complexity (high = +2, medium = +1)
- New LLM code (+4 for critical priority)
- Failed fossilization (+3 for high priority)

## Fossilization Gaps

The system identifies common fossilization gaps:

### Gap Types
1. **Missing Validation**: LLM calls lack input/output validation
2. **Missing Preprocessing**: No data preprocessing before LLM calls
3. **Missing Quality Metrics**: No quality assessment for LLM outputs
4. **Missing Session Tracking**: No session context preservation

### Severity Levels
- **High**: Critical for functionality (fix required)
- **Medium**: Important for quality (recommended fix)
- **Low**: Nice to have (optional improvement)

## Best Practices

### 1. Regular Auditing
```bash
# Daily quick check
bun run scripts/analyze-bun-test-snapshots.ts quick-check

# Weekly comprehensive audit
bun run scripts/audit-llm-snapshots.ts audit --format markdown
```

### 2. Pre-Commit Validation
```bash
# Check for critical issues before committing
bun run scripts/analyze-bun-test-snapshots.ts quick-check
```

### 3. Continuous Monitoring
```bash
# Monitor fossilization status
bun run scripts/audit-llm-snapshots.ts analyze-test-changes --output status.json
```

### 4. Quality Thresholds
- **Validation Success Rate**: Target > 90%
- **Average Quality Score**: Target > 0.7
- **Critical Issues**: Address immediately
- **High Risk Files**: Review within 24 hours

## Integration with CI/CD

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Checking for critical LLM insight needs..."
bun run scripts/analyze-bun-test-snapshots.ts quick-check

if [ $? -ne 0 ]; then
  echo "❌ Critical LLM insight needs detected. Please address before committing."
  exit 1
fi

echo "✅ No critical issues found."
```

### GitHub Actions Workflow
```yaml
name: LLM Snapshot Audit

on:
  pull_request:
    paths:
      - '**/*.test.ts'
      - '**/*.spec.ts'
      - 'src/**/*.ts'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Run LLM snapshot audit
        run: bun run scripts/audit-llm-snapshots.ts audit --format markdown
        
      - name: Upload audit report
        uses: actions/upload-artifact@v3
        with:
          name: llm-snapshot-audit
          path: fossils/audit/*.md
```

## Troubleshooting

### Common Issues

1. **No LLM Fossils Found**
   ```bash
   # Check fossilization configuration
   bun run scripts/audit-llm-snapshots.ts export-snapshot --include-metadata
   ```

2. **High Validation Failure Rate**
   ```bash
   # Analyze validation errors
   bun run scripts/audit-llm-snapshots.ts audit --format json
   ```

3. **Test Files Not Detected**
   ```bash
   # Check git diff manually
   git diff --name-only | grep -E "(test|spec)"
   ```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=llm-audit bun run scripts/audit-llm-snapshots.ts audit
```

## Export Formats

### Markdown Reports
Best for human reading and documentation:
```bash
bun run scripts/audit-llm-snapshots.ts audit --format markdown
```

### JSON Export
Best for programmatic analysis:
```bash
bun run scripts/audit-llm-snapshots.ts audit --format json
```

### YAML Export
Best for configuration and CI/CD:
```bash
bun run scripts/audit-llm-snapshots.ts audit --format yaml
```

## Advanced Usage

### Custom Time Ranges
```bash
# Audit specific time period
bun run scripts/audit-llm-snapshots.ts audit \
  --start-date 2024-01-01T00:00:00Z \
  --end-date 2024-01-31T23:59:59Z
```

### Filtered Analysis
```bash
# Focus on specific test patterns
bun run scripts/analyze-bun-test-snapshots.ts analyze \
  --filter "callLLM|fossilization"
```

### Integration with Fossil Management
```bash
# Export and fossilize audit results
bun run scripts/audit-llm-snapshots.ts audit --format json | \
  bun run src/cli/context-fossil.ts create --type audit --title "LLM Snapshot Audit"
```

## Conclusion

The LLM snapshot audit system provides comprehensive visibility into:
- LLM call quality and fossilization status
- Test changes requiring LLM insights
- Fossilization gaps and improvement opportunities
- Risk assessment and prioritization

Regular use of these audit tools ensures:
- **Quality Assurance**: High-quality LLM call fossilization
- **Risk Management**: Early detection of critical issues
- **Compliance**: Proper audit trails for LLM interactions
- **Efficiency**: Prioritized focus on high-impact improvements

For questions or issues, refer to the test files in `tests/unit/scripts/` for examples of proper LLM fossilization patterns. 