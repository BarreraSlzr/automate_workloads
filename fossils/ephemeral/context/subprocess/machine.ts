#!/usr/bin/env bun

/**
 * Machine subprocess utility for ephemeral context.
 * Orchestrates compute and learn: accepts YAML, JSON, or Markdown (with frontmatter/code blocks),
 * extracts and processes content, and outputs a traceable JSON and Markdown summary.
 * Leverages best practices from docs/ephemeral/address/ephemeral_context_management.md and @/ephemeral patterns.
 * Output ephemeral file is named using a content-derived vector (e.g., prefix.tag_summary.topic.ext).
 *
 * Usage (CLI):
 *   bun run fossils/ephemeral/context/subprocess/machine.ts <input.yml|json|md>
 *
 * Usage (import):
 *   import { machine } from './machine';
 *   const result = await machine('path/to/input.md');
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import yaml from 'js-yaml';
import { compute } from './compute';
import { learn } from './learn';
import { validateLLMInput } from '../../../../src/utils/llmInputValidator';

// Utility: Extract YAML frontmatter from Markdown
function extractFrontmatter(md: string): any {
  const match = md.match(/^---\n([\s\S]+?)\n---/);
  if (match) {
    try {
      return yaml.load(match[1]);
    } catch {}
  }
  return null;
}

// Utility: Extract first mermaid code block from Markdown
function extractMermaid(md: string): string | null {
  const match = md.match(/```mermaid\n([\s\S]+?)\n```/);
  return match ? match[1] : null;
}

// Utility: Generate content-derived vector for naming
function contentVector(meta: any): string {
  const prefix = meta.source || 'machine';
  const tag = meta.tag_summary || meta.status || 'draft';
  const topic = meta.topic || 'untitled';
  const ext = 'json';
  return `${prefix}.${tag}.${topic}.${ext}`;
}

export async function machine(inputPath: string): Promise<{ json: string; md: string }> {
  try {
    const ext = extname(inputPath).toLowerCase();
    let ymlPath = '';
    let meta: any = {};
    let mermaid: string | null = null;

    if (ext === '.yml' || ext === '.yaml') {
      ymlPath = inputPath;
      meta = yaml.load(readFileSync(inputPath, 'utf8')) || {};
    } else if (ext === '.json') {
      // Already JSON, skip compute, just learn
      const mdPath = await learn(inputPath);
      return { json: inputPath, md: mdPath };
    } else if (ext === '.md') {
      const mdContent = readFileSync(inputPath, 'utf8');
      meta = extractFrontmatter(mdContent) || {};
      mermaid = extractMermaid(mdContent);
      // Save extracted YAML as temp for compute
      ymlPath = join(dirname(inputPath), `${basename(inputPath, '.md')}.machine.yml`);
      writeFileSync(ymlPath, yaml.dump({ ...meta, notes: 'Extracted from markdown', mermaid }));
    } else {
      throw new Error('Unsupported file type. Use .yml, .yaml, .json, or .md');
    }

    // Input validation for machine process
    const inputContent = readFileSync(ymlPath, 'utf8');
    const validation = validateLLMInput({ content: inputContent, context: 'machine' });

    // Run compute to get traceable JSON
    const jsonPath = await compute(ymlPath);
    
    // Optionally, rename output to content-derived vector
    const vectorName = contentVector(meta);
    const vectorPath = join(dirname(jsonPath), vectorName);
    writeFileSync(vectorPath, readFileSync(jsonPath));

    // Create simple snapshot for ML processing
    const snapshot = {
      processType: 'machine',
      inputPath,
      outputPath: vectorPath,
      validation,
      timestamp: new Date().toISOString(),
    };

    // Save snapshot for ML processing
    const snapshotPath = join(dirname(vectorPath), `${basename(vectorPath, '.json')}.unified.snapshot.json`);
    writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    // Run learn to get Markdown summary
    const mdPath = await learn(vectorPath);
    return { json: vectorPath, md: mdPath };
  } catch (err) {
    console.error('Machine error:', err);
    throw err;
  }
}

// CLI Entrypoint
if (require.main === module) {
  const [,, inputPath] = process.argv;
  if (!inputPath) {
    console.error('Usage: bun run fossils/ephemeral/context/subprocess/machine.ts <input.yml|json|md>');
    process.exit(1);
  }
  machine(inputPath)
    .then(({ json, md }) => {
      console.log('Traceable JSON written to:', json);
      console.log('Learning Markdown written to:', md);
    })
    .catch(() => process.exit(1));
} 