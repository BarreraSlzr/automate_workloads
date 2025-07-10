# 🧠 LLM Insights Workflow Documentation

## 📋 Overview

The LLM Insights Workflow is an automated system that generates AI-powered analysis and recommendations for code changes, providing structured insights that guide both human decision-making and AI-powered automation.

### 🎯 Purpose
- **Automated Analysis**: Generate insights for every code change
- **Structured Data**: Provide consistent, machine-readable analysis
- **Human Guidance**: Offer actionable recommendations for developers
- **Audit Trail**: Maintain traceable, reproducible AI-generated content

### 🔄 Workflow Diagram

```mermaid
graph TD
    A[Developer Makes Changes] --> B[Git Add/Commit]
    B --> C[Pre-commit Hook Triggered]
    C --> D[Type Check: bun run tsc --noEmit]
    D --> E[Git Diff Analysis]
    E --> F[LLM Insight Generation]
    F --> G[Insight Validation]
    G --> H[Fossil Storage]
    H --> I[Roadmap Integration]
    I --> J[Commit Proceeds]
    
    style A fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style F fill:#e8f5e8
    style H fill:#fff8e1
    style J fill:#e1f5fe
```

> **Note:** All steps use canonical utilities and are enforced by the validator. Deprecated patterns (direct execSync, JSON.parse, ad-hoc scripts) are blocked.

## 🏗️ Architecture

### System Components

```mermaid
graph LR
    subgraph "Pre-commit Layer"
        A[.husky/pre-commit]
        B[scripts/precommit-llm-insight.ts]
    end
    
    subgraph "Analysis Layer"
        C[src/utils/gitDiffAnalyzer.ts]
        D[src/services/llm.ts]
        E[src/prompts.ts]
    end
    
    subgraph "Storage Layer"
        F[fossils/llm_insights/]
        G[fossils/roadmap.yml]
        H[.llm-usage-log.json]
    end
    
    subgraph "Validation Layer"
        I[Zod Schemas]
        J[Type Checking]
        K[Content Validation]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    B --> I
    I --> J
    J --> K
    
    style A fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style F fill:#fff3e0
    style I fill:#ffebee
```

> **Note:** All steps use canonical utilities and are enforced by the validator. Deprecated patterns (direct execSync, JSON.parse, ad-hoc scripts) are blocked.

### Data Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git
    participant Hook as Pre-commit Hook
    participant Analyzer as Git Diff Analyzer
    participant LLM as LLM Service
    participant Fossil as Fossil Storage
    participant Roadmap as Roadmap
    
    Dev->>Git: git add/commit
    Git->>Hook: Trigger pre-commit
    Hook->>Hook: Type check (tsc)
    Hook->>Analyzer: Analyze changed files
    Analyzer->>LLM: Generate insights
    LLM->>Fossil: Store insight artifacts
    Fossil->>Roadmap: Update roadmap references
    Hook->>Git: Allow commit to proceed
```

## ⚙️ Setup & Configuration

### 1. Pre-commit Hook Setup

The workflow is automatically configured via `.husky/pre-commit`:

```bash
#!/bin/sh
bun run scripts/precommit-validate.ts
```

### 2. Environment Configuration

Required environment variables in `.env`:

```bash
# LLM Provider Configuration
OPENAI_API_KEY=your_openai_key_here
OLLAMA_HOST=http://localhost:11434

# GitHub Integration
GITHUB_TOKEN=your_github_token_here

# Optional: Custom LLM Settings
LLM_PREFER_LOCAL=true
LLM_DEFAULT_MODEL=llama2
```

### 3. LLM Provider Priority

```mermaid
graph TD
    A[LLM Request] --> B{Local LLM Available?}
    B -->|Yes| C[Use Local LLM]
    B -->|No| D{Cloud LLM Available?}
    D -->|Yes| E[Use Cloud LLM]
    D -->|No| F[Fallback to Basic Analysis]
    
    C --> G[Generate Insight]
    E --> G
    F --> G
    
    style C fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#ffebee
```

## 🚀 Usage Guide

### Manual Execution

Run the workflow manually for testing:

```bash
# Generate insights for all staged files
bun run scripts/precommit-llm-insight.ts

# Generate insights for specific file
bun run scripts/generate-llm-insights.ts --file src/utils/newFeature.ts

# Analyze git diff and generate insights
bun run src/cli/analyze-git-diff.ts --include-staged
```

### CLI Options

```bash
# Pre-commit script options
bun run scripts/precommit-llm-insight.ts [options]

Options:
  --dry-run          Preview changes without applying
  --verbose          Show detailed output
  --approve-all      Auto-approve all insights
  --review           Interactive review mode
  --skip-validation  Skip Zod schema validation
