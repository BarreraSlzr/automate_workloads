# VS Code AI Integration Guide

## Overview

This guide explains how to use VS Code's built-in AI capabilities (GitHub Copilot Chat, Claude, etc.) as a local LLM service for both direct calls and snapshot processing. This approach provides seamless integration with your development workflow while maintaining the project's fossilization and audit capabilities.

## 🎯 Key Benefits

- **Local AI Processing**: Use VS Code's AI extensions as local LLM providers
- **Snapshot Analysis**: Process LLM snapshots through VS Code's AI interface
- **Seamless Integration**: Works with existing LLM service architecture
- **Automatic Fossilization**: All interactions are fossilized for audit and traceability
- **Cost Optimization**: Leverage included AI services (Copilot, local Claude)
- **Development Workflow**: Integrate AI directly into your coding environment

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VS Code AI    │    │   Fossilization  │    │   Development   │
│   Extensions    │───▶│   (Audit Trail)  │───▶│   Workflow      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Direct Calls  │    │   Snapshot       │    │   Context       │
│   (Real Time)   │    │   Processing     │    │   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components

1. **VS Code AI Service** (`src/services/vscodeAI.ts`)
   - Integrates with VS Code's AI extensions
   - Provides local LLM capabilities
   - Handles fossilization of interactions

2. **Schema Validation** (`src/types/schemas.ts`)
   - Ensures type safety and validation
   - Follows project's params object pattern
   - Maintains consistency with existing architecture

3. **CLI Integration** (`src/cli/vscode-ai.ts`)
   - Command-line interface for testing and usage
   - Fossil management and analysis
   - Configuration management

## 🚀 Quick Start

### 1. Prerequisites

- VS Code installed and accessible via `code` command
- AI extensions installed:
  - GitHub Copilot Chat
  - Claude (Anthropic)
  - Other AI extensions as needed
- Extensions properly configured and authenticated

### 2. Basic Usage

```typescript
import { VSCodeAIService } from '../src/services/vscodeAI';

// Create VS Code AI service
const vscodeAI = new VSCodeAIService({
  provider: 'auto', // Will try copilot, then claude
  enabled: true,
  enableFossilization: true
});

// Make a direct call
const response = await vscodeAI.callVSCodeAI({
  messages: [{ role: 'user', content: 'Explain TypeScript interfaces' }],
  context: 'learning',
  purpose: 'education'
});

console.log(response.content);
```

### 3. Snapshot Processing

```typescript
// Process an LLM snapshot
const analysis = await vscodeAI.processSnapshot({
  snapshotPath: 'fossils/llm_insights/sample.json',
  analysisType: 'insights',
  context: 'code-review',
  purpose: 'quality-analysis'
});

console.log(analysis.content);
```

## 📋 CLI Commands

### Test VS Code AI Availability

```bash
bun run vscode-ai test --provider auto
```

### Make Direct AI Call

```bash
bun run vscode-ai call \
  --message "Explain the benefits of TypeScript" \
  --provider copilot \
  --context learning \
  --purpose education
```

### Process Snapshot

```bash
bun run vscode-ai process-snapshot \
  --snapshot fossils/llm_insights/sample.json \
  --analysis-type insights \
  --output results.json
```

### List Fossils

```bash
bun run vscode-ai list-fossils \
  --limit 20 \
  --provider copilot \
  --output table
```

### Analyze Patterns

```bash
bun run vscode-ai analyze \
  --since 2024-01-01 \
  --output text
```

## 🔧 Configuration

### VS Code AI Configuration Schema

```typescript
interface VSCodeAIConfig {
  provider: 'copilot' | 'claude' | 'auto';
  enabled: boolean;
  vscodePath?: string;
  workspacePath?: string;
  useChatInterface: boolean;
  useCommandPalette: boolean;
  timeout: number;
  enableFossilization: boolean;
  fossilStoragePath: string;
  enableSnapshotProcessing: boolean;
  enableDirectCalls: boolean;
  customCommands?: {
    chat?: string;
    analyze?: string;
    explain?: string;
    generate?: string;
  };
}
```

### Example Configuration

```typescript
const config = {
  provider: 'auto',           // Try copilot, then claude
  enabled: true,
  timeout: 30000,            // 30 second timeout
  enableFossilization: true, // Fossilize all interactions
  fossilStoragePath: 'fossils/vscode_ai/',
  enableSnapshotProcessing: true,
  enableDirectCalls: true,
  customCommands: {
    chat: 'code --command "copilot.chat" --args "{message}"',
    analyze: 'code --command "copilot.analyze" --args "{message}"'
  }
};
```

## 🔄 Integration with Existing LLM Service

VS Code AI can be integrated as a provider in the existing LLM service:

