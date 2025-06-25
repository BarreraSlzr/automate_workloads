#!/bin/bash

# Simple Progress Monitoring Script
# 
# A simplified version that works reliably

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

# Parse arguments
if [[ $# -lt 2 ]]; then
    print_status $RED "Usage: $0 <owner> <repo> [mode]"
    exit 1
fi

OWNER="$1"
REPO="$2"
MODE="${3:-comprehensive}"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
REPORTS_DIR=".orchestration-reports"
TRENDS_DIR="$REPORTS_DIR/trends"

print_status $PURPLE "🚀 Simple Progress Monitoring for $OWNER/$REPO"
echo ""

# Setup
mkdir -p "$REPORTS_DIR"
mkdir -p "$TRENDS_DIR"

# Step 1: Current state analysis
print_status $BLUE "🔍 Step 1: Analyzing current state..."
if bun run repo:analyze "$OWNER" "$REPO" --output "$REPORTS_DIR/current-analysis-$TIMESTAMP.json" 2>/dev/null; then
    HEALTH_SCORE=$(jq -r '.health.score // 0' "$REPORTS_DIR/current-analysis-$TIMESTAMP.json" 2>/dev/null || echo "0")
    print_status $GREEN "✅ Health Score: $HEALTH_SCORE/100"
else
    print_status $YELLOW "⚠️  Could not analyze current state"
    HEALTH_SCORE="0"
fi
echo ""

# Step 2: Action plan progress
print_status $BLUE "📈 Step 2: Tracking action plan progress..."
ACTION_PLANS=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json state 2>/dev/null | jq 'length' || echo "0")
COMPLETED_PLANS=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "CLOSED")] | length' || echo "0")
OPEN_PLANS=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "OPEN")] | length' || echo "0")

if [[ "$ACTION_PLANS" -gt 0 ]]; then
    COMPLETION_RATE=$(echo "scale=1; $COMPLETED_PLANS * 100 / $ACTION_PLANS" | bc -l 2>/dev/null || echo "0")
    print_status $GREEN "✅ Action Plans: $COMPLETED_PLANS/$ACTION_PLANS completed ($COMPLETION_RATE%)"
else
    print_status $YELLOW "⚠️  No action plans found"
    COMPLETION_RATE="0"
fi
echo ""

# Step 3: Automation progress
print_status $BLUE "🤖 Step 3: Tracking automation progress..."
AUTOMATION_ISSUES=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json state 2>/dev/null | jq 'length' || echo "0")
COMPLETED_AUTOMATION=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "CLOSED")] | length' || echo "0")
OPEN_AUTOMATION=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json state 2>/dev/null | jq '[.[] | select(.state == "OPEN")] | length' || echo "0")

if [[ "$AUTOMATION_ISSUES" -gt 0 ]]; then
    AUTOMATION_RATE=$(echo "scale=1; $COMPLETED_AUTOMATION * 100 / $AUTOMATION_ISSUES" | bc -l 2>/dev/null || echo "0")
    print_status $GREEN "✅ Automation: $COMPLETED_AUTOMATION/$AUTOMATION_ISSUES completed ($AUTOMATION_RATE%)"
else
    print_status $YELLOW "⚠️  No automation issues found"
    AUTOMATION_RATE="0"
fi
echo ""

# Step 4: Generate recommendations
print_status $BLUE "🎯 Step 4: Generating recommendations..."
RECOMMENDATIONS=()

if (( $(echo "$HEALTH_SCORE < 80" | bc -l 2>/dev/null || echo "0") )); then
    RECOMMENDATIONS+=("⚠️ Health score below threshold (80) - Consider running full orchestration")
fi

if (( $(echo "$HEALTH_SCORE < 60" | bc -l 2>/dev/null || echo "0") )); then
    RECOMMENDATIONS+=("🚨 Health score critically low - Immediate action required")
fi

if [[ "$ACTION_PLANS" -gt 0 ]] && (( $(echo "$COMPLETION_RATE < 50" | bc -l 2>/dev/null || echo "0") )); then
    RECOMMENDATIONS+=("📋 Action plan completion rate low - Review and prioritize open plans")
fi

if [[ "$AUTOMATION_ISSUES" -gt 0 ]] && (( $(echo "$AUTOMATION_RATE < 30" | bc -l 2>/dev/null || echo "0") )); then
    RECOMMENDATIONS+=("🤖 Automation completion rate low - Focus on implementing automation improvements")
fi

if [[ ${#RECOMMENDATIONS[@]} -eq 0 ]]; then
    RECOMMENDATIONS+=("✅ Repository is in good health - Continue current practices")
fi

print_status $GREEN "✅ Recommendations generated"
echo ""

# Step 5: Generate report
print_status $BLUE "📋 Step 5: Generating report..."
cat > "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF
# 📊 Progress Tracking Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M UTC")
**Repository:** $OWNER/$REPO
**Mode:** $MODE

## 📈 Current Metrics

- **Health Score:** $HEALTH_SCORE/100
- **Action Plan Completion:** $COMPLETION_RATE%
- **Automation Completion:** $AUTOMATION_RATE%
- **Total Action Plans:** $ACTION_PLANS
- **Completed Action Plans:** $COMPLETED_PLANS
- **Open Action Plans:** $OPEN_PLANS
- **Total Automation Issues:** $AUTOMATION_ISSUES
- **Completed Automation Issues:** $COMPLETED_AUTOMATION
- **Open Automation Issues:** $OPEN_AUTOMATION

## 🎯 Recommendations

EOF

for rec in "${RECOMMENDATIONS[@]}"; do
    echo "- $rec" >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md"
done

cat >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF

## 📁 Generated Files

- \`current-analysis-$TIMESTAMP.json\` - Current repository analysis
- \`progress-report-$TIMESTAMP.md\` - This report

---
*Generated by Simple Progress Monitoring Script*
EOF

print_status $GREEN "✅ Report generated: $REPORTS_DIR/progress-report-$TIMESTAMP.md"
echo ""

# Step 6: Save for trends
cp "$REPORTS_DIR/current-analysis-$TIMESTAMP.json" "$TRENDS_DIR/state-$TIMESTAMP.json"
print_status $GREEN "✅ Current state saved for trend analysis"
echo ""

# Step 7: Summary
print_status $PURPLE "🎉 Progress monitoring completed successfully!"
echo ""
print_status $CYAN "📊 Summary:"
echo "   - Repository: $OWNER/$REPO"
echo "   - Health score: $HEALTH_SCORE/100"
echo "   - Action plan completion: $COMPLETION_RATE%"
echo "   - Automation completion: $AUTOMATION_RATE%"
echo "   - Mode: $MODE"
echo ""
print_status $CYAN "📋 Generated:"
echo "   - Progress report: $REPORTS_DIR/progress-report-$TIMESTAMP.md"
echo "   - Analysis data: $REPORTS_DIR/current-analysis-$TIMESTAMP.json"
echo "   - Trend data: $TRENDS_DIR/state-$TIMESTAMP.json"
echo ""
print_status $CYAN "🎯 Top Recommendation:"
echo "   ${RECOMMENDATIONS[0]}"
echo ""
print_status $GREEN "✅ Simple monitoring complete!"