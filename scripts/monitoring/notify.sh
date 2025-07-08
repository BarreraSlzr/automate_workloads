#!/bin/bash

# Simple notification script for memory monitor
# Uses macOS notification system

send_notification() {
    local title="$1"
    local message="$2"
    
    # Use macOS notification system
    if command -v osascript >/dev/null 2>&1; then
        osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null || true
    fi
    
    # Also log to console
    echo "[NOTIFY] $title: $message" >&2
}

# Main execution
if [ $# -ge 2 ]; then
    send_notification "$1" "$2"
else
    echo "Usage: $0 <title> <message>"
    exit 1
fi 