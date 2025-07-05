#!/usr/bin/env bun

/**
 * Validate Fresh Insights Script
 * 
 * Validates the quality and completeness of fresh LLM insights
 * generated from the roadmap. This ensures insights meet standards
 * for CI/CD integration and automation workflows.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { formatISO } from 'date-fns';
import { loadInsightsCollection, getInsightsSummary } from '../src/utils/roadmapInsightsAccessor';
import type { RoadmapTaskInsight } from '../src/types/roadmapInsights';

const INSIGHTS_COLLECTION_PATH = 'fossils/roadmap_insights_collection.json';
const VALIDATION_OUTPUT_PATH = 'fossils/roadmap_insights_validation.json';

/**
 * Validation rules for insights
 */
interface ValidationRule {
  name: string;
  description: string;
  check: (insight: RoadmapTaskInsight) => boolean;
  severity: 'error' | 'warning' | 'info';
}

const validationRules: ValidationRule[] = [
  {
    name: 'has_summary',
    description: 'Insight must have a non-empty summary',
    check: (insight) => Boolean(insight.llmInsights.summary && insight.llmInsights.summary.trim().length > 0),
    severity: 'error'
  },
  {
    name: 'has_impact',
    description: 'Insight must have an impact assessment',
    check: (insight) => Boolean(insight.llmInsights.impact && insight.llmInsights.impact.trim().length > 0),
    severity: 'error'
  },
  {
    name: 'has_recommendations',
    description: 'Insight should have recommendations',
    check: (insight) => Boolean(insight.llmInsights.recommendations && insight.llmInsights.recommendations.trim().length > 0),
    severity: 'warning'
  },
  {
    name: 'has_blockers',
    description: 'Insight should have blockers identified',
    check: (insight) => Boolean(insight.llmInsights.blockers && insight.llmInsights.blockers.trim().length > 0),
    severity: 'warning'
  },
  {
    name: 'summary_length',
    description: 'Summary should be between 10 and 500 characters',
    check: (insight) => {
      const summary = insight.llmInsights.summary || '';
      return summary.length >= 10 && summary.length <= 500;
    },
    severity: 'warning'
  },
  {
    name: 'has_task_id',
    description: 'Insight must have a valid task ID',
    check: (insight) => Boolean(insight.taskId && insight.taskId.length > 0),
    severity: 'error'
  },
  {
    name: 'has_task_title',
    description: 'Insight must have a task title',
    check: (insight) => Boolean(insight.taskTitle && insight.taskTitle.trim().length > 0),
    severity: 'error'
  },
  {
    name: 'has_metadata',
    description: 'Insight must have complete metadata',
    check: (insight) => {
      const metadata = insight.metadata;
      return Boolean(metadata && 
             metadata.generatedAt && 
             metadata.model && 
             metadata.provider && 
             metadata.fossilId);
    },
    severity: 'error'
  },
  {
    name: 'completed_tasks_have_retrospective',
    description: 'Completed tasks should have retrospective insights',
    check: (insight) => {
      if (insight.status !== 'done') return true;
      return Boolean(insight.llmInsights.done && 
             insight.llmInsights.done.retrospective && 
             insight.llmInsights.done.retrospective.trim().length > 0);
    },
    severity: 'warning'
  },
  {
    name: 'impact_quality',
    description: 'Impact should be descriptive and actionable',
    check: (insight) => {
      const impact = insight.llmInsights.impact || '';
      return impact.length > 5 && !impact.includes('unknown');
    },
    severity: 'warning'
  }
];

/**
 * Validate a single insight
 */
function validateInsight(insight: RoadmapTaskInsight): {
  taskId: string;
  taskTitle: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  for (const rule of validationRules) {
    const isValid = rule.check(insight);
    if (!isValid) {
      switch (rule.severity) {
        case 'error':
          errors.push(`${rule.name}: ${rule.description}`);
          break;
        case 'warning':
          warnings.push(`${rule.name}: ${rule.description}`);
          break;
        case 'info':
          info.push(`${rule.name}: ${rule.description}`);
          break;
      }
    }
  }

  return {
    taskId: insight.taskId,
    taskTitle: insight.taskTitle,
    valid: errors.length === 0,
    errors,
    warnings,
    info
  };
}

/**
 * Validate all insights
 */
function validateAllInsights(insights: RoadmapTaskInsight[]): {
  total: number;
  valid: number;
  invalid: number;
  errors: number;
  warnings: number;
  info: number;
  results: Array<ReturnType<typeof validateInsight>>;
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
    pending: number;
    highImpact: number;
    withBlockers: number;
    withDeadlines: number;
  };
} {
  const results = insights.map(validateInsight);
  const valid = results.filter(r => r.valid).length;
  const invalid = results.filter(r => !r.valid).length;
  const errors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const warnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const info = results.reduce((sum, r) => sum + r.info.length, 0);

  const summary = getInsightsSummary(insights);

  return {
    total: insights.length,
    valid,
    invalid,
    errors,
    warnings,
    info,
    results,
    summary
  };
}

