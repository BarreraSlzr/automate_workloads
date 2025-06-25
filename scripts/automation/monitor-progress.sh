#!/bin/bash

# Progress Monitoring and Tracking Script
# 
# This script monitors and tracks progress of action plans and repository health
# using the repository orchestrator. It can be run manually or scheduled.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_ROOT/.orchestration-reports"
TRENDS_DIR="$REPORTS_DIR/trends"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")

# Default values
TRACKING_MODE="comprehensive"
REPORT_TYPE="daily"
OWNER=""
REPO=""
OUTPUT_FILE=""
SKIP_TRENDS=false
SKIP_TRIGGER=false

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] <owner> <repo>

Monitor and track progress of action plans and repository health.

OPTIONS:
    -m, --mode MODE           Tracking mode (comprehensive|action-plan|health-only|automation-progress)
    -r, --report-type TYPE    Report type (daily|weekly|monthly|custom)
    -o, --output FILE         Output file for results (JSON)
    --no-trends              Skip trend analysis
    --no-trigger             Skip triggering next steps
    -h, --help               Show this help message

EXAMPLES:
    $0 barreraslzr automate_workloads
    $0 -m health-only -r weekly barreraslzr automate_workloads
    $0 --no-trends --no-trigger barreraslzr automate_workloads

EOF
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                TRACKING_MODE="$2"
                shift 2
                ;;
            -r|--report-type)
                REPORT_TYPE="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --no-trends)
                SKIP_TRENDS=true
                shift
                ;;
            --no-trigger)
                SKIP_TRIGGER=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                print_status $RED "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -z "$OWNER" ]]; then
                    OWNER="$1"
                elif [[ -z "$REPO" ]]; then
                    REPO="$1"
                else
                    print_status $RED "Too many arguments"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [[ -z "$OWNER" || -z "$REPO" ]]; then
        print_status $RED "Owner and repo are required"
        show_usage
        exit 1
    fi
}

# Function to check dependencies
check_dependencies() {
    print_status $BLUE "🔍 Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v gh &> /dev/null; then
        missing_deps+=("gh (GitHub CLI)")
    fi
    
    if ! command -v bun &> /dev/null; then
        missing_deps+=("bun")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_status $RED "❌ Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "   - $dep"
        done
        exit 1
    fi
    
    print_status $GREEN "✅ All dependencies available"
}

# Function to setup environment
setup_environment() {
    print_status $BLUE "🔧 Setting up environment..."
    
    # Create reports directory
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$TRENDS_DIR"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        print_status $YELLOW "📦 Installing dependencies..."
        bun install
    fi
    
    print_status $GREEN "✅ Environment setup complete"
}

# Function to analyze current state
analyze_current_state() {
    print_status $BLUE "🔍 Step 1: Analyzing current state..."
    
    local analysis_file="$REPORTS_DIR/current-analysis-$TIMESTAMP.json"
    
    # Run repository analysis
    if bun run repo:analyze "$OWNER" "$REPO" --output "$analysis_file" 2>/dev/null; then
        print_status $GREEN "✅ Current state analysis complete"
        
        # Extract health score
        local health_score=$(jq -r '.health.score // 0' "$analysis_file" 2>/dev/null || echo "0")
        echo "$health_score" > "$REPORTS_DIR/health-score-$TIMESTAMP.txt"
        
        return 0
    else
        print_status $YELLOW "⚠️  Could not analyze current state, using defaults"
        echo "0" > "$REPORTS_DIR/health-score-$TIMESTAMP.txt"
        return 1
    fi
}

