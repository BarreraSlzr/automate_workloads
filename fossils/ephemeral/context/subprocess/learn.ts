#!/usr/bin/env bun

/**
 * Learn subprocess utility for ephemeral context.
 * Receives a JSON file, processes it (extracts insights, generates Markdown summary, Mermaid diagram if relevant),
 * and outputs a Markdown file in the same directory.
 * Usable as both CLI and function.
 *
 * Usage (CLI):
 *   bun run fossils/ephemeral/context/subprocess/learn.ts <input.json>
 *
 * Usage (import):
 *   import { learn } from './learn';
 *   const result = await learn('path/to/input.json');
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { validateLLMInput } from '../../../../src/utils/llmInputValidator';

export async function learn(inputPath: string): Promise<string> {
  try {
    // Read JSON input
    const jsonContent = readFileSync(inputPath, 'utf8');
    const data = JSON.parse(jsonContent);

    // Input validation for learn process
    const validation = validateLLMInput({ content: jsonContent, context: 'learn' });

    // Extract key insights (list top-level keys and values)
    const keys = Object.keys(data);
    const summary = keys.map(key => `- **${key}**: ${JSON.stringify(data[key])}`).join('\n');

    // Optionally, generate a Mermaid diagram if structure is suitable
    let mermaid = '';
    if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
      mermaid = '\n```mermaid\ngraph TD;\n' + data.edges.map((e: any) => `${e.from}-->${e.to};`).join('\n') + '\n```\n';
    }

    // Recommendations section (based on metadata and best practices)
    let recommendations = '';
    if (data.status === 'draft') {
      recommendations += '- Consider reviewing and promoting this ephemeral file if it proves valuable.\n';
    }
    if (data.usage_count && data.usage_count > 5) {
      recommendations += '- High usage detected: candidate for promotion to canonical fossil.\n';
    }
    if (data.ttl && typeof data.ttl === 'string') {
      recommendations += `- TTL set to ${data.ttl}: ensure cleanup if expired.\n`;
    }

    // Add validation recommendations
    if (!validation.isValid) {
      recommendations += '- **Validation issues detected**: Review input for compliance.\n';
    }
    if (validation.warnings.length > 0) {
      recommendations += `- **Warnings**: ${validation.warnings.join(', ')}\n`;
    }

    // Add compliance information
    if (validation.isValid) {
      recommendations += `- ✅ **Input Validation Passed**\n`;
    } else {
      recommendations += `- ⚠️ **Input Validation Failed**\n`;
    }

    // Compose Markdown
    const md = `# Learning Summary

## Key Insights
${summary}
${mermaid}

## Input Validation Analysis
- **Valid**: ${validation.isValid ? '✅ Yes' : '❌ No'}
- **Errors**: ${validation.errors.length}
- **Warnings**: ${validation.warnings.length}

### Validation Results
${validation.errors.length > 0 ? `**Errors**:\n${validation.errors.map(e => `- ${e}`).join('\n')}\n` : ''}
${validation.warnings.length > 0 ? `**Warnings**:\n${validation.warnings.map(w => `- ${w}`).join('\n')}\n` : ''}

## Recommendations
${recommendations}

---
*See [Ephemeral Context Management Guide](../../../../../../docs/ephemeral/address/ephemeral_context_management.md) for standards and best practices.*`;

    // Output filename: <basename>.learn.md
    const base = basename(inputPath, extname(inputPath));
    const outPath = join(dirname(inputPath), `${base}.learn.md`);
    writeFileSync(outPath, md);

    // Create simple snapshot for ML processing
    const snapshot = {
      processType: 'learn',
      inputPath,
      outputPath: outPath,
      validation,
      timestamp: new Date().toISOString(),
    };

    // Save snapshot for ML processing
    const snapshotPath = join(dirname(outPath), `${base}.unified.snapshot.json`);
    writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    return outPath;
  } catch (err) {
    console.error('Learn error:', err);
    throw err;
  }
}

// CLI Entrypoint
if (require.main === module) {
  const [,, inputPath] = process.argv;
  if (!inputPath) {
    console.error('Usage: bun run fossils/ephemeral/context/subprocess/learn.ts <input.json>');
    process.exit(1);
  }
  learn(inputPath)
    .then(outPath => {
      console.log('Learning Markdown written to:', outPath);
    })
    .catch(() => process.exit(1));
} 