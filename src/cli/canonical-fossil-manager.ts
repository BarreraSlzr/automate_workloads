#!/usr/bin/env bun

import { z } from 'zod';
import { program } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { parseCLIArgs } from '../types/cli';
import { 
  CanonicalFossilParamsSchema,
  ValidationResultSchema,
  PerformanceResultSchema,
  AnalysisResultSchema,
  TestResultSchema
} from '../types/schemas';

// =============================================================================
// SCHEMAS (Using centralized schema registry)
// =============================================================================

type CanonicalFossilParams = z.infer<typeof CanonicalFossilParamsSchema>;
type ValidationResult = z.infer<typeof ValidationResultSchema>;
type PerformanceResult = z.infer<typeof PerformanceResultSchema>;
type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
type TestResult = z.infer<typeof TestResultSchema>;

// Schema types are now imported from centralized registry

// =============================================================================
// CANONICAL FOSSIL MANAGER
// =============================================================================

class CanonicalFossilManager {
  private fossilsDir: string;
  private contextDir: string;
  private archiveDir: string;

  constructor() {
    this.fossilsDir = path.join(process.cwd(), 'fossils');
    this.contextDir = path.join(this.fossilsDir, 'context');
    this.archiveDir = path.join(this.fossilsDir, 'archive');
  }

  /**
   * Get canonical filename for fossil type
   */
  private getCanonicalFilename(type: string): string {
    const canonicalNames = {
      validation: 'validation-results.json',
      performance: 'performance-results.json',
      analysis: 'analysis-results.json',
      test: 'test_results.json',
    };
    return canonicalNames[type as keyof typeof canonicalNames] || `${type}-results.json`;
  }

