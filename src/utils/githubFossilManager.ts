import { E2ERoadmap, E2ERoadmapTask } from '../types';
import type { 
  GitHubIssueFossil, 
  GitHubMilestoneFossil, 
  GitHubLabelFossil,
  GitHubFossilCollection 
} from '@/types';
import { GitHubService } from '../services/github';
import { ContextFossilService } from '../cli/context-fossil';

export class GitHubFossilManager {
  private owner: string;
  private repo: string;
  private githubService: GitHubService;

  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
    this.githubService = new GitHubService(owner, repo);
  }

  /**
   * Create GitHub issues from roadmap tasks
   */
  async createIssuesFromRoadmap(roadmap: E2ERoadmap): Promise<GitHubIssueFossil[]> {
    const fossils: GitHubIssueFossil[] = [];

    for (const task of roadmap.tasks) {
      if (task.issues && task.issues.length > 0) {
        // Skip if issues already exist
        continue;
      }

      const issueBody = this.generateIssueBody(task, roadmap);
      const labels = this.generateLabels(task);
      const assignees = task.owner ? [task.owner] : [];

      try {
        // Use the existing fossil-backed issue creation utility
        const { createFossilIssue } = await import('./fossilIssue');
        const result = await createFossilIssue({
          body: issueBody,
          title: task.task,
          section: 'roadmap',
          type: 'action',
          tags: ['roadmap', 'automation'],
          metadata: {
            roadmapTask: task,
            roadmapSource: roadmap.source
          },
          parsedFields: {}
        });

        if (!result.deduplicated && result.issueNumber) {
          fossils.push({
            type: 'github_issue_fossil',
            source: 'roadmap-automation',
            createdBy: roadmap.createdBy,
            createdAt: new Date().toISOString(),
            issueNumber: parseInt(result.issueNumber),
            title: task.task,
            body: issueBody,
            labels,
            assignees,
            milestone: task.milestone,
            state: 'open',
            metadata: {
              roadmapTask: task,
              roadmapSource: roadmap.source,
              fossilId: result.fossilId,
              fossilHash: result.fossilHash
            }
          });
        }
      } catch (error) {
        console.error(`Failed to create issue for task: ${task.task}`, error);
      }
    }

    return fossils;
  }

  /**
   * Create GitHub milestones from roadmap tasks
   */
  async createMilestonesFromRoadmap(roadmap: E2ERoadmap): Promise<GitHubMilestoneFossil[]> {
    const fossils: GitHubMilestoneFossil[] = [];
    const milestones = new Set<string>();

    // Collect unique milestones
    for (const task of roadmap.tasks) {
      if (task.milestone) {
        milestones.add(task.milestone);
      }
    }

    for (const milestoneTitle of milestones) {
      try {
        // Use fossil-backed milestone creation
        const { createFossilMilestone } = await import('./fossilMilestone');
        const result = await createFossilMilestone({
          fossilService: new ContextFossilService(),
          type: 'action',
          title: milestoneTitle,
          body: `Milestone for ${milestoneTitle}`,
          section: this.getMilestoneDueDate(roadmap, milestoneTitle) || 'general',
          tags: ['roadmap', 'automation'],
          metadata: { roadmapSource: roadmap.source },
          parsedFields: {}
        });

        if (!result.deduplicated && result.milestoneNumber) {
          fossils.push({
            type: 'github_milestone_fossil',
            source: 'roadmap-automation',
            createdBy: roadmap.createdBy,
            createdAt: new Date().toISOString(),
            title: milestoneTitle,
            description: `Milestone for ${milestoneTitle}`,
            state: 'open',
            dueOn: this.getMilestoneDueDate(roadmap, milestoneTitle),
            metadata: {
              roadmapSource: roadmap.source,
              fossilId: result.fossilId,
              fossilHash: result.fossilHash
            }
          });
        }
      } catch (error) {
        console.error(`Failed to create milestone: ${milestoneTitle}`, error);
      }
    }

    return fossils;
  }

  /**
   * Create GitHub labels for roadmap automation
   */
  async createLabelsForRoadmap(): Promise<GitHubLabelFossil[]> {
    const fossils: GitHubLabelFossil[] = [];
    const labels = [
      { name: 'roadmap', description: 'Roadmap related', color: '0366d6' },
      { name: 'automation', description: 'Automation related', color: 'd73a4a' },
      { name: 'e2e', description: 'End-to-end testing', color: '28a745' },
      { name: 'fossil', description: 'Fossil management', color: '6f42c1' },
      { name: 'status:pending', description: 'Pending status', color: 'fef2c0' },
      { name: 'status:done', description: 'Completed status', color: '0e8a16' }
    ];

    for (const label of labels) {
      try {
        // Use fossil-backed label creation
        const { createFossilLabel } = await import('./fossilLabel');
        const result = await createFossilLabel({
          fossilService: new ContextFossilService(),
          type: 'action',
          title: label.name,
          body: label.description,
          section: 'labels',
          tags: ['roadmap', 'automation'],
          metadata: { roadmapAutomation: true, color: label.color },
          parsedFields: {}
        });

        if (!result.deduplicated) {
          fossils.push({
            type: 'github_label_fossil',
            source: 'roadmap-automation',
            createdBy: 'automation',
            createdAt: new Date().toISOString(),
            name: label.name,
            description: label.description,
            color: label.color,
            metadata: {
              roadmapAutomation: true,
              fossilId: result.fossilId,
              fossilHash: result.fossilHash
            }
          });
        }
      } catch (error) {
        console.error(`Failed to create label: ${label.name}`, error);
      }
    }

    return fossils;
  }

  /**
   * Generate issue body from roadmap task
   */
  private generateIssueBody(task: E2ERoadmapTask, roadmap: E2ERoadmap): string {
    let body = `## Task: ${task.task}\n\n`;
    
    if (task.context) {
      body += `**Context:** ${task.context}\n\n`;
    }
    
    if (task.subtasks && task.subtasks.length > 0) {
      body += `## Subtasks\n`;
      for (const subtask of task.subtasks) {
        const status = subtask.status === 'done' ? 'x' : ' ';
        body += `- [${status}] ${subtask.task}\n`;
        if (subtask.context) {
          body += `  - ${subtask.context}\n`;
        }
      }
      body += '\n';
    }

    body += `**Status:** ${task.status}\n`;
    if (task.deadline) {
      body += `**Deadline:** ${task.deadline}\n`;
    }
    if (task.owner) {
      body += `**Owner:** @${task.owner}\n`;
    }

    body += `\n---\n*Generated from roadmap fossil: ${roadmap.source}*`;
    
    return body;
  }

  /**
   * Generate labels for a task
   */
  private generateLabels(task: E2ERoadmapTask): string[] {
    const labels = ['roadmap'];
    
    if (task.status === 'pending') {
      labels.push('status:pending');
    } else if (task.status === 'done') {
      labels.push('status:done');
    }
    
    if (task.owner) {
      labels.push(`owner:${task.owner}`);
    }
    
    return labels;
  }

  /**
   * Get milestone due date from roadmap tasks
   */
  private getMilestoneDueDate(roadmap: E2ERoadmap, milestoneTitle: string): string | undefined {
    const tasks = roadmap.tasks.filter(task => task.milestone === milestoneTitle);
    const deadlines = tasks
      .map(task => task.deadline)
      .filter(Boolean)
      .sort();
    
    return deadlines.length > 0 ? deadlines[0] : undefined;
  }

  /**
   * Create a fossil collection from all generated fossils
   */
  createFossilCollection(
    issues: GitHubIssueFossil[],
    milestones: GitHubMilestoneFossil[],
    labels: GitHubLabelFossil[]
  ): GitHubFossilCollection {
    return {
      type: 'github_fossil_collection',
      source: 'roadmap-automation',
      createdBy: 'automation',
      createdAt: new Date().toISOString(),
      fossils: {
        issues,
        milestones,
        labels
      },
      metadata: {
        owner: this.owner,
        repo: this.repo,
        automationType: 'roadmap-sync'
      }
    };
  }
} 