# 📁 Project Structure

This document describes the current structure of the `automate_workloads` project, reflecting the latest organization for maintainability, clarity, and scalability.

## Directory Tree

```
automate_workloads/
├── src/                      # TypeScript source code
│   ├── cli/                  # CLI entry points and commands
│   ├── core/                 # Core utilities and configuration
│   ├── services/             # Integrations with external services (e.g., GitHub)
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions and helpers
│
├── scripts/                  # Shell scripts, organized by purpose
│   ├── automation/           # Automation and workflow scripts
│   ├── monitoring/           # Monitoring and status scripts
│   └── setup/                # Setup and utility scripts
│
├── tests/                    # All test files
│   ├── unit/                 # Unit tests
│   │   └── scripts/          # Shell script test suites
│   │       ├── automation/   # Tests for automation scripts
│   │       ├── monitoring/   # Tests for monitoring scripts
│   │       ├── setup/        # Tests for setup scripts
│   │       └── base-tester.ts# Script testing utility
│   ├── integration/          # Integration tests
│   └── examples/             # Example scripts and usage demos
│
├── docs/                     # Project documentation
├── context-backups/          # Context backup files
├── .github/                  # GitHub workflows and templates
├── node_modules/             # Dependencies
├── .cursor/                  # Cursor IDE config
├── package.json              # Project configuration
├── tsconfig.json             # TypeScript configuration
├── bun.lock                  # Bun lock file
├── README.md                 # Main documentation
├── TEST_PLAN.md              # Testing strategy
├── CONTRIBUTING_GUIDE.md     # Contribution guidelines
├── CLAUDE.md                 # Claude-specific docs
├── llm_onboarding.md         # LLM onboarding guide
└── .gitignore                # Git ignore rules
```

## Directory Explanations

- **src/**: All TypeScript source code, organized by function (CLI, core, services, types, utils).
- **scripts/**: All shell scripts, grouped by automation, monitoring, or setup purpose.
- **tests/**: All test files, with subfolders for unit, integration, and e2e tests. Shell script tests mirror the scripts/ structure.
- **examples/**: Example usage and demo scripts.
- **docs/**: Project documentation and guides.
- **context-backups/**: Stores backup files for project context.
- **.github/**: GitHub Actions workflows and templates.
- **node_modules/**: Installed dependencies.
- **.cursor/**: Cursor IDE configuration.
- **package.json, tsconfig.json, bun.lock**: Project configuration files.
- **README.md, TEST_PLAN.md, CONTRIBUTING_GUIDE.md, CLAUDE.md, llm_onboarding.md**: Top-level documentation and guides.
- **.gitignore**: Git ignore rules.

---

This structure is designed for clarity, maintainability, and ease of contribution. Add new scripts, tests, or documentation in the appropriate subdirectory following these conventions. 