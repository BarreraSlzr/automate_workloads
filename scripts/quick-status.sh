#!/bin/bash

# Quick Status Check Script
# 
# Provides a quick overview of repository health and progress

set -e

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
    cat << EOF
Usage: $0 <owner> <repo>

Quick status check for repository health and progress.

EXAMPLES:
    $0 emmanuelbarrera automate_workloads

EOF
}

# Parse arguments
if [[ $# -ne 2 ]]; then
    print_status $RED "Error: Owner and repo are required"
    show_usage
    exit 1
fi

OWNER="$1"
REPO="$2"

print_status $PURPLE "🚀 Quick Status Check for $OWNER/$REPO"
echo ""

# Check dependencies
print_status $BLUE "🔍 Checking dependencies..."
if ! command -v gh &> /dev/null; then
    print_status $RED "❌ Missing: gh (GitHub CLI)"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    print_status $RED "❌ Missing: bun"
    exit 1
fi

print_status $GREEN "✅ Dependencies available"
echo ""

# Quick health check
print_status $BLUE "🏥 Health Check..."
if bun run repo:analyze "$OWNER" "$REPO" --output temp-analysis.json 2>/dev/null; then
    HEALTH_SCORE=$(jq -r '.health.score // 0' temp-analysis.json 2>/dev/null || echo "0")
    print_status $GREEN "✅ Health Score: $HEALTH_SCORE/100"
    rm -f temp-analysis.json
else
    print_status $YELLOW "⚠️  Could not analyze health"
    HEALTH_SCORE="N/A"
fi
echo ""

# Action plan progress
print_status $BLUE "📋 Action Plan Progress..."
ACTION_PLANS=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json state 2>/dev/null | jq 'length' || echo "0")
COMPLETED_PLANS=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "CLOSED")] | length' || echo "0")
OPEN_PLANS=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "OPEN")] | length' || echo "0")

if [[ "$ACTION_PLANS" -gt 0 ]]; then
    COMPLETION_RATE=$(echo "scale=1; $COMPLETED_PLANS * 100 / $ACTION_PLANS" | bc -l 2>/dev/null || echo "0")
    print_status $GREEN "✅ Action Plans: $COMPLETED_PLANS/$ACTION_PLANS completed ($COMPLETION_RATE%)"
else
    print_status $YELLOW "⚠️  No action plans found"
fi
echo ""

# Automation progress
print_status $BLUE "🤖 Automation Progress..."
AUTOMATION_ISSUES=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json state 2>/dev/null | jq 'length' || echo "0")
COMPLETED_AUTOMATION=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "CLOSED")] | length' || echo "0")
OPEN_AUTOMATION=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "OPEN")] | length' || echo "0")

if [[ "$AUTOMATION_ISSUES" -gt 0 ]]; then
    AUTOMATION_RATE=$(echo "scale=1; $COMPLETED_AUTOMATION * 100 / $AUTOMATION_ISSUES" | bc -l 2>/dev/null || echo "0")
    print_status $GREEN "✅ Automation: $COMPLETED_AUTOMATION/$AUTOMATION_ISSUES completed ($AUTOMATION_RATE%)"
else
    print_status $YELLOW "⚠️  No automation issues found"
fi
echo ""

# Overall status
print_status $PURPLE "📊 Overall Status:"
if [[ "$HEALTH_SCORE" != "N/A" ]]; then
    if (( $(echo "$HEALTH_SCORE >= 80" | bc -l 2>/dev/null || echo "0") )); then
        print_status $GREEN "   🟢 Repository is healthy"
    elif (( $(echo "$HEALTH_SCORE >= 60" | bc -l 2>/dev/null || echo "0") )); then
        print_status $YELLOW "   🟡 Repository needs attention"
    else
        print_status $RED "   🔴 Repository needs immediate action"
    fi
else
    print_status $YELLOW "   ⚠️  Health status unknown"
fi

if [[ "$ACTION_PLANS" -gt 0 ]]; then
    if (( $(echo "$COMPLETION_RATE >= 70" | bc -l 2>/dev/null || echo "0") )); then
        print_status $GREEN "   📋 Action plans progressing well"
    elif (( $(echo "$COMPLETION_RATE >= 40" | bc -l 2>/dev/null || echo "0") )); then
        print_status $YELLOW "   📋 Action plans need attention"
    else
        print_status $RED "   📋 Action plans need immediate focus"
    fi
fi

if [[ "$AUTOMATION_ISSUES" -gt 0 ]]; then
    if (( $(echo "$AUTOMATION_RATE >= 50" | bc -l 2>/dev/null || echo "0") )); then
        print_status $GREEN "   🤖 Automation progressing well"
    elif (( $(echo "$AUTOMATION_RATE >= 20" | bc -l 2>/dev/null || echo "0") )); then
        print_status $YELLOW "   🤖 Automation needs attention"
    else
        print_status $RED "   🤖 Automation needs immediate focus"
    fi
fi
echo ""

print_status $CYAN "💡 Next Steps:"
if [[ "$HEALTH_SCORE" != "N/A" ]] && (( $(echo "$HEALTH_SCORE < 70" | bc -l 2>/dev/null || echo "0") )); then
    echo "   - Run full repository orchestration"
elif [[ "$ACTION_PLANS" -gt 0 ]] && (( $(echo "$COMPLETION_RATE < 40" | bc -l 2>/dev/null || echo "0") )); then
    echo "   - Review and prioritize action plans"
elif [[ "$AUTOMATION_ISSUES" -gt 0 ]] && (( $(echo "$AUTOMATION_RATE < 30" | bc -l 2>/dev/null || echo "0") )); then
    echo "   - Focus on automation improvements"
else
    echo "   - Continue current practices"
    echo "   - Monitor progress regularly"
fi
echo ""

print_status $GREEN "✅ Quick status check complete!"