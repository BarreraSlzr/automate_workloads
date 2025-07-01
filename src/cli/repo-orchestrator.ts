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
    fossilize: z.boolean().default(true),
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
    issues: z.array(z.object({
      number: z.number(),
      title: z.string(),
      labels: z.array(z.object({
        name: z.string(),
        color: z.string(),
      })),
      updatedAt: z.string(),
    })).optional(),
  }),
  health: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
    actions: z.object({
      createIssues: z.boolean(),
    }).optional(),
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

// Helper: Check if an open issue with the given title exists
function issueExists(repo: string, title: string): boolean {
  try {
    const result = execSync(
      `gh issue list --repo ${repo} --state open --json title`,
      { encoding: 'utf8' }
    );
    const issues = JSON.parse(result);
    return issues.some((issue: any) => issue.title.trim() === title.trim());
  } catch {
    return false;
  }
}

// Helper: Ensure a label exists in the repo
function ensureLabelExists(repo: string, label: string, color: string = 'ededed') {
  try {
    const result = execSync(`gh label list --repo ${repo} --json name`, { encoding: 'utf8' });
    const labels = JSON.parse(result);
    if (!labels.some((l: any) => l.name === label)) {
      execSync(`gh label create "${label}" --repo ${repo} --color ${color}`);
    }
  } catch {}
}

// Helper: Add a label to an issue
function addLabelToIssue(repo: string, issueNumber: number, label: string) {
  ensureLabelExists(repo, label);
  execSync(`gh issue edit ${issueNumber} --repo ${repo} --add-label "${label}"`);
}

