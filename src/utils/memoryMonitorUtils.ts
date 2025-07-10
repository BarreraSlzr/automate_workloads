/**
 * Memory Monitor Utilities
 * 
 * TypeScript utilities for memory monitoring following project patterns:
 * - PARAMS OBJECT PATTERN for all functions
 * - Zod schema validation
 * - Fossil-backed data storage
 * - Type-safe operations
 */

import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

import {
  // Types
  MemoryMonitorConfig,
  MemorySnapshot,
  ProcessInfo,
  MemoryMonitorResult,
  SystemMemoryInfo,
  MemoryMonitoringFossil,
  MemoryMonitoringSessionFossil,
  MemoryMonitoringSummaryFossil,
  MemoryMonitorRunParams,
  CreateMemorySnapshotParams,
  CreateMemoryMonitoringSessionParams,
  CreateMemoryMonitoringSummaryParams,
  
  // Schemas
  MemoryMonitorConfigSchema,
  ProcessInfoSchema,
  MemorySnapshotSchema,
  MemoryMonitorResultSchema,
  SystemMemoryInfoSchema,
  MemoryMonitoringFossilSchema,
  MemoryMonitoringSessionFossilSchema,
  MemoryMonitoringSummaryFossilSchema,
} from '../types/memory-monitoring';

import { BaseFossil } from '../types/core';
import { parseJsonSafe } from '@/utils/json';

// ============================================================================
// CORE MEMORY MONITORING FUNCTIONS
// ============================================================================

/**
 * Get current system memory information
 * Follows PARAMS OBJECT PATTERN
 */
export async function getSystemMemoryInfo(params: {
  verbose?: boolean;
} = {}): Promise<SystemMemoryInfo> {
  const { verbose = false } = params;
  
  try {
    const vmstat = spawn('vm_stat');
    let output = '';
    
    vmstat.stdout.on('data', (data) => {
      output += data.toString();
    });

    return new Promise((resolve, reject) => {
      vmstat.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`vm_stat failed with code ${code}`));
          return;
        }

        // Parse vm_stat output (macOS specific)
        const lines = output.split('\n');
        const stats: Record<string, number> = {};
        
        lines.forEach((line, i, arr) => {
          if (i % 10 === 0 || i === arr.length - 1) {
            console.log(`🔄 Processing stat key ${i + 1} of ${arr.length}`);
          }
          const match = line.match(/^(.+?):\s+(\d+)/);
          if (match && match[1] && match[2]) {
            stats[match[1].trim()] = parseInt(match[2]);
          }
        });

        // Calculate memory in MB (pages are typically 4KB on macOS)
        const pageSize = 4096;
        const pagesWired = stats['Pages wired down'] || 0;
        const pagesActive = stats['Pages active'] || 0;
        const pagesInactive = stats['Pages inactive'] || 0;
        const pagesFree = stats['Pages free'] || 0;
        
        const totalMB = Math.round((pagesWired + pagesActive + pagesInactive + pagesFree) * pageSize / 1024 / 1024);
        const freeMB = Math.round(pagesFree * pageSize / 1024 / 1024);
        const usedMB = Math.round((pagesWired + pagesActive) * pageSize / 1024 / 1024);
        const availableMB = Math.round((pagesInactive + pagesFree) * pageSize / 1024 / 1024);

        const result: SystemMemoryInfo = { totalMB, freeMB, usedMB, availableMB };
        
        // Validate with schema
        const validated = SystemMemoryInfoSchema.parse(result);
        
        if (verbose) {
          console.log(`[MEMORY_UTILS] System memory: ${validated.totalMB}MB total, ${validated.freeMB}MB free`);
        }
        
        resolve(validated);
      });

      vmstat.on('error', reject);
    });
  } catch (error) {
    // Fallback to basic memory info
    const memUsage = process.memoryUsage();
    const result: SystemMemoryInfo = {
      totalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      freeMB: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
      usedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      availableMB: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
    
    return SystemMemoryInfoSchema.parse(result);
  }
}

/**
 * Get memory usage for a process group
 * Follows PARAMS OBJECT PATTERN
 */
