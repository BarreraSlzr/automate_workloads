#!/usr/bin/env bun

/**
 * Generate Fresh LLM Insights Script (Simplified)
 * 
 * Generates fresh LLM insights from the current roadmap.yml and saves them
 * to the collection files. This version uses simple rule-based insights
 * instead of complex LLM calls.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { createHash } from 'crypto';
import type { RoadmapTaskInsight } from '../src/types/roadmapInsights';

const ROADMAP_YML = 'fossils/roadmap.yml';
const INSIGHTS_COLLECTION_PATH = 'fossils/roadmap_insights_collection.json';
const INSIGHTS_WEB_PATH = 'fossils/roadmap_insights_web.json';

/**
 * Generate task ID for consistent referencing
 */
function generateTaskId(taskName: string, taskPath: string[]): string {
  const fullPath = [...taskPath, taskName].join('-');
  return createHash('md5').update(fullPath).digest('hex').slice(0, 12);
}

/**
 * Walk through all tasks and subtasks recursively
 */
function walkTasks(tasks: any[], parentPath: string[] = []): Array<{ task: any; path: string[] }> {
  const result: Array<{ task: any; path: string[] }> = [];
  
  for (const task of tasks) {
    const currentPath = [...parentPath, task.task];
    result.push({ task, path: currentPath });
    
    if (Array.isArray(task.subtasks)) {
      result.push(...walkTasks(task.subtasks, currentPath));
    }
  }
  
  return result;
}

/**
 * Generate simple insight for a single task based on rules
 */
function generateSimpleInsight(
  task: any, 
  taskPath: string[]
): RoadmapTaskInsight {
  const taskId = generateTaskId(task.task, taskPath);
  
  // Determine category based on tags and task name
  const category = determineCategory(task);
  
  // Determine impact based on status and context
  const impact = determineImpact(task);
  
  // Generate summary based on task status and context
  const summary = generateSummary(task);
  
  // Generate blockers based on status
  const blockers = generateBlockers(task);
  
  // Generate recommendations based on status and context
  const recommendations = generateRecommendations(task);
  
  // Add done retrospective for completed tasks
  let done = undefined;
  if (task.status === 'done') {
    done = {
      retrospective: 'Task completed successfully. Review for lessons learned and optimization opportunities.',
      insights: 'Consider documenting patterns and utilities for reuse in similar future tasks.',
      completedAt: formatISO(new Date())
    };
  }

  // Create roadmap task insight
  const roadmapInsight: RoadmapTaskInsight = {
    taskId,
    taskTitle: task.task,
    taskPath,
    status: task.status || 'unknown',
    milestone: task.milestone,
    owner: task.owner,
    tags: task.tags || [],
    llmInsights: {
      summary,
      blockers,
      recommendations,
      impact,
      deadline: task.deadline,
      done
    },
    metadata: {
      generatedAt: formatISO(new Date()),
      model: 'rule-based',
      provider: 'local',
      fossilId: `rule-${taskId}`,
      roadmapVersion: '1.0.0'
    }
  };

  return roadmapInsight;
}

/**
 * Determine task category based on tags and task name
 */
function determineCategory(task: any): string {
  const tags = task.tags || [];
  const taskName = task.task.toLowerCase();
  
  if (tags.includes('testing') || taskName.includes('test')) return 'testing';
  if (tags.includes('documentation') || taskName.includes('document')) return 'documentation';
  if (tags.includes('automation') || taskName.includes('automate')) return 'automation';
  if (tags.includes('llm') || taskName.includes('llm')) return 'llm-integration';
  if (tags.includes('fossil') || taskName.includes('fossil')) return 'fossilization';
  if (tags.includes('setup') || taskName.includes('setup')) return 'implementation';
  if (tags.includes('future') || taskName.includes('future')) return 'future-scopes';
  if (tags.includes('ux') || taskName.includes('ux') || taskName.includes('ui')) return 'ux-developer-tools';
  
  return 'implementation';
}

/**
 * Determine impact based on task status and context
 */
function determineImpact(task: any): string {
  const status = task.status || 'unknown';
  const context = task.context || '';
  const tags = task.tags || [];
  
  if (status === 'done') return 'Positive - task objectives achieved and deliverables completed.';
  if (status === 'in progress') return 'Medium - task is actively being worked on.';
  if (status === 'planned') return 'Pending - task is planned but not yet started.';
  if (status === 'pending') return 'Pending - task is waiting for dependencies or resources.';
  
  if (tags.includes('immediate-actions')) return 'High - immediate action required.';
  if (tags.includes('critical')) return 'High - critical task for project success.';
  
  return 'Medium - standard task impact.';
}

/**
 * Generate summary based on task status and context
 */
function generateSummary(task: any): string {
  const status = task.status || 'unknown';
  const context = task.context || '';
  const category = determineCategory(task);
  
  if (status === 'done') {
    return `Task completed successfully with ${category} category task achieved objectives and is now operational.`;
  }
  
  if (status === 'in progress') {
    return `Task in progress for ${category} category. ${context ? 'Context: ' + context.slice(0, 100) : ''}`;
  }
  
  if (status === 'planned') {
    return `Task planned for ${category} category. ${context ? 'Context: ' + context.slice(0, 100) : ''}`;
  }
  
  if (status === 'pending') {
    return `Task pending for ${category} category. ${context ? 'Context: ' + context.slice(0, 100) : ''}`;
  }
  
  return `Task: ${task.task} (Status: ${status})`;
}

