/**
 * Event Loop Monitoring Utility
 * Tracks call stacks and detects hanging operations in the event loop
 * @module utils/eventLoopMonitor
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { CallStackEntry, EventLoopSnapshot } from '../types/event-loop-monitoring';
import { z } from 'zod';
import { HangingDetectionConfigSchema } from '../types/event-loop-monitoring';
type EventLoopMonitorConfig = z.infer<typeof HangingDetectionConfigSchema>;

// Re-export for backward compatibility
export { HangingDetectionConfigSchema };

// ============================================================================
// GLOBAL MONITORING STATE
// ============================================================================

let globalMonitor: EventLoopMonitor | null = null;
let globalMonitoringActive = false;

// ============================================================================
// EVENT LOOP MONITOR CLASS
// ============================================================================

export class EventLoopMonitor {
  private config: EventLoopMonitorConfig;
  private activeCalls: Map<string, CallStackEntry> = new Map();
  private completedCalls: CallStackEntry[] = [];
  private hangingCalls: CallStackEntry[] = [];
  private snapshots: EventLoopSnapshot[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private startTime = 0;
  private lastCpuUsage = process.cpuUsage();
  private instanceId: string;

  constructor(config: Partial<EventLoopMonitorConfig> = {}) {
    this.config = HangingDetectionConfigSchema.parse({
      timeoutThreshold: 5000,
      memoryThreshold: 100 * 1024 * 1024,
      cpuThreshold: 80,
      eventLoopLagThreshold: 100,
      maxActiveCalls: 100,
      enableStackTrace: true,
      enableMemoryTracking: true,
      enableCpuTracking: true,
      logHangingCalls: true,
      alertOnHanging: true,
      ...config,
    });
    this.instanceId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start monitoring the event loop
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) {
      console.warn('Event loop monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.startTime = performance.now();
    this.lastCpuUsage = process.cpuUsage();

    console.log('🔍 Starting event loop monitoring...');
    console.log(`⏱️  Snapshot interval: ${intervalMs}ms`);
    console.log(`🚨 Timeout threshold: ${this.config.timeoutThreshold}ms`);
    console.log(`💾 Memory threshold: ${this.config.memoryThreshold / 1024 / 1024}MB`);

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  /**
   * Stop monitoring the event loop
   */
  stopMonitoring(): EventLoopSnapshot[] {
    if (!this.isMonitoring) {
      console.warn('Event loop monitoring is not active');
      return [];
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Take final snapshot to capture any remaining state
    const finalSnapshot = this.takeSnapshot();
    console.log('🛑 Event loop monitoring stopped');

    return this.snapshots;
  }

  /**
   * Track a function call
   */
  trackCall<T>(
    functionName: string,
    operation: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const callId = this.generateCallId();
    const stackTrace = this.getStackTrace();
    const callEntry: CallStackEntry = {
      id: callId,
      functionName,
      fileName: stackTrace.fileName,
      lineNumber: stackTrace.lineNumber,
      columnNumber: stackTrace.columnNumber,
      timestamp: performance.now(),
      status: 'active',
      metadata,
    };

    this.activeCalls.set(callId, callEntry);

    const startTime = performance.now();
    let completed = false;

    const completeCall = (status: 'completed' | 'error' | 'timeout', result?: any, error?: any) => {
      if (!completed) {
        completed = true;
        callEntry.status = status;
        callEntry.duration = performance.now() - startTime;
        
        if (status === 'error' && error) {
          callEntry.metadata = { ...callEntry.metadata, error: error.message };
        }
        
        // Remove from active calls first
        this.activeCalls.delete(callId);
        
        // Add to appropriate collection
        if (status === 'timeout') {
          this.hangingCalls.push(callEntry);
        } else {
          this.completedCalls.push(callEntry);
        }
        
        if (status === 'timeout' && this.config.alertOnHanging) {
          console.error(`🚨 HANGING CALL DETECTED: ${functionName} (${callId})`);
          console.error(`   Duration: ${callEntry.duration.toFixed(2)}ms`);
          console.error(`   Location: ${callEntry.fileName}:${callEntry.lineNumber}`);
          if (metadata) {
            console.error(`   Metadata:`, metadata);
          }
        }
      }
    };

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        completeCall('timeout');
        reject(new Error(`Call timed out after ${this.config.timeoutThreshold}ms: ${functionName}`));
      }, this.config.timeoutThreshold);
    });

    // Execute the operation with timeout
    const operationPromise = (async () => {
      try {
        const result = operation();
        
        // Handle both Promise and synchronous results
        if (result instanceof Promise) {
          const value = await result;
          completeCall('completed');
          return value;
        } else {
          // Synchronous operation
          completeCall('completed');
          return result;
        }
      } catch (error) {
        completeCall('error', undefined, error);
        throw error;
      }
    })();

    return Promise.race([operationPromise, timeoutPromise]);
  }

  /**
   * Take a snapshot of the current event loop state
   */
  private takeSnapshot(): EventLoopSnapshot {
    const timestamp = performance.now();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();

    // Calculate event loop lag
    const eventLoopLag = this.measureEventLoopLag();

    // Update hanging calls
    this.detectHangingCalls();

    // Calculate summary - use total counts for consistency
    const activeCallsArray = Array.from(this.activeCalls.values());
    const completedCallsArray = this.completedCalls.slice(-100); // Keep last 100 for snapshot
    const hangingCallsArray = this.hangingCalls.slice(-50); // Keep last 50 for snapshot

    // Add progress logging to all loops and batch operations
    const durations = completedCallsArray.map((call, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing completed call ${i + 1} of ${arr.length}`);
      }
      return typeof call.duration === 'number' ? call.duration : 0;
    });

    const averageDuration = durations.length > 0 ? durations.reduce((sum, d, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing duration ${i + 1} of ${arr.length}`);
      }
      return (sum || 0) + (d || 0);
    }, 0) / durations.length : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    console.log(`🔄 Processed maxDuration for ${durations.length} durations`);

    const hangingThreshold = this.config.timeoutThreshold || 10000;
    console.log(`🔄 Set hangingThreshold: ${hangingThreshold}`);

    const snapshot: EventLoopSnapshot = {
      timestamp,
      activeCalls: activeCallsArray,
      completedCalls: completedCallsArray,
      hangingCalls: hangingCallsArray,
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoopLag,
      summary: {
        totalActive: this.activeCalls.size, // Use actual count
        totalCompleted: this.completedCalls.length, // Use actual count
        totalHanging: this.hangingCalls.length, // Use actual count
        averageDuration,
        maxDuration,
      },
    };

    this.snapshots.push(snapshot);

    // Check for alerts
    this.checkAlerts(snapshot);

    return snapshot;
  }

  /**
   * Detect hanging calls based on duration
   */
  private detectHangingCalls(): void {
    const now = performance.now();
    const hangingThreshold = this.config.timeoutThreshold;

    for (const [callId, call] of this.activeCalls.entries()) {
      const duration = now - call.timestamp;
      if (duration > hangingThreshold) {
        call.status = 'timeout';
        call.duration = duration;
        this.hangingCalls.push(call);
        this.activeCalls.delete(callId);

        if (this.config.logHangingCalls) {
          console.warn(`⚠️  Hanging call detected: ${call.functionName} (${duration.toFixed(2)}ms)`);
        }
      }
    }
  }

  /**
   * Measure event loop lag
   */
  private measureEventLoopLag(): number {
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      // This is a simplified measurement - in practice you'd want more sophisticated lag detection
    });
    return 0; // Simplified for now
  }

  /**
   * Check for alerts based on thresholds
   */
  private checkAlerts(snapshot: EventLoopSnapshot): void {
    const { memoryUsage, cpuUsage, summary } = snapshot;

    // Memory alert
    if (memoryUsage.heapUsed > this.config.memoryThreshold) {
      console.warn(`⚠️  High memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    // CPU alert
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    if (cpuPercent > this.config.cpuThreshold) {
      console.warn(`⚠️  High CPU usage: ${cpuPercent.toFixed(2)}%`);
    }

    // Active calls alert
    if (summary.totalActive > this.config.maxActiveCalls) {
      console.warn(`⚠️  Too many active calls: ${summary.totalActive}`);
    }

    // Hanging calls alert
    if (summary.totalHanging > 0) {
      console.error(`🚨 ${summary.totalHanging} hanging calls detected!`);
    }
  }

  /**
   * Generate a unique call ID
   */
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stack trace information
   */
  private getStackTrace(): { fileName: string; lineNumber: number; columnNumber: number } {
    const stack = new Error().stack;
    const lines = stack?.split('\n') || [];
    
    if (Array.isArray(lines) && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        if (i % 10 === 0 || i === lines.length - 1) {
          console.log(`🔄 Processing stack line ${i + 1} of ${lines.length}`);
        }
        if (typeof lines[i] === 'string' && lines[i]?.includes('at ') && !lines[i]?.includes('eventLoopMonitor.ts')) {
          const match = lines[i]?.match(/at .+ \((.+):(\d+):(\d+)\)/);
          if (match && match[1] && match[2] && match[3]) {
            const [, fileName, line, column] = match;
            if (fileName && line && column) {
              return {
                fileName: fileName,
                lineNumber: Number(line),
                columnNumber: Number(column),
              };
            }
          }
        }
      }
    }
    
    return {
      fileName: 'unknown',
      lineNumber: 0,
      columnNumber: 0,
    };
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    activeCalls: number;
    completedCalls: number;
    hangingCalls: number;
    snapshots: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      activeCalls: this.activeCalls.size,
      completedCalls: this.completedCalls.length,
      hangingCalls: this.hangingCalls.length,
      snapshots: this.snapshots.length,
    };
  }

  /**
   * Get call stack summary
   */
  getCallStackSummary(): {
    active: CallStackEntry[];
    hanging: CallStackEntry[];
    recent: CallStackEntry[];
    summary: {
      totalActive: number;
      totalHanging: number;
      totalCompleted: number;
      averageDuration: number;
      maxDuration: number;
    };
  } {
    const active = Array.from(this.activeCalls.values());
    const hanging = this.hangingCalls.slice(-10); // Last 10 hanging calls
    const recent = this.completedCalls.slice(-20); // Last 20 completed calls
    
    const allDurations = [...(this.completedCalls || []), ...(this.hangingCalls || [])].map((call, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing all call ${i + 1} of ${arr.length}`);
      }
      return typeof call.duration === 'number' ? call.duration : 0;
    });
    
    const averageAllDuration = allDurations.length > 0 ? allDurations.reduce((sum, d, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing all duration ${i + 1} of ${arr.length}`);
      }
      return (sum || 0) + (d || 0);
    }, 0) / allDurations.length : 0;
    const maxAllDuration = allDurations.length > 0 ? Math.max(...allDurations) : 0;
    console.log(`🔄 Processed maxAllDuration for ${allDurations.length} allDurations`);

    return {
      active,
      hanging,
      recent,
      summary: {
        totalActive: this.activeCalls.size,
        totalHanging: this.hangingCalls.length,
        totalCompleted: this.completedCalls.length,
        averageDuration: averageAllDuration,
        maxDuration: maxAllDuration,
      },
    };
  }

  /**
   * Export monitoring data to file
   */
  exportData(filePath: string): void {
    const data = {
      instanceId: this.instanceId,
      config: this.config,
      status: this.getStatus(),
      callStackSummary: this.getCallStackSummary(),
      snapshots: this.snapshots,
    };

    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`📊 Event loop monitoring data exported to: ${filePath}`);
  }

  /**
   * Generate a monitoring report
   */
  generateReport(): string {
    const status = this.getStatus();
    const summary = this.getCallStackSummary();
    const duration = this.isMonitoring ? performance.now() - this.startTime : 0;

    let report = `# Event Loop Monitoring Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Monitoring Active:** ${this.isMonitoring ? 'Yes' : 'No'}\n\n`;

    report += `## Summary\n\n`;
    report += `- **Duration:** ${duration.toFixed(0)}ms\n`;
    report += `- **Snapshots:** ${status.snapshots}\n`;
    report += `- **Active Calls:** ${status.activeCalls}\n`;
    report += `- **Completed Calls:** ${status.completedCalls}\n`;
    report += `- **Hanging Calls:** ${status.hangingCalls}\n`;
    report += `- **Average Duration:** ${summary.summary.averageDuration.toFixed(2)}ms\n`;
    report += `- **Max Duration:** ${summary.summary.maxDuration.toFixed(2)}ms\n\n`;

    if (summary.active.length > 0) {
      report += `## Currently Running Tests\n\n`;
      for (const call of summary.active) {
        const duration = performance.now() - call.timestamp;
        console.log(`🔄 Calculated duration: ${duration}`);
        report += `- **${call.functionName}** (${duration.toFixed(2)}ms)\n`;
        report += `  - Location: ${call.fileName}:${call.lineNumber}\n\n`;
      }
    }

    if (summary.hanging.length > 0) {
      report += `## Hanging Calls\n\n`;
      for (const call of summary.hanging) {
        report += `- **${call.functionName}** (${(call.duration || 0).toFixed(2)}ms)\n`;
        report += `  - Location: ${call.fileName}:${call.lineNumber}\n\n`;
      }
    }
    console.log(`🔄 Generated event loop monitoring report`);
    return report;
  }

  /**
   * Clear all monitoring data
   */
  clear(): void {
    this.activeCalls.clear();
    this.completedCalls = [];
    this.hangingCalls = [];
    this.snapshots = [];
    console.log('🧹 Event loop monitoring data cleared');
  }
}

