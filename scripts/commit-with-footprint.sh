#!/bin/bash

# Batch commit script with file footprint generation
# This script generates a file footprint, stages it, and creates a commit
# with comprehensive information about the changes

set -e

echo "🚀 Starting batch commit with file footprint..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if there are any changes to commit
if ! git diff-index --quiet HEAD --; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Generate timestamp for footprint
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
FOOTPRINT_FILE="fossils/file-footprint-${TIMESTAMP//[:.]/-}.yml"

# Create fossils directory if it doesn't exist
mkdir -p fossils

echo "🔍 Generating file footprint..."

# Get git information
GIT_BRANCH=$(git branch --show-current)
GIT_COMMIT=$(git rev-parse HEAD)
GIT_STATUS=$(git status --porcelain)

# Get last commit information
LAST_COMMIT_HASH=$(git rev-parse HEAD)
LAST_COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
LAST_COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an")
LAST_COMMIT_DATE=$(git log -1 --pretty=format:"%ai")

# Get machine information
HOSTNAME=$(hostname)
USERNAME=$(whoami)
WORKING_DIR=$(pwd)

# Get file statistics
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
UNSTAGED_FILES=$(git diff --name-only 2>/dev/null || echo "")
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null || echo "")

# Count files
STAGED_COUNT=$(echo "$STAGED_FILES" | grep -c . || echo "0")
UNSTAGED_COUNT=$(echo "$UNSTAGED_FILES" | grep -c . || echo "0")
UNTRACKED_COUNT=$(echo "$UNTRACKED_FILES" | grep -c . || echo "0")

# Get line change statistics
LINES_ADDED=0
LINES_DELETED=0

if [ -n "$STAGED_FILES" ]; then
    DIFF_STATS=$(git diff --cached --stat 2>/dev/null || echo "")
    if [ -n "$DIFF_STATS" ]; then
        LINES_ADDED=$(echo "$DIFF_STATS" | tail -1 | grep -o '[0-9]\+ insertions' | grep -o '[0-9]\+' || echo "0")
        LINES_DELETED=$(echo "$DIFF_STATS" | tail -1 | grep -o '[0-9]\+ deletions' | grep -o '[0-9]\+' || echo "0")
    fi
fi

# Generate YAML footprint
cat > "$FOOTPRINT_FILE" << EOF
timestamp: $TIMESTAMP
git:
  branch: $GIT_BRANCH
  commit: $GIT_COMMIT
  status: |
$(echo "$GIT_STATUS" | sed 's/^/    /')
  lastCommit:
    hash: $LAST_COMMIT_HASH
    message: $LAST_COMMIT_MESSAGE
    author: $LAST_COMMIT_AUTHOR
    date: $LAST_COMMIT_DATE
files:
  staged:
$(echo "$STAGED_FILES" | while read -r file; do
  if [ -n "$file" ]; then
    SIZE=$(stat -f%z "$file" 2>/dev/null || echo "0")
    LINES=$(wc -l < "$file" 2>/dev/null || echo "0")
    MODIFIED=$(stat -f%m "$file" 2>/dev/null | xargs -I {} date -r {} -u +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || echo "unknown")
    EXTENSION=$(echo "$file" | sed 's/.*\.//' 2>/dev/null || echo "")
    echo "    - path: $file"
    echo "      status: A"
    echo "      size: $SIZE"
    echo "      lines: $LINES"
    echo "      lastModified: $MODIFIED"
    echo "      type: file"
    if [ -n "$EXTENSION" ]; then
      echo "      extension: $EXTENSION"
    fi
  fi
done)
  unstaged:
