#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';
import { parseDocument, isMap, isSeq, YAMLSeq, Scalar } from 'yaml';
import { formatISO } from 'date-fns';

const ROADMAP_YML = path.resolve('fossils/roadmap.yml');

const DEFAULT_LLM_INSIGHTS = (status: string) => {
  const base = {
    summary: 'No LLM insights provided yet.',
    blockers: 'None reported.',
    recommendations: 'Review and update this section with LLM or human insights.',
    impact: 'Not yet assessed.',
    deadline: '',
  };
  if (status === 'done') {
    return {
      ...base,
      done: {
        retrospective: 'No retrospective provided yet.',
        insights: 'No insights provided yet.',
        completedAt: formatISO(new Date()),
      },
    };
  }
  return base;
};

function ensureInsights(node: any) {
  if (isMap(node)) {
    // Force context to literal block style if present
    if (node.has('context')) {
      const ctxAny: unknown = node.get('context');
      if (typeof ctxAny === 'string' || ctxAny instanceof String) {
        const ctxStr = String(ctxAny);
        const scalar = new Scalar(ctxStr);
        scalar.type = 'BLOCK_LITERAL';
        node.set('context', scalar);
      }
    }
    const statusAny = node.get('status');
    const status = typeof statusAny === 'string' ? statusAny : '';
    if (status === 'done') {
      if (!node.has('llmInsights') || typeof node.get('llmInsights') !== 'object') {
        node.set('llmInsights', DEFAULT_LLM_INSIGHTS('done'));
      } else {
        // Ensure 'done' sub-object exists
        const insights = node.get('llmInsights') as any;
        if (!insights.done) {
          insights.done = {
            retrospective: 'No retrospective provided yet.',
            insights: 'No insights provided yet.',
            completedAt: formatISO(new Date()),
          };
          node.set('llmInsights', insights);
        }
      }
    } else {
      if (!node.has('llmInsights') || typeof node.get('llmInsights') !== 'object') {
        node.set('llmInsights', DEFAULT_LLM_INSIGHTS(status));
      }
    }
    if (node.has('subtasks')) {
      const subtasks = node.get('subtasks');
      if (isSeq(subtasks)) {
        for (const sub of subtasks.items) {
          ensureInsights(sub);
        }
      }
    }
  }
}

async function main() {
  let ymlRaw: string;
  try {
    ymlRaw = await fs.readFile(ROADMAP_YML, 'utf-8');
  } catch (e) {
    console.error(`❌ Failed to read ${ROADMAP_YML}:`, e);
    process.exit(1);
  }
  const doc = parseDocument(ymlRaw);
  const tasksUnknown = doc.get('tasks');
  if (isSeq(tasksUnknown)) {
    const tasks = tasksUnknown as YAMLSeq;
    for (const task of tasks.items) {
      ensureInsights(task);
    }
  }
  // Stringify YAML
  let output = doc.toString();
  // Post-process: ensure a blank line after each context: | block for readability
  output = output.replace(/(context: \|\n(?:[ ]{2,}.*\n)+)/g, (match) => {
    return match.endsWith('\n\n') ? match : match + '\n';
  });
  await fs.writeFile(ROADMAP_YML, output, 'utf-8');
  console.log(`✅ Ensured llmInsights for all completed tasks in ${ROADMAP_YML} (new structure, comments and context formatting preserved)`);
}

main(); 