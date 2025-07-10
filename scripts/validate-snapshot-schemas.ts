#!/usr/bin/env bun

/**
 * Validate Snapshot Processing Schemas
 * 
 * This script validates that our new snapshot processing schemas
 * follow the established type and schema patterns.
 */

import { 
  SnapshotAnalysisParamsSchema,
  SnapshotExportParamsSchema,
  FossilBrowserParamsSchema,
  PatternAnalysisParamsSchema,
  AuditReportParamsSchema,
  QualityTrendParamsSchema,
  WorkflowIntegrationParamsSchema,
  z
} from '../src/types/schemas';
import * as fs from 'fs/promises';
import type { ValidationResult, ValidationError } from '@/types/validation';
import { noop } from '@/utils/cli';

class SnapshotSchemaValidator {
  private results: ValidationResult[] = [];

  /**
   * Validate all snapshot processing schemas
   */
  async validateAllSchemas(): Promise<ValidationResult[]> {
    console.log('🔍 Validating Snapshot Processing Schemas');
    console.log('='.repeat(50));

    // Test each schema with valid and invalid data
    await this.validateSchema('SnapshotAnalysisParamsSchema', SnapshotAnalysisParamsSchema);
    await this.validateSchema('SnapshotExportParamsSchema', SnapshotExportParamsSchema);
    await this.validateSchema('FossilBrowserParamsSchema', FossilBrowserParamsSchema);
    await this.validateSchema('PatternAnalysisParamsSchema', PatternAnalysisParamsSchema);
    await this.validateSchema('AuditReportParamsSchema', AuditReportParamsSchema);
    await this.validateSchema('QualityTrendParamsSchema', QualityTrendParamsSchema);
    await this.validateSchema('WorkflowIntegrationParamsSchema', WorkflowIntegrationParamsSchema);

    return this.results;
  }

  /**
   * Validate a specific schema
   */
  private async validateSchema(schemaName: string, schema: z.ZodSchema): Promise<void> {
    console.log(`📋 Testing ${schemaName}...`);

    const result: ValidationResult = {
      schema: schemaName,
      isValid: true,
      errors: []
    };

    try {
      // Test 1: Valid minimal params
      const validMinimal = this.getValidMinimalParams(schemaName);
      const validatedMinimal = schema.parse(validMinimal);
      console.log(`   ✅ Valid minimal params: ${Object.keys(validatedMinimal).length} fields`);

      // Test 2: Valid full params
      const validFull = this.getValidFullParams(schemaName);
      const validatedFull = schema.parse(validFull);
      console.log(`   ✅ Valid full params: ${Object.keys(validatedFull).length} fields`);

      // Test 3: Invalid params (should throw)
      try {
        const invalidParams = this.getInvalidParams(schemaName);
        schema.parse(invalidParams);
        result.isValid = false;
        result.errors.push({ message: 'Invalid params should have thrown an error', path: [] });
        console.log(`   ❌ Invalid params should have thrown an error`);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.log(`   ✅ Invalid params correctly rejected: ${error.errors.length} errors`);
          result.errors = error.errors.map(e => ({ message: e.message, path: e.path.map(String) }));
        } else {
          result.isValid = false;
          result.errors.push({ message: `Unexpected error type: ${error}`, path: [] });
          console.log(`   ❌ Unexpected error type: ${error}`);
        }
      }

    } catch (error) {
      result.isValid = false;
      if (error instanceof z.ZodError) {
        result.errors = error.errors.map(e => ({ message: e.message, path: e.path.map(String) }));
        console.log(`   ❌ Validation failed: ${error.errors.length} errors`);
      } else {
        result.errors.push({ message: `Unexpected error: ${error}`, path: [] });
        console.log(`   ❌ Unexpected error: ${error}`);
      }
    }

