#!/bin/bash

# Test Runner with Event Loop Monitoring
# Wraps bun test with comprehensive monitoring to detect hanging tests and provide insights

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
MONITORING_OUTPUT_DIR="fossils/test-monitoring"
MONITORING_DATA_FILE="fossils/monitoring/metrics.json"
MONITORING_REPORT_FILE="fossils/monitoring/report.md"
TEST_TIMEOUT=300000  # 5 minutes default timeout
SNAPSHOT_INTERVAL=1000  # 1 second snapshots
HANGING_THRESHOLD=30000  # 30 seconds for hanging detection

# Ensure monitoring output directory exists
mkdir -p "$MONITORING_OUTPUT_DIR"

# Function to show help
show_help() {
    cat <<EOF
Test Runner with Event Loop Monitoring

Usage: $0 [OPTIONS] [BUN_TEST_ARGS...]

Options:
  -h, --help                    Show this help message
  -t, --timeout <ms>           Test timeout in milliseconds (default: 300000)
  -i, --interval <ms>          Snapshot interval in milliseconds (default: 1000)
  -H, --hanging-threshold <ms> Hanging detection threshold (default: 30000)
  -o, --output <dir>           Output directory for monitoring data (default: fossils/test-monitoring)
  -v, --verbose                Enable verbose output
  --no-monitoring              Run tests without monitoring
  --monitor-only               Only run monitoring, don't run tests

Examples:
  $0                                    # Run all tests with monitoring
  $0 tests/unit/                        # Run unit tests with monitoring
  $0 --timeout 600000 tests/e2e/        # Run E2E tests with 10min timeout
  $0 --hanging-threshold 15000          # Detect hanging after 15 seconds
  $0 --verbose --output custom-dir/     # Verbose output to custom directory

Monitoring Features:
  - Real-time call stack tracking
  - Automatic hanging test detection
  - Memory and CPU usage monitoring
  - Detailed test execution insights
  - Performance bottleneck identification
EOF
}

# Parse command line arguments
VERBOSE=false
NO_MONITORING=false
MONITOR_ONLY=false
BUN_TEST_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        -i|--interval)
            SNAPSHOT_INTERVAL="$2"
            shift 2
            ;;
        -H|--hanging-threshold)
            HANGING_THRESHOLD="$2"
            shift 2
            ;;
        -o|--output)
            MONITORING_OUTPUT_DIR="$2"
            MONITORING_DATA_FILE="$MONITORING_OUTPUT_DIR/test_monitoring.json"
            MONITORING_REPORT_FILE="$MONITORING_OUTPUT_DIR/test-monitoring.report.md"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-monitoring)
            NO_MONITORING=true
            shift
            ;;
        --monitor-only)
            MONITOR_ONLY=true
            shift
            ;;
        --)
            shift
            BUN_TEST_ARGS+=("$@")
            break
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_help
            exit 1
            ;;
        *)
            BUN_TEST_ARGS+=("$1")
            shift
            ;;
    esac
done

# Function to log messages
log() {
    local level="$1"
    shift
    local message="$*"
    
    case $level in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = true ]; then
                echo -e "${PURPLE}🔍 $message${NC}"
            fi
            ;;
    esac
}

