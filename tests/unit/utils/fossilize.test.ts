import { describe, it,  expect } from "bun:test";
import { toFossilEntry } from '../../../src/utils/fossilize';
import type { ContextEntry } from '../../../src/types';

describe('toFossilEntry', () => {
  it('should create a valid fossil entry', () => {
    const entry = toFossilEntry({
      type: 'observation',
      title: 'Test Entry',
      content: '{"foo":"bar"}',
      tags: ['test'],
      source: 'terminal',
      metadata: { test: true },
    });

    expect(entry).toHaveProperty('id');
    expect(entry.type).toBe('observation');
    expect(entry.title).toBe('Test Entry');
    expect(entry.content).toBe('{"foo":"bar"}');
    expect(entry.tags).toContain('test');
    expect(entry.source).toBe('terminal');
    expect(entry.metadata.test).toBe(true);
    expect(typeof entry.metadata.contentHash).toBe('string');
    expect(entry.metadata.contentHash.length).toBeGreaterThan(0);
    expect(entry).toHaveProperty('createdAt');
    expect(entry).toHaveProperty('updatedAt');
  });
}); 