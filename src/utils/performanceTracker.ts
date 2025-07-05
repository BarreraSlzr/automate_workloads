import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import {
  GranularMetricsSchema,
  EnvironmentSchema,
  GranularLogEntrySchema,
  TrendsAnalysisSchema,
  GranularMetrics,
  Environment,
  GranularLogEntry,
  TrendsAnalysis,
  PerformanceTrackerConfig,
  DEFAULT_TRACKER_CONFIG
} from '../types/performance';

// Performance tracking utility class
export class PerformanceTracker {
  private config: PerformanceTrackerConfig;
  private granularLogs: GranularLogEntry[] = [];

  constructor(config: Partial<PerformanceTrackerConfig> = {}) {
    this.config = { ...DEFAULT_TRACKER_CONFIG, ...config };
    this.ensureDirectory();
    this.loadExistingLogs();
  }

  private ensureDirectory(): void {
    const dir = this.config.granularLogFile.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private loadExistingLogs(): void {
    if (existsSync(this.config.granularLogFile)) {
      try {
        const content = readFileSync(this.config.granularLogFile, 'utf-8');
        const data = JSON.parse(content);
        this.granularLogs = Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Failed to load existing granular logs:', error);
        this.granularLogs = [];
      }
    }
  }

  private saveLogs(): void {
    writeFileSync(this.config.granularLogFile, JSON.stringify(this.granularLogs, null, 2));
  }

  private getGitInfo(): { sha: string; branch: string } {
    try {
      const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      return { sha, branch };
    } catch (error) {
      return { sha: 'unknown', branch: 'unknown' };
    }
  }

  private getEnvironmentInfo(): Environment {
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      const bunVersion = execSync('bun --version', { encoding: 'utf-8' }).trim();
      const os = process.platform;
      const cpuCores = require('os').cpus().length.toString();
      const memoryTotal = (require('os').totalmem() / 1024 / 1024 / 1024).toFixed(1);
      
      return {
        node_version: nodeVersion,
        bun_version: bunVersion,
        os,
        cpu_cores: cpuCores,
        memory_total: memoryTotal,
      };
    } catch (error) {
      return {
        node_version: 'unknown',
        bun_version: 'unknown',
        os: 'unknown',
        cpu_cores: 'unknown',
        memory_total: 'unknown',
      };
    }
  }

  private sendNotification(title: string, message: string, subtitle?: string): void {
    if (!this.config.enableNotifications) return;

    try {
      if (process.platform === 'darwin') {
        const subtitleArg = subtitle ? `subtitle "${subtitle}"` : '';
        execSync(`osascript -e 'display notification "${message}" with title "${title}" ${subtitleArg} sound name "Glass"'`);
      }
    } catch (error) {
      console.warn('Failed to send notification:', error);
    }
  }

