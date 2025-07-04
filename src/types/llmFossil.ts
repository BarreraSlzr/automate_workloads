/**
 * LLM Fossil Types for insights, benchmarks, and model discovery
 * Roadmap reference: Fossilize LLM insights, benchmarks, and model discovery results
 */

import { z } from './schemas';

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
export interface LLMInsightHistoryEntry {
  timestamp: string;
  commitRef: string;
  inputHash: string;
  promptId: string;
  promptVersion: string;
  prompt: string;
  systemMessage: string;
  response: string;
  evaluation?: string;
  userFeedback?: string;
  manualOverride?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
}

export interface LLMInsightFossil {
  type: 'insight';
  timestamp: string;
  model: string;
  modelVersion?: string;
  provider: string;
  tags?: string[];
  excerpt: string;
  promptId: string;
  promptVersion: string;
  prompt: string;
  systemMessage: string;
  inputHash: string;
  commitRef: string;
  response: string;
  evaluation?: string;
  userFeedback?: string;
  manualOverride?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  history?: LLMInsightHistoryEntry[];
  // For CLI/UI review/approval tools, use reviewStatus and manualOverride fields.
  // Optionally, add a reviewLink or reviewMetadata field to link to review tools or UI.
  // Example: reviewLink?: string; reviewMetadata?: Record<string, any>;
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

// Zod schema for validation (to be implemented in schemas.ts)
export const LLMInsightFossilSchema = z.object({
  type: z.literal('insight'),
  timestamp: z.string(),
  model: z.string(),
  modelVersion: z.string().optional(),
  provider: z.string(),
  tags: z.array(z.string()).optional(),
  excerpt: z.string(),
  promptId: z.string(),
  promptVersion: z.string(),
  prompt: z.string(),
  systemMessage: z.string(),
  inputHash: z.string(),
  commitRef: z.string(),
  response: z.string(),
  evaluation: z.string().optional(),
  userFeedback: z.string().optional(),
  manualOverride: z.boolean().optional(),
  reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  history: z.array(z.object({
    timestamp: z.string(),
    commitRef: z.string(),
    inputHash: z.string(),
    promptId: z.string(),
    promptVersion: z.string(),
    prompt: z.string(),
    systemMessage: z.string(),
    response: z.string(),
    evaluation: z.string().optional(),
    userFeedback: z.string().optional(),
    manualOverride: z.boolean().optional(),
    reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  })).optional(),
}); 