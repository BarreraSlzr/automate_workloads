#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';

const ROADMAP_YML = path.resolve('fossils/roadmap.yml');
const BLOG_MD = path.resolve('fossils/public/blog/roadmap_insights.post.md');
const API_JSON = path.resolve('fossils/public/api/roadmap_insights_public.json');
const AUDIENCE = 'public';
const SOURCE = 'fossils/roadmap.yml';

function collectCompletedTasks(tasks: any[]): any[] {
  const completed: any[] = [];
  for (const task of tasks) {
    if (task.status === 'done') {
      completed.push(task);
    }
    if (Array.isArray(task.subtasks)) {
      completed.push(...collectCompletedTasks(task.subtasks));
    }
  }
  return completed;
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
  const completed = collectCompletedTasks(yml.tasks);
  const now = formatISO(new Date());

  // Markdown
  const frontmatter = [
    '---',
    `title: Roadmap LLM Insights`,
    `date: ${now}`,
    `audience: ${AUDIENCE}`,
    `source: ${SOURCE}`,
    '---',
    ''
  ].join('\n');
  const body = [
    frontmatter,
    '# Roadmap LLM Insights',
    '',
    ...completed.map((task, i) => {
      const insights: any[] = Array.isArray(task.llmInsights) ? task.llmInsights : [];
      return [
        `## ${i + 1}. ${task.task || '(Unnamed Task)'}`,
        task.context ? `> ${task.context}` : '',
        '',
        ...insights.map((insight: any, j: number) => [
          `### Insight ${j + 1}`,
          `- **Summary:** ${insight.summary || ''}`,
          `- **Blockers:** ${insight.blockers || ''}`,
          `- **Recommendations:** ${insight.recommendations || ''}`,
          `- **Impact:** ${insight.impact || ''}`,
          `- **Completed At:** ${insight.completedAt || ''}`,
          ''
        ].join('\n')),
        ''
      ].join('\n');
    })
  ].join('\n');

  // JSON
  const jsonOut = {
    metadata: {
      audience: AUDIENCE,
      timestamp: now,
      source: SOURCE
    },
    completed_tasks: completed.map(task => ({
      task: task.task,
      context: task.context,
      llmInsights: task.llmInsights || []
    }))
  };

  // Write outputs
  try {
    await fs.mkdir(path.dirname(BLOG_MD), { recursive: true });
    await fs.mkdir(path.dirname(API_JSON), { recursive: true });
    await fs.writeFile(BLOG_MD, body, 'utf-8');
    await fs.writeFile(API_JSON, JSON.stringify(jsonOut, null, 2), 'utf-8');
    console.log(`✅ Published:\n- ${BLOG_MD}\n- ${API_JSON}`);
  } catch (e) {
    console.error('❌ Failed to write publication outputs:', e);
    process.exit(1);
  }
}

main(); 