```typescript
import { LLMService } from '../src/services/llm';
import { VSCodeAIService } from '../src/services/vscodeAI';

// Create VS Code AI service
const vscodeAI = new VSCodeAIService({
  provider: 'auto',
  enabled: true
});

// Create LLM service
const llmService = new LLMService({
  // Required owner/repo parameters (prevents circular dependency)
  owner: 'BarreraSlzr',
  repo: 'automate_workloads',
  
  enableLocalLLM: true,
  enableFossilization: true
});

// Register VS Code AI as a local backend
llmService.registerLocalBackend(
  'vscode-ai',
  async (options) => {
    const response = await vscodeAI.callVSCodeAI({
      messages: options.messages,
      context: 'llm-service-integration',
      purpose: 'local-llm-call'
    });
    
    return {
      choices: [{ message: { content: response.content } }]
    };
  },
  async () => await vscodeAI.isAvailable()
);

// Use VS Code AI through LLM service
const result = await llmService.callLLM({
  model: 'vscode-ai',
  apiKey: 'local',
  messages: [{ role: 'user', content: 'Hello, VS Code AI!' }],
  context: 'test',
  purpose: 'integration-test'
});
```

## 📊 Fossil Management

### Fossil Structure

VS Code AI interactions are fossilized with the following structure:

```typescript
interface VSCodeAIFossil {
  id: string;
  type: 'vscode-ai-call' | 'vscode-ai-snapshot';
  timestamp: string;
  provider: string;
  model: string;
  input: VSCodeAICallOptions | VSCodeAISnapshotOptions;
  response: VSCodeAIResponse;
  metadata: {
    workspacePath: string;
    fileContext?: string;
    gitBranch?: string;
    gitCommit?: string;
  };
}
```

### Fossil Querying

```typescript
import { ContextFossilService } from '../src/cli/context-fossil';

const fossilService = new ContextFossilService();

// Query VS Code AI fossils
const fossils = await fossilService.queryEntries({
  tags: ['vscode-ai'],
  limit: 50,
  provider: 'copilot'
});

// Analyze patterns
const analysis = await fossilService.analyzePatterns({
  fossils,
  analysisTypes: ['providers', 'purposes', 'quality']
});
```

## 🛡️ Error Handling and Fallbacks

### Error Scenarios

1. **VS Code Not Available**
   - Check if VS Code is installed and accessible
   - Verify `code` command works in terminal

2. **AI Extensions Not Installed**
   - Install required extensions (Copilot, Claude)
   - Configure extensions properly

3. **Authentication Issues**
   - Ensure extensions are authenticated
   - Check API keys and tokens

4. **Timeout Errors**
   - Increase timeout configuration
   - Check network connectivity

### Fallback Strategy

```typescript
try {
  // Try VS Code AI first
  const response = await vscodeAI.callVSCodeAI(options);
  return response;
} catch (error) {
  console.log('VS Code AI failed, falling back to cloud LLM...');
  
  // Fallback to regular LLM service
  const llmService = new LLMService({
    // Required owner/repo parameters (prevents circular dependency)
    owner: 'BarreraSlzr',
    repo: 'automate_workloads',
    
    enableLocalLLM: false,
    enableFossilization: true
  });
  
  return await llmService.callLLM({
    ...options,
    model: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY
  });
}
```

## 📈 Performance and Optimization

### Performance Metrics

- **Response Time**: Typically 2-5 seconds for VS Code AI calls
- **Token Usage**: Varies by provider (Copilot: included, Claude: local)
- **Cost**: Copilot included in GitHub subscription, Claude local
- **Availability**: Depends on VS Code and extension status

### Optimization Tips

1. **Provider Selection**
   - Use 'auto' for automatic provider selection
   - Specify provider for consistent behavior
   - Test different providers for your use case

2. **Timeout Configuration**
   - Set appropriate timeout based on complexity
   - Longer timeouts for complex analysis
   - Shorter timeouts for simple queries

3. **Fossilization Strategy**
   - Enable fossilization for audit trails
   - Use separate storage path for VS Code AI fossils
   - Regular cleanup of old fossils

## 🔍 Use Cases

### 1. Code Review and Analysis

```typescript
// Analyze code using VS Code AI
const codeAnalysis = await vscodeAI.callVSCodeAI({
  messages: [
    { role: 'system', content: 'You are a code reviewer.' },
    { role: 'user', content: 'Review this TypeScript code for best practices...' }
  ],
  context: 'code-review',
  purpose: 'quality-assurance'
});
```

### 2. Documentation Generation

```typescript
// Generate documentation using VS Code AI
const docs = await vscodeAI.callVSCodeAI({
  messages: [
    { role: 'system', content: 'You are a technical writer.' },
    { role: 'user', content: 'Generate documentation for this API...' }
  ],
  context: 'documentation',
  purpose: 'content-generation'
});
```

