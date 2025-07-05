#!/usr/bin/env bun

/**
 * Analyze Roadmap LLM Insights Script
 * 
 * Analyzes roadmap.yml and generates LLM insights for tasks, milestones, and overall progress.
 * This replaces the embedded llmInsights with external analysis and generation.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { createHash } from 'crypto';
import { LLMService } from '../src/services/llm';
import { fossilizeLLMInsight } from '../src/utils/fossilize';
import type { LLMInsightFossil } from '../src/types/llmFossil';

const ROADMAP_YML = 'fossils/roadmap.yml';
const INSIGHTS_DIR = 'fossils/roadmap_insights';

/**
 * Generate task ID for consistent referencing
 */
function generateTaskId(taskName: string, path: string[]): string {
  const fullPath = [...path, taskName].join('-');
  return createHash('md5').update(fullPath).digest('hex').slice(0, 12);
}

/**
 * Analyze a single task and generate LLM insights
 */
async function analyzeTask(
  task: any, 
  taskPath: string[], 
  llm: LLMService
): Promise<LLMInsightFossil | null> {
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
      insight = JSON.parse(content);
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

    // Create fossil
    const fossil: LLMInsightFossil = {
      type: 'insight',
      timestamp: formatISO(new Date()),
      model: 'llama2',
      provider: 'ollama',
      excerpt: insight.summary || task.task,
      prompt: `Analyze roadmap task: ${task.task}`,
      response: JSON.stringify(insight, null, 2),
      promptId: 'roadmap-task-analysis-v2',
      promptVersion: 'v2',
      systemMessage: 'You are an expert project automation assistant specializing in roadmap analysis and task prioritization.',
      inputHash: `task-${taskId}`,
      commitRef: 'HEAD'
    };

    return fossil;
  } catch (error) {
    console.warn(`⚠️  Failed to analyze task "${task.task}":`, error);
    return null;
  }
}

/**
 * Analyze milestone progress
 */
async function analyzeMilestone(
  milestoneName: string,
  tasks: any[],
  llm: LLMService
): Promise<LLMInsightFossil | null> {
  const milestoneTasks = tasks.filter(task => task.milestone === milestoneName);
  const completedTasks = milestoneTasks.filter(task => task.status === 'done');
  const pendingTasks = milestoneTasks.filter(task => task.status === 'pending');
  const inProgressTasks = milestoneTasks.filter(task => task.status === 'in progress');

  const prompt = `Analyze this milestone and provide insights:

Milestone: ${milestoneName}
Total Tasks: ${milestoneTasks.length}
Completed: ${completedTasks.length}
In Progress: ${inProgressTasks.length}
Pending: ${pendingTasks.length}

Task List:
${milestoneTasks.map(t => `- ${t.task} (${t.status})`).join('\n')}

Please provide insights in the following JSON format:
{
  "summary": "Brief summary of milestone progress",
  "completion": "percentage of completion",
  "priority": "high|medium|low based on completion and task importance",
  "blockers": "Any identified blockers preventing completion",
  "recommendations": "Specific recommendations for milestone completion",
  "nextSteps": "Immediate next steps to advance the milestone",
  "risk": "high|medium|low risk assessment for milestone completion"
}`;

  try {
    const response = await llm.callLLM({
      model: 'llama2',
      messages: [
        { role: 'system', content: 'You are an expert project automation assistant specializing in milestone analysis and progress tracking.' },
        { role: 'user', content: prompt }
      ],
      routingPreference: 'auto',
      context: 'roadmap-milestone-analysis',
      purpose: 'milestone-insight-generation',
      valueScore: 0.8
    } as any);

    const content = response.choices?.[0]?.message?.content || '';
    
    let insight: any = {};
    try {
      insight = JSON.parse(content);
    } catch {
      const get = (label: string) => {
        const m = content.match(new RegExp(`"${label}":\\s*"([^"]*)"`, 'i'));
        return m ? m[1].trim() : '';
      };
      insight = {
        summary: get('summary') || `Milestone ${milestoneName} analysis`,
        completion: get('completion') || `${Math.round((completedTasks.length / milestoneTasks.length) * 100)}%`,
        priority: get('priority') || 'medium',
        blockers: get('blockers') || '',
        recommendations: get('recommendations') || '',
        nextSteps: get('nextSteps') || '',
        risk: get('risk') || 'medium'
      };
    }

    const fossil: LLMInsightFossil = {
      type: 'insight',
      timestamp: formatISO(new Date()),
      model: 'llama2',
      provider: 'ollama',
      excerpt: insight.summary || `Milestone ${milestoneName} analysis`,
      prompt: `Analyze milestone: ${milestoneName}`,
      response: JSON.stringify(insight, null, 2),
      promptId: 'roadmap-milestone-analysis-v1',
      promptVersion: 'v1',
      systemMessage: 'You are an expert project automation assistant specializing in milestone analysis and progress tracking.',
      inputHash: `milestone-${milestoneName}`,
      commitRef: 'HEAD'
    };

    return fossil;
  } catch (error) {
    console.warn(`⚠️  Failed to analyze milestone "${milestoneName}":`, error);
    return null;
  }
}

