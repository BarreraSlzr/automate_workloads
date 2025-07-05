#!/bin/bash

# Performance Monitor for Bun Scripts
# Leverages time command and other terminal utilities for performance insights
# Integrates with fossilization patterns for reporting

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
PERFORMANCE_LOG_DIR="fossils/performance"
PERFORMANCE_LOG_FILE="$PERFORMANCE_LOG_DIR/performance_log.json"
PERFORMANCE_SUMMARY_FILE="$PERFORMANCE_LOG_DIR/performance_summary.json"
PERFORMANCE_REPORT_FILE="$PERFORMANCE_LOG_DIR/performance_report.md"

# Ensure performance log directory exists
mkdir -p "$PERFORMANCE_LOG_DIR"

# Function to log performance data
log_performance() {
    local script_name="$1"
    local execution_time="$2"
    local memory_usage="$3"
    local exit_code="$4"
    local timestamp="$5"
    local additional_metrics="$6"
    
    # Create performance log entry
    local log_entry=$(cat <<EOF
{
  "script": "$script_name",
  "execution_time": $execution_time,
  "memory_usage_mb": $memory_usage,
  "exit_code": $exit_code,
  "timestamp": "$timestamp",
  "additional_metrics": $additional_metrics
}
EOF
)
    
    # Append to performance log
    if [ -f "$PERFORMANCE_LOG_FILE" ]; then
        # Check if file is empty or just contains opening bracket
        if [ ! -s "$PERFORMANCE_LOG_FILE" ] || [ "$(cat "$PERFORMANCE_LOG_FILE" | wc -l)" -eq 1 ]; then
            # First entry, just add the entry
            echo "$log_entry" >> "$PERFORMANCE_LOG_FILE"
        else
            # Add comma and entry
            echo "," >> "$PERFORMANCE_LOG_FILE"
            echo "$log_entry" >> "$PERFORMANCE_LOG_FILE"
        fi
    else
        # Create new file with opening bracket and entry
        echo "[" > "$PERFORMANCE_LOG_FILE"
        echo "$log_entry" >> "$PERFORMANCE_LOG_FILE"
    fi
}

# Function to run script with performance monitoring
run_with_performance_monitor() {
    local script_path="$1"
    local script_name=$(basename "$script_path" .ts)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo -e "${BLUE}🔍 Monitoring performance for: $script_name${NC}"
    echo -e "${CYAN}Timestamp: $timestamp${NC}"
    
    # Create temporary files for capturing output
    local temp_output=$(mktemp)
    local temp_error=$(mktemp)
    local temp_time=$(mktemp)
    
    # Run script with time command and capture metrics
    /usr/bin/time -p -o "$temp_time" \
        bun run "$script_path" > "$temp_output" 2> "$temp_error"
    
    local exit_code=$?
    
    # Parse time output
    local real_time=$(grep "^real" "$temp_time" | awk '{print $2}')
    local user_time=$(grep "^user" "$temp_time" | awk '{print $2}')
    local sys_time=$(grep "^sys" "$temp_time" | awk '{print $2}')
    
    # Estimate memory usage (rough approximation)
    local memory_usage=$(ps -o rss= -p $$ | awk '{print $1/1024}')
    
    # Calculate additional metrics
    local additional_metrics=$(cat <<EOF
{
  "real_time": $real_time,
  "user_time": $user_time,
  "sys_time": $sys_time,
  "output_size_bytes": $(wc -c < "$temp_output" 2>/dev/null || echo 0),
  "error_size_bytes": $(wc -c < "$temp_error" 2>/dev/null || echo 0),
  "cpu_percent": $(echo "scale=2; ($user_time + $sys_time) / $real_time * 100" | bc -l 2>/dev/null || echo 0)
}
EOF
)
    
    # Log performance data
    log_performance "$script_name" "$real_time" "$memory_usage" "$exit_code" "$timestamp" "$additional_metrics"
    
    # Close the JSON array if this is the last entry
    if [ -f "$PERFORMANCE_LOG_FILE" ]; then
        echo "]" >> "$PERFORMANCE_LOG_FILE"
    fi
    
    # Display results
    echo -e "${GREEN}✅ Execution completed${NC}"
    echo -e "${YELLOW}⏱️  Real time: ${real_time}s${NC}"
    echo -e "${YELLOW}💾 Memory usage: ${memory_usage}MB${NC}"
    echo -e "${YELLOW}🔢 Exit code: $exit_code${NC}"
    
    # Show output if any
    if [ -s "$temp_output" ]; then
        echo -e "${CYAN}📤 Output:${NC}"
        cat "$temp_output"
    fi
    
    # Show errors if any
    if [ -s "$temp_error" ]; then
        echo -e "${RED}❌ Errors:${NC}"
        cat "$temp_error"
    fi
    
    # Cleanup
    rm -f "$temp_output" "$temp_error" "$temp_time"
    
    return $exit_code
}

