#!/bin/bash

# LLM-enhanced review workflow
PR_NUMBER="$1"

if [ -z "$PR_NUMBER" ]; then
    echo "❌ Please provide a PR number"
    echo "Usage: $0 <pr-number>"
    exit 1
fi

echo "🔍 Starting LLM-enhanced review for PR #$PR_NUMBER"

# 1. Automated checks
echo "🤖 Running automated checks..."
bun run llm:analyze --pr "$PR_NUMBER"

# 2. Security analysis
echo "🔒 Running security analysis..."
bun run llm:analyze --security --pr "$PR_NUMBER"

# 3. Performance analysis
echo "⚡ Running performance analysis..."
bun run llm:analyze --performance --pr "$PR_NUMBER"

# 4. Code quality analysis
echo "📊 Running code quality analysis..."
bun run llm:analyze --code-quality --pr "$PR_NUMBER"

# 5. Generate review comments
echo "💬 Generating review comments..."
bun run llm:plan review-comments "$PR_NUMBER"

# 6. Update PR status
echo "📊 Updating PR status..."
bun run llm:execute --update-pr-status "$PR_NUMBER"

# 7. Generate summary
echo "📋 Generating review summary..."
bun run llm:analyze --review-summary "$PR_NUMBER"

echo "✅ Review workflow completed for PR #$PR_NUMBER" 