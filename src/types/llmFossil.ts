/**
 * LLM Fossil Types for insights, benchmarks, and model discovery
 * Roadmap reference: Fossilize LLM insights, benchmarks, and model discovery results
 */

export type LLMFossilType = 'insight' | 'benchmark' | 'discovery';

/**
 * Base structure for all LLM fossils
 */
export interface BaseLLMFossil {
  type: LLMFossilType;
  timestamp: string;
  model: string;
  modelVersion?: string;
  provider: string;
  tags?: string[];
  excerpt: string;
}

/**
 * LLM Insight Fossil
 * Stores prompt, response, evaluation, and feedback
 */
export interface LLMInsightFossil extends BaseLLMFossil {
  type: 'insight';
  prompt: string;
  response: string;
  evaluation?: string;
  userFeedback?: string;
}

/**
 * LLM Benchmark Fossil
 * Stores performance metrics for a model
 */
export interface LLMBenchmarkFossil extends BaseLLMFossil {
  type: 'benchmark';
  metrics: {
    latencyMs: number;
    throughput?: number;
    accuracy?: number;
    cost?: number;
    hardware?: string;
  };
  notes?: string;
}

/**
 * LLM Discovery Fossil
 * Stores discovered models and their metadata
 */
export interface LLMDiscoveryFossil extends BaseLLMFossil {
  type: 'discovery';
  models: Array<{
    name: string;
    version?: string;
    sizeMB?: number;
    features?: string[];
    available: boolean;
  }>;
  notes?: string;
}

export type AnyLLMFossil = LLMInsightFossil | LLMBenchmarkFossil | LLMDiscoveryFossil; 