#!/bin/bash

# Reset timestamp-only changes script
# This script detects and optionally resets changes that only modify timestamps

set -e

echo "🕐 Checking for timestamp-only changes..."

# Run the timestamp filter
if bun run src/cli/timestamp-filter.ts --check; then
    echo ""
    echo "⚠️  Only timestamp changes detected!"
    echo ""
    echo "Options:"
    echo "  1. Reset changes (git reset HEAD~1)"
    echo "  2. Continue with commit"
    echo "  3. Show diff"
    echo "  4. Cancel"
    echo ""
    read -p "Choose an option (1-4): " choice
    
    case $choice in
        1)
            echo "🔄 Resetting timestamp-only changes..."
            git reset HEAD~1
            echo "✅ Changes reset successfully"
            ;;
        2)
            echo "✅ Continuing with commit..."
            exit 0
            ;;
        3)
            echo "📋 Showing diff:"
            git diff HEAD~1
            ;;
        4)
            echo "❌ Cancelled"
            exit 1
            ;;
        *)
            echo "❌ Invalid option"
            exit 1
            ;;
    esac
else
    echo "✅ No timestamp-only changes detected"
fi 