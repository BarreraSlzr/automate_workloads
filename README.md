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
│   ├── services/       # Service integrations (GitHub, Gmail, etc.)
│   ├── cli/           # CLI command implementations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utility functions
├── docs/              # Documentation and guides
├── examples/          # Usage examples and templates
└── cli/              # Legacy CLI commands (to be migrated)
```

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed
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

### Basic Usage
```bash
# Fetch GitHub issues
bun run src/cli/github-issues.ts

# Get Twitter mentions
bun run src/cli/twitter-mentions.ts

# Update Obsidian daily notes
bun run src/cli/obsidian-daily.ts
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
- [API Documentation](docs/) - Service integration guides
- [Examples](examples/) - Usage examples and templates

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests and documentation
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for automation enthusiasts**
