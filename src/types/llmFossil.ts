/**
 * LLM Fossil Types for insights, benchmarks, and model discovery
 * Roadmap reference: Fossilize LLM insights, benchmarks, and model discovery results
 */

import { z } from 'zod';
import { LLMFossilManagerParamsSchema } from './schemas';

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

// LLM Error Prevention Fossil Types
export const LLMValidationFossilSchema = z.object({
  type: z.literal('llm-validation'),
  timestamp: z.string(),
  commitRef: z.string(),
  inputHash: z.string(),
  validation: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    recommendations: z.array(z.string()),
    qualityScore: z.number().min(0).max(1),
    securityIssues: z.array(z.string()),
    performanceIssues: z.array(z.string())
  }),
  preprocessing: z.object({
    success: z.boolean(),
    changes: z.array(z.string()),
    improvements: z.array(z.string())
  }).optional(),
  metadata: z.object({
    model: z.string(),
    context: z.string().optional(),
    purpose: z.string().optional(),
    valueScore: z.number().min(0).max(1).optional(),
    validationTime: z.number(),
    preprocessingTime: z.number().optional(),
    totalTime: z.number()
  }),
  fossilId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'archived']).default('pending'),
  tags: z.array(z.string()).default([])
});

export const LLMErrorPreventionFossilSchema = z.object({
  type: z.literal('llm-error-prevention'),
  timestamp: z.string(),
  commitRef: z.string(),
  sessionId: z.string(),
  summary: z.object({
    totalInputs: z.number(),
    errorsPrevented: z.number(),
    warningsGenerated: z.number(),
    recommendationsProvided: z.number(),
    qualityImprovements: z.number(),
    costSavings: z.number(),
    timeSaved: z.number()
  }),
  inputs: z.array(z.object({
    inputHash: z.string(),
    originalInput: z.any(),
    processedInput: z.any().optional(),
    validation: z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string()),
      recommendations: z.array(z.string())
    }),
    qualityAnalysis: z.object({
      readability: z.number(),
      clarity: z.number(),
      specificity: z.number(),
      completeness: z.number(),
      overall: z.number()
    }).optional(),
    preprocessing: z.object({
      success: z.boolean(),
      changes: z.array(z.string()),
      warnings: z.array(z.string()),
      errors: z.array(z.string())
    }).optional()
  })),
  insights: z.array(z.object({
    category: z.enum(['structure', 'quality', 'security', 'performance', 'cost']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    recommendation: z.string(),
    impact: z.string()
  })),
  metadata: z.object({
    environment: z.string(),
    llmProvider: z.string(),
    validationMode: z.string(),
    preprocessingMode: z.string(),
    totalSessionTime: z.number(),
    fossilizationTime: z.number()
  }),
  fossilId: z.string(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  tags: z.array(z.string()).default(['llm', 'error-prevention', 'validation'])
});

export const LLMQualityMetricsFossilSchema = z.object({
  type: z.literal('llm-quality-metrics'),
  timestamp: z.string(),
  commitRef: z.string(),
  metrics: z.object({
    averageQuality: z.number(),
    qualityDistribution: z.object({
      excellent: z.number(), // 0.8-1.0
      good: z.number(),      // 0.6-0.8
      fair: z.number(),      // 0.4-0.6
      poor: z.number(),      // 0.2-0.4
      veryPoor: z.number()   // 0.0-0.2
    }),
    commonIssues: z.array(z.object({
      issue: z.string(),
      frequency: z.number(),
      impact: z.string()
    })),
    improvements: z.array(z.object({
      category: z.string(),
      beforeScore: z.number(),
      afterScore: z.number(),
      improvement: z.number()
    }))
  }),
  trends: z.object({
    qualityTrend: z.enum(['improving', 'stable', 'declining']),
    errorRateTrend: z.enum(['decreasing', 'stable', 'increasing']),
    costTrend: z.enum(['decreasing', 'stable', 'increasing'])
  }),
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.string(),
    description: z.string(),
    expectedImpact: z.string(),
    implementationEffort: z.string()
  })),
  metadata: z.object({
    analysisPeriod: z.string(),
    totalInputs: z.number(),
    analysisTime: z.number()
  }),
  fossilId: z.string(),
  status: z.enum(['draft', 'reviewed', 'approved', 'implemented']).default('draft'),
  tags: z.array(z.string()).default(['llm', 'quality', 'metrics', 'analysis'])
});

// Type exports
export type LLMValidationFossil = z.infer<typeof LLMValidationFossilSchema>;
export type LLMErrorPreventionFossil = z.infer<typeof LLMErrorPreventionFossilSchema>;
export type LLMQualityMetricsFossil = z.infer<typeof LLMQualityMetricsFossilSchema>;

