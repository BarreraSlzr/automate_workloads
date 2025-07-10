import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import {
  PerformanceMetricsSchema,
  PerformanceLogEntrySchema,
  PerformanceSummarySchema,
  PerformanceMetrics,
  PerformanceLogEntry,
  PerformanceSummary,
  PerformanceMonitorConfig,
  DEFAULT_PERFORMANCE_CONFIG
} from '../types/performance';
import { parseJsonSafe } from '@/utils/json';

// Performance monitoring utility class
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private logs: PerformanceLogEntry[] = [];

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
    this.ensureLogDirectory();
    this.loadExistingLogs();
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private loadExistingLogs(): void {
    if (existsSync(this.config.logFile)) {
      try {
        const content = readFileSync(this.config.logFile, 'utf-8');
        const data = parseJsonSafe(content, 'performanceMonitor:content') as any[];
        this.logs = Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Failed to load existing performance logs:', error);
        this.logs = [];
      }
    }
  }

  private saveLogs(): void {
    writeFileSync(this.config.logFile, JSON.stringify(this.logs, null, 2));
  }

  /**
   * Monitor performance of a script execution
   */
  async monitorScript(
    scriptPath: string,
    options: {
      captureOutput?: boolean;
      timeout?: number;
      env?: Record<string, string>;
    } = {}
  ): Promise<PerformanceLogEntry> {
    const scriptName = scriptPath.replace(/\.(ts|js)$/, '');
    const timestamp = new Date().toISOString();
    
    console.log(`🔍 Monitoring performance for: ${scriptName}`);
    console.log(`⏰ Timestamp: ${timestamp}`);

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    let exitCode = 0;
    let output = '';
    let error = '';
    let executionTime = 0;
    let memoryUsage = 0;

    try {
      // Execute script with performance monitoring
      const result = execSync(`bun run ${scriptPath}`, {
        encoding: 'utf-8',
        timeout: options.timeout,
        env: { ...process.env, ...options.env },
        stdio: options.captureOutput ? 'pipe' : 'inherit',
      });

      if (options.captureOutput) {
        output = result;
      }

      executionTime = (Date.now() - startTime) / 1000; // Convert to seconds
      const endMemory = process.memoryUsage();
      memoryUsage = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024; // MB

    } catch (error: any) {
      exitCode = error.status || 1;
      if (options.captureOutput && error.stdout) {
        output = error.stdout;
      }
      if (options.captureOutput && error.stderr) {
        error = error.stderr;
      }
      executionTime = (Date.now() - startTime) / 1000;
    }

    // Calculate additional metrics
    const additionalMetrics: PerformanceMetrics = {
      real_time: executionTime,
      user_time: executionTime * 0.8, // Approximation
      sys_time: executionTime * 0.2, // Approximation
      output_size_bytes: Buffer.byteLength(output, 'utf-8'),
      error_size_bytes: Buffer.byteLength(error, 'utf-8'),
      cpu_percent: 100, // Approximation
    };

    // Create log entry
    const logEntry: PerformanceLogEntry = {
      script: scriptName,
      execution_time: executionTime,
      memory_usage_mb: Math.abs(memoryUsage),
      exit_code: exitCode,
      timestamp,
      additional_metrics: additionalMetrics,
    };

    // Validate and add to logs
    PerformanceLogEntrySchema.parse(logEntry);
    this.logs.push(logEntry);
    this.saveLogs();

    // Display results
    console.log(`✅ Execution completed`);
    console.log(`⏱️  Real time: ${executionTime.toFixed(2)}s`);
    console.log(`💾 Memory usage: ${Math.abs(memoryUsage).toFixed(2)}MB`);
    console.log(`🔢 Exit code: ${exitCode}`);

    if (output) {
      console.log(`📤 Output: ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`);
    }

    if (error) {
      console.log(`❌ Errors: ${error.substring(0, 200)}${error.length > 200 ? '...' : ''}`);
    }

    return logEntry;
  }

  /**
   * Generate performance summary
   */
  generateSummary(): PerformanceSummary {
    if (this.logs.length === 0) {
      throw new Error('No performance data available');
    }

    const totalExecutions = this.logs.length;
    // Add progress logging to all loops and batch operations
    const uniqueScripts = new Set(this.logs.map((log, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing log for uniqueScripts ${i + 1} of ${arr.length}`);
      }
      return log.script;
    }));

    const executionTimes = this.logs.map((log, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing log for executionTimes ${i + 1} of ${arr.length}`);
      }
      return log.execution_time;
    });

    const memoryUsages = this.logs.map((log, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing log for memoryUsages ${i + 1} of ${arr.length}`);
      }
      return log.memory_usage_mb;
    });

    const exitCodes = this.logs.map((log, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing log for exitCodes ${i + 1} of ${arr.length}`);
      }
      return log.exit_code;
    });

    const successfulExecutions = exitCodes.filter(code => code === 0).length;
    const failedExecutions = totalExecutions - successfulExecutions;

    // Calculate script performance breakdown
    const scriptGroups = this.logs.reduce((acc, log, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing log for scriptGroups ${i + 1} of ${arr.length}`);
      }
      if (!acc[log.script]) {
        acc[log.script] = [];
      }
      acc[log.script]!.push(log);
      return acc;
    }, {} as Record<string, PerformanceLogEntry[]>);

    const scriptPerformance = Object.entries(scriptGroups).map(([script, logs], i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing script group ${i + 1} of ${arr.length}`);
      }
      const executions = logs.length;
      const averageTime = logs.reduce((sum, log, i) => {
        if (i % 10 === 0 || i === logs.length - 1) {
          console.log(`🔄 Processing log (reduce) ${i + 1} of ${logs.length}`);
        }
        return sum + log.execution_time;
      }, 0) / executions;
      const successRate = (logs.filter(log => log.exit_code === 0).length / executions) * 100;

      return {
        script,
        executions,
        average_time: averageTime,
        success_rate: successRate,
      };
    });

    const summary: PerformanceSummary = {
      total_executions: totalExecutions,
      scripts: uniqueScripts.size,
      average_execution_time: executionTimes.reduce((sum, time) => sum + time, 0) / totalExecutions,
      fastest_execution: Math.min(...executionTimes),
      slowest_execution: Math.max(...executionTimes),
      total_execution_time: executionTimes.reduce((sum, time) => sum + time, 0),
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      success_rate: (successfulExecutions / totalExecutions) * 100,
      average_memory_usage: memoryUsages.reduce((sum, usage) => sum + usage, 0) / totalExecutions,
      total_memory_usage: memoryUsages.reduce((sum, usage) => sum + usage, 0),
      script_performance: scriptPerformance,
    };

    // Validate and save summary
    PerformanceSummarySchema.parse(summary);
    writeFileSync(this.config.summaryFile, JSON.stringify(summary, null, 2));

    return summary;
  }

  /**
   * Generate performance report in markdown format
   */
  generateReport(): string {
    const summary = this.generateSummary();
    const timestamp = new Date().toISOString();

    const report = `# Performance Report

Generated on: ${timestamp}

## Executive Summary

- **Total Executions**: ${summary.total_executions}
- **Unique Scripts**: ${summary.scripts}
- **Success Rate**: ${summary.success_rate.toFixed(1)}%
- **Total Execution Time**: ${summary.total_execution_time.toFixed(2)}s

## Performance Metrics

### Timing
- **Average Execution Time**: ${summary.average_execution_time.toFixed(2)}s
- **Fastest Execution**: ${summary.fastest_execution.toFixed(2)}s
- **Slowest Execution**: ${summary.slowest_execution.toFixed(2)}s

### Resource Usage
- **Average Memory Usage**: ${summary.average_memory_usage.toFixed(2)}MB

### Reliability
- **Successful Executions**: ${summary.successful_executions}
- **Failed Executions**: ${summary.failed_executions}

## Script Performance Breakdown

${summary.script_performance.map(sp => 
  `- **${sp.script}**: ${sp.executions} executions, avg ${sp.average_time.toFixed(2)}s, ${sp.success_rate.toFixed(1)}% success rate`
).join('\n')}

## Recommendations

${this.generateRecommendations(summary)}

## Fossilization Integration

This performance data is integrated with the project's fossilization patterns:
- Performance logs are stored in \`${this.config.logDir}\`
- Data can be used for CI/CD optimization
- Historical trends can be analyzed for capacity planning
- Performance metrics are validated using Zod schemas
- Reports are generated in markdown format for easy review

## Usage Examples

\`\`\`bash
# Monitor a single script
bun run src/utils/performanceMonitor.ts monitor scripts/llm-chat-context.ts

# Generate summary
bun run src/utils/performanceMonitor.ts summary

# Generate report
bun run src/utils/performanceMonitor.ts report
\`\`\`
`;

    writeFileSync(this.config.reportFile, report);
    return report;
  }

  /**
   * Generate recommendations based on performance data
   */
  private generateRecommendations(summary: PerformanceSummary): string {
    const recommendations: string[] = [];

    if (summary.average_execution_time > 10) {
      recommendations.push(
        '- ⚠️ **High execution times detected**: Consider optimizing slow scripts',
        '- 🔍 **Profile slow scripts**: Use `bun --inspect` for detailed profiling',
        '- 📦 **Check dependencies**: Review and optimize imports'
      );
    }

    if (summary.success_rate < 90) {
      recommendations.push(
        '- ❌ **Low success rate**: Investigate and fix failing scripts',
        '- 🧪 **Add error handling**: Improve script robustness',
        '- 📝 **Review error logs**: Check performance logs for details'
      );
    }

    recommendations.push(
      '- 📊 **Monitor trends**: Run performance monitoring regularly to track improvements',
      '- 🔄 **Optimize CI/CD**: Use performance data to optimize pipeline',
      '- 💾 **Memory optimization**: Consider memory usage for long-running scripts',
      '- 🎯 **Set performance targets**: Define acceptable execution times for different script types'
    );

    return recommendations.join('\n');
  }

  /**
   * Get performance insights for fossilization patterns
   */
  getFossilizationInsights(): {
    fossilizationPercentage: number;
    recommendations: string[];
    performanceTrends: Record<string, any>;
  } {
    const summary = this.generateSummary();
    
    // Calculate fossilization percentage (scripts with successful execution)
    const fossilizationPercentage = summary.success_rate;

    // Generate recommendations for fossilization patterns
    const recommendations: string[] = [];
    
    if (fossilizationPercentage < 95) {
      recommendations.push(
        'Improve script reliability to increase fossilization success rate',
        'Add better error handling and validation to scripts',
        'Review failing scripts and fix underlying issues'
      );
    }

    if (summary.average_execution_time > 5) {
      recommendations.push(
        'Optimize slow scripts to improve overall fossilization efficiency',
        'Consider parallel execution for independent scripts',
        'Review and optimize dependencies and imports'
      );
    }

    // Analyze performance trends
    const performanceTrends = {
      averageExecutionTime: summary.average_execution_time,
      successRate: summary.success_rate,
      totalScripts: summary.scripts,
      fastestScript: summary.script_performance.reduce((fastest, current) => 
        current.average_time < fastest.average_time ? current : fastest
      ),
      slowestScript: summary.script_performance.reduce((slowest, current) => 
        current.average_time > slowest.average_time ? current : slowest
      ),
    };

    return {
      fossilizationPercentage,
      recommendations,
      performanceTrends,
    };
  }

  /**
   * Clean performance logs
   */
  cleanLogs(): void {
    this.logs = [];
    this.saveLogs();
    console.log('🧹 Performance logs cleaned');
  }

  /**
   * Get all performance logs
   */
  getLogs(): PerformanceLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific script
   */
  getScriptLogs(scriptName: string): PerformanceLogEntry[] {
    return this.logs.filter(log => log.script === scriptName);
  }
}

