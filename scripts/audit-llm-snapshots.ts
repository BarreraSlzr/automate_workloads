#!/usr/bin/env bun

/**
 * LLM Snapshot Audit Script
 * 
 * Audits LLM call snapshots and analyzes bun test snapshot changes
 * that need LLM call insights for comprehensive fossil analysis.
 */

import { Command } from 'commander';
import { ContextFossilService } from '../src/cli/context-fossil';
import { executeCommand, safeParseJSON } from '../src/utils/cli';
import { LLMSnapshotExporter } from '../src/utils/llmSnapshotExporter';
import { exportLLMSnapshot } from '../src/utils/llmSnapshotExporter';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('audit-llm-snapshots')
  .description('Audit LLM call snapshots and analyze test changes requiring LLM insights')
  .version('1.0.0');

interface AuditResult {
  timestamp: string;
  fossilCount: number;
  llmCalls: LLMCallAudit[];
  testChanges: TestChangeAudit[];
  insights: string[];
  recommendations: string[];
  qualityMetrics: QualityMetrics;
}

interface LLMCallAudit {
  fossilId: string;
  type: string;
  timestamp: string;
  model: string;
  context: string;
  purpose: string;
  valueScore: number;
  qualityScore: number;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  preprocessing?: {
    success: boolean;
    changes: string[];
  };
  sessionId?: string;
  commitRef: string;
}

interface TestChangeAudit {
  file: string;
  changeType: 'added' | 'modified' | 'deleted';
  linesChanged: number;
  needsLLMInsights: boolean;
  llmInsightReason: string;
  testPatterns: string[];
  fossilizationStatus: 'pending' | 'completed' | 'failed';
}

interface QualityMetrics {
  averageQualityScore: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    veryPoor: number;
  };
  validationSuccessRate: number;
  preprocessingSuccessRate: number;
  commonIssues: Array<{
    issue: string;
    frequency: number;
    impact: string;
  }>;
}

class LLMSnapshotAuditor {
  private fossilService: ContextFossilService;
  private snapshotExporter: LLMSnapshotExporter;

  constructor() {
    this.fossilService = new ContextFossilService();
    this.snapshotExporter = new LLMSnapshotExporter();
  }

  async initialize() {
    await this.fossilService.initialize();
  }

  /**
   * Audit all LLM call snapshots
   */
  async auditLLMSnapshots(timeRange?: { start: string; end: string }): Promise<AuditResult> {
    console.log('🔍 Auditing LLM call snapshots...');

    const result: AuditResult = {
      timestamp: new Date().toISOString(),
      fossilCount: 0,
      llmCalls: [],
      testChanges: [],
      insights: [],
      recommendations: [],
      qualityMetrics: {
        averageQualityScore: 0,
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 },
        validationSuccessRate: 0,
        preprocessingSuccessRate: 0,
        commonIssues: []
      }
    };

