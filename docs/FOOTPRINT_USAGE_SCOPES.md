# File Footprint Usage Scopes

## Overview

The File Footprint System is **not limited to commit context only**. It's designed to be a comprehensive tracking system that can be used across multiple development scenarios and contexts.

## Usage Scopes

### 1. **Commit Context** (Pre-Commit & Post-Commit)

#### Pre-Commit Footprints
```bash
# Automatic pre-commit generation
bun run precommit:unified

# Manual pre-commit
git add .
bun run precommit:unified
git commit -m "feat: add new feature"
```

**Purpose**: Track what's being committed
- **When**: Before each commit
- **Scope**: Staged, unstaged, and untracked files
- **Output**: Added to commit as fossil
- **Use Case**: Commit audit trail and context provenance

> **Note:** Legacy pre-commit scripts have been removed. Use only the unified entry point (`bun run precommit:unified`) for all pre-commit logic.

#### Post-Commit Footprints
```bash
# Generate footprint after commit
git commit -m "feat: add new feature"
bun run footprint:generate --output fossils/post-commit-$(date +%Y%m%d-%H%M%S).yml
```

**Purpose**: Document final commit state
- **When**: After commit is complete
- **Scope**: Repository state after commit
- **Output**: Standalone fossil for historical reference

### 2. **Development Session Context**

#### Session Start Footprint
```bash
# Generate footprint when starting development session
bun run footprint:generate --output fossils/session-start-$(date +%Y%m%d-%H%M%S).yml
```

**Purpose**: Document initial state
- **When**: Beginning of development session
- **Scope**: Current repository state
- **Use Case**: Session tracking and rollback points

#### Session End Footprint
```bash
# Generate footprint when ending development session
bun run footprint:generate --output fossils/session-end-$(date +%Y%m%d-%H%M%S).yml
```

**Purpose**: Document final session state
- **When**: End of development session
- **Scope**: All changes made during session
- **Use Case**: Session summary and progress tracking

### 3. **Feature Development Context**

#### Feature Start Footprint
```bash
# Create feature branch and document starting point
git checkout -b feature/new-feature
bun run footprint:generate --output fossils/features/new-feature-start.yml
```

**Purpose**: Document feature starting point
- **When**: Beginning feature development
- **Scope**: Repository state before feature work
- **Use Case**: Feature progress tracking and rollback

#### Feature Progress Footprints
```bash
# Generate progress snapshots during feature development
bun run footprint:generate --output fossils/features/new-feature-progress-$(date +%Y%m%d-%H%M%S).yml
```

**Purpose**: Track feature development progress
- **When**: Regular intervals during feature development
- **Scope**: Current feature state
- **Use Case**: Progress monitoring and debugging

#### Feature Complete Footprint
```bash
# Document feature completion
bun run footprint:generate --output fossils/features/new-feature-complete.yml
```

**Purpose**: Document completed feature state
- **When**: Feature development complete
- **Scope**: Final feature state
- **Use Case**: Feature documentation and handoff

### 4. **Code Review Context**

#### Pre-Review Footprint
```bash
# Generate footprint before code review
bun run footprint:generate --output fossils/reviews/pr-123-pre-review.yml
```

**Purpose**: Document state before review
- **When**: Before submitting for review
- **Scope**: All changes in PR
- **Use Case**: Review context and comparison

#### Post-Review Footprint
```bash
# Generate footprint after addressing review comments
bun run footprint:generate --output fossils/reviews/pr-123-post-review.yml
```

**Purpose**: Document state after review
- **When**: After addressing review feedback
- **Scope**: Final PR state
- **Use Case**: Review completion tracking

### 5. **Release Context**

#### Release Candidate Footprint
```bash
# Generate footprint for release candidate
bun run footprint:generate --output fossils/releases/v1.2.3-rc1.yml
```

**Purpose**: Document release candidate state
- **When**: Before release candidate testing
- **Scope**: Complete release state
- **Use Case**: Release tracking and rollback

#### Release Final Footprint
```bash
# Generate footprint for final release
bun run footprint:generate --output fossils/releases/v1.2.3-final.yml
```

**Purpose**: Document final release state
- **When**: Before final release
- **Scope**: Production-ready state
- **Use Case**: Release documentation and audit

### 6. **Debugging Context**

#### Before Debug Footprint
```bash
# Generate footprint before debugging session
bun run footprint:generate --output fossils/debug/issue-456-before.yml
```

**Purpose**: Document state before debugging
- **When**: Before starting debug session
- **Scope**: Current problematic state
- **Use Case**: Debug context and rollback

#### After Debug Footprint
```bash
# Generate footprint after fixing issue
bun run footprint:generate --output fossils/debug/issue-456-after.yml
```

