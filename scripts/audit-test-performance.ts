#!/usr/bin/env bun

/**
 * Test Performance Audit Script
 * 
 * Comprehensive audit system for detecting hanging tests and validating performance
 * against established baselines. Prevents future blockers through proactive monitoring.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import type { TestPerformanceResult, AuditConfig, AuditResult, PerformanceBaseline } from '@/types/audit';
import { noop } from '@/utils/cli';
import { parseJsonSafe } from '@/utils/json';

class TestPerformanceAuditor {
  private config: AuditConfig;
  private baselines: Map<string, PerformanceBaseline>;
  private results: TestPerformanceResult[] = [];

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = {
      timeoutMultiplier: 3.0,
      memoryThreshold: 80,
      cpuThreshold: 90,
      baselinePath: 'fossils/tests/performance-baselines.json',
      outputPath: 'fossils/tests/performance-audit.json',
      fossilizeResults: true,
      ...config
    };
    this.baselines = new Map();
  }

  /**
   * Load performance baselines
   */
  async loadBaselines(): Promise<void> {
    try {
      const baselineData = await fs.readFile(this.config.baselinePath, 'utf-8');
      const baselines = parseJsonSafe<PerformanceBaseline[]>(baselineData);
      
      for (const baseline of baselines) {
        this.baselines.set(baseline.testName, baseline);
      }
      
      console.log(`📊 Loaded ${this.baselines.size} performance baselines`);
    } catch (error) {
      console.log('⚠️ No existing baselines found, using defaults');
      this.initializeDefaultBaselines();
    }
  }

  /**
   * Initialize default performance baselines
   */
  private initializeDefaultBaselines(): void {
    const defaultBaselines: PerformanceBaseline[] = [
      {
        testName: 'tests/unit/cli/llm-plan.test.ts',
        maxDuration: 100,
        timeoutThreshold: 500,
        memoryLimit: 50,
        status: 'stable'
      },
      {
        testName: 'tests/unit/services/llm.test.ts',
        maxDuration: 200,
        timeoutThreshold: 1000,
        memoryLimit: 100,
        status: 'stable'
      },
      {
        testName: 'tests/e2e/scripts.e2e.test.ts',
        maxDuration: 5000,
        timeoutThreshold: 15000,
        memoryLimit: 200,
        status: 'stable'
      }
    ];

    for (const baseline of defaultBaselines) {
      this.baselines.set(baseline.testName, baseline);
    }
  }

  /**
   * Run performance audit on specific test file
   */
  async auditTestFile(testPath: string): Promise<TestPerformanceResult> {
    const baseline = this.baselines.get(testPath);
    const timeoutThreshold = baseline?.timeoutThreshold || 5000;
    
    console.log(`🧪 Auditing ${testPath}...`);
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      // Run test with timeout
      const result = execSync(`bun test ${testPath} --timeout ${timeoutThreshold}`, {
        encoding: 'utf-8',
        timeout: timeoutThreshold * this.config.timeoutMultiplier
      });
      
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
      
      const hangingDetected = this.detectHanging(result, duration, baseline);
      
      const testResult: TestPerformanceResult = {
        testName: testPath,
        duration,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
        status: hangingDetected ? 'hanging' : 'pass',
        hangingDetected,
        timestamp: new Date().toISOString()
      };
      
      this.results.push(testResult);
      
      if (hangingDetected) {
        console.log(`🚨 Hanging test detected: ${testPath}`);
      } else {
        console.log(`✅ ${testPath} completed in ${duration}ms`);
      }
      
      return testResult;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      const testResult: TestPerformanceResult = {
        testName: testPath,
        duration,
        status: error.signal === 'SIGTERM' ? 'timeout' : 'fail',
        hangingDetected: error.signal === 'SIGTERM',
        timestamp: new Date().toISOString()
      };
      
      this.results.push(testResult);
      console.log(`❌ ${testPath} failed: ${error.message}`);
      
      return testResult;
    }
  }

  /**
   * Detect hanging tests based on output patterns and timing
   */
  private detectHanging(output: string, duration: number, baseline?: PerformanceBaseline): boolean {
    // Check for hanging indicators in output
    const hangingIndicators = [
      'Processing with LLM...',
      '🤖 Processing with LLM...',
      'Initializing...',
      'Loading...',
      'Connecting...'
    ];
    
    const hasHangingOutput = hangingIndicators.some(indicator => 
      output.includes(indicator) && !output.includes('completed')
    );
    
    // Check duration against baseline
    const exceedsBaseline = baseline && duration > baseline.maxDuration * 2;
    
    // Check for timeout patterns
    const hasTimeoutPattern = output.includes('timeout') || output.includes('SIGTERM');
    
    return hasHangingOutput || exceedsBaseline || hasTimeoutPattern;
  }

  /**
   * Run comprehensive performance audit
   */
  async runAudit(): Promise<AuditResult> {
    console.log('🔍 Starting comprehensive test performance audit...');
    
    await this.loadBaselines();
    
    // Get all test files
    const testFiles = await this.findTestFiles();
    console.log(`📋 Found ${testFiles.length} test files to audit`);
    
    // Audit each test file
    for (const testFile of testFiles) {
      await this.auditTestFile(testFile);
    }
    
    // Generate audit result
    const auditResult = this.generateAuditResult();
    
    // Save results
    await this.saveResults(auditResult);
    
    // Fossilize results if enabled
    if (this.config.fossilizeResults) {
      await this.fossilizeResults(auditResult);
    }
    
    return auditResult;
  }

  /**
   * Find all test files in the project
   */
  private async findTestFiles(): Promise<string[]> {
    const testFiles: string[] = [];
    
    const testDirs = ['tests/unit', 'tests/integration', 'tests/e2e'];
    
    for (const testDir of testDirs) {
      try {
        const files = await this.recursiveFindFiles(testDir, '.test.ts');
        testFiles.push(...files);
      } catch (error) {
        // Directory might not exist
      }
    }
    
    return testFiles;
  }

  /**
   * Recursively find files with specific extension
   */
  private async recursiveFindFiles(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.recursiveFindFiles(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }
    
    return files;
  }

  /**
   * Generate comprehensive audit result
   */
  private generateAuditResult(): AuditResult {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;
    const hangingTests = this.results.filter(r => r.hangingDetected).length;
    const averageDuration = totalTests > 0 
      ? this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;

    const performanceIssues = this.results.filter(r => {
      const baseline = this.baselines.get(r.testName);
      return baseline && r.duration > baseline.maxDuration;
    });

    const recommendations = this.generateRecommendations();

    const overallStatus = hangingTests > 0 ? 'fail' : 
                         performanceIssues.length > 0 ? 'warning' : 'pass';

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        hangingTests,
        averageDuration: Math.round(averageDuration),
        overallStatus
      },
      hangingTests: this.results.filter(r => r.hangingDetected),
      performanceIssues,
      recommendations,
      fossils: []
    };
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const hangingTests = this.results.filter(r => r.hangingDetected);
    const slowTests = this.results.filter(r => r.duration > 1000);
    
    if (hangingTests.length > 0) {
      recommendations.push(`🚨 ${hangingTests.length} hanging tests detected. Implement test mode flags and timeout handling.`);
    }
    
    if (slowTests.length > 0) {
      recommendations.push(`🐌 ${slowTests.length} slow tests detected. Consider optimization or mocking heavy operations.`);
    }
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    if (avgDuration > 500) {
      recommendations.push(`⏱️ Average test duration (${Math.round(avgDuration)}ms) exceeds target. Review test performance.`);
    }
    
    return recommendations;
  }

  /**
   * Save audit results to file
   */
  private async saveResults(auditResult: AuditResult): Promise<void> {
    const outputDir = path.dirname(this.config.outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    await fs.writeFile(
      this.config.outputPath,
      JSON.stringify(auditResult, null, 2)
    );
    
    console.log(`📄 Audit results saved to ${this.config.outputPath}`);
  }

  /**
   * Fossilize audit results for historical tracking
   */
  private async fossilizeResults(auditResult: AuditResult): Promise<void> {
    const fossil = {
      type: 'test_performance_audit',
      timestamp: new Date().toISOString(),
      summary: auditResult.summary,
      hangingTests: auditResult.hangingTests.length,
      performanceIssues: auditResult.performanceIssues.length,
      recommendations: auditResult.recommendations,
      fossilId: `test-performance-audit-${Date.now()}`
    };
    
    const fossilPath = `fossils/tests/performance-audit-${Date.now()}.json`;
    await fs.writeFile(fossilPath, JSON.stringify(fossil, null, 2));
    
    console.log(`🦴 Performance audit fossilized: ${fossilPath}`);
  }

  /**
   * Generate performance report
   */
  generateReport(auditResult: AuditResult): string {
    const { summary, hangingTests, performanceIssues, recommendations } = auditResult;
    
    return `# Test Performance Audit Report

## Summary
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passedTests}
- **Failed**: ${summary.failedTests}
- **Hanging**: ${summary.hangingTests}
- **Average Duration**: ${summary.averageDuration}ms
- **Overall Status**: ${summary.overallStatus.toUpperCase()}

## Hanging Tests
${hangingTests.length > 0 ? hangingTests.map(t => `- ${t.testName} (${t.duration}ms)`).join('\n') : 'None detected ✅'}

## Performance Issues
${performanceIssues.length > 0 ? performanceIssues.map(t => `- ${t.testName} (${t.duration}ms)`).join('\n') : 'None detected ✅'}

## Recommendations
${recommendations.map(r => `- ${r}`).join('\n')}

## Next Steps
1. Address hanging tests immediately
2. Optimize slow tests
3. Update performance baselines
4. Implement continuous monitoring
`;
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  const auditor = new TestPerformanceAuditor();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Test Performance Auditor

Usage:
  bun run scripts/audit-test-performance.ts [options]

Options:
  --timeout-multiplier <number>  Timeout multiplier for hanging detection (default: 3.0)
  --memory-threshold <number>    Memory usage threshold percentage (default: 80)
  --output <path>               Output file path (default: fossils/tests/performance-audit.json)
  --no-fossilize               Disable fossilization of results
  --help, -h                   Show this help message

Examples:
  bun run scripts/audit-test-performance.ts
  bun run scripts/audit-test-performance.ts --timeout-multiplier 2.0
  bun run scripts/audit-test-performance.ts --output custom-audit.json
`);
    return;
  }
  
  try {
    const auditResult = await auditor.runAudit();
    const report = auditor.generateReport(auditResult);
    
    console.log('\n' + report);
    
    // Exit with appropriate code
    if (auditResult.summary.overallStatus === 'fail') {
      process.exit(1);
    } else if (auditResult.summary.overallStatus === 'warning') {
      process.exit(2);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 