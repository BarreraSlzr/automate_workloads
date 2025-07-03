# Curated Fossils: Project State & Roadmap

This folder contains **canonical fossils**—the authoritative, versioned artifacts that serve as the single source of truth for the project's current state and planned direction.

## 🎯 Canonical Fossilization System

### What is a Canonical Fossil?
A canonical fossil is a **curated, versioned, and committed artifact** that serves as the definitive source of truth for:
- **Project State**: Current implementation status, test coverage, and fossilization metrics
- **Project Direction**: Planned tasks, milestones, and automation targets
- **Decision History**: Key decisions, audit points, and process metadata

### Core Canonical Files

| File | Purpose | Update Frequency | Curation Status |
|------|---------|------------------|-----------------|
| `project_status.yml` | **Canonical project state** - Complete module/file/function analysis with fossilization tracking | Automated (scripts/update-project-status.ts) | ✅ Canonical |
| `roadmap.yml` | **Canonical project direction** - Task planning, milestones, and automation targets | Manual + Automated updates | ✅ Canonical |
| `setup_status.yml` | **Canonical onboarding state** - Tracks all setup/onboarding steps, tool versions, and LLM model status | Automated (scripts/setup.sh) | ✅ Canonical |

### Canonical Fossil Properties

**✅ Always Up-to-Date**: Reflects the most recent state and plan  
**✅ Version Controlled**: Every commit shows the project's exact state  
**✅ Automation-Friendly**: Used by all scripts, CI/CD, and LLM services  
**✅ Human-Readable**: YAML format supports comments and collaboration  
**✅ Schema-Validated**: Enforced structure ensures consistency  
**✅ Traceable**: Links to GitHub issues, milestones, and labels  

## 🔄 Canonical Fossilization Workflow

### 1. **Automated Updates**
```bash
# Update project status (generates fossils/project_status.yml)
bun run scripts/update-project-status.ts

# Update roadmap (manual + automated)
# Edit fossils/roadmap.yml directly or use automation tools
```

### 2. **Validation & Curation**
```bash
# Validate fossils meet schema requirements
bun run test:e2e  # Includes fossil validation

# Check fossilization completeness
bun run cli:curate --validate fossils/project_status.yml
```

### 3. **Commit & Version**
```bash
# Commit canonical fossils after meaningful changes
git add fossils/project_status.yml fossils/roadmap.yml
git commit -m "feat: update canonical fossils - [description]"
```

### 4. **Automation Integration**
- **CI/CD**: Validates fossils on every commit
- **E2E Tests**: Ensures fossil completeness and schema compliance
- **LLM Services**: Use fossils for context and decision-making
- **GitHub Sync**: Creates/updates issues and milestones from fossils

## 📊 Fossil Schema & Validation

### Project Status Schema
```yaml
project_status:
  modules:
    [module_name]:
      path: src/[module]/
      files:
        - [filename].ts:
            functions:
              - [function_name]: [status]
            fossilized_output: [boolean]
            tests: [test_file_paths]
      status: [overall_status]
      notes: [context]
  overall_summary:
    total_modules: [number]
    total_files: [number]
    total_functions: [number]
    completion_percentage: [number]
  recommendations: [list_of_recommendations]
```

### Roadmap Schema
```yaml
type: e2e_automation_roadmap
source: [source]
createdBy: [creator]
createdAt: [timestamp]
tasks:
  - task: [task_name]
    status: [status]
    owner: [owner]
    context: [description]
    issues: [github_issue_numbers]
    milestones: [milestone_names]
    labels: [label_names]
    deadline: [timestamp]
    subtasks: [subtask_list]
```

## 🎯 Benefits of Canonical Fossilization

### **Single Source of Truth**
- All automation, documentation, and decisions reference the same canonical files
- No ambiguity about current state or planned direction
- Consistent data across all tools and services

### **Automation Reliability**
- Scripts always use the most up-to-date, validated data
- CI/CD can enforce fossil completeness and schema compliance
- LLM services have authoritative context for decision-making

### **Traceability & Reproducibility**
- Every commit shows the exact project state and plan
- Historical analysis and regression detection
- Audit trails for all changes and decisions

### **Team Collaboration**
- Clear, documented state and direction
- Consistent terminology and status tracking
- Automated validation prevents inconsistencies

## 🚀 Usage Examples

### **Update Project Status**
```bash
# Generate updated project status
bun run scripts/update-project-status.ts

# Validate the generated fossil
bun run test:e2e --grep "project_status"
```

### **Update Roadmap**
```bash
# Edit roadmap directly
code fossils/roadmap.yml

# Or use automation tools
bun run cli:create --roadmap fossils/roadmap.yml
```

### **Validate Fossils**
```bash
# Run E2E tests (includes fossil validation)
bun run test:e2e

# Check specific fossil
bun run cli:curate --validate fossils/project_status.yml
```

### **Sync with GitHub**
```bash
# Create issues from roadmap tasks
bun run cli:sync --roadmap fossils/roadmap.yml

# Update project board
bun run cli:projects --sync
```

## 📋 Maintenance Guidelines

### **When to Update Canonical Fossils**
- ✅ After significant code changes (new modules, functions, tests)
- ✅ After roadmap changes (new tasks, status updates, milestones)
- ✅ Before major releases or milestones
- ✅ After automation script updates
- ✅ When fossilization patterns change

### **Quality Standards**
- ✅ All required fields must be present and valid
- ✅ Status progression must follow enforced order
- ✅ GitHub references (issues, milestones, labels) must be accurate
- ✅ Test coverage must be up-to-date
- ✅ Fossilization tracking must be complete

### **Automation Integration**
- ✅ CI/CD validates fossils on every commit
- ✅ E2E tests ensure fossil completeness
- ✅ Pre-commit hooks check fossil schema
- ✅ LLM services use fossils for context
- ✅ GitHub sync uses fossils as source of truth

### Onboarding & Setup

- The canonical onboarding fossil is `fossils/setup_status.yml`, updated by `scripts/setup.sh` after each step.
- To onboard, run `bash scripts/setup.sh` and follow the instructions.
- See `setup_status.yml` for troubleshooting and to audit onboarding state.

---

**🎯 Keep these canonical fossils as the definitive source of truth for all project automation, planning, and decision-making!** 