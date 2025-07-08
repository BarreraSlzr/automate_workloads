#!/usr/bin/env bun

/**
 * Canonical Test Fossil Manager
 * 
 * Handles in-memory processing and canonical output for test-related fossils.
 * Eliminates timestamped files and provides single source of truth for test data.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { toFossilEntry, writeFossilToFile } from './fossilize';
import type { ContextEntry } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface TestAnalysisData {
  timestamp: string;
  overallHealth: {
    overallScore: number;
    testReliability: number;
    performanceStability: number;
    memoryEfficiency: number;
    errorRate: number;
    hangingTestRate: number;
    averageTestDuration: number;
    totalIssues: number;
    criticalIssues: number;
  };
  tasks: Array<{
    taskId: string;
    name: string;
    status: string;
    lastRun: string;
    successRate: number;
    averageDuration: number;
    issues: any[];
    recommendations: string[];
  }>;
  issues: any[];
  trends: {
    testDuration: string;
    errorRate: string;
    hangingTests: string;
  };
  recommendations: string[];
}

interface TestMonitoringData {
  timestamp: string;
  snapshots: Array<{
    timestamp: string;
    hangingCalls: any[];
    completedCalls: any[];
    memoryUsage: any;
  }>;
}

interface LearningModelData {
  modelId: string;
  version: string;
  lastUpdated: string;
  patterns: any[];
  insights: any[];
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
}

// ============================================================================
// CANONICAL TEST FOSSIL MANAGER
// ============================================================================

export class CanonicalTestFossilManager {
  private readonly testFossilDir = 'fossils/tests';
  private readonly tempDir = join(this.testFossilDir, 'temp');
  
  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure canonical directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.testFossilDir,
      join(this.testFossilDir, 'results'),
      join(this.testFossilDir, 'analysis'),
      join(this.testFossilDir, 'monitoring'),
      join(this.testFossilDir, 'learning'),
      this.tempDir
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }

    // Create .gitignore in temp directory
    const gitignorePath = join(this.tempDir, '.gitignore');
    try {
      await fs.writeFile(gitignorePath, '*\n', { flag: 'wx' });
    } catch (error) {
      // File might already exist
    }
  }

  /**
   * Process test analysis in memory and write canonical output
   */
  async processTestAnalysis(analysis: TestAnalysisData): Promise<void> {
    // Process in memory
    const processedData = this.processAnalysisInMemory(analysis);
    
    // Create canonical fossil (ensure all required fields)
    const fossil = toFossilEntry({
      type: 'result',
      title: 'Test Analysis Results',
      content: JSON.stringify(processedData, null, 2),
      tags: ['test', 'analysis', 'monitoring'],
      source: 'automated',
      metadata: {
        processedAt: new Date().toISOString(),
        originalTimestamp: analysis.timestamp,
        healthScore: analysis.overallHealth.overallScore,
        totalIssues: analysis.overallHealth.totalIssues,
        criticalIssues: analysis.overallHealth.criticalIssues,
        // Add additional metadata fields if required by schema
        testReliability: analysis.overallHealth.testReliability,
        performanceStability: analysis.overallHealth.performanceStability,
        memoryEfficiency: analysis.overallHealth.memoryEfficiency,
        errorRate: analysis.overallHealth.errorRate,
        hangingTestRate: analysis.overallHealth.hangingTestRate,
        averageTestDuration: analysis.overallHealth.averageTestDuration,
        taskCount: analysis.tasks.length,
        recommendationCount: analysis.recommendations.length,
        trends: analysis.trends,
        recommendations: analysis.recommendations,
        tasks: analysis.tasks
      }
    });

    // Write to canonical location
    const outputPath = join(this.testFossilDir, 'analysis', 'latest_analysis.json');
    await writeFossilToFile(fossil, outputPath);
    
    console.log(`✅ Test analysis processed and saved to: ${outputPath}`);
  }

  /**
   * Process test monitoring data in memory and write canonical output
   */
  async processTestMonitoring(monitoring: TestMonitoringData): Promise<void> {
    // Process in memory
    const processedData = this.processMonitoringInMemory(monitoring);
    
    // Create canonical fossil (ensure all required fields)
    const fossil = toFossilEntry({
      type: 'observation',
      title: 'Test Monitoring Data',
      content: JSON.stringify(processedData, null, 2),
      tags: ['test', 'monitoring'],
      source: 'automated',
      metadata: {
        processedAt: new Date().toISOString(),
        originalTimestamp: monitoring.timestamp,
        snapshotCount: monitoring.snapshots.length,
        // Add additional metadata fields if required by schema
        totalSnapshots: monitoring.snapshots.length,
        totalHangingCalls: monitoring.snapshots.reduce((sum, s) => sum + (s.hangingCalls?.length || 0), 0),
        totalCompletedCalls: monitoring.snapshots.reduce((sum, s) => sum + (s.completedCalls?.length || 0), 0)
      }
    });

    // Write to canonical location
    const outputPath = join(this.testFossilDir, 'monitoring', 'monitoring.data.json');
    await writeFossilToFile(fossil, outputPath);
    
    console.log(`✅ Test monitoring processed and saved to: ${outputPath}`);
  }

  /**
   * Process learning model in memory and write canonical output
   */
  async processLearningModel(model: LearningModelData): Promise<void> {
    // Process in memory
    const processedData = this.processLearningModelInMemory(model);
    
    // Create canonical fossil
    const fossil = toFossilEntry({
      type: 'knowledge',
      title: 'Test Learning Model',
      content: JSON.stringify(processedData, null, 2),
      tags: ['test', 'learning', 'ml'],
      source: 'automated',
      metadata: {
        processedAt: new Date().toISOString(),
        modelId: model.modelId,
        version: model.version,
        accuracy: model.accuracy,
        totalPredictions: model.totalPredictions
      }
    });

    // Write to canonical location
    const outputPath = join(this.testFossilDir, 'learning', 'learning-model.json');
    await writeFossilToFile(fossil, outputPath);
    
    console.log(`✅ Learning model processed and saved to: ${outputPath}`);
  }

  /**
   * Generate actionable insights report in memory and write canonical output
   */
  async generateActionableInsights(analysis: TestAnalysisData): Promise<void> {
    // Generate insights in memory
    const insights = this.generateInsightsInMemory(analysis);
    
    // Create canonical fossil (ensure all required fields)
    const fossil = toFossilEntry({
      type: 'insight',
      title: 'Actionable Test Insights',
      content: insights,
      tags: ['test', 'insights', 'recommendations'],
      source: 'automated',
      metadata: {
        processedAt: new Date().toISOString(),
        originalTimestamp: analysis.timestamp,
        insightCount: analysis.recommendations.length,
        // Add additional metadata fields if required by schema
        healthScore: analysis.overallHealth.overallScore,
        totalIssues: analysis.overallHealth.totalIssues,
        criticalIssues: analysis.overallHealth.criticalIssues
      }
    });

    // Write to canonical location
    const outputPath = join(this.testFossilDir, 'analysis', 'actionable-insights.md');
    await writeFossilToFile(fossil, outputPath);
    
    console.log(`✅ Actionable insights generated and saved to: ${outputPath}`);
  }

  /**
   * Process analysis data in memory
   */
  private processAnalysisInMemory(analysis: TestAnalysisData): any {
    return {
      ...analysis,
      processedAt: new Date().toISOString(),
      summary: {
        healthScore: analysis.overallHealth.overallScore,
        totalIssues: analysis.overallHealth.totalIssues,
        criticalIssues: analysis.overallHealth.criticalIssues,
        taskCount: analysis.tasks.length,
        recommendationCount: analysis.recommendations.length
      }
    };
  }

  /**
   * Process monitoring data in memory
   */
  private processMonitoringInMemory(monitoring: TestMonitoringData): any {
    const totalSnapshots = monitoring.snapshots.length;
    const totalHangingCalls = monitoring.snapshots.reduce(
      (sum, snapshot) => sum + snapshot.hangingCalls.length, 0
    );
    const totalCompletedCalls = monitoring.snapshots.reduce(
      (sum, snapshot) => sum + snapshot.completedCalls.length, 0
    );

    return {
      ...monitoring,
      processedAt: new Date().toISOString(),
      summary: {
        totalSnapshots,
        totalHangingCalls,
        totalCompletedCalls,
        hangingRate: totalSnapshots > 0 ? (totalHangingCalls / totalSnapshots) : 0
      }
    };
  }

  /**
   * Process learning model in memory
   */
  private processLearningModelInMemory(model: LearningModelData): any {
    return {
      ...model,
      processedAt: new Date().toISOString(),
      summary: {
        patternCount: model.patterns.length,
        insightCount: model.insights.length,
        accuracy: model.accuracy,
        predictionSuccess: model.totalPredictions > 0 ? 
          (model.correctPredictions / model.totalPredictions) : 0
      }
    };
  }

  /**
   * Generate insights in memory
   */
  private generateInsightsInMemory(analysis: TestAnalysisData): string {
    let report = '# Actionable Test Insights\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    // Overall health
    report += '## Project Health Overview\n\n';
    report += `- **Overall Score:** ${analysis.overallHealth.overallScore}/100\n`;
    report += `- **Test Reliability:** ${analysis.overallHealth.testReliability.toFixed(1)}%\n`;
    report += `- **Performance Stability:** ${analysis.overallHealth.performanceStability.toFixed(1)}%\n`;
    report += `- **Memory Efficiency:** ${analysis.overallHealth.memoryEfficiency.toFixed(1)}%\n`;
    report += `- **Total Issues:** ${analysis.overallHealth.totalIssues}\n`;
    report += `- **Critical Issues:** ${analysis.overallHealth.criticalIssues}\n\n`;
    
    // Critical issues
    const criticalIssues = analysis.issues.filter((i: any) => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      report += '## 🚨 Critical Issues\n\n';
      for (const issue of criticalIssues) {
        report += `### ${issue.title}\n`;
        report += `- **Location:** ${issue.location}\n`;
        report += `- **Impact:** ${issue.impact}\n`;
        report += `- **Recommendations:**\n`;
        for (const rec of issue.recommendations.slice(0, 3)) {
          report += `  - ${rec}\n`;
        }
        report += '\n';
      }
    }
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      report += '## 💡 Recommendations\n\n';
      for (const rec of analysis.recommendations) {
        report += `- ${rec}\n`;
      }
      report += '\n';
    }
    
    return report;
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        if (file !== '.gitignore') {
          await fs.unlink(join(this.tempDir, file));
        }
      }
      console.log(`✅ Cleaned up ${files.length - 1} temporary files`);
    } catch (error) {
      console.warn(`⚠️ Could not clean up temp files: ${error}`);
    }
  }

  /**
   * Get canonical fossil paths
   */
  getCanonicalPaths(): Record<string, string> {
    return {
      analysis: join(this.testFossilDir, 'analysis', 'latest_analysis.json'),
      monitoring: join(this.testFossilDir, 'monitoring', 'monitoring.data.json'),
      learning: join(this.testFossilDir, 'learning', 'learning-model.json'),
      insights: join(this.testFossilDir, 'analysis', 'actionable-insights.md'),
      temp: this.tempDir
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { TestAnalysisData, TestMonitoringData, LearningModelData }; 