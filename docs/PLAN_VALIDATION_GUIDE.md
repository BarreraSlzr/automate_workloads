# 📋 Plan Validation Guide

This guide explains how to use the plan validation system to ensure quality and consistency in LLM-generated plans.

## Overview

The plan validation system helps you:
- ✅ Ensure generated plans meet quality standards
- 🔍 Compare plans against expected results
- 📊 Get detailed validation reports with scores
- 🏷️ Validate task tags and structure
- 📈 Track plan quality over time

## Quick Start

### 1. Generate a Plan

```bash
# Generate a plan with LLM assistance
bun run llm:plan decompose "build a secure e-commerce platform" --output my-plan.json
```

### 2. Validate the Plan

```bash
# Basic validation
bun run validate:plan validate my-plan.json

# Validation with quality requirements
bun run validate:plan validate my-plan.json --min-tags 2 --min-tasks 4

# Validation with expected results
bun run validate:plan validate my-plan.json -e expected-plan.json
```

### 3. Create Expected Results

```bash
# Create expected plan template
bun run validate:plan create-expected my-plan.json -o expected-plan.json

# Edit the expected plan to define your standards
# Then use it for validation
```

## Validation Options

### Basic Validation

```bash
bun run validate:plan validate plan.json
```

Validates:
- ✅ JSON structure is valid
- ✅ Required fields are present
- ✅ Data types are correct
- ✅ Basic quality metrics

### Quality Requirements

```bash
bun run validate:plan validate plan.json \
  --min-tasks 3 \
  --max-tasks 15 \
  --min-tags 2 \
  --max-tags 8 \
  --required-tags "analysis,implementation" \
  --forbidden-tags "deprecated,legacy"
```

### Strict Mode

```bash
bun run validate:plan validate plan.json --strict
```

In strict mode:
- ⚠️ Warnings become errors
- 🔍 More rigorous validation
- 📊 Lower tolerance for deviations

### Ignore Specific Areas

```bash
bun run validate:plan validate plan.json \
  --ignore-timeline \
  --ignore-risks
```

## Expected Results

### Creating Expected Plans

1. **Generate a good plan first:**
   ```bash
   bun run llm:plan decompose "your goal" --output good-plan.json
   ```

2. **Create expected template:**
   ```bash
   bun run validate:plan create-expected good-plan.json -o expected-template.json
   ```

3. **Edit the template** to define your standards:
   ```json
   {
     "tasks": [
       {
         "id": "task-1",
         "title": "Analyze requirements",
         "tags": ["analysis", "planning", "requirements"]
       },
       {
         "id": "task-2", 
         "title": "Design architecture",
         "tags": ["design", "architecture", "planning"]
       }
     ]
   }
   ```

4. **Use for validation:**
   ```bash
   bun run validate:plan validate new-plan.json -e expected-template.json
   ```

### Expected Plan Structure

```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Expected task title",
      "tags": ["expected", "tags", "here"]
    }
  ],
  "timeline": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-10T00:00:00.000Z",
    "milestones": [
      {
        "date": "2025-01-05T00:00:00.000Z",
        "description": "Milestone description",
        "tasks": ["task-1", "task-2"]
      }
    ]
  },
  "risks": [
    {
      "description": "Risk description",
      "probability": "medium",
      "impact": "high",
      "mitigation": "Mitigation strategy"
    }
  ]
}
```

## Batch Validation

### Validate Multiple Plans

```bash
# Validate all JSON files in a directory
bun run validate:plan batch ./plans/

# With expected results directory
bun run validate:plan batch ./plans/ -e ./expected/

# Save batch report
bun run validate:plan batch ./plans/ --output batch-report.json
```

### Batch Report Example

```json
{
  "timestamp": "2025-06-25T05:00:00.000Z",
  "planDirectory": "./plans/",
  "summary": {
    "totalPlans": 10,
    "validPlans": 8,
    "invalidPlans": 2,
    "averageScore": 85.5,
    "successRate": 80.0
  },
  "results": [
    {
      "file": "plan1.json",
      "result": {
        "isValid": true,
        "score": 95,
        "errors": [],
        "warnings": []
      }
    }
  ]
}
```

## Validation Scoring

### Score Calculation (0-100)

**Base Score: 100**

**Deductions:**
- ❌ Errors: -10 points each
- ⚠️ Warnings: -2 points each (or -5 in strict mode)

**Bonuses:**
- ✅ All tasks have tags: +10 points
- 🏷️ Good tag coverage (≥2 tags/task): +5 points
- 🚨 Has critical tasks: +5 points

