#!/usr/bin/env bun

/**
 * Hanging Test Detection Script
 * 
 * Quick detection of hanging tests with immediate feedback and prevention
 * of future blockers through proactive monitoring.
 */

import { executeCommand } from '../src/utils/cli';
import fs from 'fs/promises';
import path from 'path';

interface HangingTestResult {
  testFile: string;
  hangingDetected: boolean;
  duration: number;
  reason?: string;
  timestamp: string;
}

interface DetectionConfig {
  timeoutThreshold: number;
  hangingIndicators: string[];
  testPatterns: string[];
  outputFile: string;
}

class HangingTestDetector {
  private config: DetectionConfig;
  private results: HangingTestResult[] = [];

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = {
      timeoutThreshold: 10000, // 10 seconds
      hangingIndicators: [
        '🤖 Processing with LLM...',
        'Processing with LLM...',
        'Initializing...',
        'Loading...',
        'Connecting...',
        'Waiting for...',
        'Establishing connection...'
      ],
      testPatterns: [
        'tests/unit/cli/llm-plan.test.ts',
        'tests/unit/services/llm.test.ts',
        'tests/e2e/scripts.e2e.test.ts'
      ],
      outputFile: 'fossils/hanging-tests-detection.json',
      ...config
    };
  }

  /**
   * Detect hanging tests with quick timeout
   */
  async detectHangingTests(): Promise<HangingTestResult[]> {
    console.log('🔍 Detecting hanging tests...');
    
    const results: HangingTestResult[] = [];
    for (const testPattern of this.config.testPatterns) {
      const startTime = Date.now();
      try {
        // Run test with strict timeout
        const output = (await executeCommand(`bun test ${testPattern} --timeout 5000`)).stdout;
        const duration = Date.now() - startTime;
        const hangingDetected = this.analyzeOutputForHanging(output, duration);
        results.push({
          testFile: testPattern,
          hangingDetected,
          duration,
          reason: hangingDetected ? this.getHangingReason(output, duration) : undefined,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        results.push({
          testFile: testPattern,
          hangingDetected: true,
          duration,
          reason: `Timeout after ${duration}ms: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    return results;
  }

  /**
   * Test a specific file for hanging behavior
   */
  private async testForHanging(testFile: string): Promise<HangingTestResult> {
    const startTime = Date.now();
    
    try {
      // Run test with strict timeout
      const output = (await executeCommand(`bun test ${testFile} --timeout 5000`)).stdout;
      
      const duration = Date.now() - startTime;
      const hangingDetected = this.analyzeOutputForHanging(output, duration);
      
      return {
        testFile,
        hangingDetected,
        duration,
        reason: hangingDetected ? this.getHangingReason(output, duration) : undefined,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        testFile,
        hangingDetected: true,
        duration,
        reason: `Timeout after ${duration}ms: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze test output for hanging indicators
   */
  private analyzeOutputForHanging(output: string, duration: number): boolean {
    // Check for hanging indicators (but exclude test mode messages)
    const hasHangingIndicator = this.config.hangingIndicators.some(indicator => 
      output.includes(indicator) && 
      !output.includes('completed') && 
      !output.includes('Test mode:') &&
      !output.includes('🧪 Test mode:')
    );
    
    // Check for excessive duration
    const isExcessivelySlow = duration > 5000; // 5 seconds
    
    // Check for timeout patterns
    const hasTimeoutPattern = output.includes('timeout') || output.includes('SIGTERM');
    
    return hasHangingIndicator || isExcessivelySlow || hasTimeoutPattern;
  }

  /**
   * Get specific reason for hanging detection
   */
  private getHangingReason(output: string, duration: number): string {
    if (duration > 5000) {
      return `Excessive duration: ${duration}ms`;
    }
    
    const hangingIndicator = this.config.hangingIndicators.find(indicator => 
      output.includes(indicator) && !output.includes('completed')
    );
    
    if (hangingIndicator) {
      return `Hanging indicator detected: "${hangingIndicator}"`;
    }
    
    return 'Unknown hanging pattern';
  }

  /**
   * Save detection results
   */
  private async saveResults(): Promise<void> {
    const outputDir = path.dirname(this.config.outputFile);
    await fs.mkdir(outputDir, { recursive: true });
    
    const hangingTests = this.results.filter(r => r.hangingDetected);
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      hangingTests: hangingTests.length,
      results: this.results,
      summary: hangingTests.length > 0 ? 'HANGING_TESTS_DETECTED' : 'ALL_TESTS_STABLE'
    };
    
    await fs.writeFile(this.config.outputFile, JSON.stringify(summary, null, 2));
    console.log(`📄 Detection results saved to ${this.config.outputFile}`);
  }

  /**
   * Generate quick report
   */
  generateReport(): string {
    const hangingTests = this.results.filter(r => r.hangingDetected);
    
    if (hangingTests.length === 0) {
      return `
✅ Hanging Test Detection Report

All tests are stable! No hanging tests detected.
Total tests checked: ${this.results.length}
Average duration: ${Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length)}ms
`;
    }
    
    return `
🚨 Hanging Test Detection Report

${hangingTests.length} hanging test(s) detected:

${hangingTests.map(t => `- ${t.testFile}: ${t.reason}`).join('\n')}

Immediate Actions Required:
1. Implement test mode flags for async operations
2. Add proper timeout handling
3. Mock heavy operations in test environment
4. Review test implementation patterns

Total tests checked: ${this.results.length}
Hanging tests: ${hangingTests.length}
`;
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Hanging Test Detector

Usage:
  bun run scripts/detect-hanging-tests.ts [options]

Options:
  --timeout <ms>     Timeout threshold in milliseconds (default: 10000)
  --output <path>    Output file path (default: fossils/hanging-tests-detection.json)
  --help, -h         Show this help message

Examples:
  bun run scripts/detect-hanging-tests.ts
  bun run scripts/detect-hanging-tests.ts --timeout 5000
`);
    return;
  }
  
  const detector = new HangingTestDetector();
  const results = await detector.detectHangingTests();
  const report = detector.generateReport();
  
  console.log(report);
  
  // Exit with appropriate code
  const hangingTests = results.filter(r => r.hangingDetected);
  process.exit(hangingTests.length > 0 ? 1 : 0);
}

if (import.meta.main) {
  main();
} 