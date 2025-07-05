# Batch Commit Orchestration Guide

## 🎯 Overview

The **Batch Commit Orchestrator** is a comprehensive automation tool that safely manages batch commits with built-in safety checks and user approval workflows. It ensures no commits happen without explicit user approval while providing powerful automation capabilities.

## 🚀 Quick Start

### 1. **Dry Run (Recommended First Step)**
```bash
# See what would be committed without making any changes
bun run commit:batch:dry-run

# Or with custom batch size
./scripts/automation/batch-commit-orchestrator.sh --dry-run --batch-size 3
```

### 2. **Validate Only**
```bash
# Run all validation checks without committing
bun run commit:batch:validate
```

### 3. **Commit Ready Files**
```bash
# Commit only staged files (marked as ready)
bun run commit:batch:ready
```

### 4. **Commit All Changes**
```bash
# Commit all staged, unstaged, and untracked files
bun run commit:batch:all
```

## 📋 Available Commands

### Package.json Scripts
```bash
bun run commit:batch              # Show help and options
bun run commit:batch:dry-run      # Dry run mode
bun run commit:batch:validate     # Validation only
bun run commit:batch:ready        # Commit ready files
bun run commit:batch:all          # Commit all changes
```

### Direct Script Usage
```bash
./scripts/automation/batch-commit-orchestrator.sh [options]
```

## 🔧 Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Show what would be committed without committing | `--dry-run` |
| `--validate-only` | Run validation checks only | `--validate-only` |
| `--commit-ready` | Commit only staged files | `--commit-ready` |
| `--commit-all` | Commit all changes | `--commit-all` |
| `--batch-size <N>` | Number of files per commit (default: 5) | `--batch-size 3` |
| `--skip-tests` | Skip running tests before commit | `--skip-tests` |
| `--skip-validation` | Skip validation checks | `--skip-validation` |
| `--force` | Skip all safety checks (use with caution) | `--force` |

## 🛡️ Safety Features

### 1. **No Automatic Commits**
- Every commit requires explicit user approval
- Interactive prompts for each batch
- Clear display of what will be committed

### 2. **Pre-commit Validation**
- TypeScript compilation checks
- Pre-commit validation scripts
- Test suite execution
- Fossil validation

### 3. **Batch Size Limits**
- Configurable batch sizes to prevent overwhelming commits
- Progress tracking for large operations
- Clear batch boundaries

### 4. **File Analysis**
- Categorizes files by type (staged, unstaged, untracked)
- Shows file counts and lists
- Identifies potential issues

## 📊 Current Status Analysis

Based on the current git status, here's what we have:

### ✅ **Ready for Commit (Staged Files)**
- **32 files** are currently staged and ready for commit
- These include:
  - New CLI commands (fossil-summary, fossilize-performance, etc.)
  - LLM snapshot audit system
  - Documentation updates
  - Core infrastructure improvements

### 📝 **Pending Changes (Unstaged Files)**
- **15 files** have unstaged changes
- These include:
  - Type and schema updates
  - Service improvements
  - Test updates

### 🆕 **New Files (Untracked)**
- **45 files** are untracked
- These include:
  - New documentation guides
  - Example scripts
  - Test files
  - Performance logs

## 🎯 Recommended Workflow

### Phase 1: Analysis and Validation
```bash
# 1. Run dry run to see what would be committed
bun run commit:batch:dry-run

# 2. Run validation to ensure everything is ready
bun run commit:batch:validate
```

### Phase 2: Commit Ready Files
```bash
# 3. Commit the staged files (these are ready)
bun run commit:batch:ready
```

### Phase 3: Review and Commit Remaining
```bash
# 4. Review unstaged and untracked files
git status

# 5. Stage additional files if needed
git add <specific-files>

# 6. Commit remaining changes
bun run commit:batch:ready
```

## 🔍 Detailed File Analysis

