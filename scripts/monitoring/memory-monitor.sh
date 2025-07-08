#!/bin/bash
set -e

# Memory Monitor for Process Trees
# Protects your Mac's 8GB RAM from runaway processes during bun test

# Configuration
THRESHOLD_MB=${MEMORY_THRESHOLD:-500}
CHECK_INTERVAL=${CHECK_INTERVAL:-2}
LOG_FILE=${LOG_FILE:-"fossils/memory-monitor.log"}
NOTIFY_SCRIPT=${NOTIFY_SCRIPT:-"scripts/monitoring/notify.sh"}
VERBOSE=${VERBOSE:-false}
KILL_ON_EXCEED=${KILL_ON_EXCEED:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[MEMORY_MONITOR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[MEMORY_MONITOR]${NC} $1"
}

log_error() {
    echo -e "${RED}[MEMORY_MONITOR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[MEMORY_MONITOR]${NC} $1"
}

# Check if we have required tools
check_dependencies() {
    local missing_tools=()
    
    for tool in ps kill setsid awk; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
}

# Get system memory info (macOS specific)
get_system_memory() {
    local vmstat_output
    vmstat_output=$(vm_stat 2>/dev/null || echo "")
    
    if [ -n "$vmstat_output" ]; then
        local pages_free pages_active pages_inactive pages_wired
        pages_free=$(echo "$vmstat_output" | grep "Pages free" | awk '{print $3}' | tr -d '.')
        pages_active=$(echo "$vmstat_output" | grep "Pages active" | awk '{print $3}' | tr -d '.')
        pages_inactive=$(echo "$vmstat_output" | grep "Pages inactive" | awk '{print $3}' | tr -d '.')
        pages_wired=$(echo "$vmstat_output" | grep "Pages wired down" | awk '{print $4}' | tr -d '.')
        
        # Calculate in MB (pages are 4KB on macOS)
        local page_size=4096
        local total_mb=$(( (pages_wired + pages_active + pages_inactive + pages_free) * page_size / 1024 / 1024 ))
        local free_mb=$(( pages_free * page_size / 1024 / 1024 ))
        local used_mb=$(( (pages_wired + pages_active) * page_size / 1024 / 1024 ))
        
        echo "total:${total_mb} free:${free_mb} used:${used_mb}"
    else
        echo "total:0 free:0 used:0"
    fi
}

# Get memory usage for a process group
get_process_group_memory() {
    local pgid=$1
    
    if [ -z "$pgid" ]; then
        echo "0"
        return
    fi
    
    # Get RSS (resident set size) for all processes in the group
    local total_kb
    total_kb=$(ps -o rss= -g "$pgid" 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    
    # Convert to MB
    echo $((total_kb / 1024))
}

# Get process details for a process group
get_process_details() {
    local pgid=$1
    
    if [ -z "$pgid" ]; then
        echo "[]"
        return
    fi
    
    # Get detailed process info
    ps -o pid,command,rss -g "$pgid" 2>/dev/null | tail -n +2 | awk '
    {
        pid=$1
        rss_kb=$NF
        $1=""
        $NF=""
        command=substr($0, 2)
        gsub(/^[ \t]+|[ \t]+$/, "", command)
        memory_mb=int(rss_kb/1024)
        printf "{\"pid\":%d,\"command\":\"%s\",\"memoryMB\":%d}\n", pid, command, memory_mb
    }' | paste -sd ',' - | sed 's/^/[/; s/$/]/'
}

# Log memory snapshot
log_snapshot() {
    local timestamp=$1
    local pgid=$2
    local memory_mb=$3
    local process_count=$4
    local process_details=$5
    
    if [ -n "$LOG_FILE" ]; then
        # Ensure log directory exists
        local log_dir
        log_dir=$(dirname "$LOG_FILE")
        mkdir -p "$log_dir"
        
        # Create JSON log entry
        local log_entry
        log_entry=$(cat <<EOF
{
  "timestamp": "$timestamp",
  "pgid": $pgid,
  "memoryMB": $memory_mb,
  "processCount": $process_count,
  "processes": $process_details,
  "thresholdMB": $THRESHOLD_MB
}
EOF
)
        echo "$log_entry" >> "$LOG_FILE"
    fi
}

# Send notification
send_notification() {
    local title=$1
    local message=$2
    
    if [ -n "$NOTIFY_SCRIPT" ] && [ -f "$NOTIFY_SCRIPT" ]; then
        "$NOTIFY_SCRIPT" "$title" "$message" 2>/dev/null || true
    fi
}

# Kill process group
kill_process_group() {
    local pgid=$1
    local memory_mb=$2
    
    if [ "$KILL_ON_EXCEED" != "true" ]; then
        log_warn "Memory limit exceeded but KILL_ON_EXCEED=false"
        return
    fi
    
    log_warn "KILLING process group $pgid at ${memory_mb}MB (threshold: ${THRESHOLD_MB}MB)"
    
    # Try graceful termination first
    kill -TERM "-$pgid" 2>/dev/null || true
    
    # Wait a bit, then force kill if still running
    sleep 2
    
    if kill -0 "$pgid" 2>/dev/null; then
        log_warn "Process group still running, force killing..."
        kill -KILL "-$pgid" 2>/dev/null || true
    fi
    
    # Send notification
    send_notification "Memory Monitor" "Killed process group $pgid at ${memory_mb}MB"
}

# Check if process is still running
is_process_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
}

# Monitor process tree
monitor_process_tree() {
    local pid=$1
    local pgid=$2
    local start_time=$3
    
    local snapshot_count=0
    local max_memory=0
    local total_memory=0
    
    log_info "Starting memory monitoring for PGID $pgid"
    
    while is_process_running "$pid"; do
        local memory_mb
        memory_mb=$(get_process_group_memory "$pgid")
        
        local process_details
        process_details=$(get_process_details "$pgid")
        
        local process_count
        process_count=$(ps -o pid= -g "$pgid" 2>/dev/null | wc -l | tr -d ' ')
        
        local timestamp
        timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        
        # Update statistics
        snapshot_count=$((snapshot_count + 1))
        total_memory=$((total_memory + memory_mb))
        if [ "$memory_mb" -gt "$max_memory" ]; then
            max_memory=$memory_mb
        fi
        
        # Log snapshot
        log_snapshot "$timestamp" "$pgid" "$memory_mb" "$process_count" "$process_details"
        
        if [ "$VERBOSE" = "true" ]; then
            log_info "PGID $pgid: ${memory_mb}MB (${process_count} processes)"
        fi
        
        # Check if we need to kill the process
        if [ "$memory_mb" -gt "$THRESHOLD_MB" ]; then
            kill_process_group "$pgid" "$memory_mb"
            return 1
        fi
        
        sleep "$CHECK_INTERVAL"
    done
    
    # Process completed normally
    local duration=$(( $(date +%s) - start_time ))
    local avg_memory=0
    if [ "$snapshot_count" -gt 0 ]; then
        avg_memory=$((total_memory / snapshot_count))
    fi
    
    log_success "Process completed successfully"
    log_info "Duration: ${duration}s"
    log_info "Max Memory: ${max_memory}MB"
    log_info "Avg Memory: ${avg_memory}MB"
    log_info "Snapshots: ${snapshot_count}"
    
    return 0
}

# Main function to run command with monitoring
run_with_monitoring() {
    local command="$1"
    shift
    local args=("$@")
    
    # Check dependencies
    check_dependencies
    
    # Get initial system memory
    local system_memory
    system_memory=$(get_system_memory)
    log_info "System memory: $system_memory"
    
    # Check available memory before starting
    local free_mb
    free_mb=$(echo "$system_memory" | grep -o 'free:[0-9]*' | cut -d: -f2)
    
    if [ "$free_mb" -lt "$THRESHOLD_MB" ]; then
        log_warn "Low system memory: ${free_mb}MB free (threshold: ${THRESHOLD_MB}MB)"
        send_notification "Memory Warning" "Low system memory before starting: ${free_mb}MB"
    fi
    
    # Start the command in a new session (process group)
    local start_time
    start_time=$(date +%s)
    
    log_info "Starting: $command ${args[*]}"
    
    # Use setsid to create new session
    setsid "$command" "${args[@]}" &
    local pid=$!
    local pgid=$pid
    
    log_info "Process started with PID $pid in PGID $pgid"
    
    # Monitor the process tree
    local exit_code=0
    if ! monitor_process_tree "$pid" "$pgid" "$start_time"; then
        exit_code=1
    fi
    
    # Wait for the process to finish
    wait "$pid" 2>/dev/null || true
    
    return $exit_code
}

# Show usage
show_usage() {
    cat <<EOF
Memory Monitor for Process Trees

Usage: $0 [OPTIONS] COMMAND [ARGS...]

Options:
  -t, --threshold MB     Memory threshold in MB (default: $THRESHOLD_MB)
  -i, --interval SEC     Check interval in seconds (default: $CHECK_INTERVAL)
  -l, --log FILE         Log file path (default: $LOG_FILE)
  -n, --notify SCRIPT    Notification script (default: $NOTIFY_SCRIPT)
  -v, --verbose          Verbose output
  --no-kill              Don't kill processes on threshold exceed
  -h, --help             Show this help

Environment Variables:
  MEMORY_THRESHOLD       Memory threshold in MB
  CHECK_INTERVAL         Check interval in seconds
  LOG_FILE               Log file path
  NOTIFY_SCRIPT          Notification script
  VERBOSE                Verbose output (true/false)
  KILL_ON_EXCEED         Kill on exceed (true/false)

Examples:
  $0 bun test
  $0 -t 1000 -i 5 bun test --watch
  $0 --no-kill bun run build

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--threshold)
                THRESHOLD_MB="$2"
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
            -n|--notify)
                NOTIFY_SCRIPT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --no-kill)
                KILL_ON_EXCEED=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            --)
                shift
                break
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                break
                ;;
        esac
    done
    
    if [ $# -eq 0 ]; then
        log_error "No command specified"
        show_usage
        exit 1
    fi
    
    # Store command and arguments
    COMMAND="$1"
    shift
    ARGS=("$@")
}

# Main execution
main() {
    local COMMAND
    local ARGS=()
    
    parse_args "$@"
    
    log_info "Memory Monitor Configuration:"
    log_info "  Threshold: ${THRESHOLD_MB}MB"
    log_info "  Check Interval: ${CHECK_INTERVAL}s"
    log_info "  Log File: $LOG_FILE"
    log_info "  Notify Script: $NOTIFY_SCRIPT"
    log_info "  Verbose: $VERBOSE"
    log_info "  Kill on Exceed: $KILL_ON_EXCEED"
    
    # Run the command with monitoring
    if run_with_monitoring "$COMMAND" "${ARGS[@]}"; then
        log_success "Command completed successfully"
        exit 0
    else
        log_error "Command failed or was killed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 