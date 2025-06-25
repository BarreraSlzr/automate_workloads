#!/bin/bash
# Usage: bun run scripts/check-issues.sh [label] [milestone]

LABEL="$1"
MILESTONE="$2"

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Listing issues for repo: $REPO"
if [[ -n "$LABEL" ]]; then
  echo "With label: $LABEL"
  gh issue list --label "$LABEL"
fi
if [[ -n "$MILESTONE" ]]; then
  echo "With milestone: $MILESTONE"
  gh issue list --milestone "$MILESTONE"
fi
if [[ -z "$LABEL" && -z "$MILESTONE" ]]; then
  gh issue list
fi 