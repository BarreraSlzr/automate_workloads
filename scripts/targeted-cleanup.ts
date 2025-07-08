#!/usr/bin/env bun

import { z } from 'zod';
import { readdir, readFile, writeFile, mkdir, stat, rename } from 'fs/promises';
import { join, basename, extname, dirname } from 'path';
import { createHash } from 'crypto';

// Schema for targeted cleanup configuration
const TargetedCleanupConfigSchema = z.object({
  sourceDirs: z.array(z.string()),
  targetDirs: z.record(z.string(), z.string()),
  filePatterns: z.record(z.string(), z.array(z.string())),
  preserveExtensions: z.array(z.string()).default(['.json', '.md', '.yml', '.yaml']),
  addTimestamp: z.boolean().default(true),
  addHash: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  excludePatterns: z.array(z.string()).default(['node_modules', '.git', '.husky', '.cursor']),
});

type TargetedCleanupConfig = z.infer<typeof TargetedCleanupConfigSchema>;

// File classification schema
const FileClassificationSchema = z.object({
  originalPath: z.string(),
  targetPath: z.string(),
  fileType: z.string(),
  timestamp: z.string(),
  hash: z.string(),
  size: z.number(),
  reason: z.string(),
});

type FileClassification = z.infer<typeof FileClassificationSchema>;

// List of protected files that should never be moved or renamed
const PROTECTED_FILES = [
  'README.md', 'package.json', 'tsconfig.json', 'CONTRIBUTING_GUIDE.md', 'CHANGELOG.md',
  'ACTIONS_MANIFEST.yml', 'CORE_DATA_STRUCTURES_IMPLEMENTATION_SUMMARY.md', 'PROJECT_STRUCTURE.md',
  'BATCH_COMMIT_ORCHESTRATION_GUIDE.md', 'COMMIT_BATCH_SUMMARY.md', 'FOSSIL_AUDIT_IMPLEMENTATION_SUMMARY.md',
  'TEST_COVERAGE_PLAN.md', 'TEST_PLAN.md', 'llm_onboarding.md', 'AUTOMATION_WORKFLOW_DIAGRAM.md',
  'MCP_CLI_DESIGN.md', 'MCP_CLI_README.md', 'PRE_COMMIT_VALIDATION_SUMMARY.md', 'PRE_COMMIT_ANALYSIS_REPORT.md',
  'PRE_COMMIT_CLEANUP_SUMMARY.md', 'VALIDATION_AND_SCOPE_CREEP_SUMMARY.md', 'TYPESCRIPT_ERRORS_FIXED_SUMMARY.md',
  'TEST_VALIDATION_SUMMARY.md', 'CLAUDE.md', 'fossil-duplication-issue.md', 'fossil-duplication-execution-plan.json',
  'orchestration-results.json', 'plan.json', '.pre-commit-config.yaml', 'LICENSE', 'tsconfig.tsbuildinfo',
  'type-schema-validation-report.md', 'precommit.log', '.gitignore', '.env', '.env.example'
];

class TargetedCleanupOrchestrator {
  private config: TargetedCleanupConfig;
  private classifications: FileClassification[] = [];
  private stats = {
    processed: 0,
    moved: 0,
    skipped: 0,
    errors: 0,
    totalSize: 0,
  };

  constructor(config: TargetedCleanupConfig) {
    this.config = config;
  }

  private generateTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  private shouldExclude(path: string): boolean {
    return this.config.excludePatterns.some(pattern => path.includes(pattern));
  }

