# Performance Monitoring Guide

This guide covers comprehensive performance monitoring approaches for Bun scripts, leveraging terminal commands and integrating with fossilization patterns.

## Overview

The performance monitoring system provides multiple approaches to track and analyze script performance:

1. **Shell-based monitoring** with `time` command and terminal utilities
2. **TypeScript-based monitoring** with programmatic access
3. **Comprehensive insights** with detailed metrics and recommendations
4. **Fossilization integration** for reporting and analysis

## Quick Start

### Basic Time Command Usage

```bash
# Simple timing
time bun run scripts/llm-chat-context.ts

# Detailed timing with format
/usr/bin/time -p bun run scripts/llm-chat-context.ts

# Timing with output capture
time bun run scripts/llm-chat-context.ts > output.log 2>&1
```

### Performance Monitoring Scripts

```bash
# Monitor single script
bun run perf:monitor-single scripts/llm-chat-context.ts

# Monitor batch of scripts
bun run perf:monitor-batch scripts "*.ts"

# Generate performance summary
bun run perf:summary

# Generate performance report
bun run perf:report
```

### Performance Insights

```bash
# Monitor with detailed insights
bun run perf:insights-monitor scripts/llm-chat-context.ts

# Batch monitoring with insights
bun run perf:insights-batch scripts "*.ts"

# Analyze performance data
bun run perf:insights-analyze

# Generate insights report
bun run perf:insights-report

# Quick summary
bun run perf:insights-summary
```

## Terminal Commands and "Hacks"

### 1. Time Command Variations

```bash
# Basic time command
time command

# Detailed time with format
/usr/bin/time -p command

# Time with verbose output
/usr/bin/time -v command

# Time with custom format
/usr/bin/time -f "Real: %e, User: %U, Sys: %S, CPU: %P" command

# Time with memory tracking
/usr/bin/time -f "Memory: %M KB" command
```

### 2. Memory Monitoring

```bash
# Monitor memory usage during execution
(
  while true; do
    echo "$(date +%s.%N) $(ps -o rss= -p $$ | awk '{print $1/1024}')"
    sleep 0.1
  done
) &
memory_pid=$!
command
kill $memory_pid
```

### 3. CPU Usage Calculation

```bash
# Calculate CPU percentage
cpu_percent=$(echo "scale=2; ($user_time + $sys_time) / $real_time * 100" | bc -l)
```

### 4. Output Size Measurement

```bash
# Measure output size
output_size=$(wc -c < output.log)
error_size=$(wc -c < error.log)
```

### 5. Process Monitoring

```bash
# Monitor process details
ps -o pid,ppid,cmd,%mem,%cpu -p $$

# Monitor child processes
pgrep -P $$ | xargs ps -o pid,cmd,%mem,%cpu
```

### 6. System Resource Monitoring

```bash
# Monitor system load
uptime

# Monitor disk I/O
iostat 1 1

# Monitor network usage
netstat -i

# Monitor memory usage
free -h
```

## Performance Monitoring Scripts

### 1. Shell-based Monitor (`scripts/performance-monitor.sh`)

**Features:**
- Uses `time` command for precise timing
- Memory usage monitoring
- Output/error capture
- JSON logging
- Fossilization integration

**Usage:**
```bash
# Monitor single script
./scripts/performance-monitor.sh monitor scripts/llm-chat-context.ts

# Batch monitoring
./scripts/performance-monitor.sh batch scripts "*.ts"

# Generate summary
./scripts/performance-monitor.sh summary

# Generate report
./scripts/performance-monitor.sh report
```

### 2. TypeScript-based Monitor (`src/cli/performance-monitor.ts`)

**Features:**
- Programmatic access to performance data
- Zod schema validation
- Fossilization insights
- CLI interface

**Usage:**
```bash
# Monitor single script
bun run src/cli/performance-monitor.ts monitor scripts/llm-chat-context.ts

# Batch monitoring
bun run src/cli/performance-monitor.ts batch script1.ts script2.ts

# Get fossilization insights
bun run src/cli/performance-monitor.ts insights

# List performance logs
bun run src/cli/performance-monitor.ts list
```

### 3. Comprehensive Insights (`scripts/performance-insights.sh`)

**Features:**
- Detailed metrics collection
- Real-time memory monitoring
- CPU usage calculation
- Comprehensive reporting
- Performance recommendations

**Usage:**
```bash
# Monitor with detailed insights
./scripts/performance-insights.sh monitor scripts/llm-chat-context.ts

# Batch monitoring
./scripts/performance-insights.sh batch scripts "*.ts"

# Analyze data
./scripts/performance-insights.sh analyze

# Generate report
./scripts/performance-insights.sh report
```

## Fossilization Integration

### Performance Data Storage

Performance data is stored in the fossilization system:

```
fossils/performance/
├── performance_log.json          # Raw performance logs
├── performance_summary.json      # Analyzed summary
├── performance_report.md         # Markdown report
├── insights_log.json            # Detailed insights
├── insights_report.md           # Comprehensive report
└── performance_data.json        # Structured data
```

