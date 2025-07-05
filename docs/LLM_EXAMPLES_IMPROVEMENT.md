# 🧠 LLM Examples Improvement Guide

## 📋 Overview

This guide provides comprehensive patterns and examples for improving LLM usage scenarios beyond just happy paths. It covers error handling, edge cases, fallback scenarios, and real-world usage patterns that developers encounter in production environments.

## 🎯 Problem Statement

Traditional LLM examples often focus only on successful scenarios, leading to:
- **Incomplete Testing**: Missing edge cases and error conditions
- **Poor Error Handling**: Applications fail unexpectedly in production
- **Limited Resilience**: No fallback strategies when LLM services are unavailable
- **Cost Inefficiency**: No optimization strategies for different scenarios
- **Poor User Experience**: No graceful degradation when services fail

## 🔄 Comprehensive Scenario Coverage

### 1. ✅ Happy Path Scenarios

**Purpose**: Demonstrate successful operations with proper validation

```typescript
// Example: Successful content generation with validation
async function happyPathContentGeneration(): Promise<void> {
  const startTime = Date.now();
  let result = {
    success: false,
    duration: 0,
    cost: 0,
    provider: 'unknown',
    insights: []
  };

  try {
    const response = await llmService.callLLM({
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      messages: [
        { role: 'system', content: 'You are a helpful coding assistant.' },
        { role: 'user', content: 'Write a TypeScript function that calculates factorial.' }
      ],
      context: 'code-generation',
      purpose: 'content-generation',
      valueScore: 0.8
    });

    // Validate response quality
    const content = response.choices?.[0]?.message?.content;
    if (!content || content.length < 10) {
      throw new Error('Response too short or empty');
    }

    result = {
      success: true,
      duration: Date.now() - startTime,
      cost: 0.002,
      provider: 'openai',
      insights: [
        'Content generated successfully',
        'Response quality meets expectations',
        'Cost within acceptable range'
      ]
    };

    console.log('✅ Success:', content);
  } catch (error) {
    result = {
      success: false,
      duration: Date.now() - startTime,
      cost: 0,
      provider: 'unknown',
      error: error.message,
      insights: [
        'Unexpected error in happy path',
        'Check API key and connectivity',
        'Consider fallback strategies'
      ]
    };
    console.log('❌ Happy path failed:', error.message);
  }

  return result;
}
```

### 2. ❌ Error Scenarios

**Purpose**: Handle various failure modes gracefully

#### API Key Errors
```typescript
async function apiKeyErrorScenario(): Promise<void> {
  try {
    const response = await llmService.callLLM({
      model: 'gpt-3.5-turbo',
      apiKey: 'invalid-api-key',
      messages: [{ role: 'user', content: 'This should fail.' }],
      context: 'error-testing',
      purpose: 'test'
    });
  } catch (error) {
    const errorMessage = error.message;
    
    // Handle specific error types
    if (errorMessage.includes('401') || errorMessage.includes('invalid_api_key')) {
      console.log('🔐 Authentication failed - check API key');
      // Implement retry with different key or fallback
    } else if (errorMessage.includes('429')) {
      console.log('🚦 Rate limit exceeded - implement backoff');
      // Implement exponential backoff
    } else {
      console.log('❌ Unexpected error:', errorMessage);
      // Log for debugging
    }
  }
}
```

#### Rate Limiting
```typescript
async function rateLimitScenario(): Promise<void> {
  // Simulate rapid requests
  const rapidRequests = Array.from({ length: 5 }, (_, i) => 
    llmService.callLLM({
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      messages: [{ role: 'user', content: `Request ${i + 1}` }],
      context: 'rate-limit-test'
    })
  );

  const responses = await Promise.allSettled(rapidRequests);
  
  const successful = responses.filter(r => r.status === 'fulfilled').length;
  const failed = responses.filter(r => r.status === 'rejected').length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  // Analyze failure patterns
  responses.forEach((response, i) => {
    if (response.status === 'rejected') {
      const error = response.reason;
      if (error.message.includes('429')) {
        console.log(`Request ${i + 1}: Rate limited`);
      } else {
        console.log(`Request ${i + 1}: ${error.message}`);
      }
    }
  });
}
```

