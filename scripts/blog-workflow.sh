#!/bin/bash
# Blog Workflow Script
# Manages blog posts locally without affecting main repository

set -e

BLOG_DIR="docs/blog"
DRAFTS_DIR="$BLOG_DIR/drafts"
PUBLISHED_DIR="$BLOG_DIR/published"

function create_new_post() {
    local title=$1
    local platform=${2:-"general"}
    local date=$(date +%Y-%m-%d)
    
    # Create filename
    local filename=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
    local filepath="$DRAFTS_DIR/${date}-${filename}.md"
    
    # Create post template
    cat > "$filepath" << EOF
---
title: "$title"
description: "Description for $title"
date: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
author: "Emmanuel Barrera"
tags: ["$platform", "automation", "developer-tools"]
platform: "$platform"
---

# $title

> **🧲 SEO gets them in the door. Great content makes them stay, talk, and return.**

## Introduction

[Your introduction here]

## Main Content

[Your main content here]

## Conclusion

[Your conclusion here]

---

## Resources

- 📚 [Documentation](https://automateworkloads.com/docs)
- 🐙 [GitHub Repository](https://github.com/BarreraSlzr/automate_workloads)
- 💬 [Community](https://discord.gg/automate-workloads)

**Share this post if you found it helpful!** 🚀
EOF

    echo "Created new blog post: $filepath"
    echo "Switch to blog branch to edit: ./scripts/manage-blog-branches.sh switch blog-drafts"
}

function list_posts() {
    echo "=== Draft Posts ==="
    find "$DRAFTS_DIR" -name "*.md" -type f 2>/dev/null | sort || echo "No drafts found"
    
    echo -e "\n=== Published Posts ==="
    find "$PUBLISHED_DIR" -name "*.md" -type f 2>/dev/null | sort || echo "No published posts found"
}

function publish_post() {
    local draft_file=$1
    local target_platform=${2:-"all"}
    
    if [ ! -f "$draft_file" ]; then
        echo "Error: Draft file not found: $draft_file"
        exit 1
    fi
    
    # Switch to blog branch
    ./scripts/manage-blog-branches.sh switch blog-content
    
    # Copy to published
    local filename=$(basename "$draft_file")
    cp "$draft_file" "$PUBLISHED_DIR/"
    
    # Commit the publication
    git add "$PUBLISHED_DIR/$filename"
    git commit -m "publish(blog): publish $filename"
    
    echo "Published: $filename"
    echo "Ready for deployment to $target_platform"
}

function deploy_to_platform() {
    local platform=$1
    local post_file=$2
    
    case $platform in
        "medium")
            echo "Deploying to Medium..."
            # Add Medium deployment logic
            ;;
        "dev.to")
            echo "Deploying to Dev.to..."
            # Add Dev.to deployment logic
            ;;
        "linkedin")
            echo "Deploying to LinkedIn..."
            # Add LinkedIn deployment logic
            ;;
        "twitter")
            echo "Deploying to Twitter..."
            # Add Twitter deployment logic
            ;;
        *)
            echo "Unknown platform: $platform"
            exit 1
            ;;
    esac
}

# Main script logic
case "${1:-help}" in
    "new")
        create_new_post "$2" "$3"
        ;;
    "list")
        list_posts
        ;;
    "publish")
        publish_post "$2" "$3"
        ;;
    "deploy")
        deploy_to_platform "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {new|list|publish|deploy}"
        echo "  new <title> [platform]    - Create new blog post"
        echo "  list                      - List all posts"
        echo "  publish <file> [platform] - Publish draft post"
        echo "  deploy <platform> <file>  - Deploy to platform"
        ;;
esac 