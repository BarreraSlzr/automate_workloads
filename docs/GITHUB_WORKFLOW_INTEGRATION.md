# GitHub Workflow Integration 🚀

This document describes the automated GitHub Actions workflows that integrate with our Repository Workflow Orchestrator to provide continuous automation and action plan generation.

## Overview

We've created a comprehensive GitHub Actions integration that automatically:

1. **Analyzes** repository health and identifies opportunities
2. **Generates** LLM-powered action plans
3. **Creates** automation issues and recommendations
4. **Monitors** progress and optimizes workflows
5. **Sets up** necessary labels and templates

## Workflows Overview

### 1. Repository Workflow Orchestrator (`repository-orchestrator.yml`)

**Purpose:** Main orchestration workflow that runs automatically to analyze and improve the repository.

**Triggers:**
- **Scheduled:** Every Monday at 9 AM UTC
- **Manual:** Via workflow dispatch
- **Push:** When orchestrator files change
- **Pull Request:** On PR to main/master

**Steps:**
1. **Repository Analysis** - Assess health and identify opportunities
2. **LLM-Powered Planning** - Generate improvement strategies
3. **Automation Execution** - Create issues and implement improvements
4. **Monitoring & Optimization** - Track performance and identify optimizations
5. **Summary Creation** - Generate comprehensive reports and issues

**Outputs:**
- Health score assessment
- Automation issues created
- Detailed reports and artifacts
- Summary issues with recommendations

### 2. Setup Orchestrator (`setup-orchestrator.yml`)

**Purpose:** Prepare repository with necessary labels and templates for automation.

**Triggers:**
- **Manual:** Via workflow dispatch
- **Push:** When setup files change

**Steps:**
1. **Create Labels** - Set up required labels for automation
2. **Issue Templates** - Create templates for automation requests
3. **Documentation** - Generate workflow documentation
4. **Configuration** - Create orchestrator configuration file

**Outputs:**
- Automation labels (automation, orchestration, summary, etc.)
- Issue templates (Automation Request, Orchestration Summary)
- Workflow documentation
- Orchestrator configuration

### 3. Action Plan Generator (`action-plan-generator.yml`)

**Purpose:** Generate comprehensive action plans with immediate, short-term, and long-term strategies.

**Triggers:**
- **Scheduled:** Every Sunday at 8 PM UTC (weekly planning)
- **Manual:** Via workflow dispatch with customizable inputs

**Inputs:**
- `plan_type`: comprehensive, automation, documentation, testing, deployment
- `priority`: high, medium, low
- `context`: Additional JSON context for customization

**Steps:**
1. **Analyze Current State** - Assess repository health and opportunities
2. **Generate LLM-Powered Plan** - Create comprehensive action plan
3. **Create Action Plan Issues** - Generate structured issues for implementation
4. **Create Summary** - Provide overview and next steps

**Outputs:**
- Immediate actions issue (next 24 hours)
- Short-term improvements issue (next week)
- Long-term strategy issue (next month)
- Action plan summary issue
- Detailed artifacts and reports

## Workflow Features

### 🎯 Automated Analysis

```yaml
# Health score assessment
HEALTH_SCORE=$(bun run --bun node -e "
  const analysis = JSON.parse(require('fs').readFileSync('analysis.json', 'utf8'));
  console.log(analysis.health.score);
")

# Conditional orchestration based on health score
if [ "$HEALTH_SCORE" -lt 80 ]; then
  echo "⚠️  Health score below threshold (80), triggering full orchestration"
  echo "needs_orchestration=true" >> $GITHUB_OUTPUT
fi
```

### 🤖 LLM-Powered Planning

```yaml
# Enhanced context for LLM planning
ENHANCED_CONTEXT=$(bun run --bun node -e "
  const enhancedContext = {
    planType: '$PLAN_TYPE',
    priority: '$PRIORITY',
    currentHealth: analysis.health.score,
    opportunities: analysis.automation.opportunities,
    repository: analysis.repository,
    timestamp: new Date().toISOString(),
    trigger: '${{ github.event_name }}',
    actor: '${{ github.actor }}'
  };
  console.log(JSON.stringify(enhancedContext));
")

# Run planning with enhanced context
bun run repo:orchestrate ${{ github.repository_owner }} ${{ github.event.repository.name }} \
  --workflow plan \
  --context "$ENHANCED_CONTEXT" \
  --output action-plan.json
```

### 📋 Automated Issue Creation

```yaml
# Create immediate actions issue
gh issue create \
  --title "🚀 Immediate Actions - $(date -u +"%Y-%m-%d")" \
  --body-file immediate-actions.md \
  --label "automation,immediate,action-plan" \
  --assignee ${{ github.actor }}
```

### 📊 Comprehensive Reporting

```yaml
# Generate summary with metrics
cat > action-plan-summary.md << 'EOF'
# 📋 Action Plan Summary

**Generated:** $(date -u +"%Y-%m-%d %H:%M UTC")
**Plan Type:** ${{ github.event.inputs.plan_type || 'comprehensive' }}
**Priority:** ${{ github.event.inputs.priority || 'medium' }}

## 📊 Plan Overview
- **Current Health Score:** ${{ steps.analyze.outputs.health_score }}/100
- **Automation Opportunities:** ${{ steps.analyze.outputs.opportunities }}
- **Issues Created:** $ISSUES_CREATED
EOF
```

## Usage Examples

### Manual Orchestration

