#!/usr/bin/env bun

import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface EnrichedExtensionReplacement {
  from: string;
  to: string;
  reason: string;
  structure: Record<string, any>;
}

const ENRICHED_EXTENSIONS: EnrichedExtensionReplacement[] = [
  {
    from: 'test-output.txt',
    to: 'test.output.validation.json',
    reason: 'Structured validation results with metadata',
    structure: {
      source: 'test',
      created_by: 'process',
      status: 'completed',
      tag_summary: 'validation',
      topic: 'test_output',
      subtopic: 'validation_results',
      timestamp: '',
      content: '',
      metadata: {
        validation_type: 'test_execution',
        pass_rate: 0,
        total_tests: 0,
        failed_tests: 0,
        execution_time: 0
      }
    }
  },
  {
    from: 'validation-output.txt',
    to: 'validation.output.results.json',
    reason: 'Structured results with context and metrics',
    structure: {
      source: 'validation',
      created_by: 'process',
      status: 'completed',
      tag_summary: 'results',
      topic: 'validation_output',
      subtopic: 'validation_results',
      timestamp: '',
      content: '',
      metadata: {
        validation_type: 'pre_commit',
        pass_rate: 0,
        total_checks: 0,
        failed_checks: 0,
        execution_time: 0
      }
    }
  },
  {
    from: 'validate-unified-output.txt',
    to: 'validation.unified.results.json',
    reason: 'Structured unified validation with traceability',
    structure: {
      source: 'validation',
      created_by: 'process',
      status: 'completed',
      tag_summary: 'unified_results',
      topic: 'validation_unified',
      subtopic: 'unified_results',
      timestamp: '',
      content: '',
      metadata: {
        validation_type: 'unified',
        pass_rate: 0,
        total_checks: 0,
        failed_checks: 0,
        execution_time: 0,
        traceability: {
          related_fossils: [],
          related_documentation: []
        }
      }
    }
  }
];

class EnrichedExtensionsImplementer {
  private replacements: EnrichedExtensionReplacement[] = ENRICHED_EXTENSIONS;
  private processedFiles: string[] = [];

  async implementEnrichedExtensions(): Promise<void> {
    console.log('🔧 Implementing Enriched Extensions Rule...');
    console.log('📋 Replacing .txt files with structured .json/.yml for better ML consumption\n');

    for (const replacement of this.replacements) {
      await this.processReplacement(replacement);
    }

    await this.generateImplementationReport();
  }

  private async processReplacement(replacement: EnrichedExtensionReplacement): Promise<void> {
    const { from, to, reason, structure } = replacement;
    
    // Check if source file exists
    if (!existsSync(from)) {
      console.log(`⚠️  Source file not found: ${from}`);
      return;
    }

    try {
      // Read the original .txt content
      const originalContent = await readFile(from, 'utf-8');
      
      // Create enriched structure with content
      const enrichedStructure = {
        ...structure,
        timestamp: new Date().toISOString(),
        content: originalContent,
        metadata: {
          ...structure.metadata,
          original_file: from,
          replacement_reason: reason,
          implementation_date: new Date().toISOString()
        }
      };

      // Write the enriched .json file
      await writeFile(to, JSON.stringify(enrichedStructure, null, 2));
      
      // Remove the original .txt file
      await unlink(from);
      
      this.processedFiles.push(`${from} → ${to}`);
      console.log(`✅ Replaced: ${from} → ${to}`);
      console.log(`   Reason: ${reason}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${from}:`, error);
    }
  }

  private async generateImplementationReport(): Promise<void> {
    const report = {
      source: 'enriched_extensions_implementation',
      created_by: 'process',
      status: 'completed',
      tag_summary: 'implementation_report',
      topic: 'enriched_extensions',
      subtopic: 'implementation',
      timestamp: new Date().toISOString(),
      processed_files: this.processedFiles,
      total_replacements: this.processedFiles.length,
      implementation_summary: {
        rule: 'Avoid .txt files, promote enriched extensions that leverage extended expected uses as valuable snapshots of context that spot data/structure/synthesis over token usage',
        benefits: [
          'Better ML/LLM consumption with structured data',
          'Rich metadata and context preservation',
          'Easier programmatic access and analysis',
          'Consistent with project-wide patterns',
          'Reduced token usage through structured synthesis'
        ]
      },
      metadata: {
        implementation_date: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const reportFile = 'fossils/context/enriched_extensions.implementation.json';
    await writeFile(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Implementation Report: ${reportFile}`);
    console.log(`📈 Total replacements: ${this.processedFiles.length}`);
    console.log('🎯 Enriched Extensions Rule implemented successfully!');
  }
}

async function main() {
  const implementer = new EnrichedExtensionsImplementer();
  await implementer.implementEnrichedExtensions();
}

if (require.main === module) {
  main().catch(console.error);
}

export { EnrichedExtensionsImplementer }; 