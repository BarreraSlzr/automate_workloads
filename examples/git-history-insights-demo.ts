#!/usr/bin/env bun
/**
 * Git History LLM Insights Demo
 * 
 * Demonstrates the git history LLM insights approach for tracking
 * roadmap progress and project analysis with fossil-backed storage.
 * 
 * Usage:
 *   bun run examples/git-history-insights-demo.ts
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { formatISO, subDays } from 'date-fns';

interface DemoResult {
  summary: string;
  insights: string[];
  completedTasks: string[];
  automationOpportunities: string[];
  fossils: string[];
}

class GitHistoryInsightsDemo {
  private fossilsDir = 'fossils/git_history_insights';

  /**
   * Run the demo
   */
  async run(): Promise<DemoResult> {
    console.log('🧠 Git History LLM Insights Demo');
    console.log('='.repeat(50));

    try {
      // 1. Analyze recent git history
      const commits = await this.getRecentCommits();
      console.log(`📊 Found ${commits.length} recent commits`);

      // 2. Extract insights from commits
      const insights = await this.extractInsights(commits);
      console.log(`💡 Generated ${insights.length} insights`);

      // 3. Track roadmap progress
      const roadmapProgress = await this.trackRoadmapProgress(commits, insights);
      console.log(`🗺️ Tracked progress for ${roadmapProgress.length} tasks`);

      // 4. Create fossils
      const fossils = await this.createFossils(insights, roadmapProgress);
      console.log(`🦴 Created ${fossils.length} fossils`);

      // 5. Generate summary
      const summary = this.generateSummary(commits, insights, roadmapProgress);

      // 6. Save demo results
      const result = {
        summary,
        insights: insights.map(i => i.summary),
        completedTasks: roadmapProgress.filter(t => t.status === 'done').map(t => t.taskTitle),
        automationOpportunities: insights.flatMap(i => i.automationOpportunities),
        fossils
      };

      this.saveDemoResults(result);
      console.log('✅ Demo completed successfully');

      return result;
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  /**
   * Get recent commits
   */
  private async getRecentCommits(): Promise<any[]> {
    const output = execSync('git log --pretty=format:"%H|%an|%ad|%s" --date=iso -n 10', { encoding: 'utf8' });
    const commits: any[] = [];

    for (const line of output.trim().split('\n')) {
      if (!line) continue;

      const [hash, author, date, message] = line.split('|');
      commits.push({
        hash,
        author,
        date,
        message,
        conventionalFormat: this.isConventionalCommit(message),
        type: this.extractCommitType(message),
        scope: this.extractCommitScope(message),
        description: this.extractCommitDescription(message)
      });
    }

    return commits;
  }

  /**
   * Extract insights from commits
   */
  private async extractInsights(commits: any[]): Promise<any[]> {
    const insights: any[] = [];

    for (const commit of commits) {
      const insight = {
        summary: `Commit ${commit.hash.substring(0, 8)}: ${commit.description}`,
        impact: this.calculateImpact(commit),
        category: this.categorizeCommit(commit),
        blockers: [],
        recommendations: this.generateRecommendations(commit),
        automationOpportunities: this.identifyAutomationOpportunities(commit),
        roadmapImpact: {
          affectedTasks: this.extractTaskReferences(commit),
          newTasks: [],
          completedTasks: this.extractCompletedTasks(commit)
        },
        done: commit.type === 'feat' ? {
          retrospective: `Successfully implemented: ${commit.description}`,
          insights: ['Feature completed successfully'],
          completedAt: commit.date,
          lessonsLearned: ['Consider adding tests for similar features']
        } : undefined
      };

      insights.push(insight);
    }

    return insights;
  }

  /**
   * Track roadmap progress
   */
  private async trackRoadmapProgress(commits: any[], insights: any[]): Promise<any[]> {
    const roadmapPath = 'fossils/roadmap.yml';
    
    if (!existsSync(roadmapPath)) {
      console.warn('⚠️ Roadmap not found, using demo tasks');
      return this.createDemoTasks(commits, insights);
    }

    try {
      // Simplified roadmap loading - in production, use proper YAML parser
      const roadmap = { tasks: [] };
      const progress: any[] = [];

      for (const task of roadmap.tasks || []) {
        const taskCommits = commits.filter(c => 
          c.message.toLowerCase().includes(task.task?.toLowerCase() || '')
        );

        if (taskCommits.length > 0) {
          progress.push({
            taskId: task.id || 'unknown',
            taskTitle: task.task || 'Unknown Task',
            status: task.status || 'in-progress',
            progress: {
              startDate: taskCommits[taskCommits.length - 1]?.date || '',
              lastUpdate: taskCommits[0]?.date || '',
              commits: taskCommits.map((c: any) => c.hash),
              velocity: taskCommits.length / 30 // Simplified calculation
            }
          });
        }
      }

      return progress;
    } catch (error) {
      console.warn('⚠️ Failed to load roadmap, using demo tasks');
      return this.createDemoTasks(commits, insights);
    }
  }

  /**
   * Create demo tasks for demonstration
   */
  private createDemoTasks(commits: any[], insights: any[]): any[] {
    const demoTasks = [
      {
        taskId: 'demo-1',
        taskTitle: 'Git History Analysis',
        status: 'done',
        progress: {
          startDate: commits[commits.length - 1]?.date || '',
          lastUpdate: commits[0]?.date || '',
          commits: commits.map((c: any) => c.hash),
          velocity: commits.length / 30
        }
      },
      {
        taskId: 'demo-2',
        taskTitle: 'LLM Insights Generation',
        status: 'in-progress',
        progress: {
          startDate: commits[commits.length - 1]?.date || '',
          lastUpdate: commits[0]?.date || '',
          commits: commits.slice(0, 5).map((c: any) => c.hash),
          velocity: 5 / 30
        }
      }
    ];

    return demoTasks;
  }

  /**
   * Create fossils
   */
  private async createFossils(insights: any[], roadmapProgress: any[]): Promise<string[]> {
    const fossils: string[] = [];

    // Create insights fossil
    const insightsFossil = {
      type: 'insight',
      timestamp: formatISO(new Date()),
      model: 'demo',
      provider: 'demo',
      excerpt: `Demo insights: ${insights.length} insights generated`,
      promptId: 'git-history-demo-v1',
      promptVersion: 'v1',
      prompt: 'Generate insights from git history for demo purposes',
      systemMessage: 'You are a demo system for git history analysis.',
      inputHash: `demo-${Date.now()}`,
      commitRef: 'HEAD',
      response: JSON.stringify(insights, null, 2)
    };

    const insightsPath = join(this.fossilsDir, `demo-insights-${Date.now()}.json`);
    writeFileSync(insightsPath, JSON.stringify(insightsFossil, null, 2));
    fossils.push(insightsPath);

    // Create roadmap progress fossil
    const progressFossil = {
      type: 'roadmap-progress',
      timestamp: formatISO(new Date()),
      model: 'demo',
      provider: 'demo',
      excerpt: `Demo roadmap progress: ${roadmapProgress.length} tasks tracked`,
      promptId: 'roadmap-progress-demo-v1',
      promptVersion: 'v1',
      prompt: 'Track roadmap progress for demo purposes',
      systemMessage: 'You are a demo system for roadmap progress tracking.',
      inputHash: `roadmap-demo-${Date.now()}`,
      commitRef: 'HEAD',
      response: JSON.stringify(roadmapProgress, null, 2)
    };

    const progressPath = join(this.fossilsDir, `demo-roadmap-progress-${Date.now()}.json`);
    writeFileSync(progressPath, JSON.stringify(progressFossil, null, 2));
    fossils.push(progressPath);

    return fossils;
  }

  /**
   * Generate summary
   */
  private generateSummary(commits: any[], insights: any[], roadmapProgress: any[]): string {
    const totalCommits = commits.length;
    const totalInsights = insights.length;
    const completedTasks = roadmapProgress.filter(t => t.status === 'done').length;
    const automationOpportunities = insights.flatMap(i => i.automationOpportunities).length;

    return `
Git History LLM Insights Demo Summary

📊 Analysis Results:
- Total Commits Analyzed: ${totalCommits}
- Total Insights Generated: ${totalInsights}
- Tasks Completed: ${completedTasks}
- Automation Opportunities Identified: ${automationOpportunities}

💡 Key Insights:
${insights.slice(0, 3).map(i => `- ${i.summary}`).join('\n')}

🗺️ Roadmap Progress:
${roadmapProgress.map(t => `- ${t.taskTitle}: ${t.status}`).join('\n')}

🤖 Automation Opportunities:
${insights.flatMap(i => i.automationOpportunities).slice(0, 3).map(opp => `- ${opp}`).join('\n')}

🦴 Fossils Created:
- Insights fossil with ${totalInsights} insights
- Roadmap progress fossil with ${roadmapProgress.length} tasks
    `.trim();
  }

  /**
   * Save demo results
   */
  private saveDemoResults(result: DemoResult): void {
    const demoPath = join(this.fossilsDir, `demo-results-${Date.now()}.json`);
    writeFileSync(demoPath, JSON.stringify(result, null, 2));
    console.log(`📄 Demo results saved to: ${demoPath}`);
  }

  // Utility methods
  private isConventionalCommit(message: string): boolean {
    return /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:/.test(message);
  }

  private extractCommitType(message: string): string | undefined {
    const match = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf)/);
    return match?.[1];
  }

  private extractCommitScope(message: string): string | undefined {
    const match = message.match(/^[^(]+\(([^)]+)\):/);
    return match?.[1];
  }

  private extractCommitDescription(message: string): string {
    const match = message.match(/^[^:]+:\s*(.+)$/);
    return match?.[1] || message;
  }

  private calculateImpact(commit: any): 'low' | 'medium' | 'high' {
    if (commit.type === 'feat') return 'high';
    if (commit.type === 'fix') return 'medium';
    return 'low';
  }

  private categorizeCommit(commit: any): string {
    return commit.type || 'general';
  }

  private generateRecommendations(commit: any): string[] {
    const recommendations: string[] = [];
    
    if (commit.type === 'feat') {
      recommendations.push('Add tests for the new feature');
      recommendations.push('Update documentation');
    } else if (commit.type === 'fix') {
      recommendations.push('Add regression tests');
      recommendations.push('Review similar code for potential issues');
    }

    return recommendations;
  }

  private identifyAutomationOpportunities(commit: any): string[] {
    const opportunities: string[] = [];
    
    if (commit.type === 'docs') {
      opportunities.push('Automate documentation generation');
    } else if (commit.type === 'test') {
      opportunities.push('Automate test execution');
    } else if (commit.type === 'chore') {
      opportunities.push('Automate build and deployment');
    }

    return opportunities;
  }

  private extractTaskReferences(commit: any): string[] {
    const issueRegex = /#(\d+)/g;
    const matches = commit.message.match(issueRegex);
    return matches ? matches.map((match: string) => match.slice(1)) : [];
  }

  private extractCompletedTasks(commit: any): string[] {
    if (commit.type === 'feat') {
      return [commit.description];
    }
    return [];
  }
}

// Main execution
async function main() {
  const demo = new GitHistoryInsightsDemo();
  const result = await demo.run();
  
  console.log('\n📋 Demo Results:');
  console.log(result.summary);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Run: bun run scripts/git-history-llm-insights.ts --summary');
  console.log('2. Run: bun run src/cli/git-history-insights.ts --insights --format table');
  console.log('3. Check fossils/git_history_insights/ for generated fossils');
  console.log('4. Review docs/GIT_HISTORY_LLM_INSIGHTS_APPROACH.md for detailed usage');
}

if (import.meta.main) {
  main().catch(console.error);
} 