// ============================================================================
// GLOBAL MONITORING FUNCTIONS
// ============================================================================

/**
 * Get or create a global event loop monitor
 */
export function getEventLoopMonitor(config?: Partial<EventLoopMonitorConfig>): EventLoopMonitor {
  if (!globalMonitor) {
    globalMonitor = new EventLoopMonitor(config);
  }
  return globalMonitor;
}

/**
 * Start global monitoring
 */
export function startGlobalMonitoring(intervalMs: number = 1000, config?: Partial<EventLoopMonitorConfig>): void {
  if (globalMonitoringActive) {
    console.warn('Global monitoring is already active');
    return;
  }
  
  globalMonitor = new EventLoopMonitor(config);
  globalMonitor.startMonitoring(intervalMs);
  globalMonitoringActive = true;
}

/**
 * Stop global monitoring
 */
export function stopGlobalMonitoring(): EventLoopSnapshot[] {
  if (!globalMonitoringActive || !globalMonitor) {
    console.warn('Global monitoring is not active');
    return [];
  }
  
  const snapshots = globalMonitor.stopMonitoring();
  globalMonitoringActive = false;
  return snapshots;
}

/**
 * Track an operation using global monitoring
 */
export async function trackOperation<T>(
  operation: () => Promise<T> | T,
  functionName?: string,
  metadata?: Record<string, any>
): Promise<T> {
  if (!globalMonitor || !globalMonitoringActive) {
    // If no global monitoring, just run the operation
    return Promise.resolve(operation());
  }

  const name = functionName || 'anonymous';
  return globalMonitor.trackCall(name, operation, metadata);
}

/**
 * Get global call stack summary
 */
export function getCallStackSummary() {
  if (!globalMonitor) {
    return {
      active: [],
      hanging: [],
      recent: [],
      summary: {
        totalActive: 0,
        totalHanging: 0,
        totalCompleted: 0,
        averageDuration: 0,
        maxDuration: 0,
      },
    };
  }
  return globalMonitor.getCallStackSummary();
}

/**
 * Export global monitoring data
 */
export function exportMonitoringData(filePath: string = 'fossils/event-loop-monitoring.json'): void {
  if (!globalMonitor) {
    console.warn('No global monitoring data to export');
    return;
  }
  globalMonitor.exportData(filePath);
}

/**
 * Generate global monitoring report
 */
export function generateMonitoringReport(): string {
  if (!globalMonitor) {
    return '# Event Loop Monitoring Report\n\nNo monitoring data available.';
  }
  return globalMonitor.generateReport();
} 