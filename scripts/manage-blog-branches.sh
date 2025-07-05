#!/bin/bash
# Blog Branch Management Script
# Prevents blog content from being pushed to main repository

set -e

BLOG_BRANCH="blog-content"
DRAFTS_BRANCH="blog-drafts"
PUBLISHED_BRANCH="blog-published"

function create_blog_branches() {
    echo "Creating blog branch structure..."
    
    # Create blog-content branch from main
    git checkout -b $BLOG_BRANCH main
    
    # Add blog content to this branch
    git add docs/blog/
    git commit -m "feat(blog): initialize blog content structure"
    
    # Create drafts branch
    git checkout -b $DRAFTS_BRANCH $BLOG_BRANCH
    
    # Create published branch
    git checkout -b $PUBLISHED_BRANCH $BLOG_BRANCH
    
    echo "Blog branches created successfully!"
}

function switch_to_blog_branch() {
    local branch=${1:-$BLOG_BRANCH}
    git checkout $branch
    echo "Switched to blog branch: $branch"
}

function publish_blog_post() {
    local post_file=$1
    local target_branch=${2:-$PUBLISHED_BRANCH}
    
    if [ ! -f "$post_file" ]; then
        echo "Error: Blog post file not found: $post_file"
        exit 1
    fi
    
    # Switch to published branch
    git checkout $target_branch
    
    # Copy post to published location
    cp "$post_file" "docs/blog/published/"
    
    # Commit the publication
    git add "docs/blog/published/"
    git commit -m "publish(blog): publish $(basename $post_file)"
    
    echo "Blog post published to $target_branch"
}

function sync_blog_content() {
    # Sync from main to blog branches
    git checkout $BLOG_BRANCH
    git merge main --no-edit
    
    # Update drafts
    git checkout $DRAFTS_BRANCH
    git merge $BLOG_BRANCH --no-edit
    
    # Update published
    git checkout $PUBLISHED_BRANCH
    git merge $BLOG_BRANCH --no-edit
    
    echo "Blog content synced across branches"
}

# Main script logic
case "${1:-help}" in
    "create")
        create_blog_branches
        ;;
    "switch")
        switch_to_blog_branch "$2"
        ;;
    "publish")
        publish_blog_post "$2" "$3"
        ;;
    "sync")
        sync_blog_content
        ;;
    *)
        echo "Usage: $0 {create|switch|publish|sync}"
        echo "  create              - Create blog branch structure"
        echo "  switch [branch]     - Switch to blog branch"
        echo "  publish <file> [branch] - Publish blog post"
        echo "  sync                - Sync content across branches"
        ;;
esac 