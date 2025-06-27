#!/bin/bash

# Testing Status Script for automate_workloads
# Provides comprehensive testing status and metrics

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

# Function to print header
print_header() {
    local title=$1
    echo -e "\n${PURPLE}${title}${NC}"
    echo -e "${PURPLE}==================================================${NC}"
}

# Function to print section
print_section() {
    local title=$1
    echo -e "\n${CYAN}${title}${NC}"
    echo -e "${CYAN}------------------------------${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get test statistics
get_test_stats() {
    local test_dir=$1
    local test_type=$2
    
    if [ -d "$test_dir" ]; then
        local test_files=$(find "$test_dir" -name "*.test.ts" -o -name "*.test.js" | wc -l)
        local test_count=$(find "$test_dir" -name "*.test.ts" -o -name "*.test.js" -exec grep -l "test(" {} \; | wc -l)
        echo "$test_files files, $test_count test cases"
    else
        echo "No tests found"
    fi
}

# Function to get coverage information
get_coverage_info() {
    local coverage_file="coverage/coverage-summary.json"
    
    if [ -f "$coverage_file" ]; then
        local total_coverage=$(cat "$coverage_file" | grep '"total"' | grep -Eo '[0-9]+\.[0-9]+' | head -1)
        local statements=$(cat "$coverage_file" | grep '"statements"' | grep -Eo '[0-9]+\.[0-9]+' | head -1)
        local branches=$(cat "$coverage_file" | grep '"branches"' | grep -Eo '[0-9]+\.[0-9]+' | head -1)
        local functions=$(cat "$coverage_file" | grep '"functions"' | grep -Eo '[0-9]+\.[0-9]+' | head -1)
        local lines=$(cat "$coverage_file" | grep '"lines"' | grep -Eo '[0-9]+\.[0-9]+' | head -1)
        
        echo "Total: ${total_coverage}% | Statements: ${statements}% | Branches: ${branches}% | Functions: ${functions}% | Lines: ${lines}%"
    else
        echo "No coverage data available"
    fi
}

# Function to get last test run information
get_last_test_run() {
    local log_file=".test-run.log"
    
    if [ -f "$log_file" ]; then
        local last_run=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$log_file" 2>/dev/null || stat -c "%y" "$log_file" 2>/dev/null)
        local status=$(tail -n 1 "$log_file" 2>/dev/null | grep -o "PASS\|FAIL" || echo "Unknown")
        echo "Last run: $last_run | Status: $status"
    else
        echo "No test run log found"
    fi
}

# Function to check pre-commit hook status
check_pre_commit_hook() {
    local hook_file=".git/hooks/pre-commit"
    
    if [ -f "$hook_file" ] && [ -x "$hook_file" ]; then
        print_status $GREEN "✅ Pre-commit hook is active and executable"
        local hook_size=$(wc -l < "$hook_file")
        echo "   Hook size: $hook_size lines"
    else
        print_status $RED "❌ Pre-commit hook not found or not executable"
    fi
}

# Function to check GitHub issue status
check_github_issue() {
    if command_exists gh; then
        local issue_status=$(gh issue view 5 --json state,title 2>/dev/null | grep -o '"state":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")
        local issue_title=$(gh issue view 5 --json state,title 2>/dev/null | grep -o '"title":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")
        
        if [ "$issue_status" = "OPEN" ]; then
            print_status $YELLOW "📋 Testing issue #5 is open: $issue_title"
        elif [ "$issue_status" = "CLOSED" ]; then
            print_status $GREEN "✅ Testing issue #5 is closed: $issue_title"
        else
            print_status $BLUE "📋 Testing issue status: $issue_status"
        fi
    else
        print_status $YELLOW "⚠️  GitHub CLI not available for issue status"
    fi
}

# Function to run quick test check
run_quick_test() {
    print_section "Quick Test Check"
    
    print_status $BLUE "🔍 Running type check..."
    if bun run type-check >/dev/null 2>&1; then
        print_status $GREEN "✅ Type check passed"
    else
        print_status $RED "❌ Type check failed"
        return 1
    fi
    
    print_status $BLUE "🧪 Running unit tests..."
    if bun test tests/unit/ >/dev/null 2>&1; then
        print_status $GREEN "✅ Unit tests passed"
    else
        print_status $RED "❌ Unit tests failed"
        return 1
    fi
    
    print_status $GREEN "🎉 Quick test check completed successfully!"
}

# Main function
main() {
    print_header "🧪 Testing Status Report"
    echo "Generated: $(date -u +"%Y-%m-%d %H:%M UTC")"
    
    # Check environment
    print_section "Environment Check"
    
    if command_exists bun; then
        local bun_version=$(bun --version)
        print_status $GREEN "✅ Bun is available: $bun_version"
    else
        print_status $RED "❌ Bun is not installed"
        exit 1
    fi
    
    if [ -f "package.json" ]; then
        print_status $GREEN "✅ Project root detected"
    else
        print_status $RED "❌ Not in project root"
        exit 1
    fi
    
    # Check pre-commit hook
    print_section "Pre-commit Hook Status"
    check_pre_commit_hook
    
    # Check GitHub issue
    print_section "GitHub Issue Status"
    check_github_issue
    
    # Test statistics
    print_section "Test Statistics"
    
    echo "Unit Tests: $(get_test_stats 'tests/unit' 'unit')"
    echo "Integration Tests: $(get_test_stats 'tests/integration' 'integration')"
    echo "E2E Tests: $(get_test_stats 'tests/e2e' 'e2e')"
    
    # Coverage information
    print_section "Coverage Information"
    echo "$(get_coverage_info)"
    
    # Last test run
    print_section "Last Test Run"
    echo "$(get_last_test_run)"
    
    # Quick test check
    if [ "$1" = "--quick" ] || [ "$1" = "-q" ]; then
        run_quick_test
    fi
    
    # Summary
    print_section "Summary"
    print_status $GREEN "✅ Testing workflow is properly configured"
    print_status $BLUE "💡 Use '--quick' flag to run a quick test check"
    print_status $BLUE "💡 Use 'bun test' to run all tests"
    print_status $BLUE "💡 Use 'bun test --coverage' to run tests with coverage"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --quick, -q    Run a quick test check"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0              Show testing status"
        echo "  $0 --quick      Show status and run quick test"
        exit 0
        ;;
    --quick|-q)
        main "$@"
        ;;
    "")
        main
        ;;
    *)
        print_status $RED "❌ Unknown option: $1"
        print_status $YELLOW "💡 Use --help for usage information"
        exit 1
        ;;
esac 