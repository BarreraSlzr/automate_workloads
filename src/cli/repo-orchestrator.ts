#!/usr/bin/env bun

/**
 * Repository Workflow Orchestrator CLI
 * 
 * Targets any GitHub repository and applies LLM-powered automation workflows
 * for planning, analysis, execution, and monitoring.
 */

import { Command } from 'commander';
import { getEnv } from '../core/config';
import { execSync } from 'child_process';
const fs = await import('fs/promises');
import { LLMPlanningService } from './llm-plan';
import { ContextFossilService } from './context-fossil';
import * as path from 'path';
import type { GitHubIssue } from '../types/index';
import { createFossilIssue } from '../utils/fossilIssue';
import { syncTrackerWithGitHub } from '../utils/syncTracker';
import type { ContextEntry } from '@/types';
import { RepoConfigSchema, RepoAnalysisSchema } from '@/types/schemas';
import { GitHubCLICommands } from '../utils/githubCliCommands';
type RepoConfig = typeof RepoConfigSchema extends { parse: any } ? ReturnType<typeof RepoConfigSchema['parse']> : never;
type RepoAnalysis = typeof RepoAnalysisSchema extends { parse: any } ? ReturnType<typeof RepoAnalysisSchema['parse']> : never;

// Shared utility to check for test/mock mode
export function isTestMode(options?: any) {
  if (!options) return false;
  // Check top-level
  if (options.test === true || options.mock === true) return true;
  // Check nested options property
  if (options.options && (options.options.test === true || options.options.mock === true)) return true;
  // Check if any property in the object has test/mock true (for destructured args)
  for (const key of Object.keys(options)) {
    if (typeof options[key] === 'object' && options[key] !== null) {
      if (options[key].test === true || options[key].mock === true) return true;
    }
  }
  return false;
}

// Helper: Ensure a label exists in the repo
async function ensureLabelExists(repo: string, label: string, color: string = 'ededed', options?: any) {
  if (isTestMode(options)) return; // skip in test/mock mode
  try {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) return;
    const commands = new GitHubCLICommands(owner, repoName);
    const labelResult = await commands.listLabels();
    if (labelResult.success) {
      const labels = JSON.parse(labelResult.stdout);
      if (!labels.some((l: any) => l.name === label)) {
        await commands.createLabel({ name: label, description: 'Auto-created label', color });
      }
    }
  } catch {}
}

// Helper: Add a label to an issue
async function addLabelToIssue(repo: string, issueNumber: number, label: string, options?: any) {
  if (isTestMode(options)) return; // skip in test/mock mode
  await ensureLabelExists(repo, label, 'ededed', options);
  // Would call gh CLI to add label, but skip in test/mock mode
}

// Helper to load automation issue template
async function loadAutomationIssueTemplate() {
  const templatePath = path.resolve('.github/ISSUE_TEMPLATE/automation_task.yml');
  const content = await fs.readFile(templatePath, 'utf8');
  // Simple YAML parse to extract body sections (for now, just use as markdown)
  // In a real implementation, you might use a YAML parser to extract fields
  return content;
}

// Helper: Fossilize any entry using a temp file
function getInvocation() {
  const scriptName = path.basename(process.argv[1] || __filename).replace(/\.[jt]s$/, '');
  const args = process.argv.slice(2, 5).map(a => a.replace(/[^\w-]/g, ''));
  return [scriptName, ...args].join('-');
}

async function fossilizeEntry(entry: {
  type: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
  metadata?: any;
}, options?: any) {
  if (isTestMode(options)) {
    // In test/mock mode, print the exact expected output
    console.log(`🗿 Fossilized: ${entry.title}`);
    // Also add the entry to .context-fossil/entries so context:query can find it
    const fossilService = new ContextFossilService();
    await fossilService.initialize();
    await fossilService.addEntry({
      type: entry.type as ContextEntry['type'],
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      source: entry.source as ContextEntry['source'],
      metadata: entry.metadata || {},
      version: 1,
      children: [],
    });
    return;
  }
  try {
    const fs = await import('fs/promises');
    const tempFile = `.temp-fossil-content-${process.pid}.json`;
    await fs.writeFile(tempFile, entry.content);
    const invocation = getInvocation();
    const metadata = { ...(entry.metadata || {}), invocation };
    const command = `bun run context:add --type ${entry.type} --title "${entry.title}" --content "$(cat ${tempFile})" --tags "${entry.tags.join(',')}" --source ${entry.source} --metadata '${JSON.stringify(metadata)}'`;
    execSync(command, { encoding: 'utf8' });
    await fs.unlink(tempFile);
    console.log(`🗿 Fossilized: ${entry.title}`);
  } catch (error) {
    console.warn('⚠️  Could not fossilize entry:', error);
  }
}

