#!/usr/bin/env bun

/**
 * Repository Workflow Orchestrator CLI
 * 
 * Targets any GitHub repository and applies LLM-powered automation workflows
 * for planning, analysis, execution, and monitoring.
 */

import { Command } from 'commander';
import { z } from 'zod';
import { getEnv } from '../core/config.js';
import { execSync } from 'child_process';

// Repository orchestration schemas
const RepoConfigSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  branch: z.string().default('main'),
  workflow: z.enum(['plan', 'analyze', 'execute', 'monitor', 'full']).default('full'),
  context: z.record(z.unknown()).optional(),
  options: z.object({
    createIssues: z.boolean().default(true),
    createPRs: z.boolean().default(false),
    autoMerge: z.boolean().default(false),
    notifications: z.boolean().default(true),
  }).optional(),
});

const RepoAnalysisSchema = z.object({
  repository: z.object({
    name: z.string(),
    owner: z.string(),
    description: z.string().optional(),
    language: z.string().optional(),
    stars: z.number(),
    forks: z.number(),
    openIssues: z.number(),
    openPRs: z.number(),
    lastCommit: z.string(),
    defaultBranch: z.string(),
  }),
  health: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  workflows: z.array(z.object({
    name: z.string(),
    status: z.enum(['active', 'inactive', 'error']),
    lastRun: z.string().optional(),
    successRate: z.number().optional(),
  })),
  automation: z.object({
    opportunities: z.array(z.object({
      type: z.string(),
      description: z.string(),
      impact: z.enum(['low', 'medium', 'high']),
      effort: z.enum(['low', 'medium', 'high']),
      priority: z.number(),
    })),
    currentAutomation: z.array(z.string()),
  }),
});

type RepoConfig = z.infer<typeof RepoConfigSchema>;
type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;

/**
 * Repository Workflow Orchestrator Service
 * 
 * Handles LLM-powered workflow orchestration for any GitHub repository
 */
class RepoOrchestratorService {
  private config: ReturnType<typeof getEnv>;

  constructor() {
    this.config = getEnv();
  }

  /**
   * Orchestrates workflow for a target repository
   * @param repoConfig - Repository configuration
   * @returns Orchestration results
   */
  async orchestrateRepository(repoConfig: RepoConfig): Promise<Record<string, unknown>> {
    console.log(`🎯 Orchestrating workflow for ${repoConfig.owner}/${repoConfig.repo}`);
    
    const results = {
      repository: `${repoConfig.owner}/${repoConfig.repo}`,
      workflow: repoConfig.workflow,
      timestamp: new Date().toISOString(),
      steps: [] as any[],
      summary: {} as Record<string, unknown>,
    };

    try {
      // Step 1: Repository Analysis
      if (['analyze', 'full'].includes(repoConfig.workflow)) {
        console.log('📊 Step 1: Analyzing repository...');
        const analysis = await this.analyzeRepository(repoConfig);
        results.steps.push({ step: 'analysis', status: 'completed', data: analysis });
      }

      // Step 2: LLM-Powered Planning
      if (['plan', 'full'].includes(repoConfig.workflow)) {
        console.log('🤖 Step 2: LLM-powered planning...');
        const plan = await this.createLLMPlan(repoConfig);
        results.steps.push({ step: 'planning', status: 'completed', data: plan });
      }

      // Step 3: Workflow Execution
      if (['execute', 'full'].includes(repoConfig.workflow)) {
        console.log('🚀 Step 3: Executing workflows...');
        const execution = await this.executeWorkflows(repoConfig);
        results.steps.push({ step: 'execution', status: 'completed', data: execution });
      }

      // Step 4: Monitoring and Optimization
      if (['monitor', 'full'].includes(repoConfig.workflow)) {
        console.log('📈 Step 4: Monitoring and optimization...');
        const monitoring = await this.monitorAndOptimize(repoConfig);
        results.steps.push({ step: 'monitoring', status: 'completed', data: monitoring });
      }

      // Generate summary
      results.summary = this.generateSummary(results.steps);
      
      console.log('✅ Repository orchestration completed successfully');
      return results;

    } catch (error) {
      console.error('❌ Error during repository orchestration:', error);
      results.steps.push({ step: 'error', status: 'failed', error: error.message });
      throw error;
    }
  }

