import { z } from 'zod';
import { BaseFossil } from './core';

// ============================================================================
// MEMORY MONITORING TYPES
// ============================================================================

/**
 * Memory monitoring configuration interface
 */
export interface MemoryMonitorConfig {
  thresholdMB: number;
  checkIntervalMs: number;
  logFile?: string;
  notifyScript?: string;
  killOnExceed?: boolean;
  verbose?: boolean;
}

/**
 * Memory snapshot interface
 */
export interface MemorySnapshot {
  timestamp: string;
  pgid: number;
  memoryMB: number;
  processCount: number;
  processes: ProcessInfo[];
}

/**
 * Process information interface
 */
export interface ProcessInfo {
  pid: number;
  command: string;
  memoryMB: number;
}

/**
 * Memory monitoring result interface
 */
export interface MemoryMonitorResult {
  success: boolean;
  killed: boolean;
  maxMemoryMB: number;
  durationMs: number;
  snapshots: MemorySnapshot[];
  summary: string;
}

/**
 * System memory information interface
 */
export interface SystemMemoryInfo {
  totalMB: number;
  freeMB: number;
  usedMB: number;
  availableMB: number;
}

/**
 * Memory monitoring fossil interface
 * Extends BaseFossil for consistency with project patterns
 */
export interface MemoryMonitoringFossil extends BaseFossil {
  type: 'memory_monitoring_fossil';
  sessionId: string;
  command: string;
  args: string[];
  config: MemoryMonitorConfig;
  result: MemoryMonitorResult;
  systemMemory: SystemMemoryInfo;
}

/**
 * Memory monitoring session fossil interface
 */
export interface MemoryMonitoringSessionFossil extends BaseFossil {
  type: 'memory_monitoring_session_fossil';
  sessionId: string;
  startTime: string;
  endTime?: string;
  command: string;
  args: string[];
  config: MemoryMonitorConfig;
  snapshots: MemorySnapshot[];
  maxMemoryMB: number;
  avgMemoryMB: number;
  killed: boolean;
  durationMs: number;
}

/**
 * Memory monitoring summary fossil interface
 */
export interface MemoryMonitoringSummaryFossil extends BaseFossil {
  type: 'memory_monitoring_summary_fossil';
  period: string; // e.g., 'daily', 'weekly', 'monthly'
  startDate: string;
  endDate: string;
  totalSessions: number;
  killedSessions: number;
  avgMaxMemoryMB: number;
  peakMemoryMB: number;
  mostMemoryIntensiveCommands: Array<{
    command: string;
    avgMemoryMB: number;
    sessionCount: number;
  }>;
  recommendations: string[];
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

/**
 * Memory monitor configuration schema
 */
export const MemoryMonitorConfigSchema = z.object({
  thresholdMB: z.number().min(1).max(32000).default(500),
  checkIntervalMs: z.number().min(100).max(60000).default(2000),
  logFile: z.string().optional(),
  notifyScript: z.string().optional(),
  killOnExceed: z.boolean().default(true),
  verbose: z.boolean().default(false),
});

/**
 * Process information schema
 */
export const ProcessInfoSchema = z.object({
  pid: z.number().positive(),
  command: z.string(),
  memoryMB: z.number().nonnegative(),
});

/**
 * Memory snapshot schema
 */
export const MemorySnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  pgid: z.number().positive(),
  memoryMB: z.number().nonnegative(),
  processCount: z.number().nonnegative(),
  processes: z.array(ProcessInfoSchema),
});

/**
 * Memory monitor result schema
 */
export const MemoryMonitorResultSchema = z.object({
  success: z.boolean(),
  killed: z.boolean(),
  maxMemoryMB: z.number().nonnegative(),
  durationMs: z.number().nonnegative(),
  snapshots: z.array(MemorySnapshotSchema),
  summary: z.string(),
});

/**
 * System memory information schema
 */
export const SystemMemoryInfoSchema = z.object({
  totalMB: z.number().positive(),
  freeMB: z.number().nonnegative(),
  usedMB: z.number().nonnegative(),
  availableMB: z.number().nonnegative(),
});

/**
 * Memory monitoring fossil schema
 */
