#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { LLMService } from '../src/services/llm';
import { fossilizeLLMInsight } from '../src/utils/fossilize';
import { LLMInsightFossil } from '../src/types/llmFossil';
import { PROMPT_ROADMAP_INSIGHT } from '../src/prompts';

const ROADMAP_YML = path.resolve('fossils/roadmap.yml');

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
  const llm = new LLMService({ preferLocalLLM: true });
  let updated = false;
  for (const task of walkTasks(yml.tasks)) {
    if (task.status === 'done') {
      if (!task.llmInsights || isPlaceholder(task.llmInsights)) {
        const insight = await generateLLMInsight(task, llm);
        // Update roadmap
        task.llmInsights = insight;
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
    // Write updated roadmap
    const out = yaml.dump(yml, { lineWidth: 120 });
    await fs.writeFile(ROADMAP_YML, out, 'utf-8');
    console.log(`✅ Updated ${ROADMAP_YML} with new LLM insights.`);
  } else {
    console.log('✅ All completed tasks already have LLM insights.');
  }
}

main(); 