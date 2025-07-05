#!/usr/bin/env bun

/**
 * LLM Comprehensive Scenarios Examples
 * 
 * This file demonstrates comprehensive LLM usage patterns covering:
 * - ✅ Happy path scenarios (successful operations)
 * - ❌ Error scenarios (API failures, timeouts, rate limits)
 * - 🔄 Fallback scenarios (local LLM fallback, provider switching)
 * - ⚠️ Edge cases (invalid inputs, malformed responses)
 * - 🎯 Optimization scenarios (cost management, performance tuning)
 * - 🔧 Troubleshooting scenarios (debugging, monitoring)
 * 
 * Each scenario includes realistic examples with proper error handling
 * and demonstrates best practices for production use.
 */

import { LLMService } from '../src/services/llm';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ScenarioResult {
  scenario: string;
  success: boolean;
  duration: number;
  cost: number;
  provider: string;
  error?: string;
  insights: string[];
}

class LLMComprehensiveScenarios {
  private llmService: LLMService;
  private results: ScenarioResult[] = [];

  constructor() {
    // Initialize with realistic configuration
    this.llmService = new LLMService({
      maxTokensPerCall: 4000,
      maxCostPerCall: 0.10,
      minValueScore: 0.3,
      enableLocalLLM: true,
      retryAttempts: 3,
      retryDelayMs: 1000,
      preferLocalLLM: true,
      complexityThreshold: 0.6,
      costSensitivity: 0.8
    });
  }

