import { createFossilManager } from './fossilManager';
import { 
  LLMValidationFossil, 
  LLMErrorPreventionFossil, 
  LLMQualityMetricsFossil,
  createLLMValidationFossil,
  createLLMErrorPreventionFossil,
  createLLMQualityMetricsFossil,
  LLMValidationFossilSchema,
  LLMErrorPreventionFossilSchema,
  LLMQualityMetricsFossilSchema
} from '../types/llmFossil';
import { InputValidationResult, InputPreprocessingResult } from '../types/llm';
import { executeCommand } from './cli';
import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import { LLMFossilManagerParamsSchema } from '../types';
import * as fs from 'fs/promises';
import { LLMFossilManagerParams } from '../types/llm';

export class LLMFossilManager {
  private baseManager: any;
  private fossilService: ContextFossilService;
  private params: LLMFossilManagerParams;
  private sessionInsights: any[] = [];
  private sessionMetrics: any = {
    totalInputs: 0,
    errorsPrevented: 0,
    warningsGenerated: 0,
    recommendationsProvided: 0,
    qualityImprovements: 0,
    costSavings: 0,
    timeSaved: 0
  };

  constructor(params: LLMFossilManagerParams) {
    this.params = LLMFossilManagerParamsSchema.parse(params);
    this.fossilService = new ContextFossilService();
  }

  static async create(params: LLMFossilManagerParams): Promise<LLMFossilManager> {
    const manager = new LLMFossilManager(params);
    manager.baseManager = await createFossilManager(params.owner, params.repo);
    await manager.fossilService.initialize();
    return manager;
  }

  /**
   * Store a fossil using the fossil service
   */
  private async storeFossil(fossil: any): Promise<void> {
    // Create a fossil entry that can be stored by the ContextFossilService
    const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      type: fossil.type || 'llm_insight',
      title: fossil.title || `LLM ${fossil.type || 'insight'}`,
      content: JSON.stringify(fossil, null, 2),
      tags: ['llm', fossil.type || 'insight', 'fossilized'],
      source: 'automated',
      metadata: {
        ...fossil.metadata,
        fossilType: fossil.type,
        fossilId: fossil.id,
        commitRef: fossil.commitRef
      },
      version: 1,
      children: []
    };

