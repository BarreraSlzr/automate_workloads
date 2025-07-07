#!/usr/bin/env bun

/**
 * Unified Pre-Commit Validator
 * 
 * Combines all pre-commit validations into a single, comprehensive system:
 * - TypeScript type checking
 * - Basic tests (unit + integration)
 * - Schema validation
 * - Fossil audit
 * - ML-ready validation and cleanup
 * - Enhanced commit message validation
 * - Performance monitoring
 * 
 * Run with: bun run scripts/unified-pre-commit-validator.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const UnifiedValidatorArgs = z.object({
  test: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
  skipTests: z.boolean().default(false),
  skipMLReady: z.boolean().default(false),
  skipPerformance: z.boolean().default(false),
  strict: z.boolean().default(true)
});

const ValidationStep = z.object({
  name: z.string(),
  command: z.string(),
  description: z.string(),
  required: z.boolean().default(true),
  category: z.enum(['core', 'ml-ready', 'enhanced', 'performance']).default('core')
});

const ValidationResult = z.object({
  step: z.string(),
  success: z.boolean(),
  output: z.string().optional(),
  error: z.string().optional(),
  duration: z.number(),
  category: z.string()
});

// ============================================================================
// TYPES
// ============================================================================

type UnifiedValidatorArgs = z.infer<typeof UnifiedValidatorArgs>;
type ValidationStep = z.infer<typeof ValidationStep>;
type ValidationResult = z.infer<typeof ValidationResult>;

// ============================================================================
// UNIFIED PRE-COMMIT VALIDATOR CLASS
// ============================================================================

class UnifiedPreCommitValidator {
  private args: UnifiedValidatorArgs;
  private results: ValidationResult[] = [];

  constructor(args: UnifiedValidatorArgs) {
    this.args = args;
  }

  async run(): Promise<boolean> {
    // === CANONICAL FOSSIL ENFORCEMENT CHECK ===
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim().length > 0);
    const fossilRegex = /^fossils\/(?!canonical\/)[^/]+\.(json|ya?ml)$/i;
    const timestampRegex = /\d{4}-\d{2}-\d{2}|\d{10,}/;
    const canonicalFossilRegex = /^fossils\/canonical\/[^/]+\.(json|ya?ml)$/i;
    const allowlist = [
      'fossils/roadmap.yml',
      'fossils/roadmap_insights.json'
    ];
    let violation = false;
    for (const file of stagedFiles) {
      if (allowlist.includes(file)) continue;
      if (fossilRegex.test(file)) {
        console.error(`\n❌ Non-canonical fossil detected: ${file}\n  Fossils must be created only in fossils/.\n  Please use the canonical fossil manager and migrate this fossil.`);
        violation = true;
      }
      if (timestampRegex.test(file)) {
        console.error(`\n❌ Timestamped fossil detected: ${file}\n  Timestamped fossil filenames are not allowed. Use stable canonical filenames only.`);
        violation = true;
      }
      if (canonicalFossilRegex.test(file)) {
        // Check for required metadata
        try {
          const content = fs.readFileSync(file, 'utf8');
          let data: any;
          if (file.endsWith('.json')) {
            data = JSON.parse(content);
          } else {
            // Simple YAML parse for metadata
            const metaMatch = content.match(/metadata:\s*([\s\S]*)/);
            data = { metadata: metaMatch ? metaMatch[1] : {} };
          }
          const meta = data.metadata || {};
          if (!meta.canonical || (!meta.purpose && !meta.goal && !meta.vector)) {
            console.error(`\n❌ Canonical fossil missing required metadata: ${file}\n  Must have metadata.canonical: true and a purpose/goal/vector field.`);
            violation = true;
          }
        } catch (e) {
          console.error(`\n❌ Error reading canonical fossil metadata: ${file}\n  ${e}`);
          violation = true;
        }
      }
    }
    if (violation) {
      console.error('\n⛔️ Commit blocked: All fossils must be canonical, ML-ready, and have documented purpose.');
      process.exit(1);
    }
    // === END CANONICAL FOSSIL ENFORCEMENT ===

    console.log('🚀 Starting Unified Pre-Commit Validation...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Commit: ${this.getCurrentCommitHash()}`);
    console.log(`🌿 Branch: ${this.getCurrentBranch()}`);
    console.log('');

    const steps = this.getValidationSteps();
    let allPassed = true;

    for (const step of steps) {
      if (this.shouldSkipStep(step)) {
        console.log(`⏭️  Skipping ${step.name} (disabled)`);
        continue;
      }

      const result = await this.runValidationStep(step);
      this.results.push(result);

      if (!result.success && step.required) {
        allPassed = false;
        console.error(`❌ ${step.name} failed - blocking commit`);
        if (this.args.verbose && result.error) {
          console.error(`   Error: ${result.error}`);
        }
        break;
      } else if (!result.success && !step.required) {
        console.warn(`⚠️  ${step.name} failed (non-blocking)`);
      } else {
        console.log(`✅ ${step.name} passed`);
      }
    }

    this.displaySummary();
    await this.updateProjectStatus();
    return allPassed;
  }

  private getValidationSteps(): ValidationStep[] {
    return [
      // Core validations (always required)
      {
        name: 'TypeScript Type Checking',
        command: 'bun run type-check',
        description: 'Validate TypeScript types and interfaces',
        required: true,
        category: 'core'
      },
      {
        name: 'Type and Schema Cohesion',
        command: 'bun run validate:types-schemas-cohesion',
        description: 'Validate schema consistency across types/schemas',
        required: true,
        category: 'core'
      },
      {
        name: 'Linting and Code Style',
        command: 'bun run lint',
        description: 'Validate code style and linting rules',
        required: true,
        category: 'core'
      },
      {
        name: 'Basic Tests',
        command: 'bun test tests/unit/ tests/integration/ --timeout 60000',
        description: 'Run unit and integration tests',
        required: !this.args.skipTests,
        category: 'core'
      },
      {
        name: 'Schema Validation',
        command: 'bun run validate:types-schemas',
        description: 'Validate all Zod schemas',
        required: true,
        category: 'core'
      },
      {
        name: 'Fossil Audit',
        command: 'bun run fossil:audit --no-create-fossil',
        description: 'Quick fossil audit and validation',
        required: true,
        category: 'core'
      },

      // ML-Ready validations
      {
        name: 'ML-Ready Validation and Cleanup',
        command: 'bun run validate:ml-ready',
        description: 'ML-powered fossil cleanup and structure validation',
        required: !this.args.skipMLReady,
        category: 'ml-ready'
      },

      // Enhanced validations
      {
        name: 'Enhanced Commit Message Validation',
        command: 'bun run validate:enhanced-commit --validate --pre-commit --strict',
        description: 'Validate commit messages with LLM insights and git diff analysis for retrospective traceability',
        required: true,
        category: 'enhanced'
      },
      {
        name: 'Git Diff Fossil Reference Analysis',
        command: 'bun run src/cli/git-diff-fossil-analyzer.ts --analyze --fossilize --generateYaml',
        description: 'Analyze git diff for fossil references and create transversal insights with YAML context',
        required: false,
        category: 'enhanced'
      },

      // Performance validations
      {
        name: 'Performance Monitoring',
        command: 'bun run src/cli/performance-monitor.ts monitor-changed',
        description: 'Monitor performance of changed scripts',
        required: !this.args.skipPerformance,
        category: 'performance'
      }
    ];
  }

  private shouldSkipStep(step: ValidationStep): boolean {
    if (step.category === 'core') return false;
    if (step.category === 'ml-ready' && this.args.skipMLReady) return true;
    if (step.category === 'performance' && this.args.skipPerformance) return true;
    if (step.category === 'enhanced' && !this.args.strict) return false;
    return false;
  }

  private async runValidationStep(step: ValidationStep): Promise<ValidationResult> {
    const startTime = Date.now();
    console.log(`🔍 [${step.category.toUpperCase()}] ${step.name}...`);

    try {
      const output = execSync(step.command, { 
        encoding: 'utf8',
        stdio: this.args.verbose ? 'inherit' : 'pipe'
      });

      const duration = Date.now() - startTime;
      return {
        step: step.name,
        success: true,
        output: this.args.verbose ? undefined : output,
        duration,
        category: step.category
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        step: step.name,
        success: false,
        error: error.message || 'Unknown error',
        duration,
        category: step.category
      };
    }
  }

  private displaySummary(): void {
    console.log('\n📊 Validation Summary:');
    console.log('='.repeat(50));

    const categories = ['core', 'ml-ready', 'enhanced', 'performance'] as const;
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length === 0) continue;

      console.log(`\n${category.toUpperCase()} Validations:`);
      for (const result of categoryResults) {
        const status = result.success ? '✅' : '❌';
        const duration = `${result.duration}ms`;
        console.log(`  ${status} ${result.step} (${duration})`);
      }
    }

    const totalPassed = this.results.filter(r => r.success).length;
    const totalSteps = this.results.length;
    const successRate = totalSteps > 0 ? (totalPassed / totalSteps * 100).toFixed(1) : '0';

    console.log(`\n📈 Overall: ${totalPassed}/${totalSteps} steps passed (${successRate}%)`);
    
    if (totalPassed === totalSteps) {
      console.log('🎉 All validations passed!');
    } else {
      console.log('⚠️  Some validations failed');
    }
  }

  private getCurrentCommitHash(): string {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private async updateProjectStatus(): Promise<void> {
    try {
      console.log('🔄 Updating fossils/project_status.yml...');
      execSync('bun run scripts/update-project-status.ts', { stdio: 'inherit' });
      console.log('✅ fossils/project_status.yml updated.');
    } catch (e) {
      console.error('❌ Failed to update fossils/project_status.yml:', e);
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, any> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg && arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        parsedArgs[key] = value;
        i++;
      } else {
        parsedArgs[key] = true;
      }
    }
  }
  
  try {
    const validatedArgs = UnifiedValidatorArgs.parse(parsedArgs);
    const validator = new UnifiedPreCommitValidator(validatedArgs);
    const success = await validator.run();
    
    if (!success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 