export async function getProcessGroupMemory(params: {
  pgid: number;
  verbose?: boolean;
}): Promise<number> {
  const { pgid, verbose = false } = params;
  
  if (!pgid) {
    return 0;
  }
  
  try {
    const ps = spawn('ps', ['-o', 'rss=', '-g', pgid.toString()]);
    let output = '';
    
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    return new Promise((resolve, reject) => {
      ps.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ps command failed with code ${code}`));
          return;
        }

        const totalKB = output.trim().split('\n').reduce((sum, line, i, arr) => {
          if (i % 10 === 0 || i === arr.length - 1) {
            console.log(`🔄 Processing output line ${i + 1} of ${arr.length}`);
          }
          const kb = parseInt(line.trim()) || 0;
          return sum + kb;
        }, 0);
        
        const memoryMB = Math.round(totalKB / 1024);
        
        if (verbose) {
          console.log(`[MEMORY_UTILS] PGID ${pgid}: ${memoryMB}MB`);
        }
        
        resolve(memoryMB);
      });

      ps.on('error', reject);
    });
  } catch (error) {
    if (verbose) {
      console.error(`[MEMORY_UTILS] Error getting memory for PGID ${pgid}:`, error);
    }
    return 0;
  }
}

/**
 * Get detailed process information for a process group
 * Follows PARAMS OBJECT PATTERN
 */
export async function getProcessGroupDetails(params: {
  pgid: number;
  verbose?: boolean;
}): Promise<ProcessInfo[]> {
  const { pgid, verbose = false } = params;
  
  if (!pgid) {
    return [];
  }
  
  try {
    const ps = spawn('ps', ['-o', 'pid,command,rss', '-g', pgid.toString()]);
    let output = '';
    
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    return new Promise((resolve, reject) => {
      ps.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ps command failed with code ${code}`));
          return;
        }

        const lines = output.trim().split('\n').slice(1); // Skip header
        const processes: ProcessInfo[] = lines.map((line, i, arr) => {
          if (i % 10 === 0 || i === arr.length - 1) {
            console.log(`🔄 Processing process line ${i + 1} of ${arr.length}`);
          }
          const [pid, ...rest] = line.trim().split(/\s+/);
          const command = rest.slice(0, -1).join(' ') || '';
          const rssKB = parseInt(rest[rest.length - 1] || '0') || 0;
          
          return {
            pid: parseInt(pid || '0') || 0,
            command,
            memoryMB: Math.round(rssKB / 1024)
          };
        }).filter(p => p.pid > 0); // Filter out invalid processes
        
        // Validate each process with schema
        const validated = processes.map(p => ProcessInfoSchema.parse(p));
        
        if (verbose) {
          console.log(`[MEMORY_UTILS] PGID ${pgid}: ${validated.length} processes`);
        }
        
        resolve(validated);
      });

      ps.on('error', reject);
    });
  } catch (error) {
    if (verbose) {
      console.error(`[MEMORY_UTILS] Error getting process details for PGID ${pgid}:`, error);
    }
    return [];
  }
}

/**
 * Create a memory snapshot
 * Follows PARAMS OBJECT PATTERN
 */
export async function createMemorySnapshot(params: CreateMemorySnapshotParams): Promise<MemorySnapshot> {
  const { pgid, timestamp = new Date().toISOString() } = params;
  
  const memoryMB = await getProcessGroupMemory({ pgid });
  const processes = await getProcessGroupDetails({ pgid });
  
  const snapshot: MemorySnapshot = {
    timestamp,
    pgid,
    memoryMB,
    processCount: processes.length,
    processes
  };
  
  // Validate with schema
  return MemorySnapshotSchema.parse(snapshot);
}

/**
 * Log memory snapshot to file
 * Follows PARAMS OBJECT PATTERN
 */
export function logMemorySnapshot(params: {
  snapshot: MemorySnapshot;
  logFile: string;
  thresholdMB?: number;
}): void {
  const { snapshot, logFile, thresholdMB } = params;
  
  try {
    // Ensure log directory exists
    const logDir = join(logFile, '..');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    
    // Create log entry
    const logEntry = {
      timestamp: snapshot.timestamp,
      pgid: snapshot.pgid,
      memoryMB: snapshot.memoryMB,
      processCount: snapshot.processCount,
      thresholdMB,
      topProcesses: snapshot.processes
        .sort((a, b) => b.memoryMB - a.memoryMB)
        .slice(0, 3)
        .map(p => `${p.command}(${p.pid}):${p.memoryMB}MB`)
    };
    
    appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('[MEMORY_UTILS] Error logging snapshot:', error);
  }
}

/**
 * Create a memory monitoring fossil
 * Follows PARAMS OBJECT PATTERN and fossil pattern
 */
