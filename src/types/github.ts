/**
 * GitHub-related type definitions
 * @module types/github
 */

import { BaseFossil, Status } from './core';

/**
 * GitHub issue information
 */
export interface GitHubIssue {
  id?: number;
  number: number;
  title: string;
  state: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: string;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  [key: string]: any;
}

/**
 * GitHub issue fossil
 */
export interface GitHubIssueFossil extends BaseFossil {
  type: 'github_issue_fossil';
  issueNumber?: number;
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
  milestone?: string;
  state: 'open' | 'closed';
}

/**
 * GitHub milestone fossil
 */
export interface GitHubMilestoneFossil extends BaseFossil {
  type: 'github_milestone_fossil';
  title: string;
  description: string;
  state: 'open' | 'closed';
  dueOn?: string;
}

/**
 * GitHub label fossil
 */
export interface GitHubLabelFossil extends BaseFossil {
  type: 'github_label_fossil';
  name: string;
  description: string;
  color: string;
}

/**
 * GitHub pull request fossil
 */
export interface GitHubPRFossil extends BaseFossil {
  type: 'github_pr_fossil';
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  state: 'open' | 'closed' | 'merged';
}

/**
 * GitHub fossil collection
 */
export interface GitHubFossilCollection extends BaseFossil {
  type: 'github_fossil_collection';
  fossils: {
    issues?: GitHubIssueFossil[];
    milestones?: GitHubMilestoneFossil[];
    labels?: GitHubLabelFossil[];
    prs?: GitHubPRFossil[];
    documentation?: ProjectDocumentationFossil[];
  };
}

/**
 * Project documentation fossil
 */
export interface ProjectDocumentationFossil extends BaseFossil {
  type: 'project_documentation_fossil';
  title: string;
  content: string;
  category: 'guide' | 'api' | 'workflow' | 'roadmap' | 'checklist';
}

/**
 * GitHub options for operations
 */
export interface GitHubOptions {
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Issue state filter */
  state?: 'open' | 'closed' | 'all';
  /** Issue labels filter */
  labels?: string[];
  /** Issue assignee filter */
  assignee?: string;
  /** Issue milestone */
  milestone?: string;
  /** Issue section */
  section?: string;
  /** Issue checklist */
  checklist?: string;
  /** Issue metadata */
  metadata?: Record<string, unknown>;
}

/**
 * GitHub automation template fields
 */
export interface AutomationTemplateFields {
  purpose: string;
  checklist?: string;
  metadata?: string;
}

/**
 * GitHub workflow step
 */
export interface WorkflowStep {
  /** Step name */
  name: string;
  /** Step description */
  description: string;
  /** Service to use */
  service: 'github' | 'twitter' | 'gmail' | 'buffer' | 'obsidian';
  /** Action to perform */
  action: string;
  /** Step parameters */
  parameters: Record<string, unknown>;
  /** Whether step is required */
  required: boolean;
}

/**
 * GitHub performance metrics
 */
export interface GitHubPerformanceMetrics {
  /** GitHub metrics */
  github?: {
    issuesCreated: number;
    issuesClosed: number;
    pullRequestsMerged: number;
  };
  /** Twitter metrics */
  twitter?: {
    tweetsPosted: number;
    mentionsReceived: number;
    engagementRate: number;
  };
  /** Gmail metrics */
  gmail?: {
    emailsSent: number;
    emailsReceived: number;
    responseRate: number;
  };
  /** Buffer metrics */
  buffer?: {
    postsScheduled: number;
    postsPublished: number;
    engagementRate: number;
  };
} 