  /**
   * Get git information for traceability
   */
  private async getGitInfo(): Promise<{
    commit_hash: string;
    branch: string;
    author: string;
    email: string;
    timestamp: string;
  }> {
    try {
      const commit_hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const author = execSync('git config user.name', { encoding: 'utf8' }).trim();
      const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
      const timestamp = new Date().toISOString();

      return { commit_hash, branch, author, email, timestamp };
    } catch (error) {
      console.warn('⚠️  Could not get git info:', error);
      return {
        commit_hash: 'unknown',
        branch: 'unknown',
        author: 'unknown',
        email: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Archive previous version if it exists
   */
  private async archivePreviousVersion(canonicalPath: string): Promise<void> {
    try {
      if (await fs.access(canonicalPath).then(() => true).catch(() => false)) {
        const content = await fs.readFile(canonicalPath, 'utf8');
        const data = JSON.parse(content);
        
        // Create archive with timestamp for historical tracking
        const archiveTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(
          this.archiveDir,
          new Date().getFullYear().toString(),
          (new Date().getMonth() + 1).toString().padStart(2, '0'),
          `${path.basename(canonicalPath, '.json')}-${archiveTimestamp}.json`
        );

        await fs.mkdir(path.dirname(archivePath), { recursive: true });
        await fs.writeFile(archivePath, JSON.stringify(data, null, 2));
        
        console.log(`📦 Archived previous version: ${archivePath}`);
      }
    } catch (error) {
      console.warn('⚠️  Could not archive previous version:', error);
    }
  }

  /**
   * Update canonical validation results
   */
  async updateValidationResults(data: ValidationResult, options: { generateYaml?: boolean } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, this.getCanonicalFilename('validation'));

    // Merge with existing data if append mode
    let existingData: ValidationResult | null = null;
    try {
      if (await fs.access(canonicalPath).then(() => true).catch(() => false)) {
        const content = await fs.readFile(canonicalPath, 'utf8');
        existingData = ValidationResultSchema.parse(JSON.parse(content));
      }
    } catch (error) {
      console.warn('⚠️  Could not read existing validation data:', error);
    }

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData: ValidationResult = {
      ...data,
      ...gitInfo,
      metadata: {
        ...data.metadata,
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(data),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ Validation results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical performance results
   */
  async updatePerformanceResults(data: PerformanceResult, options: { generateYaml?: boolean } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, this.getCanonicalFilename('performance'));

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData: PerformanceResult = {
      ...data,
      ...gitInfo,
      metadata: {
        ...data.metadata,
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(data),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ Performance results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical analysis results
   */
  async updateAnalysisResults(data: AnalysisResult, options: { generateYaml?: boolean } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, this.getCanonicalFilename('analysis'));

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData: AnalysisResult = {
      ...data,
      ...gitInfo,
      metadata: {
        ...data.metadata,
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(data),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ Analysis results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical test results
   */
  async updateTestResults(data: TestResult): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, this.getCanonicalFilename('test'));

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData: TestResult = {
      ...data,
      ...gitInfo,
      metadata: {
        ...data.metadata,
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(data),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    console.log(`✅ Test results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical footprint results
   */
  async updateFootprint(footprint: any, options: { generateYaml?: boolean; metadata?: any } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, 'footprint-results.json');

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData = {
      type: 'file-footprint',
      data: footprint,
      ...gitInfo,
      metadata: {
        ...options.metadata,
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(footprint),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ Footprint results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical LLM snapshot results
   */
  async updateLLMSnapshot(snapshot: any, options: { generateYaml?: boolean } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, 'llm-snapshots.json');

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData = {
      type: 'llm-snapshot',
      data: snapshot,
      ...gitInfo,
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(snapshot),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ LLM snapshot updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical test monitoring results
   */
  async updateTestMonitoring(result: any, options: { generateYaml?: boolean } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, 'test-monitoring-results.json');

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData = {
      type: 'test-monitoring',
      data: result,
      ...gitInfo,
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(result),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ Test monitoring results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Update canonical git diff analysis results
   */
  async updateGitDiffAnalysis(analysis: any, options: { generateYaml?: boolean } = {}): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const canonicalPath = path.join(this.fossilsDir, 'git-diff-results.json');

    // Archive previous version
    await this.archivePreviousVersion(canonicalPath);

    // Prepare updated data
    const updatedData = {
      type: 'git-diff-analysis',
      data: analysis,
      ...gitInfo,
      metadata: {
        fossilized: true,
        canonical: true,
        version: '1.0.0',
        transversalValue: this.calculateTransversalValue(analysis),
      },
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(canonicalPath), { recursive: true });

    // Write canonical file
    await fs.writeFile(canonicalPath, JSON.stringify(updatedData, null, 2));

    // Generate YAML context if requested
    if (options.generateYaml) {
      await this.generateYamlContext();
    }

    console.log(`✅ Git diff analysis results updated in canonical file: ${canonicalPath}`);
    return canonicalPath;
  }

  /**
   * Calculate transversal value for fossil
   */
  private calculateTransversalValue(data: any): number {
    // Simple heuristic based on data complexity and completeness
    let value = 0;
    
    if (data.summary) {
      value += Object.keys(data.summary).length * 10;
    }
    
    if (data.validation_steps) {
      value += data.validation_steps.length * 5;
    }
    
    if (data.insights) {
      value += data.insights.length * 15;
    }
    
    if (data.metrics) {
      value += Object.keys(data.metrics).length * 8;
    }
    
    if (data.results) {
      value += Object.keys(data.results).length * 12;
    }
    
    return Math.min(value, 100); // Cap at 100
  }

  /**
   * Generate YAML context for human-LLM chat and ML processes
   */
  async generateYamlContext(): Promise<string> {
    const gitInfo = await this.getGitInfo();
    const yamlPath = path.join(this.contextDir, 'canonical-context.yml');

    // Collect all canonical fossils
    const canonicalFiles = [
      'validation-results.json',
      'performance-results.json',
      'analysis-results.json',
      'test_results.json',
    ];

    const context: any = {
      timestamp: gitInfo.timestamp,
      commit_hash: gitInfo.commit_hash,
      branch: gitInfo.branch,
      author: gitInfo.author,
      canonical_fossils: {},
      summary: {
        total_canonical_files: 0,
        last_updated: gitInfo.timestamp,
        transversal_value: 0,
      },
    };

    for (const filename of canonicalFiles) {
      const filePath = path.join(this.fossilsDir, filename);
      try {
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          const fossilType = filename.replace('-results.json', '');
          context.canonical_fossils[fossilType] = {
            last_updated: data.timestamp,
            status: data.summary?.overall_status || data.summary?.status || 'unknown',
            transversal_value: data.metadata?.transversalValue || 0,
            summary: data.summary,
          };
          
          context.summary.total_canonical_files++;
          context.summary.transversal_value += data.metadata?.transversalValue || 0;
        }
      } catch (error) {
        console.warn(`⚠️  Could not read ${filename}:`, error);
      }
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(yamlPath), { recursive: true });

    // Convert to YAML (simple conversion for now)
    const yamlContent = this.jsonToYaml(context);
    await fs.writeFile(yamlPath, yamlContent);

    console.log(`✅ YAML context generated: ${yamlPath}`);
    return yamlPath;
  }

  /**
   * Simple JSON to YAML conversion
   */
  private jsonToYaml(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          yaml += `${spaces}- ${JSON.stringify(item)}\n`;
        }
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return yaml;
  }

  /**
   * Run git diff analysis for traceability
   */
  async runGitDiffAnalysis(): Promise<void> {
    try {
      console.log('🔍 Running git diff analysis for traceability...');
      
      // Get staged changes
      const stagedDiff = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
      const stagedFiles = stagedDiff ? stagedDiff.split('\n') : [];
      
      // Get unstaged changes
      const unstagedDiff = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
      const unstagedFiles = unstagedDiff ? unstagedDiff.split('\n') : [];
      
      // Filter fossil-related changes
      const fossilChanges = [...stagedFiles, ...unstagedFiles].filter(file => 
        file.includes('fossils/') || file.includes('canonical')
      );
      
      if (fossilChanges.length > 0) {
        console.log('📊 Fossil changes detected:');
        fossilChanges.forEach(file => console.log(`  - ${file}`));
        
        // Create canonical traceability fossil
        const traceabilityData = {
          timestamp: new Date().toISOString(),
          commit_hash: await this.getGitInfo().then(info => info.commit_hash),
          fossil_changes: fossilChanges,
          change_types: {
            staged: stagedFiles.filter(f => f.includes('fossils/')),
            unstaged: unstagedFiles.filter(f => f.includes('fossils/')),
          },
          metadata: {
            fossilized: true,
            canonical: true,
            version: '1.0.0',
            transversalValue: fossilChanges.length * 5,
          },
        };
        
        // Use stable canonical filename instead of timestamped filename
        const traceabilityPath = path.join(this.fossilsDir, 'traceability', 'current-traceability.json');
        await fs.mkdir(path.dirname(traceabilityPath), { recursive: true });
        
        // Archive previous version if it exists
        await this.archivePreviousVersion(traceabilityPath);
        
        await fs.writeFile(traceabilityPath, JSON.stringify(traceabilityData, null, 2));
        
        console.log(`✅ Canonical traceability fossil updated: ${traceabilityPath}`);
      } else {
        console.log('ℹ️  No fossil changes detected');
      }
    } catch (error) {
      console.warn('⚠️  Git diff analysis failed:', error);
    }
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

program
  .name('canonical-fossil-manager')
  .description('Manage canonical fossils with stable filenames and traceability')
  .version('1.0.0');

program
  .command('update-validation')
  .description('Update canonical validation results')
  .option('--output <path>', 'Output directory', 'fossils')
  .option('--append', 'Append to existing data', false)
  .option('--overwrite', 'Overwrite existing data', false)
  .option('--generate-yaml', 'Generate YAML context', true)
  .option('--yaml-output <path>', 'YAML output path', 'fossils/context/canonical-context.yml')
  .option('--dry-run', 'Dry run mode', false)
  .action(async (options) => {
    const manager = new CanonicalFossilManager();
    
    // Create sample validation data
    const validationData: ValidationResult = {
      timestamp: new Date().toISOString(),
      commit_hash: 'unknown',
      branch: 'unknown',
      author: 'unknown',
      email: 'unknown',
      validation_steps: [
        { step: 'typescript_check', status: 'pass', duration_ms: 1500 },
        { step: 'linting', status: 'pass', duration_ms: 800 },
        { step: 'tests', status: 'pass', duration_ms: 3000 },
        { step: 'schema_validation', status: 'pass', duration_ms: 200 },
        { step: 'fossil_validation', status: 'pass', duration_ms: 100 },
      ],
      summary: {
        total_steps: 5,
        passed_steps: 5,
        failed_steps: 0,
        overall_status: 'pass',
      },
      metadata: {
        fossilized: false,
        canonical: false,
        version: '1.0.0',
      },
    };
    
    if (!options.dryRun) {
      await manager.updateValidationResults(validationData);
      
      if (options.generateYaml) {
        await manager.generateYamlContext();
      }
      
      await manager.runGitDiffAnalysis();
    } else {
      console.log('🔍 Dry run - would update validation results');
    }
  });

program
  .command('update-performance')
  .description('Update canonical performance results')
  .option('--output <path>', 'Output directory', 'fossils')
  .option('--append', 'Append to existing data', false)
  .option('--overwrite', 'Overwrite existing data', false)
  .option('--generate-yaml', 'Generate YAML context', true)
  .option('--yaml-output <path>', 'YAML output path', 'fossils/context/canonical-context.yml')
  .option('--dry-run', 'Dry run mode', false)
  .action(async (options) => {
    const manager = new CanonicalFossilManager();
    
    // Create sample performance data
    const performanceData: PerformanceResult = {
      timestamp: new Date().toISOString(),
      commit_hash: 'unknown',
      branch: 'unknown',
      author: 'unknown',
      email: 'unknown',
      metrics: {
        memory_usage_mb: 45.2,
        cpu_usage_percent: 12.5,
        execution_time_ms: 1250,
        test_duration_ms: 8500,
      },
      status: 'pass',
      summary: {
        total_metrics: 4,
        passed_metrics: 4,
        failed_metrics: 0,
        performance_score: 95.5,
      },
      metadata: {
        fossilized: false,
        canonical: false,
        version: '1.0.0',
      },
    };
    
    if (!options.dryRun) {
      await manager.updatePerformanceResults(performanceData);
      
      if (options.generateYaml) {
        await manager.generateYamlContext();
      }
      
      await manager.runGitDiffAnalysis();
    } else {
      console.log('🔍 Dry run - would update performance results');
    }
  });

program
  .command('generate-yaml')
  .description('Generate YAML context for human-LLM chat and ML processes')
  .option('--output <path>', 'YAML output path', 'fossils/context/canonical-context.yml')
  .action(async (options) => {
    const manager = new CanonicalFossilManager();
    await manager.generateYamlContext();
  });

program
  .command('git-diff-analysis')
  .description('Run git diff analysis for traceability')
  .action(async () => {
    const manager = new CanonicalFossilManager();
    await manager.runGitDiffAnalysis();
  });

// =============================================================================
// EXPORTS
// =============================================================================

export { CanonicalFossilManager };

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (import.meta.main) {
  program.parse();
} 