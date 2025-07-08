#!/usr/bin/env bun

/**
 * Fossil Audit Utility
 * Comprehensive audit of fossil timestamp usage, deduplication, and state analysis
 * 
 * Usage: bun run scripts/fossil-audit.ts [OPTIONS]
 * 
 * Options:
 *   --analyze-timestamps    Analyze timestamp patterns and usage
 *   --check-deduplication   Check for duplicate fossils
 *   --audit-state          Audit overall fossil state
 *   --monitor-bun-test     Monitor bun test fossil creation
 *   --output <format>      Output format: json, markdown, table
 *   --verbose              Verbose output
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { z } from 'zod';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface FossilAuditConfig {
  analyzeTimestamps: boolean;
  checkDeduplication: boolean;
  auditState: boolean;
  monitorBunTest: boolean;
  outputFormat: 'json' | 'markdown' | 'table';
  verbose: boolean;
}

interface TimestampPattern {
  pattern: string;
  regex: RegExp;
  examples: string[];
  count: number;
  directories: string[];
}

interface FossilInfo {
  filename: string;
  path: string;
  timestamp: string | null;
  timestampPattern: string | null;
  size: number;
  mtime: Date;
  type: string;
  directory: string;
}

interface DuplicateGroup {
  hash: string;
  files: FossilInfo[];
  count: number;
  totalSize: number;
  recommendations: string[];
}

interface FossilState {
  totalFiles: number;
  totalSize: number;
  directories: Record<string, { count: number; size: number; patterns: string[] }>;
  timestampPatterns: TimestampPattern[];
  duplicates: DuplicateGroup[];
  recentActivity: FossilInfo[];
  recommendations: string[];
}

interface BunTestMonitorResult {
  sessionId: string;
  startTime: string;
  endTime: string;
  fossilsCreated: number;
  fossilsDeleted: number;
  patterns: string[];
  performance: {
    averageCreationTime: number;
    peakCreationRate: number;
    memoryUsage: number;
  };
}

// ============================================================================
// FOSSIL AUDIT CLASS
// ============================================================================

export class FossilAuditor {
  private config: FossilAuditConfig;
  private fossilsDir = 'fossils';
  private timestampPatterns: TimestampPattern[] = [
    {
      pattern: 'ISO-8601 with milliseconds',
      regex: /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/,
      examples: [],
      count: 0,
      directories: []
    },
    {
      pattern: 'ISO-8601 without milliseconds',
      regex: /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/,
      examples: [],
      count: 0,
      directories: []
    },
    {
      pattern: 'Date only',
      regex: /\d{4}-\d{2}-\d{2}/,
      examples: [],
      count: 0,
      directories: []
    },
    {
      pattern: 'Unix timestamp',
      regex: /\d{10,13}/,
      examples: [],
      count: 0,
      directories: []
    }
  ];

  constructor(config: Partial<FossilAuditConfig> = {}) {
    this.config = {
      analyzeTimestamps: true,
      checkDeduplication: true,
      auditState: true,
      monitorBunTest: false,
      outputFormat: 'markdown',
      verbose: false,
      ...config
    };
  }

  /**
   * Run comprehensive fossil audit
   */
  async runAudit(): Promise<FossilState> {
    console.log('🔍 Starting comprehensive fossil audit...\n');

    const allFossils = await this.scanAllFossils();
    
    const state: FossilState = {
      totalFiles: allFossils.length,
      totalSize: allFossils.reduce((sum, f) => sum + f.size, 0),
      directories: {},
      timestampPatterns: [],
      duplicates: [],
      recentActivity: [],
      recommendations: []
    };

    // Analyze directories
    state.directories = this.analyzeDirectories(allFossils);

    // Analyze timestamp patterns
    if (this.config.analyzeTimestamps) {
      state.timestampPatterns = this.analyzeTimestampPatterns(allFossils);
    }

    // Check for duplicates
    if (this.config.checkDeduplication) {
      state.duplicates = this.findDuplicates(allFossils);
    }

    // Get recent activity
    state.recentActivity = this.getRecentActivity(allFossils);

    // Generate recommendations
    state.recommendations = this.generateRecommendations(state);

    return state;
  }

  /**
   * Scan all fossils in the fossils directory
   */
  private async scanAllFossils(): Promise<FossilInfo[]> {
    const fossils: FossilInfo[] = [];

    if (!existsSync(this.fossilsDir)) {
      console.warn('⚠️  Fossils directory not found');
      return fossils;
    }

    const scanDirectory = (dirPath: string, relativePath: string = ''): void => {
      try {
        const entries = readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          const relativeFilePath = relativePath ? join(relativePath, entry.name) : entry.name;
          
          if (entry.isDirectory()) {
            scanDirectory(fullPath, relativeFilePath);
          } else if (entry.isFile()) {
            const stats = statSync(fullPath);
            const timestamp = this.extractTimestamp(entry.name);
            const timestampPattern = this.identifyTimestampPattern(entry.name);
            
            fossils.push({
              filename: entry.name,
              path: relativeFilePath,
              timestamp,
              timestampPattern,
              size: stats.size,
              mtime: stats.mtime,
              type: extname(entry.name).slice(1),
              directory: relativePath || 'root'
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error scanning directory ${dirPath}:`, error);
      }
    };

    scanDirectory(this.fossilsDir);
    return fossils;
  }

  /**
   * Extract timestamp from filename
   */
  private extractTimestamp(filename: string): string | null {
    for (const pattern of this.timestampPatterns) {
      const match = filename.match(pattern.regex);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Identify timestamp pattern used in filename
   */
  private identifyTimestampPattern(filename: string): string | null {
    for (const pattern of this.timestampPatterns) {
      if (pattern.regex.test(filename)) {
        return pattern.pattern;
      }
    }
    return null;
  }

  /**
   * Analyze directory structure and usage
   */
  private analyzeDirectories(fossils: FossilInfo[]): Record<string, { count: number; size: number; patterns: string[] }> {
    const directories: Record<string, { count: number; size: number; patterns: string[] }> = {};

    for (const fossil of fossils) {
      if (!directories[fossil.directory]) {
        directories[fossil.directory] = { count: 0, size: 0, patterns: [] };
      }
      
      const dir = directories[fossil.directory];
      if (dir) {
        dir.count++;
        dir.size += fossil.size;
        
        if (fossil.timestampPattern && !dir.patterns.includes(fossil.timestampPattern)) {
          dir.patterns.push(fossil.timestampPattern);
        }
      }
    }

    return directories;
  }

  /**
   * Analyze timestamp patterns across all fossils
   */
  private analyzeTimestampPatterns(fossils: FossilInfo[]): TimestampPattern[] {
    const patterns = this.timestampPatterns.map(p => ({ 
      ...p, 
      examples: [] as string[], 
      count: 0, 
      directories: [] as string[] 
    }));

    for (const fossil of fossils) {
      if (fossil.timestampPattern) {
        const pattern = patterns.find(p => p.pattern === fossil.timestampPattern);
        if (pattern) {
          pattern.count++;
          if (pattern.examples.length < 5) {
            pattern.examples.push(fossil.filename);
          }
          if (!pattern.directories.includes(fossil.directory)) {
            pattern.directories.push(fossil.directory);
          }
        }
      }
    }

    return patterns.filter(p => p.count > 0);
  }

  /**
   * Find duplicate fossils based on content hash
   */
  private findDuplicates(fossils: FossilInfo[]): DuplicateGroup[] {
    const hashGroups: Record<string, FossilInfo[]> = {};
    const duplicates: DuplicateGroup[] = [];

    // Group by size first (quick filter)
    const sizeGroups: Record<number, FossilInfo[]> = {};
    for (const fossil of fossils) {
      if (!sizeGroups[fossil.size]) {
        sizeGroups[fossil.size] = [];
      }
      const group = sizeGroups[fossil.size];
      if (group) {
        group.push(fossil);
      }
    }

    // For files with same size, check content
    for (const [size, files] of Object.entries(sizeGroups)) {
      if (files.length > 1) {
        for (const file of files) {
          try {
            const content = readFileSync(join(this.fossilsDir, file.path), 'utf-8');
            const hash = this.simpleHash(content);
            
            if (!hashGroups[hash]) {
              hashGroups[hash] = [];
            }
            hashGroups[hash].push(file);
          } catch (error) {
            // Skip files that can't be read
            if (this.config.verbose) {
              console.warn(`⚠️  Could not read ${file.path}:`, error);
            }
          }
        }
      }
    }

    // Create duplicate groups
    for (const [hash, files] of Object.entries(hashGroups)) {
      if (files.length > 1) {
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const recommendations = this.generateDuplicateRecommendations(files);
        
        duplicates.push({
          hash,
          files,
          count: files.length,
          totalSize,
          recommendations
        });
      }
    }

    return duplicates.sort((a, b) => b.count - a.count);
  }

  /**
   * Simple hash function for content comparison
   */
  private simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Generate recommendations for duplicate fossils
   */
  private generateDuplicateRecommendations(files: FossilInfo[]): string[] {
    const recommendations: string[] = [];
    
    if (files.length > 2) {
      recommendations.push(`Consider implementing deduplication for ${files.length} identical files`);
    }
    
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 1024 * 1024) { // 1MB
      recommendations.push(`Large duplicate set: ${(totalSize / 1024 / 1024).toFixed(2)}MB total`);
    }
    
    const directories = [...new Set(files.map(f => f.directory))];
    if (directories.length > 1) {
      recommendations.push(`Duplicates found across ${directories.length} directories`);
    }
    
    return recommendations;
  }

  /**
   * Get recent fossil activity
   */
  private getRecentActivity(fossils: FossilInfo[]): FossilInfo[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return fossils
      .filter(f => f.mtime > oneHourAgo)
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, 10);
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(state: FossilState): string[] {
    const recommendations: string[] = [];

    // Size recommendations
    if (state.totalSize > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Large fossil repository detected - consider cleanup policies');
    }

    // Directory recommendations
    const largeDirs = Object.entries(state.directories)
      .filter(([_, stats]) => stats.size > 10 * 1024 * 1024) // 10MB
      .map(([dir, _]) => dir);
    
    if (largeDirs.length > 0) {
      recommendations.push(`Large directories detected: ${largeDirs.join(', ')}`);
    }

    // Duplicate recommendations
    if (state.duplicates.length > 0) {
      const totalDuplicateSize = state.duplicates.reduce((sum, d) => sum + d.totalSize, 0);
      recommendations.push(`Found ${state.duplicates.length} duplicate groups (${(totalDuplicateSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Pattern recommendations
    const multiplePatterns = state.timestampPatterns.filter(p => p.count > 10);
    if (multiplePatterns.length > 1) {
      recommendations.push('Multiple timestamp patterns detected - consider standardization');
    }

    // Recent activity recommendations
    if (state.recentActivity.length > 5) {
      recommendations.push('High recent fossil creation activity detected');
    }

    return recommendations;
  }

  /**
   * Monitor bun test fossil creation
   */
  async monitorBunTest(): Promise<BunTestMonitorResult> {
    console.log('🧪 Monitoring bun test fossil creation...\n');

    const sessionId = `bun-test-${Date.now()}`;
    const startTime = new Date().toISOString();
    
    // Get initial fossil count
    const initialFossils = await this.scanAllFossils();
    const initialCount = initialFossils.length;

    console.log(`📊 Initial fossil count: ${initialCount}`);
    console.log('⏳ Starting bun test monitoring...\n');

    // Monitor for 30 seconds
    const monitoringDuration = 30000; // 30 seconds
    const checkInterval = 5000; // 5 seconds
    const startTimeMs = Date.now();
    
    let peakCreationRate = 0;
    let totalCreated = 0;
    let lastCount = initialCount;

    while (Date.now() - startTimeMs < monitoringDuration) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      const currentFossils = await this.scanAllFossils();
      const currentCount = currentFossils.length;
      const created = Math.max(0, currentCount - lastCount);
      
      if (created > 0) {
        const rate = created / (checkInterval / 1000); // per second
        peakCreationRate = Math.max(peakCreationRate, rate);
        totalCreated += created;
        
        if (this.config.verbose) {
          console.log(`📈 Created ${created} fossils (${rate.toFixed(2)}/sec)`);
        }
      }
      
      lastCount = currentCount;
    }

    const endTime = new Date().toISOString();
    const finalFossils = await this.scanAllFossils();
    const finalCount = finalFossils.length;
    const totalDeleted = Math.max(0, initialCount - finalCount + totalCreated);

    // Analyze patterns
    const newFossils = finalFossils.filter(f => 
      new Date(f.mtime).getTime() > startTimeMs
    );
    const patterns = [...new Set(newFossils.map(f => f.timestampPattern).filter(Boolean))];

    return {
      sessionId,
      startTime,
      endTime,
      fossilsCreated: totalCreated,
      fossilsDeleted: totalDeleted,
      patterns: patterns.filter((p): p is string => p !== null),
      performance: {
        averageCreationTime: totalCreated > 0 ? monitoringDuration / totalCreated : 0,
        peakCreationRate,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
      }
    };
  }

  /**
   * Format audit results
   */
  formatResults(state: FossilState, bunTestResult?: BunTestMonitorResult): string {
    switch (this.config.outputFormat) {
      case 'json':
        return JSON.stringify({ state, bunTestResult }, null, 2);
      case 'table':
        return this.formatAsTable(state, bunTestResult);
      case 'markdown':
      default:
        return this.formatAsMarkdown(state, bunTestResult);
    }
  }

  /**
   * Format results as markdown
   */
  private formatAsMarkdown(state: FossilState, bunTestResult?: BunTestMonitorResult): string {
    let output = '# Fossil Audit Report\n\n';
    output += `**Generated:** ${new Date().toISOString()}\n\n`;

    // Summary
    output += '## 📊 Summary\n\n';
    output += `- **Total Files:** ${state.totalFiles}\n`;
    output += `- **Total Size:** ${(state.totalSize / 1024 / 1024).toFixed(2)}MB\n`;
    output += `- **Directories:** ${Object.keys(state.directories).length}\n`;
    output += `- **Duplicate Groups:** ${state.duplicates.length}\n`;
    output += `- **Recent Activity:** ${state.recentActivity.length} files\n\n`;

    // Directory analysis
    output += '## 📁 Directory Analysis\n\n';
    output += '| Directory | Files | Size (MB) | Patterns |\n';
    output += '|-----------|-------|-----------|----------|\n';
    
    for (const [dir, stats] of Object.entries(state.directories)) {
      output += `| ${dir} | ${stats.count} | ${(stats.size / 1024 / 1024).toFixed(2)} | ${stats.patterns.join(', ')} |\n`;
    }
    output += '\n';

    // Timestamp patterns
    if (state.timestampPatterns.length > 0) {
      output += '## ⏰ Timestamp Patterns\n\n';
      output += '| Pattern | Count | Directories | Examples |\n';
      output += '|---------|-------|-------------|----------|\n';
      
      for (const pattern of state.timestampPatterns) {
        output += `| ${pattern.pattern} | ${pattern.count} | ${pattern.directories.join(', ')} | ${pattern.examples.slice(0, 2).join(', ')} |\n`;
      }
      output += '\n';
    }

    // Duplicates
    if (state.duplicates.length > 0) {
      output += '## 🔄 Duplicate Analysis\n\n';
      output += '| Group | Files | Size (MB) | Recommendations |\n';
      output += '|-------|-------|-----------|-----------------|\n';
      
      for (const duplicate of state.duplicates.slice(0, 5)) {
        output += `| ${duplicate.hash.slice(0, 8)} | ${duplicate.count} | ${(duplicate.totalSize / 1024 / 1024).toFixed(2)} | ${duplicate.recommendations.join(', ')} |\n`;
      }
      output += '\n';
    }

    // Recent activity
    if (state.recentActivity.length > 0) {
      output += '## 🕒 Recent Activity\n\n';
      output += '| File | Directory | Size | Modified |\n';
      output += '|------|-----------|------|----------|\n';
      
      for (const fossil of state.recentActivity) {
        output += `| ${fossil.filename} | ${fossil.directory} | ${(fossil.size / 1024).toFixed(1)}KB | ${fossil.mtime.toISOString()} |\n`;
      }
      output += '\n';
    }

    // Bun test monitoring
    if (bunTestResult) {
      output += '## 🧪 Bun Test Monitoring\n\n';
      output += `- **Session ID:** ${bunTestResult.sessionId}\n`;
      output += `- **Duration:** ${bunTestResult.startTime} to ${bunTestResult.endTime}\n`;
      output += `- **Fossils Created:** ${bunTestResult.fossilsCreated}\n`;
      output += `- **Fossils Deleted:** ${bunTestResult.fossilsDeleted}\n`;
      output += `- **Peak Creation Rate:** ${bunTestResult.performance.peakCreationRate.toFixed(2)}/sec\n`;
      output += `- **Memory Usage:** ${bunTestResult.performance.memoryUsage.toFixed(2)}MB\n`;
      output += `- **Patterns:** ${bunTestResult.patterns.join(', ')}\n\n`;
    }

    // Recommendations
    if (state.recommendations.length > 0) {
      output += '## 💡 Recommendations\n\n';
      for (const rec of state.recommendations) {
        output += `- ${rec}\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Format results as table
   */
  private formatAsTable(state: FossilState, bunTestResult?: BunTestMonitorResult): string {
    // Implementation for table format
    return this.formatAsMarkdown(state, bunTestResult); // Fallback to markdown for now
  }
}

// ============================================================================
// CLI PARSING
// ============================================================================

function parseCLIArgs(): FossilAuditConfig {
  const args = process.argv.slice(2);
  const config: FossilAuditConfig = {
    analyzeTimestamps: true,
    checkDeduplication: true,
    auditState: true,
    monitorBunTest: false,
    outputFormat: 'markdown',
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--analyze-timestamps':
        config.analyzeTimestamps = true;
        break;
      case '--check-deduplication':
        config.checkDeduplication = true;
        break;
      case '--audit-state':
        config.auditState = true;
        break;
      case '--monitor-bun-test':
        config.monitorBunTest = true;
        break;
      case '--output':
        const format = args[i + 1];
        if (format && ['json', 'markdown', 'table'].includes(format)) {
          config.outputFormat = format as any;
          i++;
        }
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  return config;
}

function showHelp(): void {
  console.log(`
Fossil Audit Utility

Usage: bun run scripts/fossil-audit.ts [OPTIONS]

Options:
  --analyze-timestamps    Analyze timestamp patterns and usage
  --check-deduplication   Check for duplicate fossils
  --audit-state          Audit overall fossil state
  --monitor-bun-test     Monitor bun test fossil creation
  --output <format>      Output format: json, markdown, table
  --verbose              Verbose output
  --help                 Show this help message

Examples:
  bun run scripts/fossil-audit.ts
  bun run scripts/fossil-audit.ts --monitor-bun-test --output json
  bun run scripts/fossil-audit.ts --check-deduplication --verbose
`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const config = parseCLIArgs();
  const auditor = new FossilAuditor(config);

  try {
    if (config.monitorBunTest) {
      const bunTestResult = await auditor.monitorBunTest();
      console.log('\n📊 Bun Test Monitoring Results:');
      console.log(auditor.formatResults({} as FossilState, bunTestResult));
    } else {
      const state = await auditor.runAudit();
      console.log('\n📊 Fossil Audit Results:');
      console.log(auditor.formatResults(state));
    }
  } catch (error) {
    console.error('❌ Fossil audit failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
} 