    this.results.push(result);
    console.log('');
  }

  /**
   * Get valid minimal params for a schema
   */
  private getValidMinimalParams(schemaName: string): any {
    const baseParams = {
      dryRun: false,
      verbose: false
    };

    switch (schemaName) {
      case 'SnapshotAnalysisParamsSchema':
        return {
          ...baseParams,
          includeMetadata: true,
          includeValidation: true,
          includeQualityMetrics: true,
          limit: 100,
          offset: 0
        };

      case 'SnapshotExportParamsSchema':
        return {
          ...baseParams,
          format: 'yaml',
          includeMetadata: true,
          includeTimestamps: true,
          includeValidation: true
        };

      case 'FossilBrowserParamsSchema':
        return {
          ...baseParams,
          viewMode: 'list',
          sortBy: 'timestamp',
          sortOrder: 'desc',
          limit: 50,
          offset: 0,
          selectedFossils: []
        };

      case 'PatternAnalysisParamsSchema':
        return {
          ...baseParams,
          analysisTypes: ['purposes', 'contexts', 'quality'],
          includeInsights: true,
          includeRecommendations: true
        };

      case 'AuditReportParamsSchema':
        return {
          ...baseParams,
          complianceChecks: ['apiKeySanitization', 'traceability', 'validation'],
          riskAssessment: true,
          qualityMetrics: true,
          coverageAnalysis: true,
          recommendations: true,
          outputFormat: 'markdown'
        };

      case 'QualityTrendParamsSchema':
        return {
          ...baseParams,
          granularity: 'day',
          metrics: ['quality', 'success'],
          includeTrends: true,
          outputFormat: 'json'
        };

      case 'WorkflowIntegrationParamsSchema':
        return {
          ...baseParams,
          contextType: 'currentFile',
          integrationTypes: ['context', 'highlight'],
          fossilTypes: ['llm'],
          includeMetadata: true,
          includeValidation: true,
          limit: 10
        };

      default:
        return baseParams;
    }
  }

  /**
   * Get valid full params for a schema
   */
  private getValidFullParams(schemaName: string): any {
    const minimal = this.getValidMinimalParams(schemaName);
    
    switch (schemaName) {
      case 'SnapshotAnalysisParamsSchema':
        return {
          ...minimal,
          timeRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-12-31T23:59:59Z'
          },
          filters: {
            tags: ['llm', 'validation'],
            types: ['llm-validation', 'llm-error-prevention'],
            purposes: ['analysis', 'audit'],
            contexts: ['test', 'production']
          }
        };

      case 'SnapshotExportParamsSchema':
        return {
          ...minimal,
          includePreprocessing: true,
          includeQualityMetrics: true,
          filters: {
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-12-31T23:59:59Z'
            },
            tags: ['llm'],
            types: ['llm-validation'],
            purposes: ['analysis']
          },
          outputPath: 'snapshot-export.yml'
        };

      case 'FossilBrowserParamsSchema':
        return {
          ...minimal,
          filters: {
            tags: ['llm'],
            types: ['llm-validation'],
            purposes: ['analysis'],
            contexts: ['test'],
            models: ['gpt-3.5-turbo', 'gpt-4'],
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-12-31T23:59:59Z'
            }
          },
          selectedFossils: ['fossil-1', 'fossil-2']
        };

      case 'PatternAnalysisParamsSchema':
        return {
          ...minimal,
          fossils: [], // Will be populated from query
          timeRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-12-31T23:59:59Z'
          },
          qualityThresholds: {
            excellent: 0.9,
            good: 0.8,
            fair: 0.7,
            poor: 0.6
          }
        };

      case 'AuditReportParamsSchema':
        return {
          ...minimal,
          fossils: [], // Will be populated from query
          timeRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-12-31T23:59:59Z'
          },
          outputPath: 'audit-report.md'
        };

      case 'QualityTrendParamsSchema':
        return {
          ...minimal,
          fossils: [], // Will be populated from query
          timeRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-12-31T23:59:59Z'
          },
          includePredictions: true,
          outputPath: 'quality-trends.json'
        };

      case 'WorkflowIntegrationParamsSchema':
        return {
          ...minimal,
          filePath: 'src/services/llm.ts',
          integrationTypes: ['context', 'highlight', 'completion', 'navigation']
        };

      default:
        return minimal;
    }
  }

  /**
   * Get invalid params for a schema
   */
  private getInvalidParams(schemaName: string): any {
    switch (schemaName) {
      case 'SnapshotAnalysisParamsSchema':
        return {
          limit: -1, // Invalid: negative number
          offset: 'invalid', // Invalid: string instead of number
          includeMetadata: 'yes' // Invalid: string instead of boolean
        };

      case 'SnapshotExportParamsSchema':
        return {
          format: 'invalid-format', // Invalid: not in enum
          includeMetadata: 123 // Invalid: number instead of boolean
        };

      case 'FossilBrowserParamsSchema':
        return {
          viewMode: 'invalid-mode', // Invalid: not in enum
          sortBy: 123, // Invalid: number instead of string
          limit: 'invalid' // Invalid: string instead of number
        };

      case 'PatternAnalysisParamsSchema':
        return {
          analysisTypes: ['invalid-type'], // Invalid: not in enum
          qualityThresholds: {
            excellent: 2.0 // Invalid: > 1.0
          }
        };

      case 'AuditReportParamsSchema':
        return {
          complianceChecks: ['invalid-check'], // Invalid: not in enum
          outputFormat: 'invalid' // Invalid: not in enum
        };

      case 'QualityTrendParamsSchema':
        return {
          granularity: 'invalid', // Invalid: not in enum
          metrics: ['invalid-metric'] // Invalid: not in enum
        };

      case 'WorkflowIntegrationParamsSchema':
        return {
          contextType: 'invalid', // Invalid: not in enum
          integrationTypes: ['invalid-type'] // Invalid: not in enum
        };

      default:
        return { invalid: 'data' };
    }
  }

  /**
   * Generate validation report
   */
  generateReport(): string {
    const totalSchemas = this.results.length;
    const validSchemas = this.results.filter(r => r.isValid).length;
    const failedSchemas = this.results.filter(r => !r.isValid);

    let report = `# Snapshot Schema Validation Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Schemas**: ${totalSchemas}\n`;
    report += `- **Valid Schemas**: ${validSchemas}\n`;
    report += `- **Failed Schemas**: ${failedSchemas.length}\n`;
    report += `- **Success Rate**: ${((validSchemas / totalSchemas) * 100).toFixed(1)}%\n\n`;

    if (failedSchemas.length > 0) {
      report += `## Failed Schemas\n\n`;
      failedSchemas.forEach(schema => {
        report += `### ${schema.schema}\n\n`;
        schema.errors.forEach(error => {
          report += `- ❌ ${error.message}\n`;
        });
        report += `\n`;
      });
    }

    report += `## All Results\n\n`;
    this.results.forEach(result => {
      const status = result.isValid ? '✅' : '❌';
      report += `${status} **${result.schema}**: ${result.isValid ? 'Valid' : 'Invalid'}\n`;
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          report += `  - ${error.message}\n`;
        });
      }
      report += `\n`;
    });

    return report;
  }
}

