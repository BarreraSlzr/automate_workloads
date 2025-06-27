# MCP CLI - Modal Context Protocol Command Line Interface

## 🎯 Overview

The MCP CLI is a unified command-line interface for the `automate_workloads` ecosystem that provides comprehensive automation capabilities for repository orchestration, LLM-powered planning, context management, and workflow automation.

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/BarreraSlzr/automate_workloads.git
cd automate_workloads

# Install dependencies
bun install

# Make MCP CLI executable
chmod +x mcp-cli.ts

# Check system status
bun run mcp:status
```

### First Steps

```bash
# List all available commands
bun run mcp:list

# Initialize context storage
bun run mcp context init

# Analyze a repository
bun run mcp repo microsoft vscode --workflow analyze

# Run QA workflow
bun run mcp workflow qa
```

## 📋 Available Commands

### Repository Orchestration

```bash
# Full orchestration workflow
bun run mcp repo <owner> <repo> --workflow full

# Analysis only
bun run mcp repo <owner> <repo> --workflow analyze

# Planning only
bun run mcp repo <owner> <repo> --workflow plan

# Execution only
bun run mcp repo <owner> <repo> --workflow execute

# Monitoring only
bun run mcp repo <owner> <repo> --workflow monitor
```

**Examples:**
```bash
# Analyze Microsoft VSCode repository
bun run mcp repo microsoft vscode --workflow analyze

# Full orchestration of React repository
bun run mcp repo facebook react --workflow full

# Plan improvements for a repository
bun run mcp repo google tensorflow --workflow plan
```

### Context Fossil Storage

```bash
# Initialize context storage
bun run mcp context init

# Add context data
bun run mcp context add --data '{"project": "automate_workloads", "phase": "planning"}'

# Query context
bun run mcp context query --query "automation patterns"

# Export context
bun run mcp context export --output context.json

# Get context stats
bun run mcp context stats
```

### LLM-Powered Operations

```bash
# Generate plan
bun run mcp llm plan --goal "Improve repository automation"

# Analyze current state
bun run mcp llm analyze --context '{"repo": "owner/repo"}'

# Execute LLM workflow
bun run mcp llm execute --goal "Deploy automation improvements"

# Monitor LLM operations
bun run mcp llm monitor
```

### Workflow Automation

```bash
# Run QA workflow
bun run mcp workflow qa

# Run review workflow
bun run mcp workflow review

# Run content automation
bun run mcp workflow content

# Run issue management
bun run mcp workflow issues

# Run general automation
bun run mcp workflow automate

# Sync workflows
bun run mcp workflow sync
```

### GitHub Integration

```bash
# List issues
bun run mcp issues list

# List CI issues
bun run mcp issues ci

# List quality issues
bun run mcp issues quality

# Run issue manager
bun run mcp issues manager

# Projects integration
bun run mcp projects integration

# Projects sync
bun run mcp projects sync
```

### Development Operations

```bash
# Build project
bun run mcp dev build

# Start development server
bun run mcp dev start

# Setup environment
bun run mcp dev setup

# Run tests
bun run mcp dev test

# Format code
bun run mcp dev format

# Lint code
bun run mcp dev lint

# Type check
bun run mcp dev type-check
```

### Testing Operations

```bash
# Run unit tests
bun run mcp test unit

# Run integration tests
bun run mcp test integration

# Run audit tests
bun run mcp test audit

# Watch mode
bun run mcp test unit --watch
```

### Migration Operations

```bash
# Migrate up
bun run mcp migrate up

# Migrate down
bun run mcp migrate down

# Check migration status
bun run mcp migrate status

# List migrations
bun run mcp migrate list
```

### Utility Commands

```bash
# List all available commands
bun run mcp list

# Show system status
bun run mcp status

# Show help
bun run mcp --help
```

## 🎯 Use Cases

### Use Case 1: Repository Onboarding

```bash
# Analyze a new repository for automation opportunities
bun run mcp repo microsoft vscode --workflow analyze

# Generate a comprehensive improvement plan
bun run mcp repo microsoft vscode --workflow plan

# Execute the improvements
bun run mcp repo microsoft vscode --workflow execute

# Monitor the progress
bun run mcp repo microsoft vscode --workflow monitor
```

### Use Case 2: Context-Driven Development

```bash
# Initialize context storage
bun run mcp context init

# Add development context
bun run mcp context add --data '{"project": "automate_workloads", "phase": "planning"}'

# Generate LLM plan with context
bun run mcp llm plan --goal "Implement new automation feature" --context '{"project": "automate_workloads"}'

# Execute with context awareness
bun run mcp llm execute --goal "Deploy automation improvements"
```

### Use Case 3: Automated QA Pipeline

```bash
# Run comprehensive QA workflow
bun run mcp workflow qa

# Run specific QA tests
bun run mcp qa test

# Run review workflow
bun run mcp workflow review

# Monitor QA metrics
bun run mcp repo owner/repo --workflow monitor
```

### Use Case 4: GitHub Project Management

```bash
# List current issues
bun run mcp issues list

# Run issue manager
bun run mcp issues manager

# Sync GitHub projects
bun run mcp projects sync