# Function to generate performance summary
generate_performance_summary() {
    echo -e "${BLUE}📊 Generating performance summary...${NC}"
    
    if [ ! -f "$PERFORMANCE_LOG_FILE" ]; then
        echo -e "${YELLOW}⚠️  No performance data found${NC}"
        return 1
    fi
    
    # Use jq to analyze performance data
    local summary=$(cat "$PERFORMANCE_LOG_FILE" | jq -r '
    {
        "total_executions": length,
        "scripts": [.[] | .script] | unique | length,
        "average_execution_time": (map(.execution_time) | add / length),
        "fastest_execution": (map(.execution_time) | min),
        "slowest_execution": (map(.execution_time) | max),
        "total_execution_time": (map(.execution_time) | add),
        "successful_executions": (map(select(.exit_code == 0)) | length),
        "failed_executions": (map(select(.exit_code != 0)) | length),
        "success_rate": ((map(select(.exit_code == 0)) | length) / length * 100),
        "average_memory_usage": (map(.memory_usage_mb) | add / length),
        "script_performance": group_by(.script) | map({
            "script": .[0].script,
            "executions": length,
            "average_time": (map(.execution_time) | add / length),
            "success_rate": ((map(select(.exit_code == 0)) | length) / length * 100)
        })
    }' 2>/dev/null || echo '{}')
    
    echo "$summary" > "$PERFORMANCE_SUMMARY_FILE"
    echo -e "${GREEN}✅ Performance summary saved to $PERFORMANCE_SUMMARY_FILE${NC}"
}

# Function to generate performance report
generate_performance_report() {
    echo -e "${BLUE}📋 Generating performance report...${NC}"
    
    if [ ! -f "$PERFORMANCE_SUMMARY_FILE" ]; then
        echo -e "${YELLOW}⚠️  No performance summary found. Run summary first.${NC}"
        return 1
    fi
    
    local summary=$(cat "$PERFORMANCE_SUMMARY_FILE")
    
    # Generate markdown report
    cat > "$PERFORMANCE_REPORT_FILE" <<EOF
# Performance Report

Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Executive Summary

- **Total Executions**: $(echo "$summary" | jq -r '.total_executions // 0')
- **Unique Scripts**: $(echo "$summary" | jq -r '.scripts // 0')
- **Success Rate**: $(echo "$summary" | jq -r '.success_rate // 0 | round')%
- **Total Execution Time**: $(echo "$summary" | jq -r '.total_execution_time // 0 | round')s

## Performance Metrics

### Timing
- **Average Execution Time**: $(echo "$summary" | jq -r '.average_execution_time // 0 | round')s
- **Fastest Execution**: $(echo "$summary" | jq -r '.fastest_execution // 0')s
- **Slowest Execution**: $(echo "$summary" | jq -r '.slowest_execution // 0')s

### Resource Usage
- **Average Memory Usage**: $(echo "$summary" | jq -r '.average_memory_usage // 0 | round')MB

### Reliability
- **Successful Executions**: $(echo "$summary" | jq -r '.successful_executions // 0')
- **Failed Executions**: $(echo "$summary" | jq -r '.failed_executions // 0')

## Script Performance Breakdown

$(echo "$summary" | jq -r '.script_performance // [] | .[] | "- **\(.script)**: \(.executions) executions, avg \(.average_time | round)s, \(.success_rate | round)% success rate"' 2>/dev/null || echo "No script performance data available")

## Recommendations

$(generate_recommendations "$summary")

## Fossilization Integration

This performance data is integrated with the project's fossilization patterns:
- Performance logs are stored in \`fossils/performance/\`
- Data can be used for CI/CD optimization
- Historical trends can be analyzed for capacity planning

EOF
    
    echo -e "${GREEN}✅ Performance report saved to $PERFORMANCE_REPORT_FILE${NC}"
}

# Function to generate recommendations based on performance data
generate_recommendations() {
    local summary="$1"
    
    local avg_time=$(echo "$summary" | jq -r '.average_execution_time // 0')
    local success_rate=$(echo "$summary" | jq -r '.success_rate // 0')
    
    echo "### Performance Recommendations"
    echo ""
    
    if (( $(echo "$avg_time > 10" | bc -l) )); then
        echo "- ⚠️ **High execution times detected**: Consider optimizing slow scripts"
        echo "- 🔍 **Profile slow scripts**: Use \`bun --inspect\` for detailed profiling"
        echo "- 📦 **Check dependencies**: Review and optimize imports"
    fi
    
    if (( $(echo "$success_rate < 90" | bc -l) )); then
        echo "- ❌ **Low success rate**: Investigate and fix failing scripts"
        echo "- 🧪 **Add error handling**: Improve script robustness"
        echo "- 📝 **Review error logs**: Check \`fossils/performance/\` for details"
    fi
    
    echo "- 📊 **Monitor trends**: Run this script regularly to track improvements"
    echo "- 🔄 **Optimize CI/CD**: Use performance data to optimize pipeline"
    echo "- 💾 **Memory optimization**: Consider memory usage for long-running scripts"
}

# Function to run batch performance monitoring
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
    
    for script in "${scripts[@]}"; do
        ((current++))
        echo -e "${BLUE}[$current/$total_scripts] Monitoring: $script${NC}"
        
        if run_with_performance_monitor "$script"; then
            echo -e "${GREEN}✅ Success${NC}"
        else
            echo -e "${RED}❌ Failed${NC}"
        fi
        
        echo ""
    done
    
    # Close the JSON array
    if [ -f "$PERFORMANCE_LOG_FILE" ]; then
        echo "]" >> "$PERFORMANCE_LOG_FILE"
    fi
    
    echo -e "${GREEN}🎉 Batch monitoring completed!${NC}"
    generate_performance_summary
    generate_performance_report
}

# Function to show help
show_help() {
    cat <<EOF
Performance Monitor for Bun Scripts

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  monitor <script>           Monitor performance of a single script
  batch [dir] [pattern]      Monitor all scripts in directory (default: scripts/*.ts)
  summary                    Generate performance summary
  report                     Generate performance report
  clean                      Clean performance logs
  help                       Show this help

Examples:
  $0 monitor scripts/llm-chat-context.ts
  $0 batch scripts "*.ts"
  $0 batch src/cli "*.ts"
  $0 summary
  $0 report

Performance data is stored in fossils/performance/ and integrates with
the project's fossilization patterns for reporting and analysis.
EOF
}

# Function to clean performance logs
clean_performance_logs() {
    echo -e "${YELLOW}🧹 Cleaning performance logs...${NC}"
    rm -f "$PERFORMANCE_LOG_FILE" "$PERFORMANCE_SUMMARY_FILE" "$PERFORMANCE_REPORT_FILE"
    echo -e "${GREEN}✅ Performance logs cleaned${NC}"
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
            run_with_performance_monitor "$2"
            ;;
        "batch")
            local dir="${2:-scripts}"
            local pattern="${3:-*.ts}"
            run_batch_monitoring "$dir" "$pattern"
            ;;
        "summary")
            generate_performance_summary
            ;;
        "report")
            generate_performance_report
            ;;
        "clean")
            clean_performance_logs
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