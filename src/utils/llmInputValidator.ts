import { z } from 'zod';
import { LLMInputSchema } from '../types';
import type { ChatCompletionRequestMessage } from '../types/llm';
import { InputValidationResult, ContentQualityMetrics } from '../types/llm';

// ============================================================================
// INPUT VALIDATION FUNCTIONS
// ============================================================================

/**
 * Comprehensive LLM Input Validator and Preprocessor
 * 
 * This utility prevents common LLM errors by:
 * 1. Validating input structure and content
 * 2. Sanitizing and improving message content
 * 3. Optimizing prompts for better responses
 * 4. Detecting potential issues before LLM calls
 * 5. Providing recommendations for improvement
 */
export class LLMInputValidator {
  private readonly maxMessageLength = 100000;
  private readonly maxTotalTokens = 32000;
  private readonly minContentLength = 10;
  private readonly maxMessages = 100;

  /**
   * Comprehensive input validation with detailed feedback
   */
  validateInput(params: { input: any }): InputValidationResult {
    const { input } = params;
    const result: InputValidationResult = {
      isValid: false,
      success: false,
      errors: [],
      warnings: [],
      sanitizedInput: null,
      processedInput: null,
      recommendations: [],
      changes: []
    };

    try {
      // Basic schema validation
      const validated = LLMInputSchema.parse(input);
      result.sanitizedInput = validated;
      result.processedInput = validated;
      result.isValid = true;
      result.success = true;

      // Additional content validation
      this.validateContent(validated, result);
      
      // Performance and cost validation
      this.validatePerformance(validated, result);
      
      // Security validation
      this.validateSecurity(validated, result);

    } catch (error) {
      if (error instanceof z.ZodError) {
        result.errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      } else {
        result.errors.push(`Validation error: ${error}`);
      }
    }

    return result;
  }

