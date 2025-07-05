#!/usr/bin/env bun

/**
 * Example: Processing LLM Snapshots for Analysis and Audit
 * 
 * This example demonstrates the CORRECT way to process LLM snapshots:
 * - For audit and traceability analysis
 * - For quality trend tracking
 * - For pattern analysis across calls
 * - NOT for generating test responses
 */

import { ContextFossilService } from '../src/cli/context-fossil';
import { exportLLMSnapshot } from '../src/utils/llmSnapshotExporter';
import { 
  SnapshotAnalysisParamsSchema, 
  SnapshotExportParamsSchema,
  PatternAnalysisParamsSchema,
  AuditReportParamsSchema,
  QualityTrendParamsSchema,
  z
} from '../src/types/schemas';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SnapshotAnalysis {
  timestamp: string;
  fossilCount: number;
  qualityMetrics: {
    averageQualityScore: number;
    qualityDistribution: Record<string, number>;
    successRate: number;
    errorRate: number;
  };
  patterns: {
    mostCommonPurposes: Array<{ purpose: string; count: number }>;
    mostCommonContexts: Array<{ context: string; count: number }>;
    modelUsage: Record<string, number>;
  };
  insights: string[];
  recommendations: string[];
}

class SnapshotProcessor {
  private fossilService: ContextFossilService;

  constructor() {
    this.fossilService = new ContextFossilService();
  }

  /**
   * Process snapshots for analysis (NOT for test responses)
   */
  async processSnapshotsForAnalysis(params: z.infer<typeof SnapshotAnalysisParamsSchema>): Promise<SnapshotAnalysis> {
    console.log('🔍 Processing LLM Snapshots for Analysis');
    console.log('='.repeat(50));

    // Validate params using Zod schema
    const validatedParams = SnapshotAnalysisParamsSchema.parse(params);

    const analysis: SnapshotAnalysis = {
      timestamp: new Date().toISOString(),
      fossilCount: 0,
      qualityMetrics: {
        averageQualityScore: 0,
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 },
        successRate: 0,
        errorRate: 0
      },
      patterns: {
        mostCommonPurposes: [],
        mostCommonContexts: [],
        modelUsage: {}
      },
      insights: [],
      recommendations: []
    };

    try {
      // Step 1: Query LLM-related fossils using validated params
      const fossils = await this.fossilService.queryEntries({
        tags: validatedParams.filters?.tags || ['llm'],
        limit: validatedParams.limit,
        offset: validatedParams.offset
      });

      analysis.fossilCount = fossils.length;
      console.log(`📊 Found ${fossils.length} LLM fossils to analyze`);

      if (fossils.length === 0) {
        analysis.insights.push('No LLM fossils found for analysis');
        return analysis;
      }

      // Step 2: Analyze quality metrics
      analysis.qualityMetrics = this.analyzeQualityMetrics(fossils);

      // Step 3: Analyze patterns
      analysis.patterns = this.analyzePatterns(fossils);

      // Step 4: Generate insights
      analysis.insights = this.generateInsights(analysis);

      // Step 5: Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze quality metrics across fossils
   */
  private analyzeQualityMetrics(fossils: any[]): SnapshotAnalysis['qualityMetrics'] {
    const metrics = {
      averageQualityScore: 0,
      qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 },
      successRate: 0,
      errorRate: 0
    };

    let totalQualityScore = 0;
    let qualityScoreCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const fossil of fossils) {
      // Analyze quality scores
      if (fossil.validation?.qualityScore) {
        totalQualityScore += fossil.validation.qualityScore;
        qualityScoreCount++;

        // Categorize quality
        const score = fossil.validation.qualityScore;
        if (score >= 0.9) metrics.qualityDistribution.excellent++;
        else if (score >= 0.8) metrics.qualityDistribution.good++;
        else if (score >= 0.7) metrics.qualityDistribution.fair++;
        else if (score >= 0.6) metrics.qualityDistribution.poor++;
        else metrics.qualityDistribution.veryPoor++;
      }

      // Analyze success/error rates
      if (fossil.success === true) successCount++;
      else if (fossil.success === false) errorCount++;
    }

    if (qualityScoreCount > 0) {
      metrics.averageQualityScore = totalQualityScore / qualityScoreCount;
    }

    if (fossils.length > 0) {
      metrics.successRate = successCount / fossils.length;
      metrics.errorRate = errorCount / fossils.length;
    }