### 3. Snapshot Analysis

```typescript
// Process LLM snapshots for insights
const insights = await vscodeAI.processSnapshot({
  snapshotPath: 'fossils/llm_insights/recent.json',
  analysisType: 'insights',
  context: 'performance-analysis',
  purpose: 'optimization'
});
```

### 4. Development Workflow Integration

```typescript
// Integrate with development workflow
const workflow = await vscodeAI.callVSCodeAI({
  messages: [
    { role: 'user', content: 'Suggest improvements for this development workflow...' }
  ],
  context: 'workflow-optimization',
  purpose: 'process-improvement'
});
```

## 🧪 Testing and Validation

### Unit Tests

```typescript
import { VSCodeAIService } from '../src/services/vscodeAI';

describe('VSCodeAIService', () => {
  let service: VSCodeAIService;

  beforeEach(() => {
    service = new VSCodeAIService({
      provider: 'auto',
      enabled: true,
      enableFossilization: false // Disable for testing
    });
  });

  test('should check availability', async () => {
    const isAvailable = await service.isAvailable();
    expect(typeof isAvailable).toBe('boolean');
  });

  test('should make AI calls', async () => {
    const response = await service.callVSCodeAI({
      messages: [{ role: 'user', content: 'Test message' }],
      context: 'test',
      purpose: 'unit-test'
    });

    expect(response.content).toBeDefined();
    expect(response.provider).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('VSCodeAI Integration', () => {
  test('should integrate with LLM service', async () => {
    const llmService = new LLMService({
      enableLocalLLM: true
    });

    // Register VS Code AI backend
    llmService.registerLocalBackend('vscode-ai', async (options) => {
      // Mock implementation for testing
      return { choices: [{ message: { content: 'Test response' } }] };
    });

    const result = await llmService.callLLM({
      model: 'vscode-ai',
      apiKey: 'local',
      messages: [{ role: 'user', content: 'Test' }]
    });

    expect(result.choices[0].message.content).toBe('Test response');
  });
});
```

## 🔧 Troubleshooting

### Common Issues

1. **"VS Code AI not available"**
   - Check VS Code installation
   - Verify `code` command works
   - Install required AI extensions

2. **"Provider not found"**
   - Check extension installation
   - Verify extension configuration
   - Test with different provider

3. **"Timeout error"**
   - Increase timeout configuration
   - Check network connectivity
   - Verify extension authentication

4. **"Fossilization failed"**
   - Check fossil storage path
   - Verify write permissions
   - Check disk space

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const vscodeAI = new VSCodeAIService({
  provider: 'auto',
  enabled: true,
  enableFossilization: true,
  // Add debug logging
  customCommands: {
    chat: 'code --verbose --command "copilot.chat" --args "{message}"'
  }
});
```

## 📚 Examples

See the complete examples in `examples/vscode-ai-integration.ts`:

- Basic VS Code AI integration
- Snapshot processing
- Integration with existing LLM service
- Fossil management
- Advanced configuration
- Error handling and fallbacks

## 🎯 Best Practices

1. **Provider Selection**
   - Use 'auto' for automatic selection
   - Test different providers for your use case
   - Consider cost and availability

2. **Configuration Management**
   - Use environment variables for sensitive config
   - Validate configuration with schemas
   - Document custom commands

3. **Error Handling**
   - Implement proper fallback strategies
   - Log errors for debugging
   - Provide user-friendly error messages

4. **Performance Optimization**
   - Set appropriate timeouts
   - Cache frequently used responses
   - Monitor fossil storage usage

5. **Security**
   - Sanitize inputs before sending to AI
   - Validate responses
   - Secure fossil storage

## 🔮 Future Enhancements

1. **Additional Providers**
   - Support for more AI extensions
   - Custom provider implementations
   - Provider performance comparison

2. **Advanced Features**
   - Batch processing capabilities
   - Real-time streaming responses
   - Advanced fossil analysis

3. **Integration Improvements**
   - VS Code extension development
   - IDE plugin integration
   - Workflow automation

4. **Performance Enhancements**
   - Response caching
   - Parallel processing
   - Resource optimization

## 📖 Related Documentation

- [LLM Snapshot Processing Guide](./LLM_SNAPSHOT_PROCESSING_APPROACH.md)
- [Fossil Management Guide](./FOSSIL_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)
- [Type and Schema Patterns](./TYPE_AND_SCHEMA_PATTERNS.md)
- [CLI Command Insights](./CLI_COMMAND_INSIGHTS.md)

---

This guide provides comprehensive coverage of VS Code AI integration, enabling you to leverage VS Code's built-in AI capabilities for local LLM processing while maintaining the project's fossilization and audit capabilities. 