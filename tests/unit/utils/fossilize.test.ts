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
      metadata: { test: true, invocation: 'test-invocation' },
    });

    expect(entry).toHaveProperty('id');
    expect(entry.type).toBe('observation');
    expect(entry.title).toBe('Test Entry');
    expect(entry.content).toBe('{"foo":"bar"}');
    expect(entry.tags).toContain('test');
    expect(entry.source).toBe('terminal');
    expect(entry.metadata.test).toBe(true);
    expect(typeof entry.metadata.contentHash).toBe('string');
    expect((entry.metadata.contentHash as string).length).toBeGreaterThan(0);
    expect((entry.metadata as any).invocation).toBe('test-invocation');
    expect((entry.metadata as any).invocation.length).toBeGreaterThan(0);
    expect(entry).toHaveProperty('createdAt');
    expect(entry).toHaveProperty('updatedAt');
  });
}); 