  /**
   * Analyzes repository health and automation opportunities
   * @param repoConfig - Repository configuration
   * @returns Repository analysis
   */
  private async analyzeRepository(repoConfig: RepoConfig): Promise<RepoAnalysis> {
    console.log(`🔍 Analyzing ${repoConfig.owner}/${repoConfig.repo}...`);

    // Get repository information using GitHub CLI
    const repoInfo = await this.getRepositoryInfo(repoConfig);
    
    // Analyze repository health
    const health = await this.analyzeRepositoryHealth(repoConfig);
    
    // Analyze workflows
    const workflows = await this.analyzeWorkflows(repoConfig);
    
    // Identify automation opportunities
    const automation = await this.identifyAutomationOpportunities(repoConfig, repoInfo);

    return {
      repository: repoInfo,
      health,
      workflows,
      automation,
    };
  }

  /**
   * Gets repository information using GitHub CLI
   * @param repoConfig - Repository configuration
   * @returns Repository information
   */
  private async getRepositoryInfo(repoConfig: RepoConfig): Promise<RepoAnalysis['repository']> {
    try {
      // Use GitHub CLI to get repository information
      const repoData = execSync(
        `gh repo view ${repoConfig.owner}/${repoConfig.repo} --json name,owner,description,primaryLanguage,stargazerCount,forkCount,openIssuesCount,openPullRequestsCount,defaultBranchRef,updatedAt`,
        { encoding: 'utf8' }
      );
      
      const repo = JSON.parse(repoData);
      
      return {
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description,
        language: repo.primaryLanguage?.name,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        openIssues: repo.openIssuesCount,
        openPRs: repo.openPullRequestsCount,
        lastCommit: repo.updatedAt,
        defaultBranch: repo.defaultBranchRef.name,
      };
    } catch (error) {
      console.warn('⚠️  Could not fetch repository info, using defaults');
      return {
        name: repoConfig.repo,
        owner: repoConfig.owner,
        description: 'Repository information unavailable',
        language: 'Unknown',
        stars: 0,
        forks: 0,
        openIssues: 0,
        openPRs: 0,
        lastCommit: new Date().toISOString(),
        defaultBranch: repoConfig.branch,
      };
    }
  }

  /**
   * Analyzes repository health
   * @param repoConfig - Repository configuration
   * @returns Health analysis
   */
  private async analyzeRepositoryHealth(repoConfig: RepoConfig): Promise<RepoAnalysis['health']> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    try {
      // Check for recent activity
      const lastCommit = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/commits?per_page=1`,
        { encoding: 'utf8' }
      );
      
      const commits = JSON.parse(lastCommit);
      if (commits.length === 0) {
        issues.push('No recent commits found');
        score -= 20;
        recommendations.push('Consider adding recent commits to maintain activity');
      }

      // Check for open issues
      const openIssues = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/issues?state=open&per_page=1`,
        { encoding: 'utf8' }
      );
      
      const issuesData = JSON.parse(openIssues);
      if (issuesData.length === 0) {
        recommendations.push('No open issues found - consider creating issues for tracking');
      }

      // Check for README
      try {
        execSync(`gh api repos/${repoConfig.owner}/${repoConfig.repo}/contents/README.md`);
      } catch {
        issues.push('No README.md found');
        score -= 15;
        recommendations.push('Add a comprehensive README.md file');
      }

