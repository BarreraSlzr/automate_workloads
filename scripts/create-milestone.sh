#!/bin/bash

# Usage: ./scripts/create-milestone.sh <owner> <repo> <title> <description> <due_on>
# Example: ./scripts/create-milestone.sh BarreraSlzr automate_workloads "My Milestone" "Description" "2025-07-01T23:59:59Z"

OWNER="$1"
REPO="$2"
TITLE="$3"
DESCRIPTION="$4"
DUE_ON="$5"

if [[ -z "$OWNER" || -z "$REPO" || -z "$TITLE" || -z "$DESCRIPTION" || -z "$DUE_ON" ]]; then
  echo "Usage: $0 <owner> <repo> <title> <description> <due_on>"
  exit 1
fi

# Get token from gh CLI
token=$(gh auth token)

if [[ -z "$token" ]]; then
  echo "Could not retrieve GitHub token from gh CLI. Please authenticate with 'gh auth login'."
  exit 1
fi

echo "Creating milestone: $TITLE"
curl -s -X POST \
  -H "Authorization: token $token" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/$REPO/milestones" \
  -d "{\"title\":\"$TITLE\",\"description\":\"$DESCRIPTION\",\"due_on\":\"$DUE_ON\"}"
echo -e "\n"