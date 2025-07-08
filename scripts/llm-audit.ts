#!/usr/bin/env bun

/**
 * LLM Call Audit Script
 * 
 * Analyzes LLM call snapshots and generates comprehensive audit reports
 * for intelligent validation and improvement tracking.
 */

import fs from 'fs/promises';
import path from 'path';
import { LLMPlanningService } from '../src/cli/llm-plan';

interface AuditConfig {
  snapshotPath: string;
  outputPath: string;
  minPassRate: number;
  minAverageScore: number;
  generateDetailedReport: boolean;
  analyzeTrends: boolean;
}

interface AuditResult {
  summary: {
    totalSnapshots: number;
    passedSnapshots: number;
    passRate: number;
    averageScore: number;
    overallStatus: 'pass' | 'fail' | 'warning';
  };
  issues: {
    critical: string[];
    warnings: string[];
    recommendations: string[];
  };
  trends: {
    scoreTrend: 'improving' | 'declining' | 'stable';
    passRateTrend: 'improving' | 'declining' | 'stable';
    topIssues: string[];
  };
  details: {
    snapshots: any[];
    validationStats: any;
  };
}

/**
 * Load and analyze LLM call snapshots
 */
async function loadSnapshots(snapshotPath: string): Promise<any[]> {
  try {
    const files = await fs.readdir(snapshotPath);
    const snapshotFiles = files.filter(f => f.endsWith('.json'));
    
    const snapshots = [];
    for (const file of snapshotFiles) {
      try {
        const content = await fs.readFile(path.join(snapshotPath, file), 'utf-8');
        const snapshot = JSON.parse(content);
        snapshots.push(snapshot);
      } catch (error) {
        console.warn(`⚠️ Failed to load snapshot ${file}:`, error);
      }
    }
    
    return snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.warn(`⚠️ Failed to read snapshot directory ${snapshotPath}:`, error);
    return [];
  }
}

/**
 * Analyze snapshots and generate audit result
 */
