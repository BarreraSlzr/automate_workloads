#!/bin/bash

# Performance Notifications & Granular Tracking
# Provides macOS notifications and detailed performance traceability

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
PERFORMANCE_DIR="fossils/performance"
PERFORMANCE_LOG="$PERFORMANCE_DIR/performance_log.json"
PERFORMANCE_HISTORY="$PERFORMANCE_DIR/performance_history.json"
PERFORMANCE_TRENDS="$PERFORMANCE_DIR/performance_trends.md"
GRANULAR_LOG="$PERFORMANCE_DIR/granular_trace.json"

# Ensure performance directory exists
mkdir -p "$PERFORMANCE_DIR"

# Function to send macOS notification
send_macos_notification() {
    local title="$1"
    local message="$2"
    local subtitle="${3:-}"
    
    if command -v osascript >/dev/null 2>&1; then
        osascript -e "
        display notification \"$message\" with title \"$title\" subtitle \"$subtitle\" sound name \"Glass\"
        "
    else
        echo -e "${YELLOW}macOS notification not available${NC}"
        echo -e "${BLUE}$title${NC}: $message"
    fi
}

# Function to log granular performance data
log_granular_performance() {
    local script_name="$1"
    local execution_time="$2"
    local memory_usage="$3"
    local exit_code="$4"
    local timestamp="$5"
    local git_sha="$6"
    local git_branch="$7"
    local additional_metrics="$8"
    
    # Create granular log entry
    local granular_entry=$(cat <<EOF
{
  "script": "$script_name",
  "execution_time": $execution_time,
  "memory_usage_mb": $memory_usage,
  "exit_code": $exit_code,
  "timestamp": "$timestamp",
  "git_sha": "$git_sha",
  "git_branch": "$git_branch",
  "additional_metrics": $additional_metrics,
  "environment": {
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')",
    "bun_version": "$(bun --version 2>/dev/null || echo 'unknown')",
    "os": "$(uname -s)",
    "cpu_cores": "$(sysctl -n hw.ncpu 2>/dev/null || echo 'unknown')",
    "memory_total": "$(sysctl -n hw.memsize 2>/dev/null | awk '{print $1/1024/1024/1024}' || echo 'unknown')"
  }
}
EOF
)
    
    # Append to granular log
    if [ -f "$GRANULAR_LOG" ]; then
        if [ -s "$GRANULAR_LOG" ]; then
            echo "," >> "$GRANULAR_LOG"
        fi
    else
        echo "[" > "$GRANULAR_LOG"
    fi
    echo "$granular_entry" >> "$GRANULAR_LOG"
}

