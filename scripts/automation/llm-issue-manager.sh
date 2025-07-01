#!/bin/bash

# LLM-powered issue management
set -e

ISSUE_ACTION="$1"
ISSUE_DATA="$2"

case "$ISSUE_ACTION" in
    "analyze")
        # LLM analysis of issue patterns
        echo "🔍 Analyzing issue patterns..."
        bun run llm:analyze --issues "$ISSUE_DATA"
        ;;
    "prioritize")
        # LLM-powered issue prioritization
        echo "📊 Prioritizing issues..."
        bun run llm:plan prioritize "$ISSUE_DATA"
        ;;
    "assign")
        # LLM-powered issue assignment
        echo "👥 Assigning issues..."
        bun run llm:execute --assign "$ISSUE_DATA"
        ;;
    "escalate")
        # LLM-powered issue escalation
        echo "🚨 Escalating issues..."
        bun run llm:analyze --escalate "$ISSUE_DATA"
        ;;
    "sync")
        # Sync issues across platforms
        echo "🔄 Syncing issues..."
        bun run github:sync
        bun run obsidian:sync
        ;;
    *)
        echo "❌ Unknown action: $ISSUE_ACTION"
        echo "Available actions: analyze, prioritize, assign, escalate, sync"
        exit 1
        ;;
esac

echo "✅ Issue management completed" 