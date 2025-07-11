import { test, expect, afterAll } from 'bun:test';
import { fossilizeLLMInsight, fossilizeLLMBenchmark, fossilizeLLMDiscovery } from '../../src/utils/fossilize';
import { LLMInsightFossil, LLMBenchmarkFossil, LLMDiscoveryFossil } from '../../src/types/llmFossil';
import fs from 'fs/promises';
import path from 'path';

const now = new Date().toISOString();

test('fossilizes an LLM insight', async () => {
  const fossil: LLMInsightFossil = {
    type: 'insight',
    timestamp: now,
    model: 'gpt-4',
    provider: 'openai',
    excerpt: 'Test insight',
    prompt: 'What is AI?',
    response: 'AI is ...',
  };
  const file = await fossilizeLLMInsight(fossil);
  const data = JSON.parse(await fs.readFile(file, 'utf-8'));
  expect(data.prompt).toBe('What is AI?');
  expect(data.response).toBe('AI is ...');
});

test('fossilizes an LLM benchmark', async () => {
  const fossil: LLMBenchmarkFossil = {
    type: 'benchmark',
    timestamp: now,
    model: 'gpt-4',
    provider: 'openai',
    excerpt: 'Test benchmark',
    metrics: { latencyMs: 123, accuracy: 0.99 },
  };
  const file = await fossilizeLLMBenchmark(fossil);
  const data = JSON.parse(await fs.readFile(file, 'utf-8'));
  expect(data.metrics.latencyMs).toBe(123);
  expect(data.metrics.accuracy).toBe(0.99);
});

test('fossilizes an LLM discovery', async () => {
  const fossil: LLMDiscoveryFossil = {
    type: 'discovery',
    timestamp: now,
    model: 'gpt-4',
    provider: 'openai',
    excerpt: 'Test discovery',
    models: [
      { name: 'gpt-4', version: '4.0', available: true },
      { name: 'llama.cpp', version: '1.0', available: false }
    ]
  };
  const file = await fossilizeLLMDiscovery(fossil);
  const data = JSON.parse(await fs.readFile(file, 'utf-8'));
  expect(data.models.length).toBe(2);
  expect(data.models[0].name).toBe('gpt-4');
});

afterAll(async () => {
  const dir = path.join(process.cwd(), 'fossils', 'llm_insights');
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch (e) {
    // Directory may not exist, nothing to clean
    return;
  }
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (
        content.includes('Test insight') ||
        content.includes('Test benchmark') ||
        content.includes('Test discovery')
      ) {
        await fs.unlink(filePath);
      }
    } catch (e) {
      // Ignore errors for files that may have been deleted already
    }
  }
}); 