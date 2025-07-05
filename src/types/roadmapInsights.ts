/**
 * Roadmap LLM Insights Types
 * 
 * Separates LLM insights from the main roadmap while maintaining traceability.
 * This enables cleaner roadmap files and better human-readable web outputs.
 */

import { z } from './schemas';

/**
 * Roadmap Task Insight Fossil
 * Stores LLM insights for individual roadmap tasks
 */
export interface RoadmapTaskInsight {
  taskId: string; // Unique identifier for the task
  taskTitle: string; // Human-readable task title for easy linking
  taskPath: string[]; // Path to task in roadmap hierarchy (e.g., ["task1", "subtask1"])
  status: string;
  milestone?: string;
  owner?: string;
  tags?: string[];
  
  // LLM-generated insights
  llmInsights: {
    summary: string;
    blockers: string;
    recommendations: string;
    impact: string;
    deadline?: string;
    done?: {
      retrospective: string;
      insights: string;
      completedAt: string;
    };
  };
  
  // Metadata for traceability
  metadata: {
    generatedAt: string;
    model: string;
    provider: string;
    fossilId: string;
    roadmapVersion: string;
  };
}

/**
 * Roadmap Insights Collection
 * Container for all task insights with metadata
 */
export interface RoadmapInsightsCollection {
  type: 'roadmap-insights';
  version: string;
  generatedAt: string;
  roadmapSource: string;
  insights: RoadmapTaskInsight[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    insightsGenerated: number;
    milestones: string[];
    owners: string[];
    tags: string[];
  };
  metadata: {
    generator: string;
    model: string;
    provider: string;
    fossilIds: string[];
  };
}

/**
 * Web Publication Format
 * Human-readable format for web display
 */
export interface RoadmapInsightsWebPublication {
  type: 'roadmap-insights-web';
  version: string;
  generatedAt: string;
  title: string;
  description: string;
  sections: {
    overview: {
      summary: string;
      keyMetrics: Record<string, any>;
      recentUpdates: string[];
    };
    insights: {
      completed: RoadmapTaskInsight[];
      inProgress: RoadmapTaskInsight[];
      planned: RoadmapTaskInsight[];
    };
    recommendations: {
      priority: string[];
      blockers: string[];
      opportunities: string[];
    };
  };
  metadata: {
    lastUpdated: string;
    roadmapVersion: string;
    insightsCount: number;
  };
}

// Zod schemas for validation
export const RoadmapTaskInsightSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  taskPath: z.array(z.string()),
  status: z.string(),
  milestone: z.string().optional(),
  owner: z.string().optional(),
  tags: z.array(z.string()).optional(),
  llmInsights: z.object({
    summary: z.string(),
    blockers: z.string(),
    recommendations: z.string(),
    impact: z.string(),
              deadline: z.union([z.string(), z.date()]).optional(),
    done: z.object({
      retrospective: z.string(),
      insights: z.string(),
      completedAt: z.string(),
    }).optional(),
  }),
  metadata: z.object({
    generatedAt: z.string(),
    model: z.string(),
    provider: z.string(),
    fossilId: z.string(),
    roadmapVersion: z.string(),
  }),
});

export const RoadmapInsightsCollectionSchema = z.object({
  type: z.literal('roadmap-insights'),
  version: z.string(),
  generatedAt: z.string(),
  roadmapSource: z.string(),
  insights: z.array(RoadmapTaskInsightSchema),
  summary: z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    pendingTasks: z.number(),
    insightsGenerated: z.number(),
    milestones: z.array(z.string()),
    owners: z.array(z.string()),
    tags: z.array(z.string()),
  }),
  metadata: z.object({
    generator: z.string(),
    model: z.string(),
    provider: z.string(),
    fossilIds: z.array(z.string()),
  }),
});

export const RoadmapInsightsWebPublicationSchema = z.object({
  type: z.literal('roadmap-insights-web'),
  version: z.string(),
  generatedAt: z.string(),
  title: z.string(),
  description: z.string(),
  sections: z.object({
    overview: z.object({
      summary: z.string(),
      keyMetrics: z.record(z.any()),
      recentUpdates: z.array(z.string()),
    }),
    insights: z.object({
      completed: z.array(RoadmapTaskInsightSchema),
      inProgress: z.array(RoadmapTaskInsightSchema),
      planned: z.array(RoadmapTaskInsightSchema),
    }),
    recommendations: z.object({
      priority: z.array(z.string()),
      blockers: z.array(z.string()),
      opportunities: z.array(z.string()),
    }),
  }),
  metadata: z.object({
    lastUpdated: z.string(),
    roadmapVersion: z.string(),
    insightsCount: z.number(),
  }),
});

// Types are inferred from schemas above 