    return metrics;
  }

  /**
   * Analyze patterns across fossils
   */
  private analyzePatterns(fossils: any[]): SnapshotAnalysis['patterns'] {
    const patterns = {
      mostCommonPurposes: [] as Array<{ purpose: string; count: number }>,
      mostCommonContexts: [] as Array<{ context: string; count: number }>,
      modelUsage: {} as Record<string, number>
    };

    const purposeCounts: Record<string, number> = {};
    const contextCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};

    for (const fossil of fossils) {
      // Count purposes
      if (fossil.purpose) {
        purposeCounts[fossil.purpose] = (purposeCounts[fossil.purpose] || 0) + 1;
      }

      // Count contexts
      if (fossil.context) {
        contextCounts[fossil.context] = (contextCounts[fossil.context] || 0) + 1;
      }

      // Count models
      if (fossil.metadata?.model) {
        modelCounts[fossil.metadata.model] = (modelCounts[fossil.metadata.model] || 0) + 1;
      }
    }

    // Sort and take top 5
    patterns.mostCommonPurposes = Object.entries(purposeCounts)
      .map(([purpose, count]) => ({ purpose, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    patterns.mostCommonContexts = Object.entries(contextCounts)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    patterns.modelUsage = modelCounts;

    return patterns;
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(analysis: SnapshotAnalysis): string[] {
    const insights: string[] = [];

    // Quality insights
    if (analysis.qualityMetrics.averageQualityScore < 0.8) {
      insights.push('Average quality score is below 0.8, indicating room for improvement in LLM call quality');
    }

    if (analysis.qualityMetrics.errorRate > 0.1) {
      insights.push(`Error rate of ${(analysis.qualityMetrics.errorRate * 100).toFixed(1)}% suggests potential issues with LLM integration`);
    }

    // Pattern insights
    if (analysis.patterns.mostCommonPurposes.length > 0) {
      const topPurpose = analysis.patterns.mostCommonPurposes[0];
      insights.push(`Most common LLM call purpose is "${topPurpose.purpose}" (${topPurpose.count} calls)`);
    }

    if (analysis.patterns.modelUsage['gpt-4']) {
      insights.push('GPT-4 is being used, consider cost optimization for non-critical calls');
    }

    // Volume insights
    if (analysis.fossilCount > 100) {
      insights.push(`High volume of LLM calls (${analysis.fossilCount}), consider implementing caching strategies`);
    }

    return insights;
  }

  /**
   * Generate recommendations from analysis
   */
  private generateRecommendations(analysis: SnapshotAnalysis): string[] {
    const recommendations: string[] = [];

    // Quality recommendations
    if (analysis.qualityMetrics.averageQualityScore < 0.8) {
      recommendations.push('Implement input validation and preprocessing to improve call quality');
      recommendations.push('Review failed calls to identify common failure patterns');
    }

    if (analysis.qualityMetrics.errorRate > 0.1) {
      recommendations.push('Add retry logic and fallback mechanisms for failed calls');
      recommendations.push('Implement better error handling and logging');
    }

    // Cost optimization
    if (analysis.patterns.modelUsage['gpt-4']) {
      recommendations.push('Consider using GPT-3.5-turbo for non-critical calls to reduce costs');
      recommendations.push('Implement model selection based on call complexity and requirements');
    }

    // Performance recommendations
    if (analysis.fossilCount > 100) {
      recommendations.push('Implement caching for repeated or similar calls');
      recommendations.push('Consider batch processing for multiple related calls');
    }

    return recommendations;
  }

  /**
   * Export analysis results
   */
  async exportAnalysis(analysis: SnapshotAnalysis, format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `snapshot-analysis-${timestamp}.${format}`;
    const outputPath = path.join(process.cwd(), filename);

    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
    } else {
      const markdown = this.generateMarkdownReport(analysis);
      await fs.writeFile(outputPath, markdown);
    }

    return outputPath;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(analysis: SnapshotAnalysis): string {
    return `# LLM Snapshot Analysis Report

Generated: ${analysis.timestamp}

## 📊 Summary

- **Total Fossils Analyzed**: ${analysis.fossilCount}
- **Average Quality Score**: ${analysis.qualityMetrics.averageQualityScore.toFixed(3)}
- **Success Rate**: ${(analysis.qualityMetrics.successRate * 100).toFixed(1)}%
- **Error Rate**: ${(analysis.qualityMetrics.errorRate * 100).toFixed(1)}%

## 🎯 Quality Metrics

### Quality Distribution
${Object.entries(analysis.qualityMetrics.qualityDistribution)
  .map(([level, count]) => `- **${level}**: ${count}`)
  .join('\n')}

## 📈 Patterns

### Most Common Purposes
${analysis.patterns.mostCommonPurposes
  .map(p => `- **${p.purpose}**: ${p.count} calls`)
  .join('\n')}

### Most Common Contexts
${analysis.patterns.mostCommonContexts
  .map(c => `- **${c.context}**: ${c.count} calls`)
  .join('\n')}

### Model Usage
${Object.entries(analysis.patterns.modelUsage)
  .map(([model, count]) => `- **${model}**: ${count} calls`)
  .join('\n')}

## 💡 Insights

${analysis.insights.map(insight => `- ${insight}`).join('\n')}

## 🎯 Recommendations

${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*This report was generated by processing LLM snapshots for audit and analysis purposes.*
`;
  }
}

// Example usage
async function main() {
  console.log('🔍 LLM Snapshot Processing Example');
  console.log('='.repeat(50));
  console.log('This example shows how to process snapshots for analysis, NOT for test responses');
  console.log('');

  const processor = new SnapshotProcessor();

  try {
    // Process snapshots for analysis with proper params
    const analysis = await processor.processSnapshotsForAnalysis({
      filters: {
        tags: ['llm']
      },
      includeMetadata: true,
      includeValidation: true,
      includeQualityMetrics: true,
      limit: 100,
      offset: 0,
      dryRun: false,
      verbose: false
    });

    // Display results
    console.log('📊 Analysis Results:');
    console.log(`   Fossils analyzed: ${analysis.fossilCount}`);
    console.log(`   Average quality: ${analysis.qualityMetrics.averageQualityScore.toFixed(3)}`);
    console.log(`   Success rate: ${(analysis.qualityMetrics.successRate * 100).toFixed(1)}%`);
    console.log('');

    // Export results
    const outputPath = await processor.exportAnalysis(analysis, 'markdown');
    console.log(`📁 Analysis exported to: ${outputPath}`);

    // Show insights
    if (analysis.insights.length > 0) {
      console.log('\n💡 Key Insights:');
      analysis.insights.slice(0, 3).forEach(insight => {
        console.log(`   - ${insight}`);
      });
    }

    // Show recommendations
    if (analysis.recommendations.length > 0) {
      console.log('\n🎯 Top Recommendations:');
      analysis.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    console.log('\n✅ Analysis completed successfully!');
    console.log('💡 Remember: Snapshots are for audit/analysis, not test responses');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.main) {
  main();
}

export { SnapshotProcessor, SnapshotAnalysis }; 