import { LLMService } from './llm';
import { LLMInputValidator, validateLLMInput, preprocessLLMInput, analyzeLLMContentQuality } from '../utils/llmInputValidator';
import { createLLMFossilManagerFactory } from '../utils/llmFossilManagerFactory';
import { createHash } from 'crypto';
import { z } from 'zod';
import type { 
  EnhancedLLMResult,
  InputValidationResult,
  InputPreprocessingResult,
  ContentQualityMetrics,
  EnhancedLLMServiceParams,
  OpenAIChatOptions
} from '../types/llm';
import { OwnerRepoSchema } from '../types/schemas';
import { EnhancedLLMServiceParamsSchema } from '../types/llm';
import { getCurrentRepoOwner, getCurrentRepoName } from '@/utils/cli';

/**
 * Enhanced LLM Service with Error Prevention and Fossilization
 * 
 * This service extends the base LLMService with:
 * 1. Input validation and preprocessing
 * 2. Error prevention before LLM calls
 * 3. Fossilization of validation results for audit
 * 4. Quality metrics tracking
 * 5. Performance optimization
 */
export class EnhancedLLMService {
  private llmService: LLMService;
  private validator: LLMInputValidator;
  private enhancedFossilManager: any;
  private params: EnhancedLLMServiceParams;
  private enhancedSessionId: string;

