#!/usr/bin/env bun

/**
 * Curate Fossil Demo
 *
 * Demonstrates how to use the curateAndCheck utility to curate a YAML file
 * (e.g., fossils/roadmap.yml) into a JSON fossil in /fossils/.
 *
 * Run with: bun run examples/curate-fossil-demo.ts
 */

import { curateAndCheck } from '../src/utils/curateFossil';
import { promises as fs } from 'fs';
import type { CurateFossilParams } from '../src/types';

export async function curateFossilDemo(args: CurateFossilParams = {
  owner: 'emmanuelbarrera',
  repo: 'automate_workloads',
  type: 'roadmap',
  tags: ['demo'],
  metadata: {
    inputFile: 'fossils/roadmap.yml',
    outputDir: 'fossils'
  },
  dryRun: false,
  verbose: true
}) {
  console.log(`Curating ${args.metadata.inputFile} into a JSON fossil...`);
  const outputJson = await curateAndCheck(args);
  console.log(`Curated fossil saved at: ${outputJson}`);
  const content = await fs.readFile(outputJson, 'utf-8');
  console.log('--- Curated Fossil Content ---');
  console.log(content);
}

// CLI usage
if (import.meta.main) {
  // Parse args from process.argv or use defaults
  const [inputFile, tag] = process.argv.slice(2);
  curateFossilDemo({
    owner: 'emmanuelbarrera',
    repo: 'automate_workloads',
    type: 'roadmap',
    tags: [tag || 'demo'],
    metadata: {
      inputFile: inputFile || 'fossils/roadmap.yml',
      outputDir: 'fossils'
    },
    dryRun: false,
    verbose: true
  }).catch(console.error);
} 