    try {
      // Step 1: Load all LLM-related fossils
      const fossils = await this.fossilService.queryEntries({
        tags: ['llm'],
        limit: 1000,
        offset: 0
      });

      result.fossilCount = fossils.length;
      console.log(`📊 Found ${fossils.length} LLM-related fossils`);

      // Step 2: Analyze each fossil
      for (const fossil of fossils) {
        const llmCall = await this.analyzeLLMCall(fossil);
        if (llmCall) {
          result.llmCalls.push(llmCall);
        }
      }

      // Step 3: Analyze test changes
      result.testChanges = await this.analyzeTestChanges();

      // Step 4: Calculate quality metrics
      result.qualityMetrics = this.calculateQualityMetrics(result.llmCalls);

      // Step 5: Generate insights and recommendations
      result.insights = this.generateInsights(result);
      result.recommendations = this.generateRecommendations(result);

      return result;

    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    }
  }

  /**
   * Analyze individual LLM call fossil
   */
  private async analyzeLLMCall(fossil: any): Promise<LLMCallAudit | null> {
    try {
      // Parse fossil content
      const content = typeof fossil.content === 'string' ? safeParseJSON<any>(fossil.content, 'fossil content') : fossil.content;

      if (!content || !content.type || !content.type.includes('llm')) {
        return null;
      }

      const llmCall: LLMCallAudit = {
        fossilId: fossil.id,
        type: content.type,
        timestamp: content.timestamp || fossil.createdAt,
        model: content.metadata?.model || 'unknown',
        context: content.metadata?.context || 'unknown',
        purpose: content.metadata?.purpose || 'unknown',
        valueScore: content.metadata?.valueScore || 0,
        qualityScore: content.validation?.qualityScore || 0,
        validation: {
          isValid: content.validation?.isValid || false,
          errors: content.validation?.errors || [],
          warnings: content.validation?.warnings || []
        },
        preprocessing: content.preprocessing ? {
          success: content.preprocessing.success || false,
          changes: content.preprocessing.changes || []
        } : undefined,
        sessionId: content.sessionId,
        commitRef: content.commitRef || 'unknown'
      };

      return llmCall;

    } catch (error) {
      console.warn(`⚠️ Failed to analyze fossil ${fossil.id}:`, error);
      return null;
    }
  }

  /**
   * Analyze test changes that need LLM insights
   */
  private async analyzeTestChanges(): Promise<TestChangeAudit[]> {
    console.log('🧪 Analyzing test changes...');

    const testChanges: TestChangeAudit[] = [];

    try {
      // Get git diff for test files
      const diffResult = await executeCommand('git diff --name-only');
      if (!diffResult.success) {
        console.warn('⚠️ Could not get git diff');
        return testChanges;
      }

      const changedFiles = diffResult.stdout.split('\n').filter(Boolean);
      const testFiles = changedFiles.filter(file => 
        file.includes('test') || file.includes('spec') || file.endsWith('.test.ts') || file.endsWith('.spec.ts')
      );

      console.log(`📁 Found ${testFiles.length} changed test files`);

      for (const file of testFiles) {
        const changeAudit = await this.analyzeTestFile(file);
        if (changeAudit) {
          testChanges.push(changeAudit);
        }
      }

    } catch (error) {
      console.warn('⚠️ Failed to analyze test changes:', error);
    }

    return testChanges;
  }

  /**
   * Analyze individual test file for LLM insight needs
   */
  private async analyzeTestFile(filePath: string): Promise<TestChangeAudit | null> {
    try {
      // Get file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Get git diff for this file
      const diffResult = await executeCommand(`git diff ${filePath}`);
      if (!diffResult.success) {
        return null;
      }

      const diff = diffResult.stdout;
      const linesChanged = diff.split('\n').filter(line => line.startsWith('+') || line.startsWith('-')).length;

      // Analyze if file needs LLM insights
      const needsLLMInsights = this.needsLLMInsights(content, diff);
      const llmInsightReason = this.getLLMInsightReason(content, diff);
      const testPatterns = this.extractTestPatterns(content);

      // Check fossilization status
      const fossilizationStatus = await this.checkFossilizationStatus(filePath);

      return {
        file: filePath,
        changeType: this.getChangeType(diff),
        linesChanged,
        needsLLMInsights,
        llmInsightReason,
        testPatterns,
        fossilizationStatus
      };

    } catch (error) {
      console.warn(`⚠️ Failed to analyze test file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Determine if test file needs LLM insights
   */
  private needsLLMInsights(content: string, diff: string): boolean {
    const llmPatterns = [
      /callLLM/,
      /LLMService/,
      /fossiliz/,
      /snapshot/,
      /validation/,
      /preprocessing/,
      /quality.*analysis/,
      /enhanced.*llm/i
    ];

    const diffPatterns = [
      /\+.*callLLM/,
      /\+.*LLMService/,
      /\+.*fossiliz/,
      /\+.*snapshot/,
      /\+.*validation/,
      /\+.*preprocessing/
    ];

    // Check if content contains LLM-related patterns
    const hasLLMPatterns = llmPatterns.some(pattern => pattern.test(content));
    
    // Check if diff contains new LLM-related code
    const hasNewLLMCode = diffPatterns.some(pattern => pattern.test(diff));

    return hasLLMPatterns || hasNewLLMCode;
  }

  /**
   * Get reason why LLM insights are needed
   */
  private getLLMInsightReason(content: string, diff: string): string {
    const reasons = [];

    if (content.includes('callLLM')) reasons.push('Contains LLM calls');
    if (content.includes('fossiliz')) reasons.push('Contains fossilization logic');
    if (content.includes('snapshot')) reasons.push('Contains snapshot operations');
    if (content.includes('validation')) reasons.push('Contains validation logic');
    if (diff.includes('+.*callLLM')) reasons.push('Added new LLM calls');
    if (diff.includes('+.*fossiliz')) reasons.push('Added fossilization code');

    return reasons.length > 0 ? reasons.join(', ') : 'No specific LLM patterns detected';
  }

  /**
   * Extract test patterns from content
   */
  private extractTestPatterns(content: string): string[] {
    const patterns = [];
    
    if (content.includes('test(')) patterns.push('bun:test');
    if (content.includes('describe(')) patterns.push('describe');
    if (content.includes('it(')) patterns.push('it');
    if (content.includes('expect(')) patterns.push('expect');
    if (content.includes('beforeEach(')) patterns.push('beforeEach');
    if (content.includes('afterEach(')) patterns.push('afterEach');

    return patterns;
  }

  /**
   * Get change type from git diff
   */
  private getChangeType(diff: string): 'added' | 'modified' | 'deleted' {
    if (diff.startsWith('--- /dev/null')) return 'added';
    if (diff.includes('deleted file mode')) return 'deleted';
    return 'modified';
  }

  /**
   * Check fossilization status for test file
   */
  private async checkFossilizationStatus(filePath: string): Promise<'pending' | 'completed' | 'failed'> {
    try {
      // Check if there are fossils related to this file
      const fossils = await this.fossilService.queryEntries({
        search: filePath,
        tags: ['llm', 'test'],
        limit: 10,
        offset: 0
      });

      if (fossils.length === 0) return 'pending';
      
      // Check if any fossils have validation errors
      const hasErrors = fossils.some(fossil => {
        const content = typeof fossil.content === 'string' ? safeParseJSON<any>(fossil.content, 'fossil content') : fossil.content;
        return content.validation?.errors?.length > 0;
      });

      return hasErrors ? 'failed' : 'completed';

    } catch (error) {
      return 'pending';
    }
  }

  /**
   * Calculate quality metrics from LLM calls
   */
  private calculateQualityMetrics(llmCalls: LLMCallAudit[]): QualityMetrics {
    if (llmCalls.length === 0) {
      return {
        averageQualityScore: 0,
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 },
        validationSuccessRate: 0,
        preprocessingSuccessRate: 0,
        commonIssues: []
      };
    }

    const qualityScores = llmCalls.map(call => call.qualityScore);
    const averageQualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    // Calculate quality distribution
    const qualityDistribution = {
      excellent: qualityScores.filter(score => score >= 0.8).length,
      good: qualityScores.filter(score => score >= 0.6 && score < 0.8).length,
      fair: qualityScores.filter(score => score >= 0.4 && score < 0.6).length,
      poor: qualityScores.filter(score => score >= 0.2 && score < 0.4).length,
      veryPoor: qualityScores.filter(score => score < 0.2).length
    };

    // Calculate success rates
    const validationSuccessRate = llmCalls.filter(call => call.validation.isValid).length / llmCalls.length;
    const preprocessingSuccessRate = llmCalls.filter(call => call.preprocessing?.success).length / llmCalls.length;

    // Analyze common issues
    const allErrors = llmCalls.flatMap(call => call.validation.errors);
    const allWarnings = llmCalls.flatMap(call => call.validation.warnings);
    
    const errorFrequency = allErrors.reduce((acc, error) => {
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(errorFrequency)
      .map(([issue, frequency]) => ({
        issue,
        frequency,
        impact: frequency > 2 ? 'high' : frequency > 1 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      averageQualityScore,
      qualityDistribution,
      validationSuccessRate,
      preprocessingSuccessRate,
      commonIssues
    };
  }

  /**
   * Generate insights from audit results
   */
  private generateInsights(result: AuditResult): string[] {
    const insights = [];

    // Fossil count insights
    if (result.fossilCount === 0) {
      insights.push('No LLM fossils found - fossilization may not be working correctly');
    } else {
      insights.push(`Found ${result.fossilCount} LLM fossils for analysis`);
    }

    // Quality insights
    if (result.qualityMetrics.averageQualityScore < 0.6) {
      insights.push('Average quality score is below threshold - consider improving input validation');
    }

    if (result.qualityMetrics.validationSuccessRate < 0.8) {
      insights.push('Validation success rate is low - review validation logic');
    }

    // Test change insights
    const needsInsights = result.testChanges.filter(change => change.needsLLMInsights);
    if (needsInsights.length > 0) {
      insights.push(`${needsInsights.length} test files need LLM insights for proper fossilization`);
    }

    const pendingFossilization = result.testChanges.filter(change => change.fossilizationStatus === 'pending');
    if (pendingFossilization.length > 0) {
      insights.push(`${pendingFossilization.length} test files have pending fossilization`);
    }

    return insights;
  }

  /**
   * Generate recommendations from audit results
   */
  private generateRecommendations(result: AuditResult): string[] {
    const recommendations = [];

    // Quality recommendations
    if (result.qualityMetrics.averageQualityScore < 0.6) {
      recommendations.push('Improve input validation and preprocessing to increase quality scores');
    }

    if (result.qualityMetrics.commonIssues.length > 0) {
      const topIssue = result.qualityMetrics.commonIssues[0];
      recommendations.push(`Address common issue: "${topIssue?.issue}" (frequency: ${topIssue?.frequency})`);
    }

    // Test change recommendations
    const needsInsights = result.testChanges.filter(change => change.needsLLMInsights);
    if (needsInsights.length > 0) {
      recommendations.push('Run LLM insight generation for test files that need fossilization');
    }

    const failedFossilization = result.testChanges.filter(change => change.fossilizationStatus === 'failed');
    if (failedFossilization.length > 0) {
      recommendations.push('Review and fix fossilization failures in test files');
    }

    // General recommendations
    if (result.llmCalls.length === 0) {
      recommendations.push('Enable fossilization in LLM service configuration');
      recommendations.push('Ensure test mode is disabled to capture real LLM calls');
    }

    return recommendations;
  }

  /**
   * Export audit results
   */
  async exportAuditResults(result: AuditResult, format: 'json' | 'yaml' | 'markdown'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `llm-snapshot-audit-${timestamp}`;

    let content: string;
    let extension: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(result, null, 2);
        extension = 'json';
        break;
      case 'yaml':
        const yaml = await import('yaml');
        content = yaml.stringify(result);
        extension = 'yml';
        break;
      case 'markdown':
        content = this.generateMarkdownReport(result);
        extension = 'md';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const outputPath = `fossils/audit/${filename}.${extension}`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content, 'utf-8');

    return outputPath;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(result: AuditResult): string {
    let markdown = `# LLM Snapshot Audit Report\n\n`;
    markdown += `**Generated:** ${result.timestamp}\n\n`;

    // Summary
    markdown += `## 📊 Summary\n\n`;
    markdown += `- **Total Fossils:** ${result.fossilCount}\n`;
    markdown += `- **LLM Calls:** ${result.llmCalls.length}\n`;
    markdown += `- **Test Changes:** ${result.testChanges.length}\n`;
    markdown += `- **Average Quality Score:** ${(result.qualityMetrics.averageQualityScore * 100).toFixed(1)}%\n\n`;

    // Quality Metrics
    markdown += `## 📈 Quality Metrics\n\n`;
    markdown += `- **Validation Success Rate:** ${(result.qualityMetrics.validationSuccessRate * 100).toFixed(1)}%\n`;
    markdown += `- **Preprocessing Success Rate:** ${(result.qualityMetrics.preprocessingSuccessRate * 100).toFixed(1)}%\n\n`;

    markdown += `### Quality Distribution\n`;
    markdown += `- Excellent (80-100%): ${result.qualityMetrics.qualityDistribution.excellent}\n`;
    markdown += `- Good (60-80%): ${result.qualityMetrics.qualityDistribution.good}\n`;
    markdown += `- Fair (40-60%): ${result.qualityMetrics.qualityDistribution.fair}\n`;
    markdown += `- Poor (20-40%): ${result.qualityMetrics.qualityDistribution.poor}\n`;
    markdown += `- Very Poor (0-20%): ${result.qualityMetrics.qualityDistribution.veryPoor}\n\n`;

    // Test Changes
    if (result.testChanges.length > 0) {
      markdown += `## 🧪 Test Changes Analysis\n\n`;
      markdown += `| File | Change Type | Lines | Needs LLM Insights | Status |\n`;
      markdown += `|------|-------------|-------|-------------------|--------|\n`;
      
      for (const change of result.testChanges) {
        markdown += `| ${change.file} | ${change.changeType} | ${change.linesChanged} | ${change.needsLLMInsights ? '✅' : '❌'} | ${change.fossilizationStatus} |\n`;
      }
      markdown += `\n`;
    }

    // Insights
    if (result.insights.length > 0) {
      markdown += `## 💡 Insights\n\n`;
      for (const insight of result.insights) {
        markdown += `- ${insight}\n`;
      }
      markdown += `\n`;
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      markdown += `## 🎯 Recommendations\n\n`;
      for (const recommendation of result.recommendations) {
        markdown += `- ${recommendation}\n`;
      }
      markdown += `\n`;
    }

    return markdown;
  }
}

// CLI Commands

program
  .command('audit')
  .description('Audit LLM call snapshots and test changes')
  .option('-f, --format <format>', 'Export format (json, yaml, markdown)', 'markdown')
  .option('--start-date <date>', 'Start date for analysis (ISO format)')
  .option('--end-date <date>', 'End date for analysis (ISO format)')
  .action(async (options) => {
    try {
      console.log('🔍 Starting LLM Snapshot Audit...');
      
      const auditor = new LLMSnapshotAuditor();
      await auditor.initialize();

      const timeRange = options.startDate || options.endDate ? {
        start: options.startDate || '1970-01-01T00:00:00Z',
        end: options.endDate || new Date().toISOString()
      } : undefined;

      const result = await auditor.auditLLMSnapshots(timeRange);

      // Export results
      const outputPath = await auditor.exportAuditResults(result, options.format as any);
      
      console.log('✅ Audit completed successfully!');
      console.log(`📁 Results exported to: ${outputPath}`);
      console.log(`📊 Summary:`);
      console.log(`   - Fossils analyzed: ${result.fossilCount}`);
      console.log(`   - LLM calls found: ${result.llmCalls.length}`);
      console.log(`   - Test changes: ${result.testChanges.length}`);
      console.log(`   - Average quality: ${(result.qualityMetrics.averageQualityScore * 100).toFixed(1)}%`);

      if (result.insights.length > 0) {
        console.log('\n💡 Key Insights:');
        result.insights.slice(0, 3).forEach(insight => console.log(`   - ${insight}`));
      }

      if (result.recommendations.length > 0) {
        console.log('\n🎯 Top Recommendations:');
        result.recommendations.slice(0, 3).forEach(rec => console.log(`   - ${rec}`));
      }

    } catch (error) {
      console.error('❌ Audit failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('export-snapshot')
  .description('Export current LLM snapshots for analysis')
  .option('-f, --format <format>', 'Export format (yaml, json, markdown, chat)', 'yaml')
  .option('--include-metadata', 'Include metadata in export', true)
  .option('--include-validation', 'Include validation data', true)
  .option('--include-preprocessing', 'Include preprocessing data', true)
  .action(async (options) => {
    try {
      console.log('📸 Exporting LLM snapshots...');
      
      const result = await exportLLMSnapshot({
        format: options.format as any,
        includeMetadata: options.includeMetadata,
        includeTimestamps: true,
        includeValidation: options.includeValidation,
        includePreprocessing: options.includePreprocessing
      });

      console.log('✅ Snapshot export completed!');
      console.log(`📁 Output: ${result.outputPath}`);
      console.log(`📊 Fossils: ${result.metadata.fossilCount || 'unknown'}`);
      console.log(`📏 Size: ${(result.metadata.totalSize / 1024).toFixed(2)} KB`);

    } catch (error) {
      console.error('❌ Export failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('analyze-test-changes')
  .description('Analyze test changes that need LLM insights')
  .option('-o, --output <file>', 'Output file for analysis results')
  .action(async (options) => {
    try {
      console.log('🧪 Analyzing test changes for LLM insights...');
      
      const auditor = new LLMSnapshotAuditor();
      await auditor.initialize();

      const testChanges = await auditor['analyzeTestChanges']();

      console.log(`📊 Found ${testChanges.length} test changes:`);
      
      const needsInsights = testChanges.filter(change => change.needsLLMInsights);
      const pendingFossilization = testChanges.filter(change => change.fossilizationStatus === 'pending');
      const failedFossilization = testChanges.filter(change => change.fossilizationStatus === 'failed');

      console.log(`   - Need LLM insights: ${needsInsights.length}`);
      console.log(`   - Pending fossilization: ${pendingFossilization.length}`);
      console.log(`   - Failed fossilization: ${failedFossilization.length}`);

      if (needsInsights.length > 0) {
        console.log('\n📋 Files needing LLM insights:');
        needsInsights.forEach(change => {
          console.log(`   - ${change.file}: ${change.llmInsightReason}`);
        });
      }

      if (options.output) {
        const content = JSON.stringify(testChanges, null, 2);
        await fs.writeFile(options.output, content, 'utf-8');
        console.log(`\n📁 Analysis saved to: ${options.output}`);
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

if (import.meta.main) {
  program.parse();
} 