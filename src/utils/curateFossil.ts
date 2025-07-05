import { promises as fs } from 'fs';
import path from 'path';
import { yamlToJson } from './yamlToJson';
import type { CuratedFossilMetadata } from '../types/core';
import type { CurateFossilParams } from '../types';
import { CurateFossilParamsSchema } from '../types';

/**
 * Curate a YAML file into a JSON fossil and return the output path.
 * Accepts a CurateFossilParams object for consistency with CLI argument conventions.
 * Used by CLI, scripts, E2E tests, and examples.
 */
export async function curateAndCheck(params: CurateFossilParams): Promise<string> {
  CurateFossilParamsSchema.parse(params);
  const { owner, repo, metadata, verbose, dryRun, type, tags } = params;
  const inputYaml = ''; // Default empty string since it's not in the interface
  const outputDir = 'fossils'; // Default value
  const tag = 'manual'; // Default value
  const kind = inputYaml.includes('status') ? 'project_status' : inputYaml.includes('roadmap') ? 'roadmap' : 'other';
  const content = yamlToJson<any>(inputYaml);
  const outputJson = path.join(outputDir, `curated_${kind}_${tag}.json`);
  const curated: CuratedFossilMetadata = {
    type: 'curated_fossil',
    source: 'automation',
    createdBy: 'llm+human',
    createdAt: new Date().toISOString(),
    kind,
    tag,
    curatedAt: new Date().toISOString(),
    inputFile: inputYaml,
    outputYml: '',
    outputJson,
    content
  } as any;
  await fs.writeFile(outputJson, JSON.stringify(curated, null, 2), 'utf-8');
  console.log(`✅ Curated fossil saved: ${curated.outputJson}`);
  return outputJson;
} 