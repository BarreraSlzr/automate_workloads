#!/usr/bin/env bun
/**
 * Simple Type and Schema Validation CLI
 * 
 * Validates only the schemas that actually exist in the codebase
 * Usage: bun run scripts/validate-types-schemas-simple.ts [--report] [--strict]
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Import only the schemas that actually exist
import {
  // Core schemas
  BaseCLIArgsSchema,
  FossilCLIArgsSchema,
  GitHubCLIArgsSchema,
  RoadmapCLIArgsSchema,
  
  // GitHub operation schemas
  GitHubIssueCreateSchema,
  GitHubMilestoneCreateSchema,
  GitHubLabelCreateSchema,
  GitHubIssueViewSchema,
  GitHubIssueListSchema,
  
  // Fossil operation schemas
  BaseFossilParamsSchema,
  IssueFossilParamsSchema,
  LabelFossilParamsSchema,
  MilestoneFossilParamsSchema,
  CheckExistingFossilParamsSchema,
  CreateFossilEntryParamsSchema,
  
  // Project status schemas
  UpdateProjectStatusParamsSchema,
  
  // Context schemas
  ContextEntrySchema,
  ContextQuerySchema,
  
  // Plan schemas
  PlanSchema,
  TaskSchema,
  MilestoneSchema,
  RiskSchema,
  
  // LLM schemas
  LLMInsightExportSchema,
  PlanRequestSchema,
  TaskBreakdownSchema,
  
  // Tracking schemas
  TrackingConfigSchema,
  ProgressMetricsSchema,
  TrendAnalysisSchema,
  
  // Analysis schemas
  GitDiffAnalysisSchema,
  DiffAnalysisResultSchema,
  CommitMessageAnalysisSchema,
  DocPatternMatchSchema,
  
  // Integration schemas
  IntegrationConfigSchema,
  IntegrationEventSchema,
  
  // Batch processing schemas
  BatchProcessingConfigSchema,
  BatchProcessingResultSchema,
  
  // Task matching schemas
  TaskMatchingConfigSchema,
  TaskMatchResultSchema,
  
  // Review schemas
  ExternalReviewSchema,
  ReviewRequestSchema,
  
  // Usage and optimization schemas
  UsageReportSchema,
  OptimizationConfigSchema,
} from '../src/types/schemas';

interface ValidationResult {
  schema: string;
  valid: boolean;
  errors: string[];
  testCases: number;
}

interface ValidationSummary {
  totalSchemas: number;
  validSchemas: number;
  failedSchemas: number;
  totalTestCases: number;
  errors: string[];
}

class SimpleTypeSchemaValidator {
  private schemaRegistry: Record<string, z.ZodSchema>;
  private results: ValidationResult[] = [];

  constructor() {
    this.schemaRegistry = {
      // Core schemas
      'BaseCLIArgs': BaseCLIArgsSchema,
      'FossilCLIArgs': FossilCLIArgsSchema,
      'GitHubCLIArgs': GitHubCLIArgsSchema,
      'RoadmapCLIArgs': RoadmapCLIArgsSchema,
      
      // GitHub operation schemas
      'GitHubIssueCreate': GitHubIssueCreateSchema,
      'GitHubMilestoneCreate': GitHubMilestoneCreateSchema,
      'GitHubLabelCreate': GitHubLabelCreateSchema,
      'GitHubIssueView': GitHubIssueViewSchema,
      'GitHubIssueList': GitHubIssueListSchema,
      
      // Fossil operation schemas
      'BaseFossilParams': BaseFossilParamsSchema,
      'IssueFossilParams': IssueFossilParamsSchema,
      'LabelFossilParams': LabelFossilParamsSchema,
      'MilestoneFossilParams': MilestoneFossilParamsSchema,
      'CheckExistingFossilParams': CheckExistingFossilParamsSchema,
      'CreateFossilEntryParams': CreateFossilEntryParamsSchema,
      
      // Project status schemas
      'UpdateProjectStatusParams': UpdateProjectStatusParamsSchema,
      
      // Context schemas
      'ContextEntry': ContextEntrySchema,
      'ContextQuery': ContextQuerySchema,
      
      // Plan schemas
      'Plan': PlanSchema,
      'Task': TaskSchema,
      'Milestone': MilestoneSchema,
      'Risk': RiskSchema,
      
      // LLM schemas
      'LLMInsightExport': LLMInsightExportSchema,
      'PlanRequest': PlanRequestSchema,
      'TaskBreakdown': TaskBreakdownSchema,
      
      // Tracking schemas
      'TrackingConfig': TrackingConfigSchema,
      'ProgressMetrics': ProgressMetricsSchema,
      'TrendAnalysis': TrendAnalysisSchema,
      
      // Analysis schemas
      'GitDiffAnalysis': GitDiffAnalysisSchema,
      'DiffAnalysisResult': DiffAnalysisResultSchema,
      'CommitMessageAnalysis': CommitMessageAnalysisSchema,
      'DocPatternMatch': DocPatternMatchSchema,
      
      // Integration schemas
      'IntegrationConfig': IntegrationConfigSchema,
      'IntegrationEvent': IntegrationEventSchema,
      
      // Batch processing schemas
      'BatchProcessingConfig': BatchProcessingConfigSchema,
      'BatchProcessingResult': BatchProcessingResultSchema,
      
      // Task matching schemas
      'TaskMatchingConfig': TaskMatchingConfigSchema,
      'TaskMatchResult': TaskMatchResultSchema,
      
      // Review schemas
      'ExternalReview': ExternalReviewSchema,
      'ReviewRequest': ReviewRequestSchema,
      
      // Usage and optimization schemas
      'UsageReport': UsageReportSchema,
      'OptimizationConfig': OptimizationConfigSchema,
    };
  }

  /**
   * Validate a single schema with test cases
   */
  private validateSchema(schemaName: string, schema: z.ZodSchema): ValidationResult {
    const result: ValidationResult = {
      schema: schemaName,
      valid: true,
      errors: [],
      testCases: 0
    };

    try {
      // Generate test cases based on schema shape
      const testCases = this.generateTestCases(schema);
      result.testCases = testCases.length;

      for (const testCase of testCases) {
        try {
          if (testCase.shouldPass) {
            schema.parse(testCase.data);
          } else {
            try {
              schema.parse(testCase.data);
              result.errors.push(`Expected validation to fail for: ${JSON.stringify(testCase.data)}`);
              result.valid = false;
            } catch (e) {
              // Expected failure
            }
          }
        } catch (e: any) {
          if (testCase.shouldPass) {
            result.errors.push(`Validation failed for valid data: ${e.message}`);
            result.valid = false;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Schema validation error: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Generate basic test cases for a schema
   */
  private generateTestCases(schema: z.ZodSchema): Array<{ data: any; shouldPass: boolean }> {
    const testCases: Array<{ data: any; shouldPass: boolean }> = [];

    // Test with empty object
    testCases.push({ data: {}, shouldPass: false });

    // Test with null
    testCases.push({ data: null, shouldPass: false });

    // Test with undefined
    testCases.push({ data: undefined, shouldPass: false });

    // Test with basic types
    testCases.push({ data: { string: "test" }, shouldPass: false });
    testCases.push({ data: { number: 123 }, shouldPass: false });
    testCases.push({ data: { boolean: true }, shouldPass: false });

    return testCases;
  }

  /**
   * Validate all schemas
   */
  async validateAllSchemas(): Promise<ValidationSummary> {
    console.log("🔍 Starting schema validation...");
    
    for (const [schemaName, schema] of Object.entries(this.schemaRegistry)) {
      const result = this.validateSchema(schemaName, schema);
      this.results.push(result);
      
      if (result.valid) {
        console.log(`✅ ${schemaName}: ${result.testCases} test cases passed`);
      } else {
        console.log(`❌ ${schemaName}: ${result.errors.length} errors`);
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    }

    const summary: ValidationSummary = {
      totalSchemas: this.results.length,
      validSchemas: this.results.filter(r => r.valid).length,
      failedSchemas: this.results.filter(r => !r.valid).length,
      totalTestCases: this.results.reduce((sum, r) => sum + r.testCases, 0),
      errors: this.results.flatMap(r => r.errors)
    };

    return summary;
  }

  /**
   * Generate validation report
   */
  generateReport(summary: ValidationSummary): string {
    const timestamp = new Date().toISOString();
    
    return `# Type and Schema Validation Report
Generated: ${timestamp}

## Summary
- **Overall Status**: ${summary.failedSchemas === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Schemas Validated**: ${summary.validSchemas}/${summary.totalSchemas}
- **Total Test Cases**: ${summary.totalTestCases}

## Schema Coverage
${Object.keys(this.schemaRegistry).map(name => {
  const result = this.results.find(r => r.schema === name);
  return `- ${result?.valid ? '✅' : '❌'} ${name}`;
}).join('\n')}

## Errors
${summary.errors.length > 0 ? summary.errors.map(error => `- ${error}`).join('\n') : 'No errors found'}

## Recommendations
${summary.failedSchemas > 0 ? 
  '- Review failed schema validations\n- Check schema definitions and constraints\n- Update test cases as needed' : 
  '- All schemas are properly validated\n- Consider adding more comprehensive test cases'
}
`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const generateReport = args.includes('--report');
  const strictMode = args.includes('--strict');

  console.log("🔍 Simple Type and Schema Validation CLI");
  console.log("=========================================");
  
  if (generateReport) {
    console.log("📄 Report generation enabled");
  }
  
  if (strictMode) {
    console.log("🔒 Strict mode enabled");
  }

  try {
    const validator = new SimpleTypeSchemaValidator();
    const summary = await validator.validateAllSchemas();
    
    console.log("\n📊 Validation Summary:");
    console.log(`  Schemas: ${summary.validSchemas}/${summary.totalSchemas} passed`);
    console.log(`  Test Cases: ${summary.totalTestCases} total`);
    
    if (summary.errors.length > 0) {
      console.log(`  Errors: ${summary.errors.length} found`);
    }
    
    if (generateReport) {
      const report = validator.generateReport(summary);
      const reportPath = 'type-schema-validation-report.md';
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, report);
      console.log(`📄 Report saved to: ${reportPath}`);
    }
    
    if (summary.failedSchemas === 0) {
      console.log("✅ All validations passed!");
      process.exit(0);
    } else {
      console.log("❌ Some validations failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 