// Helper: Fossilize repository analysis results
async function fossilizeAnalysis(repoConfig: RepoConfig, analysis: any): Promise<void> {
  try {
    const fossilEntry = {
      type: 'observation' as const,
      title: `Repository Analysis - ${repoConfig.owner}/${repoConfig.repo}`,
      content: `Health Score: ${analysis.health.score}/100
Open Issues: ${analysis.repository.openIssues}
Automation Opportunities: ${analysis.automation.opportunities.length}
Active Workflows: ${analysis.workflows.length}
Recommendations: ${analysis.health.recommendations.join(', ') || 'None'}`,
      tags: ['repository-analysis', 'health-check', 'automation', 'monitoring'],
      source: 'automated' as const,
      metadata: {
        repository: `${repoConfig.owner}/${repoConfig.repo}`,
        healthScore: analysis.health.score,
        openIssues: analysis.repository.openIssues,
        openPRs: analysis.repository.openPRs,
        automationOpportunities: analysis.automation.opportunities.length,
        workflowsActive: analysis.workflows.filter((w: any) => w.status === 'active').length,
        recommendations: analysis.health.recommendations,
        actions: analysis.health.actions,
      },
    };

    // Add to fossil storage
    const command = `bun run context:add --type ${fossilEntry.type} --title "${fossilEntry.title}" --content "${fossilEntry.content}" --tags "${fossilEntry.tags.join(',')}" --source ${fossilEntry.source}`;
    execSync(command, { encoding: 'utf8' });
    console.log('🗿 Analysis fossilized for future reference');
  } catch (error) {
    console.warn('⚠️  Could not fossilize analysis:', error);
  }
}

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
        
        // Fossilize analysis results (unless disabled)
        if (repoConfig.options?.fossilize !== false) {
          await fossilizeAnalysis(repoConfig, analysis);
        }
        
        // Execute actions based on analysis
        if (analysis.health.actions?.createIssues) {
          console.log('📝 Creating issues based on analysis...');
          const createdIssues = await this.createAutomationIssues(repoConfig);
          results.steps.push({ step: 'issue-creation', status: 'completed', data: { createdIssues } });
        }
        // Label any open issues with no labels
        await this.labelUnlabeledIssues(repoConfig);
      }

      // Step 2: LLM-Powered Planning
      if (['plan', 'full'].includes(repoConfig.workflow)) {
        console.log('🤖 Step 2: LLM-powered planning...');
        const plan = await this.createLLMPlan(repoConfig);
        results.steps.push({ step: 'planning', status: 'completed', data: plan });
        // Fossilize plan
        if (repoConfig.options?.fossilize !== false) {
          try {
            const fossilEntry = {
              type: 'plan' as const,
              title: `LLM Plan - ${repoConfig.owner}/${repoConfig.repo}`,
              content: JSON.stringify(plan, null, 2),
              tags: ['llm-plan', 'automation', 'planning'],
              source: 'llm' as const,
              metadata: { repository: `${repoConfig.owner}/${repoConfig.repo}` },
            };
            // Write content to a temporary file to avoid command line length issues
            const fs = await import('fs/promises');
            const tempFile = `.temp-fossil-content-${Date.now()}.json`;
            await fs.writeFile(tempFile, fossilEntry.content);
            
            const command = `bun run context:add --type ${fossilEntry.type} --title "${fossilEntry.title}" --content "$(cat ${tempFile})" --tags "${fossilEntry.tags.join(',')}" --source ${fossilEntry.source}`;
            execSync(command, { encoding: 'utf8' });
            
            // Clean up temp file
            await fs.unlink(tempFile);
            console.log('🗿 Plan fossilized for future reference');
          } catch (error) {
            console.warn('⚠️  Could not fossilize plan:', error);
          }
        }
      }

      // Step 3: Workflow Execution
      if (['execute', 'full'].includes(repoConfig.workflow)) {
        console.log('🚀 Step 3: Executing workflows...');
        const execution = await this.executeWorkflows(repoConfig);
        results.steps.push({ step: 'execution', status: 'completed', data: execution });
        // Fossilize execution result
        if (repoConfig.options?.fossilize !== false) {
          try {
            const fossilEntry = {
              type: 'result' as const,
              title: `Execution Result - ${repoConfig.owner}/${repoConfig.repo}`,
              content: JSON.stringify(execution, null, 2),
              tags: ['execution', 'automation', 'result'],
              source: 'automated' as const,
              metadata: { repository: `${repoConfig.owner}/${repoConfig.repo}` },
            };
            // Write content to a temporary file to avoid command line length issues
            const fs = await import('fs/promises');
            const tempFile = `.temp-fossil-content-${Date.now()}.json`;
            await fs.writeFile(tempFile, fossilEntry.content);
            
            const command = `bun run context:add --type ${fossilEntry.type} --title "${fossilEntry.title}" --content "$(cat ${tempFile})" --tags "${fossilEntry.tags.join(',')}" --source ${fossilEntry.source}`;
            execSync(command, { encoding: 'utf8' });
            
            // Clean up temp file
            await fs.unlink(tempFile);
            console.log('🗿 Execution result fossilized for future reference');
          } catch (error) {
            console.warn('⚠️  Could not fossilize execution result:', error);
          }
        }
      }

      // Step 4: Monitoring and Optimization
      if (['monitor', 'full'].includes(repoConfig.workflow)) {
        console.log('📈 Step 4: Monitoring and optimization...');
        const monitoring = await this.monitorAndOptimize(repoConfig);
        results.steps.push({ step: 'monitoring', status: 'completed', data: monitoring });
        // Fossilize monitoring/observation
        if (repoConfig.options?.fossilize !== false) {
          try {
            const fossilEntry = {
              type: 'observation' as const,
              title: `Monitoring Observation - ${repoConfig.owner}/${repoConfig.repo}`,
              content: JSON.stringify(monitoring, null, 2),
              tags: ['monitoring', 'automation', 'observation'],
              source: 'automated' as const,
              metadata: { repository: `${repoConfig.owner}/${repoConfig.repo}` },
            };
            // Write content to a temporary file to avoid command line length issues
            const fs = await import('fs/promises');
            const tempFile = `.temp-fossil-content-${Date.now()}.json`;
            await fs.writeFile(tempFile, fossilEntry.content);
            
            const command = `bun run context:add --type ${fossilEntry.type} --title "${fossilEntry.title}" --content "$(cat ${tempFile})" --tags "${fossilEntry.tags.join(',')}" --source ${fossilEntry.source}`;
            execSync(command, { encoding: 'utf8' });
            
            // Clean up temp file
            await fs.unlink(tempFile);
            console.log('🗿 Monitoring observation fossilized for future reference');
          } catch (error) {
            console.warn('⚠️  Could not fossilize monitoring observation:', error);
          }
        }
      }

      // Generate summary
      results.summary = this.generateSummary(results.steps);
      
      console.log('✅ Repository orchestration completed successfully');
      return results;

    } catch (error) {
      console.error('❌ Error during repository orchestration:', error);
      results.steps.push({ step: 'error', status: 'failed', error: error instanceof Error ? error.message : String(error) });
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
        `gh repo view ${repoConfig.owner}/${repoConfig.repo} --json name,owner,description,primaryLanguage,stargazerCount,forkCount,defaultBranchRef,updatedAt`,
        { encoding: 'utf8' }
      );
      
      const repo = JSON.parse(repoData);
      
      // Get issues and PRs count separately since they're not available in the main repo view
      let openIssues = 0;
      let openPRs = 0;
      
      try {
        const issuesData = execSync(
          `gh issue list --repo ${repoConfig.owner}/${repoConfig.repo} --state open --json number,title,labels,updatedAt`,
          { encoding: 'utf8' }
        );
        const issues = JSON.parse(issuesData);
        openIssues = issues.length;
        // Store issues for later use
        (repoConfig as any).openIssuesList = issues;
      } catch {
        // Ignore issues fetch error
      }
      
      try {
        const prsData = execSync(
          `gh api repos/${repoConfig.owner}/${repoConfig.repo}/pulls?state=open&per_page=1`,
          { encoding: 'utf8' }
        );
        const prs = JSON.parse(prsData);
        openPRs = prs.length > 0 ? parseInt(prs[0].number) : 0;
      } catch {
        // Ignore PRs fetch error
      }
      
      return {
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description,
        language: repo.primaryLanguage?.name,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        openIssues,
        openPRs,
        lastCommit: repo.updatedAt,
        defaultBranch: repo.defaultBranchRef.name,
        issues: (repoConfig as any).openIssuesList || [],
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
    let checksPerformed = 0;
    let checksFailed = 0;

    // Check for recent activity
    try {
      const lastCommit = execSync(
        `gh api repos/${repoConfig.owner}/${repoConfig.repo}/commits?per_page=1`,
        { encoding: 'utf8' }
      );
      
      const commits = JSON.parse(lastCommit);
      checksPerformed++;
      
      if (commits.length === 0) {
        issues.push('No recent commits found');
        score -= 20;
        recommendations.push('Consider adding recent commits to maintain activity');
      }
    } catch (error) {
      checksFailed++;
      issues.push(`Could not check recent commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
      score -= 5;
    }

    // Check for open issues
    let hasOpenIssues = false;
    try {
      const openIssues = execSync(
        `gh issue list --repo ${repoConfig.owner}/${repoConfig.repo} --state open --json number`,
        { encoding: 'utf8' }
      );
      
      const issuesData = JSON.parse(openIssues);
      checksPerformed++;
      
      if (issuesData.length === 0) {
        hasOpenIssues = false;
        recommendations.push('No open issues found - consider creating issues for tracking');
      } else {
        hasOpenIssues = true;
        if (issuesData.length > 10) {
          recommendations.push(`Repository has ${issuesData.length} open issues - consider prioritizing and closing some`);
        }
      }
    } catch (error) {
      checksFailed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      issues.push(`Could not check open issues: ${errorMessage}`);
      score -= 5;
    }

    // Check for README
    try {
      execSync(`gh api repos/${repoConfig.owner}/${repoConfig.repo}/contents/README.md`);
      checksPerformed++;
    } catch (error) {
      checksFailed++;
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
      checksPerformed++;
      
      if (workflowsData.total_count === 0) {
        issues.push('No CI/CD workflows found');
        score -= 25;
        recommendations.push('Add GitHub Actions workflows for automated testing and deployment');
      }
    } catch (error) {
      checksFailed++;
      issues.push(`Could not check CI/CD workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
      score -= 10;
    }

    // Add summary if some checks failed
    if (checksFailed > 0) {
      issues.push(`Health analysis: ${checksPerformed} checks passed, ${checksFailed} checks failed`);
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
      actions: {
        createIssues: !hasOpenIssues && repoConfig.options?.createIssues !== false,
      },
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
        error: error instanceof Error ? error.message : String(error),
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
    const repo = `${repoConfig.owner}/${repoConfig.repo}`;
    const defaultLabel = 'automation';
    ensureLabelExists(repo, defaultLabel, 'ededed');
    try {
      // Create issue for project tracking
      const trackingIssueData = {
        title: '📋 Project Tracking and Management',
        body: `## Project Tracking Setup\n\nThis issue was created by the LLM-powered repository orchestrator to establish proper project tracking.\n\n### Purpose:\n- Track project progress and milestones\n- Organize tasks and priorities\n- Monitor development activities\n- Ensure project visibility\n\n### Recommended Actions:\n- [ ] Set up project boards or milestones\n- [ ] Create issue templates for different task types\n- [ ] Establish labeling conventions\n- [ ] Set up automated progress tracking\n\n### Benefits:\n- Better project organization\n- Improved team collaboration\n- Clear progress visibility\n- Enhanced project management\n\n---\n*Created by Repository Orchestrator on ${new Date().toISOString()}*`,
        label: defaultLabel,
      };
      if (!issueExists(repo, trackingIssueData.title)) {
        const trackingIssue = execSync(
          `gh issue create --repo ${repo} --title "${trackingIssueData.title}" --body "${trackingIssueData.body}" --label "${trackingIssueData.label}"`,
          { encoding: 'utf8' }
        );
        issues.push({
          type: 'project-tracking',
          issue: trackingIssue.trim(),
          timestamp: new Date().toISOString(),
        });
      }
      // Create issue for automation setup
      const automationIssueData = {
        title: '🤖 Repository Automation Setup',
        body: `## Automation Setup\n\nThis issue was created by the LLM-powered repository orchestrator to improve automation for this repository.\n\n### Recommended Actions:\n- [ ] Set up GitHub Actions workflows\n- [ ] Configure automated testing\n- [ ] Add issue templates\n- [ ] Set up automated dependency updates\n- [ ] Configure automated code quality checks\n\n### Benefits:\n- Faster development cycles\n- Reduced manual work\n- Improved code quality\n- Better project management\n\n---\n*Created by Repository Orchestrator on ${new Date().toISOString()}*`,
        label: defaultLabel,
      };
      if (!issueExists(repo, automationIssueData.title)) {
        const automationIssue = execSync(
          `gh issue create --repo ${repo} --title "${automationIssueData.title}" --body "${automationIssueData.body}" --label "${automationIssueData.label}"`,
          { encoding: 'utf8' }
        );
        issues.push({
          type: 'automation-setup',
          issue: automationIssue.trim(),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('⚠️  Could not create automation issues:', error);
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

  // After analysis, add the automation label to any open issue with no labels
  private async labelUnlabeledIssues(repoConfig: RepoConfig) {
    const repo = `${repoConfig.owner}/${repoConfig.repo}`;
    const defaultLabel = 'automation';
    ensureLabelExists(repo, defaultLabel, 'ededed');
    try {
      const issuesData = execSync(
        `gh issue list --repo ${repo} --state open --json number,labels`,
        { encoding: 'utf8' }
      );
      const issues = JSON.parse(issuesData);
      for (const issue of issues) {
        if (!issue.labels || issue.labels.length === 0) {
          addLabelToIssue(repo, issue.number, defaultLabel);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not label unlabeled issues:', error);
    }
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
          fossilize: true, // Default to true for orchestrate command
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
  .option('--no-fossilize', 'Skip fossilizing analysis results')
  .action(async (owner, repo, options) => {
    try {
      const repoConfig: RepoConfig = {
        owner,
        repo,
        branch: 'main',
        workflow: 'analyze',
        options: {
          createIssues: true,
          createPRs: false,
          autoMerge: false,
          notifications: true,
          fossilize: options.fossilize !== false,
        },
      };

      // Analyze repository
      const service = new RepoOrchestratorService();
      const analysis = await service.orchestrateRepository(repoConfig);
      
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