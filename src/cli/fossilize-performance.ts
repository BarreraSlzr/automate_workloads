#!/usr/bin/env bun

import { Command } from 'commander';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { PerformanceResultSchema, PerformanceResult } from '../types/cli';

const program = new Command();

program
  .name('fossilize-performance')
  .description('Fossilize performance monitoring results')
  .option('--last', 'Fossilize the last performance run')
  .option('--commit <hash>', 'Specific commit hash to fossilize')
  .option('--input <path>', 'Input performance log file', 'fossils/performance/performance_log.json')
  .option('--output <path>', 'Output directory for fossils', 'fossils/performance')
  .parse();

const options = program.opts();

async function fossilizePerformance(): Promise<void> {
  const timestamp = new Date().toISOString();
  const commitHash = options.commit || process.env.GIT_COMMIT || 'unknown';
  const branch = process.env.GIT_BRANCH || 'unknown';
  const author = process.env.GIT_AUTHOR_NAME || 'unknown';
  const email = process.env.GIT_AUTHOR_EMAIL || 'unknown';

  // Read existing performance log
  let performanceData = [];
  try {
    const logContent = await readFile(options.input, 'utf-8');
    const logs = JSON.parse(logContent);
    // Get the most recent entries (last 10)
    performanceData = logs.slice(-10);
  } catch (error) {
    console.log('No existing performance log found, creating new fossil');
  }

  // Calculate summary
  const totalScripts = performanceData.length;
  const avgExecutionTime = totalScripts > 0 
    ? performanceData.reduce((sum: number, entry: any) => sum + entry.execution_time, 0) / totalScripts 
    : 0;
  const totalMemoryUsage = performanceData.reduce((sum: number, entry: any) => sum + entry.memory_usage, 0);
  
  // Determine performance status
  let performanceStatus: 'pass' | 'fail' | 'warning' = 'pass';
  if (avgExecutionTime > 10) {
    performanceStatus = 'warning';
  }
  if (avgExecutionTime > 30) {
    performanceStatus = 'fail';
  }

  const performanceResult: PerformanceResult = {
    timestamp,
    commit_hash: commitHash,
    branch,
    author,
    email,
    performance_data: performanceData,
    summary: {
      total_scripts: totalScripts,
      avg_execution_time: avgExecutionTime,
      total_memory_usage: totalMemoryUsage,
      performance_status: performanceStatus,
    },
  };

  // Ensure output directory exists
  await mkdir(options.output, { recursive: true });

  // Write fossil file
  const fossilPath = join(options.output, `performance_${timestamp.replace(/[:.]/g, '-')}.json`);
  await writeFile(fossilPath, JSON.stringify(performanceResult, null, 2));

  console.log(`✅ Performance results fossilized to: ${fossilPath}`);
  console.log(`📊 Summary: ${totalScripts} scripts, avg time: ${avgExecutionTime.toFixed(2)}s, status: ${performanceStatus}`);
}

fossilizePerformance().catch(console.error); 