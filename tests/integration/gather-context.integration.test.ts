import { execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';

describe('gather-context CLI', () => {
  const outputFile = 'test-fossil-output.json';

  afterAll(() => {
    try { unlinkSync(outputFile); } catch {}
  });

  it('should produce a fossilized output file', () => {
    execSync(`bun run src/cli/gather-context.ts gather --output ${outputFile}`);
    const content = readFileSync(outputFile, 'utf-8');
    const fossil = JSON.parse(content);

    expect(fossil).toHaveProperty('id');
    expect(fossil.type).toBe('observation');
    expect(fossil.title).toBe('Gathered Context');
    expect(fossil.tags).toContain('context');
    expect(fossil.source).toBe('terminal');
    expect(fossil).toHaveProperty('createdAt');
    expect(fossil).toHaveProperty('updatedAt');
    expect(typeof fossil.content).toBe('string');
    // Optionally, parse fossil.content and check for expected context structure
  });
}); 