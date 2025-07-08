#!/usr/bin/env bun

/**
 * Fossil Audit CLI
 * Comprehensive audit of fossil timestamp usage, deduplication, and state analysis
 */

import { FossilAuditor } from '../../scripts/fossil-audit';
import { createFossilManager } from '../utils/fossilManager';
import { 
  FossilAuditArgsSchema,
  FossilAuditArgs,
  FossilAuditFossil
} from '../types/fossil-audit';

// ============================================================================
// CLI IMPLEMENTATION
// ============================================================================

// ============================================================================
// CLI IMPLEMENTATION
// ============================================================================

export async function fossilAuditCLI(rawArgs: string[]): Promise<void> {
  console.log('🔍 Fossil Audit CLI\n');

  // Parse and validate arguments
  const args = parseCLIArgs(rawArgs);
  const validatedArgs = FossilAuditArgsSchema.parse(args);

  const startTime = Date.now();

  try {
    // Create auditor instance
    const auditor = new FossilAuditor({
      analyzeTimestamps: validatedArgs.analyzeTimestamps,
      checkDeduplication: validatedArgs.checkDeduplication,
      auditState: validatedArgs.auditState,
      monitorBunTest: validatedArgs.monitorBunTest,
      outputFormat: validatedArgs.outputFormat,
      verbose: validatedArgs.verbose
    });

    let auditResults: any;
    let bunTestResults: any;

    // Run audit
    if (validatedArgs.monitorBunTest) {
      console.log('🧪 Starting bun test monitoring...\n');
      bunTestResults = await auditor.monitorBunTest();
      auditResults = { totalFiles: 0, totalSize: 0, directories: {}, timestampPatterns: [], duplicates: [], recentActivity: [], recommendations: [] };
    } else {
      console.log('🔍 Starting fossil audit...\n');
      auditResults = await auditor.runAudit();
    }

    // Display results
    const formattedResults = auditor.formatResults(auditResults, bunTestResults);
    console.log(formattedResults);

    // Create fossil if requested
    if (validatedArgs.createFossil) {
      const auditDuration = Date.now() - startTime;
      
      const fossilData = {
        type: 'fossil_audit_fossil',
        source: 'fossil-audit-cli',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        fossilId: `audit-${Date.now()}`,
        fossilHash: `audit-${auditResults.totalFiles}-${auditResults.totalSize}`,
        auditResults: {
          totalFiles: auditResults.totalFiles,
          totalSize: auditResults.totalSize,
          directories: auditResults.directories,
          timestampPatterns: auditResults.timestampPatterns.map((p: any) => ({
            pattern: p.pattern,
            count: p.count,
            directories: p.directories,
            examples: p.examples
          })),
          duplicates: auditResults.duplicates.map((d: any) => ({
            hash: d.hash,
            count: d.count,
            totalSize: d.totalSize,
            recommendations: d.recommendations
          })),
          recentActivity: auditResults.recentActivity.map((f: any) => ({
            filename: f.filename,
            directory: f.directory,
            size: f.size,
            timestamp: f.timestamp
          })),
          recommendations: auditResults.recommendations
        },
        bunTestResults: bunTestResults ? {
          sessionId: bunTestResults.sessionId,
          fossilsCreated: bunTestResults.fossilsCreated,
          fossilsDeleted: bunTestResults.fossilsDeleted,
          patterns: bunTestResults.patterns,
          performance: {
            peakCreationRate: bunTestResults.performance.peakCreationRate,
            memoryUsage: bunTestResults.performance.memoryUsage
          }
        } : undefined,
        metadata: {
          auditDuration,
          scanDirectories: Object.keys(auditResults.directories || {}),
          duplicateGroupsFound: auditResults.duplicates?.length || 0,
          largeDirectories: Object.entries(auditResults.directories || {})
            .filter(([_, stats]: [string, any]) => stats.size > 10 * 1024 * 1024)
            .map(([dir, _]: [string, any]) => dir)
        },
        tags: validatedArgs.fossilTags,
        description: validatedArgs.fossilDescription || `Fossil audit completed in ${auditDuration}ms`
      };

      // Write fossil to file
      const { writeFileSync, mkdirSync } = await import('fs');
      const fossilDir = 'fossils/audit';
      mkdirSync(fossilDir, { recursive: true });
      
      const fossilPath = `${fossilDir}/fossil-audit-${Date.now()}.json`;
      writeFileSync(fossilPath, JSON.stringify(fossilData, null, 2));

      console.log(`\n💾 Audit fossil created: ${fossilData.fossilId}`);
      console.log(`📁 Location: ${fossilPath}`);
    }

    console.log('\n✅ Fossil audit completed successfully');

  } catch (error) {
    console.error('❌ Fossil audit failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

function parseCLIArgs(rawArgs: string[]): Partial<FossilAuditArgs> {
  const args: Partial<FossilAuditArgs> = {};

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    
    switch (arg) {
      case '--analyze-timestamps':
        args.analyzeTimestamps = true;
        break;
      case '--no-analyze-timestamps':
        args.analyzeTimestamps = false;
        break;
      case '--check-deduplication':
        args.checkDeduplication = true;
        break;
      case '--no-check-deduplication':
        args.checkDeduplication = false;
        break;
      case '--audit-state':
        args.auditState = true;
        break;
      case '--no-audit-state':
        args.auditState = false;
        break;
      case '--monitor-bun-test':
        args.monitorBunTest = true;
        break;
      case '--output':
        const format = rawArgs[i + 1];
        if (format && ['json', 'markdown', 'table'].includes(format)) {
          args.outputFormat = format as any;
          i++;
        }
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--create-fossil':
        args.createFossil = true;
        break;
      case '--no-create-fossil':
        args.createFossil = false;
        break;
      case '--tags':
        const tags = rawArgs[i + 1];
        if (tags) {
          args.fossilTags = tags.split(',').map(t => t.trim());
          i++;
        }
        break;
      case '--description':
        const description = rawArgs[i + 1];
        if (description) {
          args.fossilDescription = description;
          i++;
        }
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
Fossil Audit CLI

Usage: bun run src/cli/fossil-audit.ts [OPTIONS]

Options:
  --analyze-timestamps        Analyze timestamp patterns (default: true)
  --no-analyze-timestamps     Disable timestamp analysis
  --check-deduplication       Check for duplicates (default: true)
  --no-check-deduplication    Disable duplicate checking
  --audit-state              Audit overall state (default: true)
  --no-audit-state           Disable state audit
  --monitor-bun-test         Monitor bun test fossil creation
  --output <format>          Output format: json, markdown, table (default: markdown)
  --verbose                  Verbose output
  --create-fossil            Create audit fossil (default: true)
  --no-create-fossil         Don't create audit fossil
  --tags <tags>              Comma-separated fossil tags
  --description <desc>       Fossil description
  --help                     Show this help message

Examples:
  bun run src/cli/fossil-audit.ts
  bun run src/cli/fossil-audit.ts --monitor-bun-test --output json
  bun run src/cli/fossil-audit.ts --check-deduplication --verbose --tags audit,cleanup
`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  fossilAuditCLI(process.argv.slice(2)).catch(console.error);
} 