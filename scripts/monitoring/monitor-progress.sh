#!/bin/bash

# Monitor Progress Script
# Monitors progress of repository development and dependencies
# Usage: ./scripts/monitor-progress.sh <owner> <repo>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
OWNER=${1:-"default-owner"}
REPO=${2:-"default-repo"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}Progress Monitoring${NC}"
echo "=================================="
echo "Owner: $OWNER"
echo "Repository: $REPO"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log status
log_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️${NC} $message"
            ;;
        "error")
            echo -e "${RED}❌${NC} $message"
            ;;
        "info")
            echo -e "${BLUE}ℹ️${NC} $message"
            ;;
    esac
}

# Check dependencies
echo -e "${BLUE}Checking dependencies${NC}"
echo "------------------------"

# Check for required tools
if command_exists "bun"; then
    log_status "success" "Bun is available"
    BUN_VERSION=$(bun --version 2>/dev/null || echo "unknown")
    echo "  Version: $BUN_VERSION"
else
    log_status "error" "Bun is not available"
fi

if command_exists "gh"; then
    log_status "success" "GitHub CLI is available"
    GH_VERSION=$(gh --version 2>/dev/null | head -n1 || echo "unknown")
    echo "  Version: $GH_VERSION"
else
    log_status "warning" "GitHub CLI is not available"
fi

if command_exists "jq"; then
    log_status "success" "jq is available"
    JQ_VERSION=$(jq --version 2>/dev/null || echo "unknown")
    echo "  Version: $JQ_VERSION"
else
    log_status "warning" "jq is not available"
fi

echo ""

# Check project structure
echo -e "${BLUE}Checking project structure${NC}"
echo "----------------------------"

if [ -f "$PROJECT_ROOT/package.json" ]; then
    log_status "success" "package.json found"
else
    log_status "error" "package.json not found"
fi

if [ -d "$PROJECT_ROOT/src" ]; then
    log_status "success" "src directory found"
else
    log_status "error" "src directory not found"
fi

if [ -d "$PROJECT_ROOT/tests" ]; then
    log_status "success" "tests directory found"
else
    log_status "warning" "tests directory not found"
fi

if [ -d "$PROJECT_ROOT/fossils" ]; then
    log_status "success" "fossils directory found"
else
    log_status "warning" "fossils directory not found"
fi

echo ""

# Check for recent activity
echo -e "${BLUE}Checking recent activity${NC}"
echo "---------------------------"

# Check git status if in a git repository
if [ -d "$PROJECT_ROOT/.git" ]; then
    log_status "info" "Git repository detected"
    
    # Get recent commits
    RECENT_COMMITS=$(git log --oneline -5 2>/dev/null | wc -l)
    if [ "$RECENT_COMMITS" -gt 0 ]; then
        log_status "success" "Recent commits found ($RECENT_COMMITS in last 5)"
    else
        log_status "warning" "No recent commits found"
    fi
    
    # Check for uncommitted changes
    if git diff --quiet 2>/dev/null; then
        log_status "success" "No uncommitted changes"
    else
        log_status "warning" "Uncommitted changes detected"
    fi
else
    log_status "info" "Not a git repository"
fi

echo ""

# Check test status
echo -e "${BLUE}Checking test status${NC}"
echo "----------------------"

if command_exists "bun" && [ -f "$PROJECT_ROOT/package.json" ]; then
    # Try to run tests in dry-run mode
    cd "$PROJECT_ROOT"
    if bun test --dry-run >/dev/null 2>&1; then
        log_status "success" "Tests can be executed"
    else
        log_status "warning" "Tests may have issues"
    fi
else
    log_status "warning" "Cannot check test status (bun not available)"
fi

echo ""

# Summary
echo -e "${BLUE}Summary${NC}"
echo "-------"
echo "Progress monitoring completed for $OWNER/$REPO"
echo "Check the output above for any issues that need attention."
echo ""
echo "For more detailed analysis, run:"
echo "  bun run analysis:orchestrate"
echo "  bun run analysis:reports-only"

exit 0 