# Function to run script with granular tracking
run_with_granular_tracking() {
    local script_path="$1"
    local script_name=$(basename "$script_path" .ts)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local git_sha=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    
    echo -e "${BLUE}🔍 Running with granular tracking: $script_name${NC}"
    echo -e "${CYAN}Git: $git_branch @ $git_sha${NC}"
    
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
    
    # Give memory monitoring a moment to start
    sleep 0.1
    
    # Run script with time command
    local start_time=$(date +%s.%N)
    /usr/bin/time -p -o "$temp_time" \
        bun run "$script_path" > "$temp_output" 2> "$temp_error"
    local exit_code=$?
    local end_time=$(date +%s.%N)
    
    # Stop memory monitoring
    kill $memory_pid 2>/dev/null || true
    wait $memory_pid 2>/dev/null || true
    
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
    
    # Create additional metrics
    local additional_metrics=$(cat <<EOF
{
  "real_time": $real_time,
  "user_time": $user_time,
  "sys_time": $sys_time,
  "cpu_percent": $cpu_percent,
  "max_memory_mb": $max_memory,
  "avg_memory_mb": $avg_memory,
  "output_size_bytes": $output_size,
  "error_size_bytes": $error_size,
  "memory_samples": $(wc -l < "$temp_memory")
}
EOF
)
    
    # Log granular performance data
    log_granular_performance "$script_name" "$real_time" "$max_memory" "$exit_code" "$timestamp" "$git_sha" "$git_branch" "$additional_metrics"
    
    # Display results
    echo -e "${GREEN}✅ Execution completed${NC}"
    echo -e "${YELLOW}⏱️  Real time: ${real_time}s${NC}"
    echo -e "${YELLOW}💾 Max memory: ${max_memory}MB${NC}"
    echo -e "${YELLOW}🔢 Exit code: $exit_code${NC}"
    echo -e "${YELLOW}📊 CPU usage: ${cpu_percent}%${NC}"
    
    # Send macOS notification
    if [ $exit_code -eq 0 ]; then
        send_macos_notification "Performance Test Passed" "$script_name completed in ${real_time}s" "Memory: ${max_memory}MB"
    else
        send_macos_notification "Performance Test Failed" "$script_name failed (exit: $exit_code)" "Time: ${real_time}s"
    fi
    
    # Show output preview
    if [ -s "$temp_output" ]; then
        echo -e "${CYAN}📤 Output preview:${NC}"
        head -3 "$temp_output" | while read line; do
            echo -e "  $line"
        done
        if [ $(wc -l < "$temp_output") -gt 3 ]; then
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

# Function to analyze performance trends
analyze_performance_trends() {
    echo -e "${BLUE}📈 Analyzing performance trends...${NC}"
    
    if [ ! -f "$GRANULAR_LOG" ]; then
        echo -e "${YELLOW}⚠️  No granular performance data found${NC}"
        return 1
    fi
    
    # Use jq to analyze trends
    local trends=$(cat "$GRANULAR_LOG" | jq -r '
    {
        "total_executions": length,
        "unique_scripts": [.[] | .script] | unique | length,
        "branches": [.[] | .git_branch] | unique,
        "time_period": {
            "earliest": (map(.timestamp) | min),
            "latest": (map(.timestamp) | max)
        },
        "performance_trends": group_by(.script) | map({
            "script": .[0].script,
            "executions": length,
            "avg_time": (map(.execution_time) | add / length),
            "trend": (
                if length > 1 then
                    (.[-1].execution_time - .[0].execution_time) / .[0].execution_time * 100
                else
                    0
                end
            ),
            "latest_time": .[-1].execution_time,
            "earliest_time": .[0].execution_time
        }),
        "regressions": group_by(.script) | map(select(length > 1)) | map(select(
            (.[-1].execution_time - .[0].execution_time) / .[0].execution_time > 0.1
        )) | map({
            "script": .[0].script,
            "regression_percent": ((.[-1].execution_time - .[0].execution_time) / .[0].execution_time * 100)
        })
    }' 2>/dev/null || echo '{}')
    
    echo "$trends" > "$PERFORMANCE_DIR/trends_analysis.json"
    echo -e "${GREEN}✅ Trends analysis saved to $PERFORMANCE_DIR/trends_analysis.json${NC}"
}

# Function to generate detailed traceability report
generate_traceability_report() {
    echo -e "${BLUE}📋 Generating traceability report...${NC}"
    
    if [ ! -f "$GRANULAR_LOG" ]; then
        echo -e "${YELLOW}⚠️  No granular performance data found${NC}"
        return 1
    fi
    
    local trends=$(cat "$PERFORMANCE_DIR/trends_analysis.json" 2>/dev/null || echo '{}')
    
    # Generate markdown report
    cat > "$PERFORMANCE_DIR/traceability_report.md" <<EOF
# Performance Traceability Report

Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Executive Summary

- **Total Executions**: $(echo "$trends" | jq -r '.total_executions // 0')
- **Unique Scripts**: $(echo "$trends" | jq -r '.unique_scripts // 0')
- **Branches Tracked**: $(echo "$trends" | jq -r '.branches | length // 0')
- **Time Period**: $(echo "$trends" | jq -r '.time_period.earliest // "unknown"') to $(echo "$trends" | jq -r '.time_period.latest // "unknown"')

## Performance Trends by Script

$(echo "$trends" | jq -r '.performance_trends // [] | .[] | "- **\(.script)**: \(.executions) executions, avg \(.avg_time | round)s, trend: \(.trend | round)%"' 2>/dev/null || echo "No trend data available")

## Performance Regressions Detected

$(echo "$trends" | jq -r '.regressions // [] | .[] | "- **\(.script)**: \(.regression_percent | round)% regression"' 2>/dev/null || echo "No regressions detected")

## Granular Traceability

Each execution is tracked with:
- Git SHA and branch
- Environment details (OS, Node/Bun versions, CPU cores, memory)
- Detailed timing breakdown (real, user, sys time)
- Memory usage patterns
- Output/error sizes
- CPU utilization

## Historical Data

Performance data is preserved in:
- \`$GRANULAR_LOG\`: Detailed execution logs
- \`$PERFORMANCE_HISTORY\`: Historical summaries
- \`$PERFORMANCE_TRENDS\`: Trend analysis

## Recommendations

$(generate_traceability_recommendations "$trends")

EOF
    
    echo -e "${GREEN}✅ Traceability report saved to $PERFORMANCE_DIR/traceability_report.md${NC}"
}

# Function to generate traceability recommendations
generate_traceability_recommendations() {
    local trends="$1"
    
    local regressions=$(echo "$trends" | jq -r '.regressions | length // 0')
    
    echo "### Traceability Recommendations"
    echo ""
    
    if [ "$regressions" -gt 0 ]; then
        echo "- ⚠️ **Performance regressions detected**: Review scripts with >10% performance degradation"
        echo "- 🔍 **Investigate root causes**: Check recent changes in regressed scripts"
        echo "- 📊 **Monitor trends**: Set up alerts for performance regressions"
    fi
    
    echo "- 📈 **Track improvements**: Monitor scripts showing performance gains"
    echo "- 🔄 **Regular audits**: Run traceability analysis weekly"
    echo "- 📝 **Document changes**: Link performance changes to code changes"
    echo "- 🎯 **Set baselines**: Establish performance baselines for each script"
}

# Function to show help
show_help() {
    cat <<EOF
Performance Notifications & Granular Tracking

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  track <script>           Run script with granular tracking and macOS notifications
  batch [dir] [pattern]    Track all scripts in directory with notifications
  trends                   Analyze performance trends
  report                   Generate traceability report
  notify <title> <msg>     Send macOS notification
  help                     Show this help

Examples:
  $0 track scripts/llm-chat-context.ts
  $0 batch scripts "*.ts"
  $0 trends
  $0 report
  $0 notify "Test Complete" "Performance monitoring finished"

Features:
  - macOS notifications for script completion/failure
  - Granular performance tracking with git metadata
  - Historical trend analysis
  - Performance regression detection
  - Detailed traceability reports
  - Environment tracking (OS, versions, hardware)

Performance data is stored in $PERFORMANCE_DIR with full traceability.
EOF
}

# Function to send custom notification
send_custom_notification() {
    local title="$1"
    local message="$2"
    
    send_macos_notification "$title" "$message"
    echo -e "${GREEN}✅ Notification sent: $title - $message${NC}"
}

# Main script logic
main() {
    local command="${1:-help}"
    
    case "$command" in
        "track")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}❌ Error: Script path required${NC}"
                show_help
                exit 1
            fi
            run_with_granular_tracking "$2"
            ;;
        "batch")
            local dir="${2:-scripts}"
            local pattern="${3:-*.ts}"
            
            echo -e "${BLUE}🚀 Starting batch tracking...${NC}"
            local scripts=($(find "$dir" -name "$pattern" -type f))
            
            if [ ${#scripts[@]} -eq 0 ]; then
                echo -e "${YELLOW}⚠️  No scripts found matching pattern${NC}"
                return 1
            fi
            
            echo -e "${GREEN}📋 Found ${#scripts[@]} scripts to track${NC}"
            
            local total_scripts=${#scripts[@]}
            local current=0
            local success_count=0
            local failure_count=0
            
            for script in "${scripts[@]}"; do
                ((current++))
                echo -e "${BLUE}[$current/$total_scripts] Tracking: $script${NC}"
                
                if run_with_granular_tracking "$script"; then
                    ((success_count++))
                else
                    ((failure_count++))
                fi
                
                echo ""
            done
            
            # Close the JSON array
            if [ -f "$GRANULAR_LOG" ]; then
                echo "]" >> "$GRANULAR_LOG"
            fi
            
            echo -e "${GREEN}🎉 Batch tracking completed!${NC}"
            echo -e "${CYAN}✅ Successful: $success_count${NC}"
            echo -e "${CYAN}❌ Failed: $failure_count${NC}"
            echo -e "${CYAN}📊 Total: $total_scripts${NC}"
            
            # Send summary notification
            send_macos_notification "Batch Tracking Complete" "$success_count/$total_scripts scripts passed" "Performance monitoring finished"
            
            # Generate trends and report
            analyze_performance_trends
            generate_traceability_report
            ;;
        "trends")
            analyze_performance_trends
            ;;
        "report")
            generate_traceability_report
            ;;
        "notify")
            if [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
                echo -e "${RED}❌ Error: Title and message required${NC}"
                show_help
                exit 1
            fi
            send_custom_notification "$2" "$3"
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