# Function to create monitoring wrapper script
create_monitoring_wrapper() {
    local wrapper_file="$MONITORING_OUTPUT_DIR/monitoring-wrapper.ts"
    
    cat > "$wrapper_file" <<EOF
#!/usr/bin/env bun

/**
 * Test Monitoring Wrapper
 * Wraps bun test with event loop monitoring
 */

import { 
  startGlobalMonitoring, 
  stopGlobalMonitoring, 
  getCallStackSummary,
  generateMonitoringReport,
  exportMonitoringData,
  HangingDetectionConfig 
} from '../../src/utils/eventLoopMonitor';

// Configuration
const config: Partial<HangingDetectionConfig> = {
  timeoutThreshold: $HANGING_THRESHOLD,
  memoryThreshold: 200 * 1024 * 1024, // 200MB
  cpuThreshold: 90,
  eventLoopLagThreshold: 200,
  maxActiveCalls: 500,
  enableStackTrace: true,
  enableMemoryTracking: true,
  enableCpuTracking: true,
  logHangingCalls: true,
  alertOnHanging: true,
};

// Start monitoring
console.log('🔍 Starting test monitoring...');
startGlobalMonitoring($SNAPSHOT_INTERVAL, config);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n🛑 Test monitoring interrupted');
  const snapshots = stopGlobalMonitoring();
  const summary = getCallStackSummary();
  
  console.log('\\n📊 Test Monitoring Summary:');
  console.log(\`Total Snapshots: \${snapshots.length}\`);
  console.log(\`Active Calls: \${summary.summary.totalActive}\`);
  console.log(\`Completed Calls: \${summary.summary.totalCompleted}\`);
  console.log(\`Hanging Calls: \${summary.summary.totalHanging}\`);
  
  if (summary.hanging.length > 0) {
    console.log('\\n🚨 Hanging Calls Detected:');
    summary.hanging.forEach(call => {
      console.log(\`  - \${call.functionName} (\${call.duration?.toFixed(2)}ms)\`);
      console.log(\`    Location: \${call.fileName}:\${call.lineNumber}\`);
    });
  }
  
  process.exit(1);
});

process.on('exit', (code) => {
  console.log('\\n🛑 Test monitoring stopped');
  const snapshots = stopGlobalMonitoring();
  const summary = getCallStackSummary();
  
  // Export data
  exportMonitoringData('$MONITORING_DATA_FILE');
  
  // Generate report
  const report = generateMonitoringReport();
  require('fs').writeFileSync('$MONITORING_REPORT_FILE', report);
  
  console.log('\\n📊 Final Test Monitoring Summary:');
  console.log(\`Exit Code: \${code}\`);
  console.log(\`Total Snapshots: \${snapshots.length}\`);
  console.log(\`Active Calls: \${summary.summary.totalActive}\`);
  console.log(\`Completed Calls: \${summary.summary.totalCompleted}\`);
  console.log(\`Hanging Calls: \${summary.summary.totalHanging}\`);
  console.log(\`Average Duration: \${summary.summary.averageDuration.toFixed(2)}ms\`);
  console.log(\`Max Duration: \${summary.summary.maxDuration.toFixed(2)}ms\`);
  
  if (summary.hanging.length > 0) {
    console.log('\\n🚨 Hanging Calls Detected:');
    summary.hanging.forEach(call => {
      console.log(\`  - \${call.functionName} (\${call.duration?.toFixed(2)}ms)\`);
      console.log(\`    Location: \${call.fileName}:\${call.lineNumber}\`);
      if (call.metadata) {
        console.log(\`    Metadata: \${JSON.stringify(call.metadata)}\`);
      }
    });
  }
  
  console.log(\`\\n📄 Report saved to: $MONITORING_REPORT_FILE\`);
  console.log(\`📊 Data exported to: $MONITORING_DATA_FILE\`);
});

// Export monitoring functions for use in tests
export { startGlobalMonitoring, stopGlobalMonitoring, getCallStackSummary };
EOF

    chmod +x "$wrapper_file"
    echo "$wrapper_file"
}

# Function to run tests with monitoring
run_tests_with_monitoring() {
    local test_args=("$@")
    local wrapper_file=$(create_monitoring_wrapper)
    
    log "INFO" "Starting tests with event loop monitoring..."
    log "DEBUG" "Test timeout: ${TEST_TIMEOUT}ms"
    log "DEBUG" "Snapshot interval: ${SNAPSHOT_INTERVAL}ms"
    log "DEBUG" "Hanging threshold: ${HANGING_THRESHOLD}ms"
    log "DEBUG" "Test arguments: ${test_args[*]}"
    
    # Set environment variables for monitoring
    export EVENT_LOOP_MONITORING_ENABLED=true
    export EVENT_LOOP_MONITORING_OUTPUT_DIR="$MONITORING_OUTPUT_DIR"
    export EVENT_LOOP_MONITORING_TIMEOUT="$HANGING_THRESHOLD"
    
    # Run bun test with monitoring wrapper
    local start_time=$(date +%s)
    
    # Use gtimeout on macOS if available, otherwise run without timeout
    if command -v gtimeout >/dev/null 2>&1; then
        # macOS with coreutils installed
        if gtimeout $((TEST_TIMEOUT / 1000)) bun test "${test_args[@]}" --preload "$wrapper_file"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "SUCCESS" "Tests completed successfully in ${duration}s"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "ERROR" "Tests failed or timed out after ${duration}s"
            
            # Check if it was a timeout
            if [ $duration -ge $((TEST_TIMEOUT / 1000)) ]; then
                log "WARNING" "Tests exceeded timeout limit of $((TEST_TIMEOUT / 1000))s"
            fi
        fi
    else
        # Run without timeout (macOS default)
        if bun test "${test_args[@]}" --preload "$wrapper_file"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "SUCCESS" "Tests completed successfully in ${duration}s"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "ERROR" "Tests failed after ${duration}s"
        fi
    fi
}

# Function to run tests without monitoring
run_tests_without_monitoring() {
    local test_args=("$@")
    
    log "INFO" "Running tests without monitoring..."
    log "DEBUG" "Test arguments: ${test_args[*]}"
    
    local start_time=$(date +%s)
    
    # Use gtimeout on macOS if available, otherwise run without timeout
    if command -v gtimeout >/dev/null 2>&1; then
        if gtimeout $((TEST_TIMEOUT / 1000)) bun test "${test_args[@]}"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "SUCCESS" "Tests completed successfully in ${duration}s"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "ERROR" "Tests failed or timed out after ${duration}s"
        fi
    else
        if bun test "${test_args[@]}"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "SUCCESS" "Tests completed successfully in ${duration}s"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log "ERROR" "Tests failed after ${duration}s"
        fi
    fi
}

# Function to analyze monitoring results
analyze_monitoring_results() {
    if [ ! -f "$MONITORING_DATA_FILE" ]; then
        log "WARNING" "No monitoring data found at $MONITORING_DATA_FILE"
        return
    fi
    
    log "INFO" "Analyzing monitoring results..."
    
    # Use jq to analyze the JSON data if available
    if command -v jq >/dev/null 2>&1; then
        local total_snapshots=$(jq '.snapshots | length' "$MONITORING_DATA_FILE" 2>/dev/null || echo "0")
        local total_hanging=$(jq '.callStackSummary.summary.totalHanging' "$MONITORING_DATA_FILE" 2>/dev/null || echo "0")
        local total_completed=$(jq '.callStackSummary.summary.totalCompleted' "$MONITORING_DATA_FILE" 2>/dev/null || echo "0")
        
        log "INFO" "Monitoring Analysis:"
        log "INFO" "  Total Snapshots: $total_snapshots"
        log "INFO" "  Total Completed Calls: $total_completed"
        log "INFO" "  Total Hanging Calls: $total_hanging"
        
        if [ "$total_hanging" -gt 0 ]; then
            log "WARNING" "Found $total_hanging hanging calls during test execution"
            
            # Extract hanging call details
            jq -r '.callStackSummary.hanging[] | "  - \(.functionName) (\(.duration)ms) at \(.fileName):\(.lineNumber)"' "$MONITORING_DATA_FILE" 2>/dev/null || true
        fi
    else
        log "INFO" "Install jq for detailed JSON analysis"
        log "INFO" "Monitoring data available at: $MONITORING_DATA_FILE"
    fi
    
    if [ -f "$MONITORING_REPORT_FILE" ]; then
        log "INFO" "Detailed report available at: $MONITORING_REPORT_FILE"
    fi
}

# Function to show monitoring status
show_monitoring_status() {
    log "INFO" "Test Monitoring Configuration:"
    log "INFO" "  Output Directory: $MONITORING_OUTPUT_DIR"
    log "INFO" "  Test Timeout: ${TEST_TIMEOUT}ms"
    log "INFO" "  Snapshot Interval: ${SNAPSHOT_INTERVAL}ms"
    log "INFO" "  Hanging Threshold: ${HANGING_THRESHOLD}ms"
    log "INFO" "  Verbose Mode: $VERBOSE"
    log "INFO" "  Monitoring Enabled: $([ "$NO_MONITORING" = true ] && echo "false" || echo "true")"
}

# Main execution
main() {
    show_monitoring_status
    
    if [ "$MONITOR_ONLY" = true ]; then
        log "INFO" "Monitor-only mode - analyzing existing results"
        analyze_monitoring_results
        exit 0
    fi
    
    # Set default test arguments if none provided
    if [ ${#BUN_TEST_ARGS[@]} -eq 0 ]; then
        BUN_TEST_ARGS=("tests/")
    fi
    
    if [ "$NO_MONITORING" = true ]; then
        run_tests_without_monitoring "${BUN_TEST_ARGS[@]}"
    else
        run_tests_with_monitoring "${BUN_TEST_ARGS[@]}"
        analyze_monitoring_results
    fi
}

# Run main function
main "$@" 