/**
 * Generate validation report
 */
function generateValidationReport(validation: ReturnType<typeof validateAllInsights>): string {
  const { total, valid, invalid, errors, warnings, info, results, summary } = validation;

  let report = `# LLM Insights Validation Report

Generated: ${formatISO(new Date())}

## Summary
- **Total Insights**: ${total}
- **Valid**: ${valid} (${Math.round((valid / total) * 100)}%)
- **Invalid**: ${invalid} (${Math.round((invalid / total) * 100)}%)
- **Total Errors**: ${errors}
- **Total Warnings**: ${warnings}
- **Total Info**: ${info}

## Quality Metrics
- **Error Rate**: ${Math.round((errors / total) * 100)}%
- **Warning Rate**: ${Math.round((warnings / total) * 100)}%
- **Overall Quality Score**: ${Math.round(((total - errors - warnings * 0.5) / total) * 100)}%

## Task Summary
- **Total Tasks**: ${summary.total}
- **Completed**: ${summary.completed}
- **In Progress**: ${summary.inProgress}
- **Planned**: ${summary.planned}
- **Pending**: ${summary.pending}
- **High Impact**: ${summary.highImpact}
- **With Blockers**: ${summary.withBlockers}

## Validation Results

`;

  // Group by validation status
  const validResults = results.filter(r => r.valid);
  const invalidResults = results.filter(r => !r.valid);

  if (invalidResults.length > 0) {
    report += `### Invalid Insights (${invalidResults.length})\n\n`;
    invalidResults.forEach(result => {
      report += `#### ${result.taskTitle}\n`;
      report += `- **Task ID**: ${result.taskId}\n`;
      if (result.errors.length > 0) {
        report += `- **Errors**:\n`;
        result.errors.forEach(error => report += `  - ${error}\n`);
      }
      if (result.warnings.length > 0) {
        report += `- **Warnings**:\n`;
        result.warnings.forEach(warning => report += `  - ${warning}\n`);
      }
      report += '\n';
    });
  }

  if (warnings > 0) {
    report += `### Insights with Warnings (${results.filter(r => r.warnings.length > 0).length})\n\n`;
    results.filter(r => r.warnings.length > 0).forEach(result => {
      report += `#### ${result.taskTitle}\n`;
      result.warnings.forEach(warning => report += `- ${warning}\n`);
      report += '\n';
    });
  }

  report += `### All Valid Insights (${validResults.length})\n\n`;
  validResults.forEach(result => {
    report += `- **${result.taskTitle}** (${result.taskId})\n`;
  });

  return report;
}

async function main() {
  console.log('🔍 Validating fresh LLM insights...');
  
  // Load insights collection
  const collection = await loadInsightsCollection();
  const insights = collection.insights;
  
  if (insights.length === 0) {
    console.log('⚠️  No insights found in collection. Run generate-fresh-llm-insights.ts first.');
    process.exit(1);
  }
  
  console.log(`📋 Found ${insights.length} insights to validate`);
  
  // Validate all insights
  const validation = validateAllInsights(insights);
  
  // Generate validation report
  const report = generateValidationReport(validation);
  
  // Save validation results
  const validationData = {
    generatedAt: formatISO(new Date()),
    collectionSource: INSIGHTS_COLLECTION_PATH,
    validation,
    report
  };
  
  await fs.writeFile(VALIDATION_OUTPUT_PATH, JSON.stringify(validationData, null, 2), 'utf-8');
  
  // Print summary
  console.log('\n📊 Validation Summary:');
  console.log(`  Total insights: ${validation.total}`);
  console.log(`  Valid: ${validation.valid} (${Math.round((validation.valid / validation.total) * 100)}%)`);
  console.log(`  Invalid: ${validation.invalid} (${Math.round((validation.invalid / validation.total) * 100)}%)`);
  console.log(`  Total errors: ${validation.errors}`);
  console.log(`  Total warnings: ${validation.warnings}`);
  
  // Determine exit code
  const hasErrors = validation.errors > 0;
  const qualityScore = Math.round(((validation.total - validation.errors - validation.warnings * 0.5) / validation.total) * 100);
  
  console.log(`\n📈 Quality Score: ${qualityScore}%`);
  
  if (hasErrors) {
    console.log('\n❌ Validation failed: Found errors that need to be fixed');
    process.exit(1);
  } else if (qualityScore < 80) {
    console.log('\n⚠️  Validation passed with warnings: Consider improving insight quality');
    process.exit(0);
  } else {
    console.log('\n✅ Validation passed: Insights meet quality standards');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 