```

### Interactive Review Mode

```mermaid
graph TD
    A[Insight Generated] --> B{Review Mode?}
    B -->|Yes| C[Display CLI Interface]
    B -->|No| D[Auto-approve]
    
    C --> E[Show Insight Details]
    E --> F{Approve?}
    F -->|Yes| G[Store Insight]
    F -->|No| H[Reject Insight]
    
    G --> I[Update Roadmap]
    H --> J[Skip This Insight]
    
    style C fill:#e3f2fd
    style G fill:#e8f5e8
    style H fill:#ffebee
```

## 📊 Insight Structure

### Analysis Categories

```mermaid
mindmap
  root((LLM Insights))
    Documentation
      README updates
      API documentation
      Code comments
    Implementation
      Core features
      Bug fixes
      Refactoring
    Testing
      Unit tests
      Integration tests
      E2E tests
    Automation
      CI/CD pipelines
      Scripts
      Workflows
    Fossilization
      Data persistence
      Context storage
      Traceability
    LLM Integration
      AI features
      Prompt engineering
      Model management
    UX/Developer Tools
      CLI tools
      Developer experience
      User interfaces
    Future Scopes
      Strategic planning
      Roadmap items
      Long-term goals
```

### Insight Output Format

```yaml
llmInsights:
  summary: "Task completed successfully with medium impact. documentation category task achieved objectives and is now operational."
  blockers: "None - task completed successfully."
  recommendations: "Document lessons learned and consider optimization opportunities."
  impact: "Positive - task objectives achieved and deliverables completed."
  category: "documentation"
  priority: "medium"
  status: "done"
  done:
    retrospective: "Documentation task completed successfully. Review for lessons learned and optimization opportunities."
    insights: "Consider documenting patterns and utilities for reuse in similar future tasks."
    completedAt: "2025-07-04T21:44:31.468Z"
```

## 🔍 Analysis Framework

### Strategic Priority Assessment

```mermaid
graph LR
    A[Task Analysis] --> B{Impact Assessment}
    B --> C[Critical Priority]
    B --> D[High Priority]
    B --> E[Medium Priority]
    B --> F[Low Priority]
    
    C --> G[Immediate Action Required]
    D --> H[High-Impact Development]
    E --> I[Standard Development]
    F --> J[Future Enhancement]
    
    style C fill:#ffebee
    style D fill:#fff3e0
    style E fill:#e8f5e8
    style F fill:#f3e5f5
```

### Impact Level Classification

```mermaid
graph TD
    A[Task Analysis] --> B{Scope Assessment}
    B --> C[Transformative Impact]
    B --> D[High Impact]
    B --> E[Medium Impact]
    B --> F[Low Impact]
    
    C --> G[Complete System Changes]
    D --> H[Major Feature Development]
    E --> I[Standard Improvements]
    F --> J[Minor Enhancements]
    
    style C fill:#e1f5fe
    style D fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#f3e5f5
```

## 🛠️ Customization

### Prompt Customization

Edit `src/prompts.ts` to customize LLM prompts:

```typescript
export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  'roadmap-insight-v2': {
    id: 'roadmap-insight',
    version: 'v2',
    description: 'Enhanced task analysis with custom categories',
    template: (params: Record<string, any>) => {
      const { task, context = '', customCategories = [] } = params;
      return `Analyze this task with enhanced categories: ${customCategories.join(', ')}
      
Task: ${task}
Context: ${context}`;
    },
    systemMessage: 'You are an expert project automation assistant with deep technical knowledge.'
  },
};
```

### Category Customization

Add custom analysis categories:

```typescript
// In your analysis script
const CUSTOM_CATEGORIES = {
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  // Add your custom categories
};
```

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| LLM service unavailable | No LLM provider configured | Set `OPENAI_API_KEY` or start Ollama |
| Type check fails | TypeScript errors in code | Fix type errors before commit |
| Insight generation fails | Invalid prompt template | Check `src/prompts.ts` syntax |
| Fossil storage fails | Invalid schema | Validate insight against Zod schema |
| Roadmap update fails | YAML syntax error | Check roadmap.yml format |

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
export LLM_DEBUG=true

# Run with verbose output
bun run scripts/precommit-llm-insight.ts --verbose
```

### Performance Optimization

```mermaid
graph TD
    A[Performance Issue] --> B{Identify Bottleneck}
    B --> C[LLM Response Time]
    B --> D[File Processing]
    B --> E[Validation Overhead]
    
    C --> F[Use Local LLM]
    C --> G[Cache Responses]
    D --> H[Process in Batches]
    E --> I[Skip Non-Critical Validation]
    
    style F fill:#e8f5e8
    style G fill:#e8f5e8
    style H fill:#fff3e0
    style I fill:#fff3e0
```

