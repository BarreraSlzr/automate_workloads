import type { ContextEntry } from '../types';

/**
 * Generate a unique fossil entry ID (copied from ContextFossilService)
 */
function generateId(): string {
  return `fossil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  return {
    id: generateId(),
    type,
    title,
    content,
    tags,
    metadata,
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