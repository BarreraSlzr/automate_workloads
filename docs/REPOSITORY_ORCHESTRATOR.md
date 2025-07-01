# Repository Workflow Orchestrator 🎯

The Repository Workflow Orchestrator is a powerful CLI service that can target any GitHub repository and apply LLM-powered automation workflows for planning, analysis, execution, and monitoring.

## Overview

This orchestrator provides a comprehensive solution for automating repository management tasks using LLM-powered intelligence. It can analyze repository health, generate automation plans, execute workflows, and monitor optimization opportunities.

## Features

### 🎯 Universal Repository Targeting
- Target any GitHub repository by owner and name
- Support for public and private repositories (with proper authentication)
- Flexible workflow types for different use cases

### 🤖 LLM-Powered Intelligence
- Repository health analysis and scoring
- Automated issue and PR creation
- Intelligent workflow recommendations
- Context-aware planning and execution

### 📊 Comprehensive Analysis
- Repository health scoring (0-100)
- Workflow analysis and status tracking
- Automation opportunity identification
- Performance metrics and trends

### 🚀 Automated Execution
- Create automation issues with detailed recommendations
- Generate automation PRs with improvements
- Update repository files with enhancements
- Monitor and optimize workflows

## Quick Start

### Basic Usage

```bash
# Analyze any repository
bun run repo:analyze microsoft vscode

# Full orchestration with automation
bun run repo:orchestrate facebook react --workflow full

# Use the convenient wrapper script
./scripts/automation/repo-orchestrator.sh microsoft vscode
```

### Workflow Types

| Workflow | Description | Use Case |
|----------|-------------|----------|
| `analyze` | Repository analysis and health check | Initial assessment |
| `plan` | LLM-powered planning and recommendations | Strategy development |
| `execute` | Execute automation workflows | Implementation |
| `monitor` | Monitor and optimize workflows | Ongoing maintenance |
| `full` | Complete orchestration | End-to-end automation |

## Commands

### Repository Analysis

```bash
# Basic analysis
bun run repo:analyze <owner> <repo>

# Analysis with output file
bun run repo:analyze microsoft vscode --output analysis.json

# Examples
bun run repo:analyze facebook react
bun run repo:analyze google tensorflow --output tensorflow-analysis.json
```

### Repository Orchestration

```bash
# Full orchestration
bun run repo:orchestrate <owner> <repo> [options]

# Specific workflow
bun run repo:orchestrate <owner> <repo> --workflow <type> [options]

# Examples
bun run repo:orchestrate microsoft vscode --workflow full
bun run repo:orchestrate facebook react --workflow plan --create-issues
bun run repo:orchestrate openai openai-cookbook --workflow execute --create-prs
```

### Wrapper Script

```bash
# Convenient wrapper with interactive prompts
./scripts/automation/repo-orchestrator.sh <owner> <repo> [workflow] [branch] [options]

# Examples
./scripts/automation/repo-orchestrator.sh microsoft vscode
./scripts/automation/repo-orchestrator.sh facebook react analyze
./scripts/automation/repo-orchestrator.sh google tensorflow plan main --create-issues
./scripts/automation/repo-orchestrator.sh openai openai-cookbook full main --output results.json
```

## Options

### Orchestration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--workflow <type>` | Workflow type (analyze/plan/execute/monitor/full) | `full` |
| `--branch <branch>` | Target branch | `main` |
| `--context <json>` | Additional context (JSON string) | `{}` |
| `--output <file>` | Output file for results | `stdout` |

### Execution Options

| Option | Description | Default |
|--------|-------------|---------|
| `--create-issues` | Create automation issues | `true` |
| `--no-create-issues` | Skip creating automation issues | - |
| `--create-prs` | Create automation PRs | `false` |
| `--auto-merge` | Enable auto-merge for PRs | `false` |
| `--no-notifications` | Disable notifications | - |

## Examples

### Basic Repository Analysis

```bash
# Analyze VS Code repository
bun run repo:analyze microsoft vscode --output vscode-analysis.json

# Check the results
cat vscode-analysis.json | jq '.health.score'
cat vscode-analysis.json | jq '.automation.opportunities'
```

### LLM-Powered Planning

```bash
# Generate automation plan for React
bun run repo:orchestrate facebook react --workflow plan --output react-plan.json

# Review the plan
cat react-plan.json | jq '.steps[] | select(.step == "planning") | .data'
```