# Generate project report
bun run mcp projects report
```

## 🔧 Configuration

### Environment Setup

The MCP CLI uses the same environment configuration as the main `automate_workloads` project:

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Required Environment Variables

```bash
# GitHub API token
GITHUB_TOKEN=your_github_token

# LLM API keys (if using external LLM services)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Project configuration
PROJECT_ROOT=/path/to/project
CONTEXT_STORAGE_PATH=/path/to/context
```

### Package.json Integration

The MCP CLI integrates with existing `package.json` scripts:

```json
{
  "scripts": {
    "mcp": "bun run mcp-cli.ts",
    "mcp:help": "bun run mcp-cli.ts --help",
    "mcp:list": "bun run mcp-cli.ts list",
    "mcp:status": "bun run mcp-cli.ts status",
    "mcp:repo": "bun run mcp-cli.ts repo",
    "mcp:context": "bun run mcp-cli.ts context",
    "mcp:llm": "bun run mcp-cli.ts llm",
    "mcp:workflow": "bun run mcp-cli.ts workflow",
    "mcp:issues": "bun run mcp-cli.ts issues",
    "mcp:projects": "bun run mcp-cli.ts projects",
    "mcp:qa": "bun run mcp-cli.ts qa",
    "mcp:dev": "bun run mcp-cli.ts dev",
    "mcp:migrate": "bun run mcp-cli.ts migrate",
    "mcp:test": "bun run mcp-cli.ts test"
  }
}
```

## 🔄 Workflow Examples

### Complete Repository Automation

```bash
# 1. Initialize context storage
bun run mcp context init

# 2. Analyze repository
bun run mcp repo owner/repo --workflow analyze

# 3. Generate improvement plan
bun run mcp repo owner/repo --workflow plan

# 4. Execute improvements
bun run mcp repo owner/repo --workflow execute

# 5. Monitor progress
bun run mcp repo owner/repo --workflow monitor

# 6. Run QA workflow
bun run mcp workflow qa

# 7. Sync GitHub projects
bun run mcp projects sync
```

### Development Workflow

```bash
# 1. Setup development environment
bun run mcp dev setup

# 2. Start development server
bun run mcp dev start

# 3. Run tests in watch mode
bun run mcp test unit --watch

# 4. Format and lint code
bun run mcp dev format
bun run mcp dev lint

# 5. Type check
bun run mcp dev type-check

# 6. Build project
bun run mcp dev build
```

### Quality Assurance Pipeline

```bash
# 1. Run comprehensive QA workflow
bun run mcp workflow qa

# 2. Run specific QA tests
bun run mcp qa test

# 3. Run review workflow
bun run mcp workflow review

# 4. Check for quality issues
bun run mcp issues quality

# 5. Run audit tests
bun run mcp test audit
```

## 🛠️ Troubleshooting

### Common Issues

1. **GitHub CLI not available**
   ```bash
   # Install GitHub CLI
   brew install gh  # macOS
   sudo apt install gh  # Ubuntu/Debian
   
   # Authenticate
   gh auth login
   ```

2. **Bun runtime not available**
   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Missing dependencies**
   ```bash
   # Install dependencies
   bun install
   ```

4. **Permission denied**
   ```bash
   # Make CLI executable
   chmod +x mcp-cli.ts
   ```

### Debug Mode

```bash
# Run with debug output
DEBUG=1 bun run mcp repo owner/repo --workflow analyze
```

### Log Files

The MCP CLI generates logs in the following locations:
- `logs/mcp-cli.log` - General CLI logs
- `logs/repo-orchestrator.log` - Repository orchestration logs
- `logs/llm-operations.log` - LLM operation logs
- `logs/context-storage.log` - Context storage logs

## 📊 Monitoring and Metrics

### System Status

```bash
# Check system status
bun run mcp status
```

### Progress Tracking

```bash
# Monitor repository progress
bun run mcp repo owner/repo --workflow monitor

# Check context statistics
bun run mcp context stats
```

### Performance Metrics

The MCP CLI tracks various performance metrics:
- Command execution time
- Success/failure rates
- Resource usage
- API call statistics

## 🔮 Future Enhancements

### Planned Features

1. **Enhanced LLM Integration**
   - Multi-model support
   - Fine-tuned models
   - Real-time learning

2. **Advanced Context Management**
   - Semantic search
   - Context clustering
   - Cross-repository context

3. **Workflow Orchestration**
   - Visual workflow builder
   - Workflow templates
   - Conditional execution

4. **Integration Ecosystem**
   - Plugin system
   - API gateway
   - Web dashboard

### Contributing

To contribute to the MCP CLI:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📚 Documentation

- [MCP CLI Design](MCP_CLI_DESIGN.md) - Detailed design documentation
- [Automation Workflow Diagram](AUTOMATION_WORKFLOW_DIAGRAM.md) - Complete workflow diagrams
- [API Reference](docs/API_REFERENCE.md) - API documentation
- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Development guidelines

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/BarreraSlzr/automate_workloads/issues)
- **Discussions**: [GitHub Discussions](https://github.com/BarreraSlzr/automate_workloads/discussions)
- **Documentation**: [Project Wiki](https://github.com/BarreraSlzr/automate_workloads/wiki)

---

The MCP CLI provides a unified, intelligent, and extensible interface for managing automation workloads across the entire development lifecycle, from repository analysis to project management and quality assurance. 