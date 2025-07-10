#!/usr/bin/env bun

/**
 * Generate Fresh LLM Insights Script
 * 
 * Generates fresh LLM insights from the current roadmap.yml and saves them
 * to the collection files. This replaces the old approach of embedding
 * insights directly in the roadmap.
 */

import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { createHash } from 'crypto';
import { LLMService } from '../src/services/llm';
import { fossilizeLLMInsight } from '../src/utils/fossilize';
import type { LLMInsightFossil } from '../src/types/llmFossil';
import type { RoadmapTaskInsight } from '../src/types/roadmapInsights';
import { parseJsonSafe } from '@/utils/json';

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
 * Generate LLM insight for a single task
 */
async function generateLLMInsight(params: { task: any, taskPath: string[], llm: LLMService }) {
  const { task, taskPath, llm } = params;
  const taskId = generateTaskId(task.task, taskPath);
  
  const prompt = `Analyze this roadmap task and provide structured insights:

Task: ${task.task}
Status: ${task.status || 'unknown'}
Context: ${task.context || 'No context provided'}
Owner: ${task.owner || 'Unassigned'}
Milestone: ${task.milestone || 'No milestone'}
Tags: ${(task.tags || []).join(', ')}

Please provide insights in the following JSON format:
{
  "summary": "Brief summary of the task and its current state",
  "priority": "high|medium|low based on status, tags, and context",
  "impact": "high|medium|low based on task scope and dependencies",
  "blockers": "Any identified blockers or dependencies",
  "recommendations": "Specific recommendations for next steps",
  "category": "implementation|testing|documentation|automation|llm-integration|fossilization|future-scopes|ux-developer-tools",
  "deadline": "deadline if specified, otherwise null",
  "progress": "assessment of progress based on status and subtasks"
}

Focus on actionable insights that help with project management and automation.`;

  try {
    const response = await llm.callLLM({
      model: 'llama2',
      messages: [
        { role: 'system', content: 'You are an expert project automation assistant specializing in roadmap analysis and task prioritization.' },
        { role: 'user', content: prompt }
      ],
      routingPreference: 'auto',
      context: 'roadmap-task-analysis',
      purpose: 'task-insight-generation',
      valueScore: 0.8
    } as any);

    const content = response.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON response
    let insight: any = {};
    try {
      insight = parseJsonSafe(content);
    } catch {
      // Fallback: extract fields manually
      const get = (label: string) => {
        const m = content.match(new RegExp(`"${label}":\\s*"([^"]*)"`, 'i'));
        return m ? m[1].trim() : '';
      };
      insight = {
        summary: get('summary') || task.task.slice(0, 100),
        priority: get('priority') || 'medium',
        impact: get('impact') || 'medium',
        blockers: get('blockers') || '',
        recommendations: get('recommendations') || '',
        category: get('category') || 'implementation',
        deadline: task.deadline || null,
        progress: get('progress') || task.status || 'unknown'
      };
    }

    // Add done retrospective for completed tasks
    if (task.status === 'done') {
      insight.done = {
        retrospective: insight.retrospective || 'Task completed successfully. Review for lessons learned and optimization opportunities.',
        insights: insight.insights || 'Consider documenting patterns and utilities for reuse in similar future tasks.',
        completedAt: formatISO(new Date())
      };
    }

    // Create fossil
    const fossil: LLMInsightFossil = {
      type: 'insight',
      timestamp: formatISO(new Date()),
      model: 'llama2',
      provider: 'ollama',
      excerpt: insight.summary || task.task,
      prompt: `Analyze roadmap task: ${task.task}`,
      response: JSON.stringify(insight, null, 2),
      promptId: 'roadmap-task-analysis-v3',
      promptVersion: 'v3',
      systemMessage: 'You are an expert project automation assistant specializing in roadmap analysis and task prioritization.',
      inputHash: `task-${taskId}`,
      commitRef: 'HEAD'
    };

    await fossilizeLLMInsight(fossil);

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
        summary: insight.summary || task.task,
        blockers: insight.blockers || '',
        recommendations: insight.recommendations || '',
        impact: insight.impact || 'medium',
        deadline: insight.deadline,
        done: insight.done
      },
      metadata: {
        generatedAt: formatISO(new Date()),
        model: 'llama2',
        provider: 'ollama',
        fossilId: fossil.inputHash,
        roadmapVersion: '1.0.0'
      }
    };

    return roadmapInsight;
  } catch (error) {
    console.warn(`⚠️  Failed to generate insight for task "${task.task}":`, error);
    
    // Return fallback insight
    const fallbackInsight: RoadmapTaskInsight = {
      taskId,
      taskTitle: task.task,
      taskPath,
      status: task.status || 'unknown',
      milestone: task.milestone,
      owner: task.owner,
      tags: task.tags || [],
      llmInsights: {
        summary: `Task: ${task.task} (Status: ${task.status || 'unknown'})`,
        blockers: 'Analysis failed - manual review required',
        recommendations: 'Review task requirements and dependencies',
        impact: 'unknown',
        deadline: task.deadline
      },
      metadata: {
        generatedAt: formatISO(new Date()),
        model: 'llama2',
        provider: 'ollama',
        fossilId: `fallback-${taskId}`,
        roadmapVersion: '1.0.0'
      }
    };

    return fallbackInsight;
  }
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
  console.log('🔄 Generating fresh LLM insights from roadmap...');
  
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

  // Initialize LLM service
  const llm = new LLMService({ 
    owner: 'BarreraSlzr', 
    repo: 'automate_workloads',
    preferLocalLLM: true 
  });
  
  // Walk through all tasks
  const allTasks = walkTasks(roadmap.tasks);
  console.log(`📋 Found ${allTasks.length} tasks to analyze`);
  
  const insights: RoadmapTaskInsight[] = [];
  let processed = 0;
  
  for (const { task, path } of allTasks) {
    console.log(`🔄 Analyzing task: ${task.task}`);
    const insight = await generateLLMInsight({ task, taskPath: path, llm });
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
    highImpact: insights.filter(i => i.llmInsights.impact?.includes('high')).length,
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