  private async classifyFile(filePath: string): Promise<FileClassification | null> {
    try {
      // Skip excluded patterns
      if (this.shouldExclude(filePath)) {
        return null;
      }

      const stats = await stat(filePath);
      if (!stats.isFile()) return null;

      const ext = extname(filePath).toLowerCase();
      if (!this.config.preserveExtensions.includes(ext)) return null;

      const content = await readFile(filePath, 'utf-8');
      const timestamp = this.generateTimestamp();
      const hash = this.generateHash(content);
      const baseName = basename(filePath, ext);
      
      // Determine target directory based on file patterns
      let targetDir = 'fossils/misc';
      let fileType = 'misc';
      let reason = 'No specific pattern match';

      for (const [pattern, patterns] of Object.entries(this.config.filePatterns)) {
        if (patterns.some(p => filePath.includes(p) || baseName.includes(p))) {
          targetDir = this.config.targetDirs[pattern] || 'fossils/misc';
          fileType = pattern;
          reason = `Matched pattern: ${pattern}`;
          break;
        }
      }

      // Special handling for non-existent-dir files
      if (filePath.includes('non-existent-dir')) {
        targetDir = 'fossils/analysis';
        fileType = 'analysis';
        reason = 'Moved from non-existent-dir';
      }

      // Generate new filename with timestamp and hash
      let newFileName = baseName;
      if (this.config.addTimestamp) {
        newFileName += `-${timestamp}`;
      }
      if (this.config.addHash) {
        newFileName += `-${hash}`;
      }
      newFileName += ext;

      const targetPath = join(targetDir, newFileName);

      return {
        originalPath: filePath,
        targetPath,
        fileType,
        timestamp,
        hash,
        size: stats.size,
        reason,
      };
    } catch (error) {
      console.error(`Error classifying file ${filePath}:`, error);
      return null;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async moveFile(classification: FileClassification): Promise<void> {
    try {
      await this.ensureDirectoryExists(dirname(classification.targetPath));
      
      if (!this.config.dryRun) {
        await rename(classification.originalPath, classification.targetPath);
      }
      
      this.stats.moved++;
      this.stats.totalSize += classification.size;
      
      console.log(`${this.config.dryRun ? '[DRY RUN] ' : ''}Moved: ${classification.originalPath} -> ${classification.targetPath}`);
    } catch (error) {
      console.error(`Error moving file ${classification.originalPath}:`, error);
      this.stats.errors++;
    }
  }

  private async processDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.processDirectory(fullPath);
        } else if (entry.isFile()) {
          if (PROTECTED_FILES.includes(basename(fullPath))) {
            if (this.config.dryRun) {
              console.log(`[DRY RUN] Skipping protected file: ${fullPath}`);
            }
            continue;
          }
          const classification = await this.classifyFile(fullPath);
          if (classification) {
            this.classifications.push(classification);
            await this.moveFile(classification);
          } else {
            this.stats.skipped++;
          }
          this.stats.processed++;
        }
      }
    } catch (error) {
      console.error(`Error processing directory ${dirPath}:`, error);
      this.stats.errors++;
    }
  }

  private async generateCleanupReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      stats: this.stats,
      classifications: this.classifications,
      summary: {
        totalFiles: this.stats.processed,
        movedFiles: this.stats.moved,
        skippedFiles: this.stats.skipped,
        errorFiles: this.stats.errors,
        totalSizeMB: (this.stats.totalSize / (1024 * 1024)).toFixed(2),
        fileTypes: {} as Record<string, number>,
      },
    };

    // Count file types
    for (const classification of this.classifications) {
      report.summary.fileTypes[classification.fileType] = 
        (report.summary.fileTypes[classification.fileType] || 0) + 1;
    }

    const reportPath = `fossils/cleanup/targeted-cleanup-report-${this.generateTimestamp()}.json`;
    await this.ensureDirectoryExists(dirname(reportPath));
    
    if (!this.config.dryRun) {
      await writeFile(reportPath, JSON.stringify(report, null, 2));
    }

    console.log('\n=== TARGETED CLEANUP REPORT ===');
    console.log(`Total files processed: ${this.stats.processed}`);
    console.log(`Files moved: ${this.stats.moved}`);
    console.log(`Files skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Total size moved: ${report.summary.totalSizeMB} MB`);
    console.log('\nFile types moved:');
    for (const [type, count] of Object.entries(report.summary.fileTypes)) {
      console.log(`  ${type}: ${count} files`);
    }
    
    if (!this.config.dryRun) {
      console.log(`\nDetailed report saved to: ${reportPath}`);
    }
  }

  async run(): Promise<void> {
    console.log('🎯 Starting Targeted Output Cleanup Orchestrator...');
    console.log(`Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    for (const sourceDir of this.config.sourceDirs) {
      console.log(`\n📁 Processing directory: ${sourceDir}`);
      await this.processDirectory(sourceDir);
    }

    await this.generateCleanupReport();
    
    console.log('\n✅ Targeted cleanup process completed!');
  }
}

// Main execution
async function main() {
  const config: TargetedCleanupConfig = {
    sourceDirs: [
      'non-existent-dir',
      '.', // Root directory for misplaced files
    ],
    targetDirs: {
      analysis: 'fossils/analysis',
      test: 'fossils/test',
      monitoring: 'fossils/monitoring',
      learning: 'fossils/learning',
      misc: 'fossils/misc',
    },
    filePatterns: {
      analysis: ['analysis', 'summary', 'report'],
      test: ['test', 'spec', 'e2e', 'integration'],
      monitoring: ['monitor', 'performance', 'metrics'],
      learning: ['learning', 'model', 'training'],
      misc: ['plan', 'config', 'template', 'backup'],
    },
    preserveExtensions: ['.json', '.md', '.yml', '.yaml'],
    addTimestamp: true,
    addHash: true,
    dryRun: process.argv.includes('--dry-run'),
    excludePatterns: [
      'node_modules',
      '.git',
      '.husky',
      '.cursor',
      '.context-fossil',
      'fossils',
      'src',
      'tests',
      'scripts',
      'docs',
      'examples',
      'temp',
      'context-backups',
      '.orchestration-reports',
      'custom',
    ],
  };

  const orchestrator = new TargetedCleanupOrchestrator(config);
  await orchestrator.run();
}

if (import.meta.main) {
  main().catch(console.error);
}

export { TargetedCleanupOrchestrator, TargetedCleanupConfig }; 