// Main execution
async function main() {
  console.log('🔍 Snapshot Schema Validation');
  console.log('='.repeat(50));
  console.log('Validating that snapshot processing schemas follow established patterns');
  console.log('');

  const validator = new SnapshotSchemaValidator();

  try {
    const results = await validator.validateAllSchemas();

    // Display summary
    const totalSchemas = results.length;
    const validSchemas = results.filter(r => r.isValid).length;
    const failedSchemas = results.filter(r => !r.isValid);

    console.log('📋 Validation Summary');
    console.log('='.repeat(50));
    console.log(`Total schemas: ${totalSchemas}`);
    console.log(`Valid schemas: ${validSchemas}`);
    console.log(`Failed schemas: ${failedSchemas.length}`);
    console.log(`Success rate: ${((validSchemas / totalSchemas) * 100).toFixed(1)}%`);

    if (failedSchemas.length > 0) {
      console.log('\n❌ Failed schemas:');
      failedSchemas.forEach(schema => {
        console.log(`  - ${schema.schema}: ${schema.errors.map(e => e.message).join(', ')}`);
      });
    }

    // Generate and save report
    const report = validator.generateReport();
    const reportPath = 'snapshot-schema-validation-report.md';
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`\n📁 Validation report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (failedSchemas.length > 0) {
      console.log('\n❌ Some schemas failed validation');
      process.exit(1);
    } else {
      console.log('\n✅ All schemas passed validation!');
      console.log('💡 Schemas follow established type and schema patterns');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.main) {
  main();
}

export { SnapshotSchemaValidator, ValidationResult }; 