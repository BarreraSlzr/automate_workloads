# File Footprint System

## Overview

The File Footprint System provides comprehensive tracking of file changes, git status, and machine information before committing. This creates a detailed timeline of development activities and ensures traceability of all changes.

## Features

### 🔍 **Comprehensive File Tracking**
- **Staged files**: Files ready for commit
- **Unstaged files**: Modified but not staged files
- **Untracked files**: New files not yet tracked by git
- **File metadata**: Size, line count, modification time, file type

### 📊 **Git Status Information**
- **Current branch and commit**: Exact git state
- **Last commit details**: Hash, message, author, date
- **Git status**: Complete porcelain output
- **Line change statistics**: Lines added/deleted

### 🖥️ **Machine Context**
- **Hostname and username**: Machine identification
- **Working directory**: Full path context
- **Timestamp**: Precise timing information

### 📈 **Statistics and Metrics**
- **File counts**: Total, staged, unstaged, untracked
- **Line changes**: Added and deleted lines
- **File type distribution**: Extension-based categorization

## Usage

### 1. Generate File Footprint

#### Basic Usage
```bash
# Generate footprint with default settings
bun run footprint:generate

# Generate with custom output path
bun run footprint:generate --output fossils/custom-footprint.yml

# Generate in JSON format
bun run footprint:generate --format json
```

#### Advanced Options
```bash
# Generate footprint with specific filters
bun run footprint:generate \
  --include-staged true \
  --include-unstaged true \
  --include-untracked false \
  --output fossils/selective-footprint.yml
```

### 2. Pre-Commit Footprint

#### Automatic Pre-Commit Hook
```bash
# Run unified pre-commit (adds evolving footprint and runs all checks)
bun run precommit:unified
```

This script:
- Updates the evolving footprint
- Runs all validation and commit checks
- Adds the footprint to the commit if there are staged files
- Provides a summary of tracked files

> **Note:** Legacy pre-commit scripts have been removed. Use only the unified entry point (`bun run precommit:unified`) for all pre-commit logic.

### 3. Commit with Footprint

#### Batch Commit with Footprint
```bash
# Stage all changes and create commit with footprint
bun run commit:with-footprint
```

This script:
- Generates a comprehensive footprint
- Stages all changes including the footprint
- Creates a detailed commit message with summary
- Includes file lists and statistics

## Output Format

### YAML Structure
```yaml
timestamp: "2024-01-15T10:30:45.123Z"
git:
  branch: "main"
  commit: "abc123def456..."
  status: |
    A  src/new-file.ts
    M  src/modified-file.ts
    ?? src/untracked-file.ts
  lastCommit:
    hash: "def456ghi789..."
    message: "feat: add new feature"
    author: "John Doe"
    date: "2024-01-15T09:00:00.000Z"
files:
  staged:
    - path: "src/new-file.ts"
      status: "A"
      size: 1024
      lines: 50
      lastModified: "2024-01-15T10:25:00.000Z"
      type: "file"
      extension: "ts"
  unstaged:
    - path: "src/modified-file.ts"
      status: "M"
      size: 2048
      lines: 100
      lastModified: "2024-01-15T10:28:00.000Z"
      type: "file"
      extension: "ts"
  untracked:
    - path: "src/untracked-file.ts"
      status: "??"
      size: 512
      lines: 25
      lastModified: "2024-01-15T10:30:00.000Z"
      type: "file"
      extension: "ts"
  all: []
stats:
  totalFiles: 3
  stagedCount: 1
  unstagedCount: 1
  untrackedCount: 1
  totalLinesAdded: 50
  totalLinesDeleted: 10
  fileTypes:
    ts: 3
machine:
  hostname: "macbook-pro"
  username: "developer"
  workingDirectory: "/Users/developer/project"
  timestamp: "2024-01-15T10:30:45.123Z"
```

## Integration with Workflows

### 1. Pre-Commit Hooks

#### Git Hooks Setup
```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
bun run precommit:unified
EOF

chmod +x .git/hooks/pre-commit
```

#### Husky Integration
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "bun run precommit:unified"
    }
  }
}
```

### 2. CI/CD Integration

#### GitHub Actions
```yaml
name: Generate File Footprint

on:
  pull_request:
    branches: [main]

jobs:
  footprint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run footprint:generate --output fossils/ci-footprint.yml
      - uses: actions/upload-artifact@v3
        with:
          name: file-footprint
          path: fossils/ci-footprint.yml
```

### 3. Batch Commit Workflow

#### Automated Batch Commits
```bash
# Use in batch commit scripts
bun run commit:with-footprint

# Or integrate with existing batch commit
bun run commit:batch:ready && bun run precommit:unified
```

## Use Cases

### 1. **Development Timeline Tracking**
Track the evolution of your codebase with detailed timestamps and file changes.

### 2. **Code Review Enhancement**
Provide comprehensive context for code reviews with detailed file information.

### 3. **Debugging and Investigation**
Use footprints to understand what changed and when during development sessions.

### 4. **Audit and Compliance**
Maintain detailed records of all file modifications for audit purposes.

### 5. **Team Collaboration**
Share machine context and file states across team members.

## Best Practices

### 1. **Regular Footprint Generation**
- Generate footprints before each commit
- Use pre-commit hooks for automation
- Include footprints in pull requests

### 2. **Footprint Organization**
- Store footprints in `fossils/` directory
- Use timestamped filenames for easy sorting
- Include footprints in version control

### 3. **Integration with Existing Workflows**
- Add to existing pre-commit hooks
- Integrate with CI/CD pipelines
- Use in batch commit processes

### 4. **Footprint Analysis**
- Review footprints for patterns
- Track file type distributions
- Monitor line change trends

## Troubleshooting

### Common Issues

#### Git Repository Not Found
```bash
# Ensure you're in a git repository
git init  # if needed
git status  # verify git is working
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/pre-commit-footprint.sh
chmod +x scripts/commit-with-footprint.sh
```

#### Large Repository Performance
```bash
# Use shallow analysis for large repos
bun run footprint:generate --depth shallow
```

### Debug Mode
```bash
# Enable verbose output
DEBUG=* bun run footprint:generate

# Check script execution
bash -x scripts/pre-commit-footprint.sh
```

## Future Enhancements

### Planned Features
- **File content hashing**: Track actual content changes
- **Dependency analysis**: Track package.json changes
- **Performance metrics**: Track build/test times
- **IDE integration**: Real-time footprint generation

### Extension Points
- **Custom file filters**: Exclude specific file types
- **Custom metrics**: Add project-specific statistics
- **Integration APIs**: REST endpoints for external tools
- **Visualization**: Web-based footprint viewer

## Conclusion

The File Footprint System provides comprehensive tracking of development activities, ensuring complete traceability and context preservation. By integrating this system into your development workflow, you gain valuable insights into code evolution and maintain detailed records of all changes.

The system is designed to be lightweight, automated, and easily integrated into existing workflows, making it an essential tool for modern development practices. 