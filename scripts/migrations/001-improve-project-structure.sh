#!/bin/bash
# Migration: 001-improve-project-structure.sh
# Version: 001
# Description: Reorganize project structure with better separation of concerns
# Created: 2025-06-25
# Author: Automation System

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$MIGRATIONS_DIR")"

# Migration metadata
MIGRATION_ID="001"
MIGRATION_NAME="improve-project-structure"
MIGRATION_FILE="$MIGRATIONS_DIR/$MIGRATION_ID-$MIGRATION_NAME.sh"
MIGRATION_LOG="$MIGRATIONS_DIR/migration.log"
MIGRATION_STATE="$MIGRATIONS_DIR/migration-state.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$MIGRATION_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$MIGRATION_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$MIGRATION_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$MIGRATION_LOG"
}

# Check if migration has already been run
is_migration_applied() {
    if [[ -f "$MIGRATION_STATE" ]]; then
        jq -e ".migrations[] | select(.id == \"$MIGRATION_ID\")" "$MIGRATION_STATE" >/dev/null 2>&1
    else
        return 1
    fi
}

# Mark migration as applied
mark_migration_applied() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    if [[ ! -f "$MIGRATION_STATE" ]]; then
        echo '{"migrations": []}' > "$MIGRATION_STATE"
    fi
    
    jq --arg id "$MIGRATION_ID" \
       --arg name "$MIGRATION_NAME" \
       --arg timestamp "$timestamp" \
       '.migrations += [{"id": $id, "name": $name, "applied_at": $timestamp}]' \
       "$MIGRATION_STATE" > "$MIGRATION_STATE.tmp" && mv "$MIGRATION_STATE.tmp" "$MIGRATION_STATE"
}

# Mark migration as rolled back
mark_migration_rolled_back() {
    jq "del(.migrations[] | select(.id == \"$MIGRATION_ID\"))" "$MIGRATION_STATE" > "$MIGRATION_STATE.tmp" && mv "$MIGRATION_STATE.tmp" "$MIGRATION_STATE"
}

# Create backup of current structure
create_backup() {
    local backup_dir="$MIGRATIONS_DIR/backups/$MIGRATION_ID-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    log_info "Creating backup in $backup_dir"
    
    # Backup current scripts structure
    if [[ -d "$PROJECT_ROOT/scripts" ]]; then
        cp -r "$PROJECT_ROOT/scripts" "$backup_dir/"
    fi
    
    # Backup package.json
    cp "$PROJECT_ROOT/package.json" "$backup_dir/"
    
    log_success "Backup created successfully"
    echo "$backup_dir"
}

# Restore from backup
restore_backup() {
    local backup_dir="$1"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi
    
    log_info "Restoring from backup: $backup_dir"
    
    # Restore scripts
    if [[ -d "$backup_dir/scripts" ]]; then
        rm -rf "$PROJECT_ROOT/scripts"
        cp -r "$backup_dir/scripts" "$PROJECT_ROOT/"
    fi
    
    # Restore package.json
    if [[ -f "$backup_dir/package.json" ]]; then
        cp "$backup_dir/package.json" "$PROJECT_ROOT/"
    fi
    
    log_success "Restore completed successfully"
}

