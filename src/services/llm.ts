// Vercel AI SDK integration is not currently supported in this CLI context. For now, only the fetch-based OpenAI integration is provided.

import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { 
  OpenAIChatOptions, 
  LLMProvider, 
  ChatCompletionRequestMessage,
  LLMUsageMetrics,
  LLMOptimizationConfig,
  LLMCallIntelligence,
  CallOpenAIChatParams
} from '../types/llm';
import { safeParseJSON, executeCommand, executeCommandJSON, getCurrentRepoName } from '../utils/cli';

// Re-export types for external use
export type {
  OpenAIChatOptions,
  LLMProvider,
  ChatCompletionRequestMessage,
  LLMUsageMetrics,
  LLMOptimizationConfig,
  LLMCallIntelligence,
  CallOpenAIChatParams
} from '../types/llm';

/**
 * Enhanced LLM service with intelligent routing and optimization
 */
export class LLMService {
  private usageLog: LLMUsageMetrics[] = [];
  private usageLogPath: string;
  private config: LLMOptimizationConfig;
  private providers: LLMProvider[] = [];
  private localLLMAvailable: boolean = false;
  private fossilManager: any = null; // Will be set if fossilization is enabled
  private sessionId: string;

  constructor(config: Partial<LLMOptimizationConfig> = {}) {
    this.config = {
      maxTokensPerCall: 4000,
      maxCostPerCall: 0.10,
      minValueScore: 0.3,
      enableLocalLLM: false,
      enableCaching: true,
      cacheExpiryHours: 24,
      retryAttempts: 3,
      retryDelayMs: 1000,
      rateLimitDelayMs: 60000,
      // New intelligent routing defaults
      preferLocalLLM: false,
      testMode: false, // Disable test mode to ensure real LLM calls are fossilized
      localLLMPriority: 0.0, // Never prefer local by default
      complexityThreshold: 0.6, // Use cloud for complex tasks
      costSensitivity: 0.8, // High cost sensitivity
      memoryOnly: false,
      // New comprehensive tracing defaults
      enableComprehensiveTracing: true,
      enableFossilization: true,
      enableConsoleOutput: true,
      enableSnapshotExport: true,
      fossilStoragePath: 'fossils/llm_insights/',
      ...config
    };
    
    this.usageLogPath = path.join(process.cwd(), '.llm-usage-log.json');
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initializeProviders();
    
    // Only load from disk and check local LLM if not in memory-only mode
    if (!this.config.memoryOnly) {
      this.loadUsageLog();
      this.checkLocalLLM();
      this.initializeFossilization();
    }

    // Handle graceful shutdown on q^C (SIGINT) and SIGTERM
    this.setupGracefulShutdown();
  }

  /**
   * Initialize fossilization if enabled
   */
  private async initializeFossilization(): Promise<void> {
    if (this.config.enableFossilization && this.config.fossilStoragePath) {
      try {
        // Dynamically import to avoid circular dependencies
        const { createLLMFossilManager } = await import('../utils/llmFossilManager');
        this.fossilManager = await createLLMFossilManager({
          owner: 'automate-workloads',
          repo: getCurrentRepoName(),
          fossilStoragePath: this.config.fossilStoragePath,
          enableAutoFossilization: true,
          enableQualityMetrics: true,
          enableValidationTracking: true
        });
        
        if (this.config.enableConsoleOutput) {
          console.log('🦴 LLM fossilization initialized for comprehensive tracing');
        }
      } catch (error) {
        console.warn('⚠️ Failed to initialize LLM fossilization:', error);
      }
    }
  }

