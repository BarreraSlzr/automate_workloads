// Vercel AI SDK integration is not currently supported in this CLI context. For now, only the fetch-based OpenAI integration is provided.

import { promises as fs } from 'fs';
import path from 'path';

// Define a minimal local type for OpenAI chat messages
export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatOptions {
  model: string;
  apiKey: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: any;
}

export interface LLMUsageMetrics {
  timestamp: string;
  model: string;
  provider: 'openai' | 'local' | 'fallback';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  success: boolean;
  error?: string;
  context: string;
  purpose: string;
  valueScore: number; // 0-1 score of how valuable this call was
}

export interface LLMProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  call: (options: OpenAIChatOptions) => Promise<any>;
  estimateTokens: (messages: ChatCompletionRequestMessage[]) => number;
  estimateCost: (tokens: number, model: string) => number;
}

export interface LLMOptimizationConfig {
  maxTokensPerCall: number;
  maxCostPerCall: number;
  minValueScore: number;
  enableLocalLLM: boolean;
  enableCaching: boolean;
  cacheExpiryHours: number;
  retryAttempts: number;
  retryDelayMs: number;
  rateLimitDelayMs: number;
  // New intelligent routing options
  preferLocalLLM: boolean;
  testMode: boolean;
  localLLMPriority: number; // 0-1, higher = prefer local more
  complexityThreshold: number; // 0-1, tasks above this use cloud LLM
  costSensitivity: number; // 0-1, higher = more cost sensitive
  // Memory-only mode for tests
  memoryOnly: boolean;
}

export interface LLMCallIntelligence {
  complexity: number; // 0-1, how complex the task is
  requiresContext: boolean; // Does it need external context?
  isCreative: boolean; // Is it creative vs analytical?
  isTimeSensitive: boolean; // Does it need fast response?
  canUseLocal: boolean; // Can local LLM handle this?
  estimatedQuality: number; // 0-1, expected quality from local vs cloud
  costBenefit: number; // 0-1, cost vs benefit ratio
}

/**
 * Enhanced LLM service with intelligent routing and optimization
 */
export class LLMService {
  private usageLog: LLMUsageMetrics[] = [];
  private usageLogPath: string;
  private config: LLMOptimizationConfig;
  private providers: LLMProvider[] = [];
  private localLLMAvailable: boolean = false;

  constructor(config: Partial<LLMOptimizationConfig> = {}) {
    this.config = {
      maxTokensPerCall: 4000,
      maxCostPerCall: 0.10,
      minValueScore: 0.3,
      enableLocalLLM: true,
      enableCaching: true,
      cacheExpiryHours: 24,
      retryAttempts: 3,
      retryDelayMs: 1000,
      rateLimitDelayMs: 60000,
      // New intelligent routing defaults
      preferLocalLLM: true,
      testMode: process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test',
      localLLMPriority: 0.7, // Prefer local by default
      complexityThreshold: 0.6, // Use cloud for complex tasks
      costSensitivity: 0.8, // High cost sensitivity
      memoryOnly: false,
      ...config
    };
    
    this.usageLogPath = path.join(process.cwd(), '.llm-usage-log.json');
    this.initializeProviders();
    
    // Only load from disk and check local LLM if not in memory-only mode
    if (!this.config.memoryOnly) {
      this.loadUsageLog();
      this.checkLocalLLM();
    }
  }

  /**
   * Check local LLM availability on startup
   */
  private async checkLocalLLM(): Promise<void> {
    if (this.config.enableLocalLLM) {
      this.localLLMAvailable = await this.checkLocalLLMAvailability('ollama');
      if (this.localLLMAvailable) {
        console.log('✅ Local LLM (Ollama) available for cost optimization');
      }
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
    // In test mode, prefer local or fallback
    if (this.config.testMode) {
      console.log('🧪 Test mode detected - using fallback responses');
      return null; // Use fallback
    }
    
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
        isAvailable: async () => this.checkLocalLLMAvailability('ollama'),
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
      const { execSync } = await import('child_process');
      execSync(`${type} --version`, { stdio: 'ignore' });
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
      
      // Track successful usage
      await this.trackUsage({
        timestamp: new Date().toISOString(),
        model: llmOptions.model,
        provider: provider.name as any,
        inputTokens: estimatedTokens,
        outputTokens: this.estimateOutputTokens(result),
        totalTokens: estimatedTokens + this.estimateOutputTokens(result),
        cost: this.estimateCost(estimatedTokens, llmOptions.model),
        duration: Date.now() - startTime,
        success: true,
        context,
        purpose,
        valueScore
      });

      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ ${provider.name} failed:`, error);
      
      // Track failed usage
      await this.trackUsage({
        timestamp: new Date().toISOString(),
        model: llmOptions.model,
        provider: provider.name as any,
        inputTokens: estimatedTokens,
        outputTokens: 0,
        totalTokens: estimatedTokens,
        cost: this.estimateCost(estimatedTokens, llmOptions.model),
        duration: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
        context,
        purpose,
        valueScore
      });

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
      this.usageLog = JSON.parse(data);
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
    const { execSync } = await import('child_process');
    
    const prompt = options.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = execSync(`ollama run ${options.model} "${prompt}"`, { 
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    
    return {
      choices: [{ message: { content: result.trim() } }]
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
      // auto
      this.config.preferLocalLLM = true;
      this.config.complexityThreshold = 0.6;
    }
  }
}

// Backward compatibility - keep the original function
export async function callOpenAIChat({
  model,
  apiKey,
  messages,
  ...options
}: OpenAIChatOptions): Promise<any> {
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