### Quality Metrics

The validator tracks:
- **Total Tasks**: Number of tasks in the plan
- **Tasks with Tags**: Tasks that have tag arrays
- **Average Tags per Task**: Tag coverage metric
- **Timeline Days**: Project duration
- **Critical Tasks**: High-priority tasks
- **High Priority Tasks**: Important tasks
- **Risks Identified**: Number of risk items

## Common Validation Scenarios

### 1. Web Application Plans

```bash
bun run validate:plan validate web-app-plan.json \
  --required-tags "frontend,backend,deployment" \
  --min-tasks 5 \
  --min-tags 3
```

### 2. API Development Plans

```bash
bun run validate:plan validate api-plan.json \
  --required-tags "backend,api,testing" \
  --min-tasks 4 \
  --min-tags 2
```

### 3. Mobile App Plans

```bash
bun run validate:plan validate mobile-plan.json \
  --required-tags "mobile,ui,backend" \
  --min-tasks 6 \
  --min-tags 3
```

### 4. Infrastructure Plans

```bash
bun run validate:plan validate infra-plan.json \
  --required-tags "infrastructure,deployment,monitoring" \
  --min-tasks 4 \
  --min-tags 2
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Plans
on: [push, pull_request]

jobs:
  validate-plans:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Generate Plan
        run: |
          bun run llm:plan decompose "build feature X" --output plan.json
          
      - name: Validate Plan
        run: |
          bun run validate:plan validate plan.json \
            --min-tasks 3 \
            --min-tags 2 \
            --strict
            
      - name: Upload Validation Report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate any modified plan files
for file in $(git diff --cached --name-only | grep '\.json$'); do
  if [[ $file == *"plan"* ]]; then
    echo "Validating plan: $file"
    bun run validate:plan validate "$file" --strict
    if [ $? -ne 0 ]; then
      echo "❌ Plan validation failed: $file"
      exit 1
    fi
  fi
done
```

## Troubleshooting

### Common Issues

**1. "Invalid structure" errors**
- Check JSON syntax
- Ensure all required fields are present
- Verify data types match schema

**2. "Missing required tags" errors**
- Add the required tags to tasks
- Check tag spelling and case
- Ensure tags are in arrays

**3. "Too few tasks" errors**
- Increase `--min-tasks` value
- Or generate a more detailed plan
- Consider breaking down large tasks

**4. "Task title differs significantly" warnings**
- This is usually OK - titles can vary
- Use `--ignore-timeline` if not critical
- Or update expected plan to match

### Debug Mode

```bash
# Enable verbose output
DEBUG=1 bun run validate:plan validate plan.json

# Save detailed report
bun run validate:plan validate plan.json --output debug-report.json
```

## Best Practices

### 1. Define Clear Standards
- Create expected plans for common goal types
- Set appropriate quality thresholds
- Document your validation requirements

### 2. Use Consistent Tags
- Standardize tag naming conventions
- Use descriptive, specific tags
- Avoid overly generic tags

### 3. Regular Validation
- Validate plans in CI/CD pipeline
- Run batch validation regularly
- Track quality metrics over time

### 4. Iterative Improvement
- Start with basic validation
- Gradually add stricter requirements
- Update expected plans as standards evolve

## Examples

### Example 1: Basic Validation

```bash
# Generate plan
bun run llm:plan decompose "implement user authentication" --output auth-plan.json

# Validate
bun run validate:plan validate auth-plan.json

# Output:
# Status: ✅ VALID (Score: 95/100)
# • Total Tasks: 4
# • Tasks with Tags: 4
# • Average Tags per Task: 3.2
```

### Example 2: Strict Validation

```bash
# Validate with strict requirements
bun run validate:plan validate auth-plan.json \
  --strict \
  --required-tags "security,authentication,backend" \
  --min-tags 3 \
  --min-tasks 4

# Output:
# Status: ❌ INVALID (Score: 85/100)
# • Errors: 1 (missing required tag)
# • Warnings: 2 (timeline differences)
```

### Example 3: Batch Processing

```bash
# Validate all plans in directory
bun run validate:plan batch ./project-plans/ --output quality-report.json

# Output:
# Batch Validation Summary
# ==================================================
# Total Plans: 15
# Valid Plans: 12
# Invalid Plans: 3
# Average Score: 87.3/100
# Success Rate: 80.0%
```

---

This validation system ensures your LLM-generated plans meet quality standards and provides detailed feedback for continuous improvement. 