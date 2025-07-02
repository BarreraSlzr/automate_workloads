#!/usr/bin/env bun

/**
 * Curate Fossil Demo
 *
 * Demonstrates how to use the curateAndCheck utility to curate a YAML file
 * (e.g., roadmap.yml) into a JSON fossil in /fossils/.
 *
 * Run with: bun run examples/curate-fossil-demo.ts
 */

import { curateAndCheck } from '../src/utils/curateFossil';
import { promises as fs } from 'fs';
import type { CurateFossilParams } from '../src/types';

export async function curateFossilDemo(args: CurateFossilParams = {
  inputYaml: 'roadmap.yml',
  tag: 'demo',
  outputDir: 'fossils'
}) {
  console.log(`Curating ${args.inputYaml} into a JSON fossil...`);
  const outputPath = await curateAndCheck(args);
  console.log(`✅ Curated fossil saved at: ${outputPath}`);
  const content = await fs.readFile(outputPath, 'utf-8');
  console.log('--- Curated Fossil Content ---');
  console.log(content);
}

// CLI usage
if (import.meta.main) {
  // Parse args from process.argv or use defaults
  const [inputYaml, tag, outputDir] = process.argv.slice(2);
  curateFossilDemo({
    inputYaml: inputYaml || 'roadmap.yml',
    tag: tag || 'demo',
    outputDir: outputDir || 'fossils'
  }).catch(console.error);
} 