/**
 * Test Monitoring Utility
 * Integrates event loop monitoring with bun test to detect hanging tests and provide insights
 * @module utils/testMonitor
 */

import {
  startGlobalMonitoring,
  stopGlobalMonitoring,
  getCallStackSummary,
  generateMonitoringReport,
  exportMonitoringData,
  HangingDetectionConfig,
  EventLoopSnapshot
} from './eventLoopMonitor';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TestMonitorConfig {
  /** Enable test monitoring */
  enabled: boolean;
  /** Output directory for monitoring data */
  outputDir: string;
  /** Test timeout in milliseconds */
  testTimeout: number;
  /** Snapshot interval in milliseconds */
  snapshotInterval: number;
  /** Hanging detection threshold in milliseconds */
  hangingThreshold: number;
  /** Memory threshold in bytes */
  memoryThreshold: number;
  /** CPU threshold percentage */
  cpuThreshold: number;
  /** Maximum active calls */
  maxActiveCalls: number;
  /** Enable stack trace capture */
  enableStackTrace: boolean;
  /** Enable memory tracking */
  enableMemoryTracking: boolean;
  /** Enable CPU tracking */
  enableCpuTracking: boolean;
  /** Log hanging calls */
  logHangingCalls: boolean;
  /** Show alerts for hanging calls */
  alertOnHanging: boolean;
  /** Verbose output */
  verbose: boolean;
}

export interface TestMonitoringResult {
  /** Whether tests completed successfully */
  success: boolean;
  /** Test execution duration in milliseconds */
  duration: number;
  /** Exit code */
  exitCode: number;
  /** Number of snapshots taken */
  snapshots: number;
  /** Number of hanging calls detected */
  hangingCalls: number;
  /** Number of completed calls */
  completedCalls: number;
  /** Average call duration */
  averageDuration: number;
  /** Maximum call duration */
  maxDuration: number;
  /** Hanging call details */
  hangingCallDetails: Array<{
    functionName: string;
    duration: number;
    fileName: string;
    lineNumber: number;
    metadata?: Record<string, any>;
  }>;
  /** Output files */
  outputFiles: {
    dataFile: string;
    reportFile: string;
  };
  /** Additional summary/metadata fields */
  summary: {
    totalSnapshots: number;
    totalHangingCalls: number;
    totalCompletedCalls: number;
    averageDuration: number;
    maxDuration: number;
    startTime: number;
    endTime: number;
    config: TestMonitorConfig;
  };
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_TEST_MONITOR_CONFIG: TestMonitorConfig = {
  enabled: true,
  outputDir: 'fossils/tests/monitoring',
  testTimeout: 300000, // 5 minutes
  snapshotInterval: 1000, // 1 second
  hangingThreshold: 30000, // 30 seconds
  memoryThreshold: 200 * 1024 * 1024, // 200MB
  cpuThreshold: 90,
  maxActiveCalls: 500,
  enableStackTrace: true,
  enableMemoryTracking: true,
  enableCpuTracking: true,
  logHangingCalls: true,
  alertOnHanging: true,
  verbose: false,
};

// ============================================================================
// TEST MONITOR CLASS
// ============================================================================

export class TestMonitor {
  private config: TestMonitorConfig;
  private startTime: number = 0;
  private isMonitoring: boolean = false;
  private snapshots: EventLoopSnapshot[] = [];

  constructor(config: Partial<TestMonitorConfig> = {}) {
    this.config = { ...DEFAULT_TEST_MONITOR_CONFIG, ...config };
    this.ensureOutputDirectory();
  }