```bash
# Trigger full repository orchestration
gh workflow run repository-orchestrator.yml

# Setup repository with labels and templates
gh workflow run setup-orchestrator.yml

# Generate custom action plan
gh workflow run action-plan-generator.yml \
  --field plan_type=comprehensive \
  --field priority=high \
  --field context='{"teamSize":"small","focus":"automation"}'
```

### Scheduled Automation

The workflows run automatically on schedule:

- **Repository Orchestrator:** Every Monday at 9 AM UTC
- **Action Plan Generator:** Every Sunday at 8 PM UTC

### Local Integration

```bash
# Analyze repository locally
bun run repo:analyze barreraslzr automate_workloads

# Generate action plan locally
bun run repo:orchestrate barreraslzr automate_workloads --workflow plan

# Use wrapper script
./scripts/automation/repo-orchestrator.sh barreraslzr automate_workloads
```

## Generated Artifacts

### Files Created

1. **Analysis Files:**
   - `analysis.json` - Repository health analysis
   - `current-analysis.json` - Current state assessment

2. **Plan Files:**
   - `action-plan.json` - Complete action plan data
   - `plan.json` - LLM-generated improvement plan

3. **Execution Files:**
   - `execution.json` - Automation execution results
   - `monitoring.json` - Monitoring and optimization data

4. **Reports:**
   - `action-plan-summary.md` - Comprehensive summary
   - `.orchestration-reports/` - Historical reports

### Issues Created

1. **Immediate Actions Issue:**
   - Timeline: Next 24 hours
   - Focus: Quick wins and urgent improvements
   - Labels: automation, immediate, action-plan

2. **Short-Term Improvements Issue:**
   - Timeline: Next week
   - Focus: Medium-effort enhancements
   - Labels: automation, improvements, action-plan

3. **Long-Term Strategy Issue:**
   - Timeline: Next month
   - Focus: Strategic transformation
   - Labels: automation, strategy, action-plan

4. **Summary Issue:**
   - Overview of all generated plans
   - Key metrics and next steps
   - Labels: orchestration, summary, action-plan

## Configuration

### Environment Variables

```yaml
env:
  NODE_VERSION: '18'
  BUN_VERSION: 'latest'
```

### Health Score Threshold

```yaml
# Health score threshold for triggering full orchestration
if [ "$HEALTH_SCORE" -lt 80 ]; then
  echo "needs_orchestration=true" >> $GITHUB_OUTPUT
fi
```

### Artifact Retention

```yaml
# Retain artifacts for 30 days
uses: actions/upload-artifact@v4
with:
  retention-days: 30
```

## Monitoring and Metrics

### Key Metrics Tracked

- **Repository Health Score** (0-100)
- **Issues Created** per orchestration
- **PRs Generated** for automation
- **Alerts and Optimizations** identified
- **Time to Implement** recommendations

### Monitoring Dashboard

Track progress through:

1. **GitHub Actions** - Workflow run history
2. **Issues** - Generated automation issues
3. **Artifacts** - Downloadable reports
4. **Labels** - Categorized automation tasks

### Success Indicators

- Health score improvement over time
- Reduction in manual tasks
- Increased automation coverage
- Faster issue resolution
- Better documentation quality

## Best Practices

### 1. Regular Monitoring

```bash
# Check workflow status
gh run list --workflow=repository-orchestrator.yml

# Review generated issues
gh issue list --label "automation"

# Download latest artifacts
gh run download --name orchestration-reports-123
```

### 2. Customization

```bash
# Generate custom action plan
gh workflow run action-plan-generator.yml \
  --field plan_type=automation \
  --field priority=high \
  --field context='{"focus":"ci-cd","teamSize":"medium"}'
```

### 3. Integration with Existing Workflows

```yaml
# Trigger orchestration after successful deployment
- name: Trigger Repository Orchestration
  if: success()
  run: |
    gh workflow run repository-orchestrator.yml
```

### 4. Team Collaboration

- Assign generated issues to team members
- Review action plans in team meetings
- Track progress on automation initiatives
- Celebrate health score improvements

## Troubleshooting

### Common Issues

1. **Authentication Errors:**
   ```bash
   # Ensure GitHub CLI is authenticated
   gh auth status
   ```

2. **Missing Labels:**
   ```bash
   # Run setup workflow
   gh workflow run setup-orchestrator.yml
   ```

3. **Workflow Failures:**
   ```bash
   # Check workflow logs
   gh run view --log
   ```

### Debug Mode

```bash
# Enable debug output
DEBUG=* gh workflow run repository-orchestrator.yml
```

## Future Enhancements

### Planned Features

1. **Slack Integration** - Notifications for orchestration results
2. **Email Reports** - Weekly summary emails
3. **Dashboard Integration** - Visual progress tracking
4. **Team Analytics** - Performance metrics by team member
5. **Custom Workflows** - Repository-specific automation rules

### Advanced Configuration

```yaml
# Future: Repository-specific configuration
orchestrator:
  healthThreshold: 85
  customWorkflows:
    - name: "security-scan"
      trigger: "weekly"
      priority: "high"
  teamSettings:
    notifications: ["slack", "email"]
    assignees: ["team-lead", "automation-expert"]
```

## Conclusion

The GitHub workflow integration provides a complete automation ecosystem that:

- **Continuously monitors** repository health
- **Automatically generates** action plans
- **Creates structured issues** for implementation
- **Tracks progress** and optimizes workflows
- **Provides comprehensive reporting** and analytics

This integration transforms manual repository management into an automated, intelligent system that continuously improves and optimizes the development workflow.

---

*Generated by Repository Workflow Orchestrator* 