    await this.fossilService.addEntry(fossilEntry);
  }

  /**
   * Fossilize a single LLM validation result
   */
  async fossilizeValidation(params: {
    inputHash: string;
    validation: InputValidationResult;
    preprocessing?: InputPreprocessingResult;
    metadata: {
      model: string;
      context?: string;
      purpose?: string;
      valueScore?: number;
      validationTime: number;
      preprocessingTime?: number;
      totalTime: number;
    };
  }): Promise<LLMValidationFossil> {
    const fossil = createLLMValidationFossil({
      commitRef: this.params.commitRef || await this.getCurrentCommitRef(),
      inputHash: params.inputHash,
      validation: params.validation,
      preprocessing: params.preprocessing,
      metadata: params.metadata
    });

    // Validate fossil against schema
    const validatedFossil = LLMValidationFossilSchema.parse(fossil);

    // Store fossil using fossil service
    await this.storeFossil(validatedFossil);

    // Update session metrics
    this.updateSessionMetrics(params.validation, params.preprocessing);

    return validatedFossil;
  }

  /**
   * Fossilize a complete error prevention session
   */
  async fossilizeErrorPreventionSession(params: {
    sessionId: string;
    inputs: Array<{
      inputHash: string;
      originalInput: any;
      processedInput?: any;
      validation: InputValidationResult;
      qualityAnalysis?: any;
      preprocessing?: InputPreprocessingResult;
    }>;
    insights: Array<{
      category: 'structure' | 'quality' | 'security' | 'performance' | 'cost';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
      impact: string;
    }>;
    metadata: {
      environment: string;
      llmProvider: string;
      validationMode: string;
      preprocessingMode: string;
      totalSessionTime: number;
    };
  }): Promise<LLMErrorPreventionFossil> {
    const fossil = createLLMErrorPreventionFossil({
      commitRef: this.params.commitRef || await this.getCurrentCommitRef(),
      sessionId: params.sessionId,
      summary: this.sessionMetrics,
      inputs: params.inputs,
      insights: params.insights,
      metadata: params.metadata
    });

    // Validate fossil against schema
    const validatedFossil = LLMErrorPreventionFossilSchema.parse(fossil);

    // Store fossil using fossil service
    await this.storeFossil(validatedFossil);

    return validatedFossil;
  }

  /**
   * Fossilize quality metrics analysis
   */
  async fossilizeQualityMetrics(params: {
    metrics: {
      averageQuality: number;
      qualityDistribution: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
        veryPoor: number;
      };
      commonIssues: Array<{
        issue: string;
        frequency: number;
        impact: string;
      }>;
      improvements: Array<{
        category: string;
        beforeScore: number;
        afterScore: number;
        improvement: number;
      }>;
    };
    trends: {
      qualityTrend: 'improving' | 'stable' | 'declining';
      errorRateTrend: 'decreasing' | 'stable' | 'increasing';
      costTrend: 'decreasing' | 'stable' | 'increasing';
    };
    recommendations: Array<{
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      description: string;
      expectedImpact: string;
      implementationEffort: string;
    }>;
    metadata: {
      analysisPeriod: string;
      totalInputs: number;
      analysisTime: number;
    };
  }): Promise<LLMQualityMetricsFossil> {
    const fossil = createLLMQualityMetricsFossil({
      commitRef: this.params.commitRef || await this.getCurrentCommitRef(),
      metrics: params.metrics,
      trends: params.trends,
      recommendations: params.recommendations,
      metadata: params.metadata
    });

    // Validate fossil against schema
    const validatedFossil = LLMQualityMetricsFossilSchema.parse(fossil);

    // Store fossil using fossil service
    await this.storeFossil(validatedFossil);

    return validatedFossil;
  }

  /**
   * Get current commit reference
   */
  private async getCurrentCommitRef(): Promise<string> {
    try {
      const result = executeCommand('git rev-parse HEAD');
      return result.stdout.trim();
    } catch (error) {
      console.warn('Could not get current commit ref:', error);
      return 'unknown';
    }
  }

  /**
   * Update session metrics based on validation results
   */
  private updateSessionMetrics(validation: InputValidationResult, preprocessing?: InputPreprocessingResult): void {
    this.sessionMetrics.totalInputs++;
    
    if (!validation.isValid) {
      this.sessionMetrics.errorsPrevented += validation.errors.length;
    }
    
    this.sessionMetrics.warningsGenerated += validation.warnings.length;
    this.sessionMetrics.recommendationsProvided += validation.recommendations.length;
    
    // Track quality improvements
    if (preprocessing && preprocessing.changes) {
      this.sessionMetrics.qualityImprovements += preprocessing.changes.length;
    }
    
    // Estimate cost savings (prevented failed calls)
    if (!validation.isValid) {
      this.sessionMetrics.costSavings += 0.01; // Rough estimate per prevented call
    }
    
    // Estimate time saved (using a default validation time since it's not in the interface)
    this.sessionMetrics.timeSaved += 100; // Default 100ms per validation
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
    const filters: any = {};
    
    if (params.commitRef) filters.commitRef = params.commitRef;
    if (params.sessionId) filters.sessionId = params.sessionId;
    if (params.type) filters.type = `llm-${params.type}`;
    
    // Use fossil service to query entries instead of baseManager
    return await this.fossilService.queryEntries({
      search: '',
      type: filters.type as any,
      tags: ['llm'],
      limit: params.limit || 100,
      offset: 0
    });
  }

  /**
   * Generate quality metrics from fossilized data
   */
  async generateQualityMetrics(params: {
    analysisPeriod: string;
    commitRefs?: string[];
  }): Promise<LLMQualityMetricsFossil> {
    // Get all validation fossils for the period
    const validationFossils = await this.getFossilizedInsights({
      type: 'validation',
      limit: 1000
    });

    // Calculate metrics
    const metrics = this.calculateQualityMetrics(validationFossils);
    const trends = this.calculateTrends(validationFossils);
    const recommendations = this.generateRecommendations(metrics, trends);

    return await this.fossilizeQualityMetrics({
      metrics,
      trends,
      recommendations,
      metadata: {
        analysisPeriod: params.analysisPeriod,
        totalInputs: validationFossils.length,
        analysisTime: Date.now()
      }
    });
  }

  /**
   * Calculate quality metrics from fossilized data
   */
  private calculateQualityMetrics(fossils: any[]): any {
    const qualityScores = fossils.map(f => f.validation.qualityScore).filter(score => score !== undefined);
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    const qualityDistribution = {
      excellent: qualityScores.filter(score => score >= 0.8).length,
      good: qualityScores.filter(score => score >= 0.6 && score < 0.8).length,
      fair: qualityScores.filter(score => score >= 0.4 && score < 0.6).length,
      poor: qualityScores.filter(score => score >= 0.2 && score < 0.4).length,
      veryPoor: qualityScores.filter(score => score < 0.2).length
    };

    // Analyze common issues
    const allWarnings = fossils.flatMap(f => f.validation.warnings);
    const warningCounts = allWarnings.reduce((acc, warning) => {
      acc[warning] = (acc[warning] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(warningCounts)
      .map(([issue, frequency]) => ({
        issue,
        frequency: frequency as number,
        impact: (frequency as number) > 10 ? 'high' : (frequency as number) > 5 ? 'medium' : 'low'
      }))
      .sort((a, b) => (b.frequency as number) - (a.frequency as number))
      .slice(0, 10);

    return {
      averageQuality,
      qualityDistribution,
      commonIssues,
      improvements: [] // Would need historical data for this
    };
  }

  /**
   * Calculate trends from fossilized data
   */
  private calculateTrends(fossils: any[]): any {
    // Simple trend calculation based on recent vs older fossils
    const sortedFossils = fossils.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const midPoint = Math.floor(sortedFossils.length / 2);
    
    const olderFossils = sortedFossils.slice(0, midPoint);
    const newerFossils = sortedFossils.slice(midPoint);
    
    const olderAvgQuality = olderFossils.length > 0 
      ? olderFossils.reduce((sum, f) => sum + (f.validation.qualityScore || 0), 0) / olderFossils.length 
      : 0;
    const newerAvgQuality = newerFossils.length > 0 
      ? newerFossils.reduce((sum, f) => sum + (f.validation.qualityScore || 0), 0) / newerFossils.length 
      : 0;
    
    const qualityTrend = newerAvgQuality > olderAvgQuality + 0.1 ? 'improving' 
      : newerAvgQuality < olderAvgQuality - 0.1 ? 'declining' 
      : 'stable';
    
    const olderErrorRate = olderFossils.filter(f => !f.validation.isValid).length / Math.max(olderFossils.length, 1);
    const newerErrorRate = newerFossils.filter(f => !f.validation.isValid).length / Math.max(newerFossils.length, 1);
    
    const errorRateTrend = newerErrorRate < olderErrorRate - 0.1 ? 'decreasing'
      : newerErrorRate > olderErrorRate + 0.1 ? 'increasing'
      : 'stable';
    
    return {
      qualityTrend,
      errorRateTrend,
      costTrend: 'stable' // Would need cost data for accurate calculation
    };
  }

  /**
   * Generate recommendations based on metrics and trends
   */
  private generateRecommendations(metrics: any, trends: any): any[] {
    const recommendations = [];
    
    if (metrics.averageQuality < 0.6) {
      recommendations.push({
        priority: 'high' as const,
        category: 'quality',
        description: 'Overall input quality is below acceptable threshold',
        expectedImpact: 'Significant improvement in LLM response quality',
        implementationEffort: 'medium'
      });
    }
    
    if (trends.qualityTrend === 'declining') {
      recommendations.push({
        priority: 'critical' as const,
        category: 'quality',
        description: 'Input quality is declining over time',
        expectedImpact: 'Prevent further degradation of LLM performance',
        implementationEffort: 'high'
      });
    }
    
    if (metrics.qualityDistribution.veryPoor > metrics.totalInputs * 0.2) {
      recommendations.push({
        priority: 'high' as const,
        category: 'validation',
        description: 'High percentage of very poor quality inputs',
        expectedImpact: 'Reduce failed LLM calls and improve success rate',
        implementationEffort: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Export fossilized data for analysis
   */
  async exportFossilizedData(params: {
    format: 'json' | 'yaml' | 'csv';
    outputPath: string;
    filters?: any;
  }): Promise<string> {
    const fossils = await this.getFossilizedInsights({ limit: 10000 });
    
    switch (params.format) {
      case 'json':
        return await this.exportToJSON(fossils, params.outputPath);
      case 'yaml':
        return await this.exportToYAML(fossils, params.outputPath);
      case 'csv':
        return await this.exportToCSV(fossils, params.outputPath);
      default:
        throw new Error(`Unsupported export format: ${params.format}`);
    }
  }

  private async exportToJSON(fossils: any[], outputPath: string): Promise<string> {
    await fs.writeFile(outputPath, JSON.stringify(fossils, null, 2));
    return outputPath;
  }

  private async exportToYAML(fossils: any[], outputPath: string): Promise<string> {
    const yaml = await import('yaml');
    await fs.writeFile(outputPath, yaml.stringify(fossils));
    return outputPath;
  }

  private async exportToCSV(fossils: any[], outputPath: string): Promise<string> {
    // Convert fossils to CSV format
    const csvRows = ['timestamp,type,commitRef,isValid,qualityScore,errors,warnings'];
    
    for (const fossil of fossils) {
      if (fossil.type === 'llm-validation') {
        csvRows.push([
          fossil.timestamp,
          fossil.type,
          fossil.commitRef,
          fossil.validation.isValid,
          fossil.validation.qualityScore,
          fossil.validation.errors.length,
          fossil.validation.warnings.length
        ].join(','));
      }
    }
    
    await fs.writeFile(outputPath, csvRows.join('\n'));
    return outputPath;
  }
}

// Convenience function for creating LLM fossil manager
export async function createLLMFossilManager(params: LLMFossilManagerParams): Promise<LLMFossilManager> {
  return await LLMFossilManager.create(params);
}

// Convenience function for fossilizing LLM insights (backward compatibility)
export async function fossilizeLLMInsight(params: {
  inputHash: string;
  validation: any;
  preprocessing?: any;
  metadata: {
    model: string;
    context?: string;
    purpose?: string;
    valueScore?: number;
    validationTime: number;
    preprocessingTime?: number;
    totalTime: number;
  };
}): Promise<any> {
  const manager = await createLLMFossilManager({
    owner: 'automate-workloads',
    repo: 'automate_workloads',
    fossilStoragePath: 'fossils/llm_insights/',
    enableAutoFossilization: true,
    enableQualityMetrics: true,
    enableValidationTracking: true
  });
  
  return await manager.fossilizeValidation(params);
} 