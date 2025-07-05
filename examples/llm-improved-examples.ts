#!/usr/bin/env bun

/**
 * LLM Improved Examples
 * 
 * This file demonstrates improved LLM usage patterns that go beyond happy paths,
 * covering error handling, edge cases, fallback scenarios, and real-world usage patterns.
 */

import { LLMService } from '../src/services/llm';

interface ExampleResult {
  name: string;
  success: boolean;
  duration: number;
  cost: number;
  provider: string;
  error?: string;
  insights: string[];
}

class LLMImprovedExamples {
  private llmService: LLMService;
  private results: ExampleResult[] = [];

  constructor() {
    this.llmService = new LLMService({
      maxTokensPerCall: 4000,
      maxCostPerCall: 0.10,
      minValueScore: 0.3,
      enableLocalLLM: true,
      retryAttempts: 3,
      retryDelayMs: 1000,
      preferLocalLLM: true
    });
  }

  /**
   * Example 1: Happy Path with Validation
   */
  async happyPathWithValidation(): Promise<void> {
    console.log('✅ Example 1: Happy Path with Validation');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    let result: ExampleResult = {
      name: 'Happy Path with Validation',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    try {
      const response = await this.llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'system', content: 'You are a helpful coding assistant.' },
          { role: 'user', content: 'Write a simple TypeScript function that calculates the factorial of a number.' }
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

      // Check for code-like content
      if (!content.includes('function') && !content.includes('const') && !content.includes('let')) {
        throw new Error('Response does not contain expected code structure');
      }

      result = {
        name: 'Happy Path with Validation',
        success: true,
        duration: Date.now() - startTime,
        cost: 0.002,
        provider: 'openai',
        insights: [
          'Content generated successfully',
          'Response quality validated',
          'Code structure detected',
          'Cost within acceptable range'
        ]
      };

      console.log('📝 Generated Code:');
      console.log(content);
      console.log(`⏱️ Duration: ${result.duration}ms`);
      console.log(`💰 Estimated Cost: $${result.cost}`);

    } catch (error) {
      result = {
        name: 'Happy Path with Validation',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'unknown',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'Validation failed',
          'Check response quality requirements',
          'Consider adjusting prompt for better results'
        ]
      };

      console.log('❌ Validation failed:', result.error);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Example 2: Error Handling with Specific Error Types
   */
  async errorHandlingWithTypes(): Promise<void> {
    console.log('❌ Example 2: Error Handling with Specific Error Types');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    let result: ExampleResult = {
      name: 'Error Handling with Types',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    try {
      const response = await this.llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: 'invalid-api-key',
        messages: [
          { role: 'user', content: 'This should fail due to invalid API key.' }
        ],
        context: 'error-testing',
        purpose: 'test',
        valueScore: 0.1
      });

      // This should not reach here
      result = {
        name: 'Error Handling with Types',
        success: true,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        insights: ['Unexpected success with invalid API key']
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle specific error types
      if (errorMessage.includes('401') || errorMessage.includes('invalid_api_key')) {
        result = {
          name: 'Error Handling with Types',
          success: false,
          duration: Date.now() - startTime,
          cost: 0,
          provider: 'openai',
          error: 'Authentication failed',
          insights: [
            'API key validation failed',
            'Check API key configuration',
            'No cost incurred for failed request',
            'Consider using environment variables'
          ]
        };
        console.log('🔐 Authentication error handled gracefully');
      } else if (errorMessage.includes('429')) {
        result = {
          name: 'Error Handling with Types',
          success: false,
          duration: Date.now() - startTime,
          cost: 0,
          provider: 'openai',
          error: 'Rate limit exceeded',
          insights: [
            'Rate limiting detected',
            'Implement exponential backoff',
            'Consider request throttling'
          ]
        };
        console.log('🚦 Rate limit error handled gracefully');
      } else {
        result = {
          name: 'Error Handling with Types',
          success: false,
          duration: Date.now() - startTime,
          cost: 0,
          provider: 'openai',
          error: errorMessage,
          insights: [
            'Unexpected error type',
            'Log for debugging',
            'Consider fallback strategy'
          ]
        };
        console.log('❌ Unexpected error:', errorMessage);
      }

      console.log(`⏱️ Duration: ${result.duration}ms`);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Example 3: Fallback Strategy with Multiple Providers
   */
  async fallbackStrategy(): Promise<void> {
    console.log('🔄 Example 3: Fallback Strategy with Multiple Providers');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    let result: ExampleResult = {
      name: 'Fallback Strategy',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    const providers = [
      { name: 'openai', model: 'gpt-3.5-turbo', apiKey: process.env.OPENAI_API_KEY },
      { name: 'local', model: 'llama2', apiKey: 'local' }
    ];

    for (const provider of providers) {
      try {
        console.log(`🔄 Trying ${provider.name}...`);
        
        const response = await this.llmService.callLLM({
          model: provider.model,
          apiKey: provider.apiKey || 'test-key',
          messages: [
            { role: 'user', content: 'Explain what happens when LLM services fail.' }
          ],
          context: 'fallback-test',
          purpose: 'content-generation',
          valueScore: 0.6,
          routingPreference: provider.name === 'local' ? 'local' : 'cloud'
        });

        result = {
          name: 'Fallback Strategy',
          success: true,
          duration: Date.now() - startTime,
          cost: provider.name === 'local' ? 0 : 0.002,
          provider: provider.name,
          insights: [
            `Successfully used ${provider.name}`,
            provider.name === 'local' ? 'No cost incurred' : 'Cloud cost applied',
            'Fallback strategy working correctly'
          ]
        };

        console.log(`✅ ${provider.name} succeeded`);
        console.log('📝 Response:', response.choices?.[0]?.message?.content?.slice(0, 100) + '...');
        break;

      } catch (error) {
        console.log(`❌ ${provider.name} failed:`, error instanceof Error ? error.message : String(error));
        
        if (provider.name === providers[providers.length - 1].name) {
          // All providers failed
          result = {
            name: 'Fallback Strategy',
            success: false,
            duration: Date.now() - startTime,
            cost: 0,
            provider: 'none',
            error: 'All providers failed',
            insights: [
              'All LLM providers unavailable',
              'Consider basic response generation',
              'Check network connectivity',
              'Verify provider configurations'
            ]
          };
          console.log('❌ All providers failed, using basic fallback');
        }
      }
    }

    console.log(`⏱️ Duration: ${result.duration}ms`);
    console.log(`💰 Cost: $${result.cost}`);
    this.results.push(result);
    console.log('\n');
  }

  /**
   * Example 4: Edge Case - Malformed JSON Response
   */
  async malformedJsonResponse(): Promise<void> {
    console.log('⚠️ Example 4: Edge Case - Malformed JSON Response');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    let result: ExampleResult = {
      name: 'Malformed JSON Response',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    try {
      const response = await this.llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Always respond with valid JSON.' },
          { role: 'user', content: 'Return a JSON object with fields: name, age, city. Make sure it\'s valid JSON.' }
        ],
        context: 'json-validation',
        purpose: 'data-extraction',
        valueScore: 0.7
      });

      const content = response.choices?.[0]?.message?.content || '';
      
      try {
        const parsed = JSON.parse(content);
        result = {
          name: 'Malformed JSON Response',
          success: true,
          duration: Date.now() - startTime,
          cost: 0.002,
          provider: 'openai',
          insights: [
            'JSON response parsed successfully',
            'Response format validation passed',
            'Data extraction working correctly'
          ]
        };

        console.log('✅ Valid JSON Response:');
        console.log(JSON.stringify(parsed, null, 2));

      } catch (parseError) {
        result = {
          name: 'Malformed JSON Response',
          success: false,
          duration: Date.now() - startTime,
          cost: 0.002,
          provider: 'openai',
          error: `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          insights: [
            'Response received but JSON parsing failed',
            'LLM may not have followed JSON format instructions',
            'Consider adding JSON validation to response processing',
            'Implement retry with clearer JSON instructions'
          ]
        };

        console.log('❌ Invalid JSON Response:');
        console.log('Raw content:', content);
        console.log('Parse error:', result.error);
        
        // Attempt to fix common JSON issues
        const fixedContent = this.fixCommonJsonIssues(content);
        try {
          const fixedParsed = JSON.parse(fixedContent);
          console.log('🔧 Fixed JSON:', fixedParsed);
        } catch {
          console.log('❌ Could not fix JSON, using fallback');
        }
      }

    } catch (error) {
      result = {
        name: 'Malformed JSON Response',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'LLM call failed completely',
          'Check API connectivity and authentication',
          'Consider fallback response generation'
        ]
      };

      console.log('❌ LLM call failed:', result.error);
    }

    console.log(`⏱️ Duration: ${result.duration}ms`);
    console.log(`💰 Cost: $${result.cost}`);
    this.results.push(result);
    console.log('\n');
  }

  /**
   * Example 5: Cost Optimization with Model Selection
   */
  async costOptimization(): Promise<void> {
    console.log('🎯 Example 5: Cost Optimization with Model Selection');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    let result: ExampleResult = {
      name: 'Cost Optimization',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    const tasks = [
      { content: 'What is 2 + 2?', complexity: 'low', expectedCost: 0.001 },
      { content: 'Explain the concept of recursion in programming.', complexity: 'medium', expectedCost: 0.002 },
      { content: 'Write a comprehensive analysis of machine learning algorithms and their applications.', complexity: 'high', expectedCost: 0.005 }
    ];

    let totalCost = 0;
    let successfulTasks = 0;

    for (const task of tasks) {
      try {
        // Select appropriate model based on complexity
        const model = task.complexity === 'low' ? 'gpt-3.5-turbo' : 'gpt-4';
        const maxTokens = task.complexity === 'low' ? 1000 : 4000;
        
        const response = await this.llmService.callLLM({
          model,
          apiKey: process.env.OPENAI_API_KEY || 'test-key',
          messages: [{ role: 'user', content: task.content }],
          max_tokens: maxTokens,
          context: 'cost-optimization',
          purpose: 'content-generation',
          valueScore: task.complexity === 'low' ? 0.1 : task.complexity === 'medium' ? 0.5 : 0.9
        });
        
        const cost = this.estimateCost(response, model);
        totalCost += cost;
        successfulTasks++;
        
        console.log(`✅ ${task.complexity} task completed for $${cost.toFixed(4)}`);
        console.log(`   Response: ${response.choices?.[0]?.message?.content?.slice(0, 50)}...`);
        
      } catch (error) {
        console.log(`❌ ${task.complexity} task failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    result = {
      name: 'Cost Optimization',
      success: successfulTasks > 0,
      duration: Date.now() - startTime,
      cost: totalCost,
      provider: 'openai',
      insights: [
        `Completed ${successfulTasks}/${tasks.length} tasks`,
        `Total cost: $${totalCost.toFixed(4)}`,
        'Model selection based on complexity',
        'Cost optimization working correctly'
      ]
    };

    console.log(`⏱️ Duration: ${result.duration}ms`);
    console.log(`💰 Total Cost: $${result.cost.toFixed(4)}`);
    this.results.push(result);
    console.log('\n');
  }

  /**
   * Helper method to fix common JSON issues
   */
  private fixCommonJsonIssues(content: string): string {
    return content
      .replace(/(\w+):/g, '"$1":') // Add quotes to keys
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
  }

  /**
   * Helper method to estimate cost
   */
  private estimateCost(response: any, model: string): number {
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    
    const pricing = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 }
    };
    
    const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-3.5-turbo'];
    return (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1000;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): void {
    console.log('📊 LLM Improved Examples Report');
    console.log('=' .repeat(50));

    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    const totalCost = this.results.reduce((sum, r) => sum + r.cost, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`📈 Summary:`);
    console.log(`   Total Examples: ${total}`);
    console.log(`   Successful: ${successful} (${((successful / total) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
    console.log(`   Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.name}`);
      console.log(`   ⏱️ ${result.duration}ms | 💰 $${result.cost.toFixed(4)} | 🔧 ${result.provider}`);
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      result.insights.forEach(insight => {
        console.log(`   💡 ${insight}`);
      });
      console.log('');
    });
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('🚀 LLM Improved Examples Demo');
    console.log('=' .repeat(50));
    console.log('This demo shows improved LLM usage patterns including:');
    console.log('✅ Happy paths with validation, ❌ Error handling, 🔄 Fallbacks');
    console.log('⚠️ Edge cases, 🎯 Cost optimization\n');

    await this.happyPathWithValidation();
    await this.errorHandlingWithTypes();
    await this.fallbackStrategy();
    await this.malformedJsonResponse();
    await this.costOptimization();

    this.generateReport();
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  const demo = new LLMImprovedExamples();
  demo.runAllExamples().catch(console.error);
}

export {
  LLMImprovedExamples,
  ExampleResult
}; 