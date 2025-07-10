// ============================================================================
// EVENT LOOP MONITORING TYPE DEFINITIONS
// ============================================================================
// Centralized type definitions for event loop monitoring

import { z } from 'zod';

// ============================================================================
// EVENT LOOP MONITORING SCHEMAS
// ============================================================================

export const CallStackEntrySchema = z.object({
  id: z.string(),
  functionName: z.string(),
  fileName: z.string(),
  lineNumber: z.number(),
  columnNumber: z.number(),
  timestamp: z.number(),
  duration: z.number().optional(),
  status: z.enum(['active', 'completed', 'timeout', 'error']),
  metadata: z.record(z.any()).optional(),
});

export const EventLoopSnapshotSchema = z.object({
  timestamp: z.number(),
  activeCalls: z.array(CallStackEntrySchema),
  completedCalls: z.array(CallStackEntrySchema),
  hangingCalls: z.array(CallStackEntrySchema),
  memoryUsage: z.object({
    heapUsed: z.number(),
    heapTotal: z.number(),
    external: z.number(),
    rss: z.number(),
  }),
  cpuUsage: z.object({
    user: z.number(),
    system: z.number(),
  }),
  eventLoopLag: z.number(),
  summary: z.object({
    totalActive: z.number(),
    totalCompleted: z.number(),
    totalHanging: z.number(),
    averageDuration: z.number(),
    maxDuration: z.number(),
  }),
});

export const HangingDetectionConfigSchema = z.object({
  timeoutThreshold: z.number().default(5000), // 5 seconds
  memoryThreshold: z.number().default(100 * 1024 * 1024), // 100MB
  cpuThreshold: z.number().default(80), // 80%
  eventLoopLagThreshold: z.number().default(100), // 100ms
  maxActiveCalls: z.number().default(100),
  enableStackTrace: z.boolean().default(true),
  enableMemoryTracking: z.boolean().default(true),
  enableCpuTracking: z.boolean().default(true),
  logHangingCalls: z.boolean().default(true),
  alertOnHanging: z.boolean().default(true),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CallStackEntry = z.infer<typeof CallStackEntrySchema>;
export type EventLoopSnapshot = z.infer<typeof EventLoopSnapshotSchema>;
export const EventLoopSnapshot = EventLoopSnapshotSchema;
export const CallStackEntry = CallStackEntrySchema;
export type HangingDetectionConfig = z.infer<typeof HangingDetectionConfigSchema>; 