export const MemoryMonitoringFossilSchema = z.object({
  type: z.literal('memory_monitoring_fossil'),
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  fossilId: z.string().optional(),
  fossilHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sessionId: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  config: MemoryMonitorConfigSchema,
  result: MemoryMonitorResultSchema,
  systemMemory: SystemMemoryInfoSchema,
});

/**
 * Memory monitoring session fossil schema
 */
export const MemoryMonitoringSessionFossilSchema = z.object({
  type: z.literal('memory_monitoring_session_fossil'),
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  fossilId: z.string().optional(),
  fossilHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sessionId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  command: z.string(),
  args: z.array(z.string()),
  config: MemoryMonitorConfigSchema,
  snapshots: z.array(MemorySnapshotSchema),
  maxMemoryMB: z.number().nonnegative(),
  avgMemoryMB: z.number().nonnegative(),
  killed: z.boolean(),
  durationMs: z.number().nonnegative(),
});

/**
 * Memory monitoring summary fossil schema
 */
export const MemoryMonitoringSummaryFossilSchema = z.object({
  type: z.literal('memory_monitoring_summary_fossil'),
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  fossilId: z.string().optional(),
  fossilHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalSessions: z.number().nonnegative(),
  killedSessions: z.number().nonnegative(),
  avgMaxMemoryMB: z.number().nonnegative(),
  peakMemoryMB: z.number().nonnegative(),
  mostMemoryIntensiveCommands: z.array(z.object({
    command: z.string(),
    avgMemoryMB: z.number().nonnegative(),
    sessionCount: z.number().nonnegative(),
  })),
  recommendations: z.array(z.string()),
});

// ============================================================================
// CLI ARGUMENT SCHEMAS
// ============================================================================

/**
 * Memory monitor CLI arguments schema
 */
export const MemoryMonitorCLIArgsSchema = z.object({
  threshold: z.number().min(1).max(32000).default(500),
  interval: z.number().min(1).max(60).default(2),
  log: z.string().optional(),
  notify: z.string().optional(),
  verbose: z.boolean().default(false),
  'no-kill': z.boolean().default(false),
  help: z.boolean().default(false),
});

/**
 * Bun test safe CLI arguments schema
 */
export const BunTestSafeCLIArgsSchema = z.object({
  threshold: z.number().min(1).max(32000).default(800),
  interval: z.number().min(1).max(60).default(3),
  log: z.string().optional(),
  verbose: z.boolean().default(false),
  'dry-run': z.boolean().default(false),
  help: z.boolean().default(false),
  // Pass through arguments for bun test
  _: z.array(z.string()).default([]),
});

// ============================================================================
// PARAMS OBJECT PATTERN INTERFACES
// ============================================================================

/**
 * Memory monitor run parameters
 */
export interface MemoryMonitorRunParams {
  command: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  config?: Partial<MemoryMonitorConfig>;
}

/**
 * Memory snapshot creation parameters
 */
export interface CreateMemorySnapshotParams {
  pgid: number;
  timestamp?: string;
}

/**
 * Memory monitoring session creation parameters
 */
export interface CreateMemoryMonitoringSessionParams {
  sessionId: string;
  command: string;
  args: string[];
  config: MemoryMonitorConfig;
  startTime?: string;
}

/**
 * Memory monitoring summary creation parameters
 */
export interface CreateMemoryMonitoringSummaryParams {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  sessions: MemoryMonitoringSessionFossil[];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MemoryMonitorConfigType = z.infer<typeof MemoryMonitorConfigSchema>;
export type MemorySnapshotType = z.infer<typeof MemorySnapshotSchema>;
export type MemoryMonitorResultType = z.infer<typeof MemoryMonitorResultSchema>;
export type SystemMemoryInfoType = z.infer<typeof SystemMemoryInfoSchema>;
export type MemoryMonitoringFossilType = z.infer<typeof MemoryMonitoringFossilSchema>;
export type MemoryMonitoringSessionFossilType = z.infer<typeof MemoryMonitoringSessionFossilSchema>;
export type MemoryMonitoringSummaryFossilType = z.infer<typeof MemoryMonitoringSummaryFossilSchema>;
export type MemoryMonitorCLIArgsType = z.infer<typeof MemoryMonitorCLIArgsSchema>;
export type BunTestSafeCLIArgsType = z.infer<typeof BunTestSafeCLIArgsSchema>;

 