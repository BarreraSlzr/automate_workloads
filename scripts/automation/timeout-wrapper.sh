#!/bin/bash
# Timeout Wrapper Script
# Provides timeout protection for shell script execution

set -e

# Default timeout values
DEFAULT_QUICK_TIMEOUT=5
DEFAULT_STANDARD_TIMEOUT=30
DEFAULT_LONG_TIMEOUT=120
DEFAULT_VERY_LONG_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

function show_usage() {
    echo "Usage: $0 [OPTIONS] <command> [args...]"
    echo ""
    echo "Options:"
    echo "  -t, --timeout <seconds>    Set custom timeout in seconds"
    echo "  -q, --quick               Use quick timeout (5s)"
    echo "  -s, --standard            Use standard timeout (30s)"
    echo "  -l, --long                Use long timeout (2m)"
    echo "  -v, --very-long           Use very long timeout (5m)"
    echo "  -k, --kill-signal <sig>   Signal to send on timeout (default: SIGTERM)"
    echo "  -r, --retry <count>       Number of retries on timeout"
    echo "  -d, --delay <seconds>     Delay between retries"
    echo "  -v, --verbose             Enable verbose output"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Timeout presets:"
    echo "  quick:     5 seconds"
    echo "  standard:  30 seconds"
    echo "  long:      2 minutes"
    echo "  very-long: 5 minutes"
    echo ""
    echo "Examples:"
    echo "  $0 -s 'sleep 10'                    # Run with 30s timeout"
    echo "  $0 -t 60 'long-running-command'     # Run with 60s timeout"
    echo "  $0 -r 3 -d 2 'unreliable-command'   # Retry 3 times with 2s delay"
}

function execute_with_timeout() {
    local timeout=$1
    local command="$2"
    local kill_signal=${3:-SIGTERM}
    local verbose=$4
    
    if [[ "$verbose" == "true" ]]; then
        print_status $BLUE "⏰ Executing with ${timeout}s timeout: $command"
    fi
    
    # Execute command with timeout
    timeout "$timeout" bash -c "$command" &
    local pid=$!
    
    # Wait for the command to complete
    wait $pid 2>/dev/null
    local exit_code=$?
    
    if [[ $exit_code -eq 124 ]]; then
        # Timeout occurred
        if [[ "$verbose" == "true" ]]; then
            print_status $RED "⏰ Command timed out after ${timeout}s"
        fi
        return 124
    elif [[ $exit_code -eq 0 ]]; then
        if [[ "$verbose" == "true" ]]; then
            print_status $GREEN "✅ Command completed successfully"
        fi
        return 0
    else
        if [[ "$verbose" == "true" ]]; then
            print_status $YELLOW "⚠️ Command failed with exit code $exit_code"
        fi
        return $exit_code
    fi
}

function retry_with_timeout() {
    local timeout=$1
    local command="$2"
    local max_retries=${3:-1}
    local delay=${4:-1}
    local kill_signal=${5:-SIGTERM}
    local verbose=$6
    
    local attempt=1
    local last_exit_code=0
    
    while [[ $attempt -le $max_retries ]]; do
        if [[ "$verbose" == "true" ]]; then
            print_status $BLUE "🔄 Attempt $attempt/$max_retries"
        fi
        
        execute_with_timeout "$timeout" "$command" "$kill_signal" "$verbose"
        last_exit_code=$?
        
        if [[ $last_exit_code -eq 0 ]]; then
            return 0
        fi
        
        if [[ $attempt -lt $max_retries ]]; then
            if [[ "$verbose" == "true" ]]; then
                print_status $YELLOW "⏳ Waiting ${delay}s before retry..."
            fi
            sleep "$delay"
        fi
        
        ((attempt++))
    done
    
    return $last_exit_code
}

# Parse command line arguments
TIMEOUT=""
KILL_SIGNAL="SIGTERM"
MAX_RETRIES=1
RETRY_DELAY=1
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -q|--quick)
            TIMEOUT=$DEFAULT_QUICK_TIMEOUT
            shift
            ;;
        -s|--standard)
            TIMEOUT=$DEFAULT_STANDARD_TIMEOUT
            shift
            ;;
        -l|--long)
            TIMEOUT=$DEFAULT_LONG_TIMEOUT
            shift
            ;;
        -v|--very-long)
            TIMEOUT=$DEFAULT_VERY_LONG_TIMEOUT
            shift
            ;;
        -k|--kill-signal)
            KILL_SIGNAL="$2"
            shift 2
            ;;
        -r|--retry)
            MAX_RETRIES="$2"
            shift 2
            ;;
        -d|--delay)
            RETRY_DELAY="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
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
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# Check if command is provided
if [[ $# -eq 0 ]]; then
    echo "Error: No command specified"
    show_usage
    exit 1
fi

# Set default timeout if not specified
if [[ -z "$TIMEOUT" ]]; then
    TIMEOUT=$DEFAULT_STANDARD_TIMEOUT
fi

# Build the command from remaining arguments
COMMAND="$*"

# Execute with retry logic
if [[ $MAX_RETRIES -gt 1 ]]; then
    retry_with_timeout "$TIMEOUT" "$COMMAND" "$MAX_RETRIES" "$RETRY_DELAY" "$KILL_SIGNAL" "$VERBOSE"
    exit $?
else
    execute_with_timeout "$TIMEOUT" "$COMMAND" "$KILL_SIGNAL" "$VERBOSE"
    exit $?
fi 