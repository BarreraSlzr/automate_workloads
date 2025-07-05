import { LLMService } from './llm';
import type { ContextEntry } from '../types';
import type { LLMOptimizationConfig } from './llm';

/**
 * Semantic tagging service for intelligent fossil tagging
 */
export class SemanticTaggerService {
  private model: string;
  private apiKey: string;
  private llmService: LLMService;
  private llmOptions: Partial<LLMOptimizationConfig> & { localBackend?: string; routingPreference?: 'auto' | 'local' | 'cloud' };

  /**
   * @param params Configuration parameters
   * @param params.model LLM model name (default: 'gpt-4')
   * @param params.apiKey API key (default: process.env.OPENAI_API_KEY)
   * @param params.llmOptions LLM options: enableLocalLLM, localBackend, routingPreference, etc.
   */
  constructor(params: { model?: string; apiKey?: string; llmOptions?: Partial<LLMOptimizationConfig> & { localBackend?: string; routingPreference?: 'auto' | 'local' | 'cloud' } } = {}) {
    const { model = 'gpt-4', apiKey, llmOptions = {} } = params;
    this.model = model;
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.llmOptions = llmOptions;
    this.llmService = new LLMService({
      maxCostPerCall: 0.05, // Lower cost for semantic tagging
      minValueScore: 0.4, // Moderate value for semantic analysis
      enableLocalLLM: llmOptions.enableLocalLLM ?? true,
      ...llmOptions
    });
    if (llmOptions.localBackend && llmOptions.localBackend !== 'ollama') {
      this.llmService.registerLocalBackend(llmOptions.localBackend, async (options) => {
        return { choices: [{ message: { content: `[${llmOptions.localBackend}] response: ${options.messages.map(m => m.content).join(' ')}` } }] };
      });
    }
    if (llmOptions.routingPreference) {
      this.llmService.setRoutingPreference(llmOptions.routingPreference);
    }
  }

