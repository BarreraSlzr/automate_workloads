import { test, expect } from 'bun:test';
import { runScript } from '../integration-base-tester';
import fs from 'fs';

const EXAMPLE_PATH = 'examples/transversal-fossil-github-sync.ts';
const FOSSIL_DIR = 'fossils';

function readOutputFile(path: string): string {
  return fs.readFileSync(path, 'utf8');
}

test('Transversal fossil & GitHub sync example runs and outputs canonical fossils', async () => {
  const result = runScript('bun', [EXAMPLE_PATH], { requiredCmds: ['bun'] });

  if (result.exitCode === 127) {
    console.warn('Skipping test: bun not available');
    return;
  }

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Transversal Fossil & GitHub Sync Example');
  expect(result.stdout).toContain('Curated JSON fossil');
  expect(result.stdout).toContain('Markdown generated');
  expect(result.stdout).toContain('Summary of actions:');
  expect(result.stdout).toContain('Issues to create:');
  expect(result.stdout).toContain('Milestones to create:');
  expect(result.stdout).toContain('Labels to create:');
  expect(result.stdout).toContain('Fossil collection type:');
  expect(result.stdout).toContain('All outputs use stable, canonical filenames.');

  // Check that the curated fossil and markdown exist and have canonical names
  const curatedJson = `${FOSSIL_DIR}/curated_roadmap_canonical.json`;
  const roadmapMd = `${FOSSIL_DIR}/roadmap.md`;
  expect(fs.existsSync(curatedJson)).toBe(true);
  expect(fs.existsSync(roadmapMd)).toBe(true);

  // Check that no timestamped or non-canonical files are present in fossils/
  const fossilFiles = fs.readdirSync(FOSSIL_DIR);
  for (const file of fossilFiles) {
    expect(file).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // No ISO timestamps
    expect(file).not.toMatch(/\d{13,}/); // No millisecond timestamps
    expect(file).not.toMatch(/temp/); // No temp files
  }
}); 