function analyzeSnapshots(snapshots: any[], config: AuditConfig): AuditResult {
  if (snapshots.length === 0) {
    return {
      summary: {
        totalSnapshots: 0,
        passedSnapshots: 0,
        passRate: 0,
        averageScore: 0,
        overallStatus: 'warning'
      },
      issues: {
        critical: ['No snapshots found for analysis'],
        warnings: [],
        recommendations: ['Run tests to generate LLM call snapshots']
      },
      trends: {
        scoreTrend: 'stable',
        passRateTrend: 'stable',
        topIssues: []
      },
      details: {
        snapshots: [],
        validationStats: {}
      }
    };
  }

  const passedSnapshots = snapshots.filter(s => s.validation?.passed);
  const passRate = snapshots.length > 0 ? passedSnapshots.length / snapshots.length : 0;
  const averageScore = snapshots.length > 0 
    ? snapshots.reduce((sum, s) => sum + (s.validation?.score || 0), 0) / snapshots.length 
    : 0;

  // Determine overall status
  let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
  if (passRate < config.minPassRate || averageScore < config.minAverageScore) {
    overallStatus = 'fail';
  } else if (passRate < config.minPassRate + 0.1 || averageScore < config.minAverageScore + 0.1) {
    overallStatus = 'warning';
  }

  // Collect issues and recommendations
  const allIssues = snapshots.flatMap(s => s.validation?.issues || []);
  const allRecommendations = snapshots.flatMap(s => s.validation?.recommendations || []);
  
  const issueCounts = allIssues.reduce((acc, issue) => {
    acc[issue] = (acc[issue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalIssues = Object.entries(issueCounts)
    .filter(([, count]) => (count as number) > snapshots.length * 0.3) // Issues affecting >30% of calls
    .map(([issue]) => issue);

  const warnings = Object.entries(issueCounts)
    .filter(([, count]) => (count as number) > snapshots.length * 0.1 && (count as number) <= snapshots.length * 0.3)
    .map(([issue]) => issue);

  const recommendations = [...new Set(allRecommendations)];

  // Analyze trends
  const recentSnapshots = snapshots.slice(-10); // Last 10 snapshots
  const olderSnapshots = snapshots.slice(0, -10); // Earlier snapshots
  
  let scoreTrend: 'improving' | 'declining' | 'stable' = 'stable';
  let passRateTrend: 'improving' | 'declining' | 'stable' = 'stable';

  if (recentSnapshots.length > 0 && olderSnapshots.length > 0) {
    const recentAvgScore = recentSnapshots.reduce((sum, s) => sum + (s.validation?.score || 0), 0) / recentSnapshots.length;
    const olderAvgScore = olderSnapshots.reduce((sum, s) => sum + (s.validation?.score || 0), 0) / olderSnapshots.length;
    
    if (recentAvgScore > olderAvgScore + 0.1) scoreTrend = 'improving';
    else if (recentAvgScore < olderAvgScore - 0.1) scoreTrend = 'declining';

    const recentPassRate = recentSnapshots.filter(s => s.validation?.passed).length / recentSnapshots.length;
    const olderPassRate = olderSnapshots.filter(s => s.validation?.passed).length / olderSnapshots.length;
    
    if (recentPassRate > olderPassRate + 0.1) passRateTrend = 'improving';
    else if (recentPassRate < olderPassRate - 0.1) passRateTrend = 'declining';
  }

  const topIssues = Object.entries(issueCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([issue]) => issue);

  return {
    summary: {
      totalSnapshots: snapshots.length,
      passedSnapshots: passedSnapshots.length,
      passRate,
      averageScore,
      overallStatus
    },
    issues: {
      critical: criticalIssues,
      warnings,
      recommendations
    },
    trends: {
      scoreTrend,
      passRateTrend,
      topIssues
    },
    details: {
      snapshots: config.generateDetailedReport ? snapshots : [],
      validationStats: {
        issueCounts,
        methodBreakdown: snapshots.reduce((acc, s) => {
          const method = s.method || 'unknown';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        testNameBreakdown: snapshots.reduce((acc, s) => {
          if (s.testName) {
            acc[s.testName] = (acc[s.testName] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      }
    }
  };
}

/**
 * Generate audit report
 */
function generateAuditReport(result: AuditResult, config: AuditConfig): string {
  const { summary, issues, trends } = result;
  
  const statusIcon = summary.overallStatus === 'pass' ? '✅' : 
                    summary.overallStatus === 'warning' ? '⚠️' : '❌';
  
  return `# LLM Call Audit Report

Generated: ${new Date().toISOString()}
Status: ${statusIcon} ${summary.overallStatus.toUpperCase()}

## Summary
- **Total Snapshots**: ${summary.totalSnapshots}
- **Passed Snapshots**: ${summary.passedSnapshots}
- **Pass Rate**: ${(summary.passRate * 100).toFixed(1)}% (min: ${(config.minPassRate * 100).toFixed(1)}%)
- **Average Score**: ${(summary.averageScore * 100).toFixed(1)}% (min: ${(config.minAverageScore * 100).toFixed(1)}%)

## Trends
- **Score Trend**: ${trends.scoreTrend} ${trends.scoreTrend === 'improving' ? '📈' : trends.scoreTrend === 'declining' ? '📉' : '➡️'}
- **Pass Rate Trend**: ${trends.passRateTrend} ${trends.passRateTrend === 'improving' ? '📈' : trends.passRateTrend === 'declining' ? '📉' : '➡️'}

## Issues

### Critical Issues ${issues.critical.length > 0 ? '🚨' : '✅'}
${issues.critical.length > 0 ? issues.critical.map(issue => `- ${issue}`).join('\n') : 'None'}

### Warnings ${issues.warnings.length > 0 ? '⚠️' : '✅'}
${issues.warnings.length > 0 ? issues.warnings.map(issue => `- ${issue}`).join('\n') : 'None'}

## Top Issues by Frequency
${trends.topIssues.map(issue => `- ${issue}`).join('\n')}

## Recommendations
${issues.recommendations.length > 0 ? issues.recommendations.map(rec => `- ${rec}`).join('\n') : 'No specific recommendations'}

## Recent Snapshots
${result.details.snapshots.slice(-5).map(s => 
  `- ${s.id}: ${s.validation?.passed ? '✅' : '❌'} (${(s.validation?.score * 100).toFixed(0)}%) - ${s.testName || 'unnamed'}`
).join('\n')}

---
*Audit completed with ${summary.totalSnapshots} snapshots analyzed*
`;
}

/**
 * Main audit function
 */
async function runLLMAudit(config: Partial<AuditConfig> = {}): Promise<AuditResult> {
  const defaultConfig: AuditConfig = {
    snapshotPath: 'fossils/llm-planning-snapshots/',
    outputPath: 'fossils/llm-audit-reports/',
    minPassRate: 0.8, // 80% pass rate required
    minAverageScore: 0.7, // 70% average score required
    generateDetailedReport: true,
    analyzeTrends: true
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  console.log('🔍 Starting LLM Call Audit...');
  console.log(`📁 Loading snapshots from: ${finalConfig.snapshotPath}`);
  
  const snapshots = await loadSnapshots(finalConfig.snapshotPath);
  console.log(`📊 Loaded ${snapshots.length} snapshots`);
  
  const result = analyzeSnapshots(snapshots, finalConfig);
  
  // Generate and save report
  const report = generateAuditReport(result, finalConfig);
  
  try {
    await fs.mkdir(finalConfig.outputPath, { recursive: true });
    const reportPath = path.join(finalConfig.outputPath, `llm-audit-${Date.now()}.md`);
    await fs.writeFile(reportPath, report);
    console.log(`📄 Audit report saved to: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️ Failed to save audit report:', error);
  }
  
  // Print summary to console
  console.log('\n📋 Audit Summary:');
  console.log(`Status: ${result.summary.overallStatus.toUpperCase()}`);
  console.log(`Pass Rate: ${(result.summary.passRate * 100).toFixed(1)}%`);
  console.log(`Average Score: ${(result.summary.averageScore * 100).toFixed(1)}%`);
  
  if (result.issues.critical.length > 0) {
    console.log(`🚨 Critical Issues: ${result.issues.critical.length}`);
  }
  if (result.issues.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${result.issues.warnings.length}`);
  }
  
  return result;
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  
  const config: Partial<AuditConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--snapshot-path':
        config.snapshotPath = args[++i] || '';
        break;
      case '--output-path':
        config.outputPath = args[++i] || '';
        break;
      case '--min-pass-rate':
        config.minPassRate = parseFloat(args[++i] || '0.8');
        break;
      case '--min-average-score':
        config.minAverageScore = parseFloat(args[++i] || '0.7');
        break;
      case '--help':
        console.log(`
LLM Call Audit Script

Usage: bun run scripts/llm-audit.ts [options]

Options:
  --snapshot-path <path>     Path to snapshot directory (default: fossils/llm-planning-snapshots/)
  --output-path <path>       Path to output reports (default: fossils/llm-audit-reports/)
  --min-pass-rate <rate>     Minimum pass rate (0-1, default: 0.8)
  --min-average-score <score> Minimum average score (0-1, default: 0.7)
  --help                     Show this help message

Examples:
  bun run scripts/llm-audit.ts
  bun run scripts/llm-audit.ts --min-pass-rate 0.9 --min-average-score 0.8
        `);
        process.exit(0);
    }
  }
  
  runLLMAudit(config)
    .then(result => {
      process.exit(result.summary.overallStatus === 'pass' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export { runLLMAudit, type AuditResult, type AuditConfig }; 