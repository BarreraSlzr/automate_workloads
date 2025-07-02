/**
 * CLI-related type definitions and schemas
 * @module types/cli
 */

import { z } from 'zod';
import { CLIOptions } from './core';

// Base CLI arguments schema
export const BaseCLIArgsSchema = z.object({
  dryRun: z.boolean().default(false),
  test: z.boolean().default(false),
  verbose: z.boolean().default(false),
  help: z.boolean().default(false),
});

// GitHub-specific CLI arguments schema
export const GitHubCLIArgsSchema = BaseCLIArgsSchema.extend({
  owner: z.string().default('barreraslzr'),
  repo: z.string().default('automate_workloads'),
  token: z.string().optional(),
  branch: z.string().optional(),
});

// Fossil management CLI arguments schema
export const FossilCLIArgsSchema = BaseCLIArgsSchema.extend({
  inputPath: z.string(),
  outputPath: z.string().optional(),
  format: z.enum(['yaml', 'json', 'markdown']).default('yaml'),
  validate: z.boolean().default(true),
});

// Roadmap CLI arguments schema
export const RoadmapCLIArgsSchema = GitHubCLIArgsSchema.extend({
  roadmapPath: z.string().default('src/types/e2e-roadmap.yaml'),
  createIssues: z.boolean().default(true),
  createMilestones: z.boolean().default(true),
  createLabels: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
});

// GitHub CLI Issue Creation Schema
export const GitHubIssueCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional(),
  bodyFile: z.string().optional(),
  labels: z.array(z.string()).default([]),
  assignees: z.array(z.string()).default([]),
  milestone: z.string().optional(),
  project: z.string().optional(),
  template: z.string().optional(),
  web: z.boolean().default(false),
  editor: z.boolean().default(false),
});

// GitHub CLI API Schema for Milestones
export const GitHubMilestoneCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueOn: z.string().optional(), // ISO 8601 date string
  state: z.enum(['open', 'closed']).default('open'),
});

// GitHub CLI API Schema for Labels
export const GitHubLabelCreateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/), // 6-digit hex color
});

// GitHub CLI Issue View Schema
export const GitHubIssueViewSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
  json: z.boolean().default(true),
  fields: z.array(z.string()).optional(),
});

// GitHub CLI Issue List Schema
export const GitHubIssueListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(['open', 'closed', 'all']).default('open'),
  labels: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  milestone: z.string().optional(),
  limit: z.number().min(1).max(100).default(30),
  json: z.boolean().default(true),
});

// GitHub CLI Label List Schema
export const GitHubLabelListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  json: z.boolean().default(true),
});

// GitHub CLI Milestone List Schema
export const GitHubMilestoneListSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(['open', 'closed', 'all']).default('open'),
  json: z.boolean().default(true),
});

// GitHub CLI Issue Edit Schema
export const GitHubIssueEditSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issueNumber: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  bodyFile: z.string().optional(),
  addLabels: z.array(z.string()).optional(),
  removeLabels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
});

// GitHub CLI Project Schema
export const GitHubProjectSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  projectNumber: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
});

// GitHub CLI Authentication Schema
export const GitHubAuthSchema = z.object({
  token: z.string().optional(),
  status: z.boolean().default(false),
  login: z.boolean().default(false),
});

// Type exports for CLI arguments
export type BaseCLIArgs = z.infer<typeof BaseCLIArgsSchema>;
export type GitHubCLIArgs = z.infer<typeof GitHubCLIArgsSchema>;
export type FossilCLIArgs = z.infer<typeof FossilCLIArgsSchema>;
export type RoadmapCLIArgs = z.infer<typeof RoadmapCLIArgsSchema>;

// Type exports for GitHub CLI operations
export type GitHubIssueCreate = z.infer<typeof GitHubIssueCreateSchema>;
export type GitHubMilestoneCreate = z.infer<typeof GitHubMilestoneCreateSchema>;
export type GitHubLabelCreate = z.infer<typeof GitHubLabelCreateSchema>;
export type GitHubIssueView = z.infer<typeof GitHubIssueViewSchema>;
export type GitHubIssueList = z.infer<typeof GitHubIssueListSchema>;
export type GitHubLabelList = z.infer<typeof GitHubLabelListSchema>;
export type GitHubMilestoneList = z.infer<typeof GitHubMilestoneListSchema>;
export type GitHubIssueEdit = z.infer<typeof GitHubIssueEditSchema>;
export type GitHubProject = z.infer<typeof GitHubProjectSchema>;
export type GitHubAuth = z.infer<typeof GitHubAuthSchema>;

// CLI command result interface
export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  message?: string;
}

// CLI parameter interfaces
export interface IssueParams {
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  assignees?: string[];
}

export interface LabelParams {
  name: string;
  description: string;
  color: string;
}

export interface MilestoneParams {
  title: string;
  description: string;
  dueOn?: string;
}

// Utility function to parse CLI arguments
export function parseCLIArgs<T extends z.ZodSchema>(
  schema: T,
  args: string[]
): z.infer<T> {
  const parsed: Record<string, unknown> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!arg) continue;
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        parsed[key] = nextArg;
        i++; // Skip next arg since we used it
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      parsed[key] = true;
    }
  }
  
  return schema.parse(parsed);
} 