  /**
   * Start test monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Test monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();

    if (this.config.verbose) {
      console.log('🔍 Starting test monitoring...');
      console.log(`⏱️  Test timeout: ${this.config.testTimeout}ms`);
      console.log(`📊 Snapshot interval: ${this.config.snapshotInterval}ms`);
      console.log(`🚨 Hanging threshold: ${this.config.hangingThreshold}ms`);
      console.log(`💾 Memory threshold: ${this.config.memoryThreshold / 1024 / 1024}MB`);
    }

    // Configure event loop monitoring
    const eventLoopConfig: Partial<HangingDetectionConfig> = {
      timeoutThreshold: this.config.hangingThreshold,
      memoryThreshold: this.config.memoryThreshold,
      cpuThreshold: this.config.cpuThreshold,
      eventLoopLagThreshold: 200,
      maxActiveCalls: this.config.maxActiveCalls,
      enableStackTrace: this.config.enableStackTrace,
      enableMemoryTracking: this.config.enableMemoryTracking,
      enableCpuTracking: this.config.enableCpuTracking,
      logHangingCalls: this.config.logHangingCalls,
      alertOnHanging: this.config.alertOnHanging,
    };

    // Start global monitoring
    startGlobalMonitoring(this.config.snapshotInterval, eventLoopConfig);

    // Set up process handlers
    this.setupProcessHandlers();
  }

  /**
   * Stop test monitoring and generate results
   */
  async stopMonitoring(): Promise<TestMonitoringResult> {
    if (!this.isMonitoring) {
      console.warn('Test monitoring is not active');
      return this.createEmptyResult();
    }

    this.isMonitoring = false;
    const duration = Date.now() - this.startTime;

    // Stop global monitoring
    this.snapshots = stopGlobalMonitoring();
    const summary = getCallStackSummary();

    // Create result first
    const result: TestMonitoringResult = {
      success: true, // Will be updated by caller
      duration,
      exitCode: 0, // Will be updated by caller
      snapshots: this.snapshots.length,
      hangingCalls: summary.summary.totalHanging,
      completedCalls: summary.summary.totalCompleted,
      averageDuration: summary.summary.averageDuration,
      maxDuration: summary.summary.maxDuration,
      hangingCallDetails: summary.hanging.map(call => ({
        functionName: call.functionName,
        duration: call.duration || 0,
        fileName: call.fileName,
        lineNumber: call.lineNumber,
        metadata: call.metadata,
      })),
      outputFiles: {
        dataFile: join('fossils/monitoring/metrics.json'),
        reportFile: join(this.config.outputDir, 'monitoring.report.md'),
      },
      // Add additional summary/metadata fields if required by schema
      summary: {
        totalSnapshots: this.snapshots.length,
        totalHangingCalls: summary.summary.totalHanging,
        totalCompletedCalls: summary.summary.totalCompleted,
        averageDuration: summary.summary.averageDuration,
        maxDuration: summary.summary.maxDuration,
        startTime: this.startTime,
        endTime: Date.now(),
        config: this.config
      }
    } as any; // Cast to any to allow extra fields for now

    // Use canonical fossil manager instead of direct file creation
    try {
      const { CanonicalFossilManager } = await import('@/cli/canonical-fossil-manager');

      const fossilManager = new CanonicalFossilManager();
      await fossilManager.updateTestMonitoring(result, { generateYaml: true });

      console.log(`📊 Test monitoring results saved using canonical fossil manager`);
    } catch (error) {
      console.warn('⚠️  Failed to save test monitoring using canonical manager, falling back to direct save:', error);

      // Fallback to direct save if canonical manager fails
      const dataFile = join('fossils/monitoring/metrics.json');
      const reportFile = join(this.config.outputDir, 'monitoring.report.md');

      exportMonitoringData(dataFile);
      const report = generateMonitoringReport();
      writeFileSync(reportFile, report);

      // Update result with file paths
      result.outputFiles = {
        dataFile,
        reportFile,
      };
    }

    // Log summary
    this.logSummary(result);

    return result;
  }

  /**
   * Monitor a test function
   */
  async monitorTest<T>(
    testName: string,
    testFunction: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isMonitoring) {
      return testFunction();
    }

    const { trackOperation } = await import('./eventLoopMonitor');