# Function to track action plan progress
track_action_plan_progress() {
    print_status $BLUE "📈 Step 2: Tracking action plan progress..."
    
    local action_plan_file="$REPORTS_DIR/action-plans-$TIMESTAMP.json"
    local automation_file="$REPORTS_DIR/automation-issues-$TIMESTAMP.json"
    
    # Get action plan issues
    if gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json number,title,state,createdAt,updatedAt,labels > "$action_plan_file" 2>/dev/null; then
        print_status $GREEN "✅ Action plan data collected"
    else
        print_status $YELLOW "⚠️  Could not collect action plan data"
        echo "[]" > "$action_plan_file"
    fi
    
    # Get automation issues
    if gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json number,title,state,createdAt,updatedAt,labels > "$automation_file" 2>/dev/null; then
        print_status $GREEN "✅ Automation issue data collected"
    else
        print_status $YELLOW "⚠️  Could not collect automation issue data"
        echo "[]" > "$automation_file"
    fi
    
    # Analyze progress
    local action_plans=$(jq 'length' "$action_plan_file")
    local completed_action_plans=$(jq '[.[] | select(.state == "CLOSED")] | length' "$action_plan_file")
    local open_action_plans=$(jq '[.[] | select(.state == "OPEN")] | length' "$action_plan_file")
    
    local automation_issues=$(jq 'length' "$automation_file")
    local completed_automation=$(jq '[.[] | select(.state == "CLOSED")] | length' "$automation_file")
    local open_automation=$(jq '[.[] | select(.state == "OPEN")] | length' "$automation_file")
    
    # Calculate completion rates
    local action_completion=0
    if [[ $action_plans -gt 0 ]]; then
        action_completion=$(echo "scale=1; $completed_action_plans * 100 / $action_plans" | bc -l 2>/dev/null || echo "0")
    fi
    
    local automation_completion=0
    if [[ $automation_issues -gt 0 ]]; then
        automation_completion=$(echo "scale=1; $completed_automation * 100 / $automation_issues" | bc -l 2>/dev/null || echo "0")
    fi
    
    # Save progress data
    cat > "$REPORTS_DIR/progress-data-$TIMESTAMP.json" << EOF
{
  "actionPlans": {
    "total": $action_plans,
    "completed": $completed_action_plans,
    "open": $open_action_plans,
    "completionRate": $action_completion
  },
  "automationIssues": {
    "total": $automation_issues,
    "completed": $completed_automation,
    "open": $open_automation,
    "completionRate": $automation_completion
  }
}
EOF
    
    print_status $GREEN "✅ Progress tracking complete"
}

