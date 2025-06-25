#!/bin/bash
# Migration Runner
# Usage: ./scripts/migrate.sh [up|down|status] [migration-id]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[MIGRATE]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[MIGRATE]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[MIGRATE]${NC} $1"
}

log_error() {
    echo -e "${RED}[MIGRATE]${NC} $1"
}

# Get all migration files
get_migrations() {
    find "$MIGRATIONS_DIR" -type f \( -name "*.sh" -o -name "*.ts" \) | grep -E '[0-9]+-.*\.(sh|ts)$' | sort
}

# Get migration ID from filename
get_migration_id() {
    local file="$1"
    basename "$file" | cut -d'-' -f1
}

# Check if migration is applied
is_migration_applied() {
    local migration_id="$1"
    local state_file="$MIGRATIONS_DIR/migration-state.json"
    
    if [[ -f "$state_file" ]]; then
        jq -e ".migrations[] | select(.id == \"$migration_id\")" "$state_file" >/dev/null 2>&1
    else
        return 1
    fi
}

# Run migration up
migrate_up() {
    local target_migration="${1:-}"
    
    log_info "Running migrations UP"
    echo "========================"
    
    local migrations=$(get_migrations)
    local applied_count=0
    
    for migration_file in $migrations; do
        local migration_id=$(get_migration_id "$migration_file")
        
        # Skip if specific migration is requested and this isn't it
        if [[ -n "$target_migration" && "$migration_id" != "$target_migration" ]]; then
            continue
        fi
        
        # Skip if already applied
        if is_migration_applied "$migration_id"; then
            log_warning "Migration $migration_id already applied, skipping"
            continue
        fi
        
        log_info "Applying migration $migration_id..."
        
        if [[ "$migration_file" == *.sh ]]; then
            if bash "$migration_file" up; then
                log_success "Migration $migration_id applied successfully"
                ((applied_count++))
            else
                log_error "Migration $migration_id failed"
                exit 1
            fi
        elif [[ "$migration_file" == *.ts ]]; then
            if bun run "$migration_file" up; then
                log_success "Migration $migration_id applied successfully"
                ((applied_count++))
            else
                log_error "Migration $migration_id failed"
                exit 1
            fi
        else
            log_error "Unknown migration file type: $migration_file"
            exit 1
        fi
        
        echo ""
    done
    
    if [[ $applied_count -eq 0 ]]; then
        log_warning "No migrations were applied"
    else
        log_success "Applied $applied_count migration(s)"
    fi
}

# Run migration down
migrate_down() {
    local target_migration="${1:-}"
    
    log_info "Running migrations DOWN"
    echo "=========================="
    
    local migrations=$(get_migrations | tac)  # Reverse order for rollback
    local rolled_back_count=0
    
    for migration_file in $migrations; do
        local migration_id=$(get_migration_id "$migration_file")
        
        # Skip if specific migration is requested and this isn't it
        if [[ -n "$target_migration" && "$migration_id" != "$target_migration" ]]; then
            continue
        fi
        
        # Skip if not applied
        if ! is_migration_applied "$migration_id"; then
            log_warning "Migration $migration_id not applied, skipping"
            continue
        fi
        
        log_info "Rolling back migration $migration_id..."
        
        if [[ "$migration_file" == *.sh ]]; then
            if bash "$migration_file" down; then
                log_success "Migration $migration_id rolled back successfully"
                ((rolled_back_count++))
            else
                log_error "Migration $migration_id rollback failed"
                exit 1
            fi
        elif [[ "$migration_file" == *.ts ]]; then
            if bun run "$migration_file" down; then
                log_success "Migration $migration_id rolled back successfully"
                ((rolled_back_count++))
            else
                log_error "Migration $migration_id rollback failed"
                exit 1
            fi
        else
            log_error "Unknown migration file type: $migration_file"
            exit 1
        fi
        
        echo ""
    done
    
    if [[ $rolled_back_count -eq 0 ]]; then
        log_warning "No migrations were rolled back"
    else
        log_success "Rolled back $rolled_back_count migration(s)"
    fi
}

# Show migration status
migrate_status() {
    log_info "Migration Status"
    echo "=================="
    
    local state_file="$MIGRATIONS_DIR/migration-state.json"
    local applied_migrations=()
    
    if [[ -f "$state_file" ]]; then
        applied_migrations=($(jq -r '.migrations[].id' "$state_file" 2>/dev/null || true))
    fi
    
    local migrations=$(get_migrations)
    local total_count=0
    local applied_count=0
    
    for migration_file in $migrations; do
        local migration_id=$(get_migration_id "$migration_file")
        local migration_name=$(basename "$migration_file" .sh | cut -d'-' -f2-)
        
        ((total_count++))
        
        if [[ " ${applied_migrations[@]} " =~ " ${migration_id} " ]]; then
            log_success "[$migration_id] $migration_name - APPLIED"
            ((applied_count++))
        else
            log_warning "[$migration_id] $migration_name - PENDING"
        fi
    done
    
    echo ""
    log_info "Summary: $applied_count/$total_count migrations applied"
    
    if [[ -f "$state_file" ]]; then
        echo ""
        log_info "Applied migrations details:"
        jq -r '.migrations[] | "  \(.id): \(.name) - \(.applied_at)"' "$state_file" 2>/dev/null || true
    fi
}

# Show available migrations
migrate_list() {
    log_info "Available Migrations"
    echo "======================"
    
    local migrations=$(get_migrations)
    
    for migration_file in $migrations; do
        local migration_id=$(get_migration_id "$migration_file")
        local migration_name=$(basename "$migration_file" .sh | cut -d'-' -f2-)
        
        if is_migration_applied "$migration_id"; then
            log_success "[$migration_id] $migration_name"
        else
            log_warning "[$migration_id] $migration_name"
        fi
    done
}

# Main execution
case "${1:-status}" in
    "up")
        migrate_up "$2"
        ;;
    "down")
        migrate_down "$2"
        ;;
    "status")
        migrate_status
        ;;
    "list")
        migrate_list
        ;;
    *)
        echo "Usage: $0 [up|down|status|list] [migration-id]"
        echo ""
        echo "Commands:"
        echo "  up [id]     - Apply all pending migrations (or specific migration)"
        echo "  down [id]   - Rollback all applied migrations (or specific migration)"
        echo "  status      - Show migration status"
        echo "  list        - List all available migrations"
        echo ""
        echo "Examples:"
        echo "  $0 up              # Apply all pending migrations"
        echo "  $0 up 001          # Apply specific migration"
        echo "  $0 down            # Rollback all migrations"
        echo "  $0 down 001        # Rollback specific migration"
        echo "  $0 status          # Show current status"
        exit 1
        ;;
esac 