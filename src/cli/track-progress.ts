#!/usr/bin/env bun

/**
 * Progress Tracking CLI
 * 
 * Monitors and tracks progress of action plans, automation issues,
 * and repository health over time using the repository orchestrator.
 */

import { Command } from 'commander';
import { getEnv } from '../core/config';
import { executeCommand } from '@/utils/cli';
import { promises as fs } from 'fs';
import path from 'path';
import { GitHubCLICommands } from '../utils/githubCliCommands';
import { 
  z, 
  TrackingConfigSchema, 
  ProgressMetricsSchema, 
  TrendAnalysisSchema,
  TrackProgressCLIArgsSchema,
  TrackProgressStatusCLIArgsSchema
} from '@/types/schemas';
import { parseJsonSafe } from '@/utils/json';

type TrackingConfig = z.infer<typeof TrackingConfigSchema>;
type ProgressMetrics = z.infer<typeof ProgressMetricsSchema>;
type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;

/**
 * Progress Tracking Service
 * 
 * Handles monitoring and tracking of repository progress over time
 */
class ProgressTrackingService {
  private config: ReturnType<typeof getEnv>;

  constructor() {
    this.config = getEnv();
  }

  /**
   * Track progress for a repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param trackingConfig - Tracking configuration
   * @returns Progress tracking results
   */
  async trackProgress(
    owner: string,
    repo: string,
    trackingConfig: TrackingConfig
  ): Promise<Record<string, unknown>> {
    console.log(`📊 Tracking progress for ${owner}/${repo}`);
    
    const results = {
      repository: `${owner}/${repo}`,
      timestamp: new Date().toISOString(),
      config: trackingConfig,
      metrics: {} as ProgressMetrics,
      trends: {} as TrendAnalysis,
      recommendations: [] as string[],
      nextSteps: [] as string[],
    };

    try {
      // Step 1: Current state analysis
      console.log('🔍 Step 1: Analyzing current state...');
      const currentMetrics = await this.analyzeCurrentState(owner, repo);
      results.metrics = currentMetrics as {
        timestamp: string;
        healthScore: number;
        actionPlanCompletion: number;
        automationCompletion: number;
        totalActionPlans: number;
        completedActionPlans: number;
        openActionPlans: number;
        totalAutomationIssues: number;
        completedAutomationIssues: number;
        openAutomationIssues: number;
      };

      // Step 2: Progress tracking
      console.log('📈 Step 2: Tracking progress...');
      const progressData = await this.trackActionPlanProgress(owner, repo);
      Object.assign(results.metrics, progressData);
      const progressItems = (progressData && Array.isArray((progressData as any).items)) ? (progressData as any).items : [];
      progressItems.forEach((item: any, idx: number) => {
        if (idx % 10 === 0 || idx === progressItems.length - 1) {
          console.log(`   • Processed ${idx + 1} of ${progressItems.length} action plan items`);
        }
      });

      // Step 3: Trend analysis
      if (trackingConfig.includeTrends) {
        console.log('📊 Step 3: Analyzing trends...');
        const trendData = await this.analyzeTrends(owner, repo, trackingConfig.outputDir);
        results.trends = trendData;
        const trendArr = (trendData && Array.isArray((trendData as any).trends)) ? (trendData as any).trends : [];
        trendArr.forEach((trend: any, idx: number) => {
          if (idx % 5 === 0 || idx === trendArr.length - 1) {
            console.log(`   • Analyzed ${idx + 1} of ${trendArr.length} trends`);
          }
        });
      }

      // Step 4: Generate recommendations
      console.log('🎯 Step 4: Generating recommendations...');
      results.recommendations = this.generateRecommendations(results.metrics, results.trends);
      if (Array.isArray(results.recommendations)) {
        results.recommendations.forEach((rec: any, idx: number) => {
          if (idx % 3 === 0 || idx === results.recommendations.length - 1) {
            console.log(`   • Generated ${idx + 1} of ${results.recommendations.length} recommendations`);
          }
        });
      }

      // Step 5: Determine next steps
      console.log('🔄 Step 5: Determining next steps...');
      results.nextSteps = this.determineNextSteps(results.metrics, results.trends);
      if (Array.isArray(results.nextSteps)) {
        results.nextSteps.forEach((step: any, idx: number) => {
          if (idx % 3 === 0 || idx === results.nextSteps.length - 1) {
            console.log(`   • Determined ${idx + 1} of ${results.nextSteps.length} next steps`);
          }
        });
      }

      // Step 6: Generate report
      console.log('📋 Step 6: Generating report...');
      const report = await this.generateProgressReport(results, trackingConfig);
      await this.saveReport(report, trackingConfig.outputDir);

      // Step 7: Trigger next steps if enabled
      if (trackingConfig.triggerNextSteps) {
        console.log('🚀 Step 7: Triggering next steps...');
        await this.triggerNextSteps(results.metrics, owner, repo);
      }

      console.log('✅ Progress tracking completed successfully');
      return results;

    } catch (error) {
      console.error('❌ Error during progress tracking:', error);
      throw error;
    }
  }