// Fossil creation functions
export function createLLMValidationFossil(params: {
  commitRef: string;
  inputHash: string;
  validation: any;
  preprocessing?: any;
  metadata: any;
}): LLMValidationFossil {
  return {
    type: 'llm-validation',
    timestamp: new Date().toISOString(),
    commitRef: params.commitRef,
    inputHash: params.inputHash,
    validation: {
      isValid: params.validation.isValid,
      errors: params.validation.errors || [],
      warnings: params.validation.warnings || [],
      recommendations: params.validation.recommendations || [],
      qualityScore: params.validation.qualityAnalysis?.overall || 0,
      securityIssues: params.validation.warnings?.filter((w: string) => w.includes('security') || w.includes('sensitive')) || [],
      performanceIssues: params.validation.warnings?.filter((w: string) => w.includes('performance') || w.includes('cost')) || []
    },
    preprocessing: params.preprocessing ? {
      success: params.preprocessing.success,
      changes: params.preprocessing.changes || [],
      improvements: params.preprocessing.changes || []
    } : undefined,
    metadata: {
      model: params.metadata.model,
      context: params.metadata.context,
      purpose: params.metadata.purpose,
      valueScore: params.metadata.valueScore,
      validationTime: params.metadata.validationTime,
      preprocessingTime: params.metadata.preprocessingTime,
      totalTime: params.metadata.totalTime
    },
    fossilId: `llm-validation-${Date.now()}-${params.inputHash}`,
    status: 'pending',
    tags: ['llm', 'validation', 'error-prevention']
  };
}

export function logProgress(params: { type: string; i: number; total: number }) {
  const { type, i, total } = params;
  if (i % 10 === 0 || i === total - 1) {
    console.log(`🔄 Processing ${type} ${i + 1} of ${total}`);
  }
}

export function logError(params: { context: string; item: any; error: any }) {
  const { context, item, error } = params;
  console.error(`❌ [${context}] Error processing item:`, item, '\nError:', error);
}

export async function createLLMErrorPreventionFossil(params: any): Promise<any> {
  const errors: any[] = [];
  for (let i = 0; i < params.entries.length; i++) {
    logProgress({ type: 'entry', i, total: params.entries.length });
    try {
      const entry: any = params.entries[i];
      throw new Error('Not implemented: placeholder logic in llmFossil.ts must be replaced with real business logic to avoid infinite loops and CPU exhaustion');
    } catch (err) {
      logError({ context: 'createLLMErrorPreventionFossil', item: params.entries[i], error: err });
      errors.push({ index: i, entry: params.entries[i], error: err });
    }
  }
  for (let i = 0; i < params.insights.length; i++) {
    logProgress({ type: 'insight', i, total: params.insights.length });
    try {
      const insight: any = params.insights[i];
      throw new Error('Not implemented: placeholder logic in llmFossil.ts must be replaced with real business logic to avoid infinite loops and CPU exhaustion');
    } catch (err) {
      logError({ context: 'createLLMErrorPreventionFossil', item: params.insights[i], error: err });
      errors.push({ index: i, insight: params.insights[i], error: err });
    }
  }
  console.log(`📊 [createLLMErrorPreventionFossil] Processed ${params.entries.length} entries, ${params.insights.length} insights, ${errors.length} errors.`);
  return { success: errors.length === 0, errors };
}

export async function createLLMQualityMetricsFossil(params: any): Promise<any> {
  const errors: any[] = [];
  for (let i = 0; i < params.metrics.length; i++) {
    logProgress({ type: 'metric', i, total: params.metrics.length });
    try {
      const metric: any = params.metrics[i];
      throw new Error('Not implemented: placeholder logic in llmFossil.ts must be replaced with real business logic to avoid infinite loops and CPU exhaustion');
    } catch (err) {
      logError({ context: 'createLLMQualityMetricsFossil', item: params.metrics[i], error: err });
      errors.push({ index: i, metric: params.metrics[i], error: err });
    }
  }
  for (let i = 0; i < params.recommendations.length; i++) {
    logProgress({ type: 'recommendation', i, total: params.recommendations.length });
    try {
      const rec: any = params.recommendations[i];
      throw new Error('Not implemented: placeholder logic in llmFossil.ts must be replaced with real business logic to avoid infinite loops and CPU exhaustion');
    } catch (err) {
      logError({ context: 'createLLMQualityMetricsFossil', item: params.recommendations[i], error: err });
      errors.push({ index: i, recommendation: params.recommendations[i], error: err });
    }
  }
  for (let i = 0; i < params.insights.length; i++) {
    logProgress({ type: 'insight', i, total: params.insights.length });
    try {
      const insight: any = params.insights[i];
      throw new Error('Not implemented: placeholder logic in llmFossil.ts must be replaced with real business logic to avoid infinite loops and CPU exhaustion');
    } catch (err) {
      logError({ context: 'createLLMQualityMetricsFossil', item: params.insights[i], error: err });
      errors.push({ index: i, insight: params.insights[i], error: err });
    }
  }
  for (let i = 0; i < params.entries.length; i++) {
    logProgress({ type: 'entry', i, total: params.entries.length });
    try {
      const entry: any = params.entries[i];
      throw new Error('Not implemented: placeholder logic in llmFossil.ts must be replaced with real business logic to avoid infinite loops and CPU exhaustion');
    } catch (err) {
      logError({ context: 'createLLMQualityMetricsFossil', item: params.entries[i], error: err });
      errors.push({ index: i, entry: params.entries[i], error: err });
    }
  }
  console.log(`📊 [createLLMQualityMetricsFossil] Processed ${params.metrics.length} metrics, ${params.recommendations.length} recommendations, ${params.insights.length} insights, ${params.entries.length} entries, ${errors.length} errors.`);
  return { success: errors.length === 0, errors };
} 