**Purpose**: Document fixed state
- **When**: After resolving issue
- **Scope**: Fixed state
- **Use Case**: Issue resolution documentation

### 7. **CI/CD Pipeline Context**

#### Build Start Footprint
```bash
# Generate footprint at start of CI/CD pipeline
bun run footprint:generate --output fossils/ci/build-$(BUILD_ID)-start.yml
```

**Purpose**: Document build starting state
- **When**: Start of CI/CD pipeline
- **Scope**: Repository state at build start
- **Use Case**: Build tracking and debugging

#### Build Complete Footprint
```bash
# Generate footprint at end of CI/CD pipeline
bun run footprint:generate --output fossils/ci/build-$(BUILD_ID)-complete.yml
```

**Purpose**: Document build completion state
- **When**: End of CI/CD pipeline
- **Scope**: Final build state
- **Use Case**: Build verification and audit

### 8. **Scheduled/Periodic Context**

#### Daily Footprint
```bash
# Generate daily development snapshot
bun run footprint:generate --output fossils/daily/$(date +%Y-%m-%d).yml
```

**Purpose**: Daily development tracking
- **When**: End of each day
- **Scope**: Daily development progress
- **Use Case**: Progress tracking and reporting

#### Weekly Footprint
```bash
# Generate weekly development summary
bun run footprint:generate --output fossils/weekly/week-$(date +%Y-W%U).yml
```

**Purpose**: Weekly development summary
- **When**: End of each week
- **Scope**: Weekly development progress
- **Use Case**: Progress reporting and planning

## Advanced Usage Patterns

### 1. **Comparative Analysis**

```bash
# Generate footprints for comparison
bun run footprint:generate --output fossils/comparison/before-refactor.yml
# ... make changes ...
bun run footprint:generate --output fossils/comparison/after-refactor.yml

# Compare footprints
bun run footprint:validate --footprint fossils/comparison/before-refactor.yml
bun run footprint:validate --footprint fossils/comparison/after-refactor.yml
```

### 2. **Rollback Points**

```bash
# Create rollback point
bun run footprint:generate --output fossils/rollbacks/stable-point-$(date +%Y%m%d-%H%M%S).yml

# Later, use for rollback
git reset --hard $(grep "commit:" fossils/rollbacks/stable-point-*.yml | head -1 | cut -d: -f2 | tr -d ' ')
```

### 3. **Team Collaboration**

```bash
# Generate team handoff footprint
bun run footprint:generate --output fossils/handoffs/$(whoami)-$(date +%Y%m%d-%H%M%S).yml

# Share with team member
git add fossils/handoffs/
git commit -m "feat: add handoff footprint for $(whoami)"
```

### 4. **Audit Trail**

```bash
# Generate audit footprint
bun run footprint:generate --output fossils/audit/audit-$(date +%Y%m%d-%H%M%S).yml --validate --test

# Archive for compliance
tar -czf fossils/audit/audit-$(date +%Y%m%d-%H%M%S).tar.gz fossils/audit/audit-*.yml
```

## Integration with Existing Workflows

### 1. **Git Hooks Integration**

```bash
# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
bun run precommit:unified
EOF

# Post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
bun run footprint:generate --output fossils/post-commit-$(date +%Y%m%d-%H%M%S).yml
EOF
```

### 2. **IDE Integration**

```bash
# VS Code task
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generate Footprint",
      "type": "shell",
      "command": "bun run footprint:generate",
      "group": "build"
    }
  ]
}
```

### 3. **Cron Jobs**

```bash
# Daily snapshot
0 18 * * * cd /path/to/project && bun run footprint:generate --output fossils/daily/$(date +%Y-%m-%d).yml

# Weekly summary
0 17 * * 5 cd /path/to/project && bun run footprint:generate --output fossils/weekly/week-$(date +%Y-W%U).yml
```

## Benefits of Multi-Context Usage

### 1. **Complete Traceability**
- Track development from start to finish
- Document every significant milestone
- Maintain complete audit trail

### 2. **Debugging Support**
- Rollback to any known good state
- Compare states before and after changes
- Identify when issues were introduced

### 3. **Team Collaboration**
- Share context with team members
- Document handoff points
- Maintain development continuity

### 4. **Compliance and Audit**
- Meet regulatory requirements
- Maintain development audit trail
- Document decision points

### 5. **Progress Tracking**
- Monitor development progress
- Track feature completion
- Generate progress reports

## Conclusion

The File Footprint System is **much more than just commit context**. It's a comprehensive development tracking system that can be used throughout the entire development lifecycle, from initial development sessions to final releases, providing complete traceability and context preservation at every step. 