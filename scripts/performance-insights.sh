#!/bin/bash

# Performance Insights Script
# Combines terminal commands, time monitoring, and fossilization patterns
# Provides comprehensive performance analysis and recommendations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
INSIGHTS_DIR="fossils/performance"
INSIGHTS_LOG="$INSIGHTS_DIR/insights_log.json"
INSIGHTS_REPORT="$INSIGHTS_DIR/insights_report.md"
PERFORMANCE_DATA="$INSIGHTS_DIR/performance_data.json"

# Ensure insights directory exists
mkdir -p "$INSIGHTS_DIR"

# Function to run time command with detailed metrics
run_timed_command() {
    local script_path="$1"
    local script_name=$(basename "$script_path" .ts)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo -e "${BLUE}🔍 Running timed command: $script_name${NC}"
    
    # Create temporary files
    local temp_output=$(mktemp)
    local temp_error=$(mktemp)
    local temp_time=$(mktemp)
    local temp_memory=$(mktemp)
    
    # Start memory monitoring in background
    (
        while true; do
            echo "$(date +%s.%N) $(ps -o rss= -p $$ | awk '{print $1/1024}')" >> "$temp_memory"
            sleep 0.1
        done
    ) &
    local memory_pid=$!
    
    # Run script with time command
    local start_time=$(date +%s.%N)
    /usr/bin/time -p -o "$temp_time" \
        bun run "$script_path" > "$temp_output" 2> "$temp_error"
    local exit_code=$?
    local end_time=$(date +%s.%N)
    
    # Stop memory monitoring
    kill $memory_pid 2>/dev/null || true
    
    # Parse time output
    local real_time=$(grep "^real" "$temp_time" | awk '{print $2}')
    local user_time=$(grep "^user" "$temp_time" | awk '{print $2}')
    local sys_time=$(grep "^sys" "$temp_time" | awk '{print $2}')
    
    # Calculate memory metrics
    local max_memory=$(awk '{print $2}' "$temp_memory" | sort -n | tail -1)
    local avg_memory=$(awk '{sum+=$2; count++} END {print sum/count}' "$temp_memory")
    
    # Calculate additional metrics
    local output_size=$(wc -c < "$temp_output" 2>/dev/null || echo 0)
    local error_size=$(wc -c < "$temp_error" 2>/dev/null || echo 0)
    local cpu_percent=$(echo "scale=2; ($user_time + $sys_time) / $real_time * 100" | bc -l 2>/dev/null || echo 0)
    
    # Create performance data entry
    local performance_entry=$(cat <<EOF
{
  "script": "$script_name",
  "timestamp": "$timestamp",
  "execution_time": $real_time,
  "user_time": $user_time,
  "sys_time": $sys_time,
  "cpu_percent": $cpu_percent,
  "max_memory_mb": $max_memory,
  "avg_memory_mb": $avg_memory,
  "output_size_bytes": $output_size,
  "error_size_bytes": $error_size,
  "exit_code": $exit_code,
  "success": $([ $exit_code -eq 0 ] && echo "true" || echo "false")
}
EOF
)
    
    # Log performance data
    if [ -f "$PERFORMANCE_DATA" ]; then
        if [ -s "$PERFORMANCE_DATA" ]; then
            echo "," >> "$PERFORMANCE_DATA"
        fi
    else
        echo "[" > "$PERFORMANCE_DATA"
    fi
    echo "$performance_entry" >> "$PERFORMANCE_DATA"
    
    # Display results
    echo -e "${GREEN}✅ Execution completed${NC}"
    echo -e "${YELLOW}⏱️  Real time: ${real_time}s${NC}"
    echo -e "${YELLOW}💾 Max memory: ${max_memory}MB${NC}"
    echo -e "${YELLOW}🔢 Exit code: $exit_code${NC}"
    echo -e "${YELLOW}📊 CPU usage: ${cpu_percent}%${NC}"
    
    # Show output preview
    if [ -s "$temp_output" ]; then
        echo -e "${CYAN}📤 Output preview:${NC}"
        head -5 "$temp_output" | while read line; do
            echo -e "  $line"
        done
        if [ $(wc -l < "$temp_output") -gt 5 ]; then
            echo -e "  ... (truncated)"
        fi
    fi
    
    # Show error preview
    if [ -s "$temp_error" ]; then
        echo -e "${RED}❌ Error preview:${NC}"
        head -3 "$temp_error" | while read line; do
            echo -e "  $line"
        done
        if [ $(wc -l < "$temp_error") -gt 3 ]; then
            echo -e "  ... (truncated)"
        fi
    fi
    
    # Cleanup
    rm -f "$temp_output" "$temp_error" "$temp_time" "$temp_memory"
    
    return $exit_code
}

