# 🤖 Automation Ecosystem

A comprehensive automation suite that integrates Obsidian, GitHub Projects, Gmail, Buffer, and Twitter APIs to streamline your workflow management and content creation process.

## 🏗️ Architecture Overview

This project provides a modular automation system built with:
- **Bun** - Fast JavaScript runtime for CLI operations
- **TypeScript** - Type-safe development
- **Zod** - Runtime validation for configuration and data
- **CLI Tools** - Direct integration with service APIs (GitHub CLI, curl, etc.)
- **Raycast** - macOS productivity integration (optional)

## 📁 Project Structure

```
automate_workloads/
├── src/
│   ├── core/           # Core configuration and utilities
│   │   └── config.ts   # Environment and configuration management
│   ├── services/       # Service integrations
│   │   └── github.ts   # GitHub API integration
│   ├── cli/           # CLI command implementations
│   │   └── github-issues.ts
│   ├── types/         # TypeScript type definitions
│   │   └── index.ts
│   └── utils/         # Shared utility functions
│       └── cli.ts     # CLI execution utilities
├── docs/              # Documentation and guides
├── examples/          # Usage examples and templates
├── package.json       # Project configuration and scripts
└── tsconfig.json      # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed (>=1.0.0)
- [GitHub CLI](https://cli.github.com/) installed and authenticated
- Access to service APIs (Twitter, Gmail, Buffer, etc.)

### Installation
```bash
# Clone the repository
git clone https://github.com/BarreraSlzr/automate_workloads.git
cd automate_workloads

# Install dependencies
bun install
```

### Available Scripts
```bash
# Start with GitHub issues CLI
bun start

# Run GitHub issues command
bun run issues

# Run examples
bun run examples

# Run tests
bun test

# View documentation
bun run docs
```

### Basic Usage
```bash
# Fetch GitHub issues
bun run issues

# Run comprehensive examples
bun run examples

# Use CLI with options
bun run issues --state closed --format table
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with your service tokens:
```bash
# GitHub (optional - uses gh CLI by default)
GITHUB_TOKEN=your_github_token

# Twitter API
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Gmail API
GMAIL_TOKEN=your_gmail_token

# Buffer API
BUFFER_TOKEN=your_buffer_token
```

### Service Authentication
- **GitHub**: Uses `gh auth login` for CLI operations
- **Twitter**: Bearer token from Twitter Developer Portal
- **Gmail**: OAuth token from Google Cloud Console
- **Buffer**: API token from Buffer Developer Portal

## 📚 Documentation

- [LLM Onboarding Guide](llm_onboarding.md) - Development preferences and conventions
- [API Documentation](docs/README.md) - Service integration guides
- [Examples](examples/basic-usage.ts) - Usage examples and templates

## 🛠️ Development

### Adding New Services
1. Create a new service file in `src/services/`
2. Add CLI commands in `src/cli/`
3. Update types in `src/types/`
4. Document in `docs/`

### Code Style
- Use TypeScript with strict mode
- Include JSDoc comments for all functions
- Validate inputs with Zod schemas
- Prefer CLI tools over SDKs when available

### Project Scripts
- `bun start` - Run the main GitHub issues CLI
- `bun run issues` - Alias for GitHub issues command
- `bun run examples` - Run comprehensive usage examples
- `bun test` - Run test suite
- `bun run docs` - View project documentation

## 🔌 Current Integrations

### ✅ GitHub Integration
- **Status**: Fully implemented
- **Features**: Issue management, repository info, comments
- **CLI**: `bun run issues`

### 🚧 Planned Integrations
- **Twitter**: API v2 with bearer token authentication
- **Gmail**: OAuth-based email management
- **Buffer**: Social media post scheduling
- **Obsidian**: Note management and daily notes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests and documentation
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for automation enthusiasts using Bun**