  /**
   * Preprocess and improve input before LLM call
   */
  preprocessInput(params: { input: any }): InputValidationResult {
    const { input } = params;
    const result: InputValidationResult = {
      isValid: false,
      success: false,
      errors: [],
      warnings: [],
      sanitizedInput: null,
      processedInput: null,
      recommendations: [],
      changes: []
    };

    let processed = { ...input };
    try {
      // Always attempt to auto-correct missing fields before validation
      if (!processed.messages || !Array.isArray(processed.messages)) processed.messages = [];
      const hasSystem = processed.messages.some((m: any) => m.role === 'system');
      if (!hasSystem) {
        processed.messages = [
          { role: 'system', content: 'You are an AI assistant.' },
          ...processed.messages
        ];
        result.changes!.push('Added default system message');
      }
      // Consolidate multiple system messages
      const systemMessages = processed.messages.filter((m: any) => m.role === 'system');
      if (systemMessages.length > 1) {
        const consolidated = {
          role: 'system',
          content: systemMessages.map((m: any) => m.content).join(' ')
        };
        processed.messages = [
          consolidated,
          ...processed.messages.filter((m: any) => m.role !== 'system')
        ];
        result.changes!.push('Consolidated multiple system messages');
      }
      // Add context and purpose if missing
      if (!processed.context) {
        processed.context = 'general';
        result.changes!.push('Added default context');
      }
      if (!processed.purpose) {
        processed.purpose = 'assistance';
        result.changes!.push('Added default purpose');
      }
      // Now validate after corrections
      let validation = this.validateInput(processed);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }
      // Continue with normal improvement pipeline
      processed.messages = this.improveMessages(processed.messages, result);
      processed.messages = this.optimizeSystemMessages(processed.messages, result);
      processed = this.addMissingContext(processed, result);
      processed = this.optimizeForPurpose(processed, result);
      const finalValidation = this.validateInput(processed);
      if (!finalValidation.isValid) {
        result.errors = finalValidation.errors;
        return result;
      }
      result.sanitizedInput = processed;
      result.processedInput = processed;
      result.isValid = true;
      result.success = true;
    } catch (error) {
      result.errors.push(`Preprocessing error: ${error}`);
    }
    return result;
  }

  /**
   * Analyze content quality and provide improvement suggestions
   */
  analyzeContentQuality(messages: ChatCompletionRequestMessage[]): ContentQualityMetrics {
    const userMessages = messages.filter(m => m.role === 'user');
    const systemMessages = messages.filter(m => m.role === 'system');
    
    let readability = 0;
    let clarity = 0;
    let specificity = 0;
    let completeness = 0;

    // Analyze user messages
    for (let i = 0; i < userMessages.length; i++) {
      if (i % 10 === 0 || i === userMessages.length - 1) {
        console.log(`🔄 Processing user message ${i + 1} of ${userMessages.length}`);
      }
      const msg = userMessages[i];
      if (!msg) continue;
      const content = msg.content;
      
      // Readability: sentence length, word complexity
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s, j, arr) => {
        if (j % 10 === 0 || j === arr.length - 1) {
          console.log(`🔄 Processing sentence ${j + 1} of ${arr.length}`);
        }
        return sum + s.split(' ').length;
      }, 0) / sentences.length;
      readability += Math.min(1, avgSentenceLength / 20); // Optimal: 15-20 words per sentence
      
      // Clarity: specific vs vague language
      const specificWords = content.match(/\b(how|what|when|where|why|which|who|specific|exactly|precisely|concrete|detailed)\b/gi)?.length || 0;
      const vagueWords = content.match(/\b(something|anything|everything|nothing|maybe|perhaps|sort of|kind of|basically|essentially)\b/gi)?.length || 0;
      clarity += Math.max(0, (specificWords - vagueWords) / Math.max(1, content.split(' ').length));
      
      // Specificity: technical terms, numbers, examples
      const technicalTerms = content.match(/\b(API|function|method|class|interface|type|schema|validation|error|success|config|option)\b/gi)?.length || 0;
      const numbers = content.match(/\d+/g)?.length || 0;
      const examples = content.match(/\b(example|instance|case|scenario|sample)\b/gi)?.length || 0;
      specificity += (technicalTerms + numbers + examples) / Math.max(1, content.split(' ').length);
      
      // Completeness: question marks, action words
      const questions = content.match(/\?/g)?.length || 0;
      const actionWords = content.match(/\b(create|build|implement|fix|optimize|analyze|generate|write|test|validate)\b/gi)?.length || 0;
      completeness += (questions + actionWords) / Math.max(1, content.split(' ').length);
    }

    // Normalize scores
    const messageCount = Math.max(1, userMessages.length);
    readability = Math.min(1, readability / messageCount);
    clarity = Math.min(1, Math.max(0, clarity / messageCount));
    specificity = Math.min(1, specificity / messageCount);
    completeness = Math.min(1, completeness / messageCount);

    // Calculate overall score
    const overall = (readability + clarity + specificity + completeness) / 4;

    return {
      readability,
      clarity,
      specificity,
      completeness,
      overall
    };
  }

  /**
   * Generate improvement recommendations based on content analysis
   */
  generateRecommendations(messages: ChatCompletionRequestMessage[], quality: ContentQualityMetrics): string[] {
    const recommendations: string[] = [];
    const userMessages = messages.filter(m => m.role === 'user');
    for (let i = 0; i < userMessages.length; i++) {
      if (i % 10 === 0 || i === userMessages.length - 1) {
        console.log(`🔄 Processing user message for recommendation ${i + 1} of ${userMessages.length}`);
      }
      const msg = userMessages[i];

      if (quality.readability < 0.6) {
        recommendations.push('Consider breaking down complex sentences into shorter, clearer statements');
      }

      if (quality.clarity < 0.5) {
        recommendations.push('Use more specific language and avoid vague terms like "something" or "maybe"');
      }

      if (quality.specificity < 0.4) {
        recommendations.push('Include specific technical terms, numbers, or examples to make your request more precise');
      }

      if (quality.completeness < 0.5) {
        recommendations.push('Consider adding specific questions or action words to clarify what you want');
      }

      if (userMessages.length === 0) {
        recommendations.push('Add a user message to specify what you want the LLM to do');
      }

      if (userMessages.length > 3) {
        recommendations.push('Consider consolidating multiple messages into a single, comprehensive request');
      }

      // Check for common issues
      const allContent = messages.map(m => m.content).join(' ');
      
      if (allContent.includes('TODO') || allContent.includes('FIXME')) {
        recommendations.push('Remove TODO/FIXME comments from LLM input - they can confuse the model');
      }

      if (allContent.includes('console.log') || allContent.includes('debugger')) {
        recommendations.push('Remove debug statements from LLM input for cleaner responses');
      }

      if (allContent.length > 5000) {
        recommendations.push('Consider shortening your input - very long prompts can reduce response quality');
      }
    }
    return recommendations;
  }

  /**
   * Validate message content quality and structure
   */
  private validateContent(input: any, result: InputValidationResult): void {
    const { messages, model } = input;

    // Check message content quality
    for (let i = 0; i < messages.length; i++) {
      if (i % 10 === 0 || i === messages.length - 1) {
        console.log(`🔄 Processing LLM message ${i + 1} of ${messages.length}`);
      }
      const msg = messages[i];
      
      if (msg.content.length < this.minContentLength) {
        result.warnings.push(`Message ${i + 1} is very short (${msg.content.length} chars) - consider adding more detail`);
      }

      if (msg.content.length > this.maxMessageLength) {
        result.errors.push(`Message ${i + 1} is too long (${msg.content.length} chars) - max is ${this.maxMessageLength}`);
      }

      // Check for common content issues
      if (msg.content.includes('undefined') || msg.content.includes('null')) {
        result.warnings.push(`Message ${i + 1} contains undefined/null values - this may confuse the LLM`);
      }

      if (msg.content.includes('Error:') || msg.content.includes('Exception:')) {
        result.warnings.push(`Message ${i + 1} contains error messages - consider providing context instead`);
      }
    }

    // Check for system message best practices
    const systemMessages = messages.filter((m: any) => m.role === 'system');
    if (systemMessages.length === 0) {
      result.warnings.push('No system message found - consider adding one to guide the LLM');
    } else if (systemMessages.length > 1) {
      result.warnings.push('Multiple system messages found - consider consolidating into one');
    }

    // Check for user message
    const userMessages = messages.filter((m: any) => m.role === 'user');
    if (userMessages.length === 0) {
      result.errors.push('No user message found - LLM needs a user request to respond to');
    }
  }

  /**
   * Validate performance and cost considerations
   */
  private validatePerformance(input: any, result: InputValidationResult): void {
    const { messages, model } = input;
    
    // Estimate token usage
    const estimatedTokens = this.estimateTokens(messages);
    
    if (estimatedTokens > this.maxTotalTokens) {
      result.errors.push(`Estimated tokens (${estimatedTokens}) exceed limit (${this.maxTotalTokens})`);
    } else if (estimatedTokens > this.maxTotalTokens * 0.8) {
      result.warnings.push(`High token usage (${estimatedTokens}) - consider shortening input`);
    }

    // Check for expensive models
    const expensiveModels = ['gpt-4', 'gpt-4-turbo', 'claude-3'];
    if (expensiveModels.includes(model)) {
      result.warnings.push(`Using expensive model (${model}) - consider gpt-3.5-turbo for cost optimization`);
    }
  }

  /**
   * Validate security and privacy considerations
   */
  private validateSecurity(input: any, result: InputValidationResult): void {
    const { messages, apiKey } = input;
    
    const allContent = messages.map((m: any) => m.content).join(' ');
    
    // Check for sensitive data patterns
    const sensitivePatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9]{32,}\b/g, // API keys, tokens
    ];

    for (let i = 0; i < sensitivePatterns.length; i++) {
      if (i % 10 === 0 || i === sensitivePatterns.length - 1) {
        console.log(`🔄 Processing sensitive pattern ${i + 1} of ${sensitivePatterns.length}`);
      }
      const pattern = sensitivePatterns[i];
      if (!pattern) continue;
      if (pattern.test(allContent)) {
        result.warnings.push('Potential sensitive data detected - review before sending to LLM');
        break;
      }
    }

    // Check for hardcoded credentials
    if (allContent.includes('password') || allContent.includes('secret') || allContent.includes('token')) {
      result.warnings.push('Potential credentials detected - ensure no real secrets are included');
    }
  }

  /**
   * Improve message content for better LLM responses
   */
  private improveMessages(messages: ChatCompletionRequestMessage[], result: InputValidationResult): ChatCompletionRequestMessage[] {
    return messages.map((msg, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing message for improvement ${i + 1} of ${arr.length}`);
      }
      let improvedContent = msg.content;

      // Clean up common issues
      improvedContent = this.cleanupContent(improvedContent);
      
      // Add structure to user messages
      if (msg.role === 'user') {
        improvedContent = this.structureUserMessage(improvedContent);
      }

      // Track changes
      if (improvedContent !== msg.content) {
        result.changes!.push(`Improved message ${i + 1} content`);
      }

      return { ...msg, content: improvedContent };
    });
  }

  /**
   * Clean up common content issues
   */
  private cleanupContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .trim();
  }

  /**
   * Add structure to user messages for better clarity
   */
  private structureUserMessage(content: string): string {
    // If it's already well-structured, don't change it
    if (content.includes('Please') || content.includes('Can you') || content.includes('I need')) {
      return content;
    }

    // Add polite structure if missing
    if (!content.startsWith('Please') && !content.startsWith('Can you') && !content.startsWith('I need')) {
      return `Please ${content.toLowerCase()}`;
    }

    return content;
  }

  /**
   * Optimize system messages for better guidance
   */
  private optimizeSystemMessages(messages: ChatCompletionRequestMessage[], result: InputValidationResult): ChatCompletionRequestMessage[] {
    return messages.map((msg, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing system message for optimization ${i + 1} of ${arr.length}`);
      }
      return msg;
    });
  }

  /**
   * Add missing context information
   */
  private addMissingContext(input: any, result: InputValidationResult): any {
    const { context, purpose } = input;

    if (!context && !purpose) {
      result.changes!.push('Added default context and purpose');
      return {
        ...input,
        context: 'general',
        purpose: 'assistance'
      };
    }

    if (!context) {
      result.changes!.push('Added default context');
      return { ...input, context: 'general' };
    }

    if (!purpose) {
      result.changes!.push('Added default purpose');
      return { ...input, purpose: 'assistance' };
    }

    return input;
  }

  /**
   * Optimize input for specific purposes
   */
  private optimizeForPurpose(input: any, result: InputValidationResult): any {
    const { purpose, messages } = input;

    if (purpose?.includes('code')) {
      // Optimize for code generation
      const systemMessages = messages.filter((m: any) => m.role === 'system');
      if (systemMessages.length > 0) {
        const systemContent = systemMessages[0].content;
        if (!systemContent.includes('code') && !systemContent.includes('programming')) {
          const updatedSystem = {
            ...systemMessages[0],
            content: `${systemContent}\n\nYou are also a programming expert. Provide clean, well-documented code with explanations.`
          };
          result.changes!.push('Enhanced system message for code generation');
          return {
            ...input,
            messages: messages.map((m: any) => m.role === 'system' ? updatedSystem : m)
          };
        }
      }
    }

    if (purpose?.includes('analysis')) {
      // Optimize for analysis
      const systemMessages = messages.filter((m: any) => m.role === 'system');
      if (systemMessages.length > 0) {
        const systemContent = systemMessages[0].content;
        if (!systemContent.includes('analyze') && !systemContent.includes('analysis')) {
          const updatedSystem = {
            ...systemMessages[0],
            content: `${systemContent}\n\nProvide thorough analysis with clear insights and actionable recommendations.`
          };
          result.changes!.push('Enhanced system message for analysis');
          return {
            ...input,
            messages: messages.map((m: any) => m.role === 'system' ? updatedSystem : m)
          };
        }
      }
    }

    return input;
  }

  /**
   * Estimate token usage for messages
   */
  private estimateTokens(messages: ChatCompletionRequestMessage[]): number {
    return messages.reduce((total, msg) => {
      // Rough estimation: 1 token ≈ 4 characters
      return total + Math.ceil(msg.content.length / 4);
    }, 0);
  }
}

/**
 * Convenience function for quick input validation
 */
export function validateLLMInput(input: any): InputValidationResult {
  const validator = new LLMInputValidator();
  return validator.validateInput({ input });
}

/**
 * Convenience function for quick input preprocessing
 */
export function preprocessLLMInput(input: any): InputValidationResult {
  const validator = new LLMInputValidator();
  return validator.preprocessInput({ input });
}

/**
 * Convenience function for content quality analysis
 */
export function analyzeLLMContentQuality(messages: ChatCompletionRequestMessage[]): ContentQualityMetrics {
  const validator = new LLMInputValidator();
  return validator.analyzeContentQuality(messages);
} 