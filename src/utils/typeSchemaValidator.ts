/**
 * Type and Schema Validation Utility
 * 
 * Comprehensive validation utility for enforcing TYPE_AND_SCHEMA_PATTERNS.md
 * Provides validation for schemas, type patterns, and compliance checks.
 */

import { z } from 'zod';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
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
  GitHubLabelListSchema,
  GitHubMilestoneListSchema,
  GitHubIssueEditSchema,
  GitHubProjectSchema,
  GitHubAuthSchema,
  
  // Fossil operation schemas
  CurateFossilParamsSchema,
  CreateFossilIssueParamsSchema,
  CreateFossilLabelParamsSchema,
  CreateFossilMilestoneParamsSchema,
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
} from '../types/schemas';

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalSchemas: number;
    validatedSchemas: number;
    failedSchemas: number;
    totalPatterns: number;
    compliantPatterns: number;
    nonCompliantPatterns: number;
  };
}

export interface SchemaValidationResult {
  schemaName: string;
  success: boolean;
  errors: string[];
  testCases: number;
  passedTests: number;
}

export interface PatternValidationResult {
  patternName: string;
  compliant: boolean;
  violations: string[];
  files: string[];
}

export class TypeSchemaValidator {
  private schemaRegistry: Record<string, z.ZodSchema>;
  private validationResults: ValidationResult;

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
      'GitHubLabelList': GitHubLabelListSchema,
      'GitHubMilestoneList': GitHubMilestoneListSchema,
      'GitHubIssueEdit': GitHubIssueEditSchema,
      'GitHubProject': GitHubProjectSchema,
      'GitHubAuth': GitHubAuthSchema,
      
      // Fossil operation schemas
      'CurateFossilParams': CurateFossilParamsSchema,
      'CreateFossilIssueParams': CreateFossilIssueParamsSchema,
      'CreateFossilLabelParams': CreateFossilLabelParamsSchema,
      'CreateFossilMilestoneParams': CreateFossilMilestoneParamsSchema,
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

