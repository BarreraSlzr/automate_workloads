#!/usr/bin/env bun

/**
 * Context Fossil Storage CLI
 * 
 * Manages self-documenting context as persistent, editable knowledge base
 * that can be accessed and modified by LLMs, terminals, APIs, and future services.
 */

import { Command } from 'commander';
import { getEnv } from '../core/config';
import { promises as fs } from 'fs';
import path from 'path';
import type { ContextEntry, ContextQuery } from '@/types';
import { SemanticTaggerService } from '../services/semantic-tagger';
import { getFossilSummary } from '../utils/fossilSummary';
import { extractJsonBlock } from '../utils/markdownChecklist';
import { isTestMode } from '../cli/repo-orchestrator';

/**
 * Context Fossil Storage Service
 * 
 * Manages persistent, editable knowledge base with versioning and relationships
 */
export class ContextFossilService {
  private config: ReturnType<typeof getEnv>;
  private fossilDir: string;
  private indexFile: string;
  private semanticTagger: SemanticTaggerService;
  private llmOptions: { enableLocalLLM?: boolean; localBackend?: string; routingPreference?: 'auto' | 'local' | 'cloud' };
  private options: any;

  constructor(options?: any) {
    this.config = getEnv();
    this.fossilDir = '.context-fossil';
    this.indexFile = path.join(this.fossilDir, 'index.json');
    this.llmOptions = {
      enableLocalLLM: options?.enableLocalLLM ?? true,
      localBackend: options?.localBackend,
      routingPreference: options?.routingPreference ?? 'auto',
    };
    this.semanticTagger = new SemanticTaggerService('gpt-4', undefined, this.llmOptions);
    this.options = options || {};
  }

