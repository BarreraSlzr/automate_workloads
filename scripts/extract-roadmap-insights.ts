#!/usr/bin/env bun

/**
 * Extract Roadmap Insights Script
 * 
 * Extracts and formats LLM insights from the collection files for reporting,
 * documentation, and analysis. This replaces the old approach of accessing
 * insights directly from roadmap tasks.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { formatISO } from 'date-fns';
import { 
  loadInsightsCollection,
  getCompletedTaskInsights,
  getInProgressTaskInsights,
  getPlannedTaskInsights,
  getInsightsWithBlockers,
  getHighImpactInsights,
  getInsightsByOwner,
  getInsightsByTag,
  getInsightsSummary
} from '../src/utils/roadmapInsightsAccessor';
import type { RoadmapTaskInsight } from '../src/types/roadmapInsights';

const OUTPUT_DIR = 'fossils/roadmap_insights';

/**
 * Generate a comprehensive markdown report from insights
 */
function generateMarkdownReport(insights: RoadmapTaskInsight[]): string {
  const summary = getInsightsSummary(insights);
  const completedTasks = getCompletedTaskInsights(insights);
  const inProgressTasks = getInProgressTaskInsights(insights);
  const plannedTasks = getPlannedTaskInsights(insights);
  const tasksWithBlockers = getInsightsWithBlockers(insights);
  const highImpactTasks = getHighImpactInsights(insights);

  // Get unique owners and tags
  const owners = [...new Set(insights.map(i => i.owner).filter(Boolean))];
  const tags = [...new Set(insights.flatMap(i => i.tags || []))];

  let report = `# Roadmap LLM Insights Report

Generated: ${formatISO(new Date())}
Total Tasks: ${summary.total}

## Summary
- **Completed**: ${summary.completed}
- **In Progress**: ${summary.inProgress}
- **Planned**: ${summary.planned}
- **Pending**: ${summary.pending}
- **High Impact**: ${summary.highImpact}
- **With Blockers**: ${summary.withBlockers}

## Completed Tasks
${completedTasks.map(task => `- **${task.taskTitle}**: ${task.llmInsights.summary}`).join('\n')}

## In Progress Tasks
${inProgressTasks.map(task => `- **${task.taskTitle}**: ${task.llmInsights.summary}`).join('\n')}

## Planned Tasks
${plannedTasks.map(task => `- **${task.taskTitle}**: ${task.llmInsights.summary}`).join('\n')}

## Detailed Task Analysis

`;

  // Add detailed analysis for each task
  insights.forEach(task => {
    report += `### ${task.taskTitle}
- **Status**: ${task.status}
- **Owner**: ${task.owner || 'Unassigned'}
- **Milestone**: ${task.milestone || 'No milestone'}
- **Tags**: ${(task.tags || []).join(', ') || 'None'}
- **Summary**: ${task.llmInsights.summary}
- **Impact**: ${task.llmInsights.impact}
- **Blockers**: ${task.llmInsights.blockers}
- **Recommendations**: ${task.llmInsights.recommendations}
${task.llmInsights.deadline ? `- **Deadline**: ${task.llmInsights.deadline}` : ''}

`;
  });

  // Add sections for blockers and high impact tasks
  if (tasksWithBlockers.length > 0) {
    report += `## Tasks with Blockers
${tasksWithBlockers.map(task => `- **${task.taskTitle}**: ${task.llmInsights.blockers}`).join('\n')}

`;
  }

  if (highImpactTasks.length > 0) {
    report += `## High Impact Tasks
${highImpactTasks.map(task => `- **${task.taskTitle}** (${task.status}): ${task.llmInsights.summary}`).join('\n')}

`;
  }

  // Add owner-specific sections
  owners.forEach(owner => {
    if (owner) { // Add null check for owner
      const ownerTasks = getInsightsByOwner({ insights, owner });
      if (ownerTasks.length > 0) {
        report += `## Tasks by ${owner}
${ownerTasks.map(task => `- **${task.taskTitle}** (${task.status}): ${task.llmInsights.summary}`).join('\n')}

`;
      }
    }
  });

  // Add tag-specific sections
  tags.forEach(tag => {
    const tagTasks = getInsightsByTag({ insights, tag });
    if (tagTasks.length > 0) {
      report += `## Tasks tagged "${tag}"
${tagTasks.map(task => `- **${task.taskTitle}** (${task.status}): ${task.llmInsights.summary}`).join('\n')}

`;
    }
  });

  return report;
}

/**
 * Generate a JSON summary report
 */
function generateJsonSummary(insights: RoadmapTaskInsight[]): any {
  const summary = getInsightsSummary(insights);
  
  return {
    generatedAt: formatISO(new Date()),
    summary,
    insights: insights.map(insight => ({
      taskId: insight.taskId,
      taskTitle: insight.taskTitle,
      taskPath: insight.taskPath,
      status: insight.status,
      milestone: insight.milestone,
      owner: insight.owner,
      tags: insight.tags,
      llmInsights: {
        summary: insight.llmInsights.summary,
        impact: insight.llmInsights.impact,
        blockers: insight.llmInsights.blockers,
        recommendations: insight.llmInsights.recommendations,
        deadline: insight.llmInsights.deadline
      },
      metadata: {
        generatedAt: insight.metadata.generatedAt,
        model: insight.metadata.model,
        provider: insight.metadata.provider,
        fossilId: insight.metadata.fossilId
      }
    }))
  };
}

async function main() {
  console.log('🔄 Extracting roadmap insights from collection...');
  
  // Load insights collection
  const collection = await loadInsightsCollection();
  const insights = collection.insights;
  
  if (insights.length === 0) {
    console.log('⚠️  No insights found in collection. Run generate-fresh-llm-insights.ts first.');
    return;
  }
  
  console.log(`📋 Found ${insights.length} insights to process`);
  
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(insights);
  const markdownPath = path.join(OUTPUT_DIR, 'roadmap_insights_report.md');
  await fs.writeFile(markdownPath, markdownReport, 'utf-8');
  console.log(`✅ Generated markdown report: ${markdownPath}`);
  
  // Generate JSON summary
  const jsonSummary = generateJsonSummary(insights);
  const jsonPath = path.join(OUTPUT_DIR, 'roadmap_insights_summary.json');
  await fs.writeFile(jsonPath, JSON.stringify(jsonSummary, null, 2), 'utf-8');
  console.log(`✅ Generated JSON summary: ${jsonPath}`);
  
  // Print summary to console
  const summary = getInsightsSummary(insights);
  console.log('\n📊 Insights Summary:');
  console.log(`  Total tasks: ${summary.total}`);
  console.log(`  Completed: ${summary.completed}`);
  console.log(`  In Progress: ${summary.inProgress}`);
  console.log(`  Planned: ${summary.planned}`);
  console.log(`  Pending: ${summary.pending}`);
  console.log(`  High Impact: ${summary.highImpact}`);
  console.log(`  With Blockers: ${summary.withBlockers}`);
  
  console.log('\n✅ Roadmap insights extraction completed!');
}

if (require.main === module) {
  main().catch(console.error);
} 