/**
 * Generate blockers based on task status
 */
function generateBlockers(task: any): string {
  const status = task.status || 'unknown';
  
  if (status === 'done') return 'None - task completed successfully.';
  if (status === 'in progress') return 'Task is actively being worked on - monitor progress.';
  if (status === 'planned') return 'Task not yet started - no current blockers.';
  if (status === 'pending') return 'Task is waiting for dependencies or resources.';
  
  return 'Status unclear - manual review required.';
}

/**
 * Generate recommendations based on task status and context
 */
function generateRecommendations(task: any): string {
  const status = task.status || 'unknown';
  const category = determineCategory(task);
  
  if (status === 'done') {
    return 'Document lessons learned and consider optimization opportunities.';
  }
  
  if (status === 'in progress') {
    return 'Continue progress and monitor for any blockers or dependencies.';
  }
  
  if (status === 'planned') {
    return 'Review task requirements and prepare for implementation.';
  }
  
  if (status === 'pending') {
    return 'Identify and resolve dependencies or resource constraints.';
  }
  
  return 'Review task requirements and dependencies.';
}

/**
 * Generate web-friendly insights (simplified for public consumption)
 */
function generateWebInsights(insights: RoadmapTaskInsight[]): any[] {
  return insights.map(insight => ({
    taskId: insight.taskId,
    taskTitle: insight.taskTitle,
    taskPath: insight.taskPath,
    status: insight.status,
    milestone: insight.milestone,
    owner: insight.owner,
    tags: insight.tags,
    llmInsights: {
      summary: insight.llmInsights.summary,
      impact: insight.llmInsights.impact,
      blockers: insight.llmInsights.blockers,
      recommendations: insight.llmInsights.recommendations,
      deadline: insight.llmInsights.deadline
    },
    metadata: {
      generatedAt: insight.metadata.generatedAt,
      model: insight.metadata.model,
      provider: insight.metadata.provider,
      roadmapVersion: insight.metadata.roadmapVersion
    }
  }));
}

async function main() {
  console.log('🔄 Generating fresh LLM insights from roadmap (simplified)...');
  
  // Load roadmap
  let roadmap: any;
  try {
    const ymlRaw = await fs.readFile(ROADMAP_YML, 'utf-8');
    roadmap = yaml.load(ymlRaw);
  } catch (error) {
    console.error(`❌ Failed to read or parse ${ROADMAP_YML}:`, error);
    process.exit(1);
  }

  if (!roadmap || typeof roadmap !== 'object' || !Array.isArray(roadmap.tasks)) {
    console.error(`❌ Invalid or missing tasks in ${ROADMAP_YML}`);
    process.exit(1);
  }
  
  // Walk through all tasks
  const allTasks = walkTasks(roadmap.tasks);
  console.log(`📋 Found ${allTasks.length} tasks to analyze`);
  
  const insights: RoadmapTaskInsight[] = [];
  let processed = 0;
  
  for (const { task, path } of allTasks) {
    console.log(`🔄 Analyzing task: ${task.task}`);
    const insight = generateSimpleInsight(task, path);
    insights.push(insight);
    processed++;
    
    if (processed % 10 === 0) {
      console.log(`📊 Processed ${processed}/${allTasks.length} tasks`);
    }
  }

  // Create collection structure
  const collection = {
    type: 'roadmap-insights',
    version: '1.0.0',
    generatedAt: formatISO(new Date()),
    roadmapSource: ROADMAP_YML,
    insights
  };

  // Save collection file
  await fs.writeFile(INSIGHTS_COLLECTION_PATH, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`✅ Saved ${insights.length} insights to ${INSIGHTS_COLLECTION_PATH}`);

  // Generate and save web-friendly version
  const webInsights = generateWebInsights(insights);
  const webCollection = {
    type: 'roadmap-insights-web',
    version: '1.0.0',
    generatedAt: formatISO(new Date()),
    roadmapSource: ROADMAP_YML,
    insights: webInsights
  };

  await fs.writeFile(INSIGHTS_WEB_PATH, JSON.stringify(webCollection, null, 2), 'utf-8');
  console.log(`✅ Saved web-friendly insights to ${INSIGHTS_WEB_PATH}`);

  // Print summary
  const summary = {
    total: insights.length,
    completed: insights.filter(i => i.status === 'done').length,
    inProgress: insights.filter(i => i.status === 'in progress').length,
    planned: insights.filter(i => i.status === 'planned').length,
    pending: insights.filter(i => i.status === 'pending').length,
    highImpact: insights.filter(i => i.llmInsights.impact?.includes('High')).length,
    withBlockers: insights.filter(i => i.llmInsights.blockers && i.llmInsights.blockers !== 'Task not yet started - no current blockers.').length
  };

  console.log('\n📊 Insights Summary:');
  console.log(`  Total tasks: ${summary.total}`);
  console.log(`  Completed: ${summary.completed}`);
  console.log(`  In Progress: ${summary.inProgress}`);
  console.log(`  Planned: ${summary.planned}`);
  console.log(`  Pending: ${summary.pending}`);
  console.log(`  High Impact: ${summary.highImpact}`);
  console.log(`  With Blockers: ${summary.withBlockers}`);

  console.log('\n✅ Fresh LLM insights generation completed!');
}

if (require.main === module) {
  main().catch(console.error);
} 