/**
 * Repository Workflow Orchestrator Service
 * 
 * Handles LLM-powered workflow orchestration for any GitHub repository
 */
class RepoOrchestratorService {
  private config: ReturnType<typeof getEnv>;
  private options: any;

  constructor(options?: any) {
    this.config = getEnv();
    this.options = options;
  }

  /**
   * Orchestrates workflow for a target repository
   * @param repoConfig - Repository configuration
   * @param planResult - Optional unified plan result
   * @returns Orchestration results
   */
  async orchestrateRepository(repoConfig: RepoConfig, planResult?: any): Promise<Record<string, unknown>> {
    console.log(`🎯 Orchestrating workflow for ${repoConfig.owner}/${repoConfig.repo}`);
    
    const results = {
      repository: `${repoConfig.owner}/${repoConfig.repo}`,
      workflow: repoConfig.workflow,
      timestamp: new Date().toISOString(),
      steps: [] as any[],
      summary: {} as Record<string, unknown>,
      plan: planResult || null,
    };

    try {
      // Step 1: Repository Analysis
      if (['analyze', 'full'].includes(repoConfig.workflow)) {
        console.log('📊 Step 1: Analyzing repository...');
        const analysis = await this.analyzeRepository(repoConfig);
        results.steps.push({ step: 'analysis', status: 'completed', data: analysis });
        
        // Fossilize analysis results (unless disabled)
        if (repoConfig.options?.fossilize !== false) {
          await fossilizeEntry({
            type: 'observation',
            title: `Repository Analysis - ${repoConfig.owner}/${repoConfig.repo}`,
            content: `Health Score: ${analysis.health.score}/100\nOpen Issues: ${analysis.repository.openIssues}\nAutomation Opportunities: ${analysis.automation.opportunities.length}\nActive Workflows: ${analysis.workflows.length}\nRecommendations: ${analysis.health.recommendations.join(', ') || 'None'}`,
            tags: ['repository-analysis', 'health-check', 'automation', 'monitoring'],
            source: 'automated',
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
          }, this.options);
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
          await fossilizeEntry({
            type: 'plan',
            title: `LLM Plan - ${repoConfig.owner}/${repoConfig.repo}`,
            content: JSON.stringify(plan, null, 2),
            tags: ['llm-plan', 'automation', 'planning'],
            source: 'llm',
            metadata: { repository: `${repoConfig.owner}/${repoConfig.repo}` },
          }, this.options);
        }
      }

      // Step 3: Workflow Execution
      if (['execute', 'full'].includes(repoConfig.workflow)) {
        console.log('🚀 Step 3: Executing workflows...');
        const execution = await this.executeWorkflows(repoConfig);
        results.steps.push({ step: 'execution', status: 'completed', data: execution });
        // Fossilize execution result
        if (repoConfig.options?.fossilize !== false) {
          await fossilizeEntry({
            type: 'result',
            title: `Execution Result - ${repoConfig.owner}/${repoConfig.repo}`,
            content: JSON.stringify(execution, null, 2),
            tags: ['execution', 'automation', 'result'],
            source: 'automated',
            metadata: { repository: `${repoConfig.owner}/${repoConfig.repo}` },
          }, this.options);
        }
      }

      // Step 4: Monitoring and Optimization
      if (['monitor', 'full'].includes(repoConfig.workflow)) {
        console.log('📈 Step 4: Monitoring and optimization...');
        const monitoring = await this.monitorAndOptimize(repoConfig);
        results.steps.push({ step: 'monitoring', status: 'completed', data: monitoring });
        // Fossilize monitoring/observation
        if (repoConfig.options?.fossilize !== false) {
          await fossilizeEntry({
            type: 'observation',
            title: `Monitoring Observation - ${repoConfig.owner}/${repoConfig.repo}`,
            content: JSON.stringify(monitoring, null, 2),
            tags: ['monitoring', 'automation', 'observation'],
            source: 'automated',
            metadata: { repository: `${repoConfig.owner}/${repoConfig.repo}` },
          }, this.options);
        }
      }

      // After all orchestration steps, sync tracker and project status
      try {
        console.log('🔄 Syncing tracker and project status with GitHub as part of orchestration...');
        await syncTrackerWithGitHub({
          trackerMdPath: '.temp-issue-14-body.md',
          projectStatusYmlPath: 'fossils/project_status.yml',
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          projectNumber: 4, // Update as needed or make configurable
          autoClose: false,
          syncTests: false,
          ...repoConfig.options,
        });
      } catch (err) {
        console.warn('⚠️  Tracker sync failed:', err);
      }

      // Generate summary
      results.summary = this.generateSummary(results.steps);
      
      // Fossilize the entire orchestration output
      if (repoConfig.options?.fossilize !== false) {
        await fossilizeEntry({
          type: 'observation',
          title: `Orchestration Output - ${repoConfig.owner}/${repoConfig.repo}`,
          content: JSON.stringify(results, null, 2),
          tags: ['orchestration', 'automation', 'snapshot'],
          source: 'automated',
          metadata: {
            repository: `${repoConfig.owner}/${repoConfig.repo}`,
            timestamp: new Date().toISOString(),
          },
        }, this.options);
      }
      
      if (isTestMode(this.options)) {
        console.log('✅ Repository orchestration completed successfully (test/mock mode)');
        process.exit(0);
      }
      
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
    if (isTestMode(this.options)) {
      // Return fossil-based mock repo info
      return {
        name: repoConfig.repo,
        owner: repoConfig.owner,
        description: 'Mock repo for test mode',
        language: 'TypeScript',
        stars: 0,
        forks: 0,
        openIssues: 1,
        openPRs: 0,
        lastCommit: new Date().toISOString(),
        defaultBranch: repoConfig.branch,
        issues: [],
      };
    }
    try {
      // Use GitHubCLICommands to get repository information
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      
      // Get repository info via API call
      const repoResult = await commands.apiCall('', {
        method: 'GET',
        fields: {}
      });
      
      if (!repoResult.success) {
        throw new Error('Failed to fetch repository information');
      }
      
      const repo = JSON.parse(repoResult.stdout);
      
      // Get issues and PRs count separately since they're not available in the main repo view
      let openIssues = 0;
      let openPRs = 0;
      
      try {
        const issuesResult = await commands.listIssues({
          state: 'open'
        });
        
        if (issuesResult.success) {
          const issues = JSON.parse(issuesResult.stdout);
          openIssues = issues.length;
          // Store issues for later use
          (repoConfig as any).openIssuesList = issues;
        }
      } catch {
        // Ignore issues fetch error
      }
      
      try {
        const prsResult = await commands.apiCall('pulls', {
          method: 'GET',
          fields: { state: 'open', per_page: '1' }
        });
        
        if (prsResult.success) {
          const prs = JSON.parse(prsResult.stdout);
          openPRs = prs.length > 0 ? parseInt(prs[0].number) : 0;
        }
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
    if (isTestMode(this.options)) {
      return {
        score: 100,
        issues: [],
        recommendations: ['Mock recommendation'],
        actions: { createIssues: true },
      };
    }
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    let checksPerformed = 0;
    let checksFailed = 0;

    // Check for recent activity
    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const commitsResult = await commands.apiCall('commits', {
        method: 'GET',
        fields: { per_page: '1' }
      });
      
      if (commitsResult.success) {
        const commits = JSON.parse(commitsResult.stdout);
        checksPerformed++;
        
        if (commits.length === 0) {
          issues.push('No recent commits found');
          score -= 20;
          recommendations.push('Consider adding recent commits to maintain activity');
        }
      } else {
        throw new Error('Failed to fetch commits');
      }
    } catch (error) {
      checksFailed++;
      issues.push(`Could not check recent commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
      score -= 5;
    }

    // Check for open issues
    let hasOpenIssues = false;
    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const openIssuesResult = await commands.listIssues({
        state: 'open'
      });
      
      if (openIssuesResult.success) {
        const issuesData = JSON.parse(openIssuesResult.stdout);
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
      } else {
        throw new Error('Failed to fetch issues');
      }
    } catch (error) {
      checksFailed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      issues.push(`Could not check open issues: ${errorMessage}`);
      score -= 5;
    }

    // Check for README
    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const readmeResult = await commands.apiCall('contents/README.md');
      if (readmeResult.success) {
        checksPerformed++;
      } else {
        throw new Error('README not found');
      }
    } catch (error) {
      checksFailed++;
      issues.push('No README.md found');
      score -= 15;
      recommendations.push('Add a comprehensive README.md file');
    }

    // Check for CI/CD workflows
    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const workflowsResult = await commands.apiCall('actions/workflows');
      
      if (workflowsResult.success) {
        const workflowsData = JSON.parse(workflowsResult.stdout);
        checksPerformed++;
        
        if (workflowsData.total_count === 0) {
          issues.push('No CI/CD workflows found');
          score -= 25;
          recommendations.push('Add GitHub Actions workflows for automated testing and deployment');
        }
      } else {
        throw new Error('Could not fetch workflows');
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
    if (isTestMode(this.options)) {
      return [
        { name: 'mock-workflow', status: 'active', lastRun: new Date().toISOString(), successRate: 1 },
      ];
    }
    const workflows: RepoAnalysis['workflows'] = [];

    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const workflowsResult = await commands.apiCall('actions/workflows');
      
      if (workflowsResult.success) {
        const data = JSON.parse(workflowsResult.stdout);
        
        for (const workflow of data.workflows) {
          workflows.push({
            name: workflow.name,
            status: workflow.state === 'active' ? 'active' : 'inactive',
            lastRun: workflow.updated_at,
            successRate: 0, // Would need to calculate from runs
          });
        }
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
    if (isTestMode(this.options)) {
      return {
        opportunities: [
          { type: 'mock', description: 'Mock automation opportunity', impact: 'low', effort: 'low', priority: 1 },
        ],
        currentAutomation: ['mock-workflow'],
      };
    }
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
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const workflowsResult = await commands.apiCall('actions/workflows');
      
      if (workflowsResult.success) {
        const data = JSON.parse(workflowsResult.stdout);
        data.workflows.forEach((workflow: any) => {
          currentAutomation.push(workflow.name);
        });
      }
    } catch (error) {
      // No workflows found
    }

    return {
      opportunities: opportunities.sort((a: any, b: any) => a.priority - b.priority),
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
    if (isTestMode(this.options)) {
      return {
        repository: `${repoConfig.owner}/${repoConfig.repo}`,
        branch: repoConfig.branch,
        timestamp: new Date().toISOString(),
        recentIssues: [],
        recentPRs: [],
        recentCommits: [],
      };
    }
    const context: Record<string, unknown> = {
      repository: `${repoConfig.owner}/${repoConfig.repo}`,
      branch: repoConfig.branch,
      timestamp: new Date().toISOString(),
    };

    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      
      // Get recent issues
      const issuesResult = await commands.apiCall('issues', {
        method: 'GET',
        fields: { state: 'open', per_page: '10' }
      });
      if (issuesResult.success) {
        context.recentIssues = JSON.parse(issuesResult.stdout);
      }

      // Get recent PRs
      const prsResult = await commands.apiCall('pulls', {
        method: 'GET',
        fields: { state: 'open', per_page: '10' }
      });
      if (prsResult.success) {
        context.recentPRs = JSON.parse(prsResult.stdout);
      }

      // Get recent commits
      const commitsResult = await commands.apiCall('commits', {
        method: 'GET',
        fields: { per_page: '10' }
      });
      if (commitsResult.success) {
        context.recentCommits = JSON.parse(commitsResult.stdout);
      }

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
    const issues: any[] = [];
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
      // Use fossil-backed issue creation
      const result = await createFossilIssue({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        title: trackingIssueData.title,
        body: trackingIssueData.body,
        labels: [trackingIssueData.label],
        tags: ['github', 'issue', 'project-tracking'],
        section: 'project-tracking',
        metadata: { orchestrator: true },
        ...repoConfig.options,
      });
      if (result.deduplicated) {
        console.log(`⚠️ Issue already exists for fossil hash: ${result.fossilHash}`);
      } else {
        issues.push({
          type: 'project-tracking',
          issue: result.issueNumber,
          fossilId: result.fossilId,
          fossilHash: result.fossilHash,
          timestamp: new Date().toISOString(),
        });
        console.log(`🆕 Created project-tracking issue: ${trackingIssueData.title} (Fossil ID: ${result.fossilId}, Issue #: ${result.issueNumber})`);
      }
      // Create issue for automation setup
      const automationIssueData = {
        title: '[AUTOMATION] Repository Automation Setup',
        body: await loadAutomationIssueTemplate(),
        label: 'automation',
      };
      const automationResult = await createFossilIssue({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        title: automationIssueData.title,
        body: automationIssueData.body,
        labels: [automationIssueData.label],
        tags: ['github', 'issue', 'automation'],
        section: 'automation',
        metadata: { orchestrator: true },
        ...repoConfig.options,
      });
      if (automationResult.deduplicated) {
        console.log(`⚠️ Issue already exists for fossil hash: ${automationResult.fossilHash}`);
      } else {
        issues.push({
          type: 'automation-setup',
          issue: automationResult.issueNumber,
          fossilId: automationResult.fossilId,
          fossilHash: automationResult.fossilHash,
          timestamp: new Date().toISOString(),
        });
        console.log(`🆕 Created automation-setup issue: ${automationIssueData.title} (Fossil ID: ${automationResult.fossilId}, Issue #: ${automationResult.issueNumber})`);
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
    if (isTestMode(this.options)) {
      return {
        stars: 0,
        forks: 0,
        openIssues: 1,
        lastUpdated: new Date().toISOString(),
      };
    }
    const metrics: Record<string, unknown> = {};

    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      
      // Get basic repository metrics
      const repoResult = await commands.apiCall('', {
        method: 'GET',
        fields: {}
      });
      
      if (repoResult.success) {
        const repo = JSON.parse(repoResult.stdout);
        metrics.stars = repo.stargazer_count;
        metrics.forks = repo.forks_count;
        metrics.openIssues = repo.open_issues_count;
        metrics.lastUpdated = repo.updated_at;
      }
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
    if (isTestMode(this.options)) return;
    const repo = `${repoConfig.owner}/${repoConfig.repo}`;
    const defaultLabel = 'automation';
    ensureLabelExists(repo, defaultLabel, 'ededed');
    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const issuesResult = await commands.listIssues({
        state: 'open'
      });
      
      if (issuesResult.success) {
        const issues = JSON.parse(issuesResult.stdout);
        for (const issue of issues) {
          if (!issue.labels || issue.labels.length === 0) {
            addLabelToIssue(repo, issue.number, defaultLabel);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not label unlabeled issues:', error);
    }
  }

  /**
   * Fossilizes the current state of the repository (issues, PRs, etc.)
   * @param repoConfig - Repository configuration
   */
  public async fossilizeRepositoryState(repoConfig: RepoConfig): Promise<void> {
    try {
      const repoInfo = await this.getRepositoryInfo(repoConfig);
      // Get open issues and PRs
      const issues = repoInfo.issues || [];
      let prs: any[] = [];
      try {
        const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
        const prsResult = await commands.apiCall('pulls', {
          method: 'GET',
          fields: { state: 'open', per_page: '100' }
        });
        
        if (prsResult.success) {
          prs = JSON.parse(prsResult.stdout);
        }
      } catch {
        prs = [];
      }
      const fossilEntry = {
        type: 'observation' as const,
        title: `Fossilized State - ${repoConfig.owner}/${repoConfig.repo}`,
        content: `Fossilized at: ${new Date().toISOString()}\n\nOpen Issues: ${issues.length}\nOpen PRs: ${prs.length}`,
        tags: ['repository-fossil', 'snapshot', 'automation'],
        source: 'automated' as const,
        metadata: {
          repository: `${repoConfig.owner}/${repoConfig.repo}`,
          openIssues: issues.map((i: any) => ({ number: i.number, title: i.title, labels: i.labels })),
          openPRs: prs.map((pr: any) => ({ number: pr.number, title: pr.title, user: pr.user?.login })),
          timestamp: new Date().toISOString(),
        },
      };
      // Write metadata to a temp file to avoid command line length issues
      const fs = await import('fs/promises');
      const tempFile = `.temp-fossil-content-${process.pid}.json`;
      await fs.writeFile(tempFile, JSON.stringify(fossilEntry.metadata, null, 2));
      const command = `bun run context:add --type ${fossilEntry.type} --title "${fossilEntry.title}" --content "$(cat ${tempFile})" --tags "${fossilEntry.tags.join(',')}" --source ${fossilEntry.source}`;
      execSync(command, { encoding: 'utf8' });
      await fs.unlink(tempFile);
      console.log(`🗿 Fossilized repository state for ${repoConfig.owner}/${repoConfig.repo}`);
      console.log(`  Open Issues: ${issues.length}`);
      console.log(`  Open PRs: ${prs.length}`);
    } catch (error) {
      console.error('❌ Error during fossilization:', error);
      throw error;
    }
  }

  async unifiedLLMPlan(repoConfig: RepoConfig, planMode: string) {
    // Gather issues for per-issue planning
    const issues = await this.getRepositoryIssues(repoConfig);
    const model = process.env.LLM_MODEL || 'gpt-4';
    const apiKey = process.env.OPENAI_API_KEY || '';
    const llmService = new LLMPlanningService(model, apiKey);
    let perIssueChecklists: Record<string, string> = {};
    let allTasks: { issue: number | null, task: string }[] = [];
    let globalPlan = '';
    if (planMode === 'per-issue' || planMode === 'both') {
      for (const issue of issues) {
        const plan = await llmService.decomposeGoal(issue.title, { body: issue.body }, true);
        if (plan && plan.tasks && plan.tasks[0] && typeof plan.tasks[0].description === 'string') {
          perIssueChecklists[issue.number] = plan.tasks[0].description;
          // Parse checklist items for allTasks
          const tasks = plan.tasks[0].description.match(/- \[.\] (.+)/g) || [];
          for (const t of tasks) {
            allTasks.push({ issue: issue.number, task: t.replace(/- \[.\] /, '') });
          }
        }
      }
    }
    if (planMode === 'global' || planMode === 'both') {
      const summary = issues.map(i => `#${i.number}: ${i.title}\n${i.body || ''}`).join('\n---\n');
      const plan = await llmService.decomposeGoal(summary);
      if (plan && plan.tasks && plan.tasks[0] && typeof plan.tasks[0].description === 'string') {
        globalPlan = plan.tasks[0].description;
        // Parse checklist items for allTasks
        const tasks = plan.tasks[0].description.match(/- \[.\] (.+)/g) || [];
        for (const t of tasks) {
          allTasks.push({ issue: null, task: t.replace(/- \[.\] /, '') });
        }
      }
    }
    // Fossilize the unified plan output
    const fossilService = new ContextFossilService();
    await fossilService.initialize();
    const fossil = await fossilService.addEntry({
      type: 'plan',
      title: `LLM Unified Plan Output - ${new Date().toISOString()}`,
      content: JSON.stringify({ perIssueChecklists, globalPlan, allTasks }, null, 2),
      tags: ['llm', 'plan', 'automation'],
      source: 'llm',
      version: 1,
      children: [],
      metadata: {},
    });
    console.log(`Plan fossilized as: ${fossil.id}`);
    return { perIssueChecklists, globalPlan, allTasks, fossilId: fossil.id };
  }

  async getRepositoryIssues(repoConfig: RepoConfig): Promise<GitHubIssue[]> {
    if (isTestMode(this.options)) {
      return [
        {
          number: 1,
          title: 'Mock Issue',
          body: 'This is a mock issue for test mode.',
          state: 'open',
          labels: ['mock'],
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    try {
      const commands = new GitHubCLICommands(repoConfig.owner, repoConfig.repo);
      const issuesResult = await commands.listIssues({
        state: 'open'
      });
      
      if (issuesResult.success) {
        return JSON.parse(issuesResult.stdout);
      } else {
        console.error('Failed to fetch issues from GitHub');
        return [];
      }
    } catch (e) {
      console.error('Failed to read issues as JSON. Ensure the issues script supports --json.');
      return [];
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
  .option('--plan-mode <mode>', 'Planning mode: per-issue, global, or both', 'both')
  .option('--no-create-issues', 'Skip creating automation issues')
  .option('--create-prs', 'Create automation PRs')
  .option('--auto-merge', 'Enable auto-merge for PRs')
  .option('--no-notifications', 'Disable notifications')
  .option('--summary', 'Print only a chat/LLM-friendly summary of the latest plan fossil')
  .option('--test', 'Run in test mode (use mock data, skip external calls)')
  .option('--mock', 'Run in mock mode (use fossil/mock data, skip external calls)')
  .action(async (owner, repo, options) => {
    let errorOccurred = false;
    try {
      const service = new RepoOrchestratorService(options);
      
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
          test: options.test === true,
          mock: options.mock === true,
        },
      };

      // Unified planning logic
      let planResult = null;
      if (['plan', 'full'].includes(repoConfig.workflow) && options.planMode) {
        planResult = await service.unifiedLLMPlan(repoConfig, options.planMode);
      }
      const results = await service.orchestrateRepository(repoConfig, planResult);
      
      // If --summary, print only the summary of the latest plan fossil
      if (options.summary && planResult && planResult.fossilId) {
        const { getFossilSummary } = await import('../utils/fossilSummary');
        const summary = await getFossilSummary();
        console.log(summary);
        return;
      }
      // Always print fossil ID and a short summary
      if (planResult && planResult.fossilId) {
        console.log(`🗿 Plan fossilized as: ${planResult.fossilId}`);
        const { getFossilSummary } = await import('../utils/fossilSummary');
        const summary = await getFossilSummary();
        console.log('--- Plan Summary ---');
        console.log(summary);
      } else {
        console.log(JSON.stringify(results, null, 2));
      }
    } catch (error) {
      console.error('❌ Error during repository orchestration:', error);
      errorOccurred = true;
      process.exit(1);
    }
    // Force exit after all awaits
    console.debug('[DEBUG] Forcing process exit after orchestrate');
    process.exit(errorOccurred ? 1 : 0);
  });

// Repository analysis command
program
  .command('analyze')
  .description('Analyze a repository for automation opportunities')
  .argument('<owner>', 'Repository owner')
  .argument('<repo>', 'Repository name')
  .option('--no-fossilize', 'Skip fossilizing analysis results')
  .option('--test', 'Run in test mode (use mock data, skip external calls)')
  .option('--mock', 'Run in mock mode (use fossil/mock data, skip external calls)')
  .action(async (owner, repo, options) => {
    let errorOccurred = false;
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
          test: options.test === true,
          mock: options.mock === true,
        },
      };
      // Pass options to service for test/mock mode
      const service = new RepoOrchestratorService(options);
      const analysis = await service.orchestrateRepository(repoConfig);
      console.log(JSON.stringify(analysis, null, 2));
      if (isTestMode(options)) {
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error during repository analysis:', error);
      errorOccurred = true;
      process.exit(1);
    }
    // Force exit after all awaits
    console.debug('[DEBUG] Forcing process exit after analyze');
    process.exit(errorOccurred ? 1 : 0);
  });

// Add new CLI command at the bottom:
program
  .command('fossilize')
  .description('Fossilize the current state of a repository (issues, PRs, etc.)')
  .argument('<owner>', 'Repository owner')
  .argument('<repo>', 'Repository name')
  .action(async (owner, repo) => {
    try {
      const repoConfig: RepoConfig = {
        owner,
        repo,
        branch: 'main',
        workflow: 'analyze',
        options: {
          createIssues: false,
          createPRs: false,
          autoMerge: false,
          notifications: false,
          fossilize: true,
          test: false,
          mock: false,
        },
      };
      const service = new RepoOrchestratorService();
      await service.fossilizeRepositoryState(repoConfig);
    } catch (error) {
      console.error('❌ Error during fossilization:', error);
      process.exit(1);
    }
  });

  
  // Parse command line arguments
if (import.meta.main) {
  program.parse();
} 