### Staged Files (Ready for Commit)
```
✅ .husky/pre-commit
✅ COMMIT_BATCH_SUMMARY.md
✅ bun.lock
✅ docs/LLM_ERROR_PREVENTION_SUMMARY.md
✅ docs/LLM_SNAPSHOT_AUDIT_GUIDE.md
✅ docs/LLM_SNAPSHOT_STRUCTURE_ANALYSIS.md
✅ fossils/audit/llm-snapshot-audit-2025-07-05T07-48-37-635Z.json
✅ fossils/audit/llm-snapshot-audit-2025-07-05T07-49-57-777Z.md
✅ fossils/chat_context.json
✅ fossils/curated_roadmap_canonical.json
✅ fossils/curated_roadmap_demo.json
✅ fossils/project_status.yml
✅ fossils/setup_status.yml
✅ package.json
✅ scripts/audit-llm-snapshots.ts
✅ scripts/llm-chat-context.ts
✅ scripts/precommit-validate.ts
✅ src/cli/fossil-summary.ts
✅ src/cli/fossilize-performance.ts
✅ src/cli/fossilize-validation.ts
✅ src/cli/llm-snapshot.ts
✅ src/cli/validate-types-schemas.ts
✅ src/cli/performance-monitor.ts
✅ src/services/llm.ts
✅ src/services/llmEnhanced.ts
✅ src/types/core.ts
✅ src/types/index.ts
✅ src/types/performance.ts
✅ src/utils/fossilSummary.ts
✅ src/utils/llmFossilManager.ts
✅ src/utils/llmSnapshotExporter.ts
✅ src/utils/performanceMonitor.ts
✅ src/utils/performanceTracker.ts
✅ tests/unit/scripts/llm-chat-context.test.ts
✅ tests/unit/types/schemas.test.ts
```

### Key Features in This Batch
1. **LLM Snapshot Audit System** - Complete audit capabilities
2. **New CLI Commands** - Enhanced fossil management
3. **Performance Monitoring** - Comprehensive performance tracking
4. **Documentation** - Complete audit guides and analysis
5. **Core Infrastructure** - Enhanced utilities and services

## 🚨 Important Notes

### Before Committing
1. **Review the dry run output** to ensure you understand what will be committed
2. **Run validation** to catch any issues before committing
3. **Consider the batch size** - smaller batches are easier to review
4. **Check the commit messages** - they're auto-generated but can be customized

### After Committing
1. **Verify the commits** with `git log --oneline -10`
2. **Check that tests still pass** with `bun test`
3. **Review the fossil updates** in the fossils directory
4. **Update project status** if needed

## 🔄 Advanced Usage

### Custom Batch Sizes
```bash
# Commit with smaller batches for easier review
bun run commit:batch:ready --batch-size 3

# Commit with larger batches for efficiency
bun run commit:batch:all --batch-size 10
```

### Skip Validation (Use with Caution)
```bash
# Skip tests and validation (only for trusted changes)
bun run commit:batch:ready --skip-tests --skip-validation
```

### Force Mode (Use with Extreme Caution)
```bash
# Skip all safety checks (dangerous!)
bun run commit:batch:all --force
```

## 📈 Success Metrics

After running the batch commit orchestration, you should see:

1. **✅ All staged files committed** in logical batches
2. **✅ Conventional commit messages** following project standards
3. **✅ Tests passing** after all commits
4. **✅ TypeScript compilation** successful
5. **✅ Fossil updates** properly recorded
6. **✅ Documentation** updated and accurate

## 🆘 Troubleshooting

### Common Issues

**Validation Fails**
```bash
# Run validation separately to see specific issues
bun run commit:batch:validate
```

**TypeScript Errors**
```bash
# Fix TypeScript issues first
bun run type-check
```

**Test Failures**
```bash
# Run tests separately to identify issues
bun test
```

**Large Number of Files**
```bash
# Use smaller batch sizes for easier review
bun run commit:batch:ready --batch-size 2
```

## 🎉 Next Steps

After successfully completing the batch commits:

1. **Push to remote** when ready
2. **Create pull request** if working on a feature branch
3. **Update project status** fossils
4. **Run performance monitoring** to ensure no regressions
5. **Update documentation** if needed

---

**Ready to proceed?** Start with a dry run to see what would be committed:

```bash
bun run commit:batch:dry-run
``` 