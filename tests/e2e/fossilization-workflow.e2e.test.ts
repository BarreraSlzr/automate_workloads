import { test, expect } from 'bun:test';
import { promises as fs } from 'fs';
import { loadYaml } from './utils';

const FOSSIL_FILES = ['fossils/project_status.yml', 'fossils/roadmap.yml'];
const PREVIOUS_PROJECT_STATUS = 'fossils/previous_project_status.yml'; // For regression test

test('Fossil files exist and are valid YAML', async () => {
  for (const file of FOSSIL_FILES) {
    console.log('Checking file:', file);
    await expect(loadYaml(file)).resolves.toBeDefined();
  }
});

// Stricter schema validation for fossils/project_status.yml
// Checks for modules.cli, modules.utils, and their files
// Also checks for cli_details in each CLI file

test('fossils/project_status.yml has required modules and CLI details', async () => {
  const data = await loadYaml('fossils/project_status.yml') as any;
  expect(data).toHaveProperty('project_status');
  const modules = data.project_status.modules;
  expect(modules).toHaveProperty('cli');
  expect(modules).toHaveProperty('utils');
  expect(Array.isArray(modules.cli.files)).toBe(true);
  for (const fileEntry of modules.cli.files) {
    const fileKey = Object.keys(fileEntry)[0];
    if (!fileKey) continue; // Skip if fileKey is undefined
    const entry = fileEntry[fileKey];
    if (!('cli_details' in entry)) {
      console.log('Missing cli_details for file:', fileKey, 'Entry:', entry);
    }
    expect(entry).toHaveProperty('cli_details');
    expect(Array.isArray(entry.cli_details)).toBe(true);
    // Each cli_details entry should have name, options, required
    for (const cmd of entry.cli_details) {
      expect(cmd).toHaveProperty('name');
      expect(cmd).toHaveProperty('options');
      expect(cmd).toHaveProperty('required');
    }
  }
});

test('fossils/project_status.yml matches schema and has required fields', async () => {
  const data = await loadYaml('fossils/project_status.yml') as any;
  expect(data).toHaveProperty('project_status');
  expect(data.project_status).toHaveProperty('modules');
  expect(data.project_status).toHaveProperty('overall_summary');
  expect(data.project_status).toHaveProperty('fossilization_summary');
  expect(data.project_status).toHaveProperty('recommendations');
  // Optionally, check for developer_summary and cli_details
  expect(data).toHaveProperty('developer_summary');
});

test('LLM insights are present and actionable', async () => {
  const data = await loadYaml('fossils/project_status.yml') as any;
  expect(data.project_status).toHaveProperty('recommendations');
  expect(Array.isArray(data.project_status.recommendations)).toBe(true);
  expect(data.project_status.recommendations.length).toBeGreaterThan(0);
  // Optionally, check for actionable phrases
  const actionable = data.project_status.recommendations.some((rec: string) =>
    /test|fossil|coverage|improve|automate/i.test(rec)
  );
  expect(actionable).toBe(true);
});

test('fossils/roadmap.yml matches schema and all tasks have status and owner', async () => {
  const data = await loadYaml('fossils/roadmap.yml') as any;
  expect(data).toHaveProperty('type');
  expect(data).toHaveProperty('tasks');
  expect(Array.isArray(data.tasks)).toBe(true);
  for (const task of data.tasks) {
    expect(task).toHaveProperty('status');
    expect(task).toHaveProperty('owner');
  }
});

test('fossils/roadmap.yml matches schema and has required fields', async () => {
  const data = await loadYaml('fossils/roadmap.yml') as any;
  expect(data).toHaveProperty('type');
  expect(data).toHaveProperty('tasks');
  expect(Array.isArray(data.tasks)).toBe(true);
  // Optionally, check for key_points or milestones
});

// Placeholder: Coverage threshold test
// (You can expand this to check minimum coverage in fossils/project_status.yml)
test('fossils/project_status.yml meets minimum coverage threshold', async () => {
  const data = await loadYaml('fossils/project_status.yml') as any;
  const coverage = data.project_status?.overall_summary?.completion_percent;
  expect(typeof coverage).toBe('number');
  expect(coverage).toBeGreaterThanOrEqual(5); // Example threshold
});

// Regression test: Compare current and previous fossils/project_status.yml for coverage and fossilized_outputs
// Only runs if fossils/previous_project_status.yml exists

let prevExists = false;
try {
  await fs.access(PREVIOUS_PROJECT_STATUS);
  prevExists = true;
} catch {}

if (!prevExists) {
  test.skip('No regression in fossilization or coverage (no fossils/previous_project_status.yml)', () => {});
} else {
  test('No regression in fossilization or coverage', async () => {
    const prev = await loadYaml(PREVIOUS_PROJECT_STATUS) as any;
    const curr = await loadYaml('fossils/project_status.yml') as any;
    // Coverage should not decrease
    expect(curr.project_status.overall_summary.completion_percent)
      .toBeGreaterThanOrEqual(prev.project_status.overall_summary.completion_percent);
    // Number of fossilized outputs should not decrease
    const prevFossils = prev.project_status.fossilization_summary?.fossilized_outputs?.length || 0;
    const currFossils = curr.project_status.fossilization_summary?.fossilized_outputs?.length || 0;
    expect(currFossils).toBeGreaterThanOrEqual(prevFossils);
  });
} 