  /**
   * Generate unique call ID for tracing
   */
  private generateCallId(): string {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate input hash for deduplication and tracing
   */
  private generateInputHash(input: any): string {
    const inputString = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(inputString).digest('hex').substring(0, 16);
  }

  /**
   * Get current git commit reference for tracing
   */
  private async getCurrentCommitRef(): Promise<string> {
    try {
      const result = executeCommandJSON<string>('git rev-parse HEAD');
      return result.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Sanitize input for fossilization (remove sensitive data like API keys)
   */
  private sanitizeInputForFossilization(input: any): any {
    if (!input) return input;
    
    const sanitized = { ...input };
    
    // Remove API keys and sensitive fields
    if (sanitized.apiKey) {
      sanitized.apiKey = '[REDACTED]';
    }
    if (sanitized.openaiApiKey) {
      sanitized.openaiApiKey = '[REDACTED]';
    }
    if (sanitized.anthropicApiKey) {
      sanitized.anthropicApiKey = '[REDACTED]';
    }
    if (sanitized.api_key) {
      sanitized.api_key = '[REDACTED]';
    }
    
    // Remove any other potential sensitive fields
    const sensitiveFields = ['token', 'secret', 'password', 'key', 'auth'];
    for (const field of sensitiveFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Fossilize LLM call for comprehensive tracing
   */
  private async fossilizeLLMCall(params: {
    callId: string;
    inputHash: string;
    originalInput: any;
    result: any;
    error?: string;
    metrics: LLMUsageMetrics;
    validation?: any;
    preprocessing?: any;
    qualityAnalysis?: any;
    insights?: any[];
  }): Promise<void> {
    if (!this.fossilManager || !this.config.enableFossilization) {
      return;
    }

    try {
      const commitRef = await this.getCurrentCommitRef();
      
      // Create comprehensive fossil
      const fossil = {
        type: 'llm-validation',
        timestamp: new Date().toISOString(),
        commitRef,
        inputHash: params.inputHash,
        callId: params.callId,
        sessionId: this.sessionId,
        validation: {
          isValid: !params.error,
          errors: params.error ? [params.error] : [],
          warnings: [],
          recommendations: [],
          qualityScore: params.metrics.valueScore,
          securityIssues: [],
          performanceIssues: []
        },
        preprocessing: params.preprocessing ? {
          success: true,
          changes: params.preprocessing.changes || [],
          improvements: params.preprocessing.improvements || []
        } : undefined,
        metadata: {
          model: params.metrics.model,
          context: params.metrics.context,
          purpose: params.metrics.purpose,
          valueScore: params.metrics.valueScore,
          validationTime: 0,
          preprocessingTime: 0,
          totalTime: params.metrics.duration,
          provider: params.metrics.provider,
          inputTokens: params.metrics.inputTokens,
          outputTokens: params.metrics.outputTokens,
          totalTokens: params.metrics.totalTokens,
          cost: params.metrics.cost
        },
        fossilId: `llm-validation-${Date.now()}-${params.callId}`,
        status: params.error ? 'rejected' : 'approved',
        tags: ['llm', 'validation', 'traceable']
      };

      // Store fossil
      await this.fossilManager.fossilizeValidation({
        inputHash: params.inputHash,
        validation: fossil.validation,
        preprocessing: fossil.preprocessing,
        metadata: fossil.metadata
      });

      // Update metrics with fossil reference
      params.metrics.fossilId = fossil.fossilId;

      // Console output for traceability
      if (this.config.enableConsoleOutput) {
        console.log(`🦴 Fossilized LLM call: ${fossil.fossilId}`);
        console.log(`   📊 Model: ${fossil.metadata.model}, Provider: ${fossil.metadata.provider}`);
        console.log(`   💰 Cost: $${fossil.metadata.cost.toFixed(4)}, Tokens: ${fossil.metadata.totalTokens}`);
        console.log(`   🎯 Purpose: ${fossil.metadata.purpose}, Context: ${fossil.metadata.context}`);
        console.log(`   ⏱️ Duration: ${fossil.metadata.totalTime}ms`);
        if (params.error) {
          console.log(`   ❌ Error: ${params.error}`);
        } else {
          console.log(`   ✅ Success: ${fossil.validation.isValid ? 'Valid' : 'Invalid'}`);
        }
      }

    } catch (error) {
      console.warn('⚠️ Failed to fossilize LLM call:', error);
    }
  }

  /**
   * Export snapshot of recent LLM calls
   */
  private async exportSnapshot(): Promise<void> {
    if (!this.config.enableSnapshotExport || this.usageLog.length === 0) {
      return;
    }

    try {
      const { LLMSnapshotExporter } = await import('../utils/llmSnapshotExporter');
      const exporter = new LLMSnapshotExporter();
      
      const result = await exporter.exportSnapshot({
        format: 'yaml',
        includeMetadata: true,
        includeTimestamps: true,
        includeValidation: true,
        includePreprocessing: true,
        filters: {
          dateRange: {
            start: new Date(Date.now() - 60000).toISOString(), // Last minute
            end: new Date().toISOString()
          }
        }
      });

      if (this.config.enableConsoleOutput) {
        console.log(`📸 LLM snapshot exported: ${result.outputPath}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to export LLM snapshot:', error);
    }
  }

  /**
   * Setup graceful shutdown handlers for q^C and SIGTERM
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      // Save current usage log (already done in trackUsage, but ensure it's saved)
      if (!this.config.memoryOnly) {
        try {
          await fs.writeFile(this.usageLogPath, JSON.stringify(this.usageLog, null, 2));
        } catch (error) {
          console.warn('Failed to save usage log during shutdown:', error);
        }
      }
      
      // Export final snapshot if enabled
      if (this.config.enableSnapshotExport && this.usageLog.length > 0) {
        try {
          await this.exportSnapshot();
        } catch (error) {
          console.warn('Failed to export final snapshot during shutdown:', error);
        }
      }
      
      // Log final analytics
      const analytics = this.getUsageAnalytics();
      if (analytics.totalCalls > 0) {
        console.log(`📊 Final LLM Usage: ${analytics.totalCalls} calls, ${analytics.successRate * 100}% success rate`);
        console.log(`🦴 Total fossils created: ${this.usageLog.filter(m => m.fossilId).length}`);
      }
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT (Ctrl+C)'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  /**
   * Check local LLM availability on startup
   */
  private async checkLocalLLM(): Promise<void> {
    if (this.config.enableLocalLLM) {
      // Temporarily disable local LLM check to avoid recursive call issue
      this.localLLMAvailable = false;
      // this.localLLMAvailable = await this.checkLocalLLMAvailability('ollama');
      // if (this.localLLMAvailable) {
      //   console.log('✅ Local LLM (Ollama) available for cost optimization');
      // }
    }
  }

  /**
   * Analyze LLM call intelligence to determine best provider
   */
  private analyzeCallIntelligence(options: OpenAIChatOptions & { 
    context?: string; 
    purpose?: string;
    valueScore?: number;
  }): LLMCallIntelligence {
    const { context = 'unknown', purpose = 'general', valueScore = 0.5, messages } = options;
    
    // Analyze message complexity
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const avgLength = totalLength / messages.length;
    const complexity = Math.min(1.0, avgLength / 1000); // Normalize to 0-1
    
    // Determine if task requires external context
    const requiresContext = context !== 'test' && 
                           (purpose.includes('analysis') || 
                            purpose.includes('insights') || 
                            purpose.includes('recommendations'));
    
    // Determine if task is creative vs analytical
    const isCreative = purpose.includes('generation') || 
                      purpose.includes('creation') || 
                      purpose.includes('writing');
    
    // Determine time sensitivity
    const isTimeSensitive = purpose.includes('real-time') || 
                           purpose.includes('urgent') || 
                           context === 'production';
    
    // Determine if local LLM can handle this
    const canUseLocal = !requiresContext && 
                       !isTimeSensitive && 
                       complexity < this.config.complexityThreshold &&
                       this.localLLMAvailable;
    
    // Estimate quality difference between local and cloud
    const estimatedQuality = canUseLocal ? 0.8 : 0.95; // Local is 80% as good for suitable tasks
    
    // Calculate cost-benefit ratio
    const costBenefit = canUseLocal ? 0.9 : 0.6; // Local has better cost-benefit
    
    return {
      complexity,
      requiresContext,
      isCreative,
      isTimeSensitive,
      canUseLocal,
      estimatedQuality,
      costBenefit
    };
  }

  /**
   * Select best provider based on intelligence analysis
   */
  private async selectProvider(intelligence: LLMCallIntelligence): Promise<LLMProvider | null> {
    // If local LLM can handle this and we prefer it
    if (intelligence.canUseLocal && this.config.preferLocalLLM) {
      const localProvider = this.providers.find(p => p.name === 'local-ollama');
      if (localProvider && await localProvider.isAvailable()) {
        console.log('🏠 Using local LLM for cost optimization');
        return localProvider;
      }
    }
    
    // For complex tasks or when local isn't suitable, use cloud
    if (!intelligence.canUseLocal || intelligence.complexity > this.config.complexityThreshold) {
      const cloudProvider = this.providers.find(p => p.name === 'openai');
      if (cloudProvider && await cloudProvider.isAvailable()) {
        console.log('☁️ Using cloud LLM for complex task');
        return cloudProvider;
      }
    }
    
    // Fallback to any available provider
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        console.log(`🔧 Using ${provider.name} as fallback`);
        return provider;
      }
    }
    
    return null; // No providers available
  }

  /**
   * Initialize available LLM providers
   */
  private initializeProviders(): void {
    // OpenAI provider
    this.providers.push({
      name: 'openai',
      isAvailable: async () => !!process.env.OPENAI_API_KEY,
      call: this.callOpenAIChat.bind(this),
      estimateTokens: this.estimateOpenAITokens.bind(this),
      estimateCost: this.estimateOpenAICost.bind(this)
    });

    // Local LLM providers (if available)
    if (this.config.enableLocalLLM) {
      this.providers.push({
        name: 'local-ollama',
        isAvailable: async () => this.localLLMAvailable, // Use cached result instead of recursive call
        call: this.callLocalOllama.bind(this),
        estimateTokens: this.estimateLocalTokens.bind(this),
        estimateCost: () => 0 // Local LLMs are free
      });
    }
  }

  /**
   * Check if local LLM is available
   */
  private async checkLocalLLMAvailability(type: string): Promise<boolean> {
    try {
      executeCommand(`${type} --version`, { throwOnError: false });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Main LLM call method with optimization and tracking
   */
  async callLLM(options: OpenAIChatOptions & { 
    context?: string; 
    purpose?: string;
    valueScore?: number;
    routingPreference?: 'auto' | 'local' | 'cloud';
  }): Promise<any> {
    const startTime = Date.now();
    const { context = 'unknown', purpose = 'general', valueScore = 0.5, routingPreference = 'auto', ...llmOptions } = options;

    // Generate unique identifiers for comprehensive tracing
    const callId = this.generateCallId();
    const inputHash = this.generateInputHash(options);
    
    // Console output for traceability
    if (this.config.enableConsoleOutput) {
      console.log(`🚀 LLM Call [${callId}]: ${purpose} (${context})`);
      console.log(`   📝 Model: ${llmOptions.model}, Value Score: ${valueScore}`);
    }

    // Apply routing preference if provided
    this.setRoutingPreference(routingPreference);

    // Pre-flight checks
    const estimatedTokens = this.estimateTokens(llmOptions.messages);
    const estimatedCost = this.estimateCost(estimatedTokens, llmOptions.model);

    // Value assessment
    if (valueScore < this.config.minValueScore) {
      console.warn(`⚠️ Skipping LLM call - low value score (${valueScore}) for: ${purpose}`);
      return this.getFallbackResponse(purpose);
    }

    // Intelligent routing
    const intelligence = this.analyzeCallIntelligence({ ...options, context, purpose, valueScore });
    const provider = await this.selectProvider(intelligence);
    if (!provider) {
      return this.getFallbackResponse(purpose);
    }

    // Cost check
    if (estimatedCost > this.config.maxCostPerCall) {
      console.warn(`⚠️ Skipping LLM call - estimated cost $${estimatedCost.toFixed(4)} exceeds limit $${this.config.maxCostPerCall}`);
      return this.getFallbackResponse(purpose);
    }

    // Token limit check
    if (estimatedTokens > this.config.maxTokensPerCall) {
      console.warn(`⚠️ Truncating messages - ${estimatedTokens} tokens exceeds limit ${this.config.maxTokensPerCall}`);
      llmOptions.messages = this.truncateMessages(llmOptions.messages, this.config.maxTokensPerCall);
    }

    // Try selected provider
    let lastError: Error | null = null;
    
    try {
      console.log(`🤖 Using ${provider.name} for: ${purpose}`);
      
      const result = await this.callWithRetry(() => provider.call(llmOptions));
      
      // Calculate actual metrics
      const duration = Date.now() - startTime;
      const actualTokens = this.estimateTokens(llmOptions.messages);
      const outputTokens = this.estimateOutputTokens(result);
      const totalTokens = actualTokens + outputTokens;
      const actualCost = this.estimateCost(totalTokens, llmOptions.model);
      
      // Create comprehensive metrics for tracing
      const metrics: LLMUsageMetrics = {
        timestamp: new Date().toISOString(),
        model: llmOptions.model,
        provider: provider.name as any,
        inputTokens: actualTokens,
        outputTokens,
        totalTokens,
        cost: actualCost,
        duration,
        success: true,
        context,
        purpose,
        valueScore,
        callId,
        inputHash,
        sessionId: this.sessionId,
        traceData: {
          validation: { isValid: true, errors: [], warnings: [] },
          preprocessing: { success: true, changes: [], improvements: [] },
          qualityAnalysis: { overall: valueScore, clarity: 0.8, specificity: 0.7, completeness: 0.9 },
          insights: []
        }
      };
      
      // Track usage
      await this.trackUsage(metrics);
      
      // Fossilize successful call
      await this.fossilizeLLMCall({
        callId,
        inputHash,
        originalInput: this.sanitizeInputForFossilization(options),
        result,
        metrics,
        validation: metrics.traceData?.validation,
        preprocessing: metrics.traceData?.preprocessing,
        qualityAnalysis: metrics.traceData?.qualityAnalysis,
        insights: metrics.traceData?.insights
      });
      
      // Console output for successful completion
      if (this.config.enableConsoleOutput) {
        console.log(`✅ LLM Call [${callId}] completed successfully`);
        console.log(`   📊 Tokens: ${totalTokens}, Cost: $${actualCost.toFixed(4)}, Duration: ${duration}ms`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ ${provider.name} failed:`, error);
      
      const duration = Date.now() - startTime;
      const actualTokens = this.estimateTokens(llmOptions.messages);
      const actualCost = this.estimateCost(actualTokens, llmOptions.model);
      
      // Create comprehensive metrics for failed call
      const metrics: LLMUsageMetrics = {
        timestamp: new Date().toISOString(),
        model: llmOptions.model,
        provider: provider.name as any,
        inputTokens: actualTokens,
        outputTokens: 0,
        totalTokens: actualTokens,
        cost: actualCost,
        duration,
        success: false,
        error: (error as Error).message,
        context,
        purpose,
        valueScore,
        callId,
        inputHash,
        sessionId: this.sessionId,
        traceData: {
          validation: { isValid: false, errors: [(error as Error).message], warnings: [] },
          preprocessing: { success: false, changes: [], improvements: [] },
          qualityAnalysis: { overall: 0, clarity: 0, specificity: 0, completeness: 0 },
          insights: []
        }
      };
      
      // Track failed usage
      await this.trackUsage(metrics);
      
      // Fossilize failed call
      await this.fossilizeLLMCall({
        callId,
        inputHash,
        originalInput: this.sanitizeInputForFossilization(options),
        result: null,
        error: (error as Error).message,
        metrics,
        validation: metrics.traceData?.validation,
        preprocessing: metrics.traceData?.preprocessing,
        qualityAnalysis: metrics.traceData?.qualityAnalysis,
        insights: metrics.traceData?.insights
      });
      
      // Console output for failed completion
      if (this.config.enableConsoleOutput) {
        console.log(`❌ LLM Call [${callId}] failed`);
        console.log(`   💥 Error: ${(error as Error).message}`);
        console.log(`   📊 Tokens: ${actualTokens}, Cost: $${actualCost.toFixed(4)}, Duration: ${duration}ms`);
      }

      // If it's a rate limit, wait before trying next provider
      if (this.isRateLimitError(error)) {
        console.log(`⏳ Rate limit hit, waiting ${this.config.rateLimitDelayMs}ms...`);
        await this.delay(this.config.rateLimitDelayMs);
      }

      return this.getFallbackResponse(purpose);
    }
  }

  /**
   * Call with retry logic
   */
  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`🔄 Retry ${attempt}/${this.config.retryAttempts} in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if error is a rate limit
   */
  private isRateLimitError(error: any): boolean {
    return error?.message?.includes('429') || 
           error?.message?.includes('rate limit') ||
           error?.message?.includes('too many requests');
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate tokens for messages
   */
  private estimateTokens(messages: ChatCompletionRequestMessage[]): number {
    return messages.reduce((total, msg) => {
      // Rough estimation: 1 token ≈ 4 characters
      return total + Math.ceil(msg.content.length / 4);
    }, 0);
  }

  /**
   * Estimate output tokens from response
   */
  private estimateOutputTokens(response: any): number {
    const content = response?.choices?.[0]?.message?.content || '';
    return Math.ceil(content.length / 4);
  }

  /**
   * Estimate cost for tokens
   */
  private estimateCost(tokens: number, model: string): number {
    // OpenAI pricing (approximate)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };
    
    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    if (!modelPricing) return 0;
    return (tokens * modelPricing.input) / 1000;
  }

  /**
   * Truncate messages to fit token limit
   */
  private truncateMessages(messages: ChatCompletionRequestMessage[], maxTokens: number): ChatCompletionRequestMessage[] {
    const truncated: ChatCompletionRequestMessage[] = [];
    let currentTokens = 0;
    
    // Keep system messages and truncate from the end
    for (const message of messages) {
      const messageTokens = Math.ceil(message.content.length / 4);
      
      if (message.role === 'system' || currentTokens + messageTokens <= maxTokens) {
        truncated.push(message);
        currentTokens += messageTokens;
      } else {
        // Truncate this message
        const remainingTokens = maxTokens - currentTokens;
        const maxChars = remainingTokens * 4;
        truncated.push({
          ...message,
          content: message.content.slice(0, maxChars) + '...'
        });
        break;
      }
    }
    
    return truncated;
  }

  /**
   * Get fallback response when LLM is unavailable
   */
  private getFallbackResponse(purpose: string): any {
    const fallbacks: Record<string, any> = {
      'semantic-tagging': {
        choices: [{ message: { content: '{"semanticCategory":"general","confidence":0.5,"concepts":[],"sentiment":"neutral","priority":"low","impact":"low","stakeholders":[]}' } }]
      },
      'excerpt-generation': {
        choices: [{ message: { content: 'Content summary unavailable.' } }]
      },
      'goal-decomposition': {
        choices: [{ message: { content: 'Unable to decompose goal. Please provide manual task breakdown.' } }]
      },
      'content-generation': {
        choices: [{ message: { content: 'Content generation unavailable. Please write manually.' } }]
      }
    };
    
    return fallbacks[purpose] || fallbacks['general'] || {
      choices: [{ message: { content: 'LLM service unavailable.' } }]
    };
  }

  /**
   * Track LLM usage for analytics and reporting
   */
  private async trackUsage(metrics: LLMUsageMetrics): Promise<void> {
    this.usageLog.push(metrics);
    
    // Only persist to disk if not in memory-only mode
    if (!this.config.memoryOnly) {
      try {
        await fs.writeFile(this.usageLogPath, JSON.stringify(this.usageLog, null, 2));
      } catch (error) {
        console.warn('Failed to save usage log:', error);
      }
    }
  }

  /**
   * Load usage log from file
   */
  private async loadUsageLog(): Promise<void> {
    try {
      const data = await fs.readFile(this.usageLogPath, 'utf-8');
      this.usageLog = safeParseJSON(data, 'usageLog');
    } catch {
      this.usageLog = [];
    }
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(): {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
    averageValueScore: number;
    topPurposes: Array<{ purpose: string; calls: number; cost: number }>;
    providerBreakdown: Array<{ provider: string; calls: number; cost: number }>;
    costByDay: Array<{ date: string; cost: number; calls: number }>;
  } {
    const totalCalls = this.usageLog.length;
    const totalTokens = this.usageLog.reduce((sum, log) => sum + log.totalTokens, 0);
    const totalCost = this.usageLog.reduce((sum, log) => sum + log.cost, 0);
    const successRate = totalCalls > 0 ? this.usageLog.filter(log => log.success).length / totalCalls : 0;
    const averageValueScore = totalCalls > 0 ? this.usageLog.reduce((sum, log) => sum + log.valueScore, 0) / totalCalls : 0;

    // Top purposes
    const purposeStats = new Map<string, { calls: number; cost: number }>();
    this.usageLog.forEach(log => {
      const current = purposeStats.get(log.purpose) || { calls: 0, cost: 0 };
      purposeStats.set(log.purpose, {
        calls: current.calls + 1,
        cost: current.cost + log.cost
      });
    });

    // Provider breakdown
    const providerStats = new Map<string, { calls: number; cost: number }>();
    this.usageLog.forEach(log => {
      const current = providerStats.get(log.provider) || { calls: 0, cost: 0 };
      providerStats.set(log.provider, {
        calls: current.calls + 1,
        cost: current.cost + log.cost
      });
    });

    // Cost by day
    const dailyStats = new Map<string, { cost: number; calls: number }>();
    this.usageLog.forEach(log => {
      const date = log.timestamp?.split('T')[0] ?? '';
      const current = dailyStats.get(date) || { cost: 0, calls: 0 };
      dailyStats.set(date, {
        cost: current.cost + log.cost,
        calls: current.calls + 1
      });
    });

    return {
      totalCalls,
      totalTokens,
      totalCost,
      successRate,
      averageValueScore,
      topPurposes: Array.from(purposeStats.entries())
        .map(([purpose, stats]) => ({ purpose, ...stats }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10),
      providerBreakdown: Array.from(providerStats.entries())
        .map(([provider, stats]) => ({ provider, ...stats })),
      costByDay: Array.from(dailyStats.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  /**
   * Generate usage report
   */
  generateUsageReport(): string {
    const analytics = this.getUsageAnalytics();
    
    return `
📊 LLM Usage Report
===================

💰 Cost Summary:
- Total Cost: $${analytics.totalCost.toFixed(4)}
- Total Calls: ${analytics.totalCalls}
- Total Tokens: ${analytics.totalTokens.toLocaleString()}
- Success Rate: ${(analytics.successRate * 100).toFixed(1)}%
- Average Value Score: ${(analytics.averageValueScore * 100).toFixed(1)}%

🏆 Top Purposes (by cost):
${analytics.topPurposes.map(p => `- ${p.purpose}: $${p.cost.toFixed(4)} (${p.calls} calls)`).join('\n')}

🔧 Provider Breakdown:
${analytics.providerBreakdown.map(p => `- ${p.provider}: $${p.cost.toFixed(4)} (${p.calls} calls)`).join('\n')}

📈 Daily Cost Trend:
${analytics.costByDay.map(d => `- ${d.date}: $${d.cost.toFixed(4)} (${d.calls} calls)`).join('\n')}

💡 Recommendations:
${this.generateRecommendations(analytics)}
`;
  }

  /**
   * Generate recommendations based on usage
   */
  private generateRecommendations(analytics: any): string {
    const recommendations = [];
    
    if (analytics.averageValueScore < 0.5) {
      recommendations.push('- Consider increasing minValueScore to avoid low-value calls');
    }
    
    if (analytics.totalCost > 10) {
      recommendations.push('- High cost detected - consider using local LLM alternatives');
    }
    
    if (analytics.successRate < 0.9) {
      recommendations.push('- Low success rate - check API keys and rate limits');
    }
    
    const expensivePurposes = analytics.topPurposes.filter((p: any) => p.cost > 1);
    if (expensivePurposes.length > 0) {
      recommendations.push(`- Expensive purposes: ${expensivePurposes.map((p: any) => p.purpose).join(', ')}`);
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- Usage looks good!';
  }

  // Provider-specific implementations
  private async callOpenAIChat(options: OpenAIChatOptions): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }

  private async callLocalOllama(options: OpenAIChatOptions): Promise<any> {
    const prompt = options.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = executeCommand(`ollama run ${options.model} "${prompt}"`, { 
      timeout: 60000 // 60 second timeout for LLM calls
    });
    
    return {
      choices: [{ message: { content: result.stdout.trim() } }]
    };
  }

  private estimateOpenAITokens(messages: ChatCompletionRequestMessage[]): number {
    return this.estimateTokens(messages);
  }

  private estimateLocalTokens(messages: ChatCompletionRequestMessage[]): number {
    return this.estimateTokens(messages);
  }

  private estimateOpenAICost(tokens: number, model: string): number {
    return this.estimateCost(tokens, model);
  }

  /**
   * Register a new local LLM backend (e.g., vLLM, llama.cpp)
   * Roadmap reference: Scaffold LocalLLMService abstraction (Ollama-first, extensible)
   */
  public registerLocalBackend(name: string, callFn: (options: OpenAIChatOptions) => Promise<any>, isAvailableFn?: () => Promise<boolean>) {
    this.providers.push({
      name,
      isAvailable: isAvailableFn || (async () => true),
      call: callFn,
      estimateTokens: this.estimateLocalTokens.bind(this),
      estimateCost: () => 0
    });
  }

  /**
   * Set routing preference: 'auto' (default), 'local', or 'cloud'.
   */
  public setRoutingPreference(pref: 'auto' | 'local' | 'cloud') {
    if (pref === 'local') {
      this.config.preferLocalLLM = true;
      this.config.complexityThreshold = 1.0; // Always use local if available
    } else if (pref === 'cloud') {
      this.config.preferLocalLLM = false;
      this.config.complexityThreshold = 0.0; // Always use cloud
    } else {
      // auto (now prefer cloud by default)
      this.config.preferLocalLLM = false;
      this.config.complexityThreshold = 0.6;
    }
  }
}

// Backward compatibility - keep the original function
export async function callOpenAIChat(params: CallOpenAIChatParams): Promise<any> {
  const { model, apiKey, messages, ...options } = params;
  const llmService = new LLMService();
  return llmService.callLLM({
    model,
    apiKey,
    messages,
    ...options,
    context: 'legacy-call',
    purpose: 'general'
  });
} 