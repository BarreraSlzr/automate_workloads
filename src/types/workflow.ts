/**
 * Workflow-related type definitions
 * @module types/workflow
 */

import { Status, Priority, Impact } from './core';

/**
 * E2E roadmap task
 */
export interface E2ERoadmapTask {
  task: string;
  status: Status;
  recommendation?: string;
  preference?: string;
  issues?: number[];
  owner?: string;
  context?: string;
  subtasks?: E2ERoadmapTask[];
  deadline?: string;
  milestone?: string;
}

/**
 * E2E roadmap
 */
export interface E2ERoadmap {
  type: 'e2e_automation_roadmap';
  source: string;
  createdBy: string;
  createdAt: string;
  tasks: E2ERoadmapTask[];
}

/**
 * Generic issue interface
 */
export interface Issue {
  number: number;
  title: string;
  body?: string;
}

/**
 * Generic task interface
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  estimatedEffort: string;
  priority: Priority;
  assignee?: string;
}

/**
 * Plan interface
 */
export interface Plan {
  tasks: Task[];
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{
      date: string;
      description: string;
      tasks: string[];
    }>;
  };
  risks: Array<{
    description: string;
    probability: Priority;
    impact: Impact;
    mitigation: string;
  }>;
}

/**
 * Per-issue plan output
 */
export interface PerIssuePlanOutput {
  perIssueChecklists: Record<string, string>;
  nextStepsPlan: string;
}

/**
 * Workflow step interface
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
 * Workflow execution context
 */
export interface WorkflowContext {
  /** Current step */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Execution status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  /** Step results */
  results: Record<string, unknown>;
  /** Error information */
  error?: string;
  /** Start time */
  startTime: string;
  /** End time */
  endTime?: string;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    delayMs: number;
  };
  /** Timeout configuration */
  timeout?: {
    stepTimeoutMs: number;
    totalTimeoutMs: number;
  };
  /** Validation rules */
  validation?: {
    requiredServices: string[];
    requiredPermissions: string[];
  };
} 