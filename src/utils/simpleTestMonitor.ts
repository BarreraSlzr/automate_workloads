/**
 * Simplified Test Monitor
 * 
 * Focuses on core functionality:
 * - Basic test execution tracking
 * - Fossil creation for test results
 * - Simple performance metrics
 * 
 * Removes complex features:
 * - Hanging test detection
 * - Event loop monitoring
 * - Memory monitoring
 * - Complex state management
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import type { BaseFossil } from '../types';

// Simplified schemas
const SimpleTestResultSchema = z.object({
  testName: z.string(),
  duration: z.number(),
  status: z.enum(['pass', 'fail', 'skip']),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const SimpleTestSummarySchema = z.object({
  totalTests: z.number(),
  passedTests: z.number(),
  failedTests: z.number(),
  skippedTests: z.number(),
  totalDuration: z.number(),
  averageDuration: z.number(),
  timestamp: z.string(),
});

const SimpleTestFossilSchema = z.object({
  id: z.string(),
  type: z.literal('simple-test-monitor'),
  timestamp: z.string(),
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  fossilId: z.string().optional(),
  fossilHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  data: z.object({
    summary: SimpleTestSummarySchema,
    results: z.array(SimpleTestResultSchema),
  }),
});

type SimpleTestResult = z.infer<typeof SimpleTestResultSchema>;
type SimpleTestSummary = z.infer<typeof SimpleTestSummarySchema>;
type SimpleTestFossil = z.infer<typeof SimpleTestFossilSchema>;

interface SimpleTestMonitorConfig {
  createFossils?: boolean;
  fossilPath?: string;
  verbose?: boolean;
}

const defaultFossilPath = 'fossils/tests/monitoring/data';

/**
 * Simple Test Monitor
 * 
 * Tracks test execution without complex monitoring features.
 * Focuses on reliability and core functionality.
 */
export class SimpleTestMonitor {
  private results: SimpleTestResult[] = [];
  private startTime: number = 0;
  private config: Required<SimpleTestMonitorConfig>;

  constructor(config: SimpleTestMonitorConfig = {}) {
    this.config = {
      createFossils: config.createFossils ?? true,
      fossilPath: config.fossilPath ?? defaultFossilPath,
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Start monitoring a test suite
   */
  start(): void {
    this.startTime = Date.now();
    this.results = [];
    
    if (this.config.verbose) {
      console.log('🔍 Starting simple test monitoring...');
    }
  }

  /**
   * Track a test result
   */
  trackTest(params: {
    testName: string;
    duration: number;
    status: 'pass' | 'fail' | 'skip';
    metadata?: Record<string, unknown>;
  }): void {
    const result: SimpleTestResult = {
      testName: params.testName,
      duration: params.duration,
      status: params.status,
      timestamp: new Date().toISOString(),
      metadata: params.metadata,
    };

    this.results.push(result);

    if (this.config.verbose) {
      const statusIcon = params.status === 'pass' ? '✅' : params.status === 'fail' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${params.testName} (${params.duration}ms)`);
    }
  }

  /**
   * Stop monitoring and generate summary
   */
  stop(): SimpleTestSummary {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;
    const skippedTests = this.results.filter(r => r.status === 'skip').length;
    const totalTests = this.results.length;
    const averageDuration = totalTests > 0 ? this.results.reduce((sum, result, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing test result ${i + 1} of ${arr.length}`);
      }
      return sum + (result.duration || 0);
    }, 0) / totalTests : 0;

    const summary: SimpleTestSummary = {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      averageDuration,
      timestamp: new Date().toISOString(),
    };

    if (this.config.verbose) {
      console.log('\n📊 Simple Test Monitoring Summary:');
      console.log(`Duration: ${totalDuration}ms`);
      console.log(`Tests: ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped`);
      console.log(`Average Duration: ${averageDuration.toFixed(2)}ms`);
    }

    return summary;
  }

  /**
   * Create a fossil from the test results
   */
  async createFossil(summary: SimpleTestSummary): Promise<void> {
    if (!this.config.createFossils) {
      return;
    }

    try {
      const fossil: SimpleTestFossil = {
        id: `simple-test-monitor-${Date.now()}`,
        type: 'simple-test-monitor',
        timestamp: new Date().toISOString(),
        source: 'simple-test-monitor',
        createdBy: 'simple-test-monitor',
        createdAt: new Date().toISOString(),
        data: {
          summary,
          results: this.results,
        },
        metadata: {
          monitorType: 'simple',
          version: '1.0.0',
        },
      };

      // Ensure directory exists
      await fs.mkdir(this.config.fossilPath, { recursive: true });
      
      // Write fossil to file
      const filename = `simple-test-monitor-${Date.now()}.json`;
      const filePath = path.join(this.config.fossilPath, filename);
      await fs.writeFile(filePath, JSON.stringify(fossil, null, 2));

      if (this.config.verbose) {
        console.log(`📄 Fossil created: ${this.config.fossilPath}/simple-test-monitor-${Date.now()}.json`);
      }
    } catch (error) {
      if (this.config.verbose) {
        console.error('❌ Failed to create fossil:', error);
      }
    }
  }

  /**
   * Get current results
   */
  getResults(): SimpleTestResult[] {
    return [...this.results];
  }

  /**
   * Get current summary
   */
  getSummary(): SimpleTestSummary | null {
    if (this.startTime === 0) {
      return null;
    }

    return this.stop();
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.results = [];
    this.startTime = 0;
  }
}

// Global instance for simple access
let globalSimpleMonitor: SimpleTestMonitor | null = null;

/**
 * Start global simple test monitoring
 */
export function startSimpleTestMonitoring(config?: SimpleTestMonitorConfig): void {
  globalSimpleMonitor = new SimpleTestMonitor(config);
  globalSimpleMonitor.start();
}

/**
 * Stop global simple test monitoring and create fossil
 */
export async function stopSimpleTestMonitoring(): Promise<SimpleTestSummary | null> {
  if (!globalSimpleMonitor) {
    return null;
  }

  const summary = globalSimpleMonitor.stop();
  await globalSimpleMonitor.createFossil(summary);
  
  const result = summary;
  globalSimpleMonitor = null;
  
  return result;
}

/**
 * Track a test with global monitor
 */
export function trackSimpleTest(params: {
  testName: string;
  duration: number;
  status: 'pass' | 'fail' | 'skip';
  metadata?: Record<string, unknown>;
}): void {
  if (globalSimpleMonitor) {
    globalSimpleMonitor.trackTest(params);
  }
}

/**
 * Get global monitor status
 */
export function isSimpleTestMonitoringActive(): boolean {
  return globalSimpleMonitor !== null;
}

/**
 * Get global monitor results
 */
export function getSimpleTestResults(): SimpleTestResult[] {
  return globalSimpleMonitor?.getResults() ?? [];
}

/**
 * Get global monitor summary
 */
export function getSimpleTestSummary(): SimpleTestSummary | null {
  return globalSimpleMonitor?.getSummary() ?? null;
}

// Export schemas for validation
export {
  SimpleTestResultSchema,
  SimpleTestSummarySchema,
  SimpleTestFossilSchema,
  type SimpleTestResult,
  type SimpleTestSummary,
  type SimpleTestFossil,
}; 