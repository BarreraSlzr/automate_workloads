# Timestamp Filter Guide

## Overview

The Timestamp Filter is a utility that detects and filters timestamp-only changes in git diffs to avoid unnecessary commits. It's particularly useful for files that are automatically updated with timestamps but don't contain meaningful changes.

## Problem

Many automation scripts and tools update timestamp fields (like `lastUpdated`, `lastChecked`, etc.) even when no actual content has changed. This creates noise in git history and makes it harder to track meaningful changes.

## Solution

The Timestamp Filter analyzes git diffs and identifies changes that only modify timestamp fields, allowing you to:

- Skip commits that only contain timestamp changes
- Get warnings before committing timestamp-only changes
- Automatically filter timestamp changes in CI/CD pipelines

## Usage

### Basic Analysis

```bash
# Analyze current git diff
bun run src/cli/timestamp-filter.ts

# Check if current diff has only timestamp changes
bun run src/cli/timestamp-filter.ts --check

# Show detailed analysis
bun run src/cli/timestamp-filter.ts --verbose
```

### Git Hook Integration

```bash
# Create a pre-commit hook
bun run src/cli/timestamp-filter.ts --create-hook
```

The hook will warn you about timestamp-only changes before committing and ask if you want to continue.

### Reset Timestamp Changes

```bash
# Interactive script to handle timestamp-only changes
./scripts/reset-timestamp-changes.sh
```

This script provides options to:
1. Reset the changes
2. Continue with commit
3. Show the diff
4. Cancel

## Configuration

### Default Patterns

The filter recognizes these timestamp patterns by default:

- Field names: `lastUpdated`, `lastChecked`, `timestamp`, `updated_at`, `created_at`, `modified_at`
- Date formats: ISO 8601 (`2025-07-04T00:42:04Z`), common datetime format

### File-Specific Patterns

Different file types have specific patterns:

- `*.yml`, `*.yaml`: `lastUpdated`, `lastChecked`, `timestamp`
- `*.json`: `lastUpdated`, `lastChecked`, `timestamp`, `updated_at`, `created_at`
- `*.md`: `lastUpdated`, `lastChecked`, `timestamp`

### Custom Configuration

You can customize patterns when using the `TimestampFilter` class:

```typescript
import { TimestampFilter } from './src/utils/timestampFilter';

const filter = new TimestampFilter();
const analysis = await filter.analyzeTimestampChanges({
  timestampPatterns: [
    /myCustomTimestamp|anotherField/i,
    /\d{4}-\d{2}-\d{2}/, // Custom date pattern
  ],
  filePatterns: {
    '*.custom': [/myTimestampField/i],
  },
  verbose: true,
});
```

## Examples

### Current Scenario

In your current git diff, the filter detected:

```
📊 Timestamp Analysis:
   Files with timestamp-only changes: fossils/setup_status.yml
   Total timestamp changes: 24
   Other changes: 0
   Has only timestamp changes: true
```

This means `fossils/setup_status.yml` has 24 timestamp changes but no other modifications.

### Recommendations

When timestamp-only changes are detected, the filter suggests:

- Skip commit: `git reset HEAD~1`
- Update `.gitignore` to exclude timestamp fields
- Use `--ignore-timestamp-only` flag in automation scripts

## Integration with Automation

### CI/CD Pipeline

Add this to your CI pipeline to prevent timestamp-only commits:

```yaml
- name: Check for timestamp-only changes
  run: |
    if bun run src/cli/timestamp-filter.ts --check; then
      echo "❌ Only timestamp changes detected. Skipping commit."
      exit 1
    fi
```

### Pre-commit Hook

The git hook automatically runs on every commit and warns about timestamp-only changes.

### Automation Scripts

Use the `--skip-if-only` flag in automation scripts:

```bash
bun run src/cli/timestamp-filter.ts --check --skip-if-only
```

## Best Practices

1. **Use the git hook**: Install the pre-commit hook to catch timestamp-only changes early
2. **Review patterns**: Customize timestamp patterns for your specific use case
3. **Document exceptions**: Some timestamp changes might be meaningful (e.g., build timestamps)
4. **Automate cleanup**: Use the reset script for interactive cleanup
5. **CI integration**: Add timestamp checks to your CI pipeline

## Troubleshooting

### False Positives

If the filter incorrectly identifies changes as timestamp-only:

1. Review the detected patterns
2. Customize patterns for your specific fields
3. Add exceptions for meaningful timestamp changes

### False Negatives

If timestamp changes are not detected:

1. Check if the timestamp format matches the patterns
2. Add custom patterns for your timestamp format
3. Verify the field names are included in the patterns

### Git Hook Issues

If the git hook doesn't work:

1. Ensure it's executable: `chmod +x .git/hooks/pre-commit`
2. Check the hook content: `cat .git/hooks/pre-commit`
3. Recreate the hook: `bun run src/cli/timestamp-filter.ts --create-hook`

## Future Enhancements

- [ ] Support for more timestamp formats
- [ ] Integration with git attributes
- [ ] Batch processing of multiple commits
- [ ] Custom ignore patterns per repository
- [ ] Integration with git blame for timestamp tracking 