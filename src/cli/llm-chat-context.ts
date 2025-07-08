#!/usr/bin/env bun

/**
 * Canonical LLM Chat Context CLI
 * Generates a canonical LLM chat context fossil for automation and legacy test compatibility.
 * Uses the rich context and recommendations from scripts/llm-chat-context.ts.
 */

import { Command } from 'commander';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { generateChatContext } from '../../scripts/llm-chat-context';

const program = new Command();

program
  .name('llm-chat-context')
  .description('Generate canonical LLM chat context fossil')
  .option('--output <path>', 'Output file', 'fossils/context/llm.chat.json')
  .parse();

const options = program.opts();

export async function main() {
  try {
    // Generate the rich chat context using the shared script logic
    // This writes to fossils/chat_context.json by default
    await generateChatContext();

    // Read the generated context
    const legacyPath = 'fossils/chat_context.json';
    const outputPath = options.output;
    const context = JSON.parse(readFileSync(legacyPath, 'utf-8'));

    // Add canonical fossil metadata if not present
    if (!context.metadata) {
      context.metadata = {};
    }
    context.metadata.fossilized = true;
    context.metadata.canonical = true;
    context.metadata.version = '1.0.0';

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(context, null, 2), 'utf-8');
    console.log(`✅ LLM chat context saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating LLM chat context:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 