/**
 * Analyze overall roadmap progress
 */
async function analyzeOverallProgress(
  roadmap: any,
  llm: LLMService
): Promise<LLMInsightFossil | null> {
  const allTasks = extractAllTasks(roadmap.tasks);
  const completedTasks = allTasks.filter(task => task.status === 'done');
  const pendingTasks = allTasks.filter(task => task.status === 'pending');
  const inProgressTasks = allTasks.filter(task => task.status === 'in progress');
  
  const milestones = [...new Set(allTasks.map(task => task.milestone).filter(Boolean))];
  const owners = [...new Set(allTasks.map(task => task.owner).filter(Boolean))];

  const prompt = `Analyze this roadmap and provide overall progress insights:

Total Tasks: ${allTasks.length}
Completed: ${completedTasks.length}
In Progress: ${inProgressTasks.length}
Pending: ${pendingTasks.length}
Milestones: ${milestones.length}
Active Owners: ${owners.length}

Key Milestones: ${milestones.join(', ')}
Active Owners: ${owners.join(', ')}

Please provide insights in the following JSON format:
{
  "summary": "Brief summary of overall roadmap progress",
  "completion": "percentage of completion",
  "health": "excellent|good|fair|poor based on progress and distribution",
  "priorities": "Top 3 priority areas to focus on",
  "risks": "Key risks or concerns for roadmap completion",
  "recommendations": "Strategic recommendations for roadmap advancement",
  "nextQuarter": "Key objectives for the next quarter"
}`;

  try {
    const response = await llm.callLLM({
      model: 'llama2',
      messages: [
        { role: 'system', content: 'You are an expert project automation assistant specializing in roadmap analysis and strategic planning.' },
        { role: 'user', content: prompt }
      ],
      routingPreference: 'auto',
      context: 'roadmap-overall-analysis',
      purpose: 'overall-insight-generation',
      valueScore: 0.9
    } as any);

    const content = response.choices?.[0]?.message?.content || '';
    
    let insight: any = {};
    try {
      insight = JSON.parse(content);
    } catch {
      const get = (label: string) => {
        const m = content.match(new RegExp(`"${label}":\\s*"([^"]*)"`, 'i'));
        return m ? m[1].trim() : '';
      };
      insight = {
        summary: get('summary') || 'Overall roadmap analysis',
        completion: get('completion') || `${Math.round((completedTasks.length / allTasks.length) * 100)}%`,
        health: get('health') || 'good',
        priorities: get('priorities') || '',
        risks: get('risks') || '',
        recommendations: get('recommendations') || '',
        nextQuarter: get('nextQuarter') || ''
      };
    }

    const fossil: LLMInsightFossil = {
      type: 'insight',
      timestamp: formatISO(new Date()),
      model: 'llama2',
      provider: 'ollama',
      excerpt: insight.summary || 'Overall roadmap analysis',
      prompt: 'Analyze overall roadmap progress',
      response: JSON.stringify(insight, null, 2),
      promptId: 'roadmap-overall-analysis-v1',
      promptVersion: 'v1',
      systemMessage: 'You are an expert project automation assistant specializing in roadmap analysis and strategic planning.',
      inputHash: 'roadmap-overall',
      commitRef: 'HEAD'
    };

    return fossil;
  } catch (error) {
    console.warn('⚠️  Failed to analyze overall progress:', error);
    return null;
  }
}

