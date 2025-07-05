#!/usr/bin/env bun

/**
 * Bun Test Snapshot Analysis Script
 * 
 * Analyzes bun test snapshot changes and identifies which ones need
 * LLM call insights for proper fossilization and audit trails.
 */

import { Command } from 'commander';
import { executeCommand } from '../src/utils/cli';
import { ContextFossilService } from '../src/cli/context-fossil';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('analyze-bun-test-snapshots')
  .description('Analyze bun test snapshot changes requiring LLM call insights')
  .version('1.0.0');

interface TestSnapshotAnalysis {
  timestamp: string;
  testFiles: TestFileAnalysis[];
  llmInsightNeeds: LLMInsightNeed[];
  fossilizationGaps: FossilizationGap[];
  recommendations: string[];
  summary: TestSummary;
}

interface TestFileAnalysis {
  file: string;
  changeType: 'added' | 'modified' | 'deleted';
  linesChanged: number;
  testPatterns: string[];
  llmPatterns: string[];
  fossilizationStatus: 'pending' | 'completed' | 'failed' | 'not_needed';
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

interface LLMInsightNeed {
  file: string;
  reason: string;
  patterns: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: string;
  impact: string;
}

interface FossilizationGap {
  file: string;
  gapType: 'missing_validation' | 'missing_preprocessing' | 'missing_quality_metrics' | 'missing_session_tracking';
  description: string;
  severity: 'low' | 'medium' | 'high';
  fixRequired: boolean;
}

interface TestSummary {
  totalTestFiles: number;
  needsLLMInsights: number;
  pendingFossilization: number;
  failedFossilization: number;
  highRiskFiles: number;
  criticalInsights: number;
}

class BunTestSnapshotAnalyzer {
  private fossilService: ContextFossilService;

  constructor() {
    this.fossilService = new ContextFossilService();
  }

  async initialize() {
    await this.fossilService.initialize();
  }