// CLI interface for the performance monitor
export async function runPerformanceMonitorCLI(args: string[]): Promise<void> {
  const monitor = new PerformanceMonitor();
  const command = args[0];

  switch (command) {
    case 'monitor':
      if (!args[1]) {
        console.error('❌ Error: Script path required');
        process.exit(1);
      }
      await monitor.monitorScript(args[1], { captureOutput: true });
      break;

    case 'summary':
      const summary = monitor.generateSummary();
      console.log('📊 Performance Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    case 'report':
      const report = monitor.generateReport();
      console.log('📋 Performance Report generated');
      console.log(report);
      break;

    case 'insights':
      const insights = monitor.getFossilizationInsights();
      console.log('🎯 Fossilization Performance Insights:');
      console.log(JSON.stringify(insights, null, 2));
      break;

    case 'clean':
      monitor.cleanLogs();
      break;

    default:
      console.log(`
Performance Monitor CLI

Usage: bun run src/utils/performanceMonitor.ts [COMMAND] [OPTIONS]

Commands:
  monitor <script>     Monitor performance of a single script
  summary              Generate performance summary
  report               Generate performance report
  insights             Get fossilization performance insights
  clean                Clean performance logs

Examples:
  bun run src/utils/performanceMonitor.ts monitor scripts/llm-chat-context.ts
  bun run src/utils/performanceMonitor.ts summary
  bun run src/utils/performanceMonitor.ts insights
      `);
      break;
  }
}

// Export for use in other modules
export default PerformanceMonitor; 