  /**
   * Initialize fossil storage
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.fossilDir, { recursive: true });
    await fs.mkdir(path.join(this.fossilDir, 'entries'), { recursive: true });
    await fs.mkdir(path.join(this.fossilDir, 'snapshots'), { recursive: true });
    await fs.mkdir(path.join(this.fossilDir, 'exports'), { recursive: true });
    
    // Create index if it doesn't exist
    if (!await this.fileExists(this.indexFile)) {
      await this.saveIndex({
        entries: {},
        tags: {},
        types: {},
        sources: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      });
    }
  }

  /**
   * Add a new context entry
   * @param entry - Context entry to add
   * @returns Created entry with ID
   */
  async addEntry(entry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContextEntry> {
    const contentHash = this.generateContentHash(entry.content, entry.type, entry.title);
    
    // First, check for exact content match (existing deduplication logic)
    const existingFossil = await this.findFossilByContentHash(contentHash);
    if (existingFossil) {
      // Update existing fossil instead of creating duplicate
      const updatedFossil = await this.updateEntry(existingFossil.id, {
        updatedAt: new Date().toISOString(),
        version: existingFossil.version + 1,
      });
      return updatedFossil!;
    }
    
    // If no exact match, check for similar fossils
    const similarFossils = await this.findSimilarFossils(entry.title, entry.content, 60);
    if (similarFossils.length > 0) {
      const mostSimilar = similarFossils[0]!;
      console.log(`🔍 Found similar fossil (${mostSimilar.similarity}% similarity): ${mostSimilar.fossil.id}`);
      
      // Update the most similar fossil with new content
      const updatedFossil = await this.updateEntry(mostSimilar.fossil.id, {
        content: entry.content,
        metadata: {
          ...entry.metadata,
          contentHash,
          similarityScore: mostSimilar.similarity,
        },
        updatedAt: new Date().toISOString(),
        version: mostSimilar.fossil.version + 1,
      });
      return updatedFossil!;
    }
    
    // No similar fossils found, create new entry
    const id = this.generateId(entry.content, entry.type, entry.title);
    const now = new Date().toISOString();
    
    const newEntry: ContextEntry = {
      ...entry,
      id,
      metadata: {
        ...entry.metadata,
        contentHash, // Store content hash for deduplication
      },
      createdAt: now,
      updatedAt: now,
    };

    // Generate intelligent tags
    console.log('🧠 Generating intelligent tags...');
    if (isTestMode(this.options)) {
      // In test/mock mode, skip semantic tagger and use fast mock tags
      newEntry.semanticTags = { concepts: ['mocked'], semanticCategory: 'test', contentHash: contentHash };
      newEntry.relationships = {};
      newEntry.temporal = {};
      newEntry.excerpt = (newEntry.content || '').replace(/\s+/g, ' ').slice(0, 80).trim();
    } else {
      // Generate semantic tags
      newEntry.semanticTags = await this.semanticTagger.generateSemanticTags(newEntry);
      // Get all entries for relationship analysis
      const allEntries = await this.getAllEntries();
      // Generate relationship tags
      newEntry.relationships = await this.semanticTagger.generateRelationshipTags(newEntry, allEntries);
      // Generate temporal tags
      newEntry.temporal = this.semanticTagger.generateTemporalTags(newEntry);
      // Generate LLM-based excerpt
      try {
        newEntry.excerpt = await this.semanticTagger.generateExcerpt(newEntry);
      } catch (err) {
        newEntry.excerpt = (newEntry.content || '').replace(/\s+/g, ' ').slice(0, 80).trim();
      }
    }

    // Add semantic tags to regular tags for backward compatibility
    if (newEntry.semanticTags?.concepts) {
      newEntry.tags = [...newEntry.tags, ...newEntry.semanticTags.concepts];
    }
    if (newEntry.semanticTags?.semanticCategory) {
      newEntry.tags.push(newEntry.semanticTags.semanticCategory);
    }

    // Save entry file
    const entryFile = path.join(this.fossilDir, 'entries', `${id}.json`);
    await fs.writeFile(entryFile, JSON.stringify(newEntry, null, 2));

    // Update index
    const index = await this.loadIndex();
    index.entries[id] = {
      id,
      type: newEntry.type,
      title: newEntry.title,
      tags: newEntry.tags,
      source: newEntry.source,
      createdAt: newEntry.createdAt,
      updatedAt: newEntry.updatedAt,
    };

    // Update tag index
    newEntry.tags.forEach(tag => {
      if (!index.tags[tag]) index.tags[tag] = [];
      index.tags[tag].push(id);
    });

    // Update type index
    if (!index.types[newEntry.type]) index.types[newEntry.type] = [];
    index.types[newEntry.type].push(id);

    // Update source index
    if (!index.sources[newEntry.source]) index.sources[newEntry.source] = [];
    index.sources[newEntry.source].push(id);

    index.lastUpdated = now;
    await this.saveIndex(index);

    console.log('✅ Intelligent tags generated successfully');
    return newEntry;
  }

  /**
   * Get a context entry by ID
   * @param id - Entry ID
   * @returns Context entry or null
   */
  async getEntry(id: string): Promise<ContextEntry | null> {
    const entryFile = path.join(this.fossilDir, 'entries', `${id}.json`);
    
    if (!await this.fileExists(entryFile)) {
      return null;
    }

    const content = await fs.readFile(entryFile, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Update an existing context entry
   * @param id - Entry ID
   * @param updates - Updates to apply
   * @returns Updated entry
   */
  async updateEntry(id: string, updates: Partial<Omit<ContextEntry, 'id' | 'createdAt'>>): Promise<ContextEntry | null> {
    const entry = await this.getEntry(id);
    if (!entry) return null;

    // Prepare previousVersions array
    const previousVersions = entry.previousVersions || [];
    // Push the old version (excluding previousVersions itself)
    const { previousVersions: _omit, ...entryWithoutPrev } = entry;
    previousVersions.push(entryWithoutPrev);

    const updatedEntry: ContextEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: entry.version + 1,
      previousVersions,
    };

    // Save updated entry
    const entryFile = path.join(this.fossilDir, 'entries', `${id}.json`);
    await fs.writeFile(entryFile, JSON.stringify(updatedEntry, null, 2));

    // Update index
    const index = await this.loadIndex();
    if (index.entries[id]) {
      index.entries[id] = {
        ...index.entries[id],
        title: updatedEntry.title,
        tags: updatedEntry.tags,
        updatedAt: updatedEntry.updatedAt,
      };
    }

    // Update tag index if tags changed
    if (updates.tags) {
      // Remove old tags
      entry.tags.forEach(tag => {
        if (index.tags[tag]) {
          index.tags[tag] = index.tags[tag].filter((entryId: string) => entryId !== id);
          if (index.tags[tag].length === 0) delete index.tags[tag];
        }
      });

      // Add new tags
      updatedEntry.tags.forEach(tag => {
        if (!index.tags[tag]) index.tags[tag] = [];
        if (!index.tags[tag].includes(id)) index.tags[tag].push(id);
      });
    }

    index.lastUpdated = updatedEntry.updatedAt;
    await this.saveIndex(index);

    return updatedEntry;
  }

  /**
   * Query context entries
   * @param query - Query parameters
   * @returns Matching entries
   */
  async queryEntries(query: ContextQuery): Promise<ContextEntry[]> {
    const index = await this.loadIndex();
    let matchingIds = Object.keys(index.entries);

    // Filter by type
    if (query.type) {
      matchingIds = matchingIds.filter(id => index.entries[id].type === query.type);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      matchingIds = matchingIds.filter(id => {
        const entryTags = index.entries[id].tags;
        return query.tags!.some(tag => entryTags.includes(tag));
      });
    }

    // Filter by source
    if (query.source) {
      matchingIds = matchingIds.filter(id => index.entries[id].source === query.source);
    }

    // Filter by date range
    if (query.dateRange) {
      const { start, end } = query.dateRange;
      matchingIds = matchingIds.filter(id => {
        const createdAt = index.entries[id].createdAt;
        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;
        return true;
      });
    }

    // Apply search if provided
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      const searchMatchingIds: string[] = [];
      
      for (const id of matchingIds) {
        const entry = await this.getEntry(id);
        if (entry && (
          entry.title.toLowerCase().includes(searchLower) ||
          entry.content.toLowerCase().includes(searchLower) ||
          entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )) {
          searchMatchingIds.push(id);
        }
      }
      matchingIds = searchMatchingIds;
    }

    // Apply pagination
    const start = query.offset;
    const end = start + query.limit;
    const paginatedIds = matchingIds.slice(start, end);

    // Load full entries
    const entries: ContextEntry[] = [];
    for (const id of paginatedIds) {
      const entry = await this.getEntry(id);
      if (entry) entries.push(entry);
    }

    return entries;
  }

  /**
   * Get related entries
   * @param id - Entry ID
   * @param maxDepth - Maximum relationship depth
   * @returns Related entries
   */
  async getRelatedEntries(id: string, maxDepth: number = 2): Promise<ContextEntry[]> {
    const related: ContextEntry[] = [];
    const visited = new Set<string>();

    const traverse = async (entryId: string, depth: number) => {
      if (depth > maxDepth || visited.has(entryId)) return;
      visited.add(entryId);

      const entry = await this.getEntry(entryId);
      if (!entry) return;

      related.push(entry);

      // Traverse parent
      if (entry.parentId && depth < maxDepth) {
        await traverse(entry.parentId, depth + 1);
      }

      // Traverse children
      for (const childId of entry.children) {
        await traverse(childId, depth + 1);
      }
    };

    await traverse(id, 0);
    return related.filter(entry => entry.id !== id);
  }

  /**
   * Create a snapshot of the fossil storage
   * @param name - Snapshot name
   * @returns Snapshot metadata
   */
  async createSnapshot(name: string): Promise<{ id: string; name: string; timestamp: string; entryCount: number }> {
    const snapshotId = this.generateId(`snapshot-${name}`, 'snapshot', name);
    const timestamp = new Date().toISOString();
    const snapshotDir = path.join(this.fossilDir, 'snapshots', snapshotId);
    
    await fs.mkdir(snapshotDir, { recursive: true });

    // Copy entries
    const entriesDir = path.join(this.fossilDir, 'entries');
    const snapshotEntriesDir = path.join(snapshotDir, 'entries');
    await fs.mkdir(snapshotEntriesDir, { recursive: true });

    const entryFiles = await fs.readdir(entriesDir);
    for (const file of entryFiles) {
      if (file.endsWith('.json')) {
        await fs.copyFile(
          path.join(entriesDir, file),
          path.join(snapshotEntriesDir, file)
        );
      }
    }

    // Copy index
    await fs.copyFile(this.indexFile, path.join(snapshotDir, 'index.json'));

    // Create snapshot metadata
    const metadata = {
      id: snapshotId,
      name,
      timestamp,
      entryCount: entryFiles.length,
      description: `Snapshot created at ${timestamp}`,
    };

    await fs.writeFile(
      path.join(snapshotDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return metadata;
  }

  /**
   * Export fossil storage in various formats
   * @param format - Export format
   * @param query - Optional query to filter entries
   * @param stable - If true, write to a stable filename for canonical exports
   * @returns Export file path
   */
  async export(format: 'json' | 'markdown' | 'csv' | 'yaml', query?: ContextQuery, stable: boolean = true): Promise<string> {
    const entries = query ? await this.queryEntries(query) : await this.queryEntries({ limit: 100, offset: 0 });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = stable ? `fossil-export-latest.${format}` : `fossil-export-${timestamp}.${format}`;
    const exportPath = path.join(this.fossilDir, 'exports', filename);

    switch (format) {
      case 'json':
        await fs.writeFile(exportPath, JSON.stringify(entries, null, 2));
        break;
      case 'markdown':
        const markdown = this.generateMarkdownExport(entries);
        await fs.writeFile(exportPath, markdown);
        break;
      case 'csv':
        const csv = this.generateCsvExport(entries);
        await fs.writeFile(exportPath, csv);
        break;
      case 'yaml':
        const yaml = this.generateYamlExport(entries);
        await fs.writeFile(exportPath, yaml);
        break;
    }
    return exportPath;
  }

  /**
   * Generate context summary for LLMs
   * @param query - Optional query to filter entries
   * @returns Context summary
   */
  async generateContextSummary(query?: ContextQuery): Promise<string> {
    const entries = query ? await this.queryEntries(query) : await this.queryEntries({ limit: 100, offset: 0 });
    
    const summary = {
      totalEntries: entries.length,
      byType: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      recentEntries: [] as Array<{ id: string; title: string; type: string; createdAt: string }>,
      keyInsights: [] as string[],
    };

    // Analyze entries
    entries.forEach(entry => {
      summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
      summary.bySource[entry.source] = (summary.bySource[entry.source] || 0) + 1;
      
      if (summary.recentEntries.length < 10) {
        summary.recentEntries.push({
          id: entry.id,
          title: entry.title,
          type: entry.type,
          createdAt: entry.createdAt,
        });
      }
    });

    // Extract key insights from recent entries
    const recentEntries = entries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    recentEntries.forEach(entry => {
      if (entry.type === 'insight' || entry.type === 'decision') {
        summary.keyInsights.push(`${entry.title}: ${entry.content.substring(0, 100)}...`);
      }
    });

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Get fossil storage statistics
   * @returns Storage statistics
   */
  async getStatistics(): Promise<{
    totalEntries: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    byTag: Record<string, number>;
    lastUpdated: string;
    storageSize: number;
  }> {
    const index = await this.loadIndex();
    const entries = Object.values(index.entries);

    const stats = {
      totalEntries: entries.length,
      byType: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byTag: {} as Record<string, number>,
      lastUpdated: index.lastUpdated,
      storageSize: 0,
    };

    // Calculate statistics
    entries.forEach((entry: unknown) => {
      if (typeof entry === 'object' && entry !== null && 'type' in entry && 'source' in entry && 'tags' in entry) {
        const typedEntry = entry as ContextEntry;
        stats.byType[typedEntry.type] = (stats.byType[typedEntry.type] || 0) + 1;
        stats.bySource[typedEntry.source] = (stats.bySource[typedEntry.source] || 0) + 1;
      
        typedEntry.tags.forEach((tag: string) => {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      });
      }
    });

    // Calculate storage size
    try {
      const entriesDir = path.join(this.fossilDir, 'entries');
      const entryFiles = await fs.readdir(entriesDir);
      
      for (const file of entryFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(entriesDir, file);
          const stat = await fs.stat(filePath);
          stats.storageSize += stat.size;
        }
      }
    } catch (error) {
      // Ignore storage size calculation errors
    }

    return stats;
  }

  // Private helper methods

  private async loadIndex(): Promise<any> {
    const content = await fs.readFile(this.indexFile, 'utf8');
    return JSON.parse(content);
  }

  private async saveIndex(index: any): Promise<void> {
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a content hash for deduplication
   */
  private generateContentHash(content: string, type: string, title: string): string {
    const { createHash } = require('crypto');
    return createHash('sha256')
      .update(`${content}${type}${title}`)
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Generate a unique fossil entry ID based on content hash
   */
  private generateId(content: string, type: string, title: string): string {
    const contentHash = this.generateContentHash(content, type, title);
    const timestamp = Date.now();
    return `fossil_${contentHash}_${timestamp}`;
  }

  /**
   * Find existing fossil by content hash
   */
  private async findFossilByContentHash(contentHash: string): Promise<ContextEntry | null> {
    const index = await this.loadIndex();
    
    for (const [id, entryData] of Object.entries(index.entries)) {
      const entry = await this.getEntry(id);
      if (entry && entry.metadata?.contentHash === contentHash) {
        return entry;
      }
    }
    
    return null;
  }

  /**
   * Enhance an existing entry with intelligent semantic tags
   */
  async enhanceEntryWithTags(entry: ContextEntry, dryRun: boolean): Promise<ContextEntry> {
    console.log(`🧠 Generating intelligent tags for: ${entry.title}`);
    
    // Generate semantic tags
    const semanticTags = await this.semanticTagger.generateSemanticTags(entry);
    
    // Get all entries for relationship analysis
    const allEntries = await this.getAllEntries();
    
    // Generate relationship tags
    const relationships = await this.semanticTagger.generateRelationshipTags(entry, allEntries);
    
    // Generate temporal tags
    const temporal = this.semanticTagger.generateTemporalTags(entry);
    
    // Create enhanced entry
    const enhancedEntry: ContextEntry = {
      ...entry,
      semanticTags,
      relationships,
      temporal,
      updatedAt: new Date().toISOString(),
    };
    
    // Add semantic tags to regular tags for backward compatibility
    if (semanticTags?.concepts) {
      enhancedEntry.tags = [...entry.tags, ...semanticTags.concepts];
    }
    if (semanticTags?.semanticCategory) {
      enhancedEntry.tags.push(semanticTags.semanticCategory);
    }
    
    if (!dryRun) {
      // Save enhanced entry
      const entryFile = path.join(this.fossilDir, 'entries', `${entry.id}.json`);
      await fs.writeFile(entryFile, JSON.stringify(enhancedEntry, null, 2));
      
      // Update index
      const index = await this.loadIndex();
      if (index.entries[entry.id]) {
        index.entries[entry.id] = {
          ...index.entries[entry.id],
          tags: enhancedEntry.tags,
          updatedAt: enhancedEntry.updatedAt,
        };
      }
      
      // Update tag index
      enhancedEntry.tags.forEach(tag => {
        if (!index.tags[tag]) index.tags[tag] = [];
        if (!index.tags[tag].includes(entry.id)) {
          index.tags[tag].push(entry.id);
        }
      });
      
      index.lastUpdated = enhancedEntry.updatedAt;
      await this.saveIndex(index);
    }
    
    return enhancedEntry;
  }

  /**
   * Get all entries (public method for CLI commands)
   */
  async getAllEntries(): Promise<ContextEntry[]> {
    const index = await this.loadIndex();
    const entries: ContextEntry[] = [];
    
    for (const id of Object.keys(index.entries)) {
      const entry = await this.getEntry(id);
      if (entry) entries.push(entry);
    }
    
    return entries;
  }

  private generateMarkdownExport(entries: ContextEntry[]): string {
    let markdown = '# Context Fossil Storage Export\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Total Entries: ${entries.length}\n\n`;

    // Group by type
    const byType = entries.reduce((acc, entry) => {
      if (!acc[entry.type]) acc[entry.type] = [];
      if (acc[entry.type]) {
        acc[entry.type]!.push(entry);
      }
      return acc;
    }, {} as Record<string, ContextEntry[]>);

    for (const [type, typeEntries] of Object.entries(byType)) {
      markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1)} (${typeEntries.length})\n\n`;
      
      typeEntries.forEach(entry => {
        markdown += `### ${entry.title}\n\n`;
        markdown += `**ID:** ${entry.id}\n`;
        markdown += `**Created:** ${entry.createdAt}\n`;
        markdown += `**Source:** ${entry.source}\n`;
        markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`;
        markdown += `${entry.content}\n\n`;
        markdown += `---\n\n`;
      });
    }

    return markdown;
  }

  private generateCsvExport(entries: ContextEntry[]): string {
    const headers = ['id', 'type', 'title', 'content', 'tags', 'source', 'createdAt', 'updatedAt', 'version'];
    const csv = [headers.join(',')];

    entries.forEach(entry => {
      const row = [
        entry.id,
        entry.type,
        `"${entry.title.replace(/"/g, '""')}"`,
        `"${entry.content.replace(/"/g, '""')}"`,
        `"${entry.tags.join(';')}"`,
        entry.source,
        entry.createdAt,
        entry.updatedAt,
        entry.version,
      ];
      csv.push(row.join(','));
    });

