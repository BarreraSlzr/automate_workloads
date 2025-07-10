#!/usr/bin/env bun

/**
 * Event Loop Monitor CLI
 * Command-line interface for monitoring event loop calls and detecting hangings
 * @module cli/event-loop-monitor
 */

import { Command } from 'commander';
import { 
  EventLoopMonitor, 
  startGlobalMonitoring, 
  stopGlobalMonitoring, 
  getCallStackSummary, 
  exportMonitoringData, 
  generateMonitoringReport,
  trackOperation,
  HangingDetectionConfigSchema 
} from '../utils/eventLoopMonitor';
import type { HangingDetectionConfig } from '../types/event-loop-monitoring';
import { writeFileSync } from 'fs';
import { join } from 'path';

class EventLoopMonitorCLI {
  private config: {
    verbose: boolean;
    outputFile?: string;
    interval: number;
    timeout: number;
    memoryThreshold: number;
  };

  constructor(options: any) {
    this.config = {
      verbose: options.verbose || false,
      outputFile: options.output,
      interval: options.interval || 1000,
      timeout: options.timeout || 5000,
      memoryThreshold: options.memory || 100,
    };
  }

  /**
   * Start monitoring with a test operation
   */
  async startMonitoring(): Promise<void> {
    try {
      console.log('🚀 Starting event loop monitoring...');
      
      const monitorConfig: Partial<HangingDetectionConfig> = {
        timeoutThreshold: this.config.timeout,
        memoryThreshold: this.config.memoryThreshold * 1024 * 1024,
        enableStackTrace: true,
        enableMemoryTracking: true,
        enableCpuTracking: true,
        logHangingCalls: true,
        alertOnHanging: true,
      };

      startGlobalMonitoring(this.config.interval, monitorConfig);

      // Run some test operations to demonstrate monitoring
      await this.runTestOperations();

      console.log('\n✅ Event loop monitoring started successfully');
      console.log('Press Ctrl+C to stop monitoring and generate report');
      
      // Keep the process running
      process.on('SIGINT', () => {
        this.stopMonitoring();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      process.exit(1);
    }
  }

  /**
   * Stop monitoring and generate report
   */
  stopMonitoring(): void {
    try {
      console.log('\n🛑 Stopping event loop monitoring...');
      
      const snapshots = stopGlobalMonitoring();
      const summary = getCallStackSummary();
      
      console.log('\n📊 Monitoring Summary:');
      console.log(`Total Snapshots: ${snapshots.length}`);
      console.log(`Active Calls: ${summary.summary.totalActive}`);
      console.log(`Completed Calls: ${summary.summary.totalCompleted}`);
      console.log(`Hanging Calls: ${summary.summary.totalHanging}`);
      console.log(`Average Duration: ${summary.summary.averageDuration.toFixed(2)}ms`);
      console.log(`Max Duration: ${summary.summary.maxDuration.toFixed(2)}ms`);

      if (summary.hanging.length > 0) {
        console.log('\n🚨 Hanging Calls Detected:');
        summary.hanging.forEach(call => {
          console.log(`  - ${call.functionName} (${call.duration?.toFixed(2)}ms)`);
          console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
          if (call.metadata) {
            console.log(`    Metadata: ${JSON.stringify(call.metadata)}`);
          }
        });
      }

      if (summary.active.length > 0) {
        console.log('\n⏳ Currently Active Calls:');
        summary.active.forEach(call => {
          const duration = Date.now() - call.timestamp;
          console.log(`  - ${call.functionName} (${duration.toFixed(2)}ms)`);
          console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
        });
      }

      // Generate and save report
      const report = generateMonitoringReport();
      const reportPath = this.config.outputFile || 'fossils/event-loop-report.md';
      writeFileSync(reportPath, report);
      console.log(`\n📄 Report saved to: ${reportPath}`);

      // Export data
      const dataPath = this.config.outputFile?.replace('.md', '.json') || 'fossils/event-loop-data.json';
      exportMonitoringData(dataPath);
      console.log(`📊 Data exported to: ${dataPath}`);

    } catch (error) {
      console.error('❌ Error stopping monitoring:', error);
    }
  }

  /**
   * Run test operations to demonstrate monitoring
   */
  private async runTestOperations(): Promise<void> {
    console.log('\n🧪 Running test operations...');

    // Quick operation
    await trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'quick operation completed';
      },
      'quickOperation',
      { type: 'test', duration: 'short' }
    );

    // Medium operation
    await trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return 'medium operation completed';
      },
      'mediumOperation',
      { type: 'test', duration: 'medium' }
    );

    // Simulate a hanging operation (will be detected)
    trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        return 'this should timeout';
      },
      'hangingOperation',
      { type: 'test', duration: 'long', shouldTimeout: true }
    ).catch(error => {
      console.log(`Expected timeout: ${error.message}`);
    });

    // CPU-intensive operation
    await trackOperation(
      () => {
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      },
      'cpuIntensiveOperation',
      { type: 'test', operation: 'cpu-intensive' }
    );

    // Memory-intensive operation
    await trackOperation(
      () => {
        const array = new Array(1000000).fill(0).map((_, i) => i);
        return array.length;
      },
      'memoryIntensiveOperation',
      { type: 'test', operation: 'memory-intensive' }
    );

    console.log('✅ Test operations completed');
  }

  /**
   * Monitor a specific script
   */
  async monitorScript(scriptPath: string): Promise<void> {
    try {
      console.log(`🔍 Monitoring script: ${scriptPath}`);
      
      const monitorConfig: Partial<HangingDetectionConfig> = {
        timeoutThreshold: this.config.timeout,
        memoryThreshold: this.config.memoryThreshold * 1024 * 1024,
        enableStackTrace: true,
        enableMemoryTracking: true,
        enableCpuTracking: true,
        logHangingCalls: true,
        alertOnHanging: true,
      };

      startGlobalMonitoring(this.config.interval, monitorConfig);

      // Execute the script
      const { execSync } = await import('child_process');
      const result = execSync(`bun run ${scriptPath}`, {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      // Stop monitoring and generate report
      this.stopMonitoring();

      console.log('\n✅ Script monitoring completed');

    } catch (error) {
      console.error('❌ Script monitoring failed:', error);
      this.stopMonitoring();
      process.exit(1);
    }
  }

  /**
   * Show real-time call stack
   */
  showCallStack(): void {
    const summary = getCallStackSummary();
    
    console.log('📋 Current Call Stack Summary');
    console.log('=============================');
    console.log(`Active Calls: ${summary.summary.totalActive}`);
    console.log(`Completed Calls: ${summary.summary.totalCompleted}`);
    console.log(`Hanging Calls: ${summary.summary.totalHanging}`);
    console.log(`Average Duration: ${summary.summary.averageDuration.toFixed(2)}ms`);
    console.log(`Max Duration: ${summary.summary.maxDuration.toFixed(2)}ms`);

    if (summary.active.length > 0) {
      console.log('\n🔄 Active Calls:');
      summary.active.forEach(call => {
        const duration = Date.now() - call.timestamp;
        console.log(`  ${call.functionName} (${duration.toFixed(2)}ms)`);
        console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
        if (call.metadata) {
          console.log(`    Metadata: ${JSON.stringify(call.metadata)}`);
        }
      });
    }

    if (summary.hanging.length > 0) {
      console.log('\n🚨 Hanging Calls:');
      summary.hanging.forEach(call => {
        console.log(`  ${call.functionName} (${call.duration?.toFixed(2)}ms)`);
        console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
        if (call.metadata) {
          console.log(`    Metadata: ${JSON.stringify(call.metadata)}`);
        }
      });
    }

    if (summary.recent.length > 0) {
      console.log('\n✅ Recent Completed Calls:');
      summary.recent.slice(-5).forEach(call => {
        console.log(`  ${call.functionName} (${call.duration?.toFixed(2)}ms)`);
        console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
      });
    }
  }

  /**
   * Generate a quick report
   */
  generateQuickReport(): void {
    try {
      const report = generateMonitoringReport();
      const reportPath = this.config.outputFile || 'fossils/event-loop-quick-report.md';
      writeFileSync(reportPath, report);
      
      console.log('📄 Quick report generated:');
      console.log(report);
      console.log(`\nReport saved to: ${reportPath}`);

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
    }
  }
}

// ============================================================================
// CLI SETUP
// ============================================================================

const program = new Command();

program
  .name('event-loop-monitor')
  .description('Monitor event loop calls and detect hanging operations')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('-o, --output <file>', 'Output file for reports')
  .option('-i, --interval <ms>', 'Snapshot interval in milliseconds', '1000')
  .option('-t, --timeout <ms>', 'Timeout threshold in milliseconds', '5000')
  .option('-m, --memory <mb>', 'Memory threshold in MB', '100');

// Start monitoring command
program
  .command('start')
  .description('Start event loop monitoring with test operations')
  .action(async () => {
    const cli = new EventLoopMonitorCLI(program.opts());
    await cli.startMonitoring();
  });

// Monitor script command
program
  .command('monitor <script>')
  .description('Monitor a specific script')
  .action(async (script: string) => {
    const cli = new EventLoopMonitorCLI(program.opts());
    await cli.monitorScript(script);
  });

// Show call stack command
program
  .command('stack')
  .description('Show current call stack summary')
  .action(() => {
    const cli = new EventLoopMonitorCLI(program.opts());
    cli.showCallStack();
  });

// Generate report command
program
  .command('report')
  .description('Generate a quick monitoring report')
  .action(() => {
    const cli = new EventLoopMonitorCLI(program.opts());
    cli.generateQuickReport();
  });

// Stop monitoring command
program
  .command('stop')
  .description('Stop monitoring and generate final report')
  .action(() => {
    const cli = new EventLoopMonitorCLI(program.opts());
    cli.stopMonitoring();
  });

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  program.parse();
} 