### Full Automation Orchestration

```bash
# Complete orchestration with automation
bun run repo:orchestrate your-org your-repo --workflow full --create-issues --create-prs

# This will:
# 1. Analyze repository health and automation opportunities
# 2. Generate LLM-powered improvement plan
# 3. Create automation issues with recommendations
# 4. Generate automation PRs with improvements
# 5. Monitor and optimize workflows
```

### Custom Context Orchestration

```bash
# Orchestrate with custom context
CONTEXT='{"projectType":"typescript-library","teamSize":"small","priorities":["code-quality","automation"]}'
bun run repo:orchestrate your-org your-repo --workflow full --context "$CONTEXT"
```

### Batch Repository Processing

```bash
#!/bin/bash
# Batch orchestration script

REPOS=(
  "microsoft/vscode:analyze"
  "facebook/react:plan"
  "google/tensorflow:analyze"
  "openai/openai-cookbook:full"
)

for repo_info in "${REPOS[@]}"; do
  IFS=':' read -r repo workflow <<< "$repo_info"
  IFS='/' read -r owner repo_name <<< "$repo"
  
  echo "🎯 Orchestrating $owner/$repo_name..."
  bun run repo:orchestrate "$owner" "$repo_name" --workflow "$workflow" --output "results/${owner}-${repo_name}.json"
  echo "✅ Completed $owner/$repo_name"
done
```

## Integration Examples

### With LLM Planning

```bash
# 1. Analyze repository
bun run repo:analyze microsoft vscode --output vscode-analysis.json

# 2. Use analysis for LLM planning
bun run llm:plan decompose "Improve VS Code automation based on analysis" --context vscode-analysis.json

# 3. Execute the plan
bun run repo:orchestrate microsoft vscode --workflow execute --context plan-results.json
```

### With Content Automation

```bash
# 1. Analyze repository
bun run repo:analyze facebook react --output react-analysis.json

# 2. Generate content about the analysis
./scripts/automation/llm-content-automation.sh "blog-post" "React Repository Analysis" "medium,twitter"

# 3. Create automation issues
bun run repo:orchestrate facebook react --workflow execute --create-issues
```

### With Continuous Monitoring

```bash
# Set up monitoring baseline
bun run repo:orchestrate your-org your-repo --workflow monitor --output monitoring-baseline.json

# Schedule regular monitoring (cron job)
0 9 * * * cd /path/to/project && bun run repo:orchestrate your-org your-repo --workflow monitor --output monitoring-$(date +%Y%m%d).json

# Compare results over time
bun run llm:analyze --compare monitoring-baseline.json monitoring-$(date +%Y%m%d).json
```

## Output Format

### Analysis Output

```json
{
  "repository": {
    "name": "vscode",
    "owner": "microsoft",
    "description": "Visual Studio Code",
    "language": "TypeScript",
    "stars": 150000,
    "forks": 25000,
    "openIssues": 5000,
    "openPRs": 200,
    "lastCommit": "2024-01-15T10:30:00Z",
    "defaultBranch": "main"
  },
  "health": {
    "score": 85,
    "issues": [
      "High number of open issues",
      "No recent activity"
    ],
    "recommendations": [
      "Implement automated issue triage",
      "Set up regular maintenance schedule"
    ]
  },
  "workflows": [
    {
      "name": "CI",
      "status": "active",
      "lastRun": "2024-01-15T09:00:00Z",
      "successRate": 95
    }
  ],
  "automation": {
    "opportunities": [
      {
        "type": "issue-management",
        "description": "Automate issue triage and assignment",
        "impact": "high",
        "effort": "medium",
        "priority": 1
      }
    ],
    "currentAutomation": [
      "CI",
      "Dependabot",
      "CodeQL"
    ]
  }
}
```

### Orchestration Output