    return csv.join('\n');
  }

  private generateYamlExport(entries: ContextEntry[]): string {
    let yaml = `# Context Fossil Storage Export\n`;
    yaml += `generated: ${new Date().toISOString()}\n`;
    yaml += `total_entries: ${entries.length}\n\n`;
    yaml += `entries:\n`;

    entries.forEach(entry => {
      yaml += `  - id: ${entry.id}\n`;
      yaml += `    type: ${entry.type}\n`;
      yaml += `    title: ${entry.title}\n`;
      yaml += `    content: |\n`;
      yaml += `      ${entry.content.split('\n').map(line => `      ${line}`).join('\n')}\n`;
      yaml += `    tags: [${entry.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
      yaml += `    source: ${entry.source}\n`;
      yaml += `    created_at: ${entry.createdAt}\n`;
      yaml += `    updated_at: ${entry.updatedAt}\n`;
      yaml += `    version: ${entry.version}\n\n`;
    });

    return yaml;
  }

  /**
   * Calculate content similarity percentage using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1, // deletion
          matrix[j - 1]![i]! + 1, // insertion
          matrix[j - 1]![i - 1]! + indicator // substitution
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - matrix[str2.length]![str1.length]!) / maxLength) * 100;
    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Find similar fossils by title and content similarity
   */
  private async findSimilarFossils(title: string, content: string, similarityThreshold: number = 60): Promise<{ fossil: ContextEntry; similarity: number }[]> {
    const index = await this.loadIndex();
    const similarFossils: { fossil: ContextEntry; similarity: number }[] = [];
    
    for (const [id, entryData] of Object.entries(index.entries)) {
      const entry = await this.getEntry(id);
      if (!entry) continue;
      
      // Check if titles are similar (exact match for now, could be enhanced)
      if (entry.title === title) {
        const similarity = this.calculateSimilarity(entry.content, content);
        if (similarity >= similarityThreshold) {
          similarFossils.push({ fossil: entry, similarity });
        }
      }
    }
    
    // Sort by similarity (highest first)
    return similarFossils.sort((a, b) => b.similarity - a.similarity);
  }

  // Cleanup duplicates
  async cleanupDuplicates(options: {
    dryRun: boolean;
    similarityThreshold: number;
  }): Promise<{
    totalBefore: number;
    totalAfter: number;
    duplicatesFound: number;
    consolidated: number;
    storageSaved: number;
    duplicateGroups: ContextEntry[][];
  }> {
    const allEntries = await this.getAllEntries();
    const duplicates: Record<string, ContextEntry[]> = {};
    const jsonBlockGroups: Record<string, ContextEntry[]> = {};

    // First pass: Group by content hash (for newer fossils)
    for (const entry of allEntries) {
      const contentHash = entry.metadata?.contentHash as string;
      if (contentHash) {
        if (!duplicates[contentHash]) {
          duplicates[contentHash] = [];
        }
        duplicates[contentHash].push(entry);
      }
      // Group by JSON block if present
      const json = extractJsonBlock(entry.content);
      if (json) {
        const jsonKey = JSON.stringify(json);
        if (!jsonBlockGroups[jsonKey]) jsonBlockGroups[jsonKey] = [];
        jsonBlockGroups[jsonKey].push(entry);
      }
    }

    // Second pass: Group by exact content match (for older fossils without content hash)
    const entriesWithoutHash = allEntries.filter(entry => !entry.metadata?.contentHash);
    for (const entry of entriesWithoutHash) {
      const contentKey = `${entry.content}_${entry.type}_${entry.title}`;
      if (!duplicates[contentKey]) {
        duplicates[contentKey] = [];
      }
      duplicates[contentKey].push(entry);
    }

    const result = {
      totalBefore: allEntries.length,
      totalAfter: allEntries.length,
      duplicatesFound: 0,
      consolidated: 0,
      storageSaved: 0,
      duplicateGroups: [] as ContextEntry[][],
    };

    // Consolidate by content hash and content match (existing logic)
    for (const [key, group] of Object.entries(duplicates)) {
      if (group.length > 1) {
        result.duplicatesFound++;
        result.totalAfter -= (group.length - 1);
        result.storageSaved += (group.length - 1) * 1024;
        if (!options.dryRun) {
          const consolidatedEntry = group[0]!;
          const previousVersions = group.slice(1).map(e => {
            const { previousVersions: _omit, ...entryWithoutPrev } = e;
            return entryWithoutPrev;
          });
          consolidatedEntry.previousVersions = [
            ...(consolidatedEntry.previousVersions || []),
            ...previousVersions
          ];
          consolidatedEntry.updatedAt = new Date().toISOString();
          consolidatedEntry.version += group.length - 1;
          if (!consolidatedEntry.metadata?.contentHash) {
            const contentHash = this.generateContentHash(consolidatedEntry.content, consolidatedEntry.type, consolidatedEntry.title);
            consolidatedEntry.metadata = {
              ...consolidatedEntry.metadata,
              contentHash,
            };
          }
          const entryFile = path.join(this.fossilDir, 'entries', `${consolidatedEntry.id}.json`);
          await fs.writeFile(entryFile, JSON.stringify(consolidatedEntry, null, 2));
          for (let i = 1; i < group.length; i++) {
            const duplicateFile = path.join(this.fossilDir, 'entries', `${group[i]!.id}.json`);
            try { await fs.unlink(duplicateFile); } catch {}
          }
          const updatedIndex = await this.loadIndex();
          for (let i = 1; i < group.length; i++) {
            delete updatedIndex.entries[group[i]!.id];
          }
          updatedIndex.entries[consolidatedEntry.id] = {
            id: consolidatedEntry.id,
            type: consolidatedEntry.type,
            title: consolidatedEntry.title,
            tags: consolidatedEntry.tags,
            source: consolidatedEntry.source,
            createdAt: consolidatedEntry.createdAt,
            updatedAt: consolidatedEntry.updatedAt,
          };
          updatedIndex.lastUpdated = consolidatedEntry.updatedAt;
          await this.saveIndex(updatedIndex);
        }
        result.consolidated++;
        result.duplicateGroups.push(group.slice(1));
      }
    }

    // Consolidate by JSON block (new logic)
    for (const [jsonKey, group] of Object.entries(jsonBlockGroups)) {
      if (group.length > 1) {
        // Avoid double-consolidating fossils already handled by content hash
        const alreadyConsolidated = group.every(f => result.duplicateGroups.flat().some(d => d.id === f.id));
        if (alreadyConsolidated) continue;
        result.duplicatesFound++;
        result.totalAfter -= (group.length - 1);
        result.storageSaved += (group.length - 1) * 1024;
        if (!options.dryRun) {
          const consolidatedEntry = group[0]!;
          const previousVersions = group.slice(1).map(e => {
            const { previousVersions: _omit, ...entryWithoutPrev } = e;
            return entryWithoutPrev;
          });
          consolidatedEntry.previousVersions = [
            ...(consolidatedEntry.previousVersions || []),
            ...previousVersions
          ];
          consolidatedEntry.updatedAt = new Date().toISOString();
          consolidatedEntry.version += group.length - 1;
          // Merge metadata
          for (let i = 1; i < group.length; i++) {
            consolidatedEntry.metadata = {
              ...consolidatedEntry.metadata,
              ...group[i]!.metadata,
            };
          }
          const entryFile = path.join(this.fossilDir, 'entries', `${consolidatedEntry.id}.json`);
          await fs.writeFile(entryFile, JSON.stringify(consolidatedEntry, null, 2));
          for (let i = 1; i < group.length; i++) {
            const duplicateFile = path.join(this.fossilDir, 'entries', `${group[i]!.id}.json`);
            try { await fs.unlink(duplicateFile); } catch {}
          }
          const updatedIndex = await this.loadIndex();
          for (let i = 1; i < group.length; i++) {
            delete updatedIndex.entries[group[i]!.id];
          }
          updatedIndex.entries[consolidatedEntry.id] = {
            id: consolidatedEntry.id,
            type: consolidatedEntry.type,
            title: consolidatedEntry.title,
            tags: consolidatedEntry.tags,
            source: consolidatedEntry.source,
            createdAt: consolidatedEntry.createdAt,
            updatedAt: consolidatedEntry.updatedAt,
          };
          updatedIndex.lastUpdated = consolidatedEntry.updatedAt;
          await this.saveIndex(updatedIndex);
        }
        result.consolidated++;
        result.duplicateGroups.push(group.slice(1));
        console.log(`🔍 Consolidated fossils by JSON block: ${group.map(f => f.id).join(', ')}`);
      }
    }

    return result;
  }
}

/**
 * CLI Command Setup
 */
const program = new Command();

program
  .name('context-fossil')
  .description('Manage self-documenting context as fossil storage')
  .version('1.0.0');

// Initialize fossil storage
program
  .command('init')
  .description('Initialize fossil storage')
  .action(async () => {
    try {
      const service = new ContextFossilService();
      await service.initialize();
      console.log('✅ Fossil storage initialized');
    } catch (error) {
      console.error('❌ Error initializing fossil storage:', error);
      process.exit(1);
    }
  });

// Add entry
program
  .command('add')
  .description('Add a new context entry')
  .requiredOption('-t, --type <type>', 'Entry type (knowledge|decision|action|observation|plan|result|insight)')
  .requiredOption('--title <title>', 'Entry title')
  .requiredOption('--content <content>', 'Entry content')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--source <source>', 'Entry source (llm|terminal|api|manual|automated)', 'manual')
  .option('--parent-id <id>', 'Parent entry ID')
  .option('--metadata <metadata>', 'JSON string for additional metadata')
  .action(async (options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();
      let metadata = {};
      if (options.metadata) {
        try {
          metadata = JSON.parse(options.metadata);
        } catch {
          console.error('❌ Invalid JSON for --metadata');
          process.exit(1);
        }
      }
      const entry = await service.addEntry({
        type: options.type as ContextEntry['type'],
        title: options.title,
        content: options.content,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [],
        source: options.source as ContextEntry['source'],
        parentId: options.parentId,
        metadata,
        version: 1,
        children: [],
      });
      console.log('✅ Entry added:', entry.id);
    } catch (error) {
      console.error('❌ Error adding entry:', error);
      process.exit(1);
    }
  });

// Query entries
program
  .command('query')
  .description('Query context entries')
  .option('-t, --type <type>', 'Filter by type')
  .option('--tags <tags>', 'Comma-separated tags to filter by')
  .option('--source <source>', 'Filter by source')
  .option('--search <search>', 'Search in title and content')
  .option('--limit <number>', 'Limit results', '50')
  .option('--offset <number>', 'Offset for pagination', '0')
  .option('--format <format>', 'Output format (json|table)', 'table')
  .action(async (options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      const query: ContextQuery = {
        type: options.type as ContextEntry['type'],
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
        source: options.source as ContextEntry['source'],
        search: options.search,
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
      };

      const entries = await service.queryEntries(query);

      if (options.format === 'json') {
        console.log(JSON.stringify(entries, null, 2));
      } else {
        console.log(`Found ${entries.length} entries:\n`);
        entries.forEach(entry => {
          console.log(`📝 ${entry.title} (${entry.type})`);
          console.log(`   ID: ${entry.id}`);
          console.log(`   Tags: ${entry.tags.join(', ')}`);
          console.log(`   Source: ${entry.source}`);
          console.log(`   Created: ${entry.createdAt}`);
          console.log(`   ${entry.content.substring(0, 100)}...`);
          console.log('');
        });
      }
    } catch (error) {
      console.error('❌ Error querying entries:', error);
      process.exit(1);
    }
  });

// Get entry
program
  .command('get')
  .description('Get a specific entry')
  .argument('<id>', 'Entry ID')
  .action(async (id) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      const entry = await service.getEntry(id);
      if (!entry) {
        console.error('❌ Entry not found');
        process.exit(1);
      }

      console.log(JSON.stringify(entry, null, 2));
    } catch (error) {
      console.error('❌ Error getting entry:', error);
      process.exit(1);
    }
  });

// Update entry
program
  .command('update')
  .description('Update an entry')
  .argument('<id>', 'Entry ID')
  .option('--title <title>', 'New title')
  .option('--content <content>', 'New content')
  .option('--tags <tags>', 'New comma-separated tags')
  .action(async (id, options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      const updates: any = {};
      if (options.title) updates.title = options.title;
      if (options.content) updates.content = options.content;
      if (options.tags) updates.tags = options.tags.split(',').map((t: string) => t.trim());

      const entry = await service.updateEntry(id, updates);
      if (!entry) {
        console.error('❌ Entry not found');
        process.exit(1);
      }

      console.log('✅ Entry updated:', entry.id);
    } catch (error) {
      console.error('❌ Error updating entry:', error);
      process.exit(1);
    }
  });

// Export
program
  .command('export')
  .description('Export fossil storage')
  .requiredOption('-f, --format <format>', 'Export format (json|markdown|csv|yaml)')
  .option('--output <file>', 'Output file path')
  .option('--type <type>', 'Filter by type')
  .option('--tags <tags>', 'Comma-separated tags to filter by')
  .action(async (options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      const query: ContextQuery = {
        type: options.type as ContextEntry['type'],
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
        limit: parseInt(options.limit),
        offset: 0,
      };

      const exportPath = await service.export(options.format as any, query);
      console.log(`✅ Export completed: ${exportPath}`);
    } catch (error) {
      console.error('❌ Error exporting:', error);
      process.exit(1);
    }
  });

// Statistics
program
  .command('stats')
  .description('Show fossil storage statistics')
  .action(async () => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      const stats = await service.getStatistics();
      console.log('📊 Fossil Storage Statistics\n');
      console.log(`Total Entries: ${stats.totalEntries}`);
      console.log(`Last Updated: ${stats.lastUpdated}`);
      console.log(`Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB\n`);

      console.log('By Type:');
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\nBy Source:');
      Object.entries(stats.bySource).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });

      console.log('\nTop Tags:');
      Object.entries(stats.byTag)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([tag, count]) => {
          console.log(`  ${tag}: ${count}`);
        });
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      process.exit(1);
    }
  });

// Context summary for LLMs
program
  .command('summary')
  .description('Generate context summary for LLMs')
  .option('--type <type>', 'Filter by type')
  .option('--tags <tags>', 'Comma-separated tags to filter by')
  .option('--limit <number>', 'Limit entries for summary', '100')
  .action(async (options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      const query: ContextQuery = {
        type: options.type as ContextEntry['type'],
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
        limit: parseInt(options.limit),
        offset: 0,
      };

      const summary = await service.generateContextSummary(query);
      console.log(summary);
    } catch (error) {
      console.error('❌ Error generating summary:', error);
      process.exit(1);
    }
  });

// Cleanup duplicates
program
  .command('cleanup')
  .description('Clean up duplicate fossils and consolidate them')
  .option('--dry-run', 'Show what would be cleaned up without making changes', false)
  .option('--backup', 'Create backup before cleanup', true)
  .option('--similarity-threshold <number>', 'Similarity threshold for consolidation', '80')
  .option('--report-file <file>', 'Output cleanup report to file')
  .action(async (options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      console.log('🧹 Starting fossil cleanup process...\n');

      // Create backup if requested
      if (options.backup) {
        const backupName = `cleanup-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        console.log(`📦 Creating backup: ${backupName}`);
        await service.createSnapshot(backupName);
        console.log('✅ Backup created successfully\n');
      }

      // Perform cleanup
      const cleanupResult = await service.cleanupDuplicates({
        dryRun: options.dryRun,
        similarityThreshold: parseInt(options.similarityThreshold),
      });

      // Display results
      console.log('📊 Cleanup Results:');
      console.log(`   Total fossils before: ${cleanupResult.totalBefore}`);
      console.log(`   Total fossils after: ${cleanupResult.totalAfter}`);
      console.log(`   Duplicates found: ${cleanupResult.duplicatesFound}`);
      console.log(`   Fossils consolidated: ${cleanupResult.consolidated}`);
      console.log(`   Storage saved: ${(cleanupResult.storageSaved / 1024).toFixed(2)} KB\n`);

      if (cleanupResult.duplicateGroups.length > 0) {
        console.log('🔍 Duplicate Groups Found:');
        cleanupResult.duplicateGroups.forEach((group, index) => {
          console.log(`   Group ${index + 1}:`);
          group.forEach(fossil => {
            console.log(`     - ${fossil.id}: "${fossil.title}" (${fossil.content.substring(0, 50)}...)`);
          });
          console.log('');
        });
      }

      // Save report if requested
      if (options.reportFile) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.reportFile, JSON.stringify(cleanupResult, null, 2));
        console.log(`📄 Cleanup report saved to: ${options.reportFile}`);
      }

      if (options.dryRun) {
        console.log('🔍 This was a dry run. No changes were made.');
        console.log('   Run without --dry-run to perform actual cleanup.');
      } else {
        console.log('✅ Cleanup completed successfully!');
      }

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  });