### 3. 🔄 Fallback Scenarios

**Purpose**: Provide alternative solutions when primary services fail

#### Local LLM Fallback
```typescript
async function localLLMFallbackScenario(): Promise<void> {
  try {
    // Try cloud LLM first
    const response = await llmService.callLLM({
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
      messages: [{ role: 'user', content: 'Complex analysis task' }],
      routingPreference: 'cloud'
    });
    
    console.log('☁️ Cloud LLM response:', response.choices?.[0]?.message?.content);
  } catch (error) {
    console.log('❌ Cloud LLM failed, trying local fallback...');
    
    try {
      // Fallback to local LLM
      const localResponse = await llmService.callLLM({
        model: 'llama2',
        apiKey: 'local',
        messages: [{ role: 'user', content: 'Complex analysis task' }],
        routingPreference: 'local'
      });
      
      console.log('🏠 Local LLM response:', localResponse.choices?.[0]?.message?.content);
    } catch (localError) {
      console.log('❌ Local LLM also failed, using basic fallback');
      
      // Final fallback - basic response generation
      const basicResponse = generateBasicResponse('Complex analysis task');
      console.log('🔧 Basic fallback response:', basicResponse);
    }
  }
}
```

#### Provider Switching
```typescript
async function providerSwitchingScenario(): Promise<void> {
  const providers = [
    { name: 'openai', model: 'gpt-4', apiKey: process.env.OPENAI_API_KEY },
    { name: 'anthropic', model: 'claude-3', apiKey: process.env.ANTHROPIC_API_KEY },
    { name: 'local', model: 'llama2', apiKey: 'local' }
  ];

  for (const provider of providers) {
    try {
      const response = await llmService.callLLM({
        model: provider.model,
        apiKey: provider.apiKey,
        messages: [{ role: 'user', content: 'Test message' }],
        context: 'provider-test'
      });
      
      console.log(`✅ ${provider.name} succeeded`);
      return response;
    } catch (error) {
      console.log(`❌ ${provider.name} failed:`, error.message);
      continue; // Try next provider
    }
  }
  
  throw new Error('All providers failed');
}
```

### 4. ⚠️ Edge Cases

**Purpose**: Handle unexpected inputs and malformed responses

#### Malformed JSON Responses
```typescript
async function malformedResponseScenario(): Promise<void> {
  try {
    const response = await llmService.callLLM({
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      messages: [
        { role: 'system', content: 'Always respond with valid JSON.' },
        { role: 'user', content: 'Return JSON: {name: "John", age: 30}' }
      ],
      context: 'json-validation'
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Valid JSON:', parsed);
    } catch (parseError) {
      console.log('❌ Invalid JSON response:');
      console.log('Raw content:', content);
      console.log('Parse error:', parseError.message);
      
      // Attempt to fix common JSON issues
      const fixedContent = fixCommonJsonIssues(content);
      try {
        const fixedParsed = JSON.parse(fixedContent);
        console.log('🔧 Fixed JSON:', fixedParsed);
      } catch {
        console.log('❌ Could not fix JSON, using fallback');
      }
    }
  } catch (error) {
    console.log('❌ LLM call failed:', error.message);
  }
}

function fixCommonJsonIssues(content: string): string {
  // Common fixes for malformed JSON
  return content
    .replace(/(\w+):/g, '"$1":') // Add quotes to keys
    .replace(/,\s*}/g, '}') // Remove trailing commas
    .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
}
```

#### Token Limit Exceeded
```typescript
async function tokenLimitScenario(): Promise<void> {
  const longText = 'This is a very long text. '.repeat(1000);
  
  try {
    const response = await llmService.callLLM({
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
      messages: [
        { role: 'user', content: `Summarize: ${longText}` }
      ],
      context: 'token-test'
    });
    
    console.log('✅ Long text processed successfully');
  } catch (error) {
    if (error.message.includes('token') || error.message.includes('length')) {
      console.log('⚠️ Token limit exceeded, implementing chunking...');
      
      // Implement text chunking
      const chunks = chunkText(longText, 3000);
      const summaries = [];
      
      for (const chunk of chunks) {
        try {
          const chunkResponse = await llmService.callLLM({
            model: 'gpt-3.5-turbo', // Use cheaper model for chunks
            apiKey: process.env.OPENAI_API_KEY,
            messages: [{ role: 'user', content: `Summarize: ${chunk}` }],
            context: 'chunk-summary'
          });
          summaries.push(chunkResponse.choices?.[0]?.message?.content);
        } catch (chunkError) {
          console.log('❌ Chunk processing failed:', chunkError.message);
        }
      }
      
      console.log('📝 Chunk summaries:', summaries);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks = [];
  let currentChunk = '';
  
  const sentences = text.split('. ');
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
```

