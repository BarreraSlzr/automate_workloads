#!/bin/bash

# Context Data Backup Script
# Backs up context fossil storage and orchestration reports

set -e

# Configuration
BACKUP_DIR="./context-backups"
CONTEXT_DIRS=(".context-fossil" ".orchestration-reports")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="context-backup-${TIMESTAMP}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if context directories exist
check_context_dirs() {
    local missing_dirs=()
    
    for dir in "${CONTEXT_DIRS[@]}"; do
        if [[ ! -d "$dir" ]]; then
            missing_dirs+=("$dir")
        fi
    done
    
    if [[ ${#missing_dirs[@]} -eq ${#CONTEXT_DIRS[@]} ]]; then
        log_warning "No context directories found. Nothing to backup."
        exit 0
    elif [[ ${#missing_dirs[@]} -gt 0 ]]; then
        log_warning "Some context directories missing: ${missing_dirs[*]}"
    fi
}

# Create backup directory
create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Create backup
create_backup() {
    log_info "Creating backup: $BACKUP_NAME"
    
    # Build tar command with existing directories only
    local tar_args=()
    for dir in "${CONTEXT_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            tar_args+=("$dir")
        fi
    done
    
    if [[ ${#tar_args[@]} -eq 0 ]]; then
        log_error "No context directories to backup"
        exit 1
    fi
    
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" "${tar_args[@]}"
    
    if [[ $? -eq 0 ]]; then
        log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_error "Failed to create backup"
        exit 1
    fi
}

# Show backup info
show_backup_info() {
    local backup_size=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    local total_size=$(du -sh .context-fossil .orchestration-reports 2>/dev/null | awk '{sum+=$1} END {print sum "K"}' || echo "0K")
    
    echo ""
    log_info "Backup Information:"
    echo "  📁 Backup file: $BACKUP_DIR/$BACKUP_NAME"
    echo "  📊 Backup size: $backup_size"
    echo "  📈 Total context size: $total_size"
    echo "  🕐 Created: $(date)"
    echo ""
}

# List existing backups
list_backups() {
    if [[ -d "$BACKUP_DIR" ]] && [[ "$(ls -A $BACKUP_DIR 2>/dev/null)" ]]; then
        log_info "Existing backups:"
        ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
            echo "  📦 $line"
        done
        echo ""
    else
        log_info "No existing backups found"
    fi
}

# Clean old backups
clean_old_backups() {
    local days=${1:-30}
    log_info "Cleaning backups older than $days days"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$days -delete 2>/dev/null || true
        log_success "Old backups cleaned"
    fi
}

# Main execution
main() {
    echo "🗿 Context Data Backup Script"
    echo "=============================="
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --list)
                list_backups
                exit 0
                ;;
            --clean)
                clean_old_backups "$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --list          List existing backups"
                echo "  --clean DAYS    Clean backups older than DAYS (default: 30)"
                echo "  --help, -h      Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                    # Create backup"
                echo "  $0 --list            # List existing backups"
                echo "  $0 --clean 7         # Clean backups older than 7 days"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Perform backup
    check_context_dirs
    create_backup_dir
    create_backup
    show_backup_info
    list_backups
    
    log_success "Backup completed successfully!"
}

# Run main function
main "$@" 