    this.validationResults = {
      success: true,
      errors: [],
      warnings: [],
      summary: {
        totalSchemas: Object.keys(this.schemaRegistry).length,
        validatedSchemas: 0,
        failedSchemas: 0,
        totalPatterns: 0,
        compliantPatterns: 0,
        nonCompliantPatterns: 0,
      },
    };
  }

  /**
   * Validate all schemas with test cases
   */
  async validateAllSchemas(): Promise<SchemaValidationResult[]> {
    const results: SchemaValidationResult[] = [];

    for (const [schemaName, schema] of Object.entries(this.schemaRegistry)) {
      const result = await this.validateSchema(schemaName, schema);
      results.push(result);
      
      if (result.success) {
        this.validationResults.summary.validatedSchemas++;
      } else {
        this.validationResults.summary.failedSchemas++;
        this.validationResults.errors.push(`Schema validation failed for ${schemaName}: ${result.errors.join(', ')}`);
      }
    }

    return results;
  }

  /**
   * Validate a specific schema with test cases
   */
  private async validateSchema(schemaName: string, schema: z.ZodSchema): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      schemaName,
      success: true,
      errors: [],
      testCases: 0,
      passedTests: 0,
    };

    try {
      // Generate test cases based on schema type
      const testCases = this.generateTestCases(schemaName, schema);
      result.testCases = testCases.length;

      for (const testCase of testCases) {
        try {
          schema.parse(testCase.data);
          result.passedTests++;
        } catch (error) {
          if (testCase.shouldPass) {
            result.errors.push(`Test case "${testCase.name}" should pass but failed: ${error}`);
          }
        }
      }

      // Test invalid cases
      const invalidTestCases = this.generateInvalidTestCases(schemaName, schema);
      for (const testCase of invalidTestCases) {
        try {
          schema.parse(testCase.data);
          result.errors.push(`Test case "${testCase.name}" should fail but passed`);
        } catch (error) {
          result.passedTests++;
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`Schema validation error: ${error}`);
    }

    return result;
  }

  /**
   * Generate test cases for schema validation
   */
  private generateTestCases(schemaName: string, schema: z.ZodSchema): Array<{ name: string; data: any; shouldPass: boolean }> {
    const testCases: Array<{ name: string; data: any; shouldPass: boolean }> = [];

    // Generate minimal valid test cases
    testCases.push({
      name: 'minimal valid',
      data: this.generateMinimalValidData(schemaName),
      shouldPass: true,
    });

    // Generate complete valid test cases
    testCases.push({
      name: 'complete valid',
      data: this.generateCompleteValidData(schemaName),
      shouldPass: true,
    });

    return testCases;
  }

  /**
   * Generate invalid test cases for schema validation
   */
  private generateInvalidTestCases(schemaName: string, schema: z.ZodSchema): Array<{ name: string; data: any; shouldPass: boolean }> {
    const testCases: Array<{ name: string; data: any; shouldPass: boolean }> = [];

    // Generate invalid test cases based on schema type
    if (schemaName.includes('CLIArgs')) {
      testCases.push({
        name: 'invalid boolean type',
        data: { dryRun: 'not a boolean' },
        shouldPass: false,
      });
    }

    if (schemaName.includes('GitHub')) {
      testCases.push({
        name: 'missing required fields',
        data: { title: 'Test' }, // Missing owner and repo
        shouldPass: false,
      });
    }

    if (schemaName.includes('Fossil')) {
      testCases.push({
        name: 'invalid type enum',
        data: { type: 'invalid' },
        shouldPass: false,
      });
    }

    return testCases;
  }

  /**
   * Generate minimal valid data for a schema
   */
  private generateMinimalValidData(schemaName: string): any {
    switch (schemaName) {
      case 'BaseCLIArgs':
        return {};
      
      case 'FossilCLIArgs':
        return { inputPath: 'fossils/roadmap.yml' };
      
      case 'GitHubCLIArgs':
        return {};
      
      case 'GitHubIssueCreate':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          title: 'Test Issue',
        };
      
      case 'CurateFossilParams':
        return { inputYaml: 'fossils/roadmap.yml' };
      
      case 'CreateFossilIssueParams':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          title: 'Test Fossil Issue',
        };
      
      case 'ContextEntry':
        return {
          id: 'entry-1',
          type: 'knowledge',
          title: 'Test Entry',
          content: 'Entry content',
          tags: ['test'],
          metadata: {},
          source: 'manual',
          version: 1,
          children: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };
      
      default:
        return {};
    }
  }

  /**
   * Generate complete valid data for a schema
   */
  private generateCompleteValidData(schemaName: string): any {
    const minimal = this.generateMinimalValidData(schemaName);
    
    switch (schemaName) {
      case 'BaseCLIArgs':
        return {
          dryRun: true,
          test: true,
          verbose: true,
          help: true,
        };
      
      case 'FossilCLIArgs':
        return {
          ...minimal,
          outputPath: 'output/roadmap.json',
          format: 'json',
          validate: false,
          dryRun: true,
          test: true,
          verbose: true,
          help: true,
        };
      
      case 'GitHubIssueCreate':
        return {
          ...minimal,
          body: 'Issue description',
          labels: ['bug', 'help wanted'],
          assignees: ['user1', 'user2'],
          milestone: 'v1.0.0',
          project: 'Project 1',
          template: 'bug_report',
          web: true,
          editor: false,
        };
      
      case 'CreateFossilIssueParams':
        return {
          ...minimal,
          body: 'Issue body content',
          labels: ['fossil', 'automation'],
          milestone: 'v1.0.0',
          section: 'Development',
          type: 'action',
          tags: ['feature', 'enhancement'],
          metadata: { priority: 'high' },
          purpose: 'Track feature development',
          checklist: 'Implementation checklist',
          automationMetadata: 'Automation metadata',
          extraBody: 'Additional body content',
        };
      
      default:
        return minimal;
    }
  }

  /**
   * Validate type patterns in the codebase
   */
  async validateTypePatterns(): Promise<PatternValidationResult[]> {
    const results: PatternValidationResult[] = [];
    
    // Check PARAMS OBJECT PATTERN
    results.push(await this.validateParamsObjectPattern());
    
    // Check fossil-backed creation pattern
    results.push(await this.validateFossilPattern());
    
    // Check CLI argument validation pattern
    results.push(await this.validateCLIPattern());
    
    // Check type safety patterns
    results.push(await this.validateTypeSafetyPattern());
    
    // Check schema registry usage pattern
    results.push(await this.validateSchemaRegistryPattern());

    // Update summary
    this.validationResults.summary.totalPatterns = results.length;
    this.validationResults.summary.compliantPatterns = results.filter(r => r.compliant).length;
    this.validationResults.summary.nonCompliantPatterns = results.filter(r => !r.compliant).length;

    return results;
  }

  /**
   * Validate PARAMS OBJECT PATTERN compliance
   */
  private async validateParamsObjectPattern(): Promise<PatternValidationResult> {
    const result: PatternValidationResult = {
      patternName: 'PARAMS OBJECT PATTERN',
      compliant: true,
      violations: [],
      files: [],
    };

    const srcFiles = this.getTypeScriptFiles('src');
    
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for functions with multiple parameters that don't use Params object
      const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)/g) || [];
      const classMethodMatches = content.match(/\w+\s*\([^)]*\)\s*\{/g) || [];
      
      for (const match of [...functionMatches, ...classMethodMatches]) {
        const params = match.match(/\(([^)]*)\)/)?.[1] || "";
        const paramCount = params.split(",").filter(p => p.trim()).length;
        
        if (paramCount > 2 && !params.includes("Params") && !params.includes("params")) {
          result.violations.push(`Function with multiple parameters doesn't use Params object: ${match}`);
          result.files.push(file);
          result.compliant = false;
        }
      }
    }

    return result;
  }

  /**
   * Validate fossil-backed creation pattern
   */
  private async validateFossilPattern(): Promise<PatternValidationResult> {
    const result: PatternValidationResult = {
      patternName: 'FOSSIL-BACKED CREATION',
      compliant: true,
      violations: [],
      files: [],
    };

    const srcFiles = this.getTypeScriptFiles('src');
    
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for direct GitHub CLI calls instead of fossil-backed creation
      if (content.includes("gh issue create") || content.includes("gh label create") || content.includes("gh milestone create")) {
        if (!content.includes("createFossilIssue") && !content.includes("createFossilLabel") && !content.includes("createFossilMilestone")) {
          result.violations.push(`Direct GitHub CLI calls found instead of fossil-backed creation`);
          result.files.push(file);
          result.compliant = false;
        }
      }
    }

    return result;
  }

  /**
   * Validate CLI argument validation pattern
   */
  private async validateCLIPattern(): Promise<PatternValidationResult> {
    const result: PatternValidationResult = {
      patternName: 'CLI ARGUMENT VALIDATION',
      compliant: true,
      violations: [],
      files: [],
    };

    const srcFiles = this.getTypeScriptFiles('src');
    
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for manual CLI argument parsing instead of parseCLIArgs
      if (content.includes("process.argv") && !content.includes("parseCLIArgs")) {
        result.violations.push(`Manual CLI argument parsing found instead of parseCLIArgs`);
        result.files.push(file);
        result.compliant = false;
      }
    }

    return result;
  }

  /**
   * Validate type safety patterns
   */
  private async validateTypeSafetyPattern(): Promise<PatternValidationResult> {
    const result: PatternValidationResult = {
      patternName: 'TYPE SAFETY',
      compliant: true,
      violations: [],
      files: [],
    };

    const srcFiles = this.getTypeScriptFiles('src');
    
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for proper type imports
      if (content.includes("interface") || content.includes("type")) {
        if (content.includes("export interface") || content.includes("export type")) {
          if (file.startsWith("src/") && !file.startsWith("src/types/")) {
            result.violations.push(`Type definitions found outside src/types/`);
            result.files.push(file);
            result.compliant = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate schema registry usage pattern
   */
  private async validateSchemaRegistryPattern(): Promise<PatternValidationResult> {
    const result: PatternValidationResult = {
      patternName: 'SCHEMA REGISTRY USAGE',
      compliant: true,
      violations: [],
      files: [],
    };

    const srcFiles = this.getTypeScriptFiles('src');
    
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for proper Zod schema usage
      if (content.includes("z.object") || content.includes("z.enum")) {
        if (!content.includes("import") || !content.includes("schemas")) {
          result.violations.push(`Zod schemas used but not imported from schemas registry`);
          result.files.push(file);
          result.compliant = false;
        }
      }
    }

    return result;
  }

  /**
   * Get all TypeScript files in a directory
   */
  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!existsSync(dir)) return files;
    
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const path = join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...this.getTypeScriptFiles(path));
      } else if (item.isFile() && item.name.endsWith('.ts')) {
        files.push(path);
      }
    }
    
    return files;
  }

  /**
   * Run comprehensive validation
   */
  async runValidation(): Promise<ValidationResult> {
    console.log("🔍 Starting comprehensive type and schema validation...");
    
    // Validate all schemas
    console.log("📋 Validating schemas...");
    const schemaResults = await this.validateAllSchemas();
    
    // Validate type patterns
    console.log("🔧 Validating type patterns...");
    const patternResults = await this.validateTypePatterns();
    
    // Update overall success
    this.validationResults.success = 
      this.validationResults.summary.failedSchemas === 0 && 
      this.validationResults.summary.nonCompliantPatterns === 0;
    
    // Generate summary
    console.log("📊 Validation Summary:");
    console.log(`  Schemas: ${this.validationResults.summary.validatedSchemas}/${this.validationResults.summary.totalSchemas} passed`);
    console.log(`  Patterns: ${this.validationResults.summary.compliantPatterns}/${this.validationResults.summary.totalPatterns} compliant`);
    
    if (this.validationResults.errors.length > 0) {
      console.log("❌ Errors:");
      this.validationResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.validationResults.warnings.length > 0) {
      console.log("⚠️  Warnings:");
      this.validationResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    return this.validationResults;
  }

  /**
   * Generate validation report
   */
  generateReport(): string {
    const report = [
      "# Type and Schema Validation Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      `- **Overall Status**: ${this.validationResults.success ? '✅ PASSED' : '❌ FAILED'}`,
      `- **Schemas Validated**: ${this.validationResults.summary.validatedSchemas}/${this.validationResults.summary.totalSchemas}`,
      `- **Patterns Compliant**: ${this.validationResults.summary.compliantPatterns}/${this.validationResults.summary.totalPatterns}`,
      "",
      "## Schema Coverage",
      "- ✅ Core CLI schemas",
      "- ✅ GitHub operation schemas", 
      "- ✅ Fossil operation schemas",
      "- ✅ Context schemas",
      "- ✅ Plan schemas",
      "- ✅ LLM schemas",
      "- ✅ Tracking schemas",
      "- ✅ Analysis schemas",
      "- ✅ Integration schemas",
      "- ✅ Batch processing schemas",
      "- ✅ Task matching schemas",
      "- ✅ Review schemas",
      "- ✅ Usage schemas",
      "",
      "## Pattern Compliance",
      "- ✅ PARAMS OBJECT PATTERN",
      "- ✅ Fossil-backed creation",
      "- ✅ CLI argument validation",
      "- ✅ Type safety",
      "- ✅ Schema registry usage",
      "",
    ];

    if (this.validationResults.errors.length > 0) {
      report.push("## Errors", "");
      this.validationResults.errors.forEach(error => {
        report.push(`- ❌ ${error}`);
      });
      report.push("");
    }

    if (this.validationResults.warnings.length > 0) {
      report.push("## Warnings", "");
      this.validationResults.warnings.forEach(warning => {
        report.push(`- ⚠️  ${warning}`);
      });
      report.push("");
    }

    return report.join("\n");
  }
}

/**
 * CLI interface for the validator
 */
export async function runTypeSchemaValidation(): Promise<void> {
  const validator = new TypeSchemaValidator();
  const result = await validator.runValidation();
  
  if (!result.success) {
    console.error("❌ Type and schema validation failed!");
    process.exit(1);
  }
  
  console.log("✅ Type and schema validation passed!");
  
  // Generate and save report
  const report = validator.generateReport();
  const fs = await import('fs');
  fs.writeFileSync('type-schema-validation-report.md', report);
  console.log("📄 Validation report saved to type-schema-validation-report.md");
} 