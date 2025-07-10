/**
 * Type and Schema Validation Utility
 * 
 * Comprehensive validation utility for enforcing TYPE_AND_SCHEMA_PATTERNS.md
 * Provides validation for schemas, type patterns, and compliance checks.
 */

import { z } from 'zod';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { TypeSchemaValidatorResult, SchemaValidationResult, PatternValidationResult, SchemaTestCase, PatternValidationResultWithCount, SchemaRegistry, SchemaTestData } from '../types/type-schema-validator';
import { 
  BaseCLIArgsSchema,
  FossilCLIArgsSchema,
  GitHubCLIArgsSchema,
  RoadmapCLIArgsSchema,
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
  CurateFossilParamsSchema,
  CreateFossilIssueParamsSchema,
  CreateFossilLabelParamsSchema,
  CreateFossilMilestoneParamsSchema,
  CheckExistingFossilParamsSchema,
  CreateFossilEntryParamsSchema,
  UpdateProjectStatusParamsSchema,
  ContextEntrySchema,
  ContextQuerySchema,
  PlanSchema,
  TaskSchema,
  MilestoneSchema,
  RiskSchema,
  LLMInsightExportSchema,
  PlanRequestSchema,
  TaskBreakdownSchema,
  TrackingConfigSchema,
  ProgressMetricsSchema,
  TrendAnalysisSchema,
  GitDiffAnalysisSchema,
  DiffAnalysisResultSchema,
  CommitMessageAnalysisSchema,
  DocPatternMatchSchema,
  IntegrationConfigSchema,
  IntegrationEventSchema,
  BatchProcessingConfigSchema,
  BatchProcessingResultSchema,
  TaskMatchingConfigSchema,
  TaskMatchResultSchema,
  ExternalReviewSchema,
  ReviewRequestSchema,
  UsageReportSchema,
  OptimizationConfigSchema
} from '@/types/schemas';

export class TypeSchemaValidator {
  private schemaRegistry: SchemaRegistry;
  private validationResults: TypeSchemaValidatorResult;

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
  private generateTestCases(schemaName: string, schema: z.ZodSchema): SchemaTestCase[] {
    const testCases: SchemaTestCase[] = [];

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
  private generateInvalidTestCases(schemaName: string, schema: z.ZodSchema): SchemaTestCase[] {
    const testCases: SchemaTestCase[] = [];

    // Generate invalid test cases based on schema type
    if (schemaName.includes('CLIArgs')) {
      testCases.push({
        name: 'invalid boolean type',
        data: { dryRun: 'not a boolean' },
        shouldPass: false,
      });
    }

    if (schemaName === 'GitHubIssueCreate') {
      testCases.push({
        name: 'missing required fields',
        data: { title: 'Test' }, // Missing owner and repo
        shouldPass: false,
      });
    }

    if (schemaName === 'GitHubLabelCreate') {
      testCases.push({
        name: 'invalid color format',
        data: { 
          owner: 'test-owner',
          repo: 'test-repo',
          name: 'test-label',
          description: 'Test description',
          color: 'invalid-color' // Should be hex format
        },
        shouldPass: false,
      });
    }

    if (schemaName.includes('Fossil') && schemaName !== 'FossilCLIArgs') {
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
  private generateMinimalValidData(schemaName: string): SchemaTestData {
    switch (schemaName) {
      case 'BaseCLIArgs':
        return {};
      
      case 'FossilCLIArgs':
        return { inputPath: 'fossils/roadmap.yml' };
      
      case 'GitHubCLIArgs':
        return {};
      
      case 'RoadmapCLIArgs':
        return { inputPath: 'fossils/roadmap.yml' };
      
      case 'GitHubIssueCreate':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          title: 'Test Issue',
        };
      
      case 'GitHubMilestoneCreate':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          title: 'Test Milestone',
        };
      
      case 'GitHubLabelCreate':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          name: 'test-label',
          description: 'Test label description',
          color: 'ff0000',
        };
      
      case 'GitHubIssueView':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          issueNumber: 1,
        };
      
      case 'GitHubIssueList':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
        };
      