$(echo "$UNSTAGED_FILES" | while read -r file; do
  if [ -n "$file" ]; then
    SIZE=$(stat -f%z "$file" 2>/dev/null || echo "0")
    LINES=$(wc -l < "$file" 2>/dev/null || echo "0")
    MODIFIED=$(stat -f%m "$file" 2>/dev/null | xargs -I {} date -r {} -u +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || echo "unknown")
    EXTENSION=$(echo "$file" | sed 's/.*\.//' 2>/dev/null || echo "")
    echo "    - path: $file"
    echo "      status: M"
    echo "      size: $SIZE"
    echo "      lines: $LINES"
    echo "      lastModified: $MODIFIED"
    echo "      type: file"
    if [ -n "$EXTENSION" ]; then
      echo "      extension: $EXTENSION"
    fi
  fi
done)
  untracked:
$(echo "$UNTRACKED_FILES" | while read -r file; do
  if [ -n "$file" ]; then
    SIZE=$(stat -f%z "$file" 2>/dev/null || echo "0")
    LINES=$(wc -l < "$file" 2>/dev/null || echo "0")
    MODIFIED=$(stat -f%m "$file" 2>/dev/null | xargs -I {} date -r {} -u +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || echo "unknown")
    EXTENSION=$(echo "$file" | sed 's/.*\.//' 2>/dev/null || echo "")
    echo "    - path: $file"
    echo "      status: ??"
    echo "      size: $SIZE"
    echo "      lines: $LINES"
    echo "      lastModified: $MODIFIED"
    echo "      type: file"
    if [ -n "$EXTENSION" ]; then
      echo "      extension: $EXTENSION"
    fi
  fi
done)
  all: []
stats:
  totalFiles: $((STAGED_COUNT + UNSTAGED_COUNT + UNTRACKED_COUNT))
  stagedCount: $STAGED_COUNT
  unstagedCount: $UNSTAGED_COUNT
  untrackedCount: $UNTRACKED_COUNT
  totalLinesAdded: $LINES_ADDED
  totalLinesDeleted: $LINES_DELETED
  fileTypes: {}
machine:
  hostname: $HOSTNAME
  username: $USERNAME
  workingDirectory: $WORKING_DIR
  timestamp: $TIMESTAMP
EOF

echo "✅ File footprint generated: $FOOTPRINT_FILE"

# Stage all changes including the footprint
echo "📝 Staging changes..."
git add .

# Generate commit message
COMMIT_MESSAGE="feat: batch commit with file footprint

📊 File Footprint Summary:
- Total files: $((STAGED_COUNT + UNSTAGED_COUNT + UNTRACKED_COUNT))
- Staged: $STAGED_COUNT
- Unstaged: $UNSTAGED_COUNT
- Untracked: $UNTRACKED_COUNT
- Lines added: $LINES_ADDED
- Lines deleted: $LINES_DELETED

🖥️  Machine: $HOSTNAME ($USERNAME)
📁 Working directory: $WORKING_DIR
🕐 Timestamp: $TIMESTAMP

📄 Footprint file: $FOOTPRINT_FILE

$(if [ -n "$STAGED_FILES" ]; then
  echo "📝 Staged files:"
  echo "$STAGED_FILES" | sed 's/^/  - /'
  echo ""
fi)

$(if [ -n "$UNSTAGED_FILES" ]; then
  echo "📝 Unstaged files:"
  echo "$UNSTAGED_FILES" | sed 's/^/  - /'
  echo ""
fi)

$(if [ -n "$UNTRACKED_FILES" ]; then
  echo "📝 Untracked files:"
  echo "$UNTRACKED_FILES" | sed 's/^/  - /'
  echo ""
fi)"

# Create commit
echo "💾 Creating commit..."
git commit -m "$COMMIT_MESSAGE"

echo "✅ Commit created successfully!"
echo "📊 Summary:"
echo "   - Files tracked: $((STAGED_COUNT + UNSTAGED_COUNT + UNTRACKED_COUNT))"
echo "   - Lines changed: +$LINES_ADDED -$LINES_DELETED"
echo "   - Footprint: $FOOTPRINT_FILE"
echo "   - Branch: $GIT_BRANCH" 