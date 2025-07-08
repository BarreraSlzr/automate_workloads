#!/bin/bash
set -e

# Safe bun test runner with memory monitoring
# Protects your Mac's 8GB RAM from runaway processes

# Configuration
MEMORY_THRESHOLD=${BUN_TEST_MEMORY_THRESHOLD:-800}
CHECK_INTERVAL=${BUN_TEST_CHECK_INTERVAL:-3}
LOG_FILE=${BUN_TEST_LOG_FILE:-"fossils/bun-test-memory.log"}
VERBOSE=${BUN_TEST_VERBOSE:-false}

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[BUN_TEST_SAFE]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[BUN_TEST_SAFE]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[BUN_TEST_SAFE]${NC} $1"
}

log_error() {
    echo -e "${RED}[BUN_TEST_SAFE]${NC} $1"
}

# Show usage
show_usage() {
    cat <<EOF
Safe Bun Test Runner with Memory Monitoring

Usage: $0 [OPTIONS] [BUN_TEST_ARGS...]

Options:
  -t, --threshold MB     Memory threshold in MB (default: $MEMORY_THRESHOLD)
  -i, --interval SEC     Check interval in seconds (default: $CHECK_INTERVAL)
  -l, --log FILE         Log file path (default: $LOG_FILE)
  -v, --verbose          Verbose output
  --dry-run              Show what would be run without executing
  -h, --help             Show this help

Environment Variables:
  BUN_TEST_MEMORY_THRESHOLD  Memory threshold in MB
  BUN_TEST_CHECK_INTERVAL    Check interval in seconds
  BUN_TEST_LOG_FILE          Log file path
  BUN_TEST_VERBOSE           Verbose output (true/false)

Examples:
  $0
  $0 --watch
  $0 -t 1000 --verbose
  $0 --dry-run

EOF
}

# Parse arguments
parse_args() {
    local bun_args=()
    local dry_run=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--threshold)
                MEMORY_THRESHOLD="$2"
                shift 2
                ;;
            -i|--interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            -l|--log)
                LOG_FILE="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            --)
                shift
                bun_args+=("$@")
                break
                ;;
            -*)
                # Unknown option, pass to bun test
                bun_args+=("$1")
                shift
                ;;
            *)
                # Regular argument, pass to bun test
                bun_args+=("$1")
                shift
                ;;
        esac
    done
    
    if [ "$dry_run" = true ]; then
        log_info "Dry run - would execute:"
        log_info "  Memory threshold: ${MEMORY_THRESHOLD}MB"
        log_info "  Check interval: ${CHECK_INTERVAL}s"
        log_info "  Log file: $LOG_FILE"
        log_info "  Verbose: $VERBOSE"
        log_info "  Bun test args: ${bun_args[*]}"
        log_info "  Full command: scripts/monitoring/memory-monitor.sh -t $MEMORY_THRESHOLD -i $CHECK_INTERVAL -l $LOG_FILE ${VERBOSE:+-v} bun test ${bun_args[*]}"
        exit 0
    fi
    
    # Store bun arguments
    BUN_ARGS=("${bun_args[@]}")
}

# Check if memory monitor script exists
check_memory_monitor() {
    if [ ! -f "scripts/monitoring/memory-monitor.sh" ]; then
        log_error "Memory monitor script not found: scripts/monitoring/memory-monitor.sh"
        exit 1
    fi
    
    if [ ! -x "scripts/monitoring/memory-monitor.sh" ]; then
        log_error "Memory monitor script is not executable"
        exit 1
    fi
}

# Check system memory before starting
check_system_memory() {
    if command -v vm_stat >/dev/null 2>&1; then
        local vmstat_output
        vmstat_output=$(vm_stat 2>/dev/null || echo "")
        
        if [ -n "$vmstat_output" ]; then
            local pages_free
            pages_free=$(echo "$vmstat_output" | grep "Pages free" | awk '{print $3}' | tr -d '.')
            
            # Calculate free memory in MB (pages are 4KB on macOS)
            local free_mb=$(( pages_free * 4096 / 1024 / 1024 ))
            
            log_info "System free memory: ${free_mb}MB"
            
            if [ "$free_mb" -lt "$MEMORY_THRESHOLD" ]; then
                log_warn "Low system memory: ${free_mb}MB free (threshold: ${MEMORY_THRESHOLD}MB)"
                log_warn "Consider closing other applications before running tests"
            fi
        fi
    fi
}

# Main execution
main() {
    local BUN_ARGS=()
    
    parse_args "$@"
    
    log_info "Starting safe bun test with memory monitoring"
    log_info "Configuration:"
    log_info "  Memory threshold: ${MEMORY_THRESHOLD}MB"
    log_info "  Check interval: ${CHECK_INTERVAL}s"
    log_info "  Log file: $LOG_FILE"
    log_info "  Verbose: $VERBOSE"
    log_info "  Bun test args: ${BUN_ARGS[*]}"
    
    # Check dependencies
    check_memory_monitor
    
    # Check system memory
    check_system_memory
    
    # Build memory monitor command
    local monitor_cmd=("scripts/monitoring/memory-monitor.sh")
    monitor_cmd+=("-t" "$MEMORY_THRESHOLD")
    monitor_cmd+=("-i" "$CHECK_INTERVAL")
    monitor_cmd+=("-l" "$LOG_FILE")
    
    if [ "$VERBOSE" = true ]; then
        monitor_cmd+=("-v")
    fi
    
    monitor_cmd+=("bun" "test")
    monitor_cmd+=("${BUN_ARGS[@]}")
    
    log_info "Executing: ${monitor_cmd[*]}"
    
    # Run with memory monitoring
    if "${monitor_cmd[@]}"; then
        log_success "Bun test completed successfully"
        exit 0
    else
        log_error "Bun test failed or was killed due to memory usage"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 