# Function to analyze trends
analyze_trends() {
    if [[ "$SKIP_TRENDS" == "true" ]]; then
        print_status $YELLOW "⏭️  Skipping trend analysis"
        return 0
    fi
    
    print_status $BLUE "📊 Step 3: Analyzing trends..."
    
    # Get historical health scores
    local health_scores=()
    local trend_data=""
    
    if [[ -d "$TRENDS_DIR" ]]; then
        while IFS= read -r -d '' file; do
            if [[ -f "$file" ]]; then
                local score=$(jq -r '.health.score // empty' "$file" 2>/dev/null)
                if [[ -n "$score" && "$score" != "null" ]]; then
                    health_scores+=("$score")
                fi
            fi
        done < <(find "$TRENDS_DIR" -name "state-*.json" -print0 2>/dev/null | sort -z)
    fi
    
    # Add current score
    local current_score=$(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "0")
    health_scores+=("$current_score")
    
    # Analyze trends
    if [[ ${#health_scores[@]} -ge 2 ]]; then
        local first_score=${health_scores[0]}
        local last_score=${health_scores[-1]}
        local improvement=$(echo "$last_score - $first_score" | bc -l 2>/dev/null || echo "0")
        
        local trend="stable"
        if (( $(echo "$improvement > 0" | bc -l) )); then
            trend="improving"
        elif (( $(echo "$improvement < 0" | bc -l) )); then
            trend="declining"
        fi
        
        trend_data=$(cat << EOF
{
  "trend": "$trend",
  "firstScore": $first_score,
  "lastScore": $last_score,
  "improvement": $improvement,
  "dataPoints": ${#health_scores[@]}
}
EOF
)
    else
        trend_data='{"trend": "insufficient_data"}'
    fi
    
    echo "$trend_data" > "$REPORTS_DIR/trend-analysis-$TIMESTAMP.json"
    print_status $GREEN "✅ Trend analysis complete"
}

# Function to generate recommendations
generate_recommendations() {
    print_status $BLUE "🎯 Step 4: Generating recommendations..."
    
    local health_score=$(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "0")
    local progress_data=$(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    local trend_data=$(cat "$REPORTS_DIR/trend-analysis-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    
    local action_completion=$(echo "$progress_data" | jq -r '.actionPlans.completionRate // 0')
    local automation_completion=$(echo "$progress_data" | jq -r '.automationIssues.completionRate // 0')
    local trend=$(echo "$trend_data" | jq -r '.trend // "unknown"')
    
    local recommendations=()
    
    # Health score recommendations
    if (( $(echo "$health_score < 80" | bc -l) )); then
        recommendations+=("⚠️ Health score below threshold (80) - Consider running full orchestration")
    fi
    
    if (( $(echo "$health_score < 60" | bc -l) )); then
        recommendations+=("🚨 Health score critically low - Immediate action required")
    fi
    
    # Action plan recommendations
    if (( $(echo "$action_completion < 50" | bc -l) )); then
        recommendations+=("📋 Action plan completion rate low - Review and prioritize open plans")
    fi
    
    # Automation recommendations
    if (( $(echo "$automation_completion < 30" | bc -l) )); then
        recommendations+=("🤖 Automation completion rate low - Focus on implementing automation improvements")
    fi
    
    # Trend-based recommendations
    if [[ "$trend" == "declining" ]]; then
        recommendations+=("📉 Health score declining - Investigate root causes")
    fi
    
    if [[ "$trend" == "improving" ]]; then
        recommendations+=("📈 Excellent progress! Consider sharing best practices")
    fi
    
    # Default recommendation
    if [[ ${#recommendations[@]} -eq 0 ]]; then
        recommendations+=("✅ Repository is in good health - Continue current practices")
    fi
    
    # Save recommendations
    printf '%s\n' "${recommendations[@]}" > "$REPORTS_DIR/recommendations-$TIMESTAMP.txt"
    print_status $GREEN "✅ Recommendations generated"
}

# Function to determine next steps
determine_next_steps() {
    print_status $BLUE "🔄 Step 5: Determining next steps..."
    
    local health_score=$(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "0")
    local progress_data=$(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    
    local action_completion=$(echo "$progress_data" | jq -r '.actionPlans.completionRate // 0')
    local automation_completion=$(echo "$progress_data" | jq -r '.automationIssues.completionRate // 0')
    
    local next_steps=()
    
    # Critical health issues
    if (( $(echo "$health_score < 70" | bc -l) )); then
        next_steps+=("🚨 Trigger full repository orchestration immediately")
    fi
    
    # Low action plan completion
    if (( $(echo "$action_completion < 40" | bc -l) )); then
        next_steps+=("📋 Generate new action plan with higher priority items")
    fi
    
    # Low automation completion
    if (( $(echo "$automation_completion < 30" | bc -l) )); then
        next_steps+=("🤖 Focus on automation implementation and CI/CD improvements")
    fi
    
    # General next steps
    if [[ ${#next_steps[@]} -eq 0 ]]; then
        next_steps+=("📊 Continue monitoring and maintain current practices")
        next_steps+=("🎯 Set up weekly progress reviews")
    fi
    
    # Save next steps
    printf '%s\n' "${next_steps[@]}" > "$REPORTS_DIR/next-steps-$TIMESTAMP.txt"
    print_status $GREEN "✅ Next steps determined"
}

# Function to generate progress report
generate_progress_report() {
    print_status $BLUE "📋 Step 6: Generating progress report..."
    
    local health_score=$(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "0")
    local progress_data=$(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    local trend_data=$(cat "$REPORTS_DIR/trend-analysis-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    local recommendations=($(cat "$REPORTS_DIR/recommendations-$TIMESTAMP.txt" 2>/dev/null || echo "No recommendations"))
    local next_steps=($(cat "$REPORTS_DIR/next-steps-$TIMESTAMP.txt" 2>/dev/null || echo "No next steps"))
    
    local action_completion=$(echo "$progress_data" | jq -r '.actionPlans.completionRate // 0')
    local automation_completion=$(echo "$progress_data" | jq -r '.automationIssues.completionRate // 0')
    local total_action_plans=$(echo "$progress_data" | jq -r '.actionPlans.total // 0')
    local completed_action_plans=$(echo "$progress_data" | jq -r '.actionPlans.completed // 0')
    local open_action_plans=$(echo "$progress_data" | jq -r '.actionPlans.open // 0')
    local total_automation=$(echo "$progress_data" | jq -r '.automationIssues.total // 0')
    local completed_automation=$(echo "$progress_data" | jq -r '.automationIssues.completed // 0')
    local open_automation=$(echo "$progress_data" | jq -r '.automationIssues.open // 0')
    
    local trend=$(echo "$trend_data" | jq -r '.trend // "unknown"')
    local first_score=$(echo "$trend_data" | jq -r '.firstScore // "N/A"')
    local last_score=$(echo "$trend_data" | jq -r '.lastScore // "N/A"')
    local improvement=$(echo "$trend_data" | jq -r '.improvement // "N/A"')
    local data_points=$(echo "$trend_data" | jq -r '.dataPoints // "N/A"')
    
    # Generate report
    cat > "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF
# 📊 Progress Tracking Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M UTC")
**Repository:** $OWNER/$REPO
**Mode:** $TRACKING_MODE
**Report Type:** $REPORT_TYPE

## 📈 Current Metrics

- **Health Score:** $health_score/100
- **Action Plan Completion:** $action_completion%
- **Automation Completion:** $automation_completion%
- **Total Action Plans:** $total_action_plans
- **Completed Action Plans:** $completed_action_plans
- **Open Action Plans:** $open_action_plans
- **Total Automation Issues:** $total_automation
- **Completed Automation Issues:** $completed_automation
- **Open Automation Issues:** $open_automation

## 📊 Trend Analysis

EOF
    
    if [[ "$trend" != "insufficient_data" && "$trend" != "unknown" ]]; then
        cat >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF
- **Trend:** $trend
- **First Score:** $first_score
- **Current Score:** $last_score
- **Improvement:** $improvement points
- **Data Points:** $data_points

EOF
    else
        cat >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF
- **Status:** Insufficient historical data for trend analysis
- **Next Update:** Will be available after more tracking cycles

EOF
    fi
    
    cat >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF
## 🎯 Recommendations

EOF
    
    for rec in "${recommendations[@]}"; do
        echo "- $rec" >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md"
    done
    
    cat >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF

## 🔄 Next Steps

EOF
    
    for step in "${next_steps[@]}"; do
        echo "- $step" >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md"
    done
    
    cat >> "$REPORTS_DIR/progress-report-$TIMESTAMP.md" << EOF

## 📁 Generated Files

- \`current-analysis-$TIMESTAMP.json\` - Current repository analysis
- \`progress-data-$TIMESTAMP.json\` - Progress tracking data
- \`trend-analysis-$TIMESTAMP.json\` - Trend analysis data
- \`recommendations-$TIMESTAMP.txt\` - Generated recommendations
- \`next-steps-$TIMESTAMP.txt\` - Determined next steps
- \`progress-report-$TIMESTAMP.md\` - This report

---
*Generated by Progress Monitoring Script*
EOF
    
    print_status $GREEN "✅ Progress report generated: $REPORTS_DIR/progress-report-$TIMESTAMP.md"
}

# Function to trigger next steps
trigger_next_steps() {
    if [[ "$SKIP_TRIGGER" == "true" ]]; then
        print_status $YELLOW "⏭️  Skipping next steps trigger"
        return 0
    fi
    
    print_status $BLUE "🚀 Step 7: Triggering next steps..."
    
    local health_score=$(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "0")
    local progress_data=$(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    
    local action_completion=$(echo "$progress_data" | jq -r '.actionPlans.completionRate // 0')
    
    # Trigger action plan generation if needed
    if (( $(echo "$health_score < 75" | bc -l) )) || (( $(echo "$action_completion < 40" | bc -l) )); then
        print_status $YELLOW "📋 Triggering action plan generation..."
        if gh workflow run action-plan-generator.yml --repo "$OWNER/$REPO" --field plan_type=comprehensive --field priority=high 2>/dev/null; then
            print_status $GREEN "✅ Action plan generation triggered"
        else
            print_status $YELLOW "⚠️  Could not trigger action plan generation"
        fi
    fi
    
    # Trigger full orchestration if needed
    if (( $(echo "$health_score < 70" | bc -l) )); then
        print_status $YELLOW "🎯 Triggering full repository orchestration..."
        if gh workflow run repository-orchestrator.yml --repo "$OWNER/$REPO" 2>/dev/null; then
            print_status $GREEN "✅ Full orchestration triggered"
        else
            print_status $YELLOW "⚠️  Could not trigger full orchestration"
        fi
    fi
    
    print_status $GREEN "✅ Next steps triggered"
}

# Function to create monitoring issue
create_monitoring_issue() {
    print_status $BLUE "📋 Creating monitoring issue..."
    
    local report_file="$REPORTS_DIR/progress-report-$TIMESTAMP.md"
    local issue_title=""
    local issue_labels=""
    
    # Determine issue title and labels based on tracking mode
    case "$TRACKING_MODE" in
        "comprehensive")
            issue_title="📊 Comprehensive Progress Report - $(date -u +"%Y-%m-%d")"
            issue_labels="monitoring,progress,comprehensive"
            ;;
        "action-plan")
            issue_title="📋 Action Plan Progress - $(date -u +"%Y-%m-%d")"
            issue_labels="monitoring,action-plan,progress"
            ;;
        "health-only")
            issue_title="🏥 Health Score Report - $(date -u +"%Y-%m-%d")"
            issue_labels="monitoring,health,progress"
            ;;
        "automation-progress")
            issue_title="🤖 Automation Progress - $(date -u +"%Y-%m-%d")"
            issue_labels="monitoring,automation,progress"
            ;;
        *)
            issue_title="📊 Progress Report - $(date -u +"%Y-%m-%d")"
            issue_labels="monitoring,progress"
            ;;
    esac
    
    # Create issue
    if gh issue create --repo "$OWNER/$REPO" --title "$issue_title" --body-file "$report_file" --label "$issue_labels" 2>/dev/null; then
        print_status $GREEN "✅ Monitoring issue created"
    else
        print_status $YELLOW "⚠️  Could not create monitoring issue"
    fi
}

# Function to save current state for trends
save_current_state() {
    local analysis_file="$REPORTS_DIR/current-analysis-$TIMESTAMP.json"
    local state_file="$TRENDS_DIR/state-$TIMESTAMP.json"
    
    if [[ -f "$analysis_file" ]]; then
        cp "$analysis_file" "$state_file"
        print_status $GREEN "✅ Current state saved for trend analysis"
    fi
}

# Function to output results
output_results() {
    print_status $BLUE "📤 Outputting results..."
    
    local health_score=$(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "0")
    local progress_data=$(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    local trend_data=$(cat "$REPORTS_DIR/trend-analysis-$TIMESTAMP.json" 2>/dev/null || echo "{}")
    
    local action_completion=$(echo "$progress_data" | jq -r '.actionPlans.completionRate // 0')
    local automation_completion=$(echo "$progress_data" | jq -r '.automationIssues.completionRate // 0')
    local trend=$(echo "$trend_data" | jq -r '.trend // "unknown"')
    
    # Create results JSON
    local results=$(cat << EOF
{
  "repository": "$OWNER/$REPO",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "config": {
    "mode": "$TRACKING_MODE",
    "reportType": "$REPORT_TYPE",
    "outputDir": "$REPORTS_DIR",
    "includeTrends": $([[ "$SKIP_TRENDS" == "true" ]] && echo "false" || echo "true"),
    "triggerNextSteps": $([[ "$SKIP_TRIGGER" == "true" ]] && echo "false" || echo "true")
  },
  "metrics": {
    "healthScore": $health_score,
    "actionPlanCompletion": $action_completion,
    "automationCompletion": $automation_completion,
    "totalActionPlans": $(echo "$progress_data" | jq -r '.actionPlans.total // 0'),
    "completedActionPlans": $(echo "$progress_data" | jq -r '.actionPlans.completed // 0'),
    "openActionPlans": $(echo "$progress_data" | jq -r '.actionPlans.open // 0'),
    "totalAutomationIssues": $(echo "$progress_data" | jq -r '.automationIssues.total // 0'),
    "completedAutomationIssues": $(echo "$progress_data" | jq -r '.automationIssues.completed // 0'),
    "openAutomationIssues": $(echo "$progress_data" | jq -r '.automationIssues.open // 0'),
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "trends": $trend_data,
  "recommendations": $(cat "$REPORTS_DIR/recommendations-$TIMESTAMP.txt" 2>/dev/null | jq -R -s -c 'split("\n")[:-1]'),
  "nextSteps": $(cat "$REPORTS_DIR/next-steps-$TIMESTAMP.txt" 2>/dev/null | jq -R -s -c 'split("\n")[:-1]'),
  "files": {
    "report": "$REPORTS_DIR/progress-report-$TIMESTAMP.md",
    "analysis": "$REPORTS_DIR/current-analysis-$TIMESTAMP.json",
    "progress": "$REPORTS_DIR/progress-data-$TIMESTAMP.json",
    "trends": "$REPORTS_DIR/trend-analysis-$TIMESTAMP.json"
  }
}
EOF
)
    
    # Output to file or stdout
    if [[ -n "$OUTPUT_FILE" ]]; then
        echo "$results" > "$OUTPUT_FILE"
        print_status $GREEN "✅ Results saved to $OUTPUT_FILE"
    else
        echo "$results"
    fi
}

# Function to show summary
show_summary() {
    print_status $PURPLE "🎉 Progress monitoring completed successfully!"
    echo ""
    print_status $CYAN "📊 Summary:"
    echo "   - Repository: $OWNER/$REPO"
    echo "   - Health score: $(cat "$REPORTS_DIR/health-score-$TIMESTAMP.txt" 2>/dev/null || echo "N/A")/100"
    echo "   - Action plan completion: $(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null | jq -r '.actionPlans.completionRate // "N/A"')%"
    echo "   - Automation completion: $(cat "$REPORTS_DIR/progress-data-$TIMESTAMP.json" 2>/dev/null | jq -r '.automationIssues.completionRate // "N/A"')%"
    echo "   - Tracking mode: $TRACKING_MODE"
    echo ""
    print_status $CYAN "📋 Generated:"
    echo "   - Progress report: $REPORTS_DIR/progress-report-$TIMESTAMP.md"
    echo "   - Analysis data: $REPORTS_DIR/current-analysis-$TIMESTAMP.json"
    echo "   - Progress data: $REPORTS_DIR/progress-data-$TIMESTAMP.json"
    echo "   - Trend analysis: $REPORTS_DIR/trend-analysis-$TIMESTAMP.json"
    echo ""
    print_status $CYAN "🔄 Next steps:"
    echo "   - Review generated progress report"
    echo "   - Implement recommended actions"
    echo "   - Monitor trends over time"
    echo "   - Adjust strategies based on data"
}

# Main function
main() {
    print_status $PURPLE "🚀 Starting Progress Monitoring and Tracking"
    echo ""
    
    # Parse arguments
    parse_args "$@"
    
    # Check dependencies
    check_dependencies
    
    # Setup environment
    setup_environment
    
    # Execute monitoring steps
    analyze_current_state
    track_action_plan_progress
    analyze_trends
    generate_recommendations
    determine_next_steps
    generate_progress_report
    trigger_next_steps
    create_monitoring_issue
    save_current_state
    output_results
    
    # Show summary
    echo ""
    show_summary
}

# Run main function with all arguments
main "$@" 