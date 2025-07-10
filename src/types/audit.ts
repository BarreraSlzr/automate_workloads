export interface PerformanceBaseline {
  testName: string;
  maxDuration: number;
  timeoutThreshold: number;
  memoryLimit: number;
  status: 'stable' | 'degraded' | 'critical';
}

export interface TestPerformanceResult {
  testName: string;
  duration: number;
  memoryUsage?: number;
  status: 'pass' | 'fail' | 'timeout' | 'hanging';
  hangingDetected: boolean;
  timestamp: string;
}

export interface AuditConfig {
  timeoutMultiplier: number;
  memoryThreshold: number;
  cpuThreshold: number;
  baselinePath: string;
  outputPath: string;
  fossilizeResults: boolean;
}

export interface AuditResult {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    hangingTests: number;
    averageDuration: number;
    overallStatus: 'pass' | 'fail' | 'warning';
  };
  hangingTests: TestPerformanceResult[];
  performanceIssues: TestPerformanceResult[];
  recommendations: string[];
  fossils: any[];
} 