```json
{
  "repository": "microsoft/vscode",
  "workflow": "full",
  "timestamp": "2024-01-15T10:30:00Z",
  "steps": [
    {
      "step": "analysis",
      "status": "completed",
      "data": { /* analysis results */ }
    },
    {
      "step": "planning",
      "status": "completed",
      "data": {
        "immediateActions": [
          "Review and prioritize open issues",
          "Update repository documentation"
        ],
        "shortTermImprovements": [
          "Implement automated issue triage",
          "Add PR templates and automation"
        ],
        "longTermStrategy": [
          "Full CI/CD pipeline automation",
          "Advanced analytics and reporting"
        ]
      }
    },
    {
      "step": "execution",
      "status": "completed",
      "data": {
        "createdIssues": [
          {
            "type": "automation-setup",
            "issue": "https://github.com/microsoft/vscode/issues/12345",
            "timestamp": "2024-01-15T10:30:00Z"
          }
        ],
        "createdPRs": [],
        "updatedFiles": [],
        "errors": []
      }
    }
  ],
  "summary": {
    "totalSteps": 4,
    "completedSteps": 4,
    "failedSteps": 0,
    "successRate": 100,
    "duration": "2m 30s",
    "recommendations": [
      "Focus on improving repository health score",
      "Implement immediate actions from the LLM plan"
    ]
  }
}
```

## Configuration

### Environment Variables

The orchestrator uses the same environment configuration as the main project:

```bash
# GitHub configuration
GITHUB_TOKEN=your_github_token
GITHUB_API_URL=https://api.github.com

# LLM configuration (for future integration)
LLM_API_KEY=your_llm_api_key
LLM_MODEL=gpt-4

# Notification configuration
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_SMTP_HOST=your_smtp_host
```

### GitHub CLI Authentication

The orchestrator uses GitHub CLI for repository access. Ensure you're authenticated:

```bash
# Authenticate with GitHub CLI
gh auth login

# Verify authentication
gh auth status
```

## Best Practices

### 1. Start with Analysis

Always begin with repository analysis to understand the current state:

```bash
bun run repo:analyze <owner> <repo> --output baseline.json
```

### 2. Use Appropriate Workflow Types

- Use `analyze` for initial assessment
- Use `plan` for strategy development
- Use `execute` for implementation
- Use `monitor` for ongoing maintenance
- Use `full` for complete automation

### 3. Provide Context

Use the `--context` option to provide relevant information:

```bash
CONTEXT='{"projectType":"web-app","teamSize":"medium","priorities":["security","performance"]}'
bun run repo:orchestrate your-org your-repo --context "$CONTEXT"
```

### 4. Monitor Results

Regularly monitor orchestration results and adjust strategies:

```bash
# Set up monitoring
bun run repo:orchestrate your-org your-repo --workflow monitor --output monitoring.json

# Review results
cat monitoring.json | jq '.summary'
```

### 5. Integrate with Existing Workflows

Combine with other automation tools:

```bash
# Repository orchestration + LLM planning
bun run repo:analyze your-org your-repo --output analysis.json
bun run llm:plan decompose "Improve automation" --context analysis.json
bun run repo:orchestrate your-org your-repo --workflow execute
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   # Ensure GitHub CLI is authenticated
   gh auth login
   gh auth status
   ```

2. **Repository Access Issues**
   ```bash
   # Check repository access
   gh repo view <owner>/<repo>
   ```

3. **JSON Field Errors**
   - The orchestrator adapts to GitHub API changes
   - Check the GitHub CLI documentation for current field names

4. **Label Creation Errors**
   - Labels must exist in the repository before creating issues
   - Create labels manually or use `--no-create-issues` option

### Debug Mode

Enable debug output for troubleshooting:

```bash
DEBUG=* bun run repo:orchestrate <owner> <repo>
```

## Contributing

See [CONTRIBUTING_GUIDE.md](../CONTRIBUTING_GUIDE.md) for development guidelines and LLM-friendly patterns.

## Related Documentation

- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Development Guide](DEVELOPMENT_GUIDE.md) - Technical development guidelines
- [Contributing Guide](../CONTRIBUTING_GUIDE.md) - LLM-friendly patterns and workflows

## Orchestration Fossils & Excerpts

- All orchestration, monitoring, and execution fossils now include an LLM-generated `excerpt` field for quick preview and reporting.
- Use the summary/cleanup/reporting tools to audit and visualize orchestration history.

## Fossil Provenance and Traceability

All fossil entries created by the orchestrator include:
- `source`: A high-level string indicating the origin (e.g., 'repo-orchestrator', 'llm', 'automated').
- `metadata.invocation`: The script name and up to the first three arguments used to create the fossil (e.g., 'repo-orchestrator-orchestrate-owner-repo').

This enables both high-level filtering and detailed traceability for every fossilized record. 