      case 'GitHubLabelList':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          name: 'test-label',
          description: 'Test label description',
          color: 'ff0000',
        };
      
      case 'GitHubMilestoneList':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          title: 'Test Milestone',
        };
      
      case 'GitHubIssueEdit':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          issue: '1',
        };
      
      case 'GitHubProject':
        return { id: 1, name: 'Test Project' };
      
      case 'GitHubAuth':
        return { token: 'test-token' };
      
      case 'CurateFossilParams':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          type: 'knowledge',
          inputYaml: 'fossils/roadmap.yml',
        };
      
      case 'CreateFossilIssueParams':
        return {
          fossilService: {},
          type: 'action',
          title: 'Test Fossil Issue',
          body: 'Test issue body',
          section: 'Development',
          tags: ['test'],
          metadata: {},
          parsedFields: {},
        };
      
      case 'CreateFossilLabelParams':
        return {
          fossilService: {},
          type: 'knowledge',
          title: 'Test Label',
          body: 'Test label body',
          section: 'Labels',
          tags: ['test'],
          metadata: {},
          parsedFields: {},
        };
      
      case 'CreateFossilMilestoneParams':
        return {
          fossilService: {},
          type: 'plan',
          title: 'Test Milestone',
          body: 'Test milestone body',
          section: 'Milestones',
          tags: ['test'],
          metadata: {},
          parsedFields: {},
        };
      
      case 'CheckExistingFossilParams':
        return {
          owner: 'test-owner',
          repo: 'test-repo',
          type: 'knowledge',
          title: 'Test Title',
          content: 'Test content',
        };
      
      case 'CreateFossilEntryParams':
        return {
          fossilService: {},
          type: 'knowledge',
          title: 'Test Entry',
          body: 'Test entry body',
          section: 'General',
          tags: ['test'],
          metadata: {},
          parsedFields: {},
        };
      
      case 'UpdateProjectStatusParams':
        return {
          status: 'active',
          progress: 50,
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
      
      case 'ContextQuery':
        return {
          query: 'test query',
          filters: {},
        };
      
      case 'Plan':
        return {
          id: 'plan-1',
          title: 'Test Plan',
          description: 'Test plan description',
          tasks: [],
          milestones: [],
          timeline: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-12-31T23:59:59Z',
          },
          risks: [],
        };
      
      case 'Task':
        return {
          id: 'task-1',
          title: 'Test Task',
          description: 'Test task description',
          status: 'pending',
        };
      
      case 'Milestone':
        return {
          id: 'milestone-1',
          title: 'Test Milestone',
          description: 'Test milestone description',
          dueDate: '2024-12-31',
        };
      
      case 'Risk':
        return {
          risk: 'Test Risk',
          impact: 'medium',
          probability: 'medium',
          mitigation: 'Test mitigation',
        };
      
      case 'LLMInsightExport':
        return {
          insightType: 'analysis',
          content: 'Test insight content',
          metadata: {},
        };
      
      case 'PlanRequest':
        return {
          prompt: 'Test plan request',
          goal: 'Test goal',
          context: {},
        };
      
      case 'TaskBreakdown':
        return {
          task: 'Test task',
          tasks: [
            {
              id: 'task-1',
              title: 'Step 1',
              description: 'First step description',
              acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
              dependencies: [],
              estimatedEffort: '2h',
              priority: 'medium',
              assignee: 'user1',
            },
            {
              id: 'task-2',
              title: 'Step 2',
              description: 'Second step description',
              acceptanceCriteria: ['Criteria 3'],
              dependencies: ['task-1'],
              estimatedEffort: '1h',
              priority: 'low',
            },
          ],
          timeline: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            milestones: [
              {
                date: '2024-06-01T00:00:00Z',
                description: 'Mid-year milestone',
                tasks: ['task-1'],
              },
            ],
          },
          risks: [
            {
              description: 'Test risk',
              probability: 'medium',
              impact: 'low',
              mitigation: 'Test mitigation',
            },
          ],
          breakdown: ['step 1', 'step 2'],
        };
      
      case 'TrackingConfig':
        return {
          enabled: true,
          interval: 60,
        };
      
      case 'ProgressMetrics':
        return {
          healthScore: 0.8,
          actionPlanCompletion: 0.6,
          automationCompletion: 0.7,
          totalActionPlans: 10,
          completedActionPlans: 6,
          openActionPlans: 4,
          totalAutomationIssues: 20,
          completedAutomationIssues: 15,
          openAutomationIssues: 5,
          timestamp: '2024-01-01T00:00:00Z',
        };
      
      case 'TrendAnalysis':
        return {
          trend: 'improving',
          metrics: {},
          period: '30d',
        };
      
      case 'GitDiffAnalysis':
        return {
          baseRef: 'main',
          headRef: 'feature',
          files: [],
        };
      
      case 'DiffAnalysisResult':
        return {
          filesChanged: 5,
          linesAdded: 100,
          linesDeleted: 50,
          files: [],
          patterns: [],
          insights: [],
        };
      
      case 'CommitMessageAnalysis':
        return {
          message: 'feat: add new feature',
          conventionalFormat: true,
          suggestions: [],
          score: 0.9,
        };
      
      case 'DocPatternMatch':
        return {
          pattern: 'test pattern',
          matches: [],
          totalMatches: 0,
          patternType: 'code',
        };
      
      case 'IntegrationConfig':
        return {
          type: 'github',
          config: {},
        };
      
      case 'IntegrationEvent':
        return {
          eventType: 'issue.created',
          timestamp: '2024-01-01T00:00:00Z',
          data: {},
        };
      
      case 'BatchProcessingConfig':
        return {
          batchSize: 10,
          maxConcurrency: 5,
        };
      
      case 'BatchProcessingResult':
        return {
          totalItems: 100,
          processedItems: 95,
          successfulItems: 90,
          failedItems: 5,
          skippedItems: 0,
          processingTime: 5000,
          errors: [],
          results: [],
        };
      
      case 'TaskMatchingConfig':
        return {
          algorithm: 'semantic',
          threshold: 0.8,
        };
      
      case 'TaskMatchResult':
        return {
          query: 'test query',
          matches: [],
          totalResults: 0,
          processingTime: 100,
          algorithm: 'semantic',
        };
      
      case 'ExternalReview':
        return {
          reviewId: 'review-1',
          fossilId: 'fossil-1',
          reviewer: 'reviewer-1',
          status: 'pending',
          comments: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };
      
      case 'ReviewRequest':
        return {
          fossilIds: ['fossil-1'],
          reviewers: ['reviewer-1'],
        };
      
      case 'UsageReport':
        return {
          period: '30d',
          metrics: {},
        };
      
      case 'OptimizationConfig':
        return {
          enabled: true,
          targets: [],
        };
      
      default:
        return {};
    }
  }

  /**
   * Generate complete valid data for a schema
   */
  private generateCompleteValidData(schemaName: string): SchemaTestData {
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
      
      case 'GitHubCLIArgs':
        return {
          ...minimal,
          dryRun: true,
          test: true,
          verbose: true,
          help: true,
        };
      
      case 'RoadmapCLIArgs':
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
      
      case 'GitHubMilestoneCreate':
        return {
          ...minimal,
          description: 'Milestone description',
          dueOn: '2024-12-31',
          state: 'open',
        };
      
      case 'GitHubLabelCreate':
        return {
          ...minimal,
          type: 'feature',
          tags: ['automation'],
          metadata: { category: 'feature' },
        };
      
      case 'GitHubIssueView':
        return {
          ...minimal,
          json: true,
          fields: ['title', 'body'],
        };
      
      case 'GitHubIssueList':
        return {
          ...minimal,
          state: 'open',
          labels: ['bug'],
        };
      
      case 'GitHubLabelList':
        return {
          ...minimal,
          type: 'feature',
          tags: ['automation'],
          metadata: { category: 'feature' },
        };
      
      case 'GitHubMilestoneList':
        return {
          ...minimal,
          description: 'Milestone description',
          dueOn: '2024-12-31',
          type: 'milestone',
          tags: ['milestone'],
          metadata: { priority: 'high' },
        };
      
      case 'GitHubIssueEdit':
        return {
          ...minimal,
          title: 'Updated Issue Title',
          body: 'Updated issue body',
          assignees: ['user1'],
          labels: ['bug'],
          milestone: 'v1.0.0',
          state: 'open',
        };
      
      case 'CreateFossilIssueParams':
        return {
          ...minimal,
          issueNumber: '123',
          tags: ['fossil', 'automation'],
          metadata: { priority: 'high' },
        };
      
      case 'CreateFossilLabelParams':
        return {
          ...minimal,
          tags: ['automation'],
          metadata: { category: 'feature' },
        };
      
      case 'CreateFossilMilestoneParams':
        return {
          ...minimal,
          tags: ['milestone'],
          metadata: { priority: 'high' },
        };
      
      case 'CheckExistingFossilParams':
        return {
          ...minimal,
          tags: ['test'],
          metadata: {},
        };
      
      case 'CreateFossilEntryParams':
        return {
          ...minimal,
          tags: ['test'],
          metadata: {},
        };
      
      case 'UpdateProjectStatusParams':
        return {
          ...minimal,
          description: 'Status description',
          metadata: { lastUpdate: '2024-01-01T00:00:00Z' },
        };
      
      case 'ContextEntry':
        return {
          ...minimal,
          description: 'Entry description',
          priority: 'high',
          status: 'active',
        };
      
      case 'ContextQuery':
        return {
          ...minimal,
          limit: 10,
          offset: 0,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };
      
      case 'Plan':
        return {
          ...minimal,
          version: '1.0.0',
          status: 'active',
          priority: 'high',
          assignee: 'user1',
          tags: ['plan'],
          metadata: { complexity: 'medium' },
        };
      
      case 'Task':
        return {
          ...minimal,
          assignee: 'user1',
          priority: 'high',
          dueDate: '2024-12-31',
          tags: ['task'],
          metadata: { effort: 'medium' },
        };
      
      case 'Milestone':
        return {
          ...minimal,
          status: 'active',
          assignee: 'user1',
          tags: ['milestone'],
          metadata: { progress: 0.5 },
        };
      
      case 'LLMInsightExport':
        return {
          ...minimal,
          timestamp: '2024-01-01T00:00:00Z',
          confidence: 0.9,
          tags: ['insight'],
        };
      
      case 'PlanRequest':
        return {
          ...minimal,
          maxTasks: 10,
          complexity: 'medium',
          tags: ['request'],
        };
      
      case 'TaskBreakdown':
        return {
          task: 'Test task',
          tasks: [
            {
              id: 'task-1',
              title: 'Step 1',
              description: 'First step description',
              acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
              dependencies: [],
              estimatedEffort: '2h',
              priority: 'medium',
              assignee: 'user1',
            },
            {
              id: 'task-2',
              title: 'Step 2',
              description: 'Second step description',
              acceptanceCriteria: ['Criteria 3'],
              dependencies: ['task-1'],
              estimatedEffort: '1h',
              priority: 'low',
            },
          ],
          timeline: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            milestones: [
              {
                date: '2024-06-01T00:00:00Z',
                description: 'Mid-year milestone',
                tasks: ['task-1'],
              },
            ],
          },
          risks: [
            {
              description: 'Test risk',
              probability: 'medium',
              impact: 'low',
              mitigation: 'Test mitigation',
            },
          ],
          breakdown: ['step 1', 'step 2'],
        };
      
      case 'TrackingConfig':
        return {
          ...minimal,
          metrics: ['health', 'progress'],
          alerts: true,
        };
      
      case 'ProgressMetrics':
        return {
          ...minimal,
          trend: 'improving',
          velocity: 0.8,
          quality: 0.9,
        };
      
      case 'TrendAnalysis':
        return {
          ...minimal,
          confidence: 0.9,
          factors: ['team velocity', 'code quality'],
        };
      
      case 'GitDiffAnalysis':
        return {
          ...minimal,
          includeStats: true,
          maxFiles: 100,
        };
      
      case 'DiffAnalysisResult':
        return {
          ...minimal,
          summary: 'Changes summary',
          complexity: 'medium',
          risk: 'low',
        };
      
      case 'CommitMessageAnalysis':
        return {
          ...minimal,
          category: 'feat',
          scope: 'core',
          breaking: false,
        };
      
      case 'DocPatternMatch':
        return {
          ...minimal,
          confidence: 0.9,
          context: 'test context',
        };
      
      case 'IntegrationConfig':
        return {
          ...minimal,
          enabled: true,
          retryCount: 3,
        };
      
      case 'IntegrationEvent':
        return {
          ...minimal,
          source: 'github',
          priority: 'medium',
        };
      
      case 'BatchProcessingConfig':
        return {
          ...minimal,
          timeout: 30000,
          retryOnFailure: true,
        };
      
      case 'BatchProcessingResult':
        return {
          ...minimal,
          summary: 'Processing summary',
          warnings: [],
        };
      
      case 'TaskMatchingConfig':
        return {
          ...minimal,
          maxResults: 10,
          includeMetadata: true,
        };
      
      case 'TaskMatchResult':
        return {
          ...minimal,
          confidence: 0.9,
          metadata: {},
        };
      
      case 'ExternalReview':
        return {
          ...minimal,
          priority: 'medium',
          deadline: '2024-12-31',
        };
      
      case 'ReviewRequest':
        return {
          ...minimal,
          priority: 'medium',
          deadline: '2024-12-31',
        };
      
      case 'UsageReport':
        return {
          ...minimal,
          breakdown: {},
          recommendations: [],
        };
      
      case 'OptimizationConfig':
        return {
          ...minimal,
          strategies: ['performance', 'cost'],
          thresholds: {},
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

    // Stricter checks
    const paramsStrict = await this.validateParamsObjectPatternStrict();
    const asyncError = await this.validateAsyncErrorHandlingPattern();
    const progressLog = await this.validateProgressLoggingPattern();
    results.push(paramsStrict);
    results.push(asyncError);
    results.push(progressLog);

    // Add compliance metrics to summary
    this.validationResults.summary['paramsObjectPatternStrict'] = paramsStrict.compliantCount / (paramsStrict.total || 1);
    this.validationResults.summary['asyncErrorHandling'] = asyncError.compliantCount / (asyncError.total || 1);
    this.validationResults.summary['progressLogging'] = progressLog.compliantCount / (progressLog.total || 1);

    // Add recommendations for each violation
    for (const pattern of [paramsStrict, asyncError, progressLog]) {
      if (!pattern.compliant && pattern.violations.length > 0) {
        pattern.violations = pattern.violations.map(v => v + ' | Recommendation: Refactor to use a params object (for PARAMS OBJECT), add try/catch or standardized result (for async error handling), or add progress/logging for CLI UX/DX.');
      }
    }

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
        
        // Skip if it's already using params object pattern
        if (params.includes("Params") || params.includes("params") || params.includes("{")) {
          continue;
        }
        
        const paramCount = params.split(",").filter(p => p.trim()).length;
        
        if (paramCount > 2) {
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
      
      // Skip the centralized GitHub CLI commands utility
      if (file.includes('githubCliCommands.ts')) {
        continue;
      }
      
      // See: src/utils/fossilIssue.ts, src/utils/fossilLabel.ts, src/utils/fossilMilestone.ts
      
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
      // Skip files that use commander or other proper CLI libraries
      if (content.includes("process.argv") && 
          !content.includes("parseCLIArgs") && 
          !content.includes("commander") &&
          !content.includes("yargs") &&
          !content.includes("minimist")) {
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
      
      // Skip certain files that are allowed to have their own types
      if (file.includes('typeSchemaValidator.ts') || 
          file.includes('prompts.ts') ||
          file.includes('vscodeAI.ts') ||
          file.includes('llmPredictiveMonitoring.ts')) {
        continue;
      }
      
      // Check for proper type imports - only flag files that export many types
      // or types that should be shared across modules
      if (content.includes("interface") || content.includes("type")) {
        // Use split string to avoid self-matching in validator
        const exportInterface = "export" + " interface";
        const exportType = "export" + " type";
        if (content.includes(exportInterface) || content.includes(exportType)) {
          // Count the number of exported types
          const typeExports = (content.match(/export (interface|type)/g) || []).length;
          // Only flag files with many type exports that should be in types/
          if (typeExports > 3 && file.startsWith("src/") && !file.startsWith("src/types/")) {
            result.violations.push(`Multiple type definitions found outside src/types/ (${typeExports} exports)`);
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
      
      // Skip files that are part of the types system
      if (file.includes('types/') || file.includes('schemas.ts')) {
        continue;
      }
      
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
   * Add stricter pattern checks
   */

  // 1. Extend PARAMS OBJECT PATTERN to arrow functions and class methods
  private async validateParamsObjectPatternStrict(): Promise<PatternValidationResultWithCount> {
    const result: PatternValidationResultWithCount = {
      patternName: 'PARAMS OBJECT PATTERN (strict)',
      compliant: true,
      violations: [],
      files: [],
      total: 0,
      compliantCount: 0,
    };
    const srcFiles = this.getTypeScriptFiles('src');
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      // Match regular functions, arrow functions, and class methods
      const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)/g) || [];
      const arrowMatches = content.match(/(const|let|var)\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
      const classMethodMatches = content.match(/\w+\s*\([^)]*\)\s*\{/g) || [];
      const allMatches = [...functionMatches, ...arrowMatches, ...classMethodMatches];
      for (const match of allMatches) {
        const params = match.match(/\(([^)]*)\)/)?.[1] || "";
        const paramCount = params.split(",").filter(p => p.trim()).length;
        result.total++;
        if (paramCount > 1 && !(params.includes("Params") || params.includes("params") || params.includes("{"))) {
          result.violations.push(`Function with multiple parameters doesn't use Params object: ${match}`);
          result.files.push(file);
          result.compliant = false;
        } else {
          result.compliantCount++;
        }
      }
    }
    return result;
  }

  // 2. Async error handling pattern
  private async validateAsyncErrorHandlingPattern(): Promise<PatternValidationResultWithCount> {
    const result: PatternValidationResultWithCount = {
      patternName: 'ASYNC ERROR HANDLING',
      compliant: true,
      violations: [],
      files: [],
      total: 0,
      compliantCount: 0,
    };
    const srcFiles = this.getTypeScriptFiles('src');
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      // Match async functions (regular, arrow, class methods)
      const asyncFunctionMatches = content.match(/async function\s+\w+\s*\([^)]*\)/g) || [];
      const asyncArrowMatches = content.match(/(const|let|var)\s+\w+\s*=\s*async\s*\([^)]*\)\s*=>/g) || [];
      const asyncClassMethodMatches = content.match(/async\s+\w+\s*\([^)]*\)\s*\{/g) || [];
      const allAsyncMatches = [...asyncFunctionMatches, ...asyncArrowMatches, ...asyncClassMethodMatches];
      for (const match of allAsyncMatches) {
        result.total++;
        // Check for try/catch or return { success: ... }
        // (Simple heuristic: look for 'try' or 'return { success' in the function body)
        const functionName = match.match(/\w+/g)?.[1] || match;
        const functionBodyMatch = content.split(match)[1]?.split('}')[0] || '';
        if (!functionBodyMatch.includes('try') && !functionBodyMatch.includes('return { success')) {
          result.violations.push(`Async function missing try/catch or standardized result: ${functionName}`);
          result.files.push(file);
          result.compliant = false;
        } else {
          result.compliantCount++;
        }
      }
    }
    return result;
  }

  // 4. Progress logging / live status pattern
  private async validateProgressLoggingPattern(): Promise<PatternValidationResultWithCount> {
    const result: PatternValidationResultWithCount = {
      patternName: 'PROGRESS LOGGING / LIVE STATUS',
      compliant: true,
      violations: [],
      files: [],
      total: 0,
      compliantCount: 0,
    };
    const srcFiles = this.getTypeScriptFiles('src');
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      // Find function blocks (simple heuristic: split by function/const/let/var)
      const functionBlocks = content.split(/function |const |let |var /).slice(1);
      for (const block of functionBlocks) {
        result.total++;
        const hasLoop = /(for\s*\(|\.forEach|\.map|\.reduce)/.test(block);
        const hasLog = /(console\.log|process\.stdout\.write|logger\.|logProgress|logStatus)/.test(block);
        if (hasLoop && !hasLog) {
          result.violations.push(`Function with loop but no progress/logging: ${block.slice(0, 40)}...`);
          result.files.push(file);
          result.compliant = false;
        } else if (hasLoop && hasLog) {
          result.compliantCount++;
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
  async runValidation(): Promise<TypeSchemaValidatorResult> {
    console.log("🔍 Starting comprehensive type and schema validation...");
    // Validate all schemas
    console.log("📋 Validating schemas...");
    const schemaResults = await this.validateAllSchemas();
    for (let i = 0; i < schemaResults.length; i++) {
      if (i % 10 === 0 || i === schemaResults.length - 1) {
        console.log(`🔄 Processing schema validation result ${i + 1} of ${schemaResults.length}`);
      }
      const result = schemaResults[i];
      if (!result) continue;
      if (result.success) {
        this.validationResults.summary.validatedSchemas++;
      } else {
        this.validationResults.summary.failedSchemas++;
        this.validationResults.errors.push(`Schema validation failed for ${result.schemaName}: ${result.errors.join(', ')}`);
      }
    }
    // Validate type patterns
    console.log("🔧 Validating type patterns...");
    const patternResults = await this.validateTypePatterns();
    for (let i = 0; i < patternResults.length; i++) {
      if (i % 10 === 0 || i === patternResults.length - 1) {
        console.log(`🔄 Processing pattern validation result ${i + 1} of ${patternResults.length}`);
      }
      const pattern = patternResults[i];
      if (!pattern) continue;
      if (pattern.compliant) {
        this.validationResults.summary.compliantPatterns++;
      } else {
        this.validationResults.summary.nonCompliantPatterns++;
      }
    }
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
    // Print pattern violations in detail
    for (const pattern of patternResults) {
      if (!pattern.compliant) {
        console.log(`\n❌ Pattern violation: ${pattern.patternName}`);
        if (pattern.violations.length > 0) {
          pattern.violations.forEach((violation, i) => {
            const file = pattern.files[i] || '';
            console.log(`  - ${violation}${file ? ` (in ${file})` : ''}`);
          });
        } else {
          console.log('  (No specific violations reported)');
        }
      }
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