import { describe, it, expect, beforeEach } from "bun:test";
import { 
  LLMInputValidator, 
  validateLLMInput, 
  preprocessLLMInput, 
  analyzeLLMContentQuality 
} from '../../../src/utils/llmInputValidator';
import type { ChatCompletionRequestMessage } from '../../../src/types/llm';

describe('LLM Input Validator', () => {
  let validator: LLMInputValidator;

  beforeEach(() => {
    validator = new LLMInputValidator();
  });

  describe('validateInput', () => {
    it('should validate correct input', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system' as const, content: 'You are a helpful assistant.' },
          { role: 'user' as const, content: 'Hello, how are you?' }
        ],
        temperature: 0.7,
        max_tokens: 1000
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing model', () => {
      const input = {
        model: '',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('model: Model name is required');
    });

    it('should detect empty message content', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: '' }]
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('messages.0.content: String must contain at least 1 character(s)');
    });

    it('should detect invalid temperature', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        temperature: 3.0 // Too high
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('temperature: Number must be less than or equal to 2');
    });

    it('should detect negative max_tokens', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        max_tokens: -1
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('max_tokens: Number must be greater than 0');
    });

    it('should detect security issues', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'user' as const, 
          content: 'My API key is sk-1234567890abcdef1234567890abcdef' 
        }]
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(true); // Still valid, but with warnings
      expect(result.warnings).toContain('Potential sensitive data detected - review before sending to LLM');
    });

    it('should detect expensive models', () => {
      const input = {
        model: 'gpt-4',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(true); // Still valid, but with warnings
      expect(result.warnings.some(w => w.includes('expensive model') || w.includes('cost optimization'))).toBe(true);
    });
  });

  describe('preprocessInput', () => {
    it('should improve poor quality input', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'something about code maybe' }]
      };

      const result = preprocessLLMInput(input);
      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.processedInput.messages.length).toBeGreaterThan(input.messages.length);
    });

    it('should add missing system message', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      const result = preprocessLLMInput(input);
      expect(result.success).toBe(true);
      expect(result.processedInput.messages.some((m: ChatCompletionRequestMessage) => m.role === 'system')).toBe(true);
    });

    it('should consolidate multiple system messages', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system' as const, content: 'You are helpful.' },
          { role: 'system' as const, content: 'You are a coding expert.' },
          { role: 'user' as const, content: 'Hello' }
        ]
      };

      const result = preprocessLLMInput(input);
      expect(result.success).toBe(true);
      const systemMessages = result.processedInput.messages.filter((m: ChatCompletionRequestMessage) => m.role === 'system');
      expect(systemMessages).toHaveLength(1);
    });

    it('should add missing context and purpose', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      const result = preprocessLLMInput(input);
      expect(result.success).toBe(true);
      expect(result.processedInput.context).toBeDefined();
      expect(result.processedInput.purpose).toBeDefined();
    });

    it('should fail preprocessing for invalid input', () => {
      const input = {
        model: '',
        messages: [{ role: 'user' as const, content: '' }]
      };

      const result = preprocessLLMInput(input);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeContentQuality', () => {
    it('should analyze good quality content', () => {
      const messages: ChatCompletionRequestMessage[] = [
        { role: 'user', content: 'Please write a TypeScript function that calculates the factorial of a number. Include error handling and JSDoc comments.' }
      ];

      const quality = analyzeLLMContentQuality(messages);
      expect(quality.overall).toBeGreaterThan(0.05);
      expect(quality.specificity).toBeGreaterThan(0.05);
      expect(quality.completeness).toBeGreaterThan(0.05);
    });

    it('should detect poor quality content', () => {
      const messages: ChatCompletionRequestMessage[] = [
        { role: 'user', content: 'something about code maybe' }
      ];

      const quality = analyzeLLMContentQuality(messages);
      expect(quality.overall).toBeLessThan(0.3);
      expect(quality.clarity).toBeLessThan(0.2);
      expect(quality.specificity).toBeLessThan(0.2);
    });

    it('should handle empty messages', () => {
      const messages: ChatCompletionRequestMessage[] = [];

      const quality = analyzeLLMContentQuality(messages);
      expect(quality.overall).toBe(0);
      expect(quality.readability).toBe(0);
      expect(quality.clarity).toBe(0);
    });

    it('should analyze multiple messages', () => {
      const messages: ChatCompletionRequestMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'How do I implement a binary search algorithm?' }
      ];

      const quality = analyzeLLMContentQuality(messages);
      expect(quality.overall).toBeGreaterThan(0);
      expect(quality.overall).toBeLessThanOrEqual(1);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for poor quality input', () => {
      const messages: ChatCompletionRequestMessage[] = [
        { role: 'user', content: 'something about code maybe' }
      ];

      const quality = analyzeLLMContentQuality(messages);
      const recommendations = validator.generateRecommendations(messages, quality);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('specific'))).toBe(true);
    });

    it('should generate recommendations for missing user messages', () => {
      const messages: ChatCompletionRequestMessage[] = [
        { role: 'system', content: 'You are helpful.' }
      ];

      const quality = analyzeLLMContentQuality(messages);
      const recommendations = validator.generateRecommendations(messages, quality);
      
      expect(recommendations.some(r => r.includes('user message'))).toBe(true);
    });

    it('should generate recommendations for long content', () => {
      const messages: ChatCompletionRequestMessage[] = [
        { role: 'user', content: 'x'.repeat(10000) }
      ];

      const quality = analyzeLLMContentQuality(messages);
      const recommendations = validator.generateRecommendations(messages, quality);
      
      expect(recommendations.some(r => r.includes('shortening'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'x'.repeat(200000) }] // Very long
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(true); // Still valid, but with warnings
      // The validation logic checks for maxMessageLength (100000) and adds warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle too many messages', () => {
      const messages = Array.from({ length: 150 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i + 1}`
      }));

      const input = {
        model: 'gpt-3.5-turbo',
        messages
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(true); // Still valid, but with warnings
      // The validation logic checks for high token usage and adds warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle undefined/null content', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'undefined' },
          { role: 'user' as const, content: 'null' }
        ]
      };

      const result = validateLLMInput(input);
      expect(result.isValid).toBe(true); // Still valid
      expect(result.warnings.some(w => w.includes('undefined/null'))).toBe(true);
    });
  });

  describe('performance', () => {
    it('should complete validation quickly', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system' as const, content: 'You are helpful.' },
          { role: 'user' as const, content: 'Hello, this is a test message with some content to validate.' }
        ]
      };

      const startTime = Date.now();
      const result = validateLLMInput(input);
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should complete preprocessing quickly', () => {
      const input = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user' as const, content: 'something about code maybe' }
        ]
      };

      const startTime = Date.now();
      const result = preprocessLLMInput(input);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in under 200ms
    });
  });
}); 