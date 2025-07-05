# Performance Traceability Guide

This guide covers the comprehensive performance traceability system with GitHub Actions integration, macOS notifications, and granular tracking capabilities.

## Overview

The performance traceability system provides:

1. **Granular Performance Tracking** with git metadata and environment details
2. **GitHub Actions Integration** with PR comments and regression detection
3. **macOS Notifications** for real-time feedback
4. **Historical Trend Analysis** with regression detection
5. **Detailed Traceability Reports** for debugging and optimization

## Quick Start

### Basic Tracking with Notifications

```bash
# Track a single script with macOS notifications
bun run perf:track scripts/llm-chat-context.ts

# Track multiple scripts in batch
bun run perf:track-batch scripts "*.ts"

# Analyze trends
bun run perf:trends

# Generate traceability report
bun run perf:traceability
```

### GitHub Actions Integration

The system automatically runs on:
- **Pull Requests**: Analyzes performance changes and posts detailed comments
- **Main Branch Pushes**: Establishes performance baselines
- **Performance Thresholds**: Fails builds on regressions

## GitHub Actions Workflow

### PR Performance Analysis

When you create or update a PR, the workflow:

1. **Runs Performance Monitoring** on all scripts
2. **Compares to Baseline** from main branch
3. **Posts Detailed Comment** with:
   - Performance summary
   - Change analysis (improvement/regression/stable)
   - Script-by-script breakdown
   - Recommendations
4. **Fails on Thresholds** if performance degrades significantly

### Example PR Comment

```
## 📊 Performance Analysis Report

### Executive Summary
- **Total Scripts Monitored**: 15
- **Success Rate**: 93%
- **Average Execution Time**: 3.2s

### Performance Changes
🚀 **Performance Improvement**: -15% faster than baseline

### Detailed Metrics
- **Fastest Script**: 0.8s
- **Slowest Script**: 8.5s
- **Total Execution Time**: 48s

### Script Performance Breakdown
- **llm-chat-context**: 3 runs, avg 4.2s, 100% success
- **performance-monitor**: 2 runs, avg 1.1s, 100% success

### Recommendations
- 🔍 Consider profiling slow scripts with `bun --inspect`
- 📊 View detailed report in artifacts
- 🔄 Performance data is fossilized for historical tracking
```

## Granular Tracking Features

### What Gets Tracked

Each script execution captures:

- **Basic Metrics**: Execution time, memory usage, exit code
- **Git Metadata**: SHA, branch, timestamp
- **Environment Details**: OS, Node/Bun versions, CPU cores, memory
- **Detailed Timing**: Real, user, system time
- **Resource Usage**: Memory patterns, CPU utilization
- **Output Analysis**: Output/error sizes

### Example Granular Log Entry

```json
{
  "script": "llm-chat-context",
  "execution_time": 4.23,
  "memory_usage_mb": 45.2,
  "exit_code": 0,
  "timestamp": "2025-07-05T05:30:00Z",
  "git_sha": "abc123def456",
  "git_branch": "feature/performance-tracking",
  "additional_metrics": {
    "real_time": 4.23,
    "user_time": 3.38,
    "sys_time": 0.85,
    "cpu_percent": 100,
    "max_memory_mb": 45.2,
    "avg_memory_mb": 42.1,
    "output_size_bytes": 2048,
    "error_size_bytes": 0,
    "memory_samples": 42
  },
  "environment": {
    "node_version": "v18.17.0",
    "bun_version": "1.0.0",
    "os": "darwin",
    "cpu_cores": "8",
    "memory_total": "16.0"
  }
}
```

## macOS Notifications

### Automatic Notifications

The system sends macOS notifications for:

- **Script Completion**: Success/failure with timing
- **Batch Completion**: Summary of multiple scripts
- **Performance Regressions**: When scripts get slower
- **Threshold Violations**: When limits are exceeded

### Custom Notifications

```bash
# Send custom notification
bun run perf:notify "Test Complete" "Performance monitoring finished"

# Example output
✅ Notification sent: Test Complete - Performance monitoring finished
```

## Trend Analysis

### Performance Trends

The system tracks trends over time:

- **Execution Time Trends**: How scripts perform over multiple runs
- **Regression Detection**: Identifies scripts getting slower (>10% degradation)
- **Improvement Tracking**: Highlights performance gains
- **Branch Comparison**: Compares performance across branches

### Example Trends Analysis

```json
{
  "total_executions": 150,
  "unique_scripts": 12,
  "branches": ["main", "feature/optimization", "bugfix/performance"],
  "time_period": {
    "earliest": "2025-07-01T00:00:00Z",
    "latest": "2025-07-05T23:59:59Z"
  },
  "performance_trends": [
    {
      "script": "llm-chat-context",
      "executions": 25,
      "avg_time": 4.2,
      "trend": -15.5,
      "latest_time": 3.8,
      "earliest_time": 4.5
    }
  ],
  "regressions": [
    {
      "script": "legacy-task",
      "regression_percent": 12.3
    }
  ]
}
```

