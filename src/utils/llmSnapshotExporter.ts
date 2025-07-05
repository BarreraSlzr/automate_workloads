import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LLMValidationFossil, LLMErrorPreventionFossil, LLMInsightFossil } from '../types/llmFossil';
import { LLMSnapshotExportParams, LLMSnapshotExportResult } from '../types/llm';
import { safeParseJSON } from '../utils/cli';

// ============================================================================
// LLM SNAPSHOT EXPORTER
// ============================================================================

export class LLMSnapshotExporter {
  private fossilDir: string;

  constructor(fossilDir: string = 'fossils/llm_insights/') {
    this.fossilDir = fossilDir;
  }

  /**
   * Export LLM fossils as cross-platform shareable snapshots
   */
  async exportSnapshot(params: LLMSnapshotExportParams): Promise<LLMSnapshotExportResult> {
    const fossils = await this.loadFossils(params.filters);
    const processedFossils = this.processFossilsForExport(fossils, params);
    
    let outputPath: string;
    let content: string;

    switch (params.format) {
      case 'yaml':
        content = this.exportAsYAML(processedFossils, params);
        outputPath = `llm-snapshot-${Date.now()}.yml`;
        break;
      case 'json':
        content = this.exportAsJSON(processedFossils, params);
        outputPath = `llm-snapshot-${Date.now()}.json`;
        break;
      case 'csv':
        outputPath = `llm-snapshot-${Date.now()}.csv`;
        content = this.exportAsCSV(processedFossils, params, outputPath);
        break;
      default:
        throw new Error(`Unsupported export format: ${params.format}`);
    }

    await fs.writeFile(outputPath, content, 'utf-8');
    const stats = await fs.stat(outputPath);

    return {
      outputPath,
      entriesExported: fossils.length,
      format: params.format,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalSize: stats.size,
        fossilTypes: [...new Set(fossils.map((f: any) => f.type))]
      }
    };
  }

  /**
   * Export as YAML for easy copy-paste to other services
   */
  private exportAsYAML(fossils: any[], params: LLMSnapshotExportParams): string {
    const yaml = require('js-yaml');
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        fossilCount: fossils.length,
        format: 'yaml',
        description: 'LLM interaction snapshot for cross-platform sharing'
      },
      fossils: fossils.map(fossil => ({
        id: fossil.fossilId || fossil.id,
        type: fossil.type,
        title: fossil.title || fossil.excerpt?.substring(0, 100),
        timestamp: params.includeTimestamps ? fossil.timestamp : undefined,
        content: this.extractContent(fossil, params),
        tags: fossil.tags || [],
        metadata: params.includeMetadata ? fossil.metadata : undefined
      }))
    };

    return yaml.dump(exportData, { 
      indent: 2, 
      lineWidth: 120,
      noRefs: true 
    });
  }

  /**
   * Export as JSON for programmatic use
   */
  private exportAsJSON(fossils: any[], params: LLMSnapshotExportParams): string {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        fossilCount: fossils.length,
        format: 'json',
        description: 'LLM interaction snapshot for cross-platform sharing'
      },
      fossils: fossils.map(fossil => ({
        id: fossil.fossilId || fossil.id,
        type: fossil.type,
        title: fossil.title || fossil.excerpt?.substring(0, 100),
        timestamp: params.includeTimestamps ? fossil.timestamp : undefined,
        content: this.extractContent(fossil, params),
        tags: fossil.tags || [],
        metadata: params.includeMetadata ? fossil.metadata : undefined
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as CSV for programmatic use
   */
  private exportAsCSV(fossils: any[], params: LLMSnapshotExportParams, outputPath: string): string {
    // Simple CSV export implementation
    const header = ['id', 'type', 'title', 'timestamp', 'content', 'tags', 'metadata'];
    const rows = fossils.map(fossil => [
      JSON.stringify(fossil.fossilId || fossil.id),
      JSON.stringify(fossil.type),
      JSON.stringify(fossil.title || fossil.excerpt?.substring(0, 100)),
      params.includeTimestamps ? JSON.stringify(fossil.timestamp) : '',
      JSON.stringify(this.extractContent(fossil, params)),
      JSON.stringify(fossil.tags || []),
      params.includeMetadata ? JSON.stringify(fossil.metadata) : ''
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    // Write file here for consistency with other formats
    fs.writeFile(outputPath, csv, 'utf-8');
    return csv;
  }

  /**
   * Load fossils from storage
   */
  private async loadFossils(filters?: LLMSnapshotExportParams['filters']): Promise<any[]> {
    const entriesDir = path.join(this.fossilDir, 'entries');
    const fossils: any[] = [];

    try {
      const files = await fs.readdir(entriesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(entriesDir, file), 'utf-8');
          const fossil = safeParseJSON(content, 'fossil');
          
          if (this.matchesFilters(fossil, filters)) {
            fossils.push(fossil);
          }
        }
      }
    } catch (error) {
      console.warn('Could not load fossils:', error instanceof Error ? error.message : String(error));
    }

    return fossils.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Process fossils for export
   */
  private processFossilsForExport(fossils: any[], params: LLMSnapshotExportParams): any[] {
    return fossils.map(fossil => ({
      ...fossil,
      content: this.extractContent(fossil, params)
    }));
  }

  /**
   * Extract relevant content based on export parameters
   */
  private extractContent(fossil: any, params: LLMSnapshotExportParams): any {
    const content: any = {};

    // Always include basic content
    if (fossil.content) {
      content.content = fossil.content;
    }
    if (fossil.excerpt) {
      content.excerpt = fossil.excerpt;
    }

    // Include validation if requested
    if (params.includeValidation && fossil.validation) {
      content.validation = fossil.validation;
    }

    // Include preprocessing if requested
    if (params.includePreprocessing && fossil.preprocessing) {
      content.preprocessing = fossil.preprocessing;
    }

    // For LLM validation fossils, include specific fields
    if (fossil.type === 'llm-validation') {
      content.inputHash = fossil.inputHash;
      content.validation = fossil.validation;
      if (fossil.preprocessing) {
        content.preprocessing = fossil.preprocessing;
      }
    }

    // For error prevention fossils, include session data
    if (fossil.type === 'llm-error-prevention') {
      content.sessionId = fossil.sessionId;
      content.summary = fossil.summary;
      content.inputs = fossil.inputs;
      content.insights = fossil.insights;
    }

    const keys = Object.keys(content);
    return keys.length === 1 && keys[0] ? content[keys[0]] : content;
  }

  /**
   * Check if fossil matches filters
   */
  private matchesFilters(fossil: any, filters?: LLMSnapshotExportParams['filters']): boolean {
    if (!filters) return true;

    if (filters.dateRange) {
      const fossilDate = new Date(fossil.timestamp);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (fossilDate < startDate || fossilDate > endDate) {
        return false;
      }
    }

    if (filters.model && fossil.metadata?.model !== filters.model) {
      return false;
    }

    if (filters.purpose && fossil.metadata?.purpose !== filters.purpose) {
      return false;
    }

    if (filters.status && fossil.status !== filters.status) {
      return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      const fossilTags = fossil.tags || [];
      if (!filters.tags.some((tag: string) => fossilTags.includes(tag))) {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Export LLM snapshot for cross-platform sharing
 */
export async function exportLLMSnapshot(params: LLMSnapshotExportParams): Promise<LLMSnapshotExportResult> {
  const exporter = new LLMSnapshotExporter('fossils/llm_insights/');
  return exporter.exportSnapshot(params);
}

/**
 * Quick export for chat services (YAML format)
 */
export async function exportForChat(filters?: LLMSnapshotExportParams['filters']): Promise<string> {
  const result = await exportLLMSnapshot({
    format: 'yaml',
    includeMetadata: false,
    includeTimestamps: true,
    includeValidation: true,
    includePreprocessing: true,
    filters
  });
  
  const content = await fs.readFile(result.outputPath, 'utf-8');
  await fs.unlink(result.outputPath); // Clean up temp file
  
  return content;
} 