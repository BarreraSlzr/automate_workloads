# Automate Workloads

## Overview
This project provides robust automation scripts and tools for repository health, progress tracking, and GitHub integration. All automation and testing is now local—there is no `remote-repo` directory or cross-repo simulation.

## Requirements
- [Bun](https://bun.sh/)
- [gh (GitHub CLI)](https://cli.github.com/)
- [jq](https://stedolan.github.io/jq/)

## Testing
- **Integration tests** are located in `tests/integration/` and cover all major shell scripts.
- **Pre-commit hooks** run all integration tests and are required to pass before any commit.
- **Coverage**: Integration tests are included in coverage metrics and are expected to be maintained as part of overall test coverage.

### Running Tests
```sh
bun test tests/integration --coverage
```

## Pre-commit Workflow
- Pre-commit hooks will run type-checks, linting (if configured), **all integration tests**, and coverage checks.
- Commits are blocked if any integration test fails or coverage drops below the expected threshold.

## Learnings
- All automation and integration is now local; avoid duplicating or simulating remote-repo structures.
- Always validate script arguments and use timeouts for external commands to prevent hangs.
- Keep script output clean for production and CI.

## Contributing
- Add integration tests for any new scripts or features.
- Keep documentation and test coverage up to date.

#  Automate Workloads: LLM-Powered Automation Ecosystem with Self-Improving Tools

A comprehensive automation ecosystem that integrates LLMs with GitHub, Raycast, Gmail, Buffer, Twitter API, and Obsidian for seamless workflow automation, planning, and execution. **This system provides powerful automation tools that continuously improve themselves through context fossil storage and self-analysis.**

## 🎯 Overview

This project provides an intelligent automation platform that combines the power of Large Language Models (LLMs) with popular productivity tools to create a seamless workflow automation experience. The system is designed around LLM-friendly documented goals and patterns that enable intelligent planning, execution, and monitoring, while featuring **self-improving tools** that learn and adapt over time.

### Core Features

- **🤖 LLM-Powered Planning**: Intelligent goal decomposition and task prioritization
- **🔄 Cross-Platform Integration**: Seamless integration with GitHub, Obsidian, Gmail, and social platforms
- **📊 Context-Aware Automation**: Adaptive workflows based on real-time context
- **🎯 Plan-to-Action Workflow**: Structured approach from planning to execution
- **📈 Real-Time Monitoring**: Continuous monitoring and optimization
- **🛠️ Modular Architecture**: Extensible service-based architecture
- **🗿 Self-Improving Tools**: Tools that learn, adapt, and preserve knowledge
- **🔧 Repository Orchestration**: Multi-repository analysis and automation
- **📊 Progress Tracking**: Comprehensive monitoring with GitHub Projects integration

## 🚀 Core Automation Tools

### 🔧 Repository Orchestrator
- **Multi-Repository Analysis**: Analyze any GitHub repository for automation opportunities
- **LLM-Powered Planning**: Generate comprehensive action plans and recommendations
- **Automated Execution**: Execute improvements with intelligent decision making
- **Progress Tracking**: Monitor implementation and measure impact
- **GitHub Projects Integration**: Track progress using GitHub Projects boards

### 📊 Progress Monitor & Tracker
- **Real-time Health Monitoring**: Track repository health scores and metrics
- **Historical Trend Analysis**: Analyze improvements over time
- **Automated Insights**: Generate recommendations based on current state
- **Intelligent Next Steps**: Trigger appropriate workflows automatically
- **GitHub Projects Sync**: Keep project boards updated with automation progress

### 🗿 Context Fossil Storage
- **Persistent Knowledge Base**: Store decisions, insights, and context for future reference
- **Multi-Source Input**: Accept input from LLMs, terminals, APIs, and manual sources
- **Versioned Entries**: Track changes and maintain history of all entries
- **LLM Integration**: Provide context summaries and insights for AI systems
- **Learning from Contributions**: Capture knowledge from all project interactions

### 🤖 LLM Workflow Automation
- **Goal Decomposition**: Break down complex goals into actionable tasks
- **Task Prioritization**: Intelligent prioritization based on impact and effort
- **Content Generation**: Automated content creation and optimization
- **Context-Aware Execution**: Adapt workflows based on historical context
- **Pattern Recognition**: Learn from past actions and outcomes

## 🏗️ Architecture

<table>
  <tr>
    <th colspan="2" align="center">LLM-Powered Automation Ecosystem</th>
  </tr>
  <tr>
    <td valign="top"><b>🔧 Repository Orchestrator</b><br>
      <ul>
        <li>Multi-Repository Analysis</li>
        <li>LLM-Powered Planning</li>
        <li>Automated Execution</li>
        <li>Progress Tracking</li>
        <li>GitHub Projects Integration</li>
      </ul>
    </td>
    <td valign="top"><b>📊 Progress Monitor</b><br>
      <ul>
        <li>Health Score Tracking</li>
        <li>Trend Analysis</li>
        <li>Automated Insights</li>
        <li>GitHub Projects Sync</li>
        <li>Intelligent Triggers</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td valign="top"><b>🗿 Context Fossil Storage</b><br>
      <ul>
        <li>Persistent Knowledge Base</li>
        <li>Multi-Source Input</li>
        <li>Versioned Entries</li>
        <li>LLM Integration</li>
        <li>Learning from Contributions</li>
      </ul>
    </td>
    <td valign="top"><b>🤖 LLM Workflow Automation</b><br>
      <ul>
        <li>Goal Decomposition</li>
        <li>Task Prioritization</li>
        <li>Content Generation</li>
        <li>Context-Aware Execution</li>
        <li>Pattern Recognition</li>
      </ul>
    </td>
  </tr>
</table>

## 🚀 Quick Start

### Prerequisites
```bash
# Install Bun (our preferred runtime)
curl -fsSL https://bun.sh/install | bash

# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu/Debian

# Authenticate with GitHub
gh auth login
```

### Installation
```bash
# Clone the repository
git clone https://github.com/barreraslzr/automate_workloads.git
cd automate_workloads

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your API keys and configuration
```

### First Steps

```bash
# Initialize context fossil storage (for self-improvement)
bun run context:init

# Test the LLM planning system
bun run llm:plan decompose "Your automation goal"

# Use the repository orchestrator tool
bun run repo:analyze barreraslzr automate_workloads

# Gather context from all services
bun run context:gather gather

# Use the progress monitoring tool
bun run repo:monitor barreraslzr automate_workloads

# Run the QA workflow
bun run qa:workflow

# Create a new plan (unified orchestrator)
bun run repo-orchestrator orchestrate <owner> <repo> --workflow plan --plan-mode both --output plan.json

# Example:
bun run repo-orchestrator orchestrate barreraslzr automate_workloads --workflow plan --plan-mode both --output plan.json
```

## 🤖 LLM Integration Patterns

### Pattern 1: Plan → Analyze → Execute → Monitor

```typescript
interface LLMWorkflowPattern {
  planning: {
    input: "Human-defined goals and constraints";
    llmRole: "Break down complex goals into actionable tasks";
    output: "Structured task plan with dependencies and timelines";
  };
  analysis: {
    input: "Current system state and historical data";
    llmRole: "Identify patterns, risks, and optimization opportunities";
    output: "Actionable insights and recommendations";
  };
  execution: {
    input: "Approved action plan";
    llmRole: "Execute tasks with real-time decision making";
    output: "Task completion with detailed logs";
  };
  monitoring: {
    input: "Execution results and system metrics";
    llmRole: "Continuous monitoring and alert generation";
    output: "Health reports and improvement suggestions";
  };
}
```

### Pattern 2: Context-Aware Automation

```typescript
interface ContextAwareAutomation {
  contextGathering: {
    sources: ["GitHub issues", "Gmail threads", "Obsidian notes", "Social media mentions"];
    llmRole: "Synthesize context from multiple sources";
    output: "Unified context for decision making";
  };
  adaptiveExecution: {
    input: "Context + predefined workflows";
    llmRole: "Adapt workflows based on current context";
    output: "Context-appropriate actions";
  };
  learning: {
    input: "Execution results and feedback";
    llmRole: "Learn from outcomes to improve future decisions";
    output: "Updated workflow patterns";
  };
}
```

## 🔧 Available Commands

### Repository Workflow Orchestration 🎯
```bash
# Target any repository with LLM-powered automation
bun run repo:target <owner> <repo> [workflow] [branch] [options]

# Examples:
bun run repo:target microsoft vscode                    # Full orchestration
bun run repo:target facebook react analyze              # Analysis only
bun run repo:target google tensorflow plan main         # Planning only
bun run repo:target openai openai-cookbook full main --output results.json

# Direct CLI commands
bun run repo:orchestrate <owner> <repo> [options]       # Full orchestration
bun run repo:analyze <owner> <repo> [options]           # Repository analysis
```

**Workflow Types:**
- **`analyze`** - Repository analysis and health check
- **`plan`** - LLM-powered planning and recommendations  
- **`execute`** - Execute automation workflows
- **`monitor`** - Monitor and optimize workflows
- **`full`** - Complete orchestration (analyze + plan + execute + monitor)

**Options:**
- `--create-issues` - Create automation issues (default: true)
- `--no-create-issues` - Skip creating automation issues
- `--create-prs` - Create automation PRs
- `--auto-merge` - Enable auto-merge for PRs
- `--no-notifications` - Disable notifications
- `--output <file>` - Save results to file
- `--context <json>` - Additional context (JSON string)

### LLM-Powered Workflows

```bash
# Planning and Analysis
bun run llm:plan decompose "Your goal"           # Decompose goals into tasks
bun run llm:plan prioritize tasks.json           # Prioritize tasks
bun run llm:plan generate-content "blog-post" "topic"  # Generate content

# Context and Execution
bun run context:gather gather                     # Gather context from all services
bun run llm:execute "task-id"                     # Execute LLM-assisted tasks
bun run llm:monitor "execution-id"                # Monitor execution
bun run llm:analyze --code-quality                # Analyze code quality

# Automation Scripts
./scripts/automation/llm-workflow.sh "workflow-type"         # Run LLM-powered workflow
./scripts/automation/llm-issue-manager.sh analyze "data"     # Manage issues with LLM
./scripts/automation/llm-content-automation.sh "type" "topic" "platforms"  # Automate content
```

### 🗿 Context Fossil Storage Tool
```bash
# Initialize fossil storage
bun run context:init

# Add knowledge, decisions, insights
bun run context:add --type decision --title "Use Bun" --content "..." --tags "technology,performance"

# Query and search
bun run context:query --type decision --tags "performance"
bun run context:query --search "automation"

# Get context for LLMs
bun run context:summary --type decision --tags "architecture"

# Export knowledge
bun run context:export --format markdown
bun run context:stats
```

### 📊 Progress Monitor Tool
```bash
# Comprehensive monitoring and tracking
bun run repo:monitor <owner> <repo>

# Quick status check
bun run repo:status <owner> <repo>

# Track progress over time
bun run repo:track <owner> <repo>
```

### Quality Assurance

```bash
# Complete QA workflow
bun run qa:workflow                               # Run full QA pipeline
bun run qa:review <pr-number>                     # Review PR with LLM
bun run qa:test                                   # Run comprehensive tests

# Individual QA steps
bun run lint                                      # Lint code
bun run type-check                                # Type checking
bun run test                                      # Run tests
```

### Service Integration

```bash
# Service synchronization
bun run github:sync                               # Sync with GitHub
bun run obsidian:sync                             # Sync with Obsidian
bun run gmail:sync                                # Sync with Gmail
bun run social:sync                               # Sync with social platforms
```

### Development Workflow

```bash
# Development setup
bun run dev:setup                                 # Set up development environment
bun run dev:start                                 # Start development server
bun run dev:test                                  # Run tests in watch mode

# Plan management
bun run plan:create "Plan Name"                   # Create new plan
bun run plan:execute "plan-id"                    # Execute plan
bun run plan:monitor "plan-id"                    # Monitor plan execution
```

## 🗿 Self-Improving Capabilities

The tools continuously improve themselves through:

### Context Fossil Storage
- **Persistent Knowledge Base**: Every decision and insight is preserved
- **Multi-Source Input**: Accepts input from LLMs, terminals, APIs, and manual sources
- **Versioned Entries**: Tracks changes and maintains history
- **Relationship Mapping**: Links related entries through parent-child relationships
- **LLM Integration**: Context summaries and insights for AI systems
- **Learning from Contributions**: Captures knowledge from all project interactions

### Self-Monitoring & Analysis
- **Tool Performance Tracking**: Monitor how well each tool performs
- **Usage Pattern Analysis**: Learn from how tools are used
- **Automated Insights**: Generate recommendations for tool improvements
- **Trend Analysis**: Track improvements over time
- **GitHub Projects Integration**: Keep project boards updated with automation progress

### Self-Orchestration
- **Self-Analysis**: Tools can analyze their own codebase and structure
- **Self-Planning**: Generate action plans for self-improvement
- **Self-Monitoring**: Track their own progress and health
- **Self-Documentation**: Automatically document decisions and insights
- **Self-Evolution**: Continuously improve based on learnings

## 🎯 LLM-Friendly Goals

### 1. Intelligent Workflow Orchestration
- **Objective**: Coordinate tasks across GitHub, Obsidian, Gmail, and social platforms
- **Success Metrics**: 70% reduction in manual task switching, 90% error reduction
- **LLM Integration**: Pattern analysis, workflow optimization, real-time decision making
- **Self-Improvement**: Tools learn from each interaction and preserve knowledge

### 2. Smart Content Management
- **Objective**: Automate content creation, scheduling, and cross-platform publishing
- **Success Metrics**: 3x faster content generation, increased engagement
- **LLM Integration**: Content generation, platform optimization, intelligent scheduling
- **Progress Tracking**: Monitor content performance and optimize strategies

### 3. Proactive Issue Management
- **Objective**: Proactively identify and resolve issues before they impact users
- **Success Metrics**: 5-minute detection time, 80% automatic resolution
- **LLM Integration**: Log analysis, pattern recognition, intelligent triage
- **Repository Orchestration**: Multi-repository analysis and automation

### 4. Self-Improving Automation Tools
- **Objective**: Create tools that learn, adapt, and preserve knowledge
- **Success Metrics**: 50% improvement in tool effectiveness over time
- **Context Fossil Storage**: Persistent knowledge base for continuous learning
- **Progress Monitoring**: Track tool performance and user satisfaction

## 🏗️ Architecture

### Service Modules

- **`src/core/`**: Core configuration and utilities
- **`src/services/`**: Service integrations (GitHub, Obsidian, Gmail, etc.)
- **`src/cli/`**: Command-line interface modules
- **`src/types/`**: TypeScript type definitions
- **`src/utils/`**: Utility functions and helpers

### Key Services

- **GitHub Service**: Issue management, PR automation, repository analysis
- **Obsidian Service**: Note management, knowledge graph integration
- **Gmail Service**: Email automation, thread analysis
- **Social Media Service**: Cross-platform content management
- **LLM Service**: AI-powered planning and execution
- **Context Fossil Service**: Persistent knowledge storage and retrieval
- **Progress Monitor Service**: Health tracking and trend analysis

### Scripts

- **`scripts/automation/llm-workflow.sh`**: LLM-powered workflow automation
- **`scripts/automation/llm-issue-manager.sh`**: Intelligent issue management
- **`scripts/automation/llm-content-automation.sh`**: Content generation and distribution
- **`scripts/automation/qa-workflow.sh`**: Quality assurance automation
- **`scripts/automation/review-workflow.sh`**: Code review automation
- **`scripts/automation/monitor-progress.sh`**: Progress monitoring and tracking
- **`scripts/monitoring/quick-status.sh`**: Quick status checks

## 🎯 LLM-Friendly Goals

### 1. Intelligent Workflow Orchestration
- **Objective**: Coordinate tasks across GitHub, Obsidian, Gmail, and social platforms
- **Success Metrics**: 70% reduction in manual task switching, 90% error reduction
- **LLM Integration**: Pattern analysis, workflow optimization, real-time decision making

### 2. Smart Content Management
- **Objective**: Automate content creation, scheduling, and cross-platform publishing
- **Success Metrics**: 3x faster content generation, increased engagement
- **LLM Integration**: Content generation, platform optimization, intelligent scheduling

### 3. Proactive Issue Management
- **Objective**: Proactively identify and resolve issues before they impact users
- **Success Metrics**: 5-minute detection time, 80% automatic resolution
- **LLM Integration**: Log analysis, pattern recognition, intelligent triage


## 📚 Documentation

- **[📖 Contributing Guide](CONTRIBUTING_GUIDE.md)**: Comprehensive guide for contributors with LLM-friendly patterns
- **[🔧 Development Guide](docs/DEVELOPMENT_GUIDE.md)**: Technical development guidelines
- **[📋 API Reference](docs/API_REFERENCE.md)**: Complete API documentation
- **[📖 Documentation README](docs/README.md)**: Documentation overview
- **[🗿 Context Fossil Storage](./docs/CONTEXT_FOSSIL_STORAGE.md)** - Complete fossil storage guide
- **[📊 Progress Tracking](./docs/PROGRESS_TRACKING.md)** - Monitoring and tracking guide
- **[🔧 Repository Orchestrator](./docs/REPOSITORY_ORCHESTRATOR.md)** - Orchestration system guide
- **[🔗 GitHub Workflow Integration](./docs/GITHUB_WORKFLOW_INTEGRATION.md)** - GitHub Actions integration

## 🤝 Contributing

We welcome contributions! Please see our comprehensive [Contributing Guide](CONTRIBUTING_GUIDE.md) for detailed information on:

- **LLM-Friendly Patterns**: How to write code and documentation that works well with LLMs
- **Development Workflow**: Step-by-step guide for contributors
- **Quality Assurance**: Testing and review processes
- **Documentation Standards**: How to write LLM-friendly documentation
- **Context Fossil Storage**: How to add and maintain knowledge
- **Self-Improvement**: How the tools learn from contributions

### Quick Contribution Start

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Create an issue for tracking
gh issue create --title "Implement [Feature Name]" --body "Working on [description]" --label "enhancement"

# 3. Set up development environment
bun run dev:setup

# 4. Make your changes
# ... your code changes ...

# 5. Test your changes
bun run qa:test

# 6. Create a pull request
gh pr create --title "feat: implement [Feature Name]" --body "Closes #<issue-number>"
```

## 📊 Project Status

- ✅ **Core Architecture**: Modular service-based architecture
- ✅ **GitHub Integration**: Issue management and repository analysis
- ✅ **LLM Planning**: Goal decomposition and task prioritization
- ✅ **Context Gathering**: Multi-service context collection
- ✅ **Automation Scripts**: LLM-powered workflow automation
- ✅ **Quality Assurance**: Comprehensive testing and review workflows
- ✅ **Documentation**: LLM-friendly documentation and guides
- ✅ **Context Fossil Storage**: Persistent knowledge base implementation
- ✅ **Progress Monitoring**: Health tracking and trend analysis
- ✅ **Repository Orchestration**: Multi-repository analysis and automation
- 🔄 **Service Integrations**: Ongoing development of Gmail, Obsidian, and social media integrations
- 🔄 **LLM API Integration**: Integration with actual LLM APIs (currently simulated)

## 🚀 Roadmap

### Phase 1: Core LLM Integration ✅
- [x] LLM planning and goal decomposition
- [x] Context gathering and synthesis
- [x] Basic automation scripts
- [x] Quality assurance workflows
- [x] Context fossil storage implementation
- [x] Progress monitoring and tracking

### Phase 2: Service Integrations 🔄
- [x] GitHub integration
- [x] Repository orchestration
- [ ] Gmail API integration
- [ ] Obsidian vault integration
- [ ] Twitter API integration
- [ ] Buffer API integration

### Phase 3: Advanced Features 📋
- [ ] Real LLM API integration
- [ ] Advanced workflow orchestration
- [ ] Machine learning for pattern recognition
- [ ] Predictive analytics
- [ ] Advanced content generation
- [ ] Real-time dashboard

### Phase 4: Platform Expansion 📋
- [ ] Raycast extension
- [ ] Web dashboard
- [ ] Mobile app
- [ ] API for third-party integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bun**: For the fast JavaScript runtime
- **GitHub CLI**: For seamless GitHub integration
- **Zod**: For runtime type validation
- **Commander**: For CLI interface
- **TypeScript**: For type safety

---

**Key Takeaway**: This automation ecosystem demonstrates how LLMs can be integrated with existing productivity tools to create intelligent, context-aware workflows that significantly improve efficiency and reduce manual effort, while featuring **self-improving tools** that learn, adapt, and preserve knowledge over time! 🤖✨🗿

## Available Scripts

Below are the main scripts you can run with Bun. Use `bun run <script-name>` to execute any of them.

### Issues
- `issues:ci` — List issues labeled 'ci'
- `issues:check` — Run the check-issues shell script (`scripts/monitoring/check-issues.sh`)
- `issues:ensure-demo` — Ensure demo issue via TypeScript script
- `issues:list` — List all issues
- `issues:manager` — Run the LLM issue manager shell script
- `issues:milestone:implementation` — List issues for the 'Implementation Complete' milestone
- `issues:milestone:research` — List issues for the 'Research and Design Complete' milestone
- `issues:quality` — List issues labeled 'quality'
- `issues:testing` — List issues labeled 'testing'

### Context
- `context:add` — Add context fossil
- `context:backup` — Backup context using shell script
- `context:export` — Export context fossil
- `context:get` — Get context fossil
- `context:init` — Initialize context fossil
- `context:query` — Query context fossil
- `context:stats` — Show context fossil stats
- `context:summary` — Generate context summary
- `context:update` — Update context fossil

### Projects
- `projects:integration` — Run GitHub projects integration shell script
- `projects:report` — Generate a projects report
- `projects:setup` — Setup GitHub projects
- `projects:sync` — Sync GitHub projects

### Repo
- `repo:analyze` — Analyze repository with orchestrator
- `repo:context` — Gather repository context
- `repo:examples` — Run repository orchestration example
- `repo:monitor-progress` — Monitor repository progress
- `repo:orchestrate` — Orchestrate repository with orchestrator
- `repo:orchestrator` — Run the repo orchestrator shell script
- `repo:plan` — Run LLM plan for repository
- `repo:quick-status` — Show quick repository status
- `repo:simple-monitor` — Run simple monitor shell script
- `repo:status` — Show repository status
- `repo:target` — Run repo orchestrator shell script
- `repo:track` — Track repository progress

### QA
- `qa:review` — Run review workflow shell script
- `qa:test` — Run tests, lint, and type-check
- `qa:workflow` — Run QA workflow shell script

### Workflow
- `workflow:automate` — Run LLM workflow shell script
- `workflow:content` — Run content automation shell script
- `workflow:issues` — Run LLM issue manager shell script
- `workflow:llm` — Run LLM workflow shell script
- `workflow:qa` — Run QA workflow shell script
- `workflow:review` — Run review workflow shell script
- `workflow:sync` — Run LLM workflow shell script

### Content
- `content:automation` — Run content automation shell script

### Other
- `build` — Build the orchestrator for Node  
  _(bun: `bun build src/cli/repo-orchestrator.ts --outdir dist --target node`)_
- `demo:ecosystem` — Run the complete automation ecosystem demo  
  _(ts: `examples/complete-automation-ecosystem.ts`)_
- `demo:tool-centric` — Run the tool-centric demo  
  _(ts: `examples/tool-centric-demo.ts`)_
- `dev` — Watch and run the repo orchestrator  
  _(bun: `bun run --watch src/cli/repo-orchestrator.ts`)_
- `dev:start` — Start the GitHub issues CLI  
  _(ts: `src/cli/github-issues.ts`)_
- `dev:setup` — Install dependencies and copy .env.example  
  _(shell: `bun install && cp .env.example .env`)_
- `dev:test` — Watch and run tests  
  _(bun: `bun test --watch`)_
- `docs` — Open documentation  
  _(md: `docs/README.md`)_
- `format` — Format code with Prettier  
  _(shell: `prettier --write src/**/*.ts`)_
- `gmail:sync` — Sync Gmail  
  _(ts: `src/cli/gmail-sync.ts`)_
- `lint` — Lint the codebase  
  _(bun: `bun run --bun eslint src/**/*.ts`)_
- `obsidian:sync` — Sync Obsidian  
  _(ts: `src/cli/obsidian-sync.ts`)_
- `plan:create` — Create a plan  
  _(ts: `src/cli/create-plan.ts`)_
- `plan:execute` — Execute a plan  
  _(ts: `src/cli/execute-plan.ts`)_
- `plan:monitor` — Monitor a plan  
  _(ts: `src/cli/monitor-plan.ts`)_
- `release:execute` — Execute a release  
  _(ts: `src/cli/release-execute.ts`)_
- `release:monitor` — Monitor a release  
  _(ts: `src/cli/release-monitor.ts`)_
- `release:plan` — Plan a release  
  _(ts: `src/cli/release-plan.ts`)_
- `social:sync` — Sync social accounts  
  _(ts: `src/cli/social-sync.ts`)_
- `start` — Start the GitHub issues CLI  
  _(ts: `src/cli/github-issues.ts`)_
- `test` — Run tests  
  _(bun: `bun test`)_
- `type-check` — Type-check the codebase  
  _(bun: `bun run --bun tsc --noEmit`)_
- `examples` — Run basic usage example  
  _(ts: `examples/basic-usage.ts`)_
- `llm:analyze` — Analyze with LLM  
  _(ts: `src/cli/llm-analyze.ts`)_
- `llm:execute` — Execute with LLM  
  _(ts: `src/cli/llm-execute.ts`)_
- `llm:monitor` — Monitor with LLM  
  _(ts: `src/cli/llm-monitor.ts`)_
- `llm:plan` — Plan with LLM  
  _(ts: `src/cli/llm-plan.ts`)_
- `issues` — Run the GitHub issues CLI  
  _(ts: `src/cli/github-issues.ts`)_
- `github:sync` — Sync GitHub  
  _(ts: `src/cli/github-sync.ts`)_
- `llm:plan review-comments` — Generate LLM-powered review comments for a PR  
  _(ts: `src/cli/llm-plan-review-comments.ts`)_

## Shell Script Testing: Unit vs. Integration

### Unit Tests
- Located in `tests/unit/scripts/` and its subdirectories.
- Fast, do not require network or external services.
- Run with:
  ```sh
  bun run test:unit
  ```

### Integration Tests
- Located in `tests/integration/` and named with `.integration.test.ts`.
- Require a fully provisioned environment (network, GitHub CLI, etc.).
- Marked with `[integration]` in the test name and a comment.
- Run with:
  ```sh
  bun run test:integration
  ```

### Auditing Shell Script Test Coverage
- Use the audit script to ensure every `.sh` file has a corresponding `.test.ts` file:
  ```sh
  bun run test:audit
  ```
- The script will exit 1 and print missing files if any are missing, or print a success message and exit 0 if all are covered.

### CI Recommendations
- Run unit tests on every commit/PR.
- Run integration tests only in a fully provisioned environment (e.g., nightly or on demand).
- Add a CI job to run the audit script and fail if any shell script is missing a test.

## Local Testing Scripts

You can use the following npm scripts (defined in `package.json`) for a streamlined local workflow:

- **Unit tests (fast, no network required):**
  ```sh
  bun run test:unit
  ```
- **Integration tests (requires full environment):**
  ```sh
  bun run test:integration
  ```
- **Audit shell script test coverage:**
  ```sh
  bun run test:audit
  ```
- **CI workflow (unit tests + audit):**
  ```sh
  bun run ci
  ```

These scripts ensure you and your contributors can easily run the right tests for every situation. See the "Shell Script Testing: Unit vs. Integration" section above for more details.

## 🧠 Automation Actions Reference (LLM-Friendly)

For a complete, machine-readable list of all user-facing automation actions, see [`ACTIONS_MANIFEST.yml`](./ACTIONS_MANIFEST.yml).

Below is a sample of available actions. For full details, arguments, and categories, refer to the YAML file.

| Name                | Category      | Description                                      | Example Usage                        |
|---------------------|--------------|--------------------------------------------------|--------------------------------------|
| context:add         | Context      | Add context fossil data                          | `bun run context:add`                |
| issues:check        | Issues       | Run check-issues.sh (monitoring)                 | `bun run issues:check`               |
| repo:plan           | Repository   | Run LLM plan CLI                                 | `bun run repo:plan`                  |
| qa:test             | QA           | Run all tests, lint, and type-check              | `bun run qa:test`                    |
| test:unit           | Testing      | Run unit tests                                   | `bun run test:unit`                  |
| test:audit          | Audit        | Run audit shell script                           | `bun run test:audit`                 |
| ci                  | CI           | Run CI pipeline (unit tests + audit)             | `bun run ci`                         |
| llm:plan review-comments | LLM | Generate LLM-powered review comments for a PR | `bun run llm:plan review-comments 123` |

See the YAML manifest for the full, up-to-date list and for LLMs to programmatically access all actions.

## Environment Setup

Before running any CLI tools or tests, copy `.env.example` to `.env` and fill in the required values:

```sh
cp .env.example .env
```

**Required environment variables:**
- `OPENAI_API_KEY`: Your OpenAI API key (required for LLM planning)
- `GITHUB_TOKEN`: Your GitHub token (required for issue integration)
- `GMAIL_TOKEN`, `BUFFER_TOKEN`, `TWITTER_BEARER_TOKEN`: Optional, for additional integrations

See `.env.example` for a complete list and example values.

## 🚀 New Features

### LLM-Generated Excerpts for Fossils
Every fossil now includes an LLM-generated `excerpt` field—a one-sentence summary generated using the fossil's type, title, tags, metadata, and content. This makes it easy to scan, search, and report on your fossil store.

#### Example Fossil JSON
```json
{
  "type": "observation",
  "title": "Orchestration Output - barreraslzr/automate_workloads",
  "excerpt": "This fossil summarizes the orchestration output for the repo, including analysis, execution, and monitoring results.",
  "tags": ["orchestration", "automation", "snapshot"],
  ...
}
```

### Updated CLI & Reporting Tools
- `bun run src/cli/context-fossil.ts list --type observation` now shows excerpts and tags for quick scanning.
- `bun run scripts/fossil-summary-md.ts` outputs a Markdown table of all key fossils (type, title, created, tags, excerpt).
- `bun run scripts/fossil-summary-json.ts` outputs the same summary as JSON for automation.
- Cleanup scripts (`scripts/cleanup-fossils.ts`, `scripts/cleanup-test-fossils.ts`) keep your fossil store production-ready.

### Auditability & Reporting
With excerpts and summary tools, you can easily audit, report, and visualize the state of your repo at any time.

## Fossil Provenance and Traceability

Every fossil entry now includes:
- `source`: A high-level string indicating the origin (e.g., 'repo-orchestrator', 'llm', 'automated').
- `metadata.invocation`: The script name and up to the first three arguments used to create the fossil (e.g., 'repo-orchestrator-orchestrate-owner-repo').

This ensures fossils are both easy to categorize and fully traceable to the exact command that created them.

## Fossil-Backed Issue Creation (Preferred Standard)

> **All new GitHub issues must be created using the fossil-backed utility.**
> This ensures deduplication, traceability, and context preservation for every issue.

### Why?
- Prevents duplicate issues by content hash
- Links every issue to a fossil (persistent context entry)
- Enables robust automation, reporting, and self-improvement

### How to Use

#### CLI (Recommended for scripts and automation)
```sh
bun run src/cli/create-fossil-issue.ts \
  --owner barreraslzr \
  --repo automate_workloads \
  --title "My Issue Title" \
  --body "My issue body" \
  --labels "automation,bug" \
  --milestone "Sprint 1"
```

#### TypeScript Utility (for programmatic use)
```typescript
import { createFossilIssue } from './src/utils/fossilIssue';

const result = await createFossilIssue({
  owner: 'barreraslzr',
  repo: 'automate_workloads',
  title: 'My Issue Title',
  body: 'My issue body',
  labels: ['automation', 'bug'],
  milestone: 'Sprint 1',
});
if (result.deduplicated) {
  console.log('Issue already exists for fossil hash:', result.fossilHash);
} else {
  console.log('Created issue #', result.issueNumber);
}
```

> **Warning:** Do NOT use direct `gh issue create` or `GitHubService.createIssue` for new issues. These are deprecated in favor of fossil-backed creation.

## 🦴 Migration & Issue Update Workflow

### LLM-Powered Issue Migration & Update

You can migrate or update legacy issues to a modern, automation-friendly format using:

```sh
bun run scripts/migrations/003-migrate-legacy-issues.ts --update <issue_number> <markdown_file>
```

- This command reads the markdown file, extracts purpose, checklist, and metadata (using OpenAI LLM if `OPENAI_API_KEY` is set), and updates the GitHub issue with a structured markdown + JSON block body.
- If `OPENAI_API_KEY` is not set, robust local extraction is used.

### Batch Migration

To migrate all open issues to the modern format:

```sh
bun run scripts/migrations/003-migrate-legacy-issues.ts
```

### Environment Variables
- `OPENAI_API_KEY`: (optional) If set, enables LLM-powered extraction for issue migration and updates.

### Canonical Issue Body Format
All issues and fossils now use a structured markdown + JSON block format for robust automation, deduplication, and traceability.