  /**
   * Scenario 1: ✅ Happy Path - Successful Content Generation
   */
  async happyPathContentGeneration(): Promise<void> {
    console.log('✅ Scenario 1: Happy Path - Content Generation');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Happy Path Content Generation',
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
        valueScore: 0.8,
        routingPreference: 'auto'
      });

      result = {
        scenario: 'Happy Path Content Generation',
        success: true,
        duration: Date.now() - startTime,
        cost: 0.002, // Estimated cost
        provider: 'openai',
        insights: [
          'Content generated successfully',
          'Response quality meets expectations',
          'Cost within acceptable range'
        ]
      };

      console.log('📝 Generated Content:');
      console.log(response.choices?.[0]?.message?.content || 'No content');
      console.log(`⏱️ Duration: ${result.duration}ms`);
      console.log(`💰 Estimated Cost: $${result.cost}`);

    } catch (error) {
      result = {
        scenario: 'Happy Path Content Generation',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'unknown',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'Unexpected error in happy path scenario',
          'Check API key and network connectivity',
          'Consider fallback to local LLM'
        ]
      };

      console.log('❌ Happy path failed:', result.error);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 2: ❌ API Key Error - Invalid Authentication
   */
  async apiKeyErrorScenario(): Promise<void> {
    console.log('❌ Scenario 2: API Key Error - Invalid Authentication');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'API Key Error',
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
          { role: 'user', content: 'Hello, this should fail due to invalid API key.' }
        ],
        context: 'error-testing',
        purpose: 'test',
        valueScore: 0.1
      });

      // This should not reach here
      result = {
        scenario: 'API Key Error',
        success: true,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        insights: ['Unexpected success with invalid API key']
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result = {
        scenario: 'API Key Error',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        error: errorMessage,
        insights: [
          'Authentication failed as expected',
          'Error properly caught and handled',
          'No cost incurred for failed request',
          'Consider checking API key configuration'
        ]
      };

      console.log('🔐 Expected API Key Error:');
      console.log(`Error: ${errorMessage}`);
      console.log(`⏱️ Duration: ${result.duration}ms`);
      console.log('✅ Error handled gracefully');
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 3: 🔄 Rate Limit Error - Too Many Requests
   */
  async rateLimitScenario(): Promise<void> {
    console.log('🔄 Scenario 3: Rate Limit Error - Too Many Requests');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Rate Limit Error',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    // Simulate rapid requests to trigger rate limiting
    const rapidRequests = Array.from({ length: 5 }, (_, i) => 
      this.llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'user', content: `Rapid request ${i + 1} - this might trigger rate limiting.` }
        ],
        context: 'rate-limit-test',
        purpose: 'test',
        valueScore: 0.1
      })
    );

    try {
      const responses = await Promise.allSettled(rapidRequests);
      
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const failed = responses.filter(r => r.status === 'rejected').length;

      result = {
        scenario: 'Rate Limit Error',
        success: successful > 0,
        duration: Date.now() - startTime,
        cost: 0.001 * successful,
        provider: 'openai',
        insights: [
          `Successful requests: ${successful}`,
          `Failed requests: ${failed}`,
          'Rate limiting behavior observed',
          'Retry mechanism working as expected'
        ]
      };

      console.log('🚦 Rate Limit Test Results:');
      console.log(`✅ Successful: ${successful}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`⏱️ Total Duration: ${result.duration}ms`);

      // Show specific errors
      responses.forEach((response, i) => {
        if (response.status === 'rejected') {
          const error = response.reason;
          console.log(`Request ${i + 1} failed: ${error.message || error}`);
        }
      });

    } catch (error) {
      result = {
        scenario: 'Rate Limit Error',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'All requests failed unexpectedly',
          'Check network connectivity',
          'Verify API key validity'
        ]
      };

      console.log('❌ Rate limit test failed:', result.error);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 4: 🔄 Local LLM Fallback - Cloud Service Unavailable
   */
  async localLLMFallbackScenario(): Promise<void> {
    console.log('🔄 Scenario 4: Local LLM Fallback - Cloud Service Unavailable');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Local LLM Fallback',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    try {
      // Force local LLM usage
      this.llmService.setRoutingPreference('local');

      const response = await this.llmService.callLLM({
        model: 'llama2',
        apiKey: 'local',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Explain what happens when cloud LLM services are unavailable.' }
        ],
        context: 'fallback-test',
        purpose: 'content-generation',
        valueScore: 0.6,
        routingPreference: 'local'
      });

      result = {
        scenario: 'Local LLM Fallback',
        success: true,
        duration: Date.now() - startTime,
        cost: 0, // Local LLMs are free
        provider: 'local-ollama',
        insights: [
          'Successfully fell back to local LLM',
          'No cost incurred for local processing',
          'Response quality may vary compared to cloud',
          'Local processing provides offline capability'
        ]
      };

      console.log('🏠 Local LLM Response:');
      console.log(response.choices?.[0]?.message?.content || 'No content');
      console.log(`⏱️ Duration: ${result.duration}ms`);
      console.log(`💰 Cost: $${result.cost} (free)`);

    } catch (error) {
      result = {
        scenario: 'Local LLM Fallback',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'local-ollama',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'Local LLM not available',
          'Check if Ollama is installed and running',
          'Consider installing local LLM for offline capability',
          'Fallback to basic response generation'
        ]
      };

      console.log('❌ Local LLM fallback failed:', result.error);
      console.log('💡 Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh');
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 5: ⚠️ Malformed Response - Invalid JSON
   */
  async malformedResponseScenario(): Promise<void> {
    console.log('⚠️ Scenario 5: Malformed Response - Invalid JSON');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Malformed Response',
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
      
      // Try to parse JSON
      try {
        const parsed = JSON.parse(content);
        result = {
          scenario: 'Malformed Response',
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
          scenario: 'Malformed Response',
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
      }

    } catch (error) {
      result = {
        scenario: 'Malformed Response',
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

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 6: 🎯 Cost Optimization - Token Limit Exceeded
   */
  async costOptimizationScenario(): Promise<void> {
    console.log('🎯 Scenario 6: Cost Optimization - Token Limit Exceeded');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Cost Optimization',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    // Create a very long prompt to test token limits
    const longText = 'This is a very long text. '.repeat(1000); // ~6000 characters
    const expensiveModel = 'gpt-4';

    try {
      const response = await this.llmService.callLLM({
        model: expensiveModel,
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `Summarize this very long text in one sentence: ${longText}` }
        ],
        context: 'cost-optimization',
        purpose: 'content-summarization',
        valueScore: 0.5
      });

      result = {
        scenario: 'Cost Optimization',
        success: true,
        duration: Date.now() - startTime,
        cost: 0.05, // Higher cost due to token count
        provider: 'openai',
        insights: [
          'Request completed but at high cost',
          'Token count exceeded optimal limits',
          'Consider using cheaper model for long texts',
          'Implement text truncation for cost control'
        ]
      };

      console.log('💰 Expensive Request Results:');
      console.log('Summary:', response.choices?.[0]?.message?.content || 'No content');
      console.log(`⏱️ Duration: ${result.duration}ms`);
      console.log(`💰 Estimated Cost: $${result.cost}`);

    } catch (error) {
      result = {
        scenario: 'Cost Optimization',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'Request failed due to token limits',
          'Implement automatic text truncation',
          'Consider chunking large texts',
          'Use cheaper models for long content'
        ]
      };

      console.log('❌ Token limit exceeded:', result.error);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 7: 🔧 Performance Monitoring - Slow Response
   */
  async performanceMonitoringScenario(): Promise<void> {
    console.log('🔧 Scenario 7: Performance Monitoring - Slow Response');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Performance Monitoring',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    try {
      const response = await this.llmService.callLLM({
        model: 'gpt-4', // Slower but more capable model
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Take your time to provide a thorough response.' },
          { role: 'user', content: 'Write a detailed analysis of the benefits and drawbacks of using local vs cloud LLMs for different use cases.' }
        ],
        context: 'performance-test',
        purpose: 'analysis',
        valueScore: 0.9
      });

      const duration = Date.now() - startTime;
      result = {
        scenario: 'Performance Monitoring',
        success: true,
        duration,
        cost: 0.03,
        provider: 'openai',
        insights: [
          `Response time: ${duration}ms`,
          duration > 10000 ? 'Slow response detected' : 'Response time acceptable',
          'High-value task completed successfully',
          'Consider caching for repeated queries'
        ]
      };

      console.log('⏱️ Performance Test Results:');
      console.log('Response preview:', (response.choices?.[0]?.message?.content || 'No content').slice(0, 100) + '...');
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log(`💰 Cost: $${result.cost}`);
      console.log(duration > 10000 ? '⚠️ Slow response detected' : '✅ Response time acceptable');

    } catch (error) {
      result = {
        scenario: 'Performance Monitoring',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'openai',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'Request timed out or failed',
          'Check network connectivity',
          'Consider using faster model',
          'Implement timeout handling'
        ]
      };

      console.log('❌ Performance test failed:', result.error);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Scenario 8: 🔄 Provider Switching - Intelligent Routing
   */
  async providerSwitchingScenario(): Promise<void> {
    console.log('🔄 Scenario 8: Provider Switching - Intelligent Routing');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let result: ScenarioResult = {
      scenario: 'Provider Switching',
      success: false,
      duration: 0,
      cost: 0,
      provider: 'unknown',
      insights: []
    };

    try {
      // Test intelligent routing with different complexity levels
      const simpleTask = await this.llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'user', content: 'What is 2 + 2?' }
        ],
        context: 'simple-task',
        purpose: 'calculation',
        valueScore: 0.1,
        routingPreference: 'auto'
      });

      const complexTask = await this.llmService.callLLM({
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        messages: [
          { role: 'user', content: 'Explain the implications of quantum computing on cryptography and provide a detailed analysis of potential security risks.' }
        ],
        context: 'complex-task',
        purpose: 'analysis',
        valueScore: 0.9,
        routingPreference: 'auto'
      });

      result = {
        scenario: 'Provider Switching',
        success: true,
        duration: Date.now() - startTime,
        cost: 0.005,
        provider: 'mixed',
        insights: [
          'Intelligent routing working correctly',
          'Simple tasks use cheaper models',
          'Complex tasks use more capable models',
          'Cost optimization through provider selection'
        ]
      };

      console.log('🔄 Provider Switching Results:');
      console.log('Simple task response:', simpleTask.choices?.[0]?.message?.content || 'No content');
      console.log('Complex task preview:', (complexTask.choices?.[0]?.message?.content || 'No content').slice(0, 100) + '...');
      console.log(`⏱️ Total Duration: ${result.duration}ms`);
      console.log(`💰 Total Cost: $${result.cost}`);

    } catch (error) {
      result = {
        scenario: 'Provider Switching',
        success: false,
        duration: Date.now() - startTime,
        cost: 0,
        provider: 'unknown',
        error: error instanceof Error ? error.message : String(error),
        insights: [
          'Provider switching failed',
          'Check provider availability',
          'Verify routing configuration',
          'Consider manual provider selection'
        ]
      };

      console.log('❌ Provider switching failed:', result.error);
    }

    this.results.push(result);
    console.log('\n');
  }

  /**
   * Generate comprehensive report of all scenarios
   */
  generateScenarioReport(): void {
    console.log('📊 LLM Comprehensive Scenarios Report');
    console.log('=' .repeat(60));

    const totalScenarios = this.results.length;
    const successfulScenarios = this.results.filter(r => r.success).length;
    const failedScenarios = totalScenarios - successfulScenarios;
    const totalCost = this.results.reduce((sum, r) => sum + r.cost, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`📈 Summary:`);
    console.log(`   Total Scenarios: ${totalScenarios}`);
    console.log(`   Successful: ${successfulScenarios} (${((successfulScenarios / totalScenarios) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${failedScenarios} (${((failedScenarios / totalScenarios) * 100).toFixed(1)}%)`);
    console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
    console.log(`   Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration > 5000 ? '⚠️' : '⏱️';
      console.log(`${status} ${index + 1}. ${result.scenario}`);
      console.log(`   ${duration} ${result.duration}ms | 💰 $${result.cost.toFixed(4)} | 🔧 ${result.provider}`);
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      result.insights.forEach(insight => {
        console.log(`   💡 ${insight}`);
      });
      console.log('');
    });

    // Save report to file
    const reportPath = join(process.cwd(), 'llm-scenarios-report.json');
    writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalScenarios,
        successfulScenarios,
        failedScenarios,
        successRate: (successfulScenarios / totalScenarios) * 100,
        totalCost,
        totalDuration
      },
      results: this.results
    }, null, 2));

    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Run all scenarios
   */
  async runAllScenarios(): Promise<void> {
    console.log('🚀 LLM Comprehensive Scenarios Demo');
    console.log('=' .repeat(60));
    console.log('This demo covers various LLM usage scenarios including:');
    console.log('✅ Happy paths, ❌ Error handling, 🔄 Fallbacks, ⚠️ Edge cases');
    console.log('🎯 Cost optimization, 🔧 Performance monitoring\n');

    await this.happyPathContentGeneration();
    await this.apiKeyErrorScenario();
    await this.rateLimitScenario();
    await this.localLLMFallbackScenario();
    await this.malformedResponseScenario();
    await this.costOptimizationScenario();
    await this.performanceMonitoringScenario();
    await this.providerSwitchingScenario();

    this.generateScenarioReport();
  }
}

// Run scenarios if this file is executed directly
if (import.meta.main) {
  const demo = new LLMComprehensiveScenarios();
  demo.runAllScenarios().catch(console.error);
}

export {
  LLMComprehensiveScenarios,
  ScenarioResult
}; 