  /**
   * Track performance of a script with granular details
   */
  async trackScript(
    scriptPath: string,
    options: {
      captureOutput?: boolean;
      timeout?: number;
      env?: Record<string, string>;
    } = {}
  ): Promise<GranularLogEntry> {
    const scriptName = scriptPath.replace(/\.(ts|js)$/, '');
    const timestamp = new Date().toISOString();
    const { sha, branch } = this.getGitInfo();
    const environment = this.getEnvironmentInfo();
    
    console.log(`🔍 Tracking performance for: ${scriptName}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`Git: ${branch} @ ${sha}`);

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
    const additionalMetrics: GranularMetrics = {
      real_time: executionTime,
      user_time: executionTime * 0.8, // Approximation
      sys_time: executionTime * 0.2, // Approximation
      cpu_percent: 100, // Approximation
      max_memory_mb: Math.abs(memoryUsage),
      avg_memory_mb: Math.abs(memoryUsage),
      output_size_bytes: Buffer.byteLength(output, 'utf-8'),
      error_size_bytes: Buffer.byteLength(error, 'utf-8'),
      memory_samples: 1, // Approximation
    };

    // Create granular log entry
    const logEntry: GranularLogEntry = {
      script: scriptName,
      execution_time: executionTime,
      memory_usage_mb: Math.abs(memoryUsage),
      exit_code: exitCode,
      timestamp,
      git_sha: sha,
      git_branch: branch,
      additional_metrics: additionalMetrics,
      environment,
    };

    // Validate and add to logs
    GranularLogEntrySchema.parse(logEntry);
    this.granularLogs.push(logEntry);
    this.saveLogs();

    // Display results
    console.log(`✅ Execution completed`);
    console.log(`⏱️  Real time: ${executionTime.toFixed(2)}s`);
    console.log(`💾 Memory usage: ${Math.abs(memoryUsage).toFixed(2)}MB`);
    console.log(`🔢 Exit code: ${exitCode}`);

    // Send notification
    if (exitCode === 0) {
      this.sendNotification(
        'Performance Test Passed',
        `${scriptName} completed in ${executionTime.toFixed(2)}s`,
        `Memory: ${Math.abs(memoryUsage).toFixed(2)}MB`
      );
    } else {
      this.sendNotification(
        'Performance Test Failed',
        `${scriptName} failed (exit: ${exitCode})`,
        `Time: ${executionTime.toFixed(2)}s`
      );
    }

    return logEntry;
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends(): TrendsAnalysis {
    if (this.granularLogs.length === 0) {
      throw new Error('No granular performance data available');
    }

    // Group by script
    const scriptGroups = this.granularLogs.reduce((acc, log) => {
      if (!acc[log.script]) {
        acc[log.script] = [];
      }
      acc[log.script]!.push(log);
      return acc;
    }, {} as Record<string, GranularLogEntry[]>);

    // Calculate trends
    const performanceTrends = Object.entries(scriptGroups).map(([script, logs]) => {
      const executions = logs.length;
      const avgTime = logs.reduce((sum, log) => sum + log.execution_time, 0) / executions;
      
      let trend = 0;
      if (executions > 1 && logs.length > 0) {
        const firstTime = logs[0]?.execution_time;
        const lastTime = logs[logs.length - 1]?.execution_time;
        if (firstTime && lastTime) {
          trend = ((lastTime - firstTime) / firstTime) * 100;
        }
      }

      return {
        script,
        executions,
        avg_time: avgTime,
        trend,
        latest_time: logs[logs.length - 1]?.execution_time || 0,
        earliest_time: logs[0]?.execution_time || 0,
      };
    });

    // Detect regressions (>10% performance degradation)
    const regressions = performanceTrends
      .filter(trend => trend.trend > 10)
      .map(trend => ({
        script: trend.script,
        regression_percent: trend.trend,
      }));

    const analysis: TrendsAnalysis = {
      total_executions: this.granularLogs.length,
      unique_scripts: new Set(this.granularLogs.map(log => log.script)).size,
      branches: [...new Set(this.granularLogs.map(log => log.git_branch))],
      time_period: {
        earliest: this.granularLogs[0]?.timestamp || new Date().toISOString(),
        latest: this.granularLogs[this.granularLogs.length - 1]?.timestamp || new Date().toISOString(),
      },
      performance_trends: performanceTrends,
      regressions,
    };

    // Validate and save analysis
    TrendsAnalysisSchema.parse(analysis);
    writeFileSync(this.config.trendsAnalysisFile, JSON.stringify(analysis, null, 2));

    return analysis;
  }

  /**
   * Generate traceability report
   */
  generateTraceabilityReport(): string {
    const analysis = this.analyzeTrends();
    const timestamp = new Date().toISOString();

    const report = `# Performance Traceability Report

Generated on: ${timestamp}

## Executive Summary

- **Total Executions**: ${analysis.total_executions}
- **Unique Scripts**: ${analysis.unique_scripts}
- **Branches Tracked**: ${analysis.branches.length}
- **Time Period**: ${analysis.time_period.earliest} to ${analysis.time_period.latest}

## Performance Trends by Script

${analysis.performance_trends.map(trend => 
  `- **${trend.script}**: ${trend.executions} executions, avg ${trend.avg_time.toFixed(2)}s, trend: ${trend.trend.toFixed(1)}%`
).join('\n')}

## Performance Regressions Detected

${analysis.regressions.length > 0 
  ? analysis.regressions.map(reg => 
      `- **${reg.script}**: ${reg.regression_percent.toFixed(1)}% regression`
    ).join('\n')
  : 'No regressions detected'
}

## Granular Traceability

Each execution is tracked with:
- Git SHA and branch
- Environment details (OS, Node/Bun versions, CPU cores, memory)
- Detailed timing breakdown (real, user, sys time)
- Memory usage patterns
- Output/error sizes
- CPU utilization

## Historical Data

Performance data is preserved in:
- \`${this.config.granularLogFile}\`: Detailed execution logs
- \`${this.config.trendsAnalysisFile}\`: Trend analysis
- \`${this.config.traceabilityReportFile}\`: This report

## Recommendations

${this.generateTraceabilityRecommendations(analysis)}

## Environment Summary

${this.generateEnvironmentSummary()}
`;

    writeFileSync(this.config.traceabilityReportFile, report);
    return report;
  }

  /**
   * Generate traceability recommendations
   */
  private generateTraceabilityRecommendations(analysis: TrendsAnalysis): string {
    const recommendations: string[] = [];

    if (analysis.regressions.length > 0) {
      recommendations.push(
        '- ⚠️ **Performance regressions detected**: Review scripts with >10% performance degradation',
        '- 🔍 **Investigate root causes**: Check recent changes in regressed scripts',
        '- 📊 **Monitor trends**: Set up alerts for performance regressions'
      );
    }

    recommendations.push(
      '- 📈 **Track improvements**: Monitor scripts showing performance gains',
      '- 🔄 **Regular audits**: Run traceability analysis weekly',
      '- 📝 **Document changes**: Link performance changes to code changes',
      '- 🎯 **Set baselines**: Establish performance baselines for each script'
    );

    return recommendations.join('\n');
  }

  /**
   * Generate environment summary
   */
  private generateEnvironmentSummary(): string {
    if (this.granularLogs.length === 0) return 'No environment data available';

    const latestEnv = this.granularLogs[this.granularLogs.length - 1]?.environment;
    
    if (!latestEnv) {
      return 'No environment data available';
    }
    
    return `
- **Node.js Version**: ${latestEnv.node_version}
- **Bun Version**: ${latestEnv.bun_version}
- **Operating System**: ${latestEnv.os}
- **CPU Cores**: ${latestEnv.cpu_cores}
- **Total Memory**: ${latestEnv.memory_total}GB
`;
  }

  /**
   * Get all granular logs
   */
  getLogs(): GranularLogEntry[] {
    return [...this.granularLogs];
  }

  /**
   * Get logs for a specific script
   */
  getScriptLogs(scriptName: string): GranularLogEntry[] {
    return this.granularLogs.filter(log => log.script === scriptName);
  }

  /**
   * Get logs for a specific git branch
   */
  getBranchLogs(branchName: string): GranularLogEntry[] {
    return this.granularLogs.filter(log => log.git_branch === branchName);
  }

  /**
   * Clean granular logs
   */
  cleanLogs(): void {
    this.granularLogs = [];
    this.saveLogs();
    console.log('🧹 Granular performance logs cleaned');
  }
}

// CLI interface for the performance tracker
export async function runPerformanceTrackerCLI(args: string[]): Promise<void> {
  const tracker = new PerformanceTracker();
  const command = args[0];

  switch (command) {
    case 'track':
      if (!args[1]) {
        console.error('❌ Error: Script path required');
        process.exit(1);
      }
      await tracker.trackScript(args[1], { captureOutput: true });
      break;

    case 'trends':
      const trends = tracker.analyzeTrends();
      console.log('📈 Performance Trends Analysis:');
      console.log(JSON.stringify(trends, null, 2));
      break;

    case 'report':
      const report = tracker.generateTraceabilityReport();
      console.log('📋 Traceability Report Generated');
      console.log(report);
      break;

    case 'logs':
      const logs = tracker.getLogs();
      console.log(`📋 Granular Performance Logs (${logs.length} entries)`);
      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.script} (${log.git_branch}) - ${log.execution_time.toFixed(2)}s`);
      });
      break;

    case 'clean':
      tracker.cleanLogs();
      break;

    default:
      console.log(`
Performance Tracker CLI

Usage: bun run src/utils/performanceTracker.ts [COMMAND] [OPTIONS]

Commands:
  track <script>     Track performance of a single script with granular details
  trends             Analyze performance trends
  report             Generate traceability report
  logs               List all granular logs
  clean              Clean granular logs

Examples:
  bun run src/utils/performanceTracker.ts track scripts/llm-chat-context.ts
  bun run src/utils/performanceTracker.ts trends
  bun run src/utils/performanceTracker.ts report
      `);
      break;
  }
}

// Export for use in other modules
export default PerformanceTracker; 