#!/bin/bash

# Commit Essential Files First
# This script commits the most critical files to stabilize the git state
# and avoid surprises during the stabilization process.

set -e

echo "🔒 Committing essential files to stabilize git state..."

# Create backup branch first
BACKUP_BRANCH="emergency-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup branch: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# Essential files that should be committed first
ESSENTIAL_FILES=(
  "fossils/roadmap.yml"
  "fossils/project_status.yml"
  "fossils/setup_status.yml"
  "fossils/basement_stabilization_plan.yml"
  "scripts/smart-pre-commit-stabilization.ts"
  "scripts/commit-essential-files.sh"
  ".github/FUNDING.yml"
  "LICENSE"
)

# Check which essential files are staged
STAGED_ESSENTIAL=()
for file in "${ESSENTIAL_FILES[@]}"; do
  if git diff --cached --name-only | grep -q "^$file$"; then
    STAGED_ESSENTIAL+=("$file")
    echo "✅ Found staged essential file: $file"
  fi
done

if [ ${#STAGED_ESSENTIAL[@]} -eq 0 ]; then
  echo "⚠️ No essential files found in staged changes"
  echo "📋 Current staged files:"
  git diff --cached --name-only | head -10
  exit 0
fi

# Commit essential files
echo "🚀 Committing ${#STAGED_ESSENTIAL[@]} essential files..."

# Create commit message
COMMIT_MSG="feat(stabilization): commit essential files for git state stabilization

- Committed critical project files to stabilize git state
- Backup branch created: $BACKUP_BRANCH
- Essential files: ${STAGED_ESSENTIAL[*]}

This commit ensures critical project state is preserved
before proceeding with stabilization operations."

# Commit the essential files
git commit -m "$COMMIT_MSG"

echo "✅ Essential files committed successfully!"
echo "📋 Commit hash: $(git rev-parse HEAD)"
echo "📦 Backup branch: $BACKUP_BRANCH"
echo "📊 Remaining staged files: $(git status --porcelain | grep "^[AM]" | wc -l)"

# Show remaining staged files
echo "📋 Remaining staged files:"
git status --porcelain | grep "^[AM]" | head -10

echo "🎯 Next steps:"
echo "1. Run: bun run scripts/smart-pre-commit-stabilization.ts"
echo "2. Review remaining staged files"
echo "3. Continue with stabilization process" 