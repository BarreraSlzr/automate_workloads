#!/usr/bin/env bun

/**
 * Progress Tracking CLI
 * 
 * Monitors and tracks progress of action plans, automation issues,
 * and repository health over time using the repository orchestrator.
 */

import { Command } from 'commander';
import { z } from 'zod';
import { getEnv } from '../core/config.js';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Progress tracking schemas
const TrackingConfigSchema = z.object({
  mode: z.enum(['comprehensive', 'action-plan', 'health-only', 'automation-progress']).default('comprehensive'),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
  outputDir: z.string().default('.orchestration-reports'),
  includeTrends: z.boolean().default(true),
  triggerNextSteps: z.boolean().default(true),
});

const ProgressMetricsSchema = z.object({
  healthScore: z.number().min(0).max(100),
  actionPlanCompletion: z.number().min(0).max(100),
  automationCompletion: z.number().min(0).max(100),
  totalActionPlans: z.number(),
  completedActionPlans: z.number(),
  openActionPlans: z.number(),
  totalAutomationIssues: z.number(),
  completedAutomationIssues: z.number(),
  openAutomationIssues: z.number(),
  timestamp: z.string(),
});

const TrendAnalysisSchema = z.object({
  trend: z.enum(['improving', 'declining', 'stable', 'insufficient_data']),
  firstScore: z.number().optional(),
  lastScore: z.number().optional(),
  improvement: z.number().optional(),
  dataPoints: z.number().optional(),
});

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
      results.metrics = currentMetrics;

      // Step 2: Progress tracking
      console.log('📈 Step 2: Tracking progress...');
      const progressData = await this.trackActionPlanProgress(owner, repo);
      Object.assign(results.metrics, progressData);

      // Step 3: Trend analysis
      if (trackingConfig.includeTrends) {
        console.log('📊 Step 3: Analyzing trends...');
        const trendData = await this.analyzeTrends(owner, repo, trackingConfig.outputDir);
        results.trends = trendData;
      }

      // Step 4: Generate recommendations
      console.log('🎯 Step 4: Generating recommendations...');
      results.recommendations = this.generateRecommendations(results.metrics, results.trends);

      // Step 5: Determine next steps
      console.log('🔄 Step 5: Determining next steps...');
      results.nextSteps = this.determineNextSteps(results.metrics, results.trends);

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
      const analysisOutput = execSync(
        `bun run repo:analyze ${owner} ${repo} --output current-analysis.json`,
        { encoding: 'utf8' }
      );

      // Read analysis results
      const analysisData = JSON.parse(await fs.readFile('current-analysis.json', 'utf8'));
      
      return {
        healthScore: analysisData.health.score,
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
      // Get action plan issues
      const actionPlanIssues = execSync(
        `gh issue list --repo ${owner}/${repo} --label "action-plan" --limit 100 --json number,title,state,createdAt,updatedAt,labels`,
        { encoding: 'utf8' }
      );

      // Get automation issues
      const automationIssues = execSync(
        `gh issue list --repo ${owner}/${repo} --label "automation" --limit 100 --json number,title,state,createdAt,updatedAt,labels`,
        { encoding: 'utf8' }
      );

      // Parse and analyze
      const actionPlans = JSON.parse(actionPlanIssues);
      const automationIssuesData = JSON.parse(automationIssues);

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
          const data = JSON.parse(await fs.readFile(path.join(trendsDir, file), 'utf8'));
          if (data.health && typeof data.health.score === 'number') {
            healthScores.push(data.health.score);
          }
        } catch (error) {
          // Skip invalid files
        }
      }

      if (healthScores.length < 2) {
        return { trend: 'insufficient_data' };
      }

      const firstScore = healthScores[0];
      const lastScore = healthScores[healthScores.length - 1];
      const improvement = lastScore - firstScore;
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

    recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });

    report += `
## 🔄 Next Steps

`;

    nextSteps.forEach(step => {
      report += `- ${step}\n`;
    });

    report += `
## 📁 Generated Files

- \`current-analysis.json\` - Current repository analysis
- \`progress-report-${timestamp.replace(/[:.]/g, '-')}.md\` - This report
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(outputDir, `progress-report-${timestamp}.md`);
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
        execSync(
          `gh workflow run action-plan-generator.yml --repo ${owner}/${repo} --field plan_type=comprehensive --field priority=high`,
          { stdio: 'inherit' }
        );
      }

      // Trigger full orchestration if needed
      if (metrics.healthScore < 70) {
        console.log('🎯 Triggering full repository orchestration...');
        execSync(
          `gh workflow run repository-orchestrator.yml --repo ${owner}/${repo}`,
          { stdio: 'inherit' }
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
      const service = new ProgressTrackingService();
      
      const trackingConfig: TrackingConfig = {
        mode: options.mode as any,
        reportType: options.reportType as any,
        outputDir: options.outputDir,
        includeTrends: options.trends,
        triggerNextSteps: options.trigger,
      };

      const results = await service.trackProgress(owner, repo, trackingConfig);
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(results, null, 2));
        console.log(`✅ Results saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(results, null, 2));
      }
    } catch (error) {
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
      const service = new ProgressTrackingService();
      
      const quickConfig: TrackingConfig = {
        mode: 'health-only',
        reportType: 'daily',
        outputDir: '.orchestration-reports',
        includeTrends: false,
        triggerNextSteps: false,
      };

      const results = await service.trackProgress(owner, repo, quickConfig);
      
      console.log('📊 Quick Status Report');
      console.log('=====================');
      console.log(`Repository: ${owner}/${repo}`);
      console.log(`Health Score: ${results.metrics.healthScore}/100`);
      console.log(`Action Plan Completion: ${results.metrics.actionPlanCompletion}%`);
      console.log(`Automation Completion: ${results.metrics.automationCompletion}%`);
      console.log(`Status: ${results.metrics.healthScore >= 80 ? '✅ Healthy' : results.metrics.healthScore >= 60 ? '⚠️ Needs Attention' : '🚨 Critical'}`);
      
      if (results.recommendations.length > 0) {
        console.log('\n🎯 Top Recommendation:');
        console.log(results.recommendations[0]);
      }
    } catch (error) {
      console.error('❌ Error during status check:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(); 