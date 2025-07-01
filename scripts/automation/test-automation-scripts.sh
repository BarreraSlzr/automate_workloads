#!/bin/bash

# Test Automation Scripts
# Checks for common issues in automation scripts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check script syntax
check_syntax() {
    local script=$1
    if bash -n "$script" 2>/dev/null; then
        print_status $GREEN "✅ Syntax OK: $script"
        return 0
    else
        print_status $RED "❌ Syntax Error: $script"
        return 1
    fi
}

# Function to check for common issues
check_common_issues() {
    local script=$1
    local issues=()
    
    # Check for missing shebang
    if ! head -1 "$script" | grep -q "^#!/bin/bash"; then
        issues+=("Missing shebang")
    fi
    
    # Check for unquoted variables
    if grep -q '\$[A-Za-z_][A-Za-z0-9_]*[^"]' "$script" 2>/dev/null; then
        issues+=("Potential unquoted variables")
    fi
    
    # Check for missing error handling
    if ! grep -q "set -e" "$script" 2>/dev/null; then
        issues+=("No error handling (set -e)")
    fi
    
    # Check for potential subshell issues with arrays
    if grep -q "while.*read.*|" "$script" 2>/dev/null; then
        issues+=("Potential subshell array issue")
    fi
    
    # Check for missing quotes around variables
    if grep -q '\$[A-Za-z_][A-Za-z0-9_]*[^"'\''\s]' "$script" 2>/dev/null; then
        issues+=("Variables might need quoting")
    fi
    
    if [ ${#issues[@]} -eq 0 ]; then
        print_status $GREEN "✅ No common issues found: $script"
        return 0
    else
        print_status $YELLOW "⚠️  Issues found in $script:"
        for issue in "${issues[@]}"; do
            echo "   - $issue"
        done
        return 1
    fi
}

# Function to check dependencies
check_dependencies() {
    local script=$1
    local missing_deps=()
    
    # Check for common commands used in scripts
    local commands=("jq" "gh" "bun" "tar" "find" "grep" "awk" "sed")
    
    for cmd in "${commands[@]}"; do
        if grep -q "$cmd" "$script" 2>/dev/null; then
            if ! command -v "$cmd" >/dev/null 2>&1; then
                missing_deps+=("$cmd")
            fi
        fi
    done
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        print_status $GREEN "✅ Dependencies OK: $script"
        return 0
    else
        print_status $YELLOW "⚠️  Missing dependencies for $script:"
        for dep in "${missing_deps[@]}"; do
            echo "   - $dep"
        done
        return 1
    fi
}

# Main execution
main() {
    print_status $BLUE "🔍 Testing Automation Scripts"
    echo "================================"
    echo ""
    
    local total_scripts=0
    local syntax_errors=0
    local common_issues=0
    local dependency_issues=0
    
    # Find all shell scripts
    while read -r script; do
        ((total_scripts++))
        echo "Testing: $script"
        
        # Check syntax
        if ! check_syntax "$script"; then
            ((syntax_errors++))
        fi
        
        # Check for common issues
        if ! check_common_issues "$script"; then
            ((common_issues++))
        fi
        
        # Check dependencies
        if ! check_dependencies "$script"; then
            ((dependency_issues++))
        fi
        
        echo ""
    done < <(find scripts/automation -name "*.sh" -type f)
    
    # Summary
    echo "================================"
    print_status $BLUE "📊 Test Summary:"
    echo "   Total scripts: $total_scripts"
    echo "   Syntax errors: $syntax_errors"
    echo "   Common issues: $common_issues"
    echo "   Dependency issues: $dependency_issues"
    echo ""
    
    if [ $syntax_errors -eq 0 ] && [ $common_issues -eq 0 ] && [ $dependency_issues -eq 0 ]; then
        print_status $GREEN "🎉 All automation scripts passed tests!"
        exit 0
    else
        print_status $YELLOW "⚠️  Some issues found. Review the output above."
        exit 1
    fi
}

# Run main function
main "$@" 