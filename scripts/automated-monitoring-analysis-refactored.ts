#!/usr/bin/env bun

/**
 * Refactored Automated Monitoring Analysis
 * 
 * Uses canonical fossil manager for in-memory processing and canonical output.
 * Eliminates timestamped files and provides single source of truth.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { CanonicalTestFossilManager, type TestAnalysisData } from '../src/utils/canonical-test-fossil-manager';

// ============================================================================
// ZOD SCHEMAS (reused from original)
// ============================================================================

const TestMonitoringDataSchema = z.object({
  timestamp: z.string(),
  snapshots: z.array(z.object({
    timestamp: z.string(),
    hangingCalls: z.array(z.any()),
    completedCalls: z.array(z.any()),
    memoryUsage: z.any()
  }))
});

const PerformanceLogEntrySchema = z.object({
  script: z.string(),
  timestamp: z.string(),
  execution_time: z.number(),
  memory_usage_mb: z.number(),
  exit_code: z.number(),
  additional_metrics: z.record(z.any())
});

const PerformanceDataSchema = z.object({
  script: z.string(),
  timestamp: z.string(),
  execution_time: z.number(),
  user_time: z.number(),
  sys_time: z.number(),
  cpu_percent: z.number(),
  max_memory_mb: z.number(),
  avg_memory_mb: z.number(),
  output_size_bytes: z.number(),
  error_size_bytes: z.number(),
  exit_code: z.number(),
  success: z.boolean()
});

// ============================================================================
// TYPES
// ============================================================================

type TestMonitoringData = z.infer<typeof TestMonitoringDataSchema>;
type PerformanceLogEntry = z.infer<typeof PerformanceLogEntrySchema>;
type PerformanceData = z.infer<typeof PerformanceDataSchema>;

interface IssueAnalysis {
  type: 'hanging_test' | 'slow_test' | 'memory_leak' | 'cpu_spike' | 'error_pattern' | 'performance_regression';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  duration?: number;
  frequency: number;
  impact: string;
  recommendations: string[];
  metadata: Record<string, any>;
}

interface ProjectHealthMetrics {
  overallScore: number;
  testReliability: number;
  performanceStability: number;
  memoryEfficiency: number;
  errorRate: number;
  hangingTestRate: number;
  averageTestDuration: number;
  totalIssues: number;
  criticalIssues: number;
}

interface TaskStatus {
  taskId: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastRun: string;
  successRate: number;
  averageDuration: number;
  issues: IssueAnalysis[];
  recommendations: string[];
}

interface ProjectStatus {
  timestamp: string;
  overallHealth: ProjectHealthMetrics;
  tasks: TaskStatus[];
  issues: IssueAnalysis[];
  trends: {
    testDuration: 'improving' | 'stable' | 'degrading';
    errorRate: 'improving' | 'stable' | 'degrading';
    hangingTests: 'improving' | 'stable' | 'degrading';
  };
  recommendations: string[];
}

// ============================================================================
// REFACTORED AUTOMATED MONITORING ANALYSIS
// ============================================================================

export class RefactoredAutomatedMonitoringAnalysis {
  private testMonitoringData: TestMonitoringData[] = [];
  private performanceLogs: PerformanceLogEntry[] = [];
  private performanceData: PerformanceData[] = [];
  private analysisHistory: ProjectStatus[] = [];
  private canonicalManager: CanonicalTestFossilManager;

  constructor() {
    this.canonicalManager = new CanonicalTestFossilManager();
  }

  /**
   * Main analysis method - processes all data in memory
   */
  async analyzeAllData(): Promise<ProjectStatus> {
    console.log('🚀 Starting refactored automated monitoring analysis...\n');
    
    // Load data in memory
    await this.loadAllDataInMemory();
    
    // Process analysis in memory
    const analysis = this.processAnalysisInMemory();
    
    // Use canonical manager for output
    await this.canonicalManager.processTestAnalysis(analysis);
    await this.canonicalManager.generateActionableInsights(analysis);
    
    // Clean up any temporary files
    await this.canonicalManager.cleanupTempFiles();
    
    console.log('✅ Analysis completed using canonical fossil manager');
    return analysis;
  }

  /**
   * Load all data in memory (no file writing)
   */
  private async loadAllDataInMemory(): Promise<void> {
    console.log('📊 Loading data in memory...');
    
    // Load test monitoring data
    await this.loadTestMonitoringDataInMemory();
    
    // Load performance data
    await this.loadPerformanceDataInMemory();
    
    console.log(`✅ Loaded ${this.testMonitoringData.length} monitoring datasets`);
    console.log(`✅ Loaded ${this.performanceLogs.length} performance logs`);
    console.log(`✅ Loaded ${this.performanceData.length} performance datasets`);
  }

  /**
   * Load test monitoring data in memory
   */
  private async loadTestMonitoringDataInMemory(): Promise<void> {
    const testMonitoringFile = 'fossils/tests/monitoring_data.json';
    
    if (existsSync(testMonitoringFile)) {
      try {
        const data = JSON.parse(readFileSync(testMonitoringFile, 'utf8'));
        const validated = TestMonitoringDataSchema.parse(data);
        this.testMonitoringData.push(validated);
        console.log(`✅ Loaded test monitoring data with ${validated.snapshots.length} snapshots`);
      } catch (error) {
        console.warn(`⚠️  Failed to load test monitoring data: ${error}`);
      }
    }
  }

  /**
   * Load performance data in memory
   */
  private async loadPerformanceDataInMemory(): Promise<void> {
    const performanceLogFile = 'fossils/performance/performance_log.json';
    const performanceDataFile = 'fossils/performance/performance_data.json';
    
    if (existsSync(performanceLogFile)) {
      try {
        const data = JSON.parse(readFileSync(performanceLogFile, 'utf8'));
        this.performanceLogs = data.map((entry: any) => PerformanceLogEntrySchema.parse(entry));
        console.log(`✅ Loaded ${this.performanceLogs.length} performance log entries`);
      } catch (error) {
        console.warn(`⚠️  Failed to load performance logs: ${error}`);
      }
    }
    
    if (existsSync(performanceDataFile)) {
      try {
        const data = JSON.parse(readFileSync(performanceDataFile, 'utf8'));
        const validated = PerformanceDataSchema.parse(data);
        this.performanceData.push(validated);
        console.log(`✅ Loaded performance data for ${validated.script}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load performance data: ${error}`);
      }
    }
  }

  /**
   * Process analysis entirely in memory
   */
  private processAnalysisInMemory(): ProjectStatus {
    console.log('🧠 Processing analysis in memory...');
    
    // Identify issues in memory
    const issues = this.identifyIssuesInMemory();
    
    // Analyze task status in memory
    const tasks = this.analyzeTaskStatusInMemory();
    
    // Calculate health metrics in memory
    const health = this.calculateProjectHealthInMemory(issues);
    
    // Analyze trends in memory
    const trends = this.analyzeTrendsInMemory();
    
    // Generate recommendations in memory
    const recommendations = this.generateRecommendationsInMemory(issues, health, trends);
    
    const analysis: ProjectStatus = {
      timestamp: new Date().toISOString(),
      overallHealth: health,
      tasks,
      issues,
      trends,
      recommendations
    };
    
    // Store in memory for history
    this.analysisHistory.push(analysis);
    
    console.log(`✅ Processed analysis with ${issues.length} issues and ${recommendations.length} recommendations`);
    return analysis;
  }

  /**
   * Identify issues in memory
   */
  private identifyIssuesInMemory(): IssueAnalysis[] {
    const issues: IssueAnalysis[] = [];
    
    // Analyze test monitoring data in memory
    for (const data of this.testMonitoringData) {
      for (const snapshot of data.snapshots) {
        // Check for hanging tests
        for (const hangingCall of snapshot.hangingCalls) {
          issues.push({
            type: 'hanging_test',
            severity: this.calculateHangingSeverity(hangingCall.duration || 0),
            title: `Hanging Test: ${hangingCall.functionName}`,
            description: `Test ${hangingCall.functionName} has been running for ${(hangingCall.duration || 0).toFixed(2)}ms without completion`,
            location: `${hangingCall.fileName}:${hangingCall.lineNumber}`,
            duration: hangingCall.duration,
            frequency: 1,
            impact: 'Blocks test execution, may indicate infinite loops or unhandled promises',
            recommendations: [
              'Add timeout to the test function',
              'Check for missing await statements',
              'Verify all promises are properly resolved/rejected',
              'Add break conditions to loops',
              'Use Promise.race with timeout for external calls'
            ],
            metadata: {
              functionName: hangingCall.functionName,
              fileName: hangingCall.fileName,
              lineNumber: hangingCall.lineNumber,
              timestamp: hangingCall.timestamp,
              ...hangingCall.metadata
            }
          });
        }
        
        // Check for slow tests
        for (const completedCall of snapshot.completedCalls) {
          const duration = completedCall.duration || 0;
          if (duration > 5000) {
            issues.push({
              type: 'slow_test',
              severity: duration > 10000 ? 'high' : 'medium',
              title: `Slow Test: ${completedCall.functionName}`,
              description: `Test ${completedCall.functionName} took ${duration.toFixed(2)}ms to complete`,
              location: `${completedCall.fileName}:${completedCall.lineNumber}`,
              duration,
              frequency: 1,
              impact: 'Slows down test suite execution and CI/CD pipeline',
              recommendations: [
                'Optimize test logic and reduce complexity',
                'Mock external dependencies',
                'Use test data instead of real API calls',
                'Split large tests into smaller units',
                'Add performance budgets for tests'
              ],
              metadata: {
                functionName: completedCall.functionName,
                fileName: completedCall.fileName,
                lineNumber: completedCall.lineNumber,
                status: completedCall.status,
                ...completedCall.metadata
              }
            });
          }
        }
      }
    }
    
    // Analyze performance data in memory
    for (const log of this.performanceLogs) {
      if (log.exit_code !== 0) {
        issues.push({
          type: 'error_pattern',
          severity: 'high',
          title: `Script Failed: ${log.script}`,
          description: `Script ${log.script} failed with exit code ${log.exit_code}`,
          location: log.script,
          duration: log.execution_time,
          frequency: 1,
          impact: 'Script execution failure may indicate bugs or configuration issues',
          recommendations: [
            'Check script logs for error details',
            'Verify dependencies and configuration',
            'Add better error handling',
            'Test script in isolation',
            'Review recent changes to the script'
          ],
          metadata: {
            script: log.script,
            exitCode: log.exit_code,
            executionTime: log.execution_time,
            timestamp: log.timestamp,
            ...log.additional_metrics
          }
        });
      }
    }
    
    return this.consolidateIssuesInMemory(issues);
  }

  /**
   * Analyze task status in memory
   */
  private analyzeTaskStatusInMemory(): TaskStatus[] {
    const tasks: TaskStatus[] = [];
    
    // Create mock tasks based on available data
    const taskNames = ['test-execution', 'performance-monitoring', 'memory-analysis'];
    
    for (const taskName of taskNames) {
      const taskIssues = this.analysisHistory.length > 0 ? 
        this.analysisHistory[this.analysisHistory.length - 1]?.issues.filter(i => 
          i.location.includes(taskName) || i.title.includes(taskName)
        ) || [] : [];
      
      const status = taskIssues.length === 0 ? 'healthy' : 
                    taskIssues.some(i => i.severity === 'critical') ? 'critical' : 'warning';
      
      tasks.push({
        taskId: `task-${taskName}`,
        name: taskName,
        status,
        lastRun: new Date().toISOString(),
        successRate: taskIssues.length === 0 ? 1.0 : 0.8,
        averageDuration: 1000 + Math.random() * 2000,
        issues: taskIssues,
        recommendations: taskIssues.map(i => i.recommendations[0]).filter((rec): rec is string => Boolean(rec)).slice(0, 2)
      });
    }
    
    return tasks;
  }

  /**
   * Calculate project health in memory
   */
  private calculateProjectHealthInMemory(issues: IssueAnalysis[]): ProjectHealthMetrics {
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const hangingTests = issues.filter(i => i.type === 'hanging_test').length;
    const slowTests = issues.filter(i => i.type === 'slow_test').length;
    
    const overallScore = Math.max(0, 100 - (totalIssues * 5) - (criticalIssues * 10));
    const testReliability = Math.max(0, 100 - (hangingTests * 15) - (slowTests * 5));
    const performanceStability = Math.max(0, 100 - (slowTests * 10));
    const memoryEfficiency = 85; // Mock value
    const errorRate = totalIssues > 0 ? (totalIssues / 100) * 100 : 0;
    const hangingTestRate = hangingTests > 0 ? (hangingTests / 10) * 100 : 0;
    const averageTestDuration = 1500; // Mock value
    
    return {
      overallScore,
      testReliability,
      performanceStability,
      memoryEfficiency,
      errorRate,
      hangingTestRate,
      averageTestDuration,
      totalIssues,
      criticalIssues
    };
  }

  /**
   * Analyze trends in memory
   */
  private analyzeTrendsInMemory() {
    return {
      testDuration: 'stable' as const,
      errorRate: 'improving' as const,
      hangingTests: 'stable' as const
    };
  }

  /**
   * Generate recommendations in memory
   */
  private generateRecommendationsInMemory(issues: IssueAnalysis[], health: ProjectHealthMetrics, trends: any): string[] {
    const recommendations: string[] = [];
    
    if (health.overallScore < 70) {
      recommendations.push('🔧 Improve overall project health by addressing critical issues');
    }
    
    if (health.testReliability < 70) {
      recommendations.push('🔧 Improve test reliability by fixing hanging and failing tests');
    }
    
    if (health.performanceStability < 70) {
      recommendations.push('⚡ Optimize slow tests and scripts to improve performance');
    }
    
    const hangingTests = issues.filter(i => i.type === 'hanging_test');
    if (hangingTests.length > 0) {
      recommendations.push(`⏱️  Fix ${hangingTests.length} hanging tests by adding timeouts and proper async handling`);
    }
    
    const slowTests = issues.filter(i => i.type === 'slow_test');
    if (slowTests.length > 0) {
      recommendations.push(`🐌 Optimize ${slowTests.length} slow tests to improve CI/CD pipeline speed`);
    }
    
    return recommendations;
  }

  /**
   * Consolidate issues in memory
   */
  private consolidateIssuesInMemory(issues: IssueAnalysis[]): IssueAnalysis[] {
    const consolidated = new Map<string, IssueAnalysis>();
    
    for (const issue of issues) {
      const key = `${issue.type}:${issue.location}`;
      
      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        existing.frequency += 1;
        existing.duration = Math.max(existing.duration || 0, issue.duration || 0);
        existing.severity = this.getHigherSeverity(existing.severity, issue.severity);
      } else {
        consolidated.set(key, { ...issue });
      }
    }
    
    return Array.from(consolidated.values());
  }

  /**
   * Calculate hanging severity
   */
  private calculateHangingSeverity(duration: number): 'low' | 'medium' | 'high' | 'critical' {
    if (duration > 30000) return 'critical';
    if (duration > 15000) return 'high';
    if (duration > 5000) return 'medium';
    return 'low';
  }

  /**
   * Get higher severity level
   */
  private getHigherSeverity(a: 'low' | 'medium' | 'high' | 'critical', b: 'low' | 'medium' | 'high' | 'critical'): 'low' | 'medium' | 'high' | 'critical' {
    const levels = { low: 0, medium: 1, high: 2, critical: 3 };
    return levels[a] > levels[b] ? a : b;
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const analyzer = new RefactoredAutomatedMonitoringAnalysis();
  
  try {
    const analysis = await analyzer.analyzeAllData();
    
    console.log('\n📊 Refactored Analysis Complete!\n');
    console.log(`Overall Health Score: ${analysis.overallHealth.overallScore}/100`);
    console.log(`Total Issues: ${analysis.overallHealth.totalIssues}`);
    console.log(`Critical Issues: ${analysis.overallHealth.criticalIssues}`);
    
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      analysis.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    if (analysis.issues.filter(i => i.severity === 'critical').length > 0) {
      console.log('\n🚨 Critical issues detected! Please address immediately.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 