  /**
   * Analyze bun test snapshot changes
   */
  async analyzeTestSnapshots(): Promise<TestSnapshotAnalysis> {
    console.log('🧪 Analyzing bun test snapshot changes...');

    const analysis: TestSnapshotAnalysis = {
      timestamp: new Date().toISOString(),
      testFiles: [],
      llmInsightNeeds: [],
      fossilizationGaps: [],
      recommendations: [],
      summary: {
        totalTestFiles: 0,
        needsLLMInsights: 0,
        pendingFossilization: 0,
        failedFossilization: 0,
        highRiskFiles: 0,
        criticalInsights: 0
      }
    };

    try {
      // Step 1: Get changed test files
      const testFiles = await this.getChangedTestFiles();
      analysis.testFiles = [];
      analysis.summary.totalTestFiles = testFiles.length;

      console.log(`📁 Found ${testFiles.length} changed test files`);

      // Step 2: Analyze each test file
      for (const testFile of testFiles) {
        try {
          const fileAnalysis = await this.analyzeTestFile(testFile);
          if (fileAnalysis) {
            analysis.testFiles.push(fileAnalysis);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to analyze test file ${testFile}:`, error);
        }
      }

      // Step 3: Identify LLM insight needs
      analysis.llmInsightNeeds = this.identifyLLMInsightNeeds(analysis.testFiles);

      // Step 4: Identify fossilization gaps
      analysis.fossilizationGaps = await this.identifyFossilizationGaps(analysis.testFiles);

      // Step 5: Update summary
      analysis.summary = this.calculateSummary(analysis);

      // Step 6: Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get changed test files from git
   */
  private async getChangedTestFiles(): Promise<string[]> {
    try {
      // Get all changed files
      const diffResult = await executeCommand('git diff --name-only');
      if (!diffResult.success) {
        console.warn('⚠️ Could not get git diff');
        return [];
      }

      const changedFiles = diffResult.stdout.split('\n').filter(Boolean);
      
      // Filter for test files
      const testFiles = changedFiles.filter(file => 
        file.includes('test') || 
        file.includes('spec') || 
        file.endsWith('.test.ts') || 
        file.endsWith('.spec.ts') ||
        file.endsWith('.test.js') ||
        file.endsWith('.spec.js') ||
        file.includes('/tests/') ||
        file.includes('/test/')
      );

      return testFiles;

    } catch (error) {
      console.warn('⚠️ Failed to get changed test files:', error);
      return [];
    }
  }

  /**
   * Analyze individual test file
   */
  private async analyzeTestFile(filePath: string): Promise<TestFileAnalysis | null> {
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

      // Analyze patterns
      const testPatterns = this.extractTestPatterns(content);
      const llmPatterns = this.extractLLMPatterns(content, diff);
      
      // Determine complexity and risk
      const complexity = this.assessComplexity(content, diff);
      const riskLevel = this.assessRiskLevel(content, diff, llmPatterns);

      // Check fossilization status
      const fossilizationStatus = await this.checkFossilizationStatus(filePath);

      return {
        file: filePath,
        changeType: this.getChangeType(diff),
        linesChanged,
        testPatterns,
        llmPatterns,
        fossilizationStatus,
        complexity,
        riskLevel
      };

    } catch (error) {
      console.warn(`⚠️ Failed to analyze test file ${filePath}:`, error);
      return null;
    }
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
    if (content.includes('beforeAll(')) patterns.push('beforeAll');
    if (content.includes('afterAll(')) patterns.push('afterAll');
    if (content.includes('mock(')) patterns.push('mock');
    if (content.includes('spyOn(')) patterns.push('spyOn');

    return patterns;
  }

  /**
   * Extract LLM patterns from content and diff
   */
  private extractLLMPatterns(content: string, diff: string): string[] {
    const patterns = [];
    
    // Content patterns
    if (content.includes('callLLM')) patterns.push('callLLM');
    if (content.includes('LLMService')) patterns.push('LLMService');
    if (content.includes('fossiliz')) patterns.push('fossilization');
    if (content.includes('snapshot')) patterns.push('snapshot');
    if (content.includes('validation')) patterns.push('validation');
    if (content.includes('preprocessing')) patterns.push('preprocessing');
    if (content.includes('quality.*analysis')) patterns.push('quality_analysis');
    if (content.includes('enhanced.*llm')) patterns.push('enhanced_llm');

    // Diff patterns (new additions)
    if (diff.includes('+.*callLLM')) patterns.push('new_callLLM');
    if (diff.includes('+.*LLMService')) patterns.push('new_LLMService');
    if (diff.includes('+.*fossiliz')) patterns.push('new_fossilization');
    if (diff.includes('+.*snapshot')) patterns.push('new_snapshot');
    if (diff.includes('+.*validation')) patterns.push('new_validation');

    return patterns;
  }

  /**
   * Assess test complexity
   */
  private assessComplexity(content: string, diff: string): 'low' | 'medium' | 'high' {
    const lines = content.split('\n').length;
    const diffLines = diff.split('\n').filter(line => line.startsWith('+') || line.startsWith('-')).length;
    
    // Count test functions
    const testFunctions = (content.match(/test\(|it\(|describe\(/g) || []).length;
    
    // Count async operations
    const asyncOps = (content.match(/async|await|Promise/g) || []).length;
    
    // Count mock operations
    const mockOps = (content.match(/mock|spyOn|jest\.fn/g) || []).length;

    const complexityScore = lines * 0.1 + diffLines * 0.2 + testFunctions * 0.3 + asyncOps * 0.2 + mockOps * 0.2;

    if (complexityScore < 10) return 'low';
    if (complexityScore < 25) return 'medium';
    return 'high';
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(content: string, diff: string, llmPatterns: string[]): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // LLM patterns increase risk
    riskScore += llmPatterns.length * 2;

    // New LLM code increases risk
    if (llmPatterns.some(p => p.startsWith('new_'))) {
      riskScore += 5;
    }

    // Complex operations increase risk
    if (content.includes('async')) riskScore += 1;
    if (content.includes('Promise')) riskScore += 1;
    if (content.includes('mock')) riskScore += 1;

    // File size increases risk
    const lines = content.split('\n').length;
    if (lines > 100) riskScore += 2;
    if (lines > 200) riskScore += 3;

    if (riskScore < 3) return 'low';
    if (riskScore < 8) return 'medium';
    return 'high';
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
  private async checkFossilizationStatus(filePath: string): Promise<'pending' | 'completed' | 'failed' | 'not_needed'> {
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
        const content = typeof fossil.content === 'string' ? JSON.parse(fossil.content) : fossil.content;
        return content.validation?.errors?.length > 0;
      });

      if (hasErrors) return 'failed';
      return 'completed';

    } catch (error) {
      return 'pending';
    }
  }

  /**
   * Identify LLM insight needs
   */
  private identifyLLMInsightNeeds(testFiles: TestFileAnalysis[]): LLMInsightNeed[] {
    const needs: LLMInsightNeed[] = [];

    for (const testFile of testFiles) {
      if (testFile.llmPatterns.length === 0) continue;

      const need: LLMInsightNeed = {
        file: testFile.file,
        reason: this.getLLMInsightReason(testFile),
        patterns: testFile.llmPatterns,
        priority: this.calculatePriority(testFile),
        estimatedEffort: this.estimateEffort(testFile),
        impact: this.assessImpact(testFile)
      };

      needs.push(need);
    }

    return needs.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get LLM insight reason
   */
  private getLLMInsightReason(testFile: TestFileAnalysis): string {
    const reasons = [];

    if (testFile.llmPatterns.includes('callLLM')) reasons.push('Contains LLM calls');
    if (testFile.llmPatterns.includes('fossilization')) reasons.push('Contains fossilization logic');
    if (testFile.llmPatterns.includes('snapshot')) reasons.push('Contains snapshot operations');
    if (testFile.llmPatterns.includes('validation')) reasons.push('Contains validation logic');
    if (testFile.llmPatterns.some(p => p.startsWith('new_'))) reasons.push('Added new LLM functionality');

    return reasons.length > 0 ? reasons.join(', ') : 'LLM patterns detected';
  }

  /**
   * Calculate priority for LLM insight need
   */
  private calculatePriority(testFile: TestFileAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    let priority = 0;

    // Risk level affects priority
    if (testFile.riskLevel === 'high') priority += 3;
    if (testFile.riskLevel === 'medium') priority += 2;
    if (testFile.riskLevel === 'low') priority += 1;

    // Complexity affects priority
    if (testFile.complexity === 'high') priority += 2;
    if (testFile.complexity === 'medium') priority += 1;

    // New LLM code is critical
    if (testFile.llmPatterns.some(p => p.startsWith('new_'))) priority += 4;

    // Failed fossilization is high priority
    if (testFile.fossilizationStatus === 'failed') priority += 3;

    if (priority >= 8) return 'critical';
    if (priority >= 6) return 'high';
    if (priority >= 4) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort for LLM insight generation
   */
  private estimateEffort(testFile: TestFileAnalysis): string {
    const baseEffort = testFile.linesChanged * 0.1;
    const complexityMultiplier = testFile.complexity === 'high' ? 2 : testFile.complexity === 'medium' ? 1.5 : 1;
    const riskMultiplier = testFile.riskLevel === 'high' ? 1.5 : testFile.riskLevel === 'medium' ? 1.2 : 1;

    const totalEffort = baseEffort * complexityMultiplier * riskMultiplier;

    if (totalEffort < 1) return 'low (< 1 hour)';
    if (totalEffort < 3) return 'medium (1-3 hours)';
    if (totalEffort < 6) return 'high (3-6 hours)';
    return 'very high (> 6 hours)';
  }

  /**
   * Assess impact of LLM insight need
   */
  private assessImpact(testFile: TestFileAnalysis): string {
    if (testFile.riskLevel === 'high' && testFile.complexity === 'high') {
      return 'Critical - affects core functionality and has high risk';
    }
    if (testFile.riskLevel === 'high') {
      return 'High - affects functionality with high risk';
    }
    if (testFile.complexity === 'high') {
      return 'Medium - affects complex functionality';
    }
    return 'Low - affects simple functionality with low risk';
  }

  /**
   * Identify fossilization gaps
   */
  private async identifyFossilizationGaps(testFiles: TestFileAnalysis[]): Promise<FossilizationGap[]> {
    const gaps: FossilizationGap[] = [];

    for (const testFile of testFiles) {
      if (testFile.llmPatterns.length === 0) continue;

      // Check for missing validation
      if (!testFile.llmPatterns.includes('validation')) {
        gaps.push({
          file: testFile.file,
          gapType: 'missing_validation',
          description: 'LLM calls lack validation logic',
          severity: testFile.riskLevel === 'high' ? 'high' : 'medium',
          fixRequired: testFile.riskLevel === 'high'
        });
      }

      // Check for missing preprocessing
      if (!testFile.llmPatterns.includes('preprocessing')) {
        gaps.push({
          file: testFile.file,
          gapType: 'missing_preprocessing',
          description: 'LLM calls lack preprocessing logic',
          severity: 'medium',
          fixRequired: false
        });
      }

      // Check for missing quality metrics
      if (!testFile.llmPatterns.includes('quality_analysis')) {
        gaps.push({
          file: testFile.file,
          gapType: 'missing_quality_metrics',
          description: 'LLM calls lack quality metrics',
          severity: 'low',
          fixRequired: false
        });
      }

      // Check for missing session tracking
      if (!testFile.llmPatterns.includes('session')) {
        gaps.push({
          file: testFile.file,
          gapType: 'missing_session_tracking',
          description: 'LLM calls lack session tracking',
          severity: 'medium',
          fixRequired: false
        });
      }
    }

    return gaps;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(analysis: TestSnapshotAnalysis): TestSummary {
    const needsLLMInsights = analysis.testFiles.filter(f => f.llmPatterns.length > 0).length;
    const pendingFossilization = analysis.testFiles.filter(f => f.fossilizationStatus === 'pending').length;
    const failedFossilization = analysis.testFiles.filter(f => f.fossilizationStatus === 'failed').length;
    const highRiskFiles = analysis.testFiles.filter(f => f.riskLevel === 'high').length;
    const criticalInsights = analysis.llmInsightNeeds.filter(n => n.priority === 'critical').length;

    return {
      totalTestFiles: analysis.testFiles.length,
      needsLLMInsights: needsLLMInsights,
      pendingFossilization: pendingFossilization,
      failedFossilization: failedFossilization,
      highRiskFiles: highRiskFiles,
      criticalInsights: criticalInsights
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analysis: TestSnapshotAnalysis): string[] {
    const recommendations = [];

    // Critical insights
    if (analysis.summary.criticalInsights > 0) {
      recommendations.push(`Address ${analysis.summary.criticalInsights} critical LLM insight needs immediately`);
    }

    // High risk files
    if (analysis.summary.highRiskFiles > 0) {
      recommendations.push(`Review ${analysis.summary.highRiskFiles} high-risk test files for proper fossilization`);
    }

    // Failed fossilization
    if (analysis.summary.failedFossilization > 0) {
      recommendations.push(`Fix ${analysis.summary.failedFossilization} failed fossilization attempts`);
    }

    // Pending fossilization
    if (analysis.summary.pendingFossilization > 0) {
      recommendations.push(`Complete fossilization for ${analysis.summary.pendingFossilization} pending test files`);
    }

    // Fossilization gaps
    const highSeverityGaps = analysis.fossilizationGaps.filter(g => g.severity === 'high');
    if (highSeverityGaps.length > 0) {
      recommendations.push(`Fix ${highSeverityGaps.length} high-severity fossilization gaps`);
    }

    // General recommendations
    if (analysis.summary.needsLLMInsights > 0) {
      recommendations.push('Run LLM insight generation for test files with LLM patterns');
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate action required - all test files are properly fossilized');
    }

    return recommendations;
  }

  /**
   * Export analysis results
   */
  async exportAnalysis(analysis: TestSnapshotAnalysis, format: 'json' | 'yaml' | 'markdown'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bun-test-snapshot-analysis-${timestamp}`;

    let content: string;
    let extension: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(analysis, null, 2);
        extension = 'json';
        break;
      case 'yaml':
        const yaml = await import('yaml');
        content = yaml.stringify(analysis);
        extension = 'yml';
        break;
      case 'markdown':
        content = this.generateMarkdownReport(analysis);
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
  private generateMarkdownReport(analysis: TestSnapshotAnalysis): string {
    let markdown = `# Bun Test Snapshot Analysis Report\n\n`;
    markdown += `**Generated:** ${analysis.timestamp}\n\n`;

    // Summary
    markdown += `## 📊 Summary\n\n`;
    markdown += `- **Total Test Files:** ${analysis.summary.totalTestFiles}\n`;
    markdown += `- **Need LLM Insights:** ${analysis.summary.needsLLMInsights}\n`;
    markdown += `- **Pending Fossilization:** ${analysis.summary.pendingFossilization}\n`;
    markdown += `- **Failed Fossilization:** ${analysis.summary.failedFossilization}\n`;
    markdown += `- **High Risk Files:** ${analysis.summary.highRiskFiles}\n`;
    markdown += `- **Critical Insights:** ${analysis.summary.criticalInsights}\n\n`;

    // Test Files Analysis
    if (analysis.testFiles.length > 0) {
      markdown += `## 🧪 Test Files Analysis\n\n`;
      markdown += `| File | Change | Lines | LLM Patterns | Risk | Status |\n`;
      markdown += `|------|--------|-------|--------------|------|--------|\n`;
      
      for (const testFile of analysis.testFiles) {
        const llmPatterns = testFile.llmPatterns.length > 0 ? testFile.llmPatterns.join(', ') : 'None';
        const riskEmoji = testFile.riskLevel === 'high' ? '🔴' : testFile.riskLevel === 'medium' ? '🟡' : '🟢';
        markdown += `| ${testFile.file} | ${testFile.changeType} | ${testFile.linesChanged} | ${llmPatterns} | ${riskEmoji} ${testFile.riskLevel} | ${testFile.fossilizationStatus} |\n`;
      }
      markdown += `\n`;
    }

    // LLM Insight Needs
    if (analysis.llmInsightNeeds.length > 0) {
      markdown += `## 💡 LLM Insight Needs\n\n`;
      markdown += `| File | Priority | Reason | Effort | Impact |\n`;
      markdown += `|------|----------|--------|--------|--------|\n`;
      
      for (const need of analysis.llmInsightNeeds) {
        const priorityEmoji = need.priority === 'critical' ? '🔴' : need.priority === 'high' ? '🟠' : need.priority === 'medium' ? '🟡' : '🟢';
        markdown += `| ${need.file} | ${priorityEmoji} ${need.priority} | ${need.reason} | ${need.estimatedEffort} | ${need.impact} |\n`;
      }
      markdown += `\n`;
    }

    // Fossilization Gaps
    if (analysis.fossilizationGaps.length > 0) {
      markdown += `## 🔍 Fossilization Gaps\n\n`;
      markdown += `| File | Gap Type | Description | Severity | Fix Required |\n`;
      markdown += `|------|----------|-------------|----------|--------------|\n`;
      
      for (const gap of analysis.fossilizationGaps) {
        const severityEmoji = gap.severity === 'high' ? '🔴' : gap.severity === 'medium' ? '🟡' : '🟢';
        markdown += `| ${gap.file} | ${gap.gapType} | ${gap.description} | ${severityEmoji} ${gap.severity} | ${gap.fixRequired ? '✅' : '❌'} |\n`;
      }
      markdown += `\n`;
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
      markdown += `## 🎯 Recommendations\n\n`;
      for (const recommendation of analysis.recommendations) {
        markdown += `- ${recommendation}\n`;
      }
      markdown += `\n`;
    }

    return markdown;
  }
}

// CLI Commands

program
  .command('analyze')
  .description('Analyze bun test snapshot changes')
  .option('-f, --format <format>', 'Export format (json, yaml, markdown)', 'markdown')
  .action(async (options) => {
    try {
      console.log('🧪 Starting Bun Test Snapshot Analysis...');
      
      const analyzer = new BunTestSnapshotAnalyzer();
      await analyzer.initialize();

      const analysis = await analyzer.analyzeTestSnapshots();

      // Export results
      const outputPath = await analyzer.exportAnalysis(analysis, options.format as any);
      
      console.log('✅ Analysis completed successfully!');
      console.log(`📁 Results exported to: ${outputPath}`);
      console.log(`📊 Summary:`);
      console.log(`   - Test files: ${analysis.summary.totalTestFiles}`);
      console.log(`   - Need LLM insights: ${analysis.summary.needsLLMInsights}`);
      console.log(`   - High risk files: ${analysis.summary.highRiskFiles}`);
      console.log(`   - Critical insights: ${analysis.summary.criticalInsights}`);

      if (analysis.llmInsightNeeds.length > 0) {
        console.log('\n💡 Top LLM Insight Needs:');
        analysis.llmInsightNeeds.slice(0, 3).forEach(need => {
          console.log(`   - ${need.file}: ${need.priority} priority`);
        });
      }

      if (analysis.recommendations.length > 0) {
        console.log('\n🎯 Top Recommendations:');
        analysis.recommendations.slice(0, 3).forEach(rec => console.log(`   - ${rec}`));
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('quick-check')
  .description('Quick check for critical LLM insight needs')
  .action(async () => {
    try {
      console.log('🔍 Quick check for critical LLM insight needs...');
      
      const analyzer = new BunTestSnapshotAnalyzer();
      await analyzer.initialize();

      const analysis = await analyzer.analyzeTestSnapshots();

      const criticalNeeds = analysis.llmInsightNeeds.filter(n => n.priority === 'critical');
      const highRiskFiles = analysis.testFiles.filter(f => f.riskLevel === 'high');

      if (criticalNeeds.length === 0 && highRiskFiles.length === 0) {
        console.log('✅ No critical issues found - all test files are properly handled');
        return;
      }

      if (criticalNeeds.length > 0) {
        console.log(`🔴 ${criticalNeeds.length} critical LLM insight needs:`);
        criticalNeeds.forEach(need => {
          console.log(`   - ${need.file}: ${need.reason}`);
        });
      }

      if (highRiskFiles.length > 0) {
        console.log(`🟠 ${highRiskFiles.length} high-risk test files:`);
        highRiskFiles.forEach(file => {
          console.log(`   - ${file.file}: ${file.llmPatterns.join(', ')}`);
        });
      }

    } catch (error) {
      console.error('❌ Quick check failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

if (import.meta.main) {
  program.parse();
} 