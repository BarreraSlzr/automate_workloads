#!/usr/bin/env bun

import { Command } from 'commander';
import { exportLLMSnapshot, exportForChat } from '../utils/llmSnapshotExporter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { safeParseJSON } from "../utils/cli";

const program = new Command();

program
  .name('llm-snapshot')
  .description('Export LLM interaction snapshots for cross-platform sharing')
  .version('1.0.0');

program
  .command('export')
  .description('Export LLM fossils as shareable snapshots')
  .option('-f, --format <format>', 'Export format (yaml, json, markdown, chat)', 'yaml')
  .option('-o, --output <path>', 'Output file path')
  .option('--include-metadata', 'Include metadata in export', false)
  .option('--include-timestamps', 'Include timestamps in export', true)
  .option('--include-validation', 'Include validation data', true)
  .option('--include-preprocessing', 'Include preprocessing data', true)
  .option('--include-quality-metrics', 'Include quality metrics', false)
  .option('--date-start <date>', 'Filter by start date (ISO format)')
  .option('--date-end <date>', 'Filter by end date (ISO format)')
  .option('--model <model>', 'Filter by model name')
  .option('--purpose <purpose>', 'Filter by purpose')
  .option('--status <status>', 'Filter by status')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .action(async (options) => {
    try {
      console.log('🔄 Exporting LLM snapshot...');
      
      const filters: any = {};
      if (options.dateStart || options.dateEnd) {
        filters.dateRange = {
          start: options.dateStart || '1970-01-01T00:00:00Z',
          end: options.dateEnd || new Date().toISOString()
        };
      }
      if (options.model) filters.model = options.model;
      if (options.purpose) filters.purpose = options.purpose;
      if (options.status) filters.status = options.status;
      if (options.tags) filters.tags = options.tags.split(',').map((t: string) => t.trim());

      const result = await exportLLMSnapshot({
        format: options.format as 'json' | 'yaml' | 'csv',
        includeMetadata: options.includeMetadata,
        includeTimestamps: true,
        includeValidation: options.includeValidation,
        includePreprocessing: options.includePreprocessing
      });

      console.log('✅ Snapshot export completed!');
      console.log(`📁 Output: ${result.outputPath}`);
      console.log(`📊 Fossils: ${result.entriesExported}`);

      if (options.format === 'yaml' || options.format === 'chat') {
        console.log('\n📋 Preview:');
        const content = await fs.readFile(result.outputPath, 'utf-8');
        console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      }

    } catch (error) {
      console.error('❌ Export failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('chat')
  .description('Quick export for chat services (YAML format)')
  .option('--date-start <date>', 'Filter by start date (ISO format)')
  .option('--date-end <date>', 'Filter by end date (ISO format)')
  .option('--model <model>', 'Filter by model name')
  .option('--purpose <purpose>', 'Filter by purpose')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .action(async (options) => {
    try {
      console.log('🔄 Exporting for chat...');
      
      const filters: any = {};
      if (options.dateStart || options.dateEnd) {
        filters.dateRange = {
          start: options.dateStart || '1970-01-01T00:00:00Z',
          end: options.dateEnd || new Date().toISOString()
        };
      }
      if (options.model) filters.model = options.model;
      if (options.purpose) filters.purpose = options.purpose;
      if (options.tags) filters.tags = options.tags.split(',').map((t: string) => t.trim());

      const content = await exportForChat(filters);
      
      console.log('✅ Chat export ready! Copy the content below:\n');
      console.log('='.repeat(80));
      console.log(content);
      console.log('='.repeat(80));

    } catch (error) {
      console.error('❌ Chat export failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('docs')
  .description('Quick export for documentation (Markdown format)')
  .option('-o, --output <path>', 'Output file path')
  .option('--date-start <date>', 'Filter by start date (ISO format)')
  .option('--date-end <date>', 'Filter by end date (ISO format)')
  .option('--model <model>', 'Filter by model name')
  .option('--purpose <purpose>', 'Filter by purpose')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .action(async (options) => {
    try {
      console.log('📚 Generating documentation export...');
      console.log('⚠️  Documentation export not yet implemented');
      return;
    } catch (error) {
      console.error('❌ Documentation export failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available LLM fossils')
  .option('--limit <number>', 'Maximum number of fossils to show', '10')
  .option('--date-start <date>', 'Filter by start date (ISO format)')
  .option('--date-end <date>', 'Filter by end date (ISO format)')
  .option('--model <model>', 'Filter by model name')
  .option('--purpose <purpose>', 'Filter by purpose')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .action(async (options) => {
    try {
      console.log('🔍 Listing LLM fossils...');
      
      const filters: any = {};
      if (options.dateStart || options.dateEnd) {
        filters.dateRange = {
          start: options.dateStart || '1970-01-01T00:00:00Z',
          end: options.dateEnd || new Date().toISOString()
        };
      }
      if (options.model) filters.model = options.model;
      if (options.purpose) filters.purpose = options.purpose;
      if (options.tags) filters.tags = options.tags.split(',').map((t: string) => t.trim());

      // Use a temporary export to get the list
      const result = await exportLLMSnapshot({
        format: 'json',
        includeMetadata: false,
        includeTimestamps: true,
        includeValidation: false,
        includePreprocessing: false
      });

      const content = await fs.readFile(result.outputPath, 'utf-8');
      const data = safeParseJSON<any>(content, 'snapshot content');
      
      console.log(`📊 Found ${data.fossils?.length || 0} fossils:\n`);
      
      data.fossils.slice(0, parseInt(options.limit)).forEach((fossil: any, index: number) => {
        console.log(`${index + 1}. ${fossil.type.toUpperCase()}`);
        console.log(`   ID: ${fossil.id}`);
        console.log(`   Title: ${fossil.title || 'N/A'}`);
        console.log(`   Time: ${fossil.timestamp}`);
        console.log(`   Tags: ${fossil.tags.join(', ')}`);
        console.log('');
      });

      // Clean up temp file
      await fs.unlink(result.outputPath);

    } catch (error) {
      console.error('❌ List failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

if (import.meta.main) {
  program.parse();
} 