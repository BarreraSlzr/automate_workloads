#!/bin/bash

# LLM-powered workflow automation
set -e

WORKFLOW_TYPE="$1"
CONTEXT_FILE="$2"

# Load context for LLM
if [ -f "$CONTEXT_FILE" ]; then
    CONTEXT=$(cat "$CONTEXT_FILE")
else
    CONTEXT=$(bun run context:gather)
fi

# Use LLM to determine workflow steps
WORKFLOW_STEPS=$(bun run llm:plan "$WORKFLOW_TYPE" "$CONTEXT")

# Execute workflow with LLM monitoring
for step in $WORKFLOW_STEPS; do
    echo "Executing step: $step"
    
    # Execute step
    RESULT=$(bun run llm:execute "$step")
    
    # LLM analysis of result
    ANALYSIS=$(bun run llm:analyze "$step" "$RESULT")
    
    # Decide next action based on LLM analysis
    if echo "$ANALYSIS" | grep -q "SUCCESS"; then
        echo "Step completed successfully"
    elif echo "$ANALYSIS" | grep -q "RETRY"; then
        echo "Retrying step with adjustments"
        bun run llm:execute "$step" --retry
    else
        echo "Step failed, stopping workflow"
        bun run llm:analyze --failure "$step" "$ANALYSIS"
        exit 1
    fi
done

echo "✅ LLM workflow completed successfully" 