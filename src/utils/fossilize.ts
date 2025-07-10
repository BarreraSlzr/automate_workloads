import type { ContextEntry } from '../types';
import { ContextEntrySchema } from '@/types/schemas';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { LLMInsightFossil, LLMBenchmarkFossil, LLMDiscoveryFossil, AnyLLMFossil } from '../types/llmFossil';

/**
 * Generate a content hash for deduplication
 */
export function generateContentHash(params: { content: string; type: string; title: string }): string {
  const { content, type, title } = params;
  return createHash('sha256')
    .update(`${content}${type}${title}`)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Generate a unique fossil entry ID based on content hash
 */
function generateId(params: { content: string; type: string; title: string }): string {
  const { content, type, title } = params;
  const contentHash = generateContentHash({ content, type, title });
  const timestamp = Date.now();
  return `fossil_${contentHash}_${timestamp}`;
}

/**
 * Standardize any output as a fossil context entry
 */
export function toFossilEntry(params: {
  type: ContextEntry['type'];
  title: string;
  content: string;
  tags?: string[];
  source?: ContextEntry['source'];
  metadata?: Record<string, unknown>;
  parentId?: string;
  children?: string[];
  version?: number;
}): ContextEntry {
  // Validate params using Zod schema (omit id, createdAt, updatedAt for input)
  const PartialContextEntrySchema = ContextEntrySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
  const safeParams = {
    ...params,
    tags: params.tags ?? [],
    source: params.source ?? 'manual',
    metadata: params.metadata ?? {},
    children: params.children ?? [],
    version: params.version ?? 1,
  };
  PartialContextEntrySchema.parse(safeParams);
  const now = new Date().toISOString();
  const contentHash = generateContentHash({ content: safeParams.content, type: safeParams.type, title: safeParams.title });
  
  return {
    id: generateId({ content: safeParams.content, type: safeParams.type, title: safeParams.title }),
    type: safeParams.type,
    title: safeParams.title,
    content: safeParams.content,
    tags: safeParams.tags,
    metadata: {
      ...safeParams.metadata,
      contentHash, // Store content hash for deduplication
    },
    source: safeParams.source,
    version: safeParams.version,
    parentId: safeParams.parentId,
    children: safeParams.children,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Output a fossil entry to console as JSON
 */
export function outputFossil(entry: ContextEntry) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry, null, 2));
}

/**
 * Write a fossil entry to a file (JSONL or JSON)
 */
export async function writeFossilToFile(entry: ContextEntry, filePath: string) {
  const { promises: fs } = await import('fs');
  if (filePath.endsWith('.jsonl')) {
    await fs.appendFile(filePath, JSON.stringify(entry) + '\n');
  } else {
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  }
}

const FOSSIL_DIR = path.join(process.cwd(), 'fossils', 'llm_insights');

async function ensureFossilDir() {
  await fs.mkdir(FOSSIL_DIR, { recursive: true });
}

export async function fossilizeLLMInsight(fossil: LLMInsightFossil) {
  await ensureFossilDir();
  const file = path.join(FOSSIL_DIR, 'insight.json');
  await fs.writeFile(file, JSON.stringify(fossil, null, 2));
  return file;
}

export async function fossilizeLLMBenchmark(fossil: LLMBenchmarkFossil) {
  await ensureFossilDir();
  const file = path.join(FOSSIL_DIR, 'benchmark.json');
  await fs.writeFile(file, JSON.stringify(fossil, null, 2));
  return file;
}

export async function fossilizeLLMDiscovery(fossil: LLMDiscoveryFossil) {
  await ensureFossilDir();
  const file = path.join(FOSSIL_DIR, 'discovery.json');
  await fs.writeFile(file, JSON.stringify(fossil, null, 2));
  return file;
} 