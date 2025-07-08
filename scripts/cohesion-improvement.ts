#!/usr/bin/env bun

/**
 * @fileoverview Cohesion Improvement Script
 * @description Analyzes utility cohesion and generates improvement recommendations
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { glob } from 'glob';

interface UtilityAnalysis {
  file: string;
  size: number;
  exports: string[];
  imports: string[];
  dependencies: string[];
  cohesionScore: number;
  consolidationCandidates: string[];
}

interface CohesionReport {
  summary: {
    totalUtilities: number;
    averageSize: number;
    averageCohesionScore: number;
    consolidationOpportunities: number;
    typeViolations: number;
  };
  utilities: UtilityAnalysis[];
  recommendations: string[];
  consolidationPlan: ConsolidationPlan[];
}

interface ConsolidationPlan {
  type: 'merge' | 'split' | 'move' | 'refactor';
  files: string[];
  reason: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

class CohesionAnalyzer {
  private utilsDir = 'src/utils/';
  private typesDir = 'src/types/';

  async analyzeCohesion(): Promise<CohesionReport> {
    console.log('🔍 Analyzing utility cohesion...');
    
    const utilityFiles = await this.getUtilityFiles();
    const utilities = await Promise.all(
      utilityFiles.map(file => this.analyzeUtility(file))
    );
    
    const summary = this.calculateSummary(utilities);
    const recommendations = this.generateRecommendations(utilities);
    const consolidationPlan = this.createConsolidationPlan(utilities);
    
    return {
      summary,
      utilities,
      recommendations,
      consolidationPlan
    };
  }

  private async getUtilityFiles(): Promise<string[]> {
    const files = await glob('src/utils/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });
    return files.sort();
  }

  private async analyzeUtility(file: string): Promise<UtilityAnalysis> {
    const content = await readFile(file, 'utf-8');
    const stats = await stat(file);
    
    const exports = this.extractExports(content);
    const imports = this.extractImports(content);
    const dependencies = this.extractDependencies(content);
    const cohesionScore = this.calculateCohesionScore(content, exports, dependencies);
    const consolidationCandidates = this.findConsolidationCandidates(file, content);
    
    return {
      file,
      size: stats.size,
      exports,
      imports,
      dependencies,
      cohesionScore,
      consolidationCandidates
    };
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:function|class|const|interface|type)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      }
    }
    
    return exports;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }
    
    return imports;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    
    while ((match = requireRegex.exec(content)) !== null) {
      if (match[1]) {
        dependencies.push(match[1]);
      }
    }
    
    return dependencies;
  }

  private calculateCohesionScore(content: string, exports: string[], dependencies: string[]): number {
    // Simple cohesion scoring based on:
    // - Number of exports (fewer is better for single responsibility)
    // - Number of dependencies (fewer is better for low coupling)
    // - File size (smaller is better for maintainability)
    
    const exportScore = Math.max(0, 1 - (exports.length - 1) * 0.1);
    const dependencyScore = Math.max(0, 1 - dependencies.length * 0.05);
    const sizeScore = Math.max(0, 1 - (content.length / 1000) * 0.1);
    
    return (exportScore + dependencyScore + sizeScore) / 3;
  }

  private findConsolidationCandidates(file: string, content: string): string[] {
    const candidates: string[] = [];
    
    // Check for small files that could be merged
    if (content.length < 500) {
      candidates.push('small-file');
    }
    
    // Check for files with similar functionality
    const fileName = file.split('/').pop()?.replace('.ts', '') || '';
    if (fileName.includes('fossil') || fileName.includes('monitor') || fileName.includes('cli')) {
      candidates.push('similar-functionality');
    }
    
    // Check for type definitions that should be moved
    if (content.includes('export interface') || content.includes('export type')) {
      candidates.push('type-definition');
    }
    
    return candidates;
  }

  private calculateSummary(utilities: UtilityAnalysis[]) {
    const totalUtilities = utilities.length;
    const averageSize = utilities.reduce((sum, u) => sum + u.size, 0) / totalUtilities;
    const averageCohesionScore = utilities.reduce((sum, u) => sum + u.cohesionScore, 0) / totalUtilities;
    const consolidationOpportunities = utilities.filter(u => u.consolidationCandidates.length > 0).length;
    const typeViolations = utilities.filter(u => u.consolidationCandidates.includes('type-definition')).length;
    
    return {
      totalUtilities,
      averageSize,
      averageCohesionScore,
      consolidationOpportunities,
      typeViolations
    };
  }

  private generateRecommendations(utilities: UtilityAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    // Small file consolidation
    const smallFiles = utilities.filter(u => u.consolidationCandidates.includes('small-file'));
    if (smallFiles.length > 0) {
      recommendations.push(`Consolidate ${smallFiles.length} small utility files (<500 chars)`);
    }
    
    // Type definition violations
    const typeViolations = utilities.filter(u => u.consolidationCandidates.includes('type-definition'));
    if (typeViolations.length > 0) {
      recommendations.push(`Move ${typeViolations.length} type definitions from utils/ to types/`);
    }
    
    // Similar functionality
    const similarFiles = utilities.filter(u => u.consolidationCandidates.includes('similar-functionality'));
    if (similarFiles.length > 0) {
      recommendations.push(`Review ${similarFiles.length} files with similar functionality for consolidation`);
    }
    
    // Low cohesion scores
    const lowCohesion = utilities.filter(u => u.cohesionScore < 0.7);
    if (lowCohesion.length > 0) {
      recommendations.push(`Improve cohesion in ${lowCohesion.length} utilities (score < 0.7)`);
    }
    
    return recommendations;
  }

  private createConsolidationPlan(utilities: UtilityAnalysis[]): ConsolidationPlan[] {
    const plans: ConsolidationPlan[] = [];
    
    // Plan 1: Consolidate small files
    const smallFiles = utilities.filter(u => u.consolidationCandidates.includes('small-file'));
    if (smallFiles.length >= 2) {
      plans.push({
        type: 'merge',
        files: smallFiles.map(u => u.file),
        reason: 'Small files can be consolidated for better maintainability',
        effort: 'low',
        impact: 'medium'
      });
    }
    
    // Plan 2: Move type definitions
    const typeFiles = utilities.filter(u => u.consolidationCandidates.includes('type-definition'));
    if (typeFiles.length > 0) {
      plans.push({
        type: 'move',
        files: typeFiles.map(u => u.file),
        reason: 'Type definitions should be in src/types/ for better organization',
        effort: 'medium',
        impact: 'high'
      });
    }
    
    // Plan 3: Consolidate fossil utilities
    const fossilFiles = utilities.filter(u => u.file.includes('fossil'));
    if (fossilFiles.length > 3) {
      plans.push({
        type: 'refactor',
        files: fossilFiles.map(u => u.file),
        reason: 'Multiple fossil utilities can be consolidated into a unified FossilManager',
        effort: 'high',
        impact: 'high'
      });
    }
    
    return plans;
  }
}

// CLI Interface
async function main() {
  const analyzer = new CohesionAnalyzer();
  
  try {
    const report = await analyzer.analyzeCohesion();
    
    console.log('\n📊 Cohesion Analysis Report');
    console.log('==========================');
    console.log(`Total Utilities: ${report.summary.totalUtilities}`);
    console.log(`Average Size: ${Math.round(report.summary.averageSize)} bytes`);
    console.log(`Average Cohesion Score: ${(report.summary.averageCohesionScore * 100).toFixed(1)}%`);
    console.log(`Consolidation Opportunities: ${report.summary.consolidationOpportunities}`);
    console.log(`Type Violations: ${report.summary.typeViolations}`);
    
    console.log('\n🎯 Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log('\n📋 Consolidation Plan:');
    report.consolidationPlan.forEach((plan, i) => {
      console.log(`${i + 1}. ${plan.type.toUpperCase()}: ${plan.reason}`);
      console.log(`   Files: ${plan.files.length} files`);
      console.log(`   Effort: ${plan.effort}, Impact: ${plan.impact}`);
    });
    
    // Save detailed report
    const reportFile = `fossils/cohesion-analysis-${new Date().toISOString().split('T')[0]}.json`;
    await Bun.write(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Cohesion analysis failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 