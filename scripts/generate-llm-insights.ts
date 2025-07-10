#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { LLMService } from '../src/services/llm';
import { fossilizeLLMInsight } from '../src/utils/fossilize';
import { LLMInsightFossil } from '../src/types/llmFossil';
import { PROMPT_ROADMAP_INSIGHT } from '../src/prompts';
import { loadInsightsCollection, saveInsightsCollection } from '../src/utils/roadmapInsightsAccessor';
import type { RoadmapTaskInsight } from '../src/types/roadmapInsights';

const ROADMAP_YML = path.resolve('fossils/roadmap.yml');
const INSIGHTS_COLLECTION_PATH = 'fossils/roadmap_insights_collection.json';

const PLACEHOLDER_SUMMARY = 'No LLM insights provided yet.';

function isPlaceholder(insight: any): boolean {
  if (!insight) return true;
  if (typeof insight === 'string') return insight.includes(PLACEHOLDER_SUMMARY);
  if (typeof insight === 'object') {
    return (
      (insight.summary && insight.summary.includes(PLACEHOLDER_SUMMARY)) ||
      Object.values(insight).some(isPlaceholder)
    );
  }
  return false;
}

function* walkTasks(tasks: any[]): Generator<any> {
  for (const task of tasks) {
    yield task;
    if (Array.isArray(task.subtasks)) {
      yield* walkTasks(task.subtasks);
    }
  }
}

async function generateLLMInsight(task: any, llm: LLMService): Promise<any> {
  const promptTemplate = PROMPT_ROADMAP_INSIGHT;
  if (!promptTemplate) {
    throw new Error('PROMPT_ROADMAP_INSIGHT not found in prompt registry');
  }
  
  const prompt = promptTemplate.template({
    task: task.task,
    context: task.context || ''
  });
  try {
    const response = await llm.callLLM({
      model: 'llama2',
      messages: [
        { role: 'system', content: 'You are an expert project automation assistant.' },
        { role: 'user', content: prompt }
      ],
      routingPreference: 'auto',
      context: 'roadmap-llm-insight',
      purpose: 'roadmap-insight',
      valueScore: 0.7
    } as any);
    const content = response.choices?.[0]?.message?.content || '';
    // Try to parse as YAML or JSON, fallback to regex
    let insight: any = {};
    try {
      insight = yaml.load(content);
    } catch {
      // Fallback: extract fields manually
      const get = (label: string) => {
        const m = content.match(new RegExp(`${label}:\\s*(.*)`, 'i'));
        return m ? m[1].trim() : '';
      };
      insight = {
        summary: get('summary'),
        blockers: get('blockers'),
        recommendations: get('recommendations'),
        impact: get('impact'),
        excerpt: get('excerpt'),
      };
    }
    // Fallbacks
    if (!insight.summary) insight.summary = (task.context || task.task || '').slice(0, 80);
    if (!insight.excerpt) insight.excerpt = insight.summary;
    return insight;
  } catch (e) {
    // Fallback: use first 80 chars of context or task
    const fallback = {
      summary: (task.context || task.task || '').slice(0, 80),
      blockers: '',
      recommendations: '',
      impact: '',
      excerpt: (task.context || task.task || '').slice(0, 80),
    };
    return fallback;
  }
}

async function main() {
  console.log('🔄 Generating LLM insights for completed tasks...');
  
  // Load roadmap
  let ymlRaw: string;
  let yml: any;
  try {
    ymlRaw = await fs.readFile(ROADMAP_YML, 'utf-8');
    yml = yaml.load(ymlRaw);
  } catch (e) {
    console.error(`❌ Failed to read or parse ${ROADMAP_YML}:`, e);
    process.exit(1);
  }
  if (!yml || typeof yml !== 'object' || !Array.isArray(yml.tasks)) {
    console.error(`❌ Invalid or missing tasks in ${ROADMAP_YML}`);
    process.exit(1);
  }

  // Load existing insights collection
  let collection;
  try {
    collection = await loadInsightsCollection();
  } catch (error) {
    console.log('📝 No existing insights collection found, creating new one...');
    collection = {
      type: 'roadmap-insights',
      version: '1.0.0',
      generatedAt: formatISO(new Date()),
      roadmapSource: ROADMAP_YML,
      insights: []
    };
  }

  const llm = new LLMService({ 
    owner: 'BarreraSlzr', 
    repo: 'automate_workloads',
    preferLocalLLM: true 
  });
  let updated = false;
  let processed = 0;

  for (const task of walkTasks(yml.tasks)) {
    if (task.status === 'done') {
      processed++;
      
      // Check if task already has insights in collection
      const existingInsight = collection.insights.find(
        insight => insight.taskTitle === task.task
      );

      if (!existingInsight || isPlaceholder(existingInsight.llmInsights)) {
        console.log(`🔄 Generating LLM insight for completed task: ${task.task}`);
        
        const insight = await generateLLMInsight(task, llm);
        
        // Create or update insight in collection
        const roadmapInsight: RoadmapTaskInsight = {
          taskId: existingInsight?.taskId || `task-${task.task}`,
          taskTitle: task.task,
          taskPath: existingInsight?.taskPath || [task.task],
          status: task.status || 'done',
          milestone: task.milestone,
          owner: task.owner,
          tags: task.tags || [],
          llmInsights: {
            summary: insight.summary,
            blockers: insight.blockers,
            recommendations: insight.recommendations,
            impact: insight.impact,
            deadline: task.deadline,
            done: {
              retrospective: 'Task completed successfully. Review for lessons learned and optimization opportunities.',
              insights: 'Consider documenting patterns and utilities for reuse in similar future tasks.',
              completedAt: formatISO(new Date())
            }
          },
          metadata: {
            generatedAt: formatISO(new Date()),
            model: 'llama2',
            provider: 'ollama',
            fossilId: `task-${task.task}`,
            roadmapVersion: '1.0.0'
          }
        };

        // Remove existing insight if it exists
        if (existingInsight) {
          collection.insights = collection.insights.filter(
            insight => insight.taskTitle !== task.task
          );
        }

        // Add new insight
        collection.insights.push(roadmapInsight);
        updated = true;

        // Write fossil
        const fossil: LLMInsightFossil = {
          type: 'insight',
          timestamp: formatISO(new Date()),
          model: 'llama2',
          provider: 'ollama',
          excerpt: insight.excerpt,
          prompt: `Summarize completed roadmap task: ${task.task}`,
          response: JSON.stringify(insight, null, 2),
          promptId: 'roadmap-insight-v1',
          promptVersion: 'v1',
          systemMessage: 'You are an expert project automation assistant.',
          inputHash: `task-${task.task}`,
          commitRef: 'HEAD'
        };
        await fossilizeLLMInsight(fossil);
        console.log(`✅ Generated LLM insight for task: ${task.task}`);
      }
    }
  }

  if (updated) {
    // Update collection metadata
    collection.generatedAt = formatISO(new Date());
    
    // Save updated collection
    await saveInsightsCollection(collection);
    console.log(`✅ Updated insights collection with new LLM insights.`);
    console.log(`📊 Processed ${processed} completed tasks`);
  } else {
    console.log('✅ All completed tasks already have LLM insights.');
  }
}

main(); 