# Function to analyze performance data
analyze_performance() {
    echo -e "${BLUE}📊 Analyzing performance data...${NC}"
    
    if [ ! -f "$PERFORMANCE_DATA" ]; then
        echo -e "${YELLOW}⚠️  No performance data found${NC}"
        return 1
    fi
    
    # Use jq to analyze performance data
    local analysis=$(cat "$PERFORMANCE_DATA" | jq -r '
    {
        "total_executions": length,
        "unique_scripts": [.[] | .script] | unique | length,
        "successful_executions": (map(select(.success == true)) | length),
        "failed_executions": (map(select(.success == false)) | length),
        "success_rate": ((map(select(.success == true)) | length) / length * 100),
        "total_execution_time": (map(.execution_time) | add),
        "average_execution_time": (map(.execution_time) | add / length),
        "fastest_execution": (map(.execution_time) | min),
        "slowest_execution": (map(.execution_time) | max),
        "average_memory_usage": (map(.avg_memory_mb) | add / length),
        "max_memory_usage": (map(.max_memory_mb) | max),
        "average_cpu_usage": (map(.cpu_percent) | add / length),
        "script_analysis": group_by(.script) | map({
            "script": .[0].script,
            "executions": length,
            "success_rate": ((map(select(.success == true)) | length) / length * 100),
            "average_time": (map(.execution_time) | add / length),
            "average_memory": (map(.avg_memory_mb) | add / length),
            "max_memory": (map(.max_memory_mb) | max),
            "average_cpu": (map(.cpu_percent) | add / length)
        })
    }' 2>/dev/null || echo '{}')
    
    echo "$analysis" > "$INSIGHTS_LOG"
    echo -e "${GREEN}✅ Performance analysis saved to $INSIGHTS_LOG${NC}"
}

# Function to generate insights report
generate_insights_report() {
    echo -e "${BLUE}📋 Generating insights report...${NC}"
    
    if [ ! -f "$INSIGHTS_LOG" ]; then
        echo -e "${YELLOW}⚠️  No performance analysis found. Run analysis first.${NC}"
        return 1
    fi
    
    local analysis=$(cat "$INSIGHTS_LOG")
    
    # Generate markdown report
    cat > "$INSIGHTS_REPORT" <<EOF
# Performance Insights Report

Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Executive Summary

- **Total Executions**: $(echo "$analysis" | jq -r '.total_executions // 0')
- **Unique Scripts**: $(echo "$analysis" | jq -r '.unique_scripts // 0')
- **Success Rate**: $(echo "$analysis" | jq -r '.success_rate // 0 | round')%
- **Total Execution Time**: $(echo "$analysis" | jq -r '.total_execution_time // 0 | round')s

## Performance Metrics

### Timing Analysis
- **Average Execution Time**: $(echo "$analysis" | jq -r '.average_execution_time // 0 | round')s
- **Fastest Execution**: $(echo "$analysis" | jq -r '.fastest_execution // 0')s
- **Slowest Execution**: $(echo "$analysis" | jq -r '.slowest_execution // 0')s

### Resource Usage
- **Average Memory Usage**: $(echo "$analysis" | jq -r '.average_memory_usage // 0 | round')MB
- **Maximum Memory Usage**: $(echo "$analysis" | jq -r '.max_memory_usage // 0 | round')MB
- **Average CPU Usage**: $(echo "$analysis" | jq -r '.average_cpu_usage // 0 | round')%

### Reliability
- **Successful Executions**: $(echo "$analysis" | jq -r '.successful_executions // 0')
- **Failed Executions**: $(echo "$analysis" | jq -r '.failed_executions // 0')

## Script Performance Analysis

$(echo "$analysis" | jq -r '.script_analysis // [] | .[] | "- **\(.script)**: \(.executions) executions, \(.success_rate | round)% success, avg \(.average_time | round)s, avg \(.average_memory | round)MB"' 2>/dev/null || echo "No script analysis data available")

## Performance Insights

$(generate_performance_insights "$analysis")

## Fossilization Integration

This performance data integrates with the project's fossilization patterns:
- Performance logs are stored in \`$INSIGHTS_DIR\`
- Data can be used for CI/CD optimization and capacity planning
- Historical trends can be analyzed for performance improvements
- Success rates correlate with fossilization effectiveness

## Recommendations

$(generate_recommendations "$analysis")

## Usage Examples

\`\`\`bash
# Monitor a single script with detailed metrics
./scripts/performance-insights.sh monitor scripts/llm-chat-context.ts

# Monitor multiple scripts
./scripts/performance-insights.sh batch scripts "*.ts"

# Analyze performance data
./scripts/performance-insights.sh analyze

# Generate insights report
./scripts/performance-insights.sh report

# Get quick performance summary
./scripts/performance-insights.sh summary
\`\`\`

## Terminal Commands Used

This script leverages various terminal commands for comprehensive monitoring:

- \`time\`: Precise execution timing
- \`ps\`: Memory usage monitoring
- \`bc\`: Mathematical calculations
- \`jq\`: JSON data analysis
- \`awk\`: Text processing and metrics calculation
- \`wc\`: Output size measurement

EOF
    
    echo -e "${GREEN}✅ Insights report saved to $INSIGHTS_REPORT${NC}"
}

# Function to generate performance insights
generate_performance_insights() {
    local analysis="$1"
    
    local avg_time=$(echo "$analysis" | jq -r '.average_execution_time // 0')
    local success_rate=$(echo "$analysis" | jq -r '.success_rate // 0')
    local avg_memory=$(echo "$analysis" | jq -r '.average_memory_usage // 0')
    local avg_cpu=$(echo "$analysis" | jq -r '.average_cpu_usage // 0')
    
    echo "### Key Insights"
    echo ""
    
    if (( $(echo "$avg_time > 10" | bc -l) )); then
        echo "- ⚠️ **Performance Bottleneck**: Average execution time of ${avg_time}s indicates potential optimization opportunities"
    elif (( $(echo "$avg_time < 1" | bc -l) )); then
        echo "- ✅ **Excellent Performance**: Average execution time of ${avg_time}s is very good"
    else
        echo "- 📊 **Good Performance**: Average execution time of ${avg_time}s is acceptable"
    fi
    
    if (( $(echo "$success_rate < 90" | bc -l) )); then
        echo "- ❌ **Reliability Issues**: Success rate of ${success_rate}% needs improvement"
    else
        echo "- ✅ **High Reliability**: Success rate of ${success_rate}% is excellent"
    fi
    
    if (( $(echo "$avg_memory > 100" | bc -l) )); then
        echo "- 💾 **High Memory Usage**: Average memory usage of ${avg_memory}MB may need optimization"
    else
        echo "- ✅ **Efficient Memory Usage**: Average memory usage of ${avg_memory}MB is good"
    fi
    
    if (( $(echo "$avg_cpu > 80" | bc -l) )); then
        echo "- 🔥 **High CPU Usage**: Average CPU usage of ${avg_cpu}% indicates intensive processing"
    else
        echo "- ✅ **Balanced CPU Usage**: Average CPU usage of ${avg_cpu}% is well-balanced"
    fi
}

# Function to generate recommendations
generate_recommendations() {
    local analysis="$1"
    
    local avg_time=$(echo "$analysis" | jq -r '.average_execution_time // 0')
    local success_rate=$(echo "$analysis" | jq -r '.success_rate // 0')
    local avg_memory=$(echo "$analysis" | jq -r '.average_memory_usage // 0')
    
    echo "### Performance Recommendations"
    echo ""
    
    if (( $(echo "$avg_time > 10" | bc -l) )); then
        echo "- 🔍 **Profile slow scripts**: Use \`bun --inspect\` for detailed profiling"
        echo "- 📦 **Optimize dependencies**: Review and reduce unnecessary imports"
        echo "- 🔄 **Consider parallelization**: Run independent scripts concurrently"
    fi
    
    if (( $(echo "$success_rate < 90" | bc -l) )); then
        echo "- 🧪 **Improve error handling**: Add robust error handling to failing scripts"
        echo "- 📝 **Review error logs**: Analyze specific failure patterns"
        echo "- 🔧 **Fix underlying issues**: Address root causes of failures"
    fi
    
    if (( $(echo "$avg_memory > 100" | bc -l) )); then
        echo "- 💾 **Memory optimization**: Review memory-intensive operations"
        echo "- 🗑️ **Garbage collection**: Ensure proper cleanup of resources"
        echo "- 📊 **Memory profiling**: Use memory profiling tools"
    fi
    
    echo "- 📈 **Continuous monitoring**: Run this script regularly to track improvements"
    echo "- 🎯 **Set performance targets**: Define acceptable thresholds for different script types"
    echo "- 🔄 **CI/CD integration**: Integrate performance monitoring into CI/CD pipeline"
    echo "- 📊 **Historical analysis**: Track performance trends over time"
}

# Function to show quick summary
show_summary() {
    if [ ! -f "$INSIGHTS_LOG" ]; then
        echo -e "${YELLOW}⚠️  No performance analysis found. Run analysis first.${NC}"
        return 1
    fi
    
    local analysis=$(cat "$INSIGHTS_LOG")
    
    echo -e "${BLUE}📊 Performance Summary${NC}"
    echo -e "${CYAN}====================${NC}"
    echo -e "Total Executions: $(echo "$analysis" | jq -r '.total_executions // 0')"
    echo -e "Unique Scripts: $(echo "$analysis" | jq -r '.unique_scripts // 0')"
    echo -e "Success Rate: $(echo "$analysis" | jq -r '.success_rate // 0 | round')%"
    echo -e "Average Time: $(echo "$analysis" | jq -r '.average_execution_time // 0 | round')s"
    echo -e "Average Memory: $(echo "$analysis" | jq -r '.average_memory_usage // 0 | round')MB"
    echo -e "Average CPU: $(echo "$analysis" | jq -r '.average_cpu_usage // 0 | round')%"
}

# Function to run batch monitoring
run_batch_monitoring() {
    local scripts_dir="${1:-scripts}"
    local pattern="${2:-*.ts}"
    
    echo -e "${BLUE}🚀 Starting batch performance monitoring...${NC}"
    echo -e "${CYAN}Directory: $scripts_dir${NC}"
    echo -e "${CYAN}Pattern: $pattern${NC}"
    
    # Find all matching scripts
    local scripts=($(find "$scripts_dir" -name "$pattern" -type f))
    
    if [ ${#scripts[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No scripts found matching pattern${NC}"
        return 1
    fi
    
    echo -e "${GREEN}📋 Found ${#scripts[@]} scripts to monitor${NC}"
    
    local total_scripts=${#scripts[@]}
    local current=0
    local success_count=0
    local failure_count=0
    
    for script in "${scripts[@]}"; do
        ((current++))
        echo -e "${BLUE}[$current/$total_scripts] Monitoring: $script${NC}"
        
        if run_timed_command "$script"; then
            ((success_count++))
            echo -e "${GREEN}✅ Success${NC}"
        else
            ((failure_count++))
            echo -e "${RED}❌ Failed${NC}"
        fi
        
        echo ""
    done
    
    # Close the JSON array
    if [ -f "$PERFORMANCE_DATA" ]; then
        echo "]" >> "$PERFORMANCE_DATA"
    fi
    
    echo -e "${GREEN}🎉 Batch monitoring completed!${NC}"
    echo -e "${CYAN}✅ Successful: $success_count${NC}"
    echo -e "${CYAN}❌ Failed: $failure_count${NC}"
    echo -e "${CYAN}📊 Total: $total_scripts${NC}"
    
    # Generate analysis and report
    analyze_performance
    generate_insights_report
}

# Function to show help
show_help() {
    cat <<EOF
Performance Insights Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  monitor <script>           Monitor performance of a single script with detailed metrics
  batch [dir] [pattern]      Monitor all scripts in directory (default: scripts/*.ts)
  analyze                    Analyze collected performance data
  report                     Generate comprehensive insights report
  summary                    Show quick performance summary
  clean                      Clean performance data and reports
  help                       Show this help

Examples:
  $0 monitor scripts/llm-chat-context.ts
  $0 batch scripts "*.ts"
  $0 batch src/cli "*.ts"
  $0 analyze
  $0 report
  $0 summary

Features:
  - Detailed timing with \`time\` command
  - Memory usage monitoring
  - CPU usage calculation
  - Output/error size measurement
  - Fossilization pattern integration
  - Comprehensive reporting
  - Performance recommendations

Performance data is stored in $INSIGHTS_DIR and integrates with
the project's fossilization patterns for reporting and analysis.
EOF
}

# Function to clean performance data
clean_performance_data() {
    echo -e "${YELLOW}🧹 Cleaning performance data...${NC}"
    rm -f "$INSIGHTS_LOG" "$INSIGHTS_REPORT" "$PERFORMANCE_DATA"
    echo -e "${GREEN}✅ Performance data cleaned${NC}"
}

# Main script logic
main() {
    local command="${1:-help}"
    
    case "$command" in
        "monitor")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}❌ Error: Script path required${NC}"
                show_help
                exit 1
            fi
            run_timed_command "$2"
            ;;
        "batch")
            local dir="${2:-scripts}"
            local pattern="${3:-*.ts}"
            run_batch_monitoring "$dir" "$pattern"
            ;;
        "analyze")
            analyze_performance
            ;;
        "report")
            generate_insights_report
            ;;
        "summary")
            show_summary
            ;;
        "clean")
            clean_performance_data
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 