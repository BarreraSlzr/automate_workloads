#!/bin/bash

# GitHub Projects Integration Script
# Integrates automation ecosystem with GitHub Projects for better visualization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] <owner> <repo>"
    echo ""
    echo "Options:"
    echo "  -p, --project-id ID     GitHub Project ID (required)"
    echo "  -m, --mode MODE         Integration mode: setup|sync|report (default: sync)"
    echo "  -o, --output FILE       Output file for results (JSON)"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Modes:"
    echo "  setup    - Set up GitHub Project with automation columns"
    echo "  sync     - Sync automation issues to GitHub Project"
    echo "  report   - Generate project progress report"
    echo ""
    echo "Examples:"
    echo "  $0 -p 123 -m setup emmanuelbarrera automate_workloads"
    echo "  $0 -p 123 -m sync emmanuelbarrera automate_workloads"
    echo "  $0 -p 123 -m report emmanuelbarrera automate_workloads"
}

# Parse command line arguments
PROJECT_ID=""
MODE="sync"
OUTPUT_FILE=""
VERBOSE=false
OWNER=""
REPO=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            echo "Unknown option $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$OWNER" ]]; then
                OWNER="$1"
            elif [[ -z "$REPO" ]]; then
                REPO="$1"
            else
                echo "Too many arguments"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [[ -z "$PROJECT_ID" ]]; then
    print_status $RED "❌ Error: Project ID is required"
    show_usage
    exit 1
fi

if [[ -z "$OWNER" || -z "$REPO" ]]; then
    print_status $RED "❌ Error: Owner and repository are required"
    show_usage
    exit 1
fi

# Validate mode
case "$MODE" in
    setup|sync|report)
        ;;
    *)
        print_status $RED "❌ Error: Invalid mode '$MODE'"
        show_usage
        exit 1
        ;;
esac

# Set output file if not specified
if [[ -z "$OUTPUT_FILE" ]]; then
    OUTPUT_FILE=".orchestration-reports/github-projects-$MODE-$(date +%Y%m%d-%H%M%S).json"
fi

# Create output directory
mkdir -p "$(dirname "$OUTPUT_FILE")"

print_status $BLUE "🚀 GitHub Projects Integration"
print_status $CYAN "Repository: $OWNER/$REPO"
print_status $CYAN "Project ID: $PROJECT_ID"
print_status $CYAN "Mode: $MODE"
echo ""

