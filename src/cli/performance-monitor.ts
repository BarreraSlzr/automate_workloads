#!/usr/bin/env bun

import { Command } from 'commander';
import PerformanceMonitor from '../utils/performanceMonitor.js';
import { 
  PerformanceMonitorConfig,
  DEFAULT_PERFORMANCE_CONFIG 
} from '../types/performance';
import { CLIConfigSchema, CLIConfig } from '../types/cli';

// Performance monitoring CLI
class PerformanceMonitorCLI {
  private monitor: PerformanceMonitor;
  private config: CLIConfig;

  constructor(config: CLIConfig = {}) {
    this.config = CLIConfigSchema.parse(config);
    
    const monitorConfig: Partial<PerformanceMonitorConfig> = {};
    if (this.config.logDir) monitorConfig.logDir = this.config.logDir;
    if (this.config.logFile) monitorConfig.logFile = this.config.logFile;
    if (this.config.summaryFile) monitorConfig.summaryFile = this.config.summaryFile;
    if (this.config.reportFile) monitorConfig.reportFile = this.config.reportFile;
    
    this.monitor = new PerformanceMonitor(monitorConfig);
  }

  /**
   * Monitor a single script
   */
  async monitorScript(scriptPath: string): Promise<void> {
    try {
      console.log(`🚀 Starting performance monitoring for: ${scriptPath}`);
      
      const result = await this.monitor.monitorScript(scriptPath, {
        captureOutput: this.config.captureOutput ?? true,
        timeout: this.config.timeout,
      });

      if (this.config.verbose) {
        console.log('\n📊 Detailed Results:');
        console.log(JSON.stringify(result, null, 2));
      }

      console.log('\n✅ Performance monitoring completed successfully');
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error);
      process.exit(1);
    }
  }

  /**
   * Monitor multiple scripts in batch
   */
  async monitorBatch(scriptPaths: string[]): Promise<void> {
    console.log(`🚀 Starting batch performance monitoring for ${scriptPaths.length} scripts`);
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < scriptPaths.length; i++) {
      const scriptPath = scriptPaths[i];
      if (!scriptPath) continue;
      console.log(`\n🔄 Monitoring script ${i + 1} of ${scriptPaths.length}: ${scriptPath}`);
      try {
        const result = await this.monitor.monitorScript(String(scriptPath), {
          captureOutput: this.config.captureOutput ?? true,
          timeout: this.config.timeout,
        });
        results.push(result);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to monitor ${scriptPath}:`, error);
        failureCount++;
      }
    }

    console.log(`\n🎉 Batch monitoring completed!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📊 Total: ${scriptPaths.length}`);

    if (this.config.verbose) {
      console.log('\n📋 All Results:');
      console.log(JSON.stringify(results, null, 2));
    }
  }

  /**
   * Generate and display performance summary
   */
  generateSummary(): void {
    try {
      const summary = this.monitor.generateSummary();
      
      console.log('📊 Performance Summary');
      console.log('=====================');
      console.log(`Total Executions: ${summary.total_executions}`);
      console.log(`Unique Scripts: ${summary.scripts}`);
      console.log(`Success Rate: ${summary.success_rate.toFixed(1)}%`);
      console.log(`Total Execution Time: ${summary.total_execution_time.toFixed(2)}s`);
      console.log(`Average Execution Time: ${summary.average_execution_time.toFixed(2)}s`);
      console.log(`Fastest Execution: ${summary.fastest_execution.toFixed(2)}s`);
      console.log(`Slowest Execution: ${summary.slowest_execution.toFixed(2)}s`);
      console.log(`Average Memory Usage: ${summary.average_memory_usage.toFixed(2)}MB`);
      
      console.log('\n📋 Script Performance Breakdown:');
      summary.script_performance.forEach(sp => {
        console.log(`  ${sp.script}: ${sp.executions} executions, avg ${sp.average_time.toFixed(2)}s, ${sp.success_rate.toFixed(1)}% success`);
      });

      if (this.config.verbose) {
        console.log('\n📄 Full Summary JSON:');
        console.log(JSON.stringify(summary, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to generate summary:', error);
      process.exit(1);
    }
  }

  /**
   * Generate and display performance report
   */
  generateReport(): void {
    try {
      const report = this.monitor.generateReport();
      console.log('📋 Performance Report Generated');
      console.log('==============================');
      console.log(report);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      process.exit(1);
    }
  }

  /**
   * Get fossilization performance insights
   */
  getFossilizationInsights(): void {
    try {
      const insights = this.monitor.getFossilizationInsights();
      
      console.log('🎯 Fossilization Performance Insights');
      console.log('====================================');
      console.log(`Fossilization Percentage: ${insights.fossilizationPercentage.toFixed(1)}%`);
      
      console.log('\n📈 Performance Trends:');
      console.log(`  Average Execution Time: ${insights.performanceTrends.averageExecutionTime.toFixed(2)}s`);
      console.log(`  Success Rate: ${insights.performanceTrends.successRate.toFixed(1)}%`);
      console.log(`  Total Scripts: ${insights.performanceTrends.totalScripts}`);
      console.log(`  Fastest Script: ${insights.performanceTrends.fastestScript.script} (${insights.performanceTrends.fastestScript.average_time.toFixed(2)}s)`);
      console.log(`  Slowest Script: ${insights.performanceTrends.slowestScript.script} (${insights.performanceTrends.slowestScript.average_time.toFixed(2)}s)`);
      
      console.log('\n💡 Recommendations:');
      insights.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });

      if (this.config.verbose) {
        console.log('\n📄 Full Insights JSON:');
        console.log(JSON.stringify(insights, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to get insights:', error);
      process.exit(1);
    }
  }

  /**
   * Clean performance logs
   */
  cleanLogs(): void {
    try {
      this.monitor.cleanLogs();
      console.log('🧹 Performance logs cleaned successfully');
    } catch (error) {
      console.error('❌ Failed to clean logs:', error);
      process.exit(1);
    }
  }

  /**
   * List all performance logs
   */
  listLogs(): void {
    try {
      const logs = this.monitor.getLogs();
      
      if (logs.length === 0) {
        console.log('📭 No performance logs found');
        return;
      }

      console.log(`📋 Performance Logs (${logs.length} entries)`);
      console.log('=====================================');
      
      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.script}`);
        console.log(`   Time: ${log.execution_time.toFixed(2)}s | Memory: ${log.memory_usage_mb.toFixed(2)}MB | Exit: ${log.exit_code}`);
        console.log(`   Timestamp: ${log.timestamp}`);
        console.log('');
      });

      if (this.config.verbose) {
        console.log('📄 Full Logs JSON:');
        console.log(JSON.stringify(logs, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to list logs:', error);
      process.exit(1);
    }
  }

  /**
   * Get logs for a specific script
   */
  getScriptLogs(scriptName: string): void {
    try {
      const logs = this.monitor.getScriptLogs(scriptName);
      
      if (logs.length === 0) {
        console.log(`📭 No performance logs found for script: ${scriptName}`);
        return;
      }

      console.log(`📋 Performance Logs for: ${scriptName} (${logs.length} entries)`);
      console.log('==================================================');
      
      logs.forEach((log, index) => {
        console.log(`${index + 1}. Execution Time: ${log.execution_time.toFixed(2)}s`);
        console.log(`   Memory Usage: ${log.memory_usage_mb.toFixed(2)}MB`);
        console.log(`   Exit Code: ${log.exit_code}`);
        console.log(`   Timestamp: ${log.timestamp}`);
        console.log('');
      });

      if (this.config.verbose) {
        console.log('📄 Full Script Logs JSON:');
        console.log(JSON.stringify(logs, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to get script logs:', error);
      process.exit(1);
    }
  }
}

// CLI setup
const program = new Command();

program
  .name('performance-monitor')
  .description('Performance monitoring CLI for Bun scripts with fossilization integration')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--log-dir <dir>', 'Performance log directory', DEFAULT_PERFORMANCE_CONFIG.logDir)
  .option('--log-file <file>', 'Performance log file', DEFAULT_PERFORMANCE_CONFIG.logFile)
  .option('--summary-file <file>', 'Performance summary file', DEFAULT_PERFORMANCE_CONFIG.summaryFile)
  .option('--report-file <file>', 'Performance report file', DEFAULT_PERFORMANCE_CONFIG.reportFile)
  .option('--timeout <ms>', 'Script execution timeout in milliseconds', (val) => parseInt(val, 10), 300000)
  .option('--capture-output', 'Capture script output', true);

// Monitor command
program
  .command('monitor <script>')
  .description('Monitor performance of a single script')
  .action(async (script: string) => {
    const cli = new PerformanceMonitorCLI(program.opts());
    await cli.monitorScript(script);
  });

// Batch monitor command
program
  .command('batch')
  .description('Monitor performance of multiple scripts')
  .argument('<scripts...>', 'Script paths to monitor')
  .action(async (scripts: string[]) => {
    const cli = new PerformanceMonitorCLI(program.opts());
    await cli.monitorBatch(scripts);
  });

// Summary command
program
  .command('summary')
  .description('Generate performance summary')
  .action(() => {
    const cli = new PerformanceMonitorCLI(program.opts());
    cli.generateSummary();
  });

// Report command
program
  .command('report')
  .description('Generate performance report')
  .action(() => {
    const cli = new PerformanceMonitorCLI(program.opts());
    cli.generateReport();
  });

// Insights command
program
  .command('insights')
  .description('Get fossilization performance insights')
  .action(() => {
    const cli = new PerformanceMonitorCLI(program.opts());
    cli.getFossilizationInsights();
  });

// Clean command
program
  .command('clean')
  .description('Clean performance logs')
  .action(() => {
    const cli = new PerformanceMonitorCLI(program.opts());
    cli.cleanLogs();
  });

// List command
program
  .command('list')
  .description('List all performance logs')
  .action(() => {
    const cli = new PerformanceMonitorCLI(program.opts());
    cli.listLogs();
  });

// Script logs command
program
  .command('script-logs <script>')
  .description('Get performance logs for a specific script')
  .action((script: string) => {
    const cli = new PerformanceMonitorCLI(program.opts());
    cli.getScriptLogs(script);
  });

// Run CLI
if (import.meta.main) {
  program.parse();
} 