    return trackOperation(
      testFunction,
      testName,
      {
        type: 'test',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    );
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    duration: number;
    snapshots: number;
    activeCalls: number;
    completedCalls: number;
    hangingCalls: number;
  } {
    if (!this.isMonitoring) {
      return {
        isMonitoring: false,
        duration: 0,
        snapshots: 0,
        activeCalls: 0,
        completedCalls: 0,
        hangingCalls: 0,
      };
    }

    const summary = getCallStackSummary();
    const duration = Date.now() - this.startTime;

    return {
      isMonitoring: true,
      duration,
      snapshots: this.snapshots.length,
      activeCalls: summary.summary.totalActive,
      completedCalls: summary.summary.totalCompleted,
      hangingCalls: summary.summary.totalHanging,
    };
  }

  /**
   * Get real-time call stack summary
   */
  getCallStackSummary() {
    return getCallStackSummary();
  }

  /**
   * Check if any tests are hanging
   */
  hasHangingTests(): boolean {
    const summary = getCallStackSummary();
    return summary.summary.totalHanging > 0;
  }

  /**
   * Get hanging test details
   */
  getHangingTests(): Array<{
    functionName: string;
    duration: number;
    fileName: string;
    lineNumber: number;
    metadata?: Record<string, any>;
  }> {
    const summary = getCallStackSummary();
    return summary.hanging.map(call => ({
      functionName: call.functionName,
      duration: call.duration || 0,
      fileName: call.fileName,
      lineNumber: call.lineNumber,
      metadata: call.metadata,
    }));
  }