### 5. 🎯 Optimization Scenarios

**Purpose**: Optimize cost, performance, and resource usage

#### Cost Optimization
```typescript
async function costOptimizationScenario(): Promise<void> {
  const tasks = [
    { content: 'Simple question', complexity: 'low', valueScore: 0.1 },
    { content: 'Medium analysis', complexity: 'medium', valueScore: 0.5 },
    { content: 'Complex research', complexity: 'high', valueScore: 0.9 }
  ];

  for (const task of tasks) {
    // Select appropriate model based on complexity
    const model = task.complexity === 'low' ? 'gpt-3.5-turbo' : 'gpt-4';
    const maxTokens = task.complexity === 'low' ? 1000 : 4000;
    
    try {
      const response = await llmService.callLLM({
        model,
        apiKey: process.env.OPENAI_API_KEY,
        messages: [{ role: 'user', content: task.content }],
        max_tokens: maxTokens,
        context: 'cost-optimization',
        valueScore: task.valueScore
      });
      
      const cost = estimateCost(response, model);
      console.log(`✅ ${task.complexity} task completed for $${cost}`);
    } catch (error) {
      console.log(`❌ ${task.complexity} task failed:`, error.message);
    }
  }
}

function estimateCost(response: any, model: string): number {
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  
  const pricing = {
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 }
  };
  
  const modelPricing = pricing[model as keyof typeof pricing];
  return (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1000;
}
```

#### Performance Monitoring
```typescript
async function performanceMonitoringScenario(): Promise<void> {
  const startTime = Date.now();
  
  try {
    const response = await llmService.callLLM({
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
      messages: [{ role: 'user', content: 'Complex analysis task' }],
      context: 'performance-test'
    });
    
    const duration = Date.now() - startTime;
    const cost = estimateCost(response, 'gpt-4');
    
    // Performance analysis
    if (duration > 10000) {
      console.log('⚠️ Slow response detected:', duration + 'ms');
      // Consider caching or using faster model
    } else if (duration > 5000) {
      console.log('⚡ Moderate response time:', duration + 'ms');
    } else {
      console.log('🚀 Fast response:', duration + 'ms');
    }
    
    if (cost > 0.05) {
      console.log('💰 High cost detected:', '$' + cost);
      // Consider optimization strategies
    }
    
    console.log('📊 Performance metrics:', {
      duration,
      cost,
      tokens: response.usage?.total_tokens,
      model: 'gpt-4'
    });
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
  }
}
```

### 6. 🔧 Troubleshooting Scenarios

**Purpose**: Debug and diagnose LLM-related issues

#### Comprehensive Error Analysis
```typescript
async function troubleshootingScenario(): Promise<void> {
  const diagnostics = {
    networkConnectivity: false,
    apiKeyValid: false,
    rateLimitStatus: 'unknown',
    modelAvailability: false,
    localLLMStatus: false
  };

  // Test network connectivity
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    diagnostics.networkConnectivity = response.ok;
    diagnostics.apiKeyValid = response.status !== 401;
  } catch (error) {
    console.log('❌ Network connectivity issue:', error.message);
  }

  // Test local LLM
  try {
    const { execSync } = await import('child_process');
    execSync('ollama --version', { stdio: 'ignore' });
    diagnostics.localLLMStatus = true;
  } catch {
    console.log('❌ Local LLM not available');
  }

  // Generate diagnostic report
  console.log('🔍 Diagnostic Report:');
  console.log(JSON.stringify(diagnostics, null, 2));
  
  // Provide recommendations
  if (!diagnostics.networkConnectivity) {
    console.log('💡 Check internet connection');
  }
  if (!diagnostics.apiKeyValid) {
    console.log('💡 Verify API key configuration');
  }
  if (!diagnostics.localLLMStatus) {
    console.log('💡 Install Ollama for local fallback');
  }
}
```