## 📈 Monitoring & Analytics

### Usage Tracking

The workflow automatically logs usage in `.llm-usage-log.json`:

```json
[
  {
    "timestamp": "2025-07-04T21:29:49.867Z",
    "model": "llama2",
    "provider": "ollama",
    "inputTokens": 97,
    "outputTokens": 0,
    "totalTokens": 97,
    "cost": 0.00014549999999999999,
    "duration": 3647,
    "success": false,
    "error": "OpenAI API error: 401",
    "context": "roadmap-llm-insight",
    "purpose": "roadmap-insight",
    "valueScore": 0.7
  }
]
```

### Performance Metrics

```mermaid
graph LR
    A[Workflow Execution] --> B[Performance Tracking]
    B --> C[Response Time]
    B --> D[Token Usage]
    B --> E[Success Rate]
    B --> F[Cost Analysis]
    
    C --> G[Optimization Alerts]
    D --> H[Usage Monitoring]
    E --> I[Quality Metrics]
    F --> J[Cost Control]
    
    style G fill:#fff3e0
    style H fill:#e8f5e8
    style I fill:#e3f2fd
    style J fill:#f3e5f5
```

## 🔮 Future Enhancements

### Planned Features

```mermaid
graph TD
    A[Future Enhancements] --> B[Dynamic Updates]
    A --> C[Dependency Mapping]
    A --> D[Resource Estimation]
    A --> E[Risk Assessment]
    A --> F[Success Metrics]
    
    B --> G[Real-time Insight Updates]
    C --> H[Cross-task Relationships]
    D --> I[Effort and Timeline]
    E --> J[Risk Level Assessment]
    F --> K[Measurable Outcomes]
    
    style G fill:#e8f5e8
    style H fill:#e3f2fd
    style I fill:#fff3e0
    style J fill:#f3e5f5
    style K fill:#e1f5fe
```

### Integration Opportunities

- **CI/CD Integration**: Automated insight updates in pipelines
- **GitHub Integration**: Issue and PR insight linking
- **Reporting**: Automated insight reporting and analytics
- **AI Enhancement**: LLM-powered insight refinement
- **Team Collaboration**: Shared insight review and approval

## 📚 API Reference

### Core Functions

```typescript
// Generate LLM insight for a task
async function generateLLMInsight(task: any, llm: LLMService): Promise<any>

// Analyze git diff and generate insights
async function analyzeDiff(config: GitDiffAnalysisConfig): Promise<DiffAnalysisResult>

// Validate insight against schema
function validateInsight(insight: any): ValidationResult

// Store insight as fossil
async function fossilizeLLMInsight(fossil: LLMInsightFossil): Promise<void>
```

### Configuration Types

```typescript
interface GitDiffAnalysisConfig {
  commitHash?: string;
  includeStaged?: boolean;
  includeUnstaged?: boolean;
  filePatterns?: string[];
  maxFiles?: number;
}

interface LLMInsightFossil {
  type: 'insight';
  timestamp: string;
  model: string;
  provider: string;
  excerpt: string;
  prompt: string;
  response: string;
  promptId: string;
  promptVersion: string;
  systemMessage: string;
  inputHash: string;
  commitRef: string;
}
```

## 🎯 Best Practices

### For Developers

1. **Review Insights**: Always review generated insights before committing
2. **Customize Prompts**: Adapt prompts for your specific use cases
3. **Monitor Performance**: Track usage and optimize for your workflow
4. **Validate Output**: Ensure insights meet your quality standards

### For Teams

1. **Standardize Categories**: Use consistent analysis categories across the team
2. **Share Templates**: Collaborate on prompt templates and configurations
3. **Review Process**: Establish clear review and approval workflows
4. **Document Patterns**: Share successful insight patterns and use cases

### For Organizations

1. **Compliance**: Ensure insights meet organizational standards
2. **Security**: Review LLM provider security and data handling
3. **Scalability**: Plan for workflow scaling across multiple projects
4. **Integration**: Integrate with existing development workflows

## 📚 Related Documentation

- [Visual Documentation Standards](./VISUAL_DOCUMENTATION_STANDARDS.md) - Comprehensive visual standards and Mermaid usage patterns
- [API Reference](API_REFERENCE.md) - Technical API documentation
- [Development Guide](DEVELOPMENT_GUIDE.md) - Development best practices
- [Environment Guide](ENVIRONMENT_GUIDE.md) - Configuration management
- [Contributing Guide](CONTRIBUTING_GUIDE.md) - How to contribute
- [Examples](../examples/basic-usage.ts) - Usage examples

---

*This documentation is automatically generated and maintained as part of the LLM insights workflow. For questions or contributions, see the project's contributing guidelines.* 