  /**
   * Analyze current repository state
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Current metrics
   */
  private async analyzeCurrentState(owner: string, repo: string): Promise<Partial<ProgressMetrics>> {
    console.log(`🔍 Analyzing current state for ${owner}/${repo}...`);

    try {
      // Run repository analysis
      const analysisOutput = executeCommand(
        `bun run repo:analyze ${owner} ${repo} --output current-analysis.json`
      );

      // Read analysis results
      const analysisData = parseJsonSafe(await fs.readFile('current-analysis.json', 'utf8'), 'cli:track-progress:current-analysis.json') as any[];
      
      return {
        healthScore: (analysisData && typeof analysisData === 'object' && !Array.isArray(analysisData) && 'health' in analysisData && (analysisData as any).health && 'score' in (analysisData as any).health)
          ? (analysisData as any).health.score
          : undefined,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.warn('⚠️  Could not analyze current state, using defaults');
      return {
        healthScore: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Track action plan progress
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Progress metrics
   */
  private async trackActionPlanProgress(owner: string, repo: string): Promise<Partial<ProgressMetrics>> {
    console.log(`📈 Tracking action plan progress for ${owner}/${repo}...`);

    try {
      const commands = new GitHubCLICommands(owner, repo);

      // Get action plan issues
      const actionPlanResult = await commands.listIssues({
        state: 'all',
        labels: ['action-plan']
      });

      // Get automation issues
      const automationResult = await commands.listIssues({
        state: 'all',
        labels: ['automation']
      });

      if (!actionPlanResult.success || !automationResult.success) {
        throw new Error('Failed to fetch issues from GitHub');
      }

      // Parse and analyze
      const actionPlans = parseJsonSafe(actionPlanResult.stdout, 'cli:track-progress:actionPlanResult.stdout') as any[];
      const automationIssuesData = parseJsonSafe(automationResult.stdout, 'cli:track-progress:automationResult.stdout') as any[];

      const totalActionPlans = actionPlans.length;
      const completedActionPlans = actionPlans.filter((issue: any) => issue.state === 'CLOSED').length;
      const openActionPlans = actionPlans.filter((issue: any) => issue.state === 'OPEN').length;

      const totalAutomationIssues = automationIssuesData.length;
      const completedAutomationIssues = automationIssuesData.filter((issue: any) => issue.state === 'CLOSED').length;
      const openAutomationIssues = automationIssuesData.filter((issue: any) => issue.state === 'OPEN').length;

      const actionPlanCompletion = totalActionPlans > 0 ? (completedActionPlans / totalActionPlans * 100) : 0;
      const automationCompletion = totalAutomationIssues > 0 ? (completedAutomationIssues / totalAutomationIssues * 100) : 0;

      return {
        actionPlanCompletion: Math.round(actionPlanCompletion * 10) / 10,
        automationCompletion: Math.round(automationCompletion * 10) / 10,
        totalActionPlans,
        completedActionPlans,
        openActionPlans,
        totalAutomationIssues,
        completedAutomationIssues,
        openAutomationIssues,
      };

    } catch (error) {
      console.warn('⚠️  Could not track action plan progress, using defaults');
      return {
        actionPlanCompletion: 0,
        automationCompletion: 0,
        totalActionPlans: 0,
        completedActionPlans: 0,
        openActionPlans: 0,
        totalAutomationIssues: 0,
        completedAutomationIssues: 0,
        openAutomationIssues: 0,
      };
    }
  }

  /**
   * Analyze trends over time
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param outputDir - Output directory for trends
   * @returns Trend analysis
   */
  private async analyzeTrends(owner: string, repo: string, outputDir: string): Promise<TrendAnalysis> {
    console.log(`📊 Analyzing trends for ${owner}/${repo}...`);

    try {
      // Create trends directory
      const trendsDir = path.join(outputDir, 'trends');
      await fs.mkdir(trendsDir, { recursive: true });

      // Save current state for trend analysis
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const currentStateFile = path.join(trendsDir, `state-${timestamp}.json`);
      
      if (await fs.access('current-analysis.json').then(() => true).catch(() => false)) {
        await fs.copyFile('current-analysis.json', currentStateFile);
      }

      // Get historical data
      const trendFiles = await fs.readdir(trendsDir);
      const stateFiles = trendFiles.filter(file => file.startsWith('state-') && file.endsWith('.json'));

      if (stateFiles.length < 2) {
        return { trend: 'insufficient_data' };
      }

      // Analyze health score trends
      const healthScores: number[] = [];
      for (const file of stateFiles.sort()) {
        try {
          const data = parseJsonSafe(await fs.readFile(path.join(trendsDir, file), 'utf8'), 'cli:track-progress:trendsDir');
          if (data && typeof data === 'object' && 'health' in data && typeof (data as any).health.score === 'number') {
            healthScores.push((data as any).health.score);
          }
        } catch (error) {
          // Ignore parse errors
        }
      }

      if (healthScores.length < 2) {
        return { trend: 'insufficient_data' };
      }

      const firstScore = healthScores[0];
      const lastScore = healthScores[healthScores.length - 1];
      const improvement = (lastScore ?? 0) - (firstScore ?? 0);
      const trend = improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable';

      return {
        trend,
        firstScore,
        lastScore,
        improvement,
        dataPoints: healthScores.length,
      };

    } catch (error) {
      console.warn('⚠️  Could not analyze trends, using defaults');
      return { trend: 'insufficient_data' };
    }
  }

  /**
   * Generate recommendations based on metrics and trends
   * @param metrics - Progress metrics
   * @param trends - Trend analysis
   * @returns Recommendations
   */
  private generateRecommendations(metrics: ProgressMetrics, trends: TrendAnalysis): string[] {
    const recommendations: string[] = [];

    // Health score recommendations
    if (metrics.healthScore < 80) {
      recommendations.push('⚠️ Health score below threshold (80) - Consider running full orchestration');
    }

    if (metrics.healthScore < 60) {
      recommendations.push('🚨 Health score critically low - Immediate action required');
    }

    // Action plan recommendations
    if (metrics.actionPlanCompletion < 50) {
      recommendations.push('📋 Action plan completion rate low - Review and prioritize open plans');
    }

    if (metrics.openActionPlans > 10) {
      recommendations.push('📋 Too many open action plans - Consider consolidating or closing outdated plans');
    }

    // Automation recommendations
    if (metrics.automationCompletion < 30) {
      recommendations.push('🤖 Automation completion rate low - Focus on implementing automation improvements');
    }

    // Trend-based recommendations
    if (trends.trend === 'declining' && trends.improvement && trends.improvement < -10) {
      recommendations.push('📉 Significant health score decline detected - Investigate root causes');
    }

    if (trends.trend === 'improving' && trends.improvement && trends.improvement > 10) {
      recommendations.push('📈 Excellent progress! Consider sharing best practices with the team');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Repository is in good health - Continue current practices');
    }

    return recommendations;
  }

  /**
   * Determine next steps based on metrics and trends
   * @param metrics - Progress metrics
   * @param trends - Trend analysis
   * @returns Next steps
   */
  private determineNextSteps(metrics: ProgressMetrics, trends: TrendAnalysis): string[] {
    const nextSteps: string[] = [];

    // Critical health issues
    if (metrics.healthScore < 70) {
      nextSteps.push('🚨 Trigger full repository orchestration immediately');
    }

    // Low action plan completion
    if (metrics.actionPlanCompletion < 40) {
      nextSteps.push('📋 Generate new action plan with higher priority items');
    }

    // Low automation completion
    if (metrics.automationCompletion < 30) {
      nextSteps.push('🤖 Focus on automation implementation and CI/CD improvements');
    }

    // Declining trends
    if (trends.trend === 'declining') {
      nextSteps.push('📉 Investigate causes of health score decline');
    }

    // General next steps
    if (nextSteps.length === 0) {
      nextSteps.push('📊 Continue monitoring and maintain current practices');
      nextSteps.push('🎯 Set up weekly progress reviews');
    }

    return nextSteps;
  }

  /**
   * Generate progress report
   * @param results - Tracking results
   * @param config - Tracking configuration
   * @returns Report content
   */
  private async generateProgressReport(results: any, config: TrackingConfig): Promise<string> {
    const { metrics, trends, recommendations, nextSteps } = results;
    const timestamp = new Date().toISOString();

    let report = `# 📊 Progress Tracking Report

**Generated:** ${timestamp}
**Mode:** ${config.mode}
**Report Type:** ${config.reportType}

## 📈 Current Metrics

- **Health Score:** ${metrics.healthScore}/100
- **Action Plan Completion:** ${metrics.actionPlanCompletion}%
- **Automation Completion:** ${metrics.automationCompletion}%
- **Total Action Plans:** ${metrics.totalActionPlans}
- **Completed Action Plans:** ${metrics.completedActionPlans}
- **Open Action Plans:** ${metrics.openActionPlans}
- **Total Automation Issues:** ${metrics.totalAutomationIssues}
- **Completed Automation Issues:** ${metrics.completedAutomationIssues}
- **Open Automation Issues:** ${metrics.openAutomationIssues}

## 📊 Trend Analysis

`;

    if (trends.trend !== 'insufficient_data') {
      report += `- **Trend:** ${trends.trend}
- **First Score:** ${trends.firstScore}
- **Current Score:** ${trends.lastScore}
- **Improvement:** ${trends.improvement} points
- **Data Points:** ${trends.dataPoints}

`;
    } else {
      report += `- **Status:** Insufficient historical data for trend analysis
- **Next Update:** Will be available after more tracking cycles

`;
    }

    report += `## 🎯 Recommendations

`;

    recommendations.forEach((rec: any) => {
      console.log(`  • ${rec}`);
    });

    report += `
## 🔄 Next Steps

`;

    nextSteps.forEach((step: any) => {
      console.log(`  • ${step}`);
    });

    report += `
## 📁 Generated Files

- \`current-analysis.json\` - Current repository analysis
- \`progress-report.md\` - This report
- \`.orchestration-reports/trends/\` - Historical trend data

---
*Generated by Progress Tracking Service*
`;

    return report;
  }

  /**
   * Save report to file
   * @param report - Report content
   * @param outputDir - Output directory
   */
  private async saveReport(report: string, outputDir: string): Promise<void> {
    try {
      await fs.mkdir(outputDir, { recursive: true });
      const reportFile = path.join(outputDir, 'progress-report.md');
      await fs.writeFile(reportFile, report);
      console.log(`📄 Report saved to: ${reportFile}`);
    } catch (error) {
      console.warn('⚠️  Could not save report:', error);
    }
  }

  /**
   * Trigger next steps based on metrics
   * @param metrics - Progress metrics
   * @param owner - Repository owner
   * @param repo - Repository name
   */
  private async triggerNextSteps(metrics: ProgressMetrics, owner: string, repo: string): Promise<void> {
    console.log('🚀 Triggering next steps...');

    try {
      // Trigger action plan generation if needed
      if (metrics.healthScore < 75 || metrics.actionPlanCompletion < 40) {
        console.log('📋 Triggering action plan generation...');
        executeCommand(
          `gh workflow run action-plan-generator.yml --repo ${owner}/${repo} --field plan_type=comprehensive --field priority=high`
        );
      }

      // Trigger full orchestration if needed
      if (metrics.healthScore < 70) {
        console.log('🎯 Triggering full repository orchestration...');
        executeCommand(
          `gh workflow run repository-orchestrator.yml --repo ${owner}/${repo}`
        );
      }

      console.log('✅ Next steps triggered successfully');
    } catch (error) {
      console.warn('⚠️  Could not trigger next steps:', error);
    }
  }
}

/**
 * CLI Command Setup
 */
const program = new Command();

program
  .name('track-progress')
  .description('Track progress of action plans and repository health')
  .version('1.0.0');

// Main tracking command
program
  .command('track')
  .description('Track progress for a repository')
  .argument('<owner>', 'Repository owner')
  .argument('<repo>', 'Repository name')
  .option('-m, --mode <mode>', 'Tracking mode', 'comprehensive')
  .option('-r, --report-type <type>', 'Report type', 'daily')
  .option('-o, --output-dir <dir>', 'Output directory', '.orchestration-reports')
  .option('--no-trends', 'Skip trend analysis')
  .option('--no-trigger', 'Skip triggering next steps')
  .option('--output <file>', 'Output file for results (JSON)')
  .action(async (owner, repo, options) => {
    try {
      // Validate CLI arguments using Zod
      const validatedArgs = TrackProgressCLIArgsSchema.parse({
        owner,
        repo,
        mode: options.mode,
        reportType: options.reportType,
        outputDir: options.outputDir,
        trends: options.trends,
        trigger: options.trigger,
        output: options.output,
      });

      const service = new ProgressTrackingService();
      
      const trackingConfig: TrackingConfig = {
        mode: validatedArgs.mode,
        reportType: validatedArgs.reportType,
        outputDir: validatedArgs.outputDir,
        includeTrends: validatedArgs.trends,
        triggerNextSteps: validatedArgs.trigger,
      };

      const results = await service.trackProgress(validatedArgs.owner, validatedArgs.repo, trackingConfig);
      
      if (validatedArgs.output) {
        await fs.writeFile(validatedArgs.output, JSON.stringify(results, null, 2));
        console.log(`✅ Results saved to ${validatedArgs.output}`);
      } else {
        console.log(JSON.stringify(results, null, 2));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      console.error('❌ Error during progress tracking:', error);
      process.exit(1);
    }
  });

// Quick status command
program
  .command('status')
  .description('Quick status check for a repository')
  .argument('<owner>', 'Repository owner')
  .argument('<repo>', 'Repository name')
  .action(async (owner, repo) => {
    try {
      // Validate CLI arguments using Zod
      const validatedArgs = TrackProgressStatusCLIArgsSchema.parse({
        owner,
        repo,
      });

      const service = new ProgressTrackingService();
      
      const quickConfig: TrackingConfig = {
        mode: 'health-only',
        reportType: 'daily',
        outputDir: '.orchestration-reports',
        includeTrends: false,
        triggerNextSteps: false,
      };

      const results = await service.trackProgress(validatedArgs.owner, validatedArgs.repo, quickConfig);
      
      console.log('📊 Quick Status Report');
      console.log('=====================');
      console.log(`Repository: ${validatedArgs.owner}/${validatedArgs.repo}`);
      console.log(`Health Score: ${(results.metrics as any).healthScore}/100`);
      console.log(`Action Plan Completion: ${(results.metrics as any).actionPlanCompletion}%`);
      console.log(`Automation Completion: ${(results.metrics as any).automationCompletion}%`);
      console.log(`Status: ${(results.metrics as any).healthScore >= 80 ? '✅ Healthy' : (results.metrics as any).healthScore >= 60 ? '⚠️ Needs Attention' : '🚨 Critical'}`);
      
      if ((results.recommendations as any).length > 0) {
        console.log('\n💡 Top Recommendation:');
        console.log((results.recommendations as any)[0]);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      console.error('❌ Error during status check:', error);
      process.exit(1);
    }
  });

if (import.meta.main) {
  program.parse();
} 