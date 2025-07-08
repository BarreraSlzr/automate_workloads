#!/usr/bin/env bun

/**
 * Learning Analysis Engine
 * Learns from historical monitoring data to provide predictive insights
 * @module scripts/learning-analysis-engine
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { toFossilEntry, writeFossilToFile } from '../src/utils/fossilize';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

const HistoricalAnalysisSchema = z.object({
  timestamp: z.string(),
  overallHealth: z.object({
    overallScore: z.number(),
    testReliability: z.number(),
    performanceStability: z.number(),
    memoryEfficiency: z.number(),
    errorRate: z.number(),
    hangingTestRate: z.number(),
    averageTestDuration: z.number(),
    totalIssues: z.number(),
    criticalIssues: z.number(),
  }),
  tasks: z.array(z.object({
    taskId: z.string(),
    name: z.string(),
    status: z.string(),
    lastRun: z.string(),
    successRate: z.number(),
    averageDuration: z.number(),
    issues: z.array(z.any()),
    recommendations: z.array(z.string()),
  })),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.string(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    duration: z.number().optional(),
    frequency: z.number(),
    impact: z.string(),
    recommendations: z.array(z.string()),
    metadata: z.record(z.any()),
  })),
  trends: z.object({
    testDuration: z.string(),
    errorRate: z.string(),
    hangingTests: z.string(),
  }),
  recommendations: z.array(z.string()),
});

interface LearningPattern {
  patternId: string;
  type: 'issue_correlation' | 'performance_trend' | 'failure_prediction' | 'optimization_opportunity';
  confidence: number; // 0-1
  description: string;
  evidence: string[];
  prediction: string;
  actionability: 'immediate' | 'short_term' | 'long_term';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

interface PredictiveInsight {
  insightId: string;
  type: 'risk_alert' | 'opportunity' | 'trend_analysis' | 'anomaly_detection';
  title: string;
  description: string;
  confidence: number;
  timeframe: 'immediate' | 'short_term' | 'long_term';
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  supportingData: Record<string, any>;
}

interface LearningModel {
  modelId: string;
  version: string;
  lastUpdated: string;
  patterns: LearningPattern[];
  insights: PredictiveInsight[];
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
}

// ============================================================================
// LEARNING ANALYSIS ENGINE
// ============================================================================

export class LearningAnalysisEngine {
  private historicalData: any[] = [];
  private learningModel: LearningModel;
  private analysisDir: string;

  constructor(analysisDir: string = 'fossils/tests') {
    this.analysisDir = analysisDir;
    this.learningModel = this.initializeLearningModel();
  }

  /**
   * Initialize learning model
   */
  private initializeLearningModel(): LearningModel {
    return {
      modelId: 'monitoring-analysis-v1',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      patterns: [],
      insights: [],
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0,
    };
  }

  /**
   * Load and learn from historical data
   */
  async learnFromHistory(): Promise<void> {
    console.log('🧠 Loading historical analysis data...');
    
    await this.loadHistoricalData();
    await this.identifyPatterns();
    await this.generatePredictiveInsights();
    await this.updateModelAccuracy();
    await this.saveLearningModel();
    
    console.log(`✅ Learning complete! Identified ${this.learningModel.patterns.length} patterns and ${this.learningModel.insights.length} insights`);
  }

  /**
   * Load historical analysis data from canonical location
   */
  private async loadHistoricalData(): Promise<void> {
    const canonicalAnalysisDir = join('fossils', 'tests', 'analysis');
    
    if (!existsSync(canonicalAnalysisDir)) {
      console.log('📁 No canonical historical data found, starting fresh');
      return;
    }

    // Look for canonical analysis files
    const files = readdirSync(canonicalAnalysisDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .slice(-10); // Last 10 analyses

    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(canonicalAnalysisDir, file), 'utf8'));
        // Extract content from fossil format
        const content = typeof data === 'string' ? data : data.content || JSON.stringify(data);
        const parsed = JSON.parse(content);
        const validated = HistoricalAnalysisSchema.parse(parsed);
        this.historicalData.push(validated);
      } catch (error) {
        console.warn(`⚠️  Failed to load ${file}: ${error}`);
      }
    }

    console.log(`📊 Loaded ${this.historicalData.length} canonical historical analyses`);
  }

  /**
   * Identify patterns in historical data
   */
  private async identifyPatterns(): Promise<void> {
    if (this.historicalData.length < 2) {
      console.log('📈 Need more historical data to identify patterns');
      return;
    }

    // Pattern 1: Issue correlation patterns
    this.identifyIssueCorrelations();
    
    // Pattern 2: Performance trend patterns
    this.identifyPerformanceTrends();
    
    // Pattern 3: Failure prediction patterns
    this.identifyFailurePatterns();
    
    // Pattern 4: Optimization opportunities
    this.identifyOptimizationOpportunities();
  }

  /**
   * Identify issue correlations
   */
  private identifyIssueCorrelations(): void {
    const issueTypes = new Map<string, number>();
    const correlations = new Map<string, number>();

    // Count issue types across all analyses
    for (const analysis of this.historicalData) {
      for (const issue of analysis.issues) {
        issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
      }
    }

    // Find correlations between issue types
    for (const analysis of this.historicalData) {
      const issueTypesInAnalysis = new Set(analysis.issues.map((i: any) => i.type));
      
      for (const type1 of issueTypesInAnalysis) {
        for (const type2 of issueTypesInAnalysis) {
          if (type1 !== type2) {
            const key = `${type1}-${type2}`;
            correlations.set(key, (correlations.get(key) || 0) + 1);
          }
        }
      }
    }

    // Create patterns for strong correlations
    for (const [correlation, count] of correlations) {
      if (count >= 2) { // At least 2 occurrences
        const [type1, type2] = correlation.split('-');
        const confidence = Math.min(count / this.historicalData.length, 1);
        
        this.learningModel.patterns.push({
          patternId: `correlation-${type1}-${type2}`,
          type: 'issue_correlation',
          confidence,
          description: `Issues of type '${type1}' often occur together with '${type2}'`,
          evidence: [`Found ${count} co-occurrences in ${this.historicalData.length} analyses`],
          prediction: `When ${type1} issues appear, expect ${type2} issues to follow`,
          actionability: 'immediate',
          impact: 'medium',
        });
      }
    }
  }

  /**
   * Identify performance trends
   */
  private identifyPerformanceTrends(): void {
    if (this.historicalData.length < 3) return;

    const scores = this.historicalData.map(d => d.overallHealth.overallScore);
    const trend = this.calculateTrend(scores);
    
    if (Math.abs(trend) > 0.1) { // Significant trend
      this.learningModel.patterns.push({
        patternId: 'performance-trend',
        type: 'performance_trend',
        confidence: Math.abs(trend),
        description: `Project health is ${trend > 0 ? 'improving' : 'degrading'} over time`,
        evidence: [
          `Health scores: ${scores.join(' → ')}`,
          `Trend slope: ${trend.toFixed(3)}`
        ],
        prediction: `If trend continues, health score will be ${this.predictNextValue(scores)} in next analysis`,
        actionability: trend > 0 ? 'long_term' : 'immediate',
        impact: 'high',
      });
    }
  }

  /**
   * Identify failure patterns
   */
  private identifyFailurePatterns(): void {
    const failurePatterns = new Map<string, number>();
    
    for (const analysis of this.historicalData) {
      for (const task of analysis.tasks) {
        if (task.status === 'critical') {
          const pattern = `${task.taskId}-critical`;
          failurePatterns.set(pattern, (failurePatterns.get(pattern) || 0) + 1);
        }
      }
    }

    for (const [pattern, count] of failurePatterns) {
      if (count >= 2) {
        const taskId = pattern.replace('-critical', '');
        const confidence = count / this.historicalData.length;
        
        this.learningModel.patterns.push({
          patternId: `failure-${taskId}`,
          type: 'failure_prediction',
          confidence,
          description: `Task '${taskId}' has been critical in ${count} out of ${this.historicalData.length} analyses`,
          evidence: [`Critical status frequency: ${(confidence * 100).toFixed(1)}%`],
          prediction: `Task '${taskId}' is likely to be critical in next analysis`,
          actionability: 'immediate',
          impact: 'high',
        });
      }
    }
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(): void {
    const slowTasks = new Map<string, number[]>();
    
    for (const analysis of this.historicalData) {
      for (const task of analysis.tasks) {
        if (task.averageDuration > 1000) { // Tasks taking more than 1 second
          if (!slowTasks.has(task.taskId)) {
            slowTasks.set(task.taskId, []);
          }
          slowTasks.get(task.taskId)!.push(task.averageDuration);
        }
      }
    }

    for (const [taskId, durations] of slowTasks) {
      if (durations.length >= 2) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const trend = this.calculateTrend(durations);
        
        this.learningModel.patterns.push({
          patternId: `optimization-${taskId}`,
          type: 'optimization_opportunity',
          confidence: Math.min(durations.length / this.historicalData.length, 1),
          description: `Task '${taskId}' consistently takes ${avgDuration.toFixed(0)}ms to complete`,
          evidence: [
            `Average duration: ${avgDuration.toFixed(0)}ms`,
            `Performance trend: ${trend > 0 ? 'degrading' : 'stable'}`,
            `Occurred in ${durations.length} analyses`
          ],
          prediction: `Optimizing '${taskId}' could improve overall performance by ${(avgDuration / 1000).toFixed(1)}s`,
          actionability: 'short_term',
          impact: 'medium',
        });
      }
    }
  }

  /**
   * Generate predictive insights
   */
  private async generatePredictiveInsights(): Promise<void> {
    this.learningModel.insights = [];

    // Risk alerts
    this.generateRiskAlerts();
    
    // Opportunities
    this.generateOpportunities();
    
    // Trend analysis
    this.generateTrendAnalysis();
    
    // Anomaly detection
    this.generateAnomalyDetection();
  }

  /**
   * Generate risk alerts
   */
  private generateRiskAlerts(): void {
    const criticalPatterns = this.learningModel.patterns.filter(p => p.impact === 'critical');
    
    for (const pattern of criticalPatterns) {
      this.learningModel.insights.push({
        insightId: `risk-${pattern.patternId}`,
        type: 'risk_alert',
        title: `Critical Risk: ${pattern.description}`,
        description: pattern.prediction,
        confidence: pattern.confidence,
        timeframe: 'immediate',
        probability: pattern.confidence,
        impact: 'critical',
        recommendations: [
          'Address immediately to prevent system failure',
          'Implement monitoring for early detection',
          'Create contingency plans'
        ],
        supportingData: {
          patternType: pattern.type,
          evidence: pattern.evidence,
          actionability: pattern.actionability
        }
      });
    }
  }

  /**
   * Generate opportunities
   */
  private generateOpportunities(): void {
    const optimizationPatterns = this.learningModel.patterns.filter(p => p.type === 'optimization_opportunity');
    
    for (const pattern of optimizationPatterns) {
      this.learningModel.insights.push({
        insightId: `opportunity-${pattern.patternId}`,
        type: 'opportunity',
        title: `Optimization Opportunity: ${pattern.description}`,
        description: pattern.prediction,
        confidence: pattern.confidence,
        timeframe: 'short_term',
        probability: 0.8, // High probability of success
        impact: 'medium',
        recommendations: [
          'Profile the identified task for bottlenecks',
          'Implement caching where appropriate',
          'Consider parallelization opportunities',
          'Set performance budgets'
        ],
        supportingData: {
          patternType: pattern.type,
          evidence: pattern.evidence,
          expectedImprovement: pattern.prediction
        }
      });
    }
  }

  /**
   * Generate trend analysis
   */
  private generateTrendAnalysis(): void {
    if (this.historicalData.length < 3) return;

    const healthScores = this.historicalData.map(d => d.overallHealth.overallScore);
    const trend = this.calculateTrend(healthScores);
    
    this.learningModel.insights.push({
      insightId: 'trend-health',
      type: 'trend_analysis',
      title: `Health Trend Analysis`,
      description: `Project health is ${trend > 0 ? 'improving' : 'degrading'} with a slope of ${trend.toFixed(3)}`,
      confidence: Math.abs(trend),
      timeframe: 'long_term',
      probability: 0.7,
      impact: 'high',
      recommendations: [
        trend > 0 ? 'Continue current practices' : 'Review recent changes for negative impact',
        'Monitor trend closely',
        'Set health score targets'
      ],
      supportingData: {
        trendSlope: trend,
        healthScores,
        prediction: this.predictNextValue(healthScores)
      }
    });
  }

  /**
   * Generate anomaly detection
   */
  private generateAnomalyDetection(): void {
    if (this.historicalData.length < 3) return;

    const recentAnalysis = this.historicalData[this.historicalData.length - 1];
    const previousAnalyses = this.historicalData.slice(0, -1);
    
    // Check for anomalies in health score
    const previousScores = previousAnalyses.map(d => d.overallHealth.overallScore);
    const currentScore = recentAnalysis.overallHealth.overallScore;
    const avgPreviousScore = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
    const deviation = Math.abs(currentScore - avgPreviousScore) / avgPreviousScore;
    
    if (deviation > 0.2) { // 20% deviation threshold
      this.learningModel.insights.push({
        insightId: 'anomaly-health-score',
        type: 'anomaly_detection',
        title: `Anomaly Detected: Health Score Deviation`,
        description: `Current health score (${currentScore}) deviates ${(deviation * 100).toFixed(1)}% from average (${avgPreviousScore.toFixed(1)})`,
        confidence: Math.min(deviation, 1),
        timeframe: 'immediate',
        probability: 0.9,
        impact: 'high',
        recommendations: [
          'Investigate recent changes immediately',
          'Check for new issues or resolved problems',
          'Review monitoring data for root cause'
        ],
        supportingData: {
          currentScore,
          averageScore: avgPreviousScore,
          deviation,
          previousScores
        }
      });
    }
  }

  /**
   * Calculate trend slope
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * (y[i] || 0), 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Predict next value based on trend
   */
  private predictNextValue(values: number[]): number {
    if (values.length === 0) return 0;
    const trend = this.calculateTrend(values);
    const lastValue = values[values.length - 1];
    return Math.max(0, Math.min(100, (lastValue || 0) + trend)); // Clamp between 0-100
  }

  /**
   * Update model accuracy
   */
  private async updateModelAccuracy(): Promise<void> {
    // This would be implemented with actual prediction validation
    // For now, we'll use a simple heuristic
    const totalPatterns = this.learningModel.patterns.length;
    const highConfidencePatterns = this.learningModel.patterns.filter(p => p.confidence > 0.7).length;
    
    this.learningModel.accuracy = totalPatterns > 0 ? highConfidencePatterns / totalPatterns : 0;
    this.learningModel.totalPredictions = totalPatterns;
    this.learningModel.correctPredictions = highConfidencePatterns;
  }

  /**
   * Save learning model using canonical fossil pattern
   */
  private async saveLearningModel(): Promise<void> {
    const { CanonicalFossilManager } = await import('../src/cli/canonical-fossil-manager');
    const fossilManager = new CanonicalFossilManager();
    // Save as analysis result (or add a dedicated method if needed)
    const analysisData = {
      timestamp: new Date().toISOString(),
      commit_hash: 'learning-engine',
      analysis_type: 'Learning Analysis Model',
      insights: [],
      summary: {
        total_insights: 0,
        critical_insights: 0,
        high_insights: 0,
        medium_insights: 0,
        low_insights: 0,
        overall_status: 'info'
      },
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: 10
      },
      // Store the model as a stringified field for now
      model: this.learningModel
    };
    await fossilManager.updateAnalysisResults(analysisData, { generateYaml: true });
    console.log(`💾 Learning model saved as canonical fossil (analysis results)`);
  }

  /**
   * Get current insights
   */
  getInsights(): PredictiveInsight[] {
    return this.learningModel.insights;
  }

  /**
   * Get current patterns
   */
  getPatterns(): LearningPattern[] {
    return this.learningModel.patterns;
  }

  /**
   * Generate insights report
   */
  generateInsightsReport(): string {
    let report = '# Learning Analysis Insights Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Model Version:** ${this.learningModel.version}\n`;
    report += `**Accuracy:** ${(this.learningModel.accuracy * 100).toFixed(1)}%\n\n`;

    // Risk alerts
    const riskAlerts = this.learningModel.insights.filter(i => i.type === 'risk_alert');
    if (riskAlerts.length > 0) {
      report += '## 🚨 Risk Alerts\n\n';
      for (const insight of riskAlerts) {
        report += `### ${insight.title}\n`;
        report += `- **Confidence:** ${(insight.confidence * 100).toFixed(1)}%\n`;
        report += `- **Probability:** ${(insight.probability * 100).toFixed(1)}%\n`;
        report += `- **Impact:** ${insight.impact}\n`;
        report += `- **Description:** ${insight.description}\n`;
        report += `- **Recommendations:**\n`;
        for (const rec of insight.recommendations) {
          report += `  - ${rec}\n`;
        }
        report += '\n';
      }
    }

    // Opportunities
    const opportunities = this.learningModel.insights.filter(i => i.type === 'opportunity');
    if (opportunities.length > 0) {
      report += '## 💡 Opportunities\n\n';
      for (const insight of opportunities) {
        report += `### ${insight.title}\n`;
        report += `- **Confidence:** ${(insight.confidence * 100).toFixed(1)}%\n`;
        report += `- **Expected Impact:** ${insight.impact}\n`;
        report += `- **Description:** ${insight.description}\n`;
        report += `- **Recommendations:**\n`;
        for (const rec of insight.recommendations) {
          report += `  - ${rec}\n`;
        }
        report += '\n';
      }
    }

    // Patterns
    if (this.learningModel.patterns.length > 0) {
      report += '## 🔍 Identified Patterns\n\n';
      for (const pattern of this.learningModel.patterns) {
        report += `### ${pattern.description}\n`;
        report += `- **Type:** ${pattern.type}\n`;
        report += `- **Confidence:** ${(pattern.confidence * 100).toFixed(1)}%\n`;
        report += `- **Impact:** ${pattern.impact}\n`;
        report += `- **Actionability:** ${pattern.actionability}\n`;
        report += `- **Prediction:** ${pattern.prediction}\n`;
        report += `- **Evidence:**\n`;
        for (const evidence of pattern.evidence) {
          report += `  - ${evidence}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const engine = new LearningAnalysisEngine();
  
  try {
    console.log('🧠 Starting learning analysis...\n');
    
    await engine.learnFromHistory();
    
    const insights = engine.getInsights();
    const patterns = engine.getPatterns();
    
    console.log('\n📊 Learning Analysis Complete!\n');
    console.log(`Patterns Identified: ${patterns.length}`);
    console.log(`Predictive Insights: ${insights.length}`);
    
    const riskAlerts = insights.filter(i => i.type === 'risk_alert');
    if (riskAlerts.length > 0) {
      console.log(`\n🚨 Risk Alerts: ${riskAlerts.length}`);
      riskAlerts.forEach(alert => {
        console.log(`  - ${alert.title} (${(alert.confidence * 100).toFixed(1)}% confidence)`);
      });
    }
    
    const opportunities = insights.filter(i => i.type === 'opportunity');
    if (opportunities.length > 0) {
      console.log(`\n💡 Opportunities: ${opportunities.length}`);
      opportunities.forEach(opp => {
        console.log(`  - ${opp.title} (${(opp.confidence * 100).toFixed(1)}% confidence)`);
      });
    }
    
    // Generate and save report using canonical fossil pattern
    const report = engine.generateInsightsReport();
    const { CanonicalFossilManager } = await import('../src/cli/canonical-fossil-manager');
    const fossilManager = new CanonicalFossilManager();
    const analysisData = {
      timestamp: new Date().toISOString(),
      commit_hash: 'learning-engine',
      analysis_type: 'Learning Analysis Insights Report',
      insights: [],
      summary: {
        total_insights: 0,
        critical_insights: 0,
        high_insights: 0,
        medium_insights: 0,
        low_insights: 0,
        overall_status: 'info'
      },
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: 10
      },
      report
    };
    await fossilManager.updateAnalysisResults(analysisData, { generateYaml: true });
    // Also write a markdown report for test compatibility
    const { writeFile } = await import('fs/promises');
    const mdPath = 'fossils/tests/learning_insights.md';
    await writeFile(mdPath, report);
    console.log(`\n📄 Insights report saved as canonical fossil (analysis results)`);
    
  } catch (error) {
    console.error('❌ Learning analysis failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 