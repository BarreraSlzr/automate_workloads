#!/bin/bash

# LLM-enhanced QA workflow
set -e

echo "🧪 Starting LLM-enhanced QA workflow..."

# 1. Code analysis
echo "📊 Analyzing code quality..."
bun run llm:analyze --code-quality

# 2. Test generation
echo "🔧 Generating tests..."
bun run llm:plan generate-tests

# 3. Test execution
if [[ "$SKIP_BUN_TEST" != "1" ]]; then
  echo "🚀 Running tests..."
  bun run test
else
  echo "🚀 Skipping bun run test (detected SKIP_BUN_TEST=1)"
fi

# 4. Test analysis
echo "📈 Analyzing test results..."
bun run llm:analyze --test-results

# 5. Quality report
echo "📋 Generating quality report..."
bun run llm:analyze --quality-report

# 6. Security analysis
echo "🔒 Running security analysis..."
bun run llm:analyze --security

# 7. Performance analysis
echo "⚡ Running performance analysis..."
bun run llm:analyze --performance

echo "✅ QA workflow completed" 