# Function to get project information
get_project_info() {
    print_status $BLUE "📋 Getting project information..."
    
    local project_data
    if project_data=$(gh api graphql -f query='
        query($projectId: ID!) {
            node(id: $projectId) {
                ... on ProjectV2 {
                    id
                    title
                    description
                    fields(first: 20) {
                        nodes {
                            ... on ProjectV2Field {
                                id
                                name
                            }
                            ... on ProjectV2SingleSelectField {
                                id
                                name
                                options {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    ' -f projectId="$PROJECT_ID" 2>/dev/null); then
        echo "$project_data" | jq -r '.data.node'
    else
        print_status $RED "❌ Could not get project information"
        return 1
    fi
}

# Function to set up project with automation columns
setup_project() {
    print_status $BLUE "🔧 Setting up GitHub Project with automation columns..."
    
    # Get current project info
    local project_info
    project_info=$(get_project_info)
    
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    
    print_status $GREEN "✅ Project found: $(echo "$project_info" | jq -r '.title')"
    
    # Check if automation columns already exist
    local has_automation_column=false
    local has_status_column=false
    
    echo "$project_info" | jq -r '.fields.nodes[] | select(.name == "Automation") | .name' | grep -q "Automation" && has_automation_column=true
    echo "$project_info" | jq -r '.fields.nodes[] | select(.name == "Status") | .name' | grep -q "Status" && has_status_column=true
    
    # Create automation field if it doesn't exist
    if [[ "$has_automation_column" == "false" ]]; then
        print_status $BLUE "📊 Creating automation field..."
        
        gh api graphql -f query='
            mutation($projectId: ID!) {
                createProjectV2Field(input: {
                    projectId: $projectId
                    dataType: SINGLE_SELECT
                    name: "Automation"
                }) {
                    projectV2Field {
                        ... on ProjectV2SingleSelectField {
                            id
                            name
                        }
                    }
                }
            }
        ' -f projectId="$PROJECT_ID" > /dev/null 2>&1
        
        if [[ $? -eq 0 ]]; then
            print_status $GREEN "✅ Automation field created"
        else
            print_status $YELLOW "⚠️  Could not create automation field (may already exist)"
        fi
    else
        print_status $GREEN "✅ Automation field already exists"
    fi
    
    # Create status field if it doesn't exist
    if [[ "$has_status_column" == "false" ]]; then
        print_status $BLUE "📊 Creating status field..."
        
        gh api graphql -f query='
            mutation($projectId: ID!) {
                createProjectV2Field(input: {
                    projectId: $projectId
                    dataType: SINGLE_SELECT
                    name: "Status"
                }) {
                    projectV2Field {
                        ... on ProjectV2SingleSelectField {
                            id
                            name
                        }
                    }
                }
            }
        ' -f projectId="$PROJECT_ID" > /dev/null 2>&1
        
        if [[ $? -eq 0 ]]; then
            print_status $GREEN "✅ Status field created"
        else
            print_status $YELLOW "⚠️  Could not create status field (may already exist)"
        fi
    else
        print_status $GREEN "✅ Status field already exists"
    fi
    
    print_status $GREEN "✅ Project setup complete"
}

# Function to sync automation issues to project
sync_issues() {
    print_status $BLUE "🔄 Syncing automation issues to GitHub Project..."
    
    # Get automation issues
    local automation_issues
    automation_issues=$(gh issue list --repo "$OWNER/$REPO" --label "automation" --limit 100 --json number,title,state,labels,createdAt,updatedAt 2>/dev/null || echo "[]")
    
    # Get action plan issues
    local action_plan_issues
    action_plan_issues=$(gh issue list --repo "$OWNER/$REPO" --label "action-plan" --limit 100 --json number,title,state,labels,createdAt,updatedAt 2>/dev/null || echo "[]")
    
    # Combine issues
    local all_issues
    all_issues=$(echo "$automation_issues" | jq -s '.[0] + .[1]' --argjson issues1 "$automation_issues" --argjson issues2 "$action_plan_issues")
    
    local issue_count
    issue_count=$(echo "$all_issues" | jq 'length')
    
    print_status $GREEN "✅ Found $issue_count issues to sync"
    
    # Sync each issue
    local synced_count=0
    local skipped_count=0
    
    echo "$all_issues" | jq -c '.[]' | while read -r issue; do
        local issue_number
        issue_number=$(echo "$issue" | jq -r '.number')
        
        # Check if issue is already in project
        local in_project
        in_project=$(gh api graphql -f query='
            query($projectId: ID!, $issueId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        items(first: 100) {
                            nodes {
                                content {
                                    ... on Issue {
                                        id
                                        number
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ' -f projectId="$PROJECT_ID" -f issueId="issue_$issue_number" 2>/dev/null | jq -r '.data.node.items.nodes[] | select(.content.number == '$issue_number') | .content.id' || echo "")
        
        if [[ -n "$in_project" ]]; then
            if [[ "$VERBOSE" == "true" ]]; then
                print_status $YELLOW "⚠️  Issue #$issue_number already in project"
            fi
            ((skipped_count++))
        else
            # Add issue to project
            local issue_id
            issue_id=$(gh api graphql -f query='
                query($owner: String!, $repo: String!, $number: Int!) {
                    repository(owner: $owner, name: $repo) {
                        issue(number: $number) {
                            id
                        }
                    }
                }
            ' -f owner="$OWNER" -f repo="$REPO" -f number="$issue_number" 2>/dev/null | jq -r '.data.repository.issue.id' || echo "")
            
            if [[ -n "$issue_id" ]]; then
                gh api graphql -f query='
                    mutation($projectId: ID!, $contentId: ID!) {
                        addProjectV2Item(input: {
                            projectId: $projectId
                            contentId: $contentId
                        }) {
                            item {
                                id
                            }
                        }
                    }
                ' -f projectId="$PROJECT_ID" -f contentId="$issue_id" > /dev/null 2>&1
                
                if [[ $? -eq 0 ]]; then
                    if [[ "$VERBOSE" == "true" ]]; then
                        print_status $GREEN "✅ Added issue #$issue_number to project"
                    fi
                    ((synced_count++))
                else
                    print_status $YELLOW "⚠️  Could not add issue #$issue_number to project"
                fi
            else
                print_status $YELLOW "⚠️  Could not get issue ID for #$issue_number"
            fi
        fi
    done
    
    print_status $GREEN "✅ Sync complete: $synced_count added, $skipped_count skipped"
}

# Function to generate project progress report
generate_report() {
    print_status $BLUE "📊 Generating GitHub Project progress report..."
    
    # Get project items
    local project_items
    project_items=$(gh api graphql -f query='
        query($projectId: ID!) {
            node(id: $projectId) {
                ... on ProjectV2 {
                    title
                    items(first: 100) {
                        nodes {
                            content {
                                ... on Issue {
                                    id
                                    number
                                    title
                                    state
                                    labels(first: 10) {
                                        nodes {
                                            name
                                        }
                                    }
                                    createdAt
                                    updatedAt
                                }
                            }
                        }
                    }
                }
            }
        }
    ' -f projectId="$PROJECT_ID" 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        print_status $RED "❌ Could not get project items"
        return 1
    fi
    
    # Extract issues
    local issues
    issues=$(echo "$project_items" | jq -r '.data.node.items.nodes[] | select(.content != null) | .content')
    
    # Calculate metrics
    local total_issues
    total_issues=$(echo "$issues" | jq 'length')
    
    local open_issues
    open_issues=$(echo "$issues" | jq '[.[] | select(.state == "OPEN")] | length')
    
    local closed_issues
    closed_issues=$(echo "$issues" | jq '[.[] | select(.state == "CLOSED")] | length')
    
    local automation_issues
    automation_issues=$(echo "$issues" | jq '[.[] | select(.labels.nodes[].name == "automation")] | length')
    
    local action_plan_issues
    action_plan_issues=$(echo "$issues" | jq '[.[] | select(.labels.nodes[].name == "action-plan")] | length')
    
    # Calculate completion rates
    local completion_rate=0
    if [[ $total_issues -gt 0 ]]; then
        completion_rate=$(echo "scale=1; $closed_issues * 100 / $total_issues" | bc -l 2>/dev/null || echo "0")
    fi
    
    # Generate report
    local report
    report=$(cat << EOF
{
  "project": {
    "id": "$PROJECT_ID",
    "title": "$(echo "$project_items" | jq -r '.data.node.title')",
    "repository": "$OWNER/$REPO"
  },
  "metrics": {
    "total_issues": $total_issues,
    "open_issues": $open_issues,
    "closed_issues": $closed_issues,
    "completion_rate": $completion_rate,
    "automation_issues": $automation_issues,
    "action_plan_issues": $action_plan_issues
  },
  "issues": $issues,
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)
    
    # Save report
    echo "$report" > "$OUTPUT_FILE"
    
    # Display summary
    print_status $GREEN "📊 Project Progress Report"
    print_status $CYAN "Project: $(echo "$project_items" | jq -r '.data.node.title')"
    print_status $CYAN "Repository: $OWNER/$REPO"
    echo ""
    print_status $BLUE "📈 Metrics:"
    print_status $GREEN "   Total Issues: $total_issues"
    print_status $GREEN "   Open Issues: $open_issues"
    print_status $GREEN "   Closed Issues: $closed_issues"
    print_status $GREEN "   Completion Rate: ${completion_rate}%"
    print_status $GREEN "   Automation Issues: $automation_issues"
    print_status $GREEN "   Action Plan Issues: $action_plan_issues"
    echo ""
    print_status $GREEN "✅ Report saved to: $OUTPUT_FILE"
}

# Main execution
case "$MODE" in
    setup)
        setup_project
        ;;
    sync)
        sync_issues
        ;;
    report)
        generate_report
        ;;
esac

print_status $GREEN "🎉 GitHub Projects integration complete!" 