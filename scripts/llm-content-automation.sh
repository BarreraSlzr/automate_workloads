#!/bin/bash

# LLM-powered content automation
CONTENT_TYPE="$1"
TOPIC="$2"
PLATFORMS="$3"

if [ -z "$CONTENT_TYPE" ] || [ -z "$TOPIC" ]; then
    echo "❌ Please provide content type and topic"
    echo "Usage: $0 <content-type> <topic> [platforms]"
    echo "Example: $0 'blog-post' 'AI automation' 'twitter,linkedin,medium'"
    exit 1
fi

echo "🤖 Starting LLM-powered content automation..."
echo "Content Type: $CONTENT_TYPE"
echo "Topic: $TOPIC"
echo "Platforms: ${PLATFORMS:-'all'}"

# Generate content with LLM
echo "📝 Generating content..."
CONTENT=$(bun run llm:plan --generate-content "$CONTENT_TYPE" "$TOPIC")

# Optimize for each platform
if [ -n "$PLATFORMS" ]; then
    IFS=',' read -ra PLATFORM_ARRAY <<< "$PLATFORMS"
    for platform in "${PLATFORM_ARRAY[@]}"; do
        echo "🎯 Optimizing for $platform..."
        OPTIMIZED_CONTENT=$(bun run llm:execute --optimize-content "$CONTENT" "$platform")
        
        # Schedule content
        echo "📅 Scheduling content for $platform..."
        bun run llm:execute --schedule-content "$platform" "$OPTIMIZED_CONTENT"
        
        echo "✅ Content scheduled for $platform"
    done
else
    # Default platforms
    for platform in "twitter" "linkedin" "medium" "obsidian"; do
        echo "🎯 Optimizing for $platform..."
        OPTIMIZED_CONTENT=$(bun run llm:execute --optimize-content "$CONTENT" "$platform")
        
        # Schedule content
        echo "📅 Scheduling content for $platform..."
        bun run llm:execute --schedule-content "$platform" "$OPTIMIZED_CONTENT"
        
        echo "✅ Content scheduled for $platform"
    done
fi

# Generate cross-platform summary
echo "📊 Generating cross-platform summary..."
bun run llm:analyze --content-summary "$CONTENT" "$PLATFORMS"

# Sync with content management systems
echo "🔄 Syncing with content management systems..."
bun run obsidian:sync
bun run social:sync

echo "✅ Content automation completed" 