### Fossilization Patterns

The performance monitoring integrates with fossilization patterns:

1. **Deduplication**: Performance data is deduplicated and consolidated
2. **Reporting**: Performance metrics are included in fossilization reports
3. **Recommendations**: Performance insights inform fossilization improvements
4. **Trends**: Historical performance data tracks fossilization effectiveness

### CLI Integration

Performance monitoring is integrated into the CLI patterns:

```bash
# Performance monitoring commands
bun run perf:monitor <script>
bun run perf:insights <script>
bun run perf:summary
bun run perf:report

# Fossilization with performance
bun run context:add --performance
bun run context:summary --include-performance
```

## Advanced Techniques

### 1. Custom Performance Metrics

```bash
# Custom timing function
time_command() {
    local start_time=$(date +%s.%N)
    "$@"
    local exit_code=$?
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)
    echo "Duration: ${duration}s"
    return $exit_code
}

# Usage
time_command bun run scripts/llm-chat-context.ts
```

### 2. Parallel Performance Monitoring

```bash
# Monitor multiple scripts in parallel
parallel --jobs 4 './scripts/performance-monitor.sh monitor {}' ::: scripts/*.ts
```

### 3. Continuous Monitoring

```bash
# Monitor script performance over time
while true; do
    ./scripts/performance-monitor.sh monitor scripts/llm-chat-context.ts
    sleep 300  # 5 minutes
done
```

### 4. Performance Thresholds

```bash
# Check if performance meets thresholds
check_performance() {
    local script="$1"
    local max_time="$2"
    
    local duration=$(time_command bun run "$script" 2>&1 | grep "Duration:" | cut -d' ' -f2)
    
    if (( $(echo "$duration > $max_time" | bc -l) )); then
        echo "Performance threshold exceeded: ${duration}s > ${max_time}s"
        return 1
    fi
    
    echo "Performance OK: ${duration}s <= ${max_time}s"
    return 0
}
```

### 5. Performance Regression Detection

```bash
# Compare current performance with baseline
detect_regression() {
    local script="$1"
    local baseline="$2"
    local current="$3"
    
    local regression=$(echo "scale=2; ($current - $baseline) / $baseline * 100" | bc -l)
    
    if (( $(echo "$regression > 10" | bc -l) )); then
        echo "Performance regression detected: ${regression}% increase"
        return 1
    fi
    
    echo "Performance stable: ${regression}% change"
    return 0
}
```

## Integration with CI/CD

### GitHub Actions Integration

```yaml
name: Performance Monitoring
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Monitor Performance
        run: |
          bun run perf:monitor-batch scripts "*.ts"
          bun run perf:summary
          
      - name: Check Performance Thresholds
        run: |
          if ! bun run perf:insights-summary | grep -q "Success Rate: [0-9]*%"; then
            echo "Performance check failed"
            exit 1
          fi
          
      - name: Upload Performance Report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: fossils/performance/
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run performance monitoring on changed scripts
changed_scripts=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')

if [ -n "$changed_scripts" ]; then
    echo "Running performance monitoring on changed scripts..."
    for script in $changed_scripts; do
        bun run perf:monitor-single "$script"
    done
fi
```

## Best Practices

### 1. Consistent Monitoring

- Use the same monitoring approach across all scripts
- Establish performance baselines
- Monitor performance trends over time
- Set up automated performance checks

### 2. Performance Targets

- Define acceptable execution times for different script types
- Set memory usage limits
- Establish success rate thresholds
- Monitor CPU usage patterns

### 3. Data Management

- Regularly clean old performance data
- Archive historical performance data
- Use performance data for capacity planning
- Integrate performance insights into decision-making

### 4. Reporting

- Generate regular performance reports
- Include performance metrics in fossilization reports
- Share performance insights with the team
- Use performance data for optimization decisions

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks
   - Optimize data structures
   - Consider streaming for large datasets

2. **Slow Execution Times**
   - Profile the script with `bun --inspect`
   - Check for unnecessary dependencies
   - Consider parallelization

3. **Low Success Rates**
   - Review error handling
   - Check for race conditions
   - Validate input data

4. **Inconsistent Performance**
   - Check for external dependencies
   - Monitor system resources
   - Review caching strategies

### Debugging Commands

```bash
# Debug memory usage
bun --inspect scripts/llm-chat-context.ts

# Profile CPU usage
bun --profile scripts/llm-chat-context.ts

# Check system resources
top -p $(pgrep -f "bun.*llm-chat-context")

# Monitor file I/O
strace -e trace=file bun run scripts/llm-chat-context.ts
```

## Conclusion

This performance monitoring system provides comprehensive insights into script performance while integrating seamlessly with the project's fossilization patterns. By leveraging terminal commands and providing multiple monitoring approaches, it enables effective performance optimization and capacity planning.

The system supports both simple timing with the `time` command and sophisticated monitoring with detailed metrics, making it suitable for various use cases from quick checks to comprehensive analysis. 