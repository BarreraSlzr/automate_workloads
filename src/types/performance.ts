// Performance-related types and schemas
// Centralized type definitions for performance monitoring and tracking

import { z } from 'zod';

// ============================================================================
// PERFORMANCE MONITORING SCHEMAS
// ============================================================================

export const PerformanceMetricsSchema = z.object({
  real_time: z.number(),
  user_time: z.number(),
  sys_time: z.number(),
  output_size_bytes: z.number(),
  error_size_bytes: z.number(),
  cpu_percent: z.number(),
});

export const PerformanceLogEntrySchema = z.object({
  script: z.string(),
  execution_time: z.number(),
  memory_usage_mb: z.number(),
  exit_code: z.number(),
  timestamp: z.string(),
  additional_metrics: PerformanceMetricsSchema,
});

export const PerformanceSummarySchema = z.object({
  total_executions: z.number(),
  scripts: z.number(),
  average_execution_time: z.number(),
  fastest_execution: z.number(),
  slowest_execution: z.number(),
  total_execution_time: z.number(),
  successful_executions: z.number(),
  failed_executions: z.number(),
  success_rate: z.number(),
  average_memory_usage: z.number(),
  total_memory_usage: z.number(),
  script_performance: z.array(z.object({
    script: z.string(),
    executions: z.number(),
    average_time: z.number(),
    success_rate: z.number(),
  })),
});

// ============================================================================
// PERFORMANCE TRACKING SCHEMAS
// ============================================================================

export const GranularMetricsSchema = z.object({
  real_time: z.number(),
  user_time: z.number(),
  sys_time: z.number(),
  cpu_percent: z.number(),
  max_memory_mb: z.number(),
  avg_memory_mb: z.number(),
  output_size_bytes: z.number(),
  error_size_bytes: z.number(),
  memory_samples: z.number(),
});

export const EnvironmentSchema = z.object({
  node_version: z.string(),
  bun_version: z.string(),
  os: z.string(),
  cpu_cores: z.string(),
  memory_total: z.string(),
});

export const GranularLogEntrySchema = z.object({
  script: z.string(),
  execution_time: z.number(),
  memory_usage_mb: z.number(),
  exit_code: z.number(),
  timestamp: z.string(),
  git_sha: z.string(),
  git_branch: z.string(),
  additional_metrics: GranularMetricsSchema,
  environment: EnvironmentSchema,
});

export const TrendsAnalysisSchema = z.object({
  total_executions: z.number(),
  unique_scripts: z.number(),
  branches: z.array(z.string()),
  time_period: z.object({
    earliest: z.string(),
    latest: z.string(),
  }),
  performance_trends: z.array(z.object({
    script: z.string(),
    executions: z.number(),
    avg_time: z.number(),
    trend: z.number(),
    latest_time: z.number(),
    earliest_time: z.number(),
  })),
  regressions: z.array(z.object({
    script: z.string(),
    regression_percent: z.number(),
  })),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type PerformanceLogEntry = z.infer<typeof PerformanceLogEntrySchema>;
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;

export type GranularMetrics = z.infer<typeof GranularMetricsSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type GranularLogEntry = z.infer<typeof GranularLogEntrySchema>;
export type TrendsAnalysis = z.infer<typeof TrendsAnalysisSchema>;

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface PerformanceMonitorConfig {
  logDir: string;
  logFile: string;
  summaryFile: string;
  reportFile: string;
}

export interface PerformanceTrackerConfig {
  granularLogFile: string;
  trendsAnalysisFile: string;
  traceabilityReportFile: string;
  enableNotifications: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceMonitorConfig = {
  logDir: 'fossils/performance',
  logFile: 'fossils/performance/performance_log.json',
  summaryFile: 'fossils/performance/performance_summary.json',
  reportFile: 'fossils/performance/performance_report.md',
};

export const DEFAULT_TRACKER_CONFIG: PerformanceTrackerConfig = {
  granularLogFile: 'fossils/performance/granular_trace.json',
  trendsAnalysisFile: 'fossils/performance/trends_analysis.json',
  traceabilityReportFile: 'fossils/performance/traceability_report.md',
  enableNotifications: true,
}; 