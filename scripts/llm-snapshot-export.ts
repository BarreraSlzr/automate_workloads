#!/usr/bin/env bun

import { exportLLMSnapshot } from '../src/utils/llmSnapshotExporter';
import { program } from 'commander';

/**
 * CLI script to export LLM snapshots for analysis and sharing
 */
async function exportLLMSnapshots(options: {
  format: 'yaml' | 'json' | 'markdown' | 'chat';
  hours: number;
  includeMetadata: boolean;
  includeValidation: boolean;
  includePreprocessing: boolean;
  includeQualityMetrics: boolean;
  model?: string;
  purpose?: string;
  tags?: string[];
}) {
  console.log('📸 Exporting LLM Snapshots');
  console.log('='.repeat(40));

  try {
    const endTime = new Date();
    const startTime = new Date(Date.now() - (options.hours * 60 * 60 * 1000));

    console.log(`📅 Time Range: ${startTime.toISOString()} to ${endTime.toISOString()}`);
    console.log(`📊 Format: ${options.format.toUpperCase()}`);
    console.log(`⏰ Hours: ${options.hours}`);

    const filters: any = {
      dateRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      tags: ['llm', 'validation', 'traceable', ...(options.tags || [])]
    };

    if (options.model) {
      filters.model = options.model;
      console.log(`🤖 Model Filter: ${options.model}`);
    }

    if (options.purpose) {
      filters.purpose = options.purpose;
      console.log(`🎯 Purpose Filter: ${options.purpose}`);
    }

    const result = await exportLLMSnapshot({
      format: options.format as 'json' | 'yaml' | 'csv',
      includeMetadata: options.includeMetadata,
      includeTimestamps: true,
      includeValidation: options.includeValidation
    });

    console.log(`✅ Snapshot exported successfully!`);
    console.log(`📁 Output Path: ${result.outputPath}`);
    console.log(`📊 Fossil Count: ${(result as any).fossilCount || 'Unknown'}`);

    return result;

  } catch (error) {
    console.error('❌ Failed to export snapshot:', error);
    throw error;
  }
}

// CLI setup
program
  .name('llm-snapshot-export')
  .description('Export LLM call snapshots for analysis and sharing')
  .version('1.0.0');

program
  .option('-f, --format <format>', 'Export format (yaml, json, markdown, chat)', 'yaml')
  .option('-h, --hours <hours>', 'Number of hours to look back', '24')
  .option('--include-metadata', 'Include metadata in export', true)
  .option('--include-validation', 'Include validation data', true)
  .option('--include-preprocessing', 'Include preprocessing data', false)
  .option('--include-quality-metrics', 'Include quality metrics', false)
  .option('-m, --model <model>', 'Filter by model (e.g., gpt-3.5-turbo)')
  .option('-p, --purpose <purpose>', 'Filter by purpose (e.g., explanation, analysis)')
  .option('-t, --tags <tags>', 'Additional tags to filter by (comma-separated)')
  .action(async (options) => {
    try {
      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
      
      await exportLLMSnapshots({
        format: options.format as any,
        hours: parseInt(options.hours),
        includeMetadata: options.includeMetadata,
        includeValidation: options.includeValidation,
        includePreprocessing: options.includePreprocessing,
        includeQualityMetrics: options.includeQualityMetrics,
        model: options.model,
        purpose: options.purpose,
        tags
      });

      console.log('\n🎉 Export completed successfully!');
      process.exit(0);

    } catch (error) {
      console.error('\n❌ Export failed:', error);
      process.exit(1);
    }
  });

// Run the CLI if this script is executed directly
if (import.meta.main) {
  program.parse();
}

export { exportLLMSnapshots }; 