## 📊 Scenario Testing Framework

### Test Structure
```typescript
interface ScenarioTest {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<any>;
  validate: (result: any) => boolean;
  cleanup: () => Promise<void>;
  expectedOutcome: 'success' | 'failure' | 'fallback';
}

class LLMScenarioTester {
  private scenarios: ScenarioTest[] = [];
  private results: Map<string, any> = new Map();

  async runAllScenarios(): Promise<void> {
    console.log('🧪 Running LLM Scenario Tests...');
    
    for (const scenario of this.scenarios) {
      console.log(`\n📋 Testing: ${scenario.name}`);
      
      try {
        await scenario.setup();
        const result = await scenario.execute();
        const isValid = scenario.validate(result);
        
        this.results.set(scenario.name, {
          success: isValid,
          result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${scenario.name}: ${isValid ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.results.set(scenario.name, {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.log(`❌ ${scenario.name}: ERROR - ${error.message}`);
      } finally {
        await scenario.cleanup();
      }
    }
    
    this.generateReport();
  }

  private generateReport(): void {
    const total = this.scenarios.length;
    const passed = Array.from(this.results.values()).filter(r => r.success).length;
    const failed = total - passed;
    
    console.log('\n📊 Test Report:');
    console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  }
}
```

## 🎯 Best Practices

### 1. Error Handling Patterns
- **Specific Error Types**: Handle different error codes and messages
- **Graceful Degradation**: Provide fallback responses when possible
- **Retry Logic**: Implement exponential backoff for transient failures
- **Logging**: Log errors with sufficient context for debugging

### 2. Cost Management
- **Model Selection**: Choose appropriate models for task complexity
- **Token Optimization**: Implement text truncation and chunking
- **Caching**: Cache responses for repeated queries
- **Monitoring**: Track costs and set alerts for budget limits

### 3. Performance Optimization
- **Response Time Monitoring**: Track and optimize response times
- **Concurrent Requests**: Use batch processing when appropriate
- **Provider Selection**: Route requests to fastest available provider
- **Caching Strategy**: Implement intelligent caching based on usage patterns

### 4. Resilience Patterns
- **Multiple Providers**: Maintain fallback providers
- **Circuit Breaker**: Implement circuit breaker pattern for failing services
- **Health Checks**: Regular health checks for all providers
- **Automatic Recovery**: Self-healing mechanisms for transient failures

## 📚 Example Implementation

Create a comprehensive example file that demonstrates all these scenarios:

```bash
# Create the example file
touch examples/llm-comprehensive-scenarios.ts

# Run the scenarios
bun run examples/llm-comprehensive-scenarios.ts

# View the generated report
cat llm-scenarios-report.json
```

## 🔮 Future Enhancements

### Planned Improvements
1. **Automated Scenario Generation**: Generate test scenarios based on usage patterns
2. **Performance Benchmarking**: Compare different models and providers
3. **Cost Prediction**: Predict costs before making requests
4. **Intelligent Routing**: AI-powered provider selection
5. **Real-time Monitoring**: Live dashboard for LLM performance

### Integration Opportunities
- **CI/CD Integration**: Automated testing in deployment pipelines
- **Alerting Systems**: Proactive monitoring and alerting
- **Analytics Dashboard**: Visual reporting and trend analysis
- **A/B Testing**: Compare different LLM strategies

## 📖 Related Documentation

- [LLM Insights Workflow](./LLM_INSIGHTS_WORKFLOW.md) - Automated analysis and recommendations
- [API Reference](./API_REFERENCE.md) - Technical API documentation
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Development best practices
- [Testing Guide](./TESTING_LEARNINGS.md) - Testing strategies and patterns

---

*This guide provides comprehensive patterns for improving LLM examples beyond happy paths. For questions or contributions, see the project's contributing guidelines.* 