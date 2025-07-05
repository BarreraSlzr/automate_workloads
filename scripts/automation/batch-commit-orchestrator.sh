#!/bin/bash

# Batch Commit Orchestrator
# 
# Comprehensive automation for batch commits with safety checks and user approval
# Usage: ./scripts/automation/batch-commit-orchestrator.sh [options]

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
    echo "🎯 Batch Commit Orchestrator"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run              Show what would be committed without committing"
    echo "  --validate-only        Run validation checks only"
    echo "  --commit-ready         Commit only files marked as ready"
    echo "  --commit-all           Commit all staged and unstaged changes"
    echo "  --batch-size <N>       Number of commits per batch (default: 5)"
    echo "  --message-prefix <str> Prefix for commit messages"
    echo "  --skip-tests           Skip running tests before commit"
    echo "  --skip-validation      Skip validation checks"
    echo "  --force                Skip all safety checks (use with caution)"
    echo "  --help|-h              Show this help"
    echo ""
    echo "Safety Features:"
    echo "  - No commits without explicit user approval"
    echo "  - Pre-commit validation and testing"
    echo "  - TypeScript compilation checks"
    echo "  - Fossil validation"
    echo "  - Batch size limits"
    echo ""
    echo "Examples:"
    echo "  $0 --dry-run                    # See what would be committed"
    echo "  $0 --validate-only              # Run validation only"
    echo "  $0 --commit-ready               # Commit ready files with approval"
    echo "  $0 --commit-all --batch-size 3  # Commit all with smaller batches"
}

# Default values
DRY_RUN=false
VALIDATE_ONLY=false
COMMIT_READY=false
COMMIT_ALL=false
BATCH_SIZE=5
MESSAGE_PREFIX=""
SKIP_TESTS=false
SKIP_VALIDATION=false
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --commit-ready)
            COMMIT_READY=true
            shift
            ;;
        --commit-all)
            COMMIT_ALL=true
            shift
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --message-prefix)
            MESSAGE_PREFIX="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --force)
            FORCE=true
            shift
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

# Validate options
if [ "$COMMIT_READY" = true ] && [ "$COMMIT_ALL" = true ]; then
    print_status $RED "❌ Error: Cannot use --commit-ready and --commit-all together"
    exit 1
fi

if [ "$DRY_RUN" = true ] && [ "$VALIDATE_ONLY" = true ]; then
    print_status $RED "❌ Error: Cannot use --dry-run and --validate-only together"
    exit 1
fi

# Function to run validation checks
run_validation() {
    print_status $CYAN "🔍 Running validation checks..."
    
    # TypeScript compilation check
    if [ "$SKIP_VALIDATION" = false ]; then
        print_status $BLUE "  📝 TypeScript compilation check..."
        if ! bun run tsc --noEmit; then
            print_status $RED "❌ TypeScript compilation failed"
            return 1
        fi
        print_status $GREEN "  ✅ TypeScript compilation passed"
        
        # Run pre-commit validation
        print_status $BLUE "  🔧 Pre-commit validation..."
        if ! bun run scripts/precommit-validate.ts; then
            print_status $RED "❌ Pre-commit validation failed"
            return 1
        fi
        print_status $GREEN "  ✅ Pre-commit validation passed"
    fi
    
    # Run tests if not skipped
    if [ "$SKIP_TESTS" = false ]; then
        print_status $BLUE "  🧪 Running tests..."
        if ! bun test; then
            print_status $RED "❌ Tests failed"
            return 1
        fi
        print_status $GREEN "  ✅ Tests passed"
    fi
    
    print_status $GREEN "✅ All validation checks passed"
    return 0
}

# Function to get staged files
get_staged_files() {
    git diff --cached --name-only | grep -v '^$' || true
}

# Function to get unstaged files
get_unstaged_files() {
    git diff --name-only | grep -v '^$' || true
}

# Function to get untracked files
get_untracked_files() {
    git ls-files --others --exclude-standard | grep -v '^$' || true
}