export function createMemoryMonitoringFossil(params: {
  sessionId: string;
  command: string;
  args: string[];
  config: MemoryMonitorConfig;
  result: MemoryMonitorResult;
  systemMemory: SystemMemoryInfo;
  source?: string;
  createdBy?: string;
}): MemoryMonitoringFossil {
  const {
    sessionId,
    command,
    args,
    config,
    result,
    systemMemory,
    source = 'memory-monitor',
    createdBy = 'system'
  } = params;
  
  const fossil: MemoryMonitoringFossil = {
    type: 'memory_monitoring_fossil',
    source,
    createdBy,
    createdAt: new Date().toISOString(),
    sessionId,
    command,
    args,
    config,
    result,
    systemMemory
  };
  
  // Validate with schema
  return MemoryMonitoringFossilSchema.parse(fossil);
}

/**
 * Save memory monitoring fossil to file
 * Follows PARAMS OBJECT PATTERN
 */
export function saveMemoryMonitoringFossil(params: {
  fossil: MemoryMonitoringFossil;
  outputPath: string;
}): void {
  const { fossil, outputPath } = params;
  
  try {
    // Ensure directory exists
    const dir = join(outputPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Save as JSON
    writeFileSync(outputPath, JSON.stringify(fossil, null, 2));
  } catch (error) {
    console.error('[MEMORY_UTILS] Error saving fossil:', error);
  }
}

/**
 * Load memory monitoring fossil from file
 * Follows PARAMS OBJECT PATTERN
 */
export function loadMemoryMonitoringFossil(params: {
  filePath: string;
}): MemoryMonitoringFossil {
  const { filePath } = params;
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const fossil = parseJsonSafe(content, 'memoryMonitorUtils:content') as any;
    
    // Validate with schema
    return MemoryMonitoringFossilSchema.parse(fossil);
  } catch (error) {
    throw new Error(`Failed to load memory monitoring fossil: ${error}`);
  }
}

/**
 * Create memory monitoring summary
 * Follows PARAMS OBJECT PATTERN
 */
export function createMemoryMonitoringSummary(params: CreateMemoryMonitoringSummaryParams): MemoryMonitoringSummaryFossil {
  const { period, startDate, endDate, sessions } = params;
  
  const totalSessions = sessions.length;
  const killedSessions = sessions.filter(s => s.killed).length;
  const maxMemoryValues = sessions.map(s => s.maxMemoryMB);
  const avgMaxMemoryMB = Math.round(maxMemoryValues.reduce((sum, val) => sum + val, 0) / totalSessions);
  const peakMemoryMB = Math.max(...maxMemoryValues);
  
  // Find most memory-intensive commands
  const commandStats = sessions.reduce((acc, session, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing session for command stats ${i + 1} of ${arr.length}`);
    }
    const key = session.command;
    if (!acc[key]) {
      acc[key] = { totalMemory: 0, count: 0 };
    }
    acc[key].totalMemory += session.maxMemoryMB;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { totalMemory: number; count: number }>);
  
  const mostMemoryIntensiveCommands = Object.entries(commandStats)
    .map(([command, stats], i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing command stat ${i + 1} of ${arr.length}`);
      }
      return ({
        command,
        avgMemoryMB: Math.round(stats.totalMemory / stats.count),
        sessionCount: stats.count
      });
    })
    .sort((a, b) => b.avgMemoryMB - a.avgMemoryMB)
    .slice(0, 5);
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (killedSessions > 0) {
    recommendations.push(`Consider increasing memory threshold for ${killedSessions} killed sessions`);
  }
  if (avgMaxMemoryMB > 1000) {
    recommendations.push('High average memory usage detected - consider optimizing memory-intensive processes');
  }
  if (mostMemoryIntensiveCommands.length > 0) {
    const topCommand = mostMemoryIntensiveCommands[0];
    if (topCommand) {
      recommendations.push(`Most memory-intensive command: ${topCommand.command} (${topCommand.avgMemoryMB}MB avg)`);
    }
  }
  
  const summary: MemoryMonitoringSummaryFossil = {
    type: 'memory_monitoring_summary_fossil',
    source: 'memory-monitor',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    period,
    startDate,
    endDate,
    totalSessions,
    killedSessions,
    avgMaxMemoryMB,
    peakMemoryMB,
    mostMemoryIntensiveCommands,
    recommendations
  };
  
  // Validate with schema
  return MemoryMonitoringSummaryFossilSchema.parse(summary);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current process memory usage
 */
export function getCurrentProcessMemoryMB(): number {
  const memUsage = process.memoryUsage();
  return Math.round(memUsage.heapUsed / 1024 / 1024);
}

/**
 * Check if process is still running
 */
export function isProcessRunning(params: {
  pid: number;
}): boolean {
  const { pid } = params;
  
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep utility
 */
export function sleep(params: {
  ms: number;
}): Promise<void> {
  const { ms } = params;
  return new Promise(resolve => setTimeout(resolve, ms));
} 