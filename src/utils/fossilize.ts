import type { ContextEntry } from '../types';
import { createHash } from 'crypto';

/**
 * Generate a content hash for deduplication
 */
function generateContentHash(content: string, type: string, title: string): string {
  return createHash('sha256')
    .update(`${content}${type}${title}`)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Generate a unique fossil entry ID based on content hash
 */
function generateId(content: string, type: string, title: string): string {
  const contentHash = generateContentHash(content, type, title);
  const timestamp = Date.now();
  return `fossil_${contentHash}_${timestamp}`;
}

/**
 * Standardize any output as a fossil context entry
 */
export function toFossilEntry({
  type,
  title,
  content,
  tags = [],
  source = 'manual',
  metadata = {},
  parentId,
  children = [],
  version = 1,
}: {
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
  const now = new Date().toISOString();
  const contentHash = generateContentHash(content, type, title);
  
  return {
    id: generateId(content, type, title),
    type,
    title,
    content,
    tags,
    metadata: {
      ...metadata,
      contentHash, // Store content hash for deduplication
    },
    source,
    version,
    parentId,
    children,
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

export type { ContextEntry }; 