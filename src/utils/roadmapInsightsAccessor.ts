/**
 * Roadmap Insights Accessor Utility
 * 
 * Provides utilities to access LLM insights from the collection files
 * instead of directly from roadmap tasks. This enables scripts to work
 * with the separated insights structure.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { RoadmapTaskInsight } from '../types/roadmapInsights';
import { parseJsonSafe } from '@/utils/json';

const INSIGHTS_COLLECTION_PATH = 'fossils/roadmap_insights_collection.json';
const INSIGHTS_WEB_PATH = 'fossils/roadmap_insights_web.json';

/**
 * Generate a task ID for consistent referencing
 */
export function generateTaskId(params: { taskName: string; taskPath: string[] }): string {
  const { taskName, taskPath } = params;
  const fullPath = [...taskPath, taskName].join('-');
  return createHash('md5').update(fullPath).digest('hex').slice(0, 12);
}

/**
 * Load insights from the collection file
 */
export async function loadInsightsCollection(): Promise<{
  type: string;
  version: string;
  generatedAt: string;
  roadmapSource: string;
  insights: RoadmapTaskInsight[];
}> {
  try {
    const content = await fs.readFile(INSIGHTS_COLLECTION_PATH, 'utf-8');
    return parseJsonSafe(content, 'roadmapInsightsAccessor:content') as any;
  } catch (error) {
    console.warn(`Could not load insights collection from ${INSIGHTS_COLLECTION_PATH}:`, error);
    return {
      type: 'roadmap-insights',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      roadmapSource: 'fossils/roadmap.yml',
      insights: []
    };
  }
}

/**
 * Save insights to the collection file
 */
export async function saveInsightsCollection(collection: {
  type: string;
  version: string;
  generatedAt: string;
  roadmapSource: string;
  insights: RoadmapTaskInsight[];
}): Promise<void> {
  await fs.writeFile(INSIGHTS_COLLECTION_PATH, JSON.stringify(collection, null, 2), 'utf-8');
}

/**
 * Find insights for a specific task by task path
 */
export function findTaskInsights(params: { insights: RoadmapTaskInsight[]; taskPath: string[] }): RoadmapTaskInsight | null {
  const { insights, taskPath } = params;
  if (taskPath.length === 0) return null;
  const taskName = taskPath[taskPath.length - 1];
  if (!taskName) return null;
  const taskId = generateTaskId({ taskName, taskPath: taskPath.slice(0, -1) });
  
  return insights.find(insight => insight.taskId === taskId) || null;
}

/**
 * Find insights for a task by title (fallback method)
 */
export function findTaskInsightsByTitle(params: { insights: RoadmapTaskInsight[]; taskTitle: string }): RoadmapTaskInsight | null {
  const { insights, taskTitle } = params;
  return insights.find(insight => insight.taskTitle === taskTitle) || null;
}

/**
 * Get insights for a task, with fallback to title matching
 */
export function getTaskInsights(params: { insights: RoadmapTaskInsight[]; taskPath: string[]; taskTitle: string }): RoadmapTaskInsight | null {
  const { insights, taskPath, taskTitle } = params;
  // Try path-based matching first
  const pathMatch = findTaskInsights({ insights, taskPath });
  if (pathMatch) return pathMatch;
  
  // Fallback to title matching
  return findTaskInsightsByTitle({ insights, taskTitle });
}

/**
 * Get insights for all tasks with a specific status
 */
export function getInsightsByStatus(params: { insights: RoadmapTaskInsight[]; status: string }): RoadmapTaskInsight[] {
  const { insights, status } = params;
  return insights.filter(insight => insight.status === status);
}

/**
 * Get insights for all tasks with a specific tag
 */
export function getInsightsByTag(params: { insights: RoadmapTaskInsight[]; tag: string }): RoadmapTaskInsight[] {
  const { insights, tag } = params;
  return insights.filter(insight => 
    insight.tags && insight.tags.includes(tag)
  );
}

/**
 * Get insights for all tasks by a specific owner
 */
export function getInsightsByOwner(params: { insights: RoadmapTaskInsight[]; owner: string }): RoadmapTaskInsight[] {
  const { insights, owner } = params;
  return insights.filter(insight => insight.owner === owner);
}

/**
 * Get insights for all tasks in a specific milestone
 */
export function getInsightsByMilestone(params: { insights: RoadmapTaskInsight[]; milestone: string }): RoadmapTaskInsight[] {
  const { insights, milestone } = params;
  return insights.filter(insight => insight.milestone === milestone);
}

/**
 * Get insights with high impact
 */
export function getHighImpactInsights(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => 
    insight.llmInsights.impact && 
    insight.llmInsights.impact.toLowerCase().includes('high')
  );
}

/**
 * Get insights with blockers
 */
export function getInsightsWithBlockers(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => 
    insight.llmInsights.blockers && 
    insight.llmInsights.blockers !== 'Task not yet started - no current blockers.' &&
    insight.llmInsights.blockers !== 'None - task completed successfully.'
  );
}

/**
 * Get insights for completed tasks
 */
export function getCompletedTaskInsights(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => insight.status === 'done');
}

/**
 * Get insights for in-progress tasks
 */
export function getInProgressTaskInsights(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => insight.status === 'in progress');
}

/**
 * Get insights for planned tasks
 */
export function getPlannedTaskInsights(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => insight.status === 'planned');
}

/**
 * Get insights for pending tasks
 */
export function getPendingTaskInsights(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => insight.status === 'pending');
}

/**
 * Get insights with deadlines
 */
export function getInsightsWithDeadlines(insights: RoadmapTaskInsight[]): RoadmapTaskInsight[] {
  return insights.filter(insight => insight.llmInsights.deadline);
}

/**
 * Get insights by category (based on impact and summary analysis)
 */
export function getInsightsByCategory(params: { insights: RoadmapTaskInsight[]; category: string }): RoadmapTaskInsight[] {
  const { insights, category } = params;
  return insights.filter(insight => {
    const summary = insight.llmInsights.summary.toLowerCase();
    const impact = insight.llmInsights.impact.toLowerCase();
    
    switch (category.toLowerCase()) {
      case 'implementation':
        return summary.includes('implementation') || summary.includes('code');
      case 'testing':
        return summary.includes('testing') || summary.includes('test');
      case 'documentation':
        return summary.includes('documentation') || summary.includes('docs');
      case 'automation':
        return summary.includes('automation') || summary.includes('workflow');
      case 'llm-integration':
        return summary.includes('llm') || summary.includes('ai');
      case 'fossilization':
        return summary.includes('fossil') || summary.includes('curation');
      case 'future-scopes':
        return summary.includes('future') || summary.includes('planned');
      case 'ux-developer-tools':
        return summary.includes('ux') || summary.includes('developer') || summary.includes('tools');
      default:
        return false;
    }
  });
}

/**
 * Get a summary of insights for reporting
 */
export function getInsightsSummary(insights: RoadmapTaskInsight[]): {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  pending: number;
  highImpact: number;
  withBlockers: number;
  withDeadlines: number;
} {
  return {
    total: insights.length,
    completed: getCompletedTaskInsights(insights).length,
    inProgress: getInProgressTaskInsights(insights).length,
    planned: getPlannedTaskInsights(insights).length,
    pending: getPendingTaskInsights(insights).length,
    highImpact: getHighImpactInsights(insights).length,
    withBlockers: getInsightsWithBlockers(insights).length,
    withDeadlines: getInsightsWithDeadlines(insights).length,
  };
} 