  /**
   * Generate semantic tags for a fossil entry
   */
  async generateSemanticTags(entry: ContextEntry): Promise<ContextEntry['semanticTags']> {
    if (!this.apiKey) {
      // Fallback to basic semantic analysis without LLM
      return this.generateBasicSemanticTags(entry);
    }

    try {
      const prompt = this.buildSemanticAnalysisPrompt(entry);
      const response = await this.llmService.callLLM({
        model: this.model,
        apiKey: this.apiKey,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing content and generating semantic tags. Provide structured, accurate analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        context: 'semantic-analysis',
        purpose: 'semantic-tagging',
        valueScore: this.calculateValueScore(entry),
        routingPreference: this.llmOptions.routingPreference
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        return this.generateBasicSemanticTags(entry);
      }

      return this.parseSemanticResponse(content, entry);
    } catch (error) {
      console.warn('LLM semantic tagging failed, using fallback:', error);
      return this.generateBasicSemanticTags(entry);
    }
  }

  /**
   * Calculate value score for semantic tagging
   */
  private calculateValueScore(entry: ContextEntry): number {
    let score = 0.5; // Base score
    
    // Higher value for important content types
    if (entry.type === 'action' || entry.type === 'plan') {
      score += 0.2;
    }
    
    // Higher value for longer content (more to analyze)
    if (entry.content && entry.content.length > 200) {
      score += 0.1;
    }
    
    // Higher value for content with existing tags (can improve)
    if (entry.tags && entry.tags.length > 0) {
      score += 0.1;
    }
    
    // Lower value for very short content
    if (entry.content && entry.content.length < 50) {
      score -= 0.2;
    }
    
    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Build prompt for semantic analysis
   */
  private buildSemanticAnalysisPrompt(entry: ContextEntry): string {
    return `Analyze this fossil entry and provide semantic tags in JSON format:

Entry Type: ${entry.type}
Title: ${entry.title}
Content: ${entry.content}
Tags: ${entry.tags.join(', ')}

Please provide a JSON response with the following structure:
{
  "semanticCategory": "category-name",
  "confidence": 0.95,
  "concepts": ["concept1", "concept2"],
  "sentiment": "positive|negative|neutral",
  "priority": "low|medium|high|critical",
  "impact": "low|medium|high|critical",
  "stakeholders": ["stakeholder1", "stakeholder2"]
}

Guidelines:
- semanticCategory: Broad category (e.g., "repository-health", "automation", "documentation")
- confidence: 0.0 to 1.0 based on how certain you are
- concepts: Key concepts extracted from content (max 5)
- sentiment: Overall sentiment of the content
- priority: How urgent/important this is
- impact: How much this affects the system/project
- stakeholders: Who this affects (e.g., "developers", "users", "admins")

Respond only with valid JSON.`;
  }

  /**
   * Parse LLM response into semantic tags
   */
  private parseSemanticResponse(content: string, entry: ContextEntry): ContextEntry['semanticTags'] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);

      return {
        contentHash: entry.metadata?.contentHash as string || '',
        semanticCategory: parsed.semanticCategory,
        confidence: parsed.confidence,
        autoGenerated: true,
        concepts: parsed.concepts || [],
        sentiment: parsed.sentiment,
        priority: parsed.priority,
        impact: parsed.impact,
        stakeholders: parsed.stakeholders || [],
        similarityScore: entry.metadata?.similarityScore as number,
        timestamp: new Date().toISOString(),
        purpose: 'semantic-analysis',
        context: entry.content.substring(0, 100)
      };
    } catch (error) {
      console.warn('Failed to parse semantic response:', error);
      return this.generateBasicSemanticTags(entry);
    }
  }

  /**
   * Generate basic semantic tags without LLM
   */
  private generateBasicSemanticTags(entry: ContextEntry): ContextEntry['semanticTags'] {
    const content = entry.content.toLowerCase();
    const title = entry.title.toLowerCase();
    
    // Basic semantic category detection
    let semanticCategory = 'general';
    if (content.includes('health') || content.includes('score')) semanticCategory = 'repository-health';
    if (content.includes('automation') || content.includes('workflow')) semanticCategory = 'automation';
    if (content.includes('test') || content.includes('testing')) semanticCategory = 'testing';
    if (content.includes('documentation') || content.includes('readme')) semanticCategory = 'documentation';
    if (content.includes('duplication') || content.includes('deduplication')) semanticCategory = 'system-maintenance';

    // Basic concept extraction
    const concepts: string[] = [];
    if (content.includes('health')) concepts.push('health-check');
    if (content.includes('automation')) concepts.push('automation');
    if (content.includes('test')) concepts.push('testing');
    if (content.includes('documentation')) concepts.push('documentation');
    if (content.includes('duplication')) concepts.push('deduplication');

    // Basic sentiment analysis
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (content.includes('good') || content.includes('improved') || content.includes('success')) sentiment = 'positive';
    if (content.includes('error') || content.includes('failed') || content.includes('issue')) sentiment = 'negative';

    // Basic priority detection
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (content.includes('critical') || content.includes('urgent')) priority = 'critical';
    if (content.includes('high') || content.includes('important')) priority = 'high';
    if (content.includes('low') || content.includes('minor')) priority = 'low';

    return {
      contentHash: entry.metadata?.contentHash as string || '',
      semanticCategory,
      confidence: 0.7,
      autoGenerated: true,
      concepts,
      sentiment,
      priority,
      impact: priority,
      stakeholders: [],
      similarityScore: entry.metadata?.similarityScore as number,
      timestamp: new Date().toISOString(),
      purpose: 'basic-semantic-analysis',
      context: entry.content.substring(0, 100)
    };
  }

  /**
   * Generate relationship tags
   */
  async generateRelationshipTags(entry: ContextEntry, allEntries: ContextEntry[]): Promise<ContextEntry['relationships']> {
    const relationships: ContextEntry['relationships'] = {};

    // Find related entries by semantic similarity
    const relatedEntries = allEntries.filter(other => 
      other.id !== entry.id && 
      this.calculateSemanticSimilarity(entry, other) > 0.6
    );

    if (relatedEntries.length > 0) {
      relationships.relatedTo = relatedEntries.map(e => e.id);
    }

    // Find dependencies (entries that this one depends on)
    const dependencies = this.findDependencies(entry, allEntries);
    if (dependencies.length > 0) {
      relationships.dependsOn = dependencies;
    }

    // Find entries this supersedes
    const superseded = this.findSuperseded(entry, allEntries);
    if (superseded.length > 0) {
      relationships.supersedes = superseded;
    }

    return relationships;
  }

  /**
   * Calculate semantic similarity between two entries
   */
  private calculateSemanticSimilarity(entry1: ContextEntry, entry2: ContextEntry): number {
    const content1 = `${entry1.title} ${entry1.content}`.toLowerCase();
    const content2 = `${entry2.title} ${entry2.content}`.toLowerCase();
    
    // Simple word overlap similarity
    const words1 = new Set(content1.split(/\s+/));
    const words2 = new Set(content2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Find dependencies for an entry
   */
  private findDependencies(entry: ContextEntry, allEntries: ContextEntry[]): string[] {
    const dependencies: string[] = [];
    
    // Look for entries that are mentioned or referenced
    const content = entry.content.toLowerCase();
    
    allEntries.forEach(other => {
      if (other.id !== entry.id && content.includes(other.title.toLowerCase())) {
        dependencies.push(other.id);
      }
    });
    
    return dependencies;
  }

  /**
   * Find entries that this entry supersedes
   */
  private findSuperseded(entry: ContextEntry, allEntries: ContextEntry[]): string[] {
    const superseded: string[] = [];
    
    // Look for entries with similar content but older timestamps
    allEntries.forEach(other => {
      if (other.id !== entry.id && 
          other.createdAt < entry.createdAt &&
          this.calculateSemanticSimilarity(entry, other) > 0.8) {
        superseded.push(other.id);
      }
    });
    
    return superseded;
  }

  /**
   * Generate temporal tags
   */
  generateTemporalTags(entry: ContextEntry): ContextEntry['temporal'] {
    const now = new Date();
    const createdAt = new Date(entry.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Determine lifecycle based on age and type
    let lifecycle: 'active' | 'archived' | 'deprecated' = 'active';
    if (daysSinceCreation > 365) lifecycle = 'archived';
    if (entry.type === 'result' && daysSinceCreation > 30) lifecycle = 'archived';

    // Set expiration for certain types
    let expiresAt: string | undefined;
    if (entry.type === 'observation' && daysSinceCreation > 90) {
      expiresAt = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    return {
      lifecycle,
      expiresAt,
      lastAccessed: entry.updatedAt,
      accessCount: 1, // Will be updated on access
    };
  }

  /**
   * Generate a one-sentence excerpt/summary for a fossil entry using LLM
   * Prefers local LLM (Ollama) if available, falls back to cloud LLM if needed.
   */
  async generateExcerpt(entry: ContextEntry): Promise<string> {
    if (!this.apiKey) {
      // Fallback to first 80 chars
      return (entry.content || '').replace(/\s+/g, ' ').slice(0, 80).trim();
    }
    try {
      const prompt = `Summarize the following content in one sentence for a quick preview:\n\n${entry.content}`;
      // Prefer local LLM for summarization if available
      const response = await this.llmService.callLLM({
        model: this.model,
        apiKey: this.apiKey,
        messages: [
          { role: 'system', content: 'You are an expert at summarizing content for quick previews.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 60,
        temperature: 0.5,
        context: 'excerpt-generation',
        purpose: 'excerpt-generation',
        valueScore: 0.3, // Lower value for excerpts
        routingPreference: this.llmOptions.routingPreference ?? 'local', // Prefer local by default
        localBackend: this.llmOptions.localBackend ?? 'ollama',
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        return (entry.content || '').replace(/\s+/g, ' ').slice(0, 80).trim();
      }
      return content.replace(/\s+/g, ' ').slice(0, 160).trim();
    } catch (error) {
      console.warn('LLM excerpt generation failed, using fallback:', error);
      return (entry.content || '').replace(/\s+/g, ' ').slice(0, 80).trim();
    }
  }
} 