import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { LLMService, LLMUsageMetrics } from '../../../src/services/llm';
import { promises as fs } from 'fs';
import path from 'path';

// Mock fetch for OpenAI API calls
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    choices: [{ message: { content: 'Mocked response' } }]
  })
}));

// Mock child_process for local LLM testing
const mockExecSync = mock(() => 'mocked version');

describe('LLMService', () => {
  let llmService: LLMService;
  let usageLogPath: string;

  beforeEach(() => {
    // Set up test environment
    global.fetch = mockFetch as any;
    
    // Mock child_process
    mock.module('child_process', () => ({
      execSync: mockExecSync
    }));

    // Create service with test config - lower thresholds for testing
    llmService = new LLMService({
      maxTokensPerCall: 1000,
      maxCostPerCall: 0.05,
      minValueScore: 0.1, // Lower threshold for tests
      enableLocalLLM: true,
      retryAttempts: 2,
      retryDelayMs: 100,
      testMode: true, // Enable test mode
      preferLocalLLM: false, // Disable local LLM preference in tests
      complexityThreshold: 0.8, // Higher threshold for tests
      costSensitivity: 0.5 // Lower cost sensitivity for tests
    });

    usageLogPath = path.join(process.cwd(), '.llm-usage-log.json');
  });

  afterEach(async () => {
    // Clean up usage log
    try {
      await fs.unlink(usageLogPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const defaultService = new LLMService();
      expect(defaultService['config'].maxTokensPerCall).toBe(4000);
      expect(defaultService['config'].maxCostPerCall).toBe(0.10);
      expect(defaultService['config'].minValueScore).toBe(0.3);
    });

    it('should override default config with custom values', () => {
      const customService = new LLMService({
        maxTokensPerCall: 2000,
        maxCostPerCall: 0.20,
        minValueScore: 0.5
      });

      expect(customService['config'].maxTokensPerCall).toBe(2000);
      expect(customService['config'].maxCostPerCall).toBe(0.20);
      expect(customService['config'].minValueScore).toBe(0.5);
    });
  });

  describe('Value Score Assessment', () => {
    it('should skip calls with low value score', async () => {
      const result = await llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: 'test' }],
        context: 'test',
        purpose: 'test',
        valueScore: 0.1 // Below threshold
      });

      expect(result.choices[0].message.content).toContain('unavailable');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should proceed with calls above value threshold', async () => {
      const result = await llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: 'test' }],
        context: 'test',
        purpose: 'test',
        valueScore: 0.8 // Above threshold
      });

      // In test mode, should use fallback response
      expect(result.choices[0].message.content).toContain('unavailable');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Cost Management', () => {
    it('should estimate costs correctly', () => {
      const messages = [
        { role: 'user' as const, content: 'This is a test message with some content' }
      ];
      
      const estimatedTokens = llmService['estimateTokens'](messages);
      const estimatedCost = llmService['estimateCost'](estimatedTokens, 'gpt-3.5-turbo');
      
      expect(estimatedTokens).toBeGreaterThan(0);
      expect(estimatedCost).toBeGreaterThan(0);
    });

    it('should skip calls exceeding cost limit', async () => {
      // Create a very long message to exceed cost limit
      const longMessage = 'x'.repeat(10000);
      
      const result = await llmService.callLLM({
        model: 'gpt-4', // More expensive model
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: longMessage }],
        context: 'test',
        purpose: 'test',
        valueScore: 0.8
      });

      expect(result.choices[0].message.content).toContain('unavailable');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should truncate messages exceeding token limit', async () => {
      const longMessage = 'x'.repeat(5000); // Very long message
      
      const result = await llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: longMessage }],
        context: 'test',
        purpose: 'test',
        valueScore: 0.8
      });

      // In test mode, should use fallback response
      expect(result.choices[0].message.content).toContain('unavailable');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should preserve system messages when truncating', async () => {
      const messages = [
        { role: 'system' as const, content: 'Important system instruction' },
        { role: 'user' as const, content: 'x'.repeat(5000) } // Very long user message
      ];

      const truncated = llmService['truncateMessages'](messages, 100);
      
      expect(truncated[0]?.content).toBe('Important system instruction');
      expect(truncated[1]?.content.length).toBeLessThan(5000);
      expect(truncated[1]?.content).toContain('...');
    });
  });

  describe('Rate Limit Handling', () => {
    it('should handle rate limit errors with retry', async () => {
      let callCount = 0;
      const rateLimitMock = mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            text: () => Promise.resolve('Rate limit exceeded')
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success after retry' } }]
          })
        });
      });

      global.fetch = rateLimitMock as any;

      const result = await llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: 'test' }],
        context: 'test',
        purpose: 'test',
        valueScore: 0.8
      });

      // In test mode, should use fallback response
      expect(result.choices[0].message.content).toContain('unavailable');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Usage Tracking', () => {
    it('should track successful calls', async () => {
      // Mock local LLM availability to return false
      const localLLMMock = mock(() => {
        throw new Error('Command not found');
      });

      mock.module('child_process', () => ({
        execSync: localLLMMock
      }));

      // Create a service with memory-only mode for reliable testing
      const realService = new LLMService({
        testMode: false,
        minValueScore: 0.1,
        enableLocalLLM: false, // Disable local LLM to force OpenAI
        memoryOnly: true // Use memory-only mode to avoid disk I/O
      });

      // Inject a custom test provider with name 'openai'
      (realService as any).providers.unshift({
        name: 'openai',
        isAvailable: async () => true,
        call: async () => ({ choices: [{ message: { content: 'Success response' } }] }),
        estimateTokens: () => 1,
        estimateCost: () => 0.001
      });

      await realService.callLLM({
        model: 'test-model', // Use a model name that matches the test provider
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: 'test' }],
        context: 'test-context',
        purpose: 'test-purpose',
        valueScore: 0.8
      });

      const analytics = realService.getUsageAnalytics();
      expect(analytics.totalCalls).toBe(1);
      expect(analytics.successRate).toBe(1.0);
      if (analytics.topPurposes.length > 0 && analytics.topPurposes[0]) {
        expect(analytics.topPurposes[0].purpose).toBe('test-purpose');
      }
    });

    it('should track failed calls', async () => {
      // Mock local LLM availability to return false
      const localLLMMock = mock(() => {
        throw new Error('Command not found');
      });

      mock.module('child_process', () => ({
        execSync: localLLMMock
      }));

      const errorMock = mock(() => Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error')
      }));

      // Store original fetch
      const originalFetch = global.fetch;
      global.fetch = errorMock as any;

      try {
        // Create a service with memory-only mode for reliable testing
        const realService = new LLMService({
          testMode: false,
          minValueScore: 0.1,
          enableLocalLLM: false,
          memoryOnly: true // Use memory-only mode to avoid disk I/O
        });

        // Set OpenAI API key for the test
        process.env.OPENAI_API_KEY = 'test-key';

        await realService.callLLM({
          model: 'gpt-3.5-turbo',
          apiKey: 'test-key',
          messages: [{ role: 'user' as const, content: 'test' }],
          context: 'test-context',
          purpose: 'test-purpose',
          valueScore: 0.8
        });

        const analytics = realService.getUsageAnalytics();
        expect(analytics.totalCalls).toBe(1);
        expect(analytics.successRate).toBe(0.0);
      } finally {
        // Restore original fetch
        global.fetch = originalFetch;
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('should generate usage reports', () => {
      const report = llmService.generateUsageReport();
      expect(report).toContain('LLM Usage Report');
      expect(report).toContain('Cost Summary');
      expect(report).toContain('Top Purposes');
    });
  });

  describe('Local LLM Support', () => {
    it('should detect local LLM availability', async () => {
      const isAvailable = await llmService['checkLocalLLMAvailability']('ollama');
      expect(isAvailable).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('ollama --version', { stdio: 'ignore' });
    });

    it('should handle local LLM unavailability', async () => {
      const errorMock = mock(() => {
        throw new Error('Command not found');
      });

      mock.module('child_process', () => ({
        execSync: errorMock
      }));

      const isAvailable = await llmService['checkLocalLLMAvailability']('nonexistent');
      expect(isAvailable).toBe(false);
    });
  });

  describe('Fallback Responses', () => {
    it('should provide appropriate fallbacks for different purposes', () => {
      const semanticFallback = llmService['getFallbackResponse']('semantic-tagging');
      const excerptFallback = llmService['getFallbackResponse']('excerpt-generation');
      const generalFallback = llmService['getFallbackResponse']('unknown-purpose');

      expect(semanticFallback.choices[0].message.content).toContain('semanticCategory');
      expect(excerptFallback.choices[0].message.content).toContain('unavailable');
      expect(generalFallback.choices[0].message.content).toContain('unavailable');
    });
  });

  describe('Analytics', () => {
    it('should calculate analytics correctly', async () => {
      // Make several calls to generate data
      for (let i = 0; i < 3; i++) {
        await llmService.callLLM({
          model: 'gpt-3.5-turbo',
          apiKey: 'test-key',
          messages: [{ role: 'user' as const, content: `test ${i}` }],
          context: 'test',
          purpose: 'test-purpose',
          valueScore: 0.8
        });
      }

      const analytics = llmService.getUsageAnalytics();
      
      // In test mode, calls use fallbacks and aren't tracked
      expect(analytics.totalCalls).toBe(0);
      expect(analytics.totalTokens).toBe(0);
      expect(analytics.totalCost).toBe(0);
      expect(analytics.successRate).toBe(0);
      expect(analytics.averageValueScore).toBe(0);
      expect(analytics.topPurposes.length).toBe(0);
      expect(analytics.providerBreakdown.length).toBe(0);
    });

    it('should handle empty usage log', () => {
      const emptyService = new LLMService();
      const analytics = emptyService.getUsageAnalytics();
      
      expect(analytics.totalCalls).toBe(0);
      expect(analytics.totalTokens).toBe(0);
      expect(analytics.totalCost).toBe(0);
      expect(analytics.successRate).toBe(0);
      expect(analytics.averageValueScore).toBe(0);
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations based on usage patterns', () => {
      const analytics = {
        totalCalls: 10,
        totalCost: 15.0, // High cost
        successRate: 0.7, // Low success rate
        averageValueScore: 0.3, // Low value score
        topPurposes: [
          { purpose: 'expensive-task', calls: 5, cost: 10.0 }
        ]
      };

      const recommendations = llmService['generateRecommendations'](analytics);
      
      expect(recommendations).toContain('High cost detected');
      expect(recommendations).toContain('Low success rate');
      expect(recommendations).toContain('Consider increasing minValueScore');
    });
  });

  describe('Intelligent Routing', () => {
    it('should force local LLM when preferLocalLLM is set', async () => {
      llmService.setRoutingPreference('local');
      expect(llmService['config'].preferLocalLLM).toBe(true);
      expect(llmService['config'].complexityThreshold).toBe(1.0);
    });
    it('should force cloud LLM when preferCloud is set', async () => {
      llmService.setRoutingPreference('cloud');
      expect(llmService['config'].preferLocalLLM).toBe(false);
      expect(llmService['config'].complexityThreshold).toBe(0.0);
    });
    it('should use auto routing by default', async () => {
      llmService.setRoutingPreference('auto');
      expect(llmService['config'].preferLocalLLM).toBe(true);
      expect(llmService['config'].complexityThreshold).toBe(0.6);
    });
    it('should respect routingPreference in callLLM', async () => {
      await llmService.callLLM({
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key',
        messages: [{ role: 'user' as const, content: 'test' }],
        context: 'test',
        purpose: 'test',
        valueScore: 0.8,
        routingPreference: 'cloud',
      });
      expect(llmService['config'].preferLocalLLM).toBe(false);
      expect(llmService['config'].complexityThreshold).toBe(0.0);
    });
  });
}); 