// Enhance existing fossils with intelligent tags
program
  .command('enhance')
  .description('Enhance existing fossils with intelligent semantic tags')
  .option('--dry-run', 'Show what would be enhanced without making changes', false)
  .option('--entry-id <id>', 'Enhance specific entry by ID')
  .option('--all', 'Enhance all existing fossils', false)
  .action(async (options) => {
    try {
      const service = new ContextFossilService();
      await service.initialize();

      console.log('🧠 Starting fossil enhancement process...\n');

      if (options.entryId) {
        // Enhance specific entry
        const entry = await service.getEntry(options.entryId);
        if (!entry) {
          console.error(`❌ Entry not found: ${options.entryId}`);
          process.exit(1);
        }

        console.log(`📝 Enhancing entry: ${entry.title}`);
        const enhanced = await service.enhanceEntryWithTags(entry, options.dryRun);
        
        if (!options.dryRun) {
          console.log('✅ Entry enhanced successfully');
          console.log(`   Semantic Category: ${enhanced.semanticTags?.semanticCategory}`);
          console.log(`   Concepts: ${enhanced.semanticTags?.concepts?.join(', ')}`);
          console.log(`   Priority: ${enhanced.semanticTags?.priority}`);
          console.log(`   Sentiment: ${enhanced.semanticTags?.sentiment}`);
        }
      } else if (options.all) {
        // Enhance all entries
        const allEntries = await service.getAllEntries();
        console.log(`📊 Found ${allEntries.length} entries to enhance\n`);

        let enhanced = 0;
        for (const entry of allEntries) {
          console.log(`📝 Enhancing: ${entry.title}`);
          await service.enhanceEntryWithTags(entry, options.dryRun);
          enhanced++;
        }

        console.log(`\n✅ Enhanced ${enhanced} entries`);
      } else {
        console.error('❌ Please specify --entry-id <id> or --all');
        process.exit(1);
      }

      if (options.dryRun) {
        console.log('\n🔍 This was a dry run. No changes were made.');
        console.log('   Run without --dry-run to perform actual enhancement.');
      }

    } catch (error) {
      console.error('❌ Error during enhancement:', error);
      process.exit(1);
    }
  });

// List fossils
program
  .command('list')
  .description('List fossils with optional filtering by type and tags')
  .option('--type <type>', 'Fossil type to filter by')
  .option('--tags <tags>', 'Comma-separated list of tags to filter by')
  .option('--json', 'Output as JSON array')
  .action(async (options) => {
    try {
      let summary = await getFossilSummary();
      if (options.type) {
        summary = summary.filter(f => f.type === options.type);
      }
      if (options.tags) {
        const tagList = options.tags.split(',').map((t: string) => t.trim());
        summary = summary.filter(f => tagList.every((tag: string) => f.tags.includes(tag)));
      }
      if (summary.length === 0) {
        console.log('No fossils found matching the criteria.');
        return;
      }
      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }
      const tableData = summary.map(f => ({
        Type: f.type,
        Title: f.title,
        Created: f.createdAt,
        Tags: f.tags.join(', '),
        Excerpt: f.excerpt
      }));
      console.table(tableData);
    } catch (error) {
      console.error('Error listing fossils:', error);
      process.exit(1);
    }
  });

// Only run the CLI if this file is executed directly
if (import.meta.main) {
  // All CLI command registration and program.parse() should be inside this block
  program.parse();
} 