/**
 * Extract all tasks recursively
 */
function extractAllTasks(tasks: any[]): any[] {
  const allTasks: any[] = [];
  
  for (const task of tasks) {
    allTasks.push(task);
    if (Array.isArray(task.subtasks)) {
      allTasks.push(...extractAllTasks(task.subtasks));
    }
  }
  
  return allTasks;
}

/**
 * Walk through tasks recursively
 */
function* walkTasks(tasks: any[], parentPath: string[] = []): Generator<{ task: any; path: string[] }> {
  for (const task of tasks) {
    const currentPath = [...parentPath, task.task];
    yield { task, path: currentPath };
    
    if (Array.isArray(task.subtasks)) {
      yield* walkTasks(task.subtasks, currentPath);
    }
  }
}

async function main() {
  console.log('🔍 Analyzing roadmap for LLM insights...');
  
  try {
    // Ensure insights directory exists
    await fs.mkdir(INSIGHTS_DIR, { recursive: true });
    
    // Read roadmap
    const ymlRaw = await fs.readFile(ROADMAP_YML, 'utf-8');
    const roadmap = yaml.load(ymlRaw);
    
    if (!roadmap || typeof roadmap !== 'object' || !Array.isArray((roadmap as any).tasks)) {
      throw new Error('Invalid roadmap.yml structure');
    }
    
    const roadmapData = roadmap as any;
    const llm = new LLMService({ preferLocalLLM: true });
    const fossils: LLMInsightFossil[] = [];
    
    // Analyze individual tasks
    console.log('📋 Analyzing individual tasks...');
    for (const { task, path } of walkTasks(roadmapData.tasks)) {
      const fossil = await analyzeTask(task, path, llm);
      if (fossil) {
        fossils.push(fossil);
        await fossilizeLLMInsight(fossil);
        console.log(`✅ Analyzed task: ${task.task}`);
      }
    }
    
    // Analyze milestones
    console.log('🎯 Analyzing milestones...');
    const allTasks = extractAllTasks(roadmapData.tasks);
    const milestones = [...new Set(allTasks.map(task => task.milestone).filter(Boolean))];
    
    for (const milestone of milestones) {
      const fossil = await analyzeMilestone(milestone, allTasks, llm);
      if (fossil) {
        fossils.push(fossil);
        await fossilizeLLMInsight(fossil);
        console.log(`✅ Analyzed milestone: ${milestone}`);
      }
    }
    
    // Analyze overall progress
    console.log('📊 Analyzing overall progress...');
    const overallFossil = await analyzeOverallProgress(roadmapData, llm);
    if (overallFossil) {
      fossils.push(overallFossil);
      await fossilizeLLMInsight(overallFossil);
      console.log('✅ Analyzed overall progress');
    }
    
    // Save analysis summary
    const analysisSummary = {
      generatedAt: formatISO(new Date()),
      totalInsights: fossils.length,
      taskInsights: fossils.filter(f => f.promptId === 'roadmap-task-analysis-v2').length,
      milestoneInsights: fossils.filter(f => f.promptId === 'roadmap-milestone-analysis-v1').length,
      overallInsights: fossils.filter(f => f.promptId === 'roadmap-overall-analysis-v1').length,
      fossils: fossils.map(f => ({
        id: f.inputHash,
        type: f.promptId,
        excerpt: f.excerpt,
        timestamp: f.timestamp
      }))
    };
    
    const summaryFile = path.join(INSIGHTS_DIR, 'analysis_summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(analysisSummary, null, 2), 'utf-8');
    
    console.log('\n📊 Analysis Summary:');
    console.log(`- Total insights generated: ${fossils.length}`);
    console.log(`- Task insights: ${analysisSummary.taskInsights}`);
    console.log(`- Milestone insights: ${analysisSummary.milestoneInsights}`);
    console.log(`- Overall insights: ${analysisSummary.overallInsights}`);
    console.log(`- Summary saved to: ${summaryFile}`);
    
    console.log('\n✅ Roadmap LLM insights analysis completed successfully!');
    
  } catch (error) {
    console.error('❌ Error analyzing roadmap:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 