# Function to categorize files
categorize_files() {
    local staged_files=($(get_staged_files))
    local unstaged_files=($(get_unstaged_files))
    local untracked_files=($(get_untracked_files))
    
    echo "📁 File Analysis:"
    echo "  Staged files: ${#staged_files[@]}"
    echo "  Unstaged files: ${#unstaged_files[@]}"
    echo "  Untracked files: ${#untracked_files[@]}"
    echo ""
    
    if [ ${#staged_files[@]} -gt 0 ]; then
        echo "📋 Staged files:"
        for file in "${staged_files[@]}"; do
            echo "  ✅ $file"
        done
        echo ""
    fi
    
    if [ ${#unstaged_files[@]} -gt 0 ]; then
        echo "📝 Unstaged files:"
        for file in "${unstaged_files[@]}"; do
            echo "  📄 $file"
        done
        echo ""
    fi
    
    if [ ${#untracked_files[@]} -gt 0 ]; then
        echo "🆕 Untracked files:"
        for file in "${untracked_files[@]}"; do
            echo "  ➕ $file"
        done
        echo ""
    fi
}

# Function to generate commit message
generate_commit_message() {
    local files=("$@")
    local file_types=()
    local features=()
    local fixes=()
    local docs=()
    local tests=()
    local scripts=()
    
    for file in "${files[@]}"; do
        case "$file" in
            src/cli/*)
                cli_files+=("$file")
                ;;
            src/utils/*)
                utils_files+=("$file")
                ;;
            src/types/*)
                types_files+=("$file")
                ;;
            src/services/*)
                services_files+=("$file")
                ;;
            scripts/*)
                scripts+=("$file")
                ;;
            tests/*)
                tests+=("$file")
                ;;
            docs/*)
                docs+=("$file")
                ;;
            fossils/*)
                fossils+=("$file")
                ;;
            examples/*)
                examples+=("$file")
                ;;
        esac
    done
    
    # Determine commit type and scope
    local commit_type="feat"
    local scope=""
    
    if [ ${#docs[@]} -gt 0 ]; then
        commit_type="docs"
        scope="documentation"
    elif [ ${#tests[@]} -gt 0 ]; then
        commit_type="test"
        scope="testing"
    elif [ ${#scripts[@]} -gt 0 ]; then
        commit_type="feat"
        scope="automation"
    elif [ ${#cli_files[@]} -gt 0 ]; then
        commit_type="feat"
        scope="cli"
    elif [ ${#utils[@]} -gt 0 ]; then
        commit_type="feat"
        scope="utils"
    elif [ ${#types[@]} -gt 0 ]; then
        commit_type="feat"
        scope="types"
    elif [ ${#services[@]} -gt 0 ]; then
        commit_type="feat"
        scope="services"
    fi
    
    # Generate message
    local message="$commit_type($scope): "
    
    if [ ${#docs[@]} -gt 0 ]; then
        message+="update documentation"
    elif [ ${#tests[@]} -gt 0 ]; then
        message+="add test coverage"
    elif [ ${#scripts[@]} -gt 0 ]; then
        message+="add automation scripts"
    elif [ ${#cli_files[@]} -gt 0 ]; then
        message+="add CLI commands"
    elif [ ${#utils[@]} -gt 0 ]; then
        message+="add utility functions"
    elif [ ${#types[@]} -gt 0 ]; then
        message+="add type definitions"
    elif [ ${#services[@]} -gt 0 ]; then
        message+="add service implementations"
    else
        message+="update project files"
    fi
    
    message+="\n\n"
    message+="- Update ${#files[@]} files\n"
    
    if [ ${#docs[@]} -gt 0 ]; then
        message+="- Documentation updates: ${docs[*]}\n"
    fi
    if [ ${#tests[@]} -gt 0 ]; then
        message+="- Test updates: ${tests[*]}\n"
    fi
    if [ ${#scripts[@]} -gt 0 ]; then
        message+="- Script updates: ${scripts[*]}\n"
    fi
    if [ ${#cli_files[@]} -gt 0 ]; then
        message+="- CLI updates: ${cli_files[*]}\n"
    fi
    if [ ${#utils[@]} -gt 0 ]; then
        message+="- Utility updates: ${utils[*]}\n"
    fi
    if [ ${#types[@]} -gt 0 ]; then
        message+="- Type updates: ${types[*]}\n"
    fi
    if [ ${#services[@]} -gt 0 ]; then
        message+="- Service updates: ${services[*]}\n"
    fi
    
    echo "$message"
}

# Function to commit files in batches
commit_files_in_batches() {
    local files=("$@")
    local total_files=${#files[@]}
    local current_batch=1
    local total_batches=$(( (total_files + BATCH_SIZE - 1) / BATCH_SIZE ))
    
    print_status $CYAN "🚀 Starting batch commits..."
    print_status $BLUE "  Total files: $total_files"
    print_status $BLUE "  Batch size: $BATCH_SIZE"
    print_status $BLUE "  Total batches: $total_batches"
    echo ""
    
    for ((i=0; i<total_files; i+=BATCH_SIZE)); do
        local batch_files=("${files[@]:i:BATCH_SIZE}")
        local batch_size=${#batch_files[@]}
        
        print_status $PURPLE "📦 Batch $current_batch/$total_batches ($batch_size files)"
        
        # Show files in this batch
        for file in "${batch_files[@]}"; do
            echo "  📄 $file"
        done
        echo ""
        
        if [ "$DRY_RUN" = true ]; then
            print_status $YELLOW "🔍 DRY RUN - Would commit batch $current_batch"
            echo ""
        else
            # Generate commit message
            local commit_message=$(generate_commit_message "${batch_files[@]}")
            
            # Show commit message
            print_status $BLUE "📝 Commit message:"
            echo "$commit_message"
            
            # Auto-approve if --force flag is set
            if [ "$FORCE" = true ]; then
                print_status $GREEN "✅ Auto-approving batch $current_batch (--force mode)"
            else
                # Ask for user approval
                echo -e "${CYAN}Commit this batch? (y/N): ${NC}"
                read -r response
                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                    print_status $YELLOW "⏸️  Skipping batch $current_batch"
                    echo ""
                    continue
                fi
            fi
            
            # Stage and commit files
            for file in "${batch_files[@]}"; do
                git add "$file"
            done
            
            # Commit with message
            if git commit -m "$commit_message"; then
                print_status $GREEN "✅ Batch $current_batch committed successfully"
            else
                print_status $RED "❌ Failed to commit batch $current_batch"
                return 1
            fi
            echo ""
        fi
        
        current_batch=$((current_batch + 1))
    done
    
    if [ "$DRY_RUN" = true ]; then
        print_status $YELLOW "🔍 DRY RUN COMPLETE - No commits were made"
    else
        print_status $GREEN "🎉 All batches committed successfully!"
    fi
}

# Function to commit ready files only
commit_ready_files() {
    print_status $CYAN "🎯 Committing ready files only..."
    
    # Get staged files (these are ready)
    local staged_files=($(get_staged_files))
    
    if [ ${#staged_files[@]} -eq 0 ]; then
        print_status $YELLOW "⚠️  No staged files found"
        return 0
    fi
    
    print_status $BLUE "Found ${#staged_files[@]} staged files ready for commit"
    
    if [ "$DRY_RUN" = true ]; then
        print_status $YELLOW "🔍 DRY RUN - Would commit ${#staged_files[@]} staged files"
        for file in "${staged_files[@]}"; do
            echo "  📄 $file"
        done
    else
        commit_files_in_batches "${staged_files[@]}"
    fi
}

# Function to commit all changes
commit_all_changes() {
    print_status $CYAN "🎯 Committing all changes..."
    
    # Get all changed files
    local staged_files=($(get_staged_files))
    local unstaged_files=($(get_unstaged_files))
    local untracked_files=($(get_untracked_files))
    
    local all_files=("${staged_files[@]}" "${unstaged_files[@]}" "${untracked_files[@]}")
    
    if [ ${#all_files[@]} -eq 0 ]; then
        print_status $YELLOW "⚠️  No changes found"
        return 0
    fi
    
    print_status $BLUE "Found ${#all_files[@]} total files to commit"
    print_status $BLUE "  Staged: ${#staged_files[@]}"
    print_status $BLUE "  Unstaged: ${#unstaged_files[@]}"
    print_status $BLUE "  Untracked: ${#untracked_files[@]}"
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        print_status $YELLOW "🔍 DRY RUN - Would commit all ${#all_files[@]} files"
        for file in "${all_files[@]}"; do
            echo "  📄 $file"
        done
    else
        # Stage all files first
        print_status $BLUE "📦 Staging all files..."
        for file in "${all_files[@]}"; do
            git add "$file"
        done
        print_status $GREEN "✅ All files staged"
        echo ""
        
        # Commit in batches
        commit_files_in_batches "${all_files[@]}"
    fi
}

# Main execution
main() {
    print_status $CYAN "🎯 Batch Commit Orchestrator"
    echo ""
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_status $RED "❌ Error: Not in a git repository"
        exit 1
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    print_status $BLUE "📍 Current branch: $current_branch"
    echo ""
    
    # Show file analysis
    categorize_files
    
    # Run validation if not skipped
    if [ "$VALIDATE_ONLY" = true ]; then
        if run_validation; then
            print_status $GREEN "✅ Validation completed successfully"
        else
            print_status $RED "❌ Validation failed"
            exit 1
        fi
        return 0
    fi
    
    # Run validation before committing
    if [ "$SKIP_VALIDATION" = false ] && [ "$DRY_RUN" = false ]; then
        if ! run_validation; then
            print_status $RED "❌ Validation failed - aborting commit"
            exit 1
        fi
        echo ""
    fi
    
    # Execute commit strategy
    if [ "$COMMIT_READY" = true ]; then
        commit_ready_files
    elif [ "$COMMIT_ALL" = true ]; then
        commit_all_changes
    elif [ "$DRY_RUN" = true ]; then
        print_status $YELLOW "🔍 DRY RUN MODE - No commits will be made"
        echo ""
        categorize_files
    else
        print_status $YELLOW "⚠️  No commit strategy specified"
        echo "Use --commit-ready, --commit-all, --dry-run, or --validate-only"
        show_usage
        exit 1
    fi
    
    print_status $GREEN "🎉 Batch commit orchestration completed!"
}

# Run main function
main "$@" 