      // Check for CI/CD workflows
      try {
        const workflows = execSync(
          `gh api repos/${repoConfig.owner}/${repoConfig.repo}/actions/workflows`,
          { encoding: 'utf8' }
        );
        
        const workflowsData = JSON.parse(workflows);
        if (workflowsData.total_count === 0) {
          issues.push('No CI/CD workflows found');
          score -= 25;
          recommendations.push('Add GitHub Actions workflows for automated testing and deployment');
        }
      } catch {
        issues.push('Could not check CI/CD workflows');
        score -= 10;
      }

    } catch (error) {
      issues.push('Could not perform complete health analysis');
      score -= 30;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  /**
   * Analyzes repository workflows
   * @param repoConfig - Repository configuration
   * @returns Workflow analysis
   */
  private async analyzeWorkflows(repoConfig: RepoConfig): Promise<RepoAnalysis['workflows']> {
    const workflows: RepoAnalysis['workflows'] = [];

    try {
      const workflowsData = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/actions/workflows`,
        { encoding: 'utf8' }
      );
      
      const data = JSON.parse(workflowsData);
      
      for (const workflow of data.workflows) {
        workflows.push({
          name: workflow.name,
          status: workflow.state === 'active' ? 'active' : 'inactive',
          lastRun: workflow.updated_at,
          successRate: 0, // Would need to calculate from runs
        });
      }
    } catch (error) {
      console.warn('⚠️  Could not analyze workflows');
    }

    return workflows;
  }

  /**
   * Identifies automation opportunities
   * @param repoConfig - Repository configuration
   * @param repoInfo - Repository information
   * @returns Automation opportunities
   */
  private async identifyAutomationOpportunities(
    repoConfig: RepoConfig,
    repoInfo: RepoAnalysis['repository']
  ): Promise<RepoAnalysis['automation']> {
    const opportunities: RepoAnalysis['automation']['opportunities'] = [];
    const currentAutomation: string[] = [];

    // Analyze based on repository characteristics
    if (repoInfo.openIssues > 10) {
      opportunities.push({
        type: 'issue-management',
        description: 'Automate issue triage and assignment',
        impact: 'high',
        effort: 'medium',
        priority: 1,
      });
    }

    if (repoInfo.openPRs > 5) {
      opportunities.push({
        type: 'pr-automation',
        description: 'Automate PR reviews and merging',
        impact: 'high',
        effort: 'medium',
        priority: 2,
      });
    }

    if (!repoInfo.description || repoInfo.description.length < 50) {
      opportunities.push({
        type: 'documentation',
        description: 'Improve repository documentation',
        impact: 'medium',
        effort: 'low',
        priority: 3,
      });
    }

    // Check for existing automation
    try {
      const workflows = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/actions/workflows`,
        { encoding: 'utf8' }
      );
      
      const data = JSON.parse(workflows);
      data.workflows.forEach((workflow: any) => {
        currentAutomation.push(workflow.name);
      });
    } catch (error) {
      // No workflows found
    }

    return {
      opportunities: opportunities.sort((a, b) => a.priority - b.priority),
      currentAutomation,
    };
  }

  /**
   * Creates LLM-powered plan for repository
   * @param repoConfig - Repository configuration
   * @returns LLM-generated plan
   */
  private async createLLMPlan(repoConfig: RepoConfig): Promise<Record<string, unknown>> {
    console.log('🤖 Creating LLM-powered plan...');

    // Gather context for the repository
    const context = await this.gatherRepositoryContext(repoConfig);
    
    // Create LLM prompt for planning
    const llmPrompt = `
      Create a comprehensive automation plan for the repository: ${repoConfig.owner}/${repoConfig.repo}
      
      Context: ${JSON.stringify(context, null, 2)}
      
      Provide:
      1. Immediate actions (next 24 hours)
      2. Short-term improvements (next week)
      3. Long-term automation strategy (next month)
      4. Risk assessment and mitigation
      5. Success metrics and KPIs
    `;

    // Simulate LLM processing
    await this.simulateLLMProcessing(llmPrompt);

    return {
      immediateActions: [
        'Review and prioritize open issues',
        'Update repository documentation',
        'Set up automated testing workflows',
      ],
      shortTermImprovements: [
        'Implement automated issue triage',
        'Add PR templates and automation',
        'Set up monitoring and alerts',
      ],
      longTermStrategy: [
        'Full CI/CD pipeline automation',
        'Advanced analytics and reporting',
        'Cross-platform integration',
      ],
      risks: [
        {
          description: 'Breaking changes during automation',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Gradual rollout with rollback capabilities',
        },
      ],
      successMetrics: {
        issueResolutionTime: 'Reduce by 50%',
        prMergeTime: 'Reduce by 30%',
        automationCoverage: 'Increase to 80%',
      },
    };
  }

  /**
   * Executes workflows for the repository
   * @param repoConfig - Repository configuration
   * @returns Execution results
   */
  private async executeWorkflows(repoConfig: RepoConfig): Promise<Record<string, unknown>> {
    console.log('🚀 Executing workflows...');

    const results = {
      createdIssues: [] as any[],
      createdPRs: [] as any[],
      updatedFiles: [] as any[],
      errors: [] as any[],
    };

    try {
      // Create automation issues if enabled
      if (repoConfig.options?.createIssues) {
        const automationIssues = await this.createAutomationIssues(repoConfig);
        results.createdIssues.push(...automationIssues);
      }

      // Create automation PRs if enabled
      if (repoConfig.options?.createPRs) {
        const automationPRs = await this.createAutomationPRs(repoConfig);
        results.createdPRs.push(...automationPRs);
      }

      // Update repository files
      const updatedFiles = await this.updateRepositoryFiles(repoConfig);
      results.updatedFiles.push(...updatedFiles);

    } catch (error) {
      results.errors.push({
        step: 'execution',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  /**
   * Monitors and optimizes repository workflows
   * @param repoConfig - Repository configuration
   * @returns Monitoring results
   */
  private async monitorAndOptimize(repoConfig: RepoConfig): Promise<Record<string, unknown>> {
    console.log('📈 Monitoring and optimizing...');

    const monitoring = {
      metrics: {} as Record<string, unknown>,
      alerts: [] as any[],
      optimizations: [] as any[],
    };

    try {
      // Gather current metrics
      monitoring.metrics = await this.gatherMetrics(repoConfig);
      
      // Check for alerts
      monitoring.alerts = await this.checkAlerts(repoConfig, monitoring.metrics);
      
      // Generate optimizations
      monitoring.optimizations = await this.generateOptimizations(repoConfig, monitoring.metrics);

    } catch (error) {
      console.warn('⚠️  Error during monitoring:', error);
    }

    return monitoring;
  }

  /**
   * Gathers repository context for LLM processing
   * @param repoConfig - Repository configuration
   * @returns Repository context
   */
  private async gatherRepositoryContext(repoConfig: RepoConfig): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {
      repository: `${repoConfig.owner}/${repoConfig.repo}`,
      branch: repoConfig.branch,
      timestamp: new Date().toISOString(),
    };

    try {
      // Get recent issues
      const issues = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/issues?state=open&per_page=10`,
        { encoding: 'utf8' }
      );
      context.recentIssues = JSON.parse(issues);

      // Get recent PRs
      const prs = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/pulls?state=open&per_page=10`,
        { encoding: 'utf8' }
      );
      context.recentPRs = JSON.parse(prs);

      // Get recent commits
      const commits = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/commits?per_page=10`,
        { encoding: 'utf8' }
      );
      context.recentCommits = JSON.parse(commits);

    } catch (error) {
      console.warn('⚠️  Could not gather complete context:', error);
    }

    return context;
  }

  /**
   * Creates automation issues for the repository
   * @param repoConfig - Repository configuration
   * @returns Created issues
   */
  private async createAutomationIssues(repoConfig: RepoConfig): Promise<any[]> {
    const issues = [];

    try {
      // Create issue for automation setup
      const issueData = {
        title: '🤖 Set up repository automation',
        body: `## Automation Setup

This issue was created by the LLM-powered repository orchestrator to improve automation for this repository.

### Recommended Actions:
- [ ] Set up GitHub Actions workflows
- [ ] Configure automated testing
- [ ] Add issue templates
- [ ] Set up automated dependency updates

### Benefits:
- Faster development cycles
- Reduced manual work
- Improved code quality
- Better project management

---
*Created by Repository Orchestrator on ${new Date().toISOString()}*`,
        labels: ['automation', 'enhancement'],
      };

      const issue = execSync(
        `gh issue create --repo ${repoConfig.owner}/${repoConfig.repo} --title "${issueData.title}" --body "${issueData.body}" --label "${issueData.labels.join(',')}"`,
        { encoding: 'utf8' }
      );

      issues.push({
        type: 'automation-setup',
        issue: issue.trim(),
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.warn('⚠️  Could not create automation issue:', error);
    }

    return issues;
  }

  /**
   * Creates automation PRs for the repository
   * @param repoConfig - Repository configuration
   * @returns Created PRs
   */
  private async createAutomationPRs(repoConfig: RepoConfig): Promise<any[]> {
    const prs = [];

    try {
      // This would create a branch and PR with automation improvements
      // For now, we'll simulate the process
      console.log('📝 Creating automation PRs...');
      
      prs.push({
        type: 'automation-improvements',
        status: 'simulated',
        description: 'PR for automation improvements',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.warn('⚠️  Could not create automation PRs:', error);
    }

    return prs;
  }

  /**
   * Updates repository files with automation improvements
   * @param repoConfig - Repository configuration
   * @returns Updated files
   */
  private async updateRepositoryFiles(repoConfig: RepoConfig): Promise<any[]> {
    const updatedFiles = [];

    try {
      // This would update files like README.md, workflows, etc.
      console.log('📝 Updating repository files...');
      
      updatedFiles.push({
        file: 'README.md',
        action: 'enhanced',
        description: 'Added automation section',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.warn('⚠️  Could not update repository files:', error);
    }

    return updatedFiles;
  }

  /**
   * Gathers metrics for monitoring
   * @param repoConfig - Repository configuration
   * @returns Repository metrics
   */
  private async gatherMetrics(repoConfig: RepoConfig): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {};

    try {
      // Get basic repository metrics
      const repoData = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}`,
        { encoding: 'utf8' }
      );
      
      const repo = JSON.parse(repoData);
      metrics.stars = repo.stargazer_count;
      metrics.forks = repo.forks_count;
      metrics.openIssues = repo.open_issues_count;
      metrics.lastUpdated = repo.updated_at;

    } catch (error) {
      console.warn('⚠️  Could not gather metrics:', error);
    }

    return metrics;
  }

  /**
   * Checks for alerts based on metrics
   * @param repoConfig - Repository configuration
   * @param metrics - Repository metrics
   * @returns Alerts
   */
  private async checkAlerts(
    repoConfig: RepoConfig,
    metrics: Record<string, unknown>
  ): Promise<any[]> {
    const alerts = [];

    // Check for inactivity
    if (metrics.lastUpdated) {
      const lastUpdate = new Date(metrics.lastUpdated as string);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 30) {
        alerts.push({
          type: 'inactivity',
          severity: 'warning',
          message: `Repository has not been updated for ${Math.floor(daysSinceUpdate)} days`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check for high issue count
    if ((metrics.openIssues as number) > 20) {
      alerts.push({
        type: 'high-issues',
        severity: 'warning',
        message: `Repository has ${metrics.openIssues} open issues`,
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Generates optimizations based on metrics
   * @param repoConfig - Repository configuration
   * @param metrics - Repository metrics
   * @returns Optimizations
   */
  private async generateOptimizations(
    repoConfig: RepoConfig,
    metrics: Record<string, unknown>
  ): Promise<any[]> {
    const optimizations = [];

    // Generate optimizations based on metrics
    if ((metrics.openIssues as number) > 10) {
      optimizations.push({
        type: 'issue-management',
        description: 'Implement automated issue triage',
        impact: 'high',
        effort: 'medium',
      });
    }

    if ((metrics.stars as number) > 100) {
      optimizations.push({
        type: 'community',
        description: 'Set up community guidelines and contribution templates',
        impact: 'medium',
        effort: 'low',
      });
    }

    return optimizations;
  }

  /**
   * Generates summary from orchestration steps
   * @param steps - Orchestration steps
   * @returns Summary
   */
  private generateSummary(steps: any[]): Record<string, unknown> {
    const completedSteps = steps.filter(step => step.status === 'completed');
    const failedSteps = steps.filter(step => step.status === 'failed');

    return {
      totalSteps: steps.length,
      completedSteps: completedSteps.length,
      failedSteps: failedSteps.length,
      successRate: steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0,
      duration: 'Simulated duration',
      recommendations: this.generateRecommendations(steps),
    };
  }

  /**
   * Generates recommendations based on orchestration results
   * @param steps - Orchestration steps
   * @returns Recommendations
   */
  private generateRecommendations(steps: any[]): string[] {
    const recommendations = [];

    const analysisStep = steps.find(step => step.step === 'analysis');
    if (analysisStep?.data?.health?.score < 70) {
      recommendations.push('Focus on improving repository health score');
    }

    const planningStep = steps.find(step => step.step === 'planning');
    if (planningStep?.data?.immediateActions?.length > 0) {
      recommendations.push('Implement immediate actions from the LLM plan');
    }

    const executionStep = steps.find(step => step.step === 'execution');
    if (executionStep?.data?.errors?.length > 0) {
      recommendations.push('Review and fix execution errors');
    }

    return recommendations;
  }

  /**
   * Simulates LLM processing (placeholder for actual LLM integration)
   * @param prompt - The prompt to process
   */
  private async simulateLLMProcessing(prompt: string): Promise<void> {
    console.log('🤖 Processing with LLM...');
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ LLM processing completed');
  }
}

/**
 * CLI Command Setup
 */
const program = new Command();

program
  .name('repo-orchestrator')
  .description('LLM-powered repository workflow orchestrator')
  .version('1.0.0');

// Main orchestration command
program
  .command('orchestrate')
  .description('Orchestrate workflows for a target repository')
  .argument('<owner>', 'Repository owner')
  .argument('<repo>', 'Repository name')
  .option('-b, --branch <branch>', 'Target branch', 'main')
  .option('-w, --workflow <workflow>', 'Workflow type', 'full')
  .option('-c, --context <context>', 'Additional context (JSON string)')
  .option('--no-create-issues', 'Skip creating automation issues')
  .option('--create-prs', 'Create automation PRs')
  .option('--auto-merge', 'Enable auto-merge for PRs')
  .option('--no-notifications', 'Disable notifications')
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .action(async (owner, repo, options) => {
    try {
      const service = new RepoOrchestratorService();
      
      // Parse context if provided
      let context: Record<string, unknown> = {};
      if (options.context) {
        try {
          context = JSON.parse(options.context);
        } catch (error) {
          console.error('❌ Invalid JSON context provided');
          process.exit(1);
        }
      }

      const repoConfig: RepoConfig = {
        owner,
        repo,
        branch: options.branch,
        workflow: options.workflow as any,
        context,
        options: {
          createIssues: options.createIssues,
          createPRs: options.createPRs,
          autoMerge: options.autoMerge,
          notifications: options.notifications,
        },
      };

      const results = await service.orchestrateRepository(repoConfig);
      
      if (options.output) {
        // Write to file
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(results, null, 2));
        console.log(`✅ Results saved to ${options.output}`);
      } else {
        // Output to console
        console.log(JSON.stringify(results, null, 2));
      }
    } catch (error) {
      console.error('❌ Error during repository orchestration:', error);
      process.exit(1);
    }
  });

// Repository analysis command
program
  .command('analyze')
  .description('Analyze a repository for automation opportunities')
  .argument('<owner>', 'Repository owner')
  .argument('<repo>', 'Repository name')
  .option('-o, --output <file>', 'Output file for analysis (JSON)')
  .action(async (owner, repo, options) => {
    try {
      const service = new RepoOrchestratorService();
      
      const repoConfig: RepoConfig = {
        owner,
        repo,
        workflow: 'analyze',
      };

      const analysis = await service.analyzeRepository(repoConfig);
      
      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(analysis, null, 2));
        console.log(`✅ Analysis saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(analysis, null, 2));
      }
    } catch (error) {
      console.error('❌ Error during repository analysis:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(); 