# UP migration - apply the changes
up() {
    log_info "Starting migration $MIGRATION_ID: $MIGRATION_NAME"
    
    if is_migration_applied; then
        log_warning "Migration $MIGRATION_ID has already been applied"
        return 0
    fi
    
    # Create backup
    local backup_dir=$(create_backup)
    
    # Phase 1: Create new directory structure
    log_info "Phase 1: Creating new directory structure..."
    
    mkdirs=(
        "scripts/automation"
        "scripts/monitoring" 
        "scripts/setup"
        "tests/unit/scripts/automation"
        "tests/unit/scripts/monitoring"
        "tests/unit/scripts/setup"
        "tests/integration"
        "tests/e2e"
    )
    
    for dir in "${mkdirs[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
        log_success "Created: $dir"
    done
    
    # Phase 2: Move automation scripts
    log_info "Phase 2: Moving automation scripts..."
    
    automation_scripts=(
        "backup-context.sh"
        "github-projects-integration.sh"
        "llm-content-automation.sh"
        "llm-issue-manager.sh"
        "llm-workflow.sh"
        "monitor-progress.sh"
        "qa-workflow.sh"
        "repo-orchestrator.sh"
        "review-workflow.sh"
        "simple-monitor.sh"
    )
    
    for script in "${automation_scripts[@]}"; do
        if [[ -f "$PROJECT_ROOT/scripts/$script" ]]; then
            mv "$PROJECT_ROOT/scripts/$script" "$PROJECT_ROOT/scripts/automation/$script"
            log_success "Moved: scripts/$script → scripts/automation/$script"
        else
            log_warning "Not found: scripts/$script"
        fi
    done
    
    # Phase 3: Move monitoring scripts
    log_info "Phase 3: Moving monitoring scripts..."
    
    monitoring_scripts=(
        "check-issues.sh"
        "quick-status.sh"
    )
    
    for script in "${monitoring_scripts[@]}"; do
        if [[ -f "$PROJECT_ROOT/scripts/$script" ]]; then
            mv "$PROJECT_ROOT/scripts/$script" "$PROJECT_ROOT/scripts/monitoring/$script"
            log_success "Moved: scripts/$script → scripts/monitoring/$script"
        else
            log_warning "Not found: scripts/$script"
        fi
    done
    
    # Phase 4: Move setup scripts
    log_info "Phase 4: Moving setup scripts..."
    
    setup_scripts=(
        "create-milestone.sh"
    )
    
    for script in "${setup_scripts[@]}"; do
        if [[ -f "$PROJECT_ROOT/scripts/$script" ]]; then
            mv "$PROJECT_ROOT/scripts/$script" "$PROJECT_ROOT/scripts/setup/$script"
            log_success "Moved: scripts/$script → scripts/setup/$script"
        else
            log_warning "Not found: scripts/$script"
        fi
    done
    
    # Handle TypeScript files
    if [[ -f "$PROJECT_ROOT/scripts/ensure-demo-issue.ts" ]]; then
        mv "$PROJECT_ROOT/scripts/ensure-demo-issue.ts" "$PROJECT_ROOT/src/cli/ensure-demo-issue.ts"
        log_success "Moved: scripts/ensure-demo-issue.ts → src/cli/ensure-demo-issue.ts"
    fi
    
    # Phase 5: Move test files
    log_info "Phase 5: Moving test files..."
    
    if [[ -f "$PROJECT_ROOT/scripts/base.test.ts" ]]; then
        mv "$PROJECT_ROOT/scripts/base.test.ts" "$PROJECT_ROOT/tests/unit/scripts/base.test.ts"
        log_success "Moved: scripts/base.test.ts → tests/unit/scripts/base.test.ts"
    fi
    
    if [[ -f "$PROJECT_ROOT/scripts/check-issues.test.ts" ]]; then
        mv "$PROJECT_ROOT/scripts/check-issues.test.ts" "$PROJECT_ROOT/tests/unit/scripts/monitoring/check-issues.test.ts"
        log_success "Moved: scripts/check-issues.test.ts → tests/unit/scripts/monitoring/check-issues.test.ts"
    fi
    
    if [[ -f "$PROJECT_ROOT/scripts/check-issues.test.sh" ]]; then
        mv "$PROJECT_ROOT/scripts/check-issues.test.sh" "$PROJECT_ROOT/tests/unit/scripts/monitoring/check-issues.test.sh"
        log_success "Moved: scripts/check-issues.test.sh → tests/unit/scripts/monitoring/check-issues.test.sh"
    fi
    
    # Mark migration as applied
    mark_migration_applied
    
    log_success "Migration $MIGRATION_ID completed successfully"
    log_info "Backup available at: $backup_dir"
    log_warning "Next steps: Update package.json script paths and test the new structure"
}

# DOWN migration - rollback the changes
down() {
    log_info "Rolling back migration $MIGRATION_ID: $MIGRATION_NAME"
    
    if ! is_migration_applied; then
        log_warning "Migration $MIGRATION_ID has not been applied"
        return 0
    fi
    
    # Find the most recent backup for this migration
    local backup_dir=$(find "$MIGRATIONS_DIR/backups" -name "$MIGRATION_ID-*" -type d | sort | tail -n 1)
    
    if [[ -z "$backup_dir" ]]; then
        log_error "No backup found for migration $MIGRATION_ID"
        return 1
    fi
    
    # Restore from backup
    restore_backup "$backup_dir"
    
    # Mark migration as rolled back
    mark_migration_rolled_back
    
    log_success "Migration $MIGRATION_ID rolled back successfully"
}

# Status check
status() {
    log_info "Migration Status"
    echo "=================="
    
    if is_migration_applied; then
        log_success "Migration $MIGRATION_ID: APPLIED"
        jq -r ".migrations[] | select(.id == \"$MIGRATION_ID\") | \"Applied at: \" + .applied_at" "$MIGRATION_STATE"
    else
        log_warning "Migration $MIGRATION_ID: NOT APPLIED"
    fi
    
    echo ""
    log_info "Available backups:"
    if [[ -d "$MIGRATIONS_DIR/backups" ]]; then
        find "$MIGRATIONS_DIR/backups" -name "$MIGRATION_ID-*" -type d | sort
    else
        echo "No backups found"
    fi
}

# Main execution
case "${1:-up}" in
    "up")
        up
        ;;
    "down")
        down
        ;;
    "status")
        status
        ;;
    *)
        echo "Usage: $0 [up|down|status]"
        echo "  up     - Apply migration"
        echo "  down   - Rollback migration"
        echo "  status - Check migration status"
        exit 1
        ;;
esac 