  constructor(params: Partial<EnhancedLLMServiceParams> = {}) {
    this.llmService = new LLMService({
      owner: getCurrentRepoOwner(),
      repo: getCurrentRepoName(),
    });
    this.params = { ...EnhancedLLMServiceParamsSchema, ...params };
    this.validator = new LLMInputValidator();
    this.enhancedSessionId = `enhanced-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the service with fossil manager
   */
  async initialize(): Promise<void> {
    if (this.params.enableFossilization) {
      this.enhancedFossilManager = await createLLMFossilManagerFactory(this.params.fossilManagerParams);
    }
  }

  /**
   * Enhanced chat completion with error prevention and fossilization
   */
  async chatCompletion(params: {
    model: string;
    apiKey?: string;
    messages: any[];
    temperature?: number;
    max_tokens?: number;
    context?: string;
    purpose?: string;
    valueScore?: number;
  }): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Generate input hash for fossilization
      const inputHash = this.generateInputHash(params);
      
      // Step 1: Validate input
      const validationStart = Date.now();
      const validation = validateLLMInput(params);
      const validationTime = Date.now() - validationStart;
      
      // Fossilize validation result
      if (this.params.enableFossilization && this.enhancedFossilManager) {
        await this.enhancedFossilManager.fossilizeValidation({
          inputHash,
          validation,
          metadata: {
            model: params.model,
            context: params.context,
            purpose: params.purpose,
            valueScore: params.valueScore,
            validationTime,
            totalTime: Date.now() - startTime
          }
        });
      }
      
      // Step 2: Check if input is valid
      if (!validation.isValid) {
        console.error('❌ LLM Input Validation Failed:');
        validation.errors.forEach((error: string) => console.error(`  - ${error}`));
        validation.warnings.forEach((warning: string) => console.warn(`  ⚠️  ${warning}`));
        validation.recommendations.forEach((rec: string) => console.log(`  💡 ${rec}`));
        
        throw new Error(`LLM input validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Step 3: Preprocess input if enabled
      let processedInput = params;
      let preprocessing: any = null;
      
      if (this.params.enablePreprocessing) {
        const preprocessingStart = Date.now();
        preprocessing = preprocessLLMInput(params);
        const preprocessingTime = Date.now() - preprocessingStart;
        
        if (preprocessing.success) {
          processedInput = preprocessing.processedInput;
          console.log('✅ Input preprocessing successful:', preprocessing.changes);
        } else {
          console.warn('⚠️  Input preprocessing failed:', preprocessing.errors);
        }
        
        // Fossilize preprocessing result
        if (this.params.enableFossilization && this.enhancedFossilManager) {
          await this.enhancedFossilManager.fossilizeValidation({
            inputHash: this.generateInputHash(processedInput),
            validation,
            preprocessing,
            metadata: {
              model: params.model,
              context: params.context,
              purpose: params.purpose,
              valueScore: params.valueScore,
              validationTime,
              preprocessingTime,
              totalTime: Date.now() - startTime
            }
          });
        }
      }
      
      // Step 4: Analyze content quality if enabled
      let qualityAnalysis: any = null;
      if (this.params.enableQualityAnalysis) {
        qualityAnalysis = analyzeLLMContentQuality(processedInput.messages);
        console.log('📊 Content Quality Analysis:', {
          readability: qualityAnalysis.readability.toFixed(2),
          clarity: qualityAnalysis.clarity.toFixed(2),
          specificity: qualityAnalysis.specificity.toFixed(2),
          completeness: qualityAnalysis.completeness.toFixed(2),
          overall: qualityAnalysis.overall.toFixed(2)
        });
      }
      
                   // Step 5: Make LLM call
      console.log('🚀 Making LLM call with validated and processed input...');
      const callParams = {
        ...processedInput,
        apiKey: processedInput.apiKey || process.env.OPENAI_API_KEY || ''
      };
      const result = await this.llmService.callLLM(callParams);
      
      // Step 6: Fossilize successful session
      if (this.params.enableFossilization && this.enhancedFossilManager) {
        await this.fossilizeSuccessfulSession({
          inputHash,
          originalInput: params,
          processedInput,
          validation,
          qualityAnalysis,
          preprocessing,
          result,
          totalTime: Date.now() - startTime
        });
      }
      
      console.log('✅ LLM call completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced LLM call failed:', error);
      
      // Fossilize failed session
      if (this.params.enableFossilization && this.enhancedFossilManager) {
        await this.fossilizeFailedSession({
          inputHash: this.generateInputHash(params),
          originalInput: params,
          error: error instanceof Error ? error.message : String(error),
          totalTime: Date.now() - startTime
        });
      }
      
      throw error;
    }
  }

  /**
   * Batch validation of multiple inputs (with progress/logging)
   */
  async validateBatch(inputs: any[]): Promise<{
    valid: any[];
    invalid: any[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      commonIssues: string[];
      recommendations: string[];
    };
  }> {
    const valid: any[] = [];
    const invalid: any[] = [];
    const allIssues: string[] = [];
    const allRecommendations: string[] = [];
    let idx = 0;
    for (const input of inputs) {
      idx++;
      if (idx === 1 || idx === inputs.length || idx % 10 === 0) {
        console.log(`[validateBatch] Progress: ${idx}/${inputs.length}`);
      }
      try {
        const validation = validateLLMInput(input);
        if (validation.isValid) {
          valid.push(input);
        } else {
          invalid.push(input);
          allIssues.push(...validation.errors);
          allRecommendations.push(...validation.recommendations);
        }
      } catch (err) {
        console.error(`[validateBatch] Error validating input at index ${idx - 1}:`, err);
        invalid.push(input);
        allIssues.push('Exception during validation');
      }
    }
    
    // Calculate common issues
    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonIssues = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
    
    return {
      valid,
      invalid,
      summary: {
        total: inputs.length,
        valid: valid.length,
        invalid: invalid.length,
        commonIssues,
        recommendations: [...new Set(allRecommendations)]
      }
    };
  }

  /**
   * Generate quality metrics from fossilized data
   */
  async generateQualityReport(params: {
    analysisPeriod: string;
    commitRefs?: string[];
  }): Promise<any> {
    if (!this.enhancedFossilManager) {
      throw new Error('Fossil manager not initialized');
    }
    
    return await this.enhancedFossilManager.generateQualityMetrics(params);
  }

  /**
   * Export fossilized data for analysis
   */
  async exportFossilizedData(params: {
    format: 'json' | 'yaml' | 'csv';
    outputPath: string;
    filters?: any;
  }): Promise<string> {
    if (!this.enhancedFossilManager) {
      throw new Error('Fossil manager not initialized');
    }
    
    return await this.enhancedFossilManager.exportFossilizedData(params);
  }

  /**
   * Get fossilized insights for analysis
   */
  async getFossilizedInsights(params: {
    commitRef?: string;
    sessionId?: string;
    type?: 'validation' | 'error-prevention' | 'quality-metrics';
    limit?: number;
  }): Promise<any[]> {
    if (!this.enhancedFossilManager) {
      throw new Error('Fossil manager not initialized');
    }
    
    return await this.enhancedFossilManager.getFossilizedInsights(params);
  }



  /**
   * Generate input hash for fossilization
   */
  private generateInputHash(input: any): string {
    const inputString = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(inputString).digest('hex').substring(0, 16);
  }

  /**
   * Fossilize successful session
   */
  private async fossilizeSuccessfulSession(params: {
    inputHash: string;
    originalInput: any;
    processedInput: any;
    validation: any;
    qualityAnalysis?: any;
    preprocessing?: any;
    result: any;
    totalTime: number;
  }): Promise<void> {
    if (!this.enhancedFossilManager) return;
    
    const insights = this.generateInsightsFromSession(params);
    
    await this.enhancedFossilManager.fossilizeErrorPreventionSession({
      sessionId: this.enhancedSessionId,
      inputs: [{
        inputHash: params.inputHash,
        originalInput: params.originalInput,
        processedInput: params.processedInput,
        validation: params.validation,
        qualityAnalysis: params.qualityAnalysis,
        preprocessing: params.preprocessing
      }],
      insights,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        llmProvider: 'enhanced',
        validationMode: this.params.enableValidation ? 'enabled' : 'disabled',
        preprocessingMode: this.params.enablePreprocessing ? 'enabled' : 'disabled',
        totalSessionTime: params.totalTime
      }
    });
  }

  /**
   * Fossilize failed session
   */
  private async fossilizeFailedSession(params: {
    inputHash: string;
    originalInput: any;
    error: string;
    totalTime: number;
  }): Promise<void> {
    if (!this.enhancedFossilManager) return;
    
    const insights = [{
      category: 'structure' as const,
      severity: 'high' as const,
      description: `LLM call failed: ${params.error}`,
      recommendation: 'Review input validation and preprocessing',
      impact: 'Failed LLM call prevented'
    }];
    
    await this.enhancedFossilManager.fossilizeErrorPreventionSession({
      sessionId: this.enhancedSessionId,
      inputs: [{
        inputHash: params.inputHash,
        originalInput: params.originalInput,
        validation: {
          isValid: false,
          errors: [params.error],
          warnings: [],
          recommendations: ['Review input structure and content']
        }
      }],
      insights,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        llmProvider: 'enhanced',
        validationMode: this.params.enableValidation ? 'enabled' : 'disabled',
        preprocessingMode: this.params.enablePreprocessing ? 'enabled' : 'disabled',
        totalSessionTime: params.totalTime
      }
    });
  }

  /**
   * Generate insights from session data
   */
  private generateInsightsFromSession(params: any): any[] {
    const insights = [];
    
    // Quality insights
    if (params.qualityAnalysis) {
      if (params.qualityAnalysis.overall < 0.6) {
        insights.push({
          category: 'quality' as const,
          severity: 'medium' as const,
          description: 'Input quality is below optimal threshold',
          recommendation: 'Improve input clarity and specificity',
          impact: 'May affect LLM response quality'
        });
      }
    }
    
    // Preprocessing insights
    if (params.preprocessing?.success && params.preprocessing.changes.length > 0) {
      insights.push({
        category: 'performance' as const,
        severity: 'low' as const,
        description: 'Input was improved through preprocessing',
        recommendation: 'Consider applying similar improvements manually',
        impact: 'Improved input quality and response accuracy'
      });
    }
    
    // Validation insights
    if (params.validation.warnings.length > 0) {
      insights.push({
        category: 'structure' as const,
        severity: 'low' as const,
        description: 'Input had warnings but was still valid',
        recommendation: 'Address warnings to improve input quality',
        impact: 'Minor improvements possible'
      });
    }
    
    return insights;
  }
}