## Traceability Reports

### Comprehensive Reporting

Generate detailed traceability reports with:

- **Executive Summary**: High-level performance overview
- **Trend Analysis**: Performance changes over time
- **Regression Detection**: Scripts with performance issues
- **Environment Summary**: System details and versions
- **Recommendations**: Actionable improvement suggestions

### Example Report Structure

```markdown
# Performance Traceability Report

Generated on: 2025-07-05T06:00:00Z

## Executive Summary
- **Total Executions**: 150
- **Unique Scripts**: 12
- **Branches Tracked**: 3
- **Time Period**: 2025-07-01T00:00:00Z to 2025-07-05T23:59:59Z

## Performance Trends by Script
- **llm-chat-context**: 25 executions, avg 4.20s, trend: -15.5%
- **performance-monitor**: 15 executions, avg 1.10s, trend: 0.0%

## Performance Regressions Detected
- **legacy-task**: 12.3% regression

## Granular Traceability
Each execution is tracked with:
- Git SHA and branch
- Environment details (OS, Node/Bun versions, CPU cores, memory)
- Detailed timing breakdown (real, user, sys time)
- Memory usage patterns
- Output/error sizes
- CPU utilization

## Recommendations
- ⚠️ **Performance regressions detected**: Review scripts with >10% performance degradation
- 🔍 **Investigate root causes**: Check recent changes in regressed scripts
- 📊 **Monitor trends**: Set up alerts for performance regressions
```

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/performance-tracking.yml` workflow:

1. **Triggers on**: PR events and main branch pushes
2. **Runs Performance Monitoring**: On all scripts
3. **Analyzes Changes**: Compares to baseline
4. **Posts PR Comments**: With detailed analysis
5. **Checks Thresholds**: Fails on regressions
6. **Uploads Artifacts**: Performance data for review
7. **Archives Data**: For historical tracking

### Performance Thresholds

The workflow enforces these thresholds:

- **Maximum Execution Time**: 15 seconds per script
- **Success Rate**: 85% minimum
- **Regression Detection**: >5% performance degradation

### Artifact Management

Performance data is preserved as:

- **Build Artifacts**: Available for 30 days
- **Fossilized Logs**: Stored in `fossils/performance/`
- **Historical Archives**: Timestamped snapshots

## Advanced Features

### Custom Thresholds

You can customize thresholds in the workflow:

```yaml
- name: Check Performance Thresholds
  run: |
    # Set custom thresholds
    max_time_threshold=20  # 20 seconds
    success_rate_threshold=90  # 90% success rate
```

### Branch-Specific Analysis

The system compares performance across branches:

- **Main Branch**: Establishes baseline
- **Feature Branches**: Compared against baseline
- **Regression Detection**: Identifies performance issues

### Environment Tracking

Each execution captures environment details:

- **Node.js Version**: For version-specific analysis
- **Bun Version**: Runtime environment
- **OS Information**: Platform-specific performance
- **Hardware Details**: CPU cores, memory capacity

## Best Practices

### 1. Regular Monitoring

- Run performance tracking on every PR
- Monitor trends over time
- Set up alerts for regressions

### 2. Threshold Management

- Set realistic thresholds for your project
- Adjust thresholds based on script complexity
- Consider different thresholds for different script types

### 3. Regression Investigation

- Review recent changes when regressions are detected
- Profile slow scripts with `bun --inspect`
- Document performance improvements

### 4. Historical Analysis

- Use historical data for capacity planning
- Track performance improvements over time
- Identify optimization opportunities

## Troubleshooting

### Common Issues

1. **Notifications Not Working**
   - Ensure macOS notifications are enabled
   - Check if `osascript` is available
   - Verify notification permissions

2. **GitHub Actions Failures**
   - Check performance thresholds
   - Review PR comments for details
   - Examine uploaded artifacts

3. **Missing Performance Data**
   - Ensure scripts are executable
   - Check file permissions
   - Verify Bun installation

### Debugging Commands

```bash
# Check granular logs
cat fossils/performance/granular_trace.json

# Analyze trends manually
bun run perf:trends

# Generate custom report
bun run perf:traceability

# Test notifications
bun run perf:notify "Test" "Notification test"
```

## Integration with Fossilization

The performance traceability system integrates with your fossilization patterns:

- **Performance Fossils**: All data stored in `fossils/performance/`
- **Historical Tracking**: Performance data preserved over time
- **CLI Integration**: Performance summaries in CLI outputs
- **Reporting**: Performance metrics in fossilization reports

## Conclusion

This performance traceability system provides comprehensive monitoring, detailed analysis, and actionable insights for your automation scripts. By integrating with GitHub Actions, providing macOS notifications, and maintaining granular tracking, it enables effective performance optimization and regression prevention.

The system supports both simple monitoring and sophisticated analysis, making it suitable for various use cases from quick checks to comprehensive performance management. 