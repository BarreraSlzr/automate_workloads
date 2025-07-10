#!/usr/bin/env bun

/**
 * Automated Monitoring Orchestrator
 * Orchestrates monitoring analysis, learning, and reporting
 * @module scripts/automated-monitoring-orchestrator
 */

import { executeCommand } from '@/utils/cli';

// Import our analysis components
import { RefactoredAutomatedMonitoringAnalysis } from './automated-monitoring-analysis-refactored';
import { LearningAnalysisEngine } from './learning-analysis-engine';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface OrchestrationConfig {
  runTests: boolean;
  runMonitoring: boolean;
  runAnalysis: boolean;
  runLearning: boolean;
  generateReports: boolean;
  testTimeout: number;
  monitoringDuration: number;
  outputDir: string;
}

interface OrchestrationResult {
  success: boolean;
  timestamp: string;
  testResults?: any;
  monitoringResults?: any;
  analysisResults?: any;
  learningResults?: any;
  reports: string[];
  summary: string;
  recommendations: string[];
  nextActions: string[];
}

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class AutomatedMonitoringOrchestrator {
  private config: OrchestrationConfig;
  private results: OrchestrationResult;

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = {
      runTests: true,
      runMonitoring: true,
      runAnalysis: true,
      runLearning: true,
      generateReports: true,
      testTimeout: 300000, // 5 minutes
      monitoringDuration: 60000, // 1 minute
      outputDir: 'fossils/analysis',
      ...config
    };
    
    this.results = {
      success: false,
      timestamp: new Date().toISOString(),
      reports: [],
      summary: '',
      recommendations: [],
      nextActions: []
    };
  }

  /**
   * Run the complete orchestration
   */
  async run(): Promise<OrchestrationResult> {
    console.log('🚀 Starting Automated Monitoring Orchestration\n');
    
    try {
      // Step 1: Run tests with monitoring
      if (this.config.runTests && this.config.runMonitoring) {
        await this.runTestsWithMonitoring();
      }
      
      // Step 2: Run analysis
      if (this.config.runAnalysis) {
        await this.runAnalysis();
      }
      
      // Step 3: Run learning engine
      if (this.config.runLearning) {
        await this.runLearningEngine();
      }
      
      // Step 4: Generate comprehensive reports
      if (this.config.generateReports) {
        await this.generateComprehensiveReports();
      }
      
      // Step 5: Generate summary and recommendations
      this.generateSummaryAndRecommendations();
      
      this.results.success = true;
      
      console.log('\n✅ Orchestration completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Orchestration failed:', error);
      this.results.success = false;
    }
    
    return this.results;
  }

  /**
   * Run tests with monitoring
   */
  private async runTestsWithMonitoring(): Promise<void> {
    console.log('🧪 Running tests with monitoring...');
    
    try {
      // Run the test monitoring script
      const command = `bun run scripts/test-monitoring-wrapper.sh`;
      const result = (await executeCommand(command)).stdout;
      
      this.results.testResults = {
        success: true,
        output: result,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Tests with monitoring completed');
      
    } catch (error: any) {
      console.warn('⚠️  Tests with monitoring failed:', error.message);
      this.results.testResults = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run analysis using canonical pattern
   */
  private async runAnalysis(): Promise<void> {
    console.log('📊 Running automated analysis using canonical pattern...');
    
    try {
      // Use the refactored analysis that uses canonical fossil manager
      const analyzer = new RefactoredAutomatedMonitoringAnalysis();
      const analysis = await analyzer.analyzeAllData();
      
      this.results.analysisResults = analysis;
      console.log('✅ Analysis completed using canonical pattern');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Run learning engine using canonical pattern
   */
  private async runLearningEngine(): Promise<void> {
    console.log('🧠 Running learning engine using canonical pattern...');
    
    try {
      const engine = new LearningAnalysisEngine('fossils/tests');
      await engine.learnFromHistory();
      
      this.results.learningResults = {
        patterns: engine.getPatterns(),
        insights: engine.getInsights(),
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Learning engine completed using canonical pattern');
      
    } catch (error) {
      console.error('❌ Learning engine failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive reports using canonical fossil pattern
   */
  private async generateComprehensiveReports(): Promise<void> {
    console.log('📄 Generating comprehensive reports using canonical fossil pattern...');
    
    // Generate technical debt report
    const technicalDebtReport = this.generateTechnicalDebtReport();
    await this.saveCanonicalFossil('technical-debt-report.md', technicalDebtReport, 'Technical Debt Analysis Report');
    
    // Generate issue tracking report
    const issueTrackingReport = this.generateIssueTrackingReport();
    await this.saveCanonicalFossil('issue-tracking-report.md', issueTrackingReport, 'Issue Tracking Report');
    
    // Generate project status report
    const projectStatusReport = this.generateProjectStatusReport();
    await this.saveCanonicalFossil('project_status-report.md', projectStatusReport, 'Project Status Report');
    
    // Generate actionable insights report
    const actionableInsightsReport = this.generateActionableInsightsReport();
    await this.saveCanonicalFossil('actionable-insights-report.md', actionableInsightsReport, 'Actionable Insights Report');
    
    console.log(`✅ Generated ${this.results.reports.length} canonical reports`);
  }

  /**
   * Save report as canonical fossil
   */
  private async saveCanonicalFossil(filename: string, content: string, title: string): Promise<void> {
    // Use CanonicalFossilManager for canonical fossilization
    const { CanonicalFossilManager } = await import('../src/cli/canonical-fossil-manager');
    const fossilManager = new CanonicalFossilManager();
    const analysisData = {
      timestamp: new Date().toISOString(),
      commit_hash: 'orchestrator',
      analysis_type: title,
      insights: [
        {
          type: 'orchestration',
          severity: 'medium' as 'medium',
          description: content,
          recommendations: []
        }
      ],
      summary: {
        total_insights: 1,
        critical_insights: 0,
        high_insights: 0,
        medium_insights: 1,
        low_insights: 0,
        overall_status: 'info'
      },
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: 10
      }
    };
    // Save as analysis result
    const canonicalPath = await fossilManager.updateAnalysisResults(analysisData, { generateYaml: true });
    this.results.reports.push(canonicalPath);
    // Also write a markdown report for test compatibility
    const { writeFile } = await import('fs/promises');
    const mdPath = filename.endsWith('.md') ? filename : filename.replace(/\.json$/, '.md');
    await writeFile(mdPath, content);
    this.results.reports.push(mdPath);
  }

  /**
   * Generate technical debt report
   */
  private generateTechnicalDebtReport(): string {
    let report = '# Technical Debt Analysis Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    if (this.results.analysisResults) {
      const analysis = this.results.analysisResults;
      
      report += '## Overall Technical Debt Score\n\n';
      report += `- **Health Score:** ${analysis.overallHealth.overallScore}/100\n`;
      report += `- **Total Issues:** ${analysis.overallHealth.totalIssues}\n`;
      report += `- **Critical Issues:** ${analysis.overallHealth.criticalIssues}\n\n`;
      
      // Categorize issues by type
      const issuesByType = new Map<string, any[]>();
      for (const issue of analysis.issues) {
        if (!issuesByType.has(issue.type)) {
          issuesByType.set(issue.type, []);
        }
        issuesByType.get(issue.type)!.push(issue);
      }
      
      report += '## Issues by Category\n\n';
      for (const [type, issues] of issuesByType) {
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const highCount = issues.filter(i => i.severity === 'high').length;
        
        report += `### ${this.formatIssueType(type)}\n`;
        report += `- **Total:** ${issues.length}\n`;
        report += `- **Critical:** ${criticalCount}\n`;
        report += `- **High:** ${highCount}\n\n`;
        
        // Show top issues
        const topIssues = issues
          .sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
          })
          .slice(0, 3);
        
        for (const issue of topIssues) {
          report += `#### ${issue.title}\n`;
          report += `- **Severity:** ${issue.severity}\n`;
          report += `- **Location:** ${issue.location}\n`;
          report += `- **Impact:** ${issue.impact}\n`;
          if (issue.duration) {
            report += `- **Duration:** ${issue.duration.toFixed(2)}ms\n`;
          }
          report += `- **Recommendations:**\n`;
          for (const rec of issue.recommendations.slice(0, 2)) {
            report += `  - ${rec}\n`;
          }
          report += '\n';
        }
      }
    }
    
    return report;
  }

  /**
   * Generate issue tracking report
   */
  private generateIssueTrackingReport(): string {
    let report = '# Issue Tracking Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    if (this.results.analysisResults) {
      const analysis = this.results.analysisResults;
      
      // Group issues by location
      const issuesByLocation = new Map<string, any[]>();
      for (const issue of analysis.issues) {
        const location = issue.location.split(':')[0]; // Just the file
        if (!issuesByLocation.has(location)) {
          issuesByLocation.set(location, []);
        }
        issuesByLocation.get(location)!.push(issue);
      }
      
      report += '## Issues by File\n\n';
      for (const [location, issues] of issuesByLocation) {
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const highCount = issues.filter(i => i.severity === 'high').length;
        
        report += `### ${location}\n`;
        report += `- **Total Issues:** ${issues.length}\n`;
        report += `- **Critical:** ${criticalCount}\n`;
        report += `- **High:** ${highCount}\n\n`;
        
        for (const issue of issues) {
          report += `#### ${issue.title}\n`;
          report += `- **Type:** ${this.formatIssueType(issue.type)}\n`;
          report += `- **Severity:** ${issue.severity}\n`;
          report += `- **Line:** ${issue.location.split(':')[1] || 'N/A'}\n`;
          report += `- **Description:** ${issue.description}\n`;
          report += `- **Frequency:** ${issue.frequency} occurrences\n`;
          report += `- **Recommendations:**\n`;
          for (const rec of issue.recommendations) {
            report += `  - ${rec}\n`;
          }
          report += '\n';
        }
      }
    }
    
    return report;
  }

  /**
   * Generate project status report
   */
  private generateProjectStatusReport(): string {
    let report = '# Project Status Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    if (this.results.analysisResults) {
      const analysis = this.results.analysisResults;
      
      report += '## Overall Project Health\n\n';
      report += `- **Health Score:** ${analysis.overallHealth.overallScore}/100\n`;
      report += `- **Test Reliability:** ${analysis.overallHealth.testReliability.toFixed(1)}%\n`;
      report += `- **Performance Stability:** ${analysis.overallHealth.performanceStability.toFixed(1)}%\n`;
      report += `- **Memory Efficiency:** ${analysis.overallHealth.memoryEfficiency.toFixed(1)}%\n`;
      report += `- **Error Rate:** ${analysis.overallHealth.errorRate.toFixed(1)}%\n`;
      report += `- **Hanging Test Rate:** ${analysis.overallHealth.hangingTestRate.toFixed(1)}%\n`;
      report += `- **Average Test Duration:** ${analysis.overallHealth.averageTestDuration.toFixed(2)}ms\n\n`;
      
      // Task status
      report += '## Task Status Overview\n\n';
      const tasksByStatus = new Map<string, any[]>();
      for (const task of analysis.tasks) {
        if (!tasksByStatus.has(task.status)) {
          tasksByStatus.set(task.status, []);
        }
        tasksByStatus.get(task.status)!.push(task);
      }
      
      for (const [status, tasks] of tasksByStatus) {
        const emoji = status === 'healthy' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
        report += `### ${emoji} ${status.toUpperCase()} (${tasks.length})\n\n`;
        
        for (const task of tasks) {
          report += `#### ${task.name}\n`;
          report += `- **Success Rate:** ${(task.successRate * 100).toFixed(1)}%\n`;
          report += `- **Average Duration:** ${task.averageDuration.toFixed(2)}ms\n`;
          report += `- **Last Run:** ${task.lastRun}\n`;
          if (task.recommendations.length > 0) {
            report += `- **Recommendations:** ${task.recommendations.join(', ')}\n`;
          }
          report += '\n';
        }
      }
      
      // Trends
      report += '## Trends\n\n';
      report += `- **Test Duration:** ${analysis.trends.testDuration}\n`;
      report += `- **Error Rate:** ${analysis.trends.errorRate}\n`;
      report += `- **Hanging Tests:** ${analysis.trends.hangingTests}\n\n`;
    }
    
    return report;
  }

  /**
   * Generate actionable insights report
   */
  private generateActionableInsightsReport(): string {
    let report = '# Actionable Insights Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    // Analysis recommendations
    if (this.results.analysisResults) {
      const analysis = this.results.analysisResults;
      
      report += '## Immediate Actions Required\n\n';
      const criticalIssues = analysis.issues.filter((i: any) => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        report += `🚨 **${criticalIssues.length} Critical Issues Need Immediate Attention**\n\n`;
        for (const issue of criticalIssues) {
          report += `### ${issue.title}\n`;
          report += `- **Location:** ${issue.location}\n`;
          report += `- **Impact:** ${issue.impact}\n`;
          report += `- **Priority:** IMMEDIATE\n`;
          report += `- **Actions:**\n`;
          for (const rec of issue.recommendations) {
            report += `  - ${rec}\n`;
          }
          report += '\n';
        }
      } else {
        report += '✅ No critical issues requiring immediate attention\n\n';
      }
      
      // General recommendations
      if (analysis.recommendations.length > 0) {
        report += '## General Recommendations\n\n';
        for (const rec of analysis.recommendations) {
          report += `- ${rec}\n`;
        }
        report += '\n';
      }
    }
    
    // Learning insights
    if (this.results.learningResults) {
      const learning = this.results.learningResults;
      
      if (learning.insights.length > 0) {
        report += '## Predictive Insights\n\n';
        
        const riskAlerts = learning.insights.filter((i: any) => i.type === 'risk_alert');
        if (riskAlerts.length > 0) {
          report += '### 🚨 Risk Alerts\n\n';
          for (const insight of riskAlerts) {
            report += `#### ${insight.title}\n`;
            report += `- **Confidence:** ${(insight.confidence * 100).toFixed(1)}%\n`;
            report += `- **Timeframe:** ${insight.timeframe}\n`;
            report += `- **Description:** ${insight.description}\n`;
            report += `- **Actions:**\n`;
            for (const rec of insight.recommendations) {
              report += `  - ${rec}\n`;
            }
            report += '\n';
          }
        }
        
        const opportunities = learning.insights.filter((i: any) => i.type === 'opportunity');
        if (opportunities.length > 0) {
          report += '### 💡 Opportunities\n\n';
          for (const insight of opportunities) {
            report += `#### ${insight.title}\n`;
            report += `- **Confidence:** ${(insight.confidence * 100).toFixed(1)}%\n`;
            report += `- **Expected Impact:** ${insight.impact}\n`;
            report += `- **Description:** ${insight.description}\n`;
            report += `- **Actions:**\n`;
            for (const rec of insight.recommendations) {
              report += `  - ${rec}\n`;
            }
            report += '\n';
          }
        }
      }
    }
    
    return report;
  }

  /**
   * Generate summary and recommendations
   */
  private generateSummaryAndRecommendations(): void {
    let summary = '';
    const recommendations: string[] = [];
    const nextActions: string[] = [];
    
    if (this.results.analysisResults) {
      const analysis = this.results.analysisResults;
      
      summary = `Project Health: ${analysis.overallHealth.overallScore}/100 | `;
      summary += `Issues: ${analysis.overallHealth.totalIssues} | `;
      summary += `Critical: ${analysis.overallHealth.criticalIssues}`;
      
      // Generate recommendations
      if (analysis.overallHealth.criticalIssues > 0) {
        recommendations.push('🚨 Address critical issues immediately');
        nextActions.push('Review critical issues in technical debt report');
      }
      
      if (analysis.overallHealth.overallScore < 70) {
        recommendations.push('📊 Project health needs improvement');
        nextActions.push('Review project status report for improvement areas');
      }
      
      if (analysis.overallHealth.hangingTestRate < 80) {
        recommendations.push('⏱️ Fix hanging tests to improve reliability');
        nextActions.push('Check issue tracking report for hanging test details');
      }
      
      // Add analysis recommendations
      recommendations.push(...analysis.recommendations);
    }
    
    if (this.results.learningResults) {
      const learning = this.results.learningResults;
      
      const riskAlerts = learning.insights.filter((i: any) => i.type === 'risk_alert');
      if (riskAlerts.length > 0) {
        recommendations.push(`🚨 ${riskAlerts.length} risk alerts detected`);
        nextActions.push('Review actionable insights report for risk details');
      }
      
      const opportunities = learning.insights.filter((i: any) => i.type === 'opportunity');
      if (opportunities.length > 0) {
        recommendations.push(`💡 ${opportunities.length} optimization opportunities identified`);
        nextActions.push('Review actionable insights report for opportunities');
      }
    }
    
    this.results.summary = summary;
    this.results.recommendations = recommendations;
    this.results.nextActions = nextActions;
  }

  /**
   * Format issue type for display
   */
  private formatIssueType(type: string): string {
    const typeMap: Record<string, string> = {
      'hanging_test': 'Hanging Test',
      'slow_test': 'Slow Test',
      'memory_leak': 'Memory Leak',
      'cpu_spike': 'CPU Spike',
      'error_pattern': 'Error Pattern',
      'performance_regression': 'Performance Regression'
    };
    
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  const config: Partial<OrchestrationConfig> = {
    runTests: !args.includes('--no-tests'),
    runMonitoring: !args.includes('--no-monitoring'),
    runAnalysis: !args.includes('--no-analysis'),
    runLearning: !args.includes('--no-learning'),
    generateReports: !args.includes('--no-reports'),
  };
  
  if (args.includes('--quick')) {
    config.testTimeout = 60000; // 1 minute
    config.monitoringDuration = 30000; // 30 seconds
  }
  
  const orchestrator = new AutomatedMonitoringOrchestrator(config);
  
  try {
    const result = await orchestrator.run();
    
    console.log('\n📋 Summary:');
    console.log(result.summary);
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    if (result.nextActions.length > 0) {
      console.log('\n🎯 Next Actions:');
      result.nextActions.forEach(action => {
        console.log(`  - ${action}`);
      });
    }
    
    if (result.reports.length > 0) {
      console.log('\n📄 Reports Generated:');
      result.reports.forEach(report => {
        console.log(`  - ${report}`);
      });
    }
    
    if (!result.success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 