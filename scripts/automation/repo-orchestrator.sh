#!/bin/bash

# Repository Workflow Orchestrator Wrapper Script
# 
# Convenient wrapper for targeting any GitHub repository with LLM-powered automation
# Usage: ./scripts/repo-orchestrator.sh <owner> <repo> [options]

set -e

OWNER="$1"
REPO="$2"
WORKFLOW="${3:-full}"
BRANCH="${4:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "🎯 Repository Workflow Orchestrator"
    echo ""
    echo "Usage: $0 <owner> <repo> [workflow] [branch] [options]"
    echo ""
    echo "Arguments:"
    echo "  owner     Repository owner (e.g., 'microsoft')"
    echo "  repo      Repository name (e.g., 'vscode')"
    echo "  workflow  Workflow type (default: full)"
    echo "            Options: analyze, plan, execute, monitor, full"
    echo "  branch    Target branch (default: main)"
    echo ""
    echo "Options:"
    echo "  --create-issues    Create automation issues (default: true)"
    echo "  --no-create-issues Skip creating automation issues"
    echo "  --create-prs       Create automation PRs"
    echo "  --auto-merge       Enable auto-merge for PRs"
    echo "  --no-notifications Disable notifications"
    echo "  --output <file>    Save results to file"
    echo "  --context <json>   Additional context (JSON string)"
    echo ""
    echo "Examples:"
    echo "  $0 microsoft vscode"
    echo "  $0 facebook react analyze"
    echo "  $0 google tensorflow plan main --create-issues"
    echo "  $0 openai openai-cookbook full main --output results.json"
    echo ""
    echo "Workflow Types:"
    echo "  analyze   - Repository analysis and health check"
    echo "  plan      - LLM-powered planning and recommendations"
    echo "  execute   - Execute automation workflows"
    echo "  monitor   - Monitor and optimize workflows"
    echo "  full      - Complete orchestration (analyze + plan + execute + monitor)"
}

# Check if required arguments are provided
if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
    print_status $RED "❌ Error: Owner and repository are required"
    echo ""
    show_usage
    exit 1
fi

# Validate workflow type
valid_workflows=("analyze" "plan" "execute" "monitor" "full")
if [[ ! " ${valid_workflows[@]} " =~ " ${WORKFLOW} " ]]; then
    print_status $RED "❌ Error: Invalid workflow type '$WORKFLOW'"
    echo "Valid workflows: ${valid_workflows[*]}"
    exit 1
fi

# Parse additional options
CREATE_ISSUES="true"
CREATE_PRS="false"
AUTO_MERGE="false"
NOTIFICATIONS="true"
OUTPUT_FILE=""
CONTEXT=""

# Shift the first 4 arguments (owner, repo, workflow, branch)
shift 4

# Parse remaining options
while [[ $# -gt 0 ]]; do
    case $1 in
        --create-issues)
            CREATE_ISSUES="true"
            shift
            ;;
        --no-create-issues)
            CREATE_ISSUES="false"
            shift
            ;;
        --create-prs)
            CREATE_PRS="true"
            shift
            ;;
        --auto-merge)
            AUTO_MERGE="true"
            shift
            ;;
        --no-notifications)
            NOTIFICATIONS="false"
            shift
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --context)
            CONTEXT="$2"
            shift 2
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_status $RED "❌ Error: Unknown option $1"
            show_usage
            exit 1
            ;;
    esac
done

# Build the command
CMD="bun run repo:orchestrate $OWNER $REPO"

# Add workflow-specific command
if [ "$WORKFLOW" = "analyze" ]; then
    CMD="bun run repo:analyze $OWNER $REPO"
else
    CMD="$CMD --workflow $WORKFLOW"
fi

# Add branch
if [ "$WORKFLOW" != "analyze" ]; then
    CMD="$CMD --branch $BRANCH"
fi

# Add options
if [ "$CREATE_ISSUES" = "false" ]; then
    CMD="$CMD --no-create-issues"
fi

if [ "$CREATE_PRS" = "true" ]; then
    CMD="$CMD --create-prs"
fi

if [ "$AUTO_MERGE" = "true" ]; then
    CMD="$CMD --auto-merge"
fi

if [ "$NOTIFICATIONS" = "false" ]; then
    CMD="$CMD --no-notifications"
fi

if [ -n "$OUTPUT_FILE" ]; then
    CMD="$CMD --output $OUTPUT_FILE"
fi

if [ -n "$CONTEXT" ]; then
    CMD="$CMD --context '$CONTEXT'"
fi

# Display orchestration info
print_status $CYAN "🎯 Repository Workflow Orchestrator"
echo ""
print_status $BLUE "Target Repository: $OWNER/$REPO"
print_status $BLUE "Workflow Type: $WORKFLOW"
print_status $BLUE "Target Branch: $BRANCH"
echo ""
print_status $BLUE "Options:"
print_status $BLUE "  Create Issues: $CREATE_ISSUES"
print_status $BLUE "  Create PRs: $CREATE_PRS"
print_status $BLUE "  Auto Merge: $AUTO_MERGE"
print_status $BLUE "  Notifications: $NOTIFICATIONS"
if [ -n "$OUTPUT_FILE" ]; then
    print_status $BLUE "  Output File: $OUTPUT_FILE"
fi
if [ -n "$CONTEXT" ]; then
    print_status $BLUE "  Context: $CONTEXT"
fi
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    print_status $YELLOW "⚠️  Warning: GitHub CLI not authenticated"
    print_status $YELLOW "   Run 'gh auth login' to authenticate"
    echo ""
fi

# Confirm execution
print_status $PURPLE "🚀 Ready to orchestrate repository workflow"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status $YELLOW "❌ Orchestration cancelled"
    exit 0
fi

echo ""
print_status $GREEN "🚀 Starting repository orchestration..."
echo ""

# Execute the command
print_status $CYAN "Command: $CMD"
echo ""

eval $CMD

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    print_status $GREEN "✅ Repository orchestration completed successfully!"
    
    # Fossilize GitHub issues after orchestration
    print_status $CYAN "🦴 Fossilizing GitHub issues..."
    bun run mcp issues fossilize

    if [ -n "$OUTPUT_FILE" ] && [ -f "$OUTPUT_FILE" ]; then
        print_status $GREEN "📄 Results saved to: $OUTPUT_FILE"
    fi
    
    echo ""
    print_status $CYAN "🎯 Next Steps:"
    print_status $CYAN "  1. Review the generated plan and recommendations"
    print_status $CYAN "  2. Implement the suggested automation improvements"
    print_status $CYAN "  3. Monitor the repository health and metrics"
    print_status $CYAN "  4. Run orchestration again to track progress"
    
else
    echo ""
    print_status $RED "❌ Repository orchestration failed"
    print_status $RED "   Check the error messages above for details"
    exit 1
fi 