  /**
   * Generate a quick status report
   */
  generateStatusReport(): string {
    const status = this.getStatus();
    const summary = getCallStackSummary();

    let report = '# Test Monitoring Status Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Monitoring Active:** ${status.isMonitoring ? 'Yes' : 'No'}\n\n`;

    report += '## Summary\n\n';
    report += `- **Duration:** ${status.duration}ms\n`;
    report += `- **Snapshots:** ${status.snapshots}\n`;
    report += `- **Active Calls:** ${status.activeCalls}\n`;
    report += `- **Completed Calls:** ${status.completedCalls}\n`;
    report += `- **Hanging Calls:** ${status.hangingCalls}\n`;
    report += `- **Average Duration:** ${summary.summary.averageDuration.toFixed(2)}ms\n`;
    report += `- **Max Duration:** ${summary.summary.maxDuration.toFixed(2)}ms\n\n`;

    if (status.hangingCalls > 0) {
      report += '## Hanging Tests\n\n';
      summary.hanging.forEach(call => {
        report += `- **${call.functionName}** (${call.duration?.toFixed(2)}ms)\n`;
        report += `  - Location: ${call.fileName}:${call.lineNumber}\n`;
        if (call.metadata) {
          report += `  - Metadata: ${JSON.stringify(call.metadata)}\n`;
        }
        report += '\n';
      });
    }

    if (summary.active.length > 0) {
      report += '## Currently Running Tests\n\n';
      summary.active.forEach(call => {
        const duration = Date.now() - call.timestamp;
        report += `- **${call.functionName}** (${duration.toFixed(2)}ms)\n`;
        report += `  - Location: ${call.fileName}:${call.lineNumber}\n\n`;
      });
    }

    return report;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private ensureOutputDirectory(): void {
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  private setupProcessHandlers(): void {
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      console.log('\n🛑 Test monitoring interrupted');
      const result = await this.stopMonitoring();
      console.log(`\n📊 Test Monitoring Summary:`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Hanging Calls: ${result.hangingCalls}`);
      console.log(`Completed Calls: ${result.completedCalls}`);

      if (result.hangingCalls > 0) {
        console.log('\n🚨 Hanging Tests Detected:');
        result.hangingCallDetails.forEach(call => {
          console.log(`  - ${call.functionName} (${call.duration.toFixed(2)}ms)`);
          console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
        });
      }

      process.exit(1);
    });

    // Handle process exit
    process.on('exit', async (code) => {
      if (this.isMonitoring) {
        console.log('\n🛑 Test monitoring stopped');
        const result = await this.stopMonitoring();
        result.success = code === 0;
        result.exitCode = code;

        console.log(`\n📊 Final Test Monitoring Summary:`);
        console.log(`Exit Code: ${code}`);
        console.log(`Duration: ${result.duration}ms`);
        console.log(`Hanging Calls: ${result.hangingCalls}`);
        console.log(`Completed Calls: ${result.completedCalls}`);
        console.log(`Average Duration: ${result.averageDuration.toFixed(2)}ms`);
        console.log(`Max Duration: ${result.maxDuration.toFixed(2)}ms`);

        if (result.hangingCalls > 0) {
          console.log('\n🚨 Hanging Tests Detected:');
          result.hangingCallDetails.forEach(call => {
            console.log(`  - ${call.functionName} (${call.duration.toFixed(2)}ms)`);
            console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
          });
        }

        console.log(`\n📄 Report saved to: ${result.outputFiles.reportFile}`);
        console.log(`📊 Data exported to: ${result.outputFiles.dataFile}`);
      }
    });
  }

  private logSummary(result: TestMonitoringResult): void {
    if (!this.config.verbose) return;

    console.log('\n📊 Test Monitoring Summary:');
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Snapshots: ${result.snapshots}`);
    console.log(`Completed Calls: ${result.completedCalls}`);
    console.log(`Hanging Calls: ${result.hangingCalls}`);
    console.log(`Average Duration: ${result.averageDuration.toFixed(2)}ms`);
    console.log(`Max Duration: ${result.maxDuration.toFixed(2)}ms`);

    if (result.hangingCalls > 0) {
      console.log('\n🚨 Hanging Tests Detected:');
      result.hangingCallDetails.forEach(call => {
        console.log(`  - ${call.functionName} (${call.duration.toFixed(2)}ms)`);
        console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
      });
    }

    console.log(`\n📄 Report: ${result.outputFiles.reportFile}`);
    console.log(`📊 Data: ${result.outputFiles.dataFile}`);
  }

  private createEmptyResult(): TestMonitoringResult {
    return {
      success: false,
      duration: 0,
      exitCode: 1,
      snapshots: 0,
      hangingCalls: 0,
      completedCalls: 0,
      averageDuration: 0,
      maxDuration: 0,
      hangingCallDetails: [],
      outputFiles: {
        dataFile: join('fossils/monitoring/metrics.json'),
        reportFile: join(this.config.outputDir, 'monitoring.report.md'),
      },
      summary: {
        totalSnapshots: 0,
        totalHangingCalls: 0,
        totalCompletedCalls: 0,
        averageDuration: 0,
        maxDuration: 0,
        startTime: 0,
        endTime: 0,
        config: this.config
      }
    };
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalTestMonitor: TestMonitor | null = null;

export function getTestMonitor(config?: Partial<TestMonitorConfig>): TestMonitor {
  if (!globalTestMonitor) {
    globalTestMonitor = new TestMonitor(config);
  }
  return globalTestMonitor;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Start test monitoring globally
 */
export function startTestMonitoring(config?: Partial<TestMonitorConfig>): void {
  const monitor = getTestMonitor(config);
  monitor.startMonitoring();
}

/**
 * Stop test monitoring globally
 */
export async function stopTestMonitoring(): Promise<TestMonitoringResult> {
  const monitor = getTestMonitor();
  return await monitor.stopMonitoring();
}

/**
 * Monitor a test function
 */
export async function monitorTest<T>(
  testName: string,
  testFunction: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> {
  const monitor = getTestMonitor();
  return monitor.monitorTest(testName, testFunction, metadata);
}

/**
 * Check if any tests are hanging
 */
export function hasHangingTests(): boolean {
  const monitor = getTestMonitor();
  return monitor.hasHangingTests();
}

/**
 * Get hanging test details
 */
export function getHangingTests() {
  const monitor = getTestMonitor();
  return monitor.getHangingTests();
}

/**
 * Get test monitoring status
 */
export function getTestMonitoringStatus() {
  const monitor = getTestMonitor();
  return monitor.getStatus();
}

/**
 * Generate test monitoring status report
 */
export function generateTestStatusReport(): string {
  const monitor = getTestMonitor();
  return monitor.generateStatusReport();
} 