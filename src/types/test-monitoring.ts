/**
 * Canonical types for test monitoring utility
 * @module types/test-monitoring
 */

/**
 * Test monitor configuration
 */
export interface TestMonitorConfig {
  enabled: boolean;
  outputDir: string;
  testTimeout: number;
  snapshotInterval: number;
  hangingThreshold: number;
  memoryThreshold: number;
  cpuThreshold: number;
  maxActiveCalls: number;
  enableStackTrace: boolean;
  enableMemoryTracking: boolean;
  enableCpuTracking: boolean;
  logHangingCalls: boolean;
  alertOnHanging: boolean;
  verbose: boolean;
}

/**
 * Test monitoring result structure
 */
export interface TestMonitoringResult {
  success: boolean;
  duration: number;
  exitCode: number;
  snapshots: number;
  hangingCalls: number;
  completedCalls: number;
  averageDuration: number;
  maxDuration: number;
  hangingCallDetails: Array<{
    functionName: string;
    duration: number;
    fileName: string;
    lineNumber: number;
    metadata?: Record<string, any>;
  }>;
  outputFiles: {
    dataFile: string;
    reportFile: string;
  };
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
  memoryUsage: number;
  cpuUsage: number;
  outputPath: string;
  error?: string;
}

/**
 * Test analysis data structure
 */
export interface TestAnalysisData {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  memoryUsage: number;
  cpuUsage: number;
  hangingCalls: number;
  timestamp: string;
} 