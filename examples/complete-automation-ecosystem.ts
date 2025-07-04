#!/usr/bin/env bun

/**
 * Complete Automation Ecosystem Demo
 * 
 * This example demonstrates the full automation ecosystem:
 * 1. 🔧 Repository Orchestrator - Analyze any repository
 * 2. 🤖 LLM Plan Goals - Break down complex objectives
 * 3. 🗿 Fossil Context - Store decisions and insights
 * 4. 📊 Progress Tracking - Monitor metrics and health
 * 5. 📋 GitHub Projects - Visualize and manage automation
 * 6. 🧠 Knowledge Learning - Tools learn from every interaction
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AutomationEcosystem } from '../src/types/examples';

class CompleteAutomationEcosystem {
  private ecosystem: AutomationEcosystem;

  constructor(owner: string, repo: string, projectId?: string) {
    this.ecosystem = {
      repository: { owner, repo },
      projectId,
      goals: [],
      context: {
        decisions: [],
        insights: []
      },
      progress: {
        healthScore: 0,
        actionPlanCompletion: 0,
        automationCompletion: 0,
        totalIssues: 0,
        completedIssues: 0
      }
    };
  }

  /**
   * Step 1: 🔧 Repository Orchestrator
   * Analyze any repository for automation opportunities
   */
  async analyzeRepository(): Promise<void> {
    console.log('🔧 Step 1: Repository Orchestrator');
    console.log(`Analyzing ${this.ecosystem.repository.owner}/${this.ecosystem.repository.repo}...`);

    try {
      // Run repository analysis
      const analysisOutput = execSync(
        `bun run repo:analyze ${this.ecosystem.repository.owner} ${this.ecosystem.repository.repo}`,
        { encoding: 'utf8' }
      );

      console.log('✅ Repository analysis complete');
      console.log(analysisOutput);

      // Store decision about analysis
      this.addContextDecision(
        'Repository Analysis Completed',
        `Successfully analyzed ${this.ecosystem.repository.owner}/${this.ecosystem.repository.repo} for automation opportunities`,
        ['repository-analysis', 'automation-opportunities']
      );

    } catch (error) {
      console.error('❌ Repository analysis failed:', error);
      this.addContextDecision(
        'Repository Analysis Failed',
        `Failed to analyze ${this.ecosystem.repository.owner}/${this.ecosystem.repository.repo}: ${error}`,
        ['repository-analysis', 'error', 'troubleshooting']
      );
    }
  }

  /**
   * Step 2: 🤖 LLM Plan Goals
   * Break down complex objectives into actionable tasks
   */
  async planGoals(goals: string[]): Promise<void> {
    console.log('\n🤖 Step 2: LLM Plan Goals');
    console.log('Breaking down complex objectives into actionable tasks...');

    this.ecosystem.goals = goals;

    for (const goal of goals) {
      try {
        console.log(`\nPlanning goal: "${goal}"`);
        
        // Use LLM to decompose goal
        const planOutput = execSync(
          `bun run llm:plan decompose "${goal}"`,
          { encoding: 'utf8' }
        );

        console.log('✅ Goal planning complete');
        console.log(planOutput);

        // Store insight about goal planning
        this.addContextInsight(
          `Goal Planning: ${goal}`,
          `Successfully decomposed goal into actionable tasks using LLM planning`,
          ['llm-planning', 'goal-decomposition', 'task-planning']
        );

      } catch (error) {
        console.error(`❌ Goal planning failed for "${goal}":`, error);
        this.addContextInsight(
          `Goal Planning Failed: ${goal}`,
          `Failed to decompose goal: ${error}`,
          ['llm-planning', 'error', 'goal-decomposition']
        );
      }
    }
  }

  /**
   * Step 3: 🗿 Fossil Context
   * Store decisions, insights, and context for future reference
   */
  async storeFossilContext(): Promise<void> {
    console.log('\n🗿 Step 3: Fossil Context Storage');
    console.log('Storing decisions and insights in persistent fossil storage...');

    try {
      // Initialize fossil storage if needed
      if (!existsSync('.context-fossil')) {
        console.log('Initializing fossil storage...');
        execSync('bun run context:init', { encoding: 'utf8' });
      }

      // Store all decisions
      for (const decision of this.ecosystem.context.decisions) {
        const command = `bun run context:add --type decision --title "${decision.title}" --content "${decision.content}" --tags "${decision.tags.join(',')}"`;
        execSync(command, { encoding: 'utf8' });
        console.log(`✅ Stored decision: ${decision.title}`);
      }

      // Store all insights
      for (const insight of this.ecosystem.context.insights) {
        const command = `bun run context:add --type insight --title "${insight.title}" --content "${insight.content}" --tags "${insight.tags.join(',')}"`;
        execSync(command, { encoding: 'utf8' });
        console.log(`✅ Stored insight: ${insight.title}`);
      }

      // Generate context summary
      const summaryOutput = execSync(
        'bun run context:summary --type decision --tags "automation"',
        { encoding: 'utf8' }
      );

      console.log('\n📋 Context Summary:');
      console.log(summaryOutput);

    } catch (error) {
      console.error('❌ Fossil context storage failed:', error);
    }
  }

  /**
   * Step 4: 📊 Progress Tracking
   * Monitor metrics and health over time
   */
  async trackProgress(): Promise<void> {
    console.log('\n📊 Step 4: Progress Tracking');
    console.log('Monitoring repository health and automation progress...');

    try {
      // Run comprehensive monitoring
      const monitoringOutput = execSync(
        `bun run repo:monitor ${this.ecosystem.repository.owner} ${this.ecosystem.repository.repo}`,
        { encoding: 'utf8' }
      );

      console.log('✅ Progress monitoring complete');
      console.log(monitoringOutput);

      // Get quick status
      const statusOutput = execSync(
        `bun run repo:status ${this.ecosystem.repository.owner} ${this.ecosystem.repository.repo}`,
        { encoding: 'utf8' }
      );

      console.log('\n📈 Quick Status:');
      console.log(statusOutput);

      // Parse progress metrics from monitoring output
      this.parseProgressMetrics(monitoringOutput);

      // Store progress insight
      this.addContextInsight(
        'Progress Tracking Completed',
        `Health Score: ${this.ecosystem.progress.healthScore}/100, Action Plan Completion: ${this.ecosystem.progress.actionPlanCompletion}%, Automation Completion: ${this.ecosystem.progress.automationCompletion}%`,
        ['progress-tracking', 'metrics', 'health-monitoring']
      );

    } catch (error) {
      console.error('❌ Progress tracking failed:', error);
      this.addContextInsight(
        'Progress Tracking Failed',
        `Failed to track progress: ${error}`,
        ['progress-tracking', 'error', 'monitoring']
      );
    }
  }

  /**
   * Step 5: 📋 GitHub Projects Integration
   * Visualize and manage automation in GitHub Projects
   */
  async integrateWithGitHubProjects(): Promise<void> {
    const projectId = this.ecosystem.projectId;
    if (!projectId) {
      console.log('\n📋 Step 5: GitHub Projects Integration (Skipped - No Project ID)');
      console.log('To enable GitHub Projects integration, provide a project ID');
      return;
    }

    console.log('\n📋 Step 5: GitHub Projects Integration');
    console.log('Integrating automation with GitHub Projects for visualization...');

    try {
      // Set up project with automation columns
      console.log('Setting up GitHub Project...');
      const setupOutput = execSync(
        `./scripts/github-projects-integration.sh -p ${projectId} -m setup ${this.ecosystem.repository.owner} ${this.ecosystem.repository.repo}`,
        { encoding: 'utf8' }
      );

      console.log('✅ Project setup complete');
      console.log(setupOutput);

      // Sync automation issues to project
      console.log('\nSyncing automation issues to project...');
      const syncOutput = execSync(
        `./scripts/github-projects-integration.sh -p ${projectId} -m sync ${this.ecosystem.repository.owner} ${this.ecosystem.repository.repo}`,
        { encoding: 'utf8' }
      );

      console.log('✅ Issue sync complete');
      console.log(syncOutput);

      // Generate project progress report
      console.log('\nGenerating project progress report...');
      const reportOutput = execSync(
        `./scripts/github-projects-integration.sh -p ${projectId} -m report ${this.ecosystem.repository.owner} ${this.ecosystem.repository.repo}`,
        { encoding: 'utf8' }
      );

      console.log('✅ Project report generated');
      console.log(reportOutput);

      // Store GitHub Projects insight
      this.addContextInsight(
        'GitHub Projects Integration Completed',
        `Successfully integrated automation with GitHub Project ${projectId}`,
        ['github-projects', 'visualization', 'team-collaboration']
      );

    } catch (error) {
      console.error('❌ GitHub Projects integration failed:', error);
      this.addContextInsight(
        'GitHub Projects Integration Failed',
        `Failed to integrate with GitHub Projects: ${error}`,
        ['github-projects', 'error', 'integration']
      );
    }
  }

  /**
   * Step 6: 🧠 Knowledge Learning
   * Tools learn from every interaction and outcome
   */
  async learnFromInteractions(): Promise<void> {
    console.log('\n🧠 Step 6: Knowledge Learning');
    console.log('Analyzing interactions and outcomes for continuous improvement...');

    try {
      // Query historical context for patterns
      const patternsOutput = execSync(
        'bun run context:query --search "automation success patterns"',
        { encoding: 'utf8' }
      );

      console.log('📊 Historical Patterns:');
      console.log(patternsOutput);

      // Get context statistics
      const statsOutput = execSync(
        'bun run context:stats',
        { encoding: 'utf8' }
      );

      console.log('\n📈 Context Statistics:');
      console.log(statsOutput);

      // Generate learning insights
      const learningInsights = this.generateLearningInsights();

      for (const insight of learningInsights) {
        this.addContextInsight(
          insight.title,
          insight.content,
          insight.tags
        );
      }

      console.log('✅ Knowledge learning complete');

    } catch (error) {
      console.error('❌ Knowledge learning failed:', error);
    }
  }

  /**
   * Generate comprehensive ecosystem report
   */
  async generateEcosystemReport(): Promise<void> {
    console.log('\n📋 Generating Complete Ecosystem Report...');

    const report = {
      timestamp: new Date().toISOString(),
      repository: this.ecosystem.repository,
      projectId: this.ecosystem.projectId,
      goals: this.ecosystem.goals,
      progress: this.ecosystem.progress,
      context: {
        decisionsCount: this.ecosystem.context.decisions.length,
        insightsCount: this.ecosystem.context.insights.length
      },
      summary: this.generateEcosystemSummary()
    };

    const reportFile = join('.orchestration-reports', `ecosystem-report-${Date.now()}.json`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`✅ Ecosystem report saved to: ${reportFile}`);
    console.log('\n🎯 Ecosystem Summary:');
    console.log(report.summary);
  }

  /**
   * Helper methods
   */
  private addContextDecision(title: string, content: string, tags: string[]): void {
    this.ecosystem.context.decisions.push({
      title,
      content,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  private addContextInsight(title: string, content: string, tags: string[]): void {
    this.ecosystem.context.insights.push({
      title,
      content,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  private parseProgressMetrics(monitoringOutput: string): void {
    // Extract health score
    const healthMatch = /Health Score: (\d+)/.exec(monitoringOutput);
    this.ecosystem.progress.healthScore = healthMatch && healthMatch[1] ? parseInt(healthMatch[1]) : 0;

    // Extract action plan completion
    const actionPlanMatch = /Action Plan Completion: (\d+).*?(\d+\.\d+)/.exec(monitoringOutput);
    this.ecosystem.progress.totalIssues = actionPlanMatch && actionPlanMatch[1] ? parseInt(actionPlanMatch[1]) : 0;
    this.ecosystem.progress.actionPlanCompletion = actionPlanMatch && actionPlanMatch[2] ? parseFloat(actionPlanMatch[2]) : 0;

    // Extract automation completion
    const automationMatch = /Automation Completion: (\d+).*?(\d+\.\d+)/.exec(monitoringOutput);
    this.ecosystem.progress.automationCompletion = automationMatch && automationMatch[2] ? parseFloat(automationMatch[2]) : 0;
  }

  private generateLearningInsights(): Array<{ title: string; content: string; tags: string[] }> {
    const insights = [];

    // Analyze health score trends
    if (this.ecosystem.progress.healthScore >= 80) {
      insights.push({
        title: 'High Health Score Achievement',
        content: `Repository achieved high health score of ${this.ecosystem.progress.healthScore}/100, indicating successful automation practices`,
        tags: ['health-score', 'success', 'automation-practices']
      });
    } else if (this.ecosystem.progress.healthScore < 60) {
      insights.push({
        title: 'Low Health Score Alert',
        content: `Repository health score of ${this.ecosystem.progress.healthScore}/100 requires immediate attention and improvement actions`,
        tags: ['health-score', 'alert', 'improvement-needed']
      });
    }

    // Analyze completion rates
    if (this.ecosystem.progress.actionPlanCompletion >= 75) {
      insights.push({
        title: 'Excellent Action Plan Completion',
        content: `Action plan completion rate of ${this.ecosystem.progress.actionPlanCompletion}% shows strong execution capabilities`,
        tags: ['completion-rate', 'success', 'execution']
      });
    }

    // Analyze automation effectiveness
    if (this.ecosystem.progress.automationCompletion >= 60) {
      insights.push({
        title: 'Strong Automation Implementation',
        content: `Automation completion rate of ${this.ecosystem.progress.automationCompletion}% indicates effective automation workflows`,
        tags: ['automation', 'effectiveness', 'workflows']
      });
    }

    return insights;
  }

  private generateEcosystemSummary(): string {
    const { repository, progress, goals } = this.ecosystem;
    
    return `
🎯 Complete Automation Ecosystem Summary

Repository: ${repository.owner}/${repository.repo}
${this.ecosystem.projectId ? `GitHub Project: ${this.ecosystem.projectId}` : 'GitHub Project: Not configured'}

📊 Progress Metrics:
- Health Score: ${progress.healthScore}/100 ${progress.healthScore >= 80 ? '✅' : progress.healthScore >= 60 ? '⚠️' : '❌'}
- Action Plan Completion: ${progress.actionPlanCompletion}% ${progress.actionPlanCompletion >= 75 ? '✅' : '📈'}
- Automation Completion: ${progress.automationCompletion}% ${progress.automationCompletion >= 60 ? '✅' : '📈'}
- Total Issues Tracked: ${progress.totalIssues}

🎯 Goals Processed: ${goals.length}
${goals.map(goal => `  - ${goal}`).join('\n')}

🗿 Knowledge Accumulated:
- Decisions Stored: ${this.ecosystem.context.decisions.length}
- Insights Generated: ${this.ecosystem.context.insights.length}

🚀 Ecosystem Status: ${progress.healthScore >= 80 ? 'Excellent' : progress.healthScore >= 60 ? 'Good' : 'Needs Improvement'}

This automation ecosystem demonstrates the power of tool-centric automation with self-improving capabilities, where every interaction contributes to continuous learning and improvement.
    `.trim();
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Complete Automation Ecosystem Demo');
  console.log('=====================================\n');

  // Configuration
  const owner = process.argv[2] || 'emmanuelbarrera';
  const repo = process.argv[3] || 'automate_workloads';
  const projectId = process.argv[4]; // Optional GitHub Project ID

  const goals = [
    'Improve repository documentation and README',
    'Set up comprehensive automation workflows',
    'Implement progress tracking and monitoring',
    'Create GitHub Projects integration for team collaboration'
  ];

  // Create ecosystem instance
  const ecosystem = new CompleteAutomationEcosystem(owner, repo, projectId);

  try {
    // Execute complete automation ecosystem
    await ecosystem.analyzeRepository();
    await ecosystem.planGoals(goals);
    await ecosystem.storeFossilContext();
    await ecosystem.trackProgress();
    await ecosystem.integrateWithGitHubProjects();
    await ecosystem.learnFromInteractions();
    await ecosystem.generateEcosystemReport();

    console.log('\n🎉 Complete Automation Ecosystem Demo Finished!');
    console.log('\nThis demo showcases:');
    console.log('✅ Repository orchestration and analysis');
    console.log('✅ LLM-powered goal decomposition');
    console.log('✅ Persistent fossil context storage');
    console.log('✅ Real-time progress tracking');
    console.log('✅ GitHub Projects integration');
    console.log('✅ Continuous learning and improvement');

  } catch (error) {
    console.error('❌ Ecosystem demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (import.meta.main) {
  main();
}

export { CompleteAutomationEcosystem }; 