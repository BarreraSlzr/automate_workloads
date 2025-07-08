#!/usr/bin/env bun

/**
 * Fossil Creation Analysis Script
 * Analyzes rapid fossil creation patterns and identifies potential issues
 * 
 * Usage: bun run scripts/analyze-fossil-creation.ts
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Schema for fossil analysis
const FossilAnalysisSchema = z.object({
  timestamp: z.string(),
  overallHealth: z.object({
    overallScore: z.number(),
    testReliability: z.number(),
    performanceStability: z.number(),
    memoryEfficiency: z.number(),
    errorRate: z.number(),
    hangingTestRate: z.number(),
    averageTestDuration: z.number(),
    totalIssues: z.number(),
    criticalIssues: z.number()
  }),
  tasks: z.array(z.object({
    taskId: z.string(),
    name: z.string(),
    status: z.string(),
    lastRun: z.string(),
    successRate: z.number(),
    averageDuration: z.number(),
    issues: z.array(z.any()),
    recommendations: z.array(z.string())
  })),
  issues: z.array(z.any()),
  trends: z.object({
    testDuration: z.string(),
    errorRate: z.string(),
    hangingTests: z.string()
  }),
  recommendations: z.array(z.string())
});

interface FossilAnalysis {
  timestamp: string;
  overallHealth: {
    overallScore: number;
    testReliability: number;
    performanceStability: number;
    memoryEfficiency: number;
    errorRate: number;
    hangingTestRate: number;
    averageTestDuration: number;
    totalIssues: number;
    criticalIssues: number;
  };
  tasks: Array<{
    taskId: string;
    name: string;
    status: string;
    lastRun: string;
    successRate: number;
    averageDuration: number;
    issues: any[];
    recommendations: string[];
  }>;
  issues: any[];
  trends: {
    testDuration: string;
    errorRate: string;
    hangingTests: string;
  };
  recommendations: string[];
}

interface FossilCreationPattern {
  directory: string;
  totalFiles: number;
  timeRange: {
    start: string;
    end: string;
    duration: number; // in seconds
  };
  creationRate: number; // files per second
  fileTypes: Record<string, number>;
  sizeDistribution: {
    min: number;
    max: number;
    average: number;
    total: number;
  };
  potentialIssues: string[];
}

class FossilCreationAnalyzer {
  private fossilsDir = 'fossils';
  private analysisDir = join(this.fossilsDir, 'analysis');

  /**
   * Analyze fossil creation patterns
   */
  async analyzeCreationPatterns(): Promise<FossilCreationPattern[]> {
    console.log('🔍 Analyzing fossil creation patterns...\n');

    const patterns: FossilCreationPattern[] = [];

    // Analyze analysis fossils (most concerning)
    const analysisPattern = await this.analyzeDirectory(this.analysisDir);
    if (analysisPattern) {
      patterns.push(analysisPattern);
    }

    // Analyze other fossil directories
    const fossilDirs = this.getFossilDirectories();
    for (const dir of fossilDirs) {
      if (dir !== 'analysis') {
        const pattern = await this.analyzeDirectory(join(this.fossilsDir, dir));
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Analyze a specific directory for fossil creation patterns
   */
  private async analyzeDirectory(dirPath: string): Promise<FossilCreationPattern | null> {
    try {
      const files = readdirSync(dirPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);

      if (files.length === 0) return null;

      // Parse timestamps from filenames
      const fileInfo = files
        .map(filename => {
          const timestamp = this.extractTimestamp(filename);
          const filePath = join(dirPath, filename);
          const stats = statSync(filePath);
          return {
            filename,
            timestamp,
            size: stats.size,
            mtime: stats.mtime
          };
        })
        .filter(info => info.timestamp !== null)
        .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());

      if (fileInfo.length === 0) return null;

      const timeRange = {
        start: fileInfo[0]?.timestamp || '',
        end: fileInfo[fileInfo.length - 1]?.timestamp || '',
        duration: (new Date(fileInfo[fileInfo.length - 1]?.timestamp || '').getTime() - 
                  new Date(fileInfo[0]?.timestamp || '').getTime()) / 1000
      };

      const creationRate = timeRange.duration > 0 ? fileInfo.length / timeRange.duration : 0;

      // Analyze file types
      const fileTypes: Record<string, number> = {};
      fileInfo.forEach(info => {
        const parts = info.filename.split('.');
        const ext = parts.length > 1 ? parts[parts.length - 1] : 'unknown';
        if (ext) {
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      });

      // Analyze size distribution
      const sizes = fileInfo.map(info => info.size);
      const sizeDistribution = {
        min: sizes.length > 0 ? Math.min(...sizes) : 0,
        max: sizes.length > 0 ? Math.max(...sizes) : 0,
        average: sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0,
        total: sizes.reduce((a, b) => a + b, 0)
      };

      // Identify potential issues
      const potentialIssues: string[] = [];
      if (creationRate > 1) {
        potentialIssues.push(`High creation rate: ${creationRate.toFixed(2)} files/second`);
      }
      if (fileInfo.length > 100) {
        potentialIssues.push(`Large number of files: ${fileInfo.length}`);
      }
      if (sizeDistribution.average > 1024 * 1024) { // 1MB
        potentialIssues.push(`Large average file size: ${(sizeDistribution.average / 1024 / 1024).toFixed(2)}MB`);
      }

      return {
        directory: dirPath,
        totalFiles: fileInfo.length,
        timeRange,
        creationRate,
        fileTypes,
        sizeDistribution,
        potentialIssues
      };

    } catch (error) {
      console.warn(`⚠️  Could not analyze directory ${dirPath}:`, error);
      return null;
    }
  }

  /**
   * Extract timestamp from filename
   */
  private extractTimestamp(filename: string): string | null {
    // Match patterns like: analysis-2025-07-05T22-30-41-973Z.json
    const timestampMatch = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (timestampMatch && timestampMatch[1]) {
      return timestampMatch[1].replace(/-/g, ':').replace('T', 'T').replace('Z', 'Z');
    }
    return null;
  }

  /**
   * Get all fossil directories
   */
  private getFossilDirectories(): string[] {
    try {
      return readdirSync(this.fossilsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch (error) {
      console.warn('⚠️  Could not read fossils directory:', error);
      return [];
    }
  }

  /**
   * Analyze recent fossil content for patterns
   */
  async analyzeRecentFossils(limit: number = 5): Promise<void> {
    console.log(`\n📊 Analyzing ${limit} most recent fossils...\n`);

    try {
      const files = readdirSync(this.analysisDir)
        .filter(filename => filename.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, limit);

      for (const filename of files) {
        const filePath = join(this.analysisDir, filename);
        try {
          const content = readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          // Validate with schema
          const validated = FossilAnalysisSchema.parse(data);
          
          console.log(`📄 ${filename}:`);
          console.log(`   Overall Score: ${validated.overallHealth.overallScore}/100`);
          console.log(`   Test Reliability: ${validated.overallHealth.testReliability}%`);
          console.log(`   Total Issues: ${validated.overallHealth.totalIssues}`);
          console.log(`   Critical Issues: ${validated.overallHealth.criticalIssues}`);
          console.log(`   Tasks: ${validated.tasks.length}`);
          console.log(`   Recommendations: ${validated.recommendations.length}`);
          console.log('');
          
        } catch (error) {
          console.warn(`⚠️  Could not parse ${filename}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error analyzing recent fossils:', error);
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(patterns: FossilCreationPattern[]): string[] {
    const recommendations: string[] = [];

    for (const pattern of patterns) {
      if (pattern.creationRate > 1) {
        recommendations.push(`🚨 HIGH PRIORITY: ${pattern.directory} has creation rate of ${pattern.creationRate.toFixed(2)} files/second`);
        recommendations.push(`   - Investigate automated monitoring scripts`);
        recommendations.push(`   - Add rate limiting to fossil creation`);
        recommendations.push(`   - Review monitoring configuration`);
      }

      if (pattern.totalFiles > 100) {
        recommendations.push(`📊 MEDIUM PRIORITY: ${pattern.directory} has ${pattern.totalFiles} files`);
        recommendations.push(`   - Consider implementing fossil cleanup policies`);
        recommendations.push(`   - Review fossil retention strategy`);
      }

      if (pattern.sizeDistribution.average > 1024 * 1024) {
        recommendations.push(`💾 MEDIUM PRIORITY: Large average file size in ${pattern.directory}`);
        recommendations.push(`   - Consider splitting large fossils`);
        recommendations.push(`   - Review fossil content structure`);
      }
    }

    return recommendations;
  }

  /**
   * Run complete analysis
   */
  async run(): Promise<void> {
    console.log('🔍 Fossil Creation Pattern Analysis\n');
    console.log('=' .repeat(60));

    // Analyze creation patterns
    const patterns = await this.analyzeCreationPatterns();
    
    console.log('\n📊 Creation Pattern Analysis:');
    console.log('=' .repeat(60));
    
    for (const pattern of patterns) {
      console.log(`\n📁 Directory: ${pattern.directory}`);
      console.log(`   Total Files: ${pattern.totalFiles}`);
      console.log(`   Time Range: ${pattern.timeRange.start} to ${pattern.timeRange.end}`);
      console.log(`   Duration: ${pattern.timeRange.duration.toFixed(2)} seconds`);
      console.log(`   Creation Rate: ${pattern.creationRate.toFixed(2)} files/second`);
      console.log(`   File Types: ${Object.entries(pattern.fileTypes).map(([k, v]) => `${k}:${v}`).join(', ')}`);
      console.log(`   Size Distribution: ${(pattern.sizeDistribution.average / 1024).toFixed(2)}KB average`);
      
      if (pattern.potentialIssues.length > 0) {
        console.log(`   ⚠️  Issues: ${pattern.potentialIssues.join(', ')}`);
      }
    }

    // Analyze recent fossil content
    await this.analyzeRecentFossils(3);

    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns);
    
    console.log('\n💡 Recommendations:');
    console.log('=' .repeat(60));
    
    if (recommendations.length === 0) {
      console.log('✅ No issues detected - fossil creation patterns look normal');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Analysis complete');
  }
}

// Main execution
async function main() {
  const analyzer = new FossilCreationAnalyzer();
  await analyzer.run();
}

if (import.meta.main) {
  main().catch(console.error);
} 