// Convenience function for creating enhanced LLM service
export async function createEnhancedLLMService(params: Partial<EnhancedLLMServiceParams> = {}): Promise<EnhancedLLMService> {
  const service = new EnhancedLLMService(params);
  await service.initialize();
  return service;
}

/**
 * Convenience function for quick enhanced LLM calls
 */
export async function callLLMEnhanced(
  input: OpenAIChatOptions & { 
    context?: string; 
    purpose?: string;
    valueScore?: number;
    routingPreference?: 'auto' | 'local' | 'cloud';
  },
  options: Partial<EnhancedLLMServiceParams> & { owner: string; repo: string } // require owner/repo
): Promise<EnhancedLLMResult> {
  OwnerRepoSchema.parse(options);
  const defaultParams: Partial<EnhancedLLMServiceParams> = {
    enableValidation: true,
    enablePreprocessing: true,
    enableFossilization: true,
    enableQualityAnalysis: true,
    fossilManagerParams: {
      owner: options.owner,
      repo: options.repo,
      fossilStoragePath: 'fossils/llm_insights/',
      enableAutoFossilization: true,
      enableQualityMetrics: true,
      enableValidationTracking: true
    }
  };
  const service = new EnhancedLLMService({ ...defaultParams, ...options });
  await service.initialize();
  return service.chatCompletion(input);
}

/**
 * Convenience function for input analysis only
 */
export function analyzeLLMInput(
  input: any,
  options: Partial<EnhancedLLMServiceParams> & { owner: string; repo: string }
): {
  validation: InputValidationResult;
  preprocessing: InputPreprocessingResult;
  quality: ContentQualityMetrics;
  recommendations: string[];
  summary: string;
} {
  OwnerRepoSchema.parse(options);
  const defaultParams: Partial<EnhancedLLMServiceParams> = {
    enableValidation: true,
    enablePreprocessing: true,
    enableFossilization: true,
    enableQualityAnalysis: true,
    fossilManagerParams: {
      owner: options.owner,
      repo: options.repo,
      fossilStoragePath: 'fossils/llm_insights/',
      enableAutoFossilization: true,
      enableQualityMetrics: true,
      enableValidationTracking: true
    }
  };
  const service = new EnhancedLLMService({ ...defaultParams, ...options });
  const validator = new LLMInputValidator();
  
  const validation = validateLLMInput(input);
  const preprocessing = preprocessLLMInput(input);
  const quality = analyzeLLMContentQuality(input.messages || []);
  const recommendations = validator.generateRecommendations(input.messages || [], quality);
  
  return {
    validation,
    preprocessing,
    quality,
    recommendations,
    summary: `Input analysis complete. Valid: ${validation.isValid}, Quality: ${(quality.overall * 100).toFixed(1)}%`
  };
} 