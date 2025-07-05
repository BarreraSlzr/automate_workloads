#!/usr/bin/env bun

/**
 * Plan Validation Utility
 * 
 * Compares generated LLM plans against expected results for quality assurance.
 * Supports flexible validation of structure, content, and tags.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z, ZodError, TaskBreakdownSchema } from '@/types/schemas';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSummary,
  ValidationOptions
} from '../types/validation';

// Remove inline validation schemas
// Use TaskBreakdownSchema and its nested schemas from src/types/schemas.ts
const TaskSchema = TaskBreakdownSchema.shape.tasks.element;
const MilestoneSchema = TaskBreakdownSchema.shape.timeline.shape.milestones.element;
const RiskSchema = TaskBreakdownSchema.shape.risks.element;
const TimelineSchema = TaskBreakdownSchema.shape.timeline;
const PlanSchema = TaskBreakdownSchema;



/**
 * Plan Validator Class
 */
export class PlanValidator {
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      strictMode: false,
      ignoreTimeline: false,
      ignoreRisks: false,
      requiredTags: [],
      forbiddenTags: [],
      minTasks: 3,
      maxTasks: 15,
      minTagsPerTask: 1,
      maxTagsPerTask: 8,
      ...options,
    };
  }

  /**
   * Validate a plan against expected results
   */
  validatePlan(generatedPlanPath: string, expectedPlanPath?: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Load and parse generated plan
      const generatedPlan = this.loadPlan(generatedPlanPath);
      
      // Validate basic structure
      const structureValidation = this.validateStructure(generatedPlan);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);

      // If expected plan provided, compare content
      if (expectedPlanPath && existsSync(expectedPlanPath)) {
        const expectedPlan = this.loadPlan(expectedPlanPath);
        const contentValidation = this.compareWithExpected(generatedPlan, expectedPlan);
        errors.push(...contentValidation.errors);
        warnings.push(...contentValidation.warnings);
      }

      // Validate against options
      const optionsValidation = this.validateAgainstOptions(generatedPlan);
      errors.push(...optionsValidation.errors);
      warnings.push(...optionsValidation.warnings);

      // Generate summary
      const summary = this.generateSummary(generatedPlan);

      // Calculate score
      const score = this.calculateScore(errors, warnings, summary);

      return {
        isValid: errors.length === 0,
        score,
        errors,
        warnings,
        summary,
      };
    } catch (error) {
      return {
        isValid: false,
        score: 0,
        errors: [{
          type: 'structure',
          message: `Failed to load or parse plan: ${error}`,
        }],
        warnings: [],
        summary: this.generateEmptySummary(),
      };
    }
  }

  /**
   * Load and parse a plan file
   */
  private loadPlan(planPath: string): any {
    const content = readFileSync(planPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Validate basic structure
   */
  private validateStructure(plan: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      PlanSchema.parse(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            type: 'structure',
            message: `Invalid structure: ${err.message}`,
            path: err.path.join('.'),
          });
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Compare generated plan with expected plan
   */
  private compareWithExpected(generated: any, expected: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Compare task count
    if (generated.tasks.length !== expected.tasks.length) {
      errors.push({
        type: 'content',
        message: `Task count mismatch: expected ${expected.tasks.length}, got ${generated.tasks.length}`,
        expected: expected.tasks.length,
        actual: generated.tasks.length,
      });
    }

    // Compare task titles and tags
    const minTasks = Math.min(generated.tasks.length, expected.tasks.length);
    for (let i = 0; i < minTasks; i++) {
      const genTask = generated.tasks[i];
      const expTask = expected.tasks[i];

      // Compare titles (allowing for some variation)
      if (!this.titlesAreSimilar(genTask.title, expTask.title)) {
        warnings.push({
          type: 'priority_mismatch',
          message: `Task ${i + 1} title differs significantly`,
          path: `tasks[${i}].title`,
          expected: expTask.title,
          actual: genTask.title,
        });
      }

      // Compare tags
      const tagComparison = this.compareTags(genTask.tags || [], expTask.tags || []);
      if (tagComparison.missing.length > 0) {
        warnings.push({
          type: 'missing_tag',
          message: `Task ${i + 1} missing expected tags: ${tagComparison.missing.join(', ')}`,
          path: `tasks[${i}].tags`,
          suggestion: `Add tags: ${tagComparison.missing.join(', ')}`,
        });
      }

      if (tagComparison.unexpected.length > 0) {
        warnings.push({
          type: 'unexpected_tag',
          message: `Task ${i + 1} has unexpected tags: ${tagComparison.unexpected.join(', ')}`,
          path: `tasks[${i}].tags`,
        });
      }
    }

    // Compare timeline if not ignored
    if (!this.options.ignoreTimeline) {
      const timelineComparison = this.compareTimeline(generated.timeline, expected.timeline);
      warnings.push(...timelineComparison);
    }

    // Compare risks if not ignored
    if (!this.options.ignoreRisks) {
      const riskComparison = this.compareRisks(generated.risks, expected.risks);
      warnings.push(...riskComparison);
    }

    return { errors, warnings };
  }

  /**
   * Validate against validation options
   */
  private validateAgainstOptions(plan: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check task count limits
    if (this.options.minTasks && plan.tasks.length < this.options.minTasks) {
      errors.push({
        type: 'content',
        message: `Too few tasks: ${plan.tasks.length} (minimum: ${this.options.minTasks})`,
        actual: plan.tasks.length,
        expected: this.options.minTasks,
      });
    }

    if (this.options.maxTasks && plan.tasks.length > this.options.maxTasks) {
      errors.push({
        type: 'content',
        message: `Too many tasks: ${plan.tasks.length} (maximum: ${this.options.maxTasks})`,
        actual: plan.tasks.length,
        expected: this.options.maxTasks,
      });
    }

    // Check tags per task
    plan.tasks.forEach((task: any, index: number) => {
      const tagCount = (task.tags || []).length;

      if (this.options.minTagsPerTask && tagCount < this.options.minTagsPerTask) {
        errors.push({
          type: 'tags',
          message: `Task ${index + 1} has too few tags: ${tagCount} (minimum: ${this.options.minTagsPerTask})`,
          path: `tasks[${index}].tags`,
          actual: tagCount,
          expected: this.options.minTagsPerTask,
        });
      }

      if (this.options.maxTagsPerTask && tagCount > this.options.maxTagsPerTask) {
        warnings.push({
          type: 'unexpected_tag',
          message: `Task ${index + 1} has too many tags: ${tagCount} (maximum: ${this.options.maxTagsPerTask})`,
          path: `tasks[${index}].tags`,
          actual: tagCount,
          expected: this.options.maxTagsPerTask,
        });
      }

      // Check required tags
      if (this.options.requiredTags) {
        const missingRequired = this.options.requiredTags.filter(tag => !(task.tags || []).includes(tag));
        if (missingRequired.length > 0) {
          errors.push({
            type: 'tags',
            message: `Task ${index + 1} missing required tags: ${missingRequired.join(', ')}`,
            path: `tasks[${index}].tags`,
            expected: missingRequired,
          });
        }
      }

      // Check forbidden tags
      if (this.options.forbiddenTags) {
        const forbiddenFound = this.options.forbiddenTags.filter(tag => (task.tags || []).includes(tag));
        if (forbiddenFound.length > 0) {
          warnings.push({
            type: 'unexpected_tag',
            message: `Task ${index + 1} contains forbidden tags: ${forbiddenFound.join(', ')}`,
            path: `tasks[${index}].tags`,
            suggestion: `Remove tags: ${forbiddenFound.join(', ')}`,
          });
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Compare task titles for similarity
   */
  private titlesAreSimilar(title1: string, title2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    const words1 = normalize(title1).split(/\s+/).filter(Boolean);
    const words2 = normalize(title2).split(/\s+/).filter(Boolean);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity >= 0.6; // 60% similarity threshold
  }

  /**
   * Compare tags between tasks
   */
  private compareTags(actualTags: string[], expectedTags: string[]): {
    missing: string[];
    unexpected: string[];
    common: string[];
  } {
    const missing = expectedTags.filter(tag => !actualTags.includes(tag));
    const unexpected = actualTags.filter(tag => !expectedTags.includes(tag));
    const common = actualTags.filter(tag => expectedTags.includes(tag));

    return { missing, unexpected, common };
  }

  /**
   * Compare timelines
   */
  private compareTimeline(actual: any, expected: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Compare milestone count
    if (actual.milestones.length !== expected.milestones.length) {
      warnings.push({
        type: 'timeline_mismatch',
        message: `Milestone count differs: expected ${expected.milestones.length}, got ${actual.milestones.length}`,
      });
    }

    return warnings;
  }

  /**
   * Compare risks
   */
  private compareRisks(actual: any[], expected: any[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Compare risk count
    if (actual.length !== expected.length) {
      warnings.push({
        type: 'timeline_mismatch',
        message: `Risk count differs: expected ${expected.length}, got ${actual.length}`,
      });
    }

    return warnings;
  }

  /**
   * Generate validation summary
   */
  private generateSummary(plan: any): ValidationSummary {
    const tasks = plan.tasks || [];
    const tasksWithTags = tasks.filter((task: any) => task.tags && task.tags.length > 0).length;
    const totalTags = tasks.reduce((sum: number, task: any) => sum + (task.tags?.length || 0), 0);
    
    const startDate = new Date(plan.timeline?.startDate || Date.now());
    const endDate = new Date(plan.timeline?.endDate || Date.now());
    const timelineDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalTasks: tasks.length,
      tasksWithTags,
      tasksWithoutTags: tasks.length - tasksWithTags,
      averageTagsPerTask: tasks.length > 0 ? totalTags / tasks.length : 0,
      timelineDays,
      riskCount: plan.risks?.length || 0,
      criticalTasks: tasks.filter((task: any) => task.priority === 'critical').length,
      highPriorityTasks: tasks.filter((task: any) => task.priority === 'high').length,
    };
  }

  /**
   * Generate empty summary for error cases
   */
  private generateEmptySummary(): ValidationSummary {
    return {
      totalTasks: 0,
      tasksWithTags: 0,
      tasksWithoutTags: 0,
      averageTagsPerTask: 0,
      timelineDays: 0,
      riskCount: 0,
      criticalTasks: 0,
      highPriorityTasks: 0,
    };
  }

  /**
   * Calculate validation score (0-100)
   */
  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[], summary: ValidationSummary): number {
    let score = 100;

    // Deduct points for errors
    score -= errors.length * 10;

    // Deduct points for warnings (if in strict mode)
    if (this.options.strictMode) {
      score -= warnings.length * 5;
    } else {
      score -= warnings.length * 2;
    }

    // Bonus points for good practices
    if (summary.tasksWithTags === summary.totalTasks && summary.totalTasks > 0) {
      score += 10; // All tasks have tags
    }

    if (summary.averageTagsPerTask >= 2) {
      score += 5; // Good tag coverage
    }

    if (summary.criticalTasks > 0) {
      score += 5; // Has critical tasks
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Print validation report
   */
  printReport(result: ValidationResult): void {
    console.log('\n📋 Plan Validation Report');
    console.log('=' .repeat(50));
    
    // Overall status
    const status = result.isValid ? '✅ VALID' : '❌ INVALID';
    console.log(`Status: ${status} (Score: ${result.score}/100)`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  • Total Tasks: ${result.summary.totalTasks}`);
    console.log(`  • Tasks with Tags: ${result.summary.tasksWithTags}`);
    console.log(`  • Average Tags per Task: ${result.summary.averageTagsPerTask.toFixed(1)}`);
    console.log(`  • Timeline: ${result.summary.timelineDays} days`);
    console.log(`  • Critical Tasks: ${result.summary.criticalTasks}`);
    console.log(`  • High Priority Tasks: ${result.summary.highPriorityTasks}`);
    console.log(`  • Risks Identified: ${result.summary.riskCount}`);
    
    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type.toUpperCase()}: ${error.message}`);
        if (error.path) console.log(`     Path: ${error.path}`);
        if (error.expected && error.actual) {
          console.log(`     Expected: ${error.expected}, Got: ${error.actual}`);
        }
      });
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.type.toUpperCase()}: ${warning.message}`);
        if (warning.path) console.log(`     Path: ${warning.path}`);
        if (warning.suggestion) console.log(`     Suggestion: ${warning.suggestion}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
  }
} 