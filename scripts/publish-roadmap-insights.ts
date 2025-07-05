#!/usr/bin/env bun

/**
 * Publish Roadmap Insights Script
 * 
 * Publishes LLM insights from the collection files to various formats
 * for public consumption and integration. This replaces the old approach
 * of accessing insights directly from roadmap tasks.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { formatISO } from 'date-fns';
import { loadInsightsCollection, getInsightsSummary } from '../src/utils/roadmapInsightsAccessor';
import type { RoadmapTaskInsight } from '../src/types/roadmapInsights';

const OUTPUT_DIR = 'fossils/public';
const INSIGHTS_COLLECTION_PATH = 'fossils/roadmap_insights_collection.json';

/**
 * Generate public blog post from insights
 */
function generateBlogPost(insights: RoadmapTaskInsight[]): string {
  const summary = getInsightsSummary(insights);
  const completedTasks = insights.filter(i => i.status === 'done');
  const inProgressTasks = insights.filter(i => i.status === 'in progress');
  const plannedTasks = insights.filter(i => i.status === 'planned');
  
  const blogPost = `---
title: "Project Automation Roadmap Insights - ${formatISO(new Date(), { format: 'basic' })}"
date: ${formatISO(new Date())}
author: "Automation System"
tags: ["automation", "roadmap", "llm-insights", "project-management"]
summary: "AI-powered insights from our automation roadmap covering ${summary.total} tasks with ${summary.completed} completed and ${summary.inProgress} in progress."
---

# Project Automation Roadmap Insights

*Generated on ${formatISO(new Date())}*

## Executive Summary

Our automation ecosystem continues to evolve with **${summary.total} total tasks** tracked across the roadmap. Currently, we have **${summary.completed} completed tasks** and **${summary.inProgress} tasks in progress**, with **${summary.planned} planned** for future implementation.

## Key Metrics

- **Total Tasks**: ${summary.total}
- **Completed**: ${summary.completed} (${Math.round((summary.completed / summary.total) * 100)}%)
- **In Progress**: ${summary.inProgress} (${Math.round((summary.inProgress / summary.total) * 100)}%)
- **Planned**: ${summary.planned} (${Math.round((summary.planned / summary.total) * 100)}%)
- **High Impact**: ${summary.highImpact}
- **With Blockers**: ${summary.withBlockers}

## Recent Completions

${completedTasks.slice(0, 5).map(task => `- **${task.taskTitle}**: ${task.llmInsights.summary}`).join('\n')}

## Active Development

${inProgressTasks.slice(0, 5).map(task => `- **${task.taskTitle}**: ${task.llmInsights.summary}`).join('\n')}

## Upcoming Priorities

${plannedTasks.slice(0, 5).map(task => `- **${task.taskTitle}**: ${task.llmInsights.summary}`).join('\n')}

## Insights by Category

### Implementation Tasks
${insights.filter(i => i.llmInsights.summary.toLowerCase().includes('implementation')).slice(0, 3).map(task => `- **${task.taskTitle}** (${task.status}): ${task.llmInsights.summary}`).join('\n')}

### Testing & Quality
${insights.filter(i => i.llmInsights.summary.toLowerCase().includes('test')).slice(0, 3).map(task => `- **${task.taskTitle}** (${task.status}): ${task.llmInsights.summary}`).join('\n')}

### Documentation & Onboarding
${insights.filter(i => i.llmInsights.summary.toLowerCase().includes('documentation') || i.llmInsights.summary.toLowerCase().includes('onboarding')).slice(0, 3).map(task => `- **${task.taskTitle}** (${task.status}): ${task.llmInsights.summary}`).join('\n')}

## Technical Insights

Our LLM-powered analysis reveals several key patterns:

1. **Automation Focus**: The majority of completed tasks focus on establishing robust automation workflows
2. **Quality Assurance**: Testing and validation remain high priorities
3. **Documentation**: Comprehensive documentation is essential for maintainability
4. **Local LLM Integration**: Significant progress in local AI capabilities

## Next Steps

Based on the analysis, our immediate priorities include:

1. Completing in-progress automation tasks
2. Addressing any identified blockers
3. Continuing with planned high-impact features
4. Maintaining documentation quality

---

*This report was automatically generated using our LLM-powered insights system. For more details, see the full roadmap and insights collection.*
`;

  return blogPost;
}

/**
 * Generate public API response
 */
function generatePublicAPI(insights: RoadmapTaskInsight[]): any {
  const summary = getInsightsSummary(insights);
  
  return {
    metadata: {
      generatedAt: formatISO(new Date()),
      version: '1.0.0',
      source: 'roadmap-insights-collection',
      totalTasks: summary.total
    },
    summary: {
      completed: summary.completed,
      inProgress: summary.inProgress,
      planned: summary.planned,
      pending: summary.pending,
      highImpact: summary.highImpact,
      withBlockers: summary.withBlockers
    },
    insights: insights.map(insight => ({
      taskId: insight.taskId,
      taskTitle: insight.taskTitle,
      status: insight.status,
      milestone: insight.milestone,
      owner: insight.owner,
      tags: insight.tags,
      llmInsights: {
        summary: insight.llmInsights.summary,
        impact: insight.llmInsights.impact,
        blockers: insight.llmInsights.blockers,
        recommendations: insight.llmInsights.recommendations
      }
    }))
  };
}

/**
 * Generate RSS feed entry
 */
function generateRSSEntry(insights: RoadmapTaskInsight[]): string {
  const summary = getInsightsSummary(insights);
  const completedTasks = insights.filter(i => i.status === 'done');
  
  const rssEntry = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Project Automation Roadmap Insights</title>
    <link>https://github.com/barreraslzr/automate_workloads</link>
    <description>AI-powered insights from our automation roadmap</description>
    <language>en-us</language>
    <lastBuildDate>${formatISO(new Date())}</lastBuildDate>
    <item>
      <title>Roadmap Insights - ${formatISO(new Date(), { format: 'basic' })}</title>
      <link>https://github.com/barreraslzr/automate_workloads/blob/main/fossils/public/roadmap_insights_${formatISO(new Date(), { format: 'basic' })}.md</link>
      <description>
        <![CDATA[
        <p>Project automation roadmap update with ${summary.total} total tasks tracked.</p>
        <ul>
          <li><strong>Completed:</strong> ${summary.completed} tasks</li>
          <li><strong>In Progress:</strong> ${summary.inProgress} tasks</li>
          <li><strong>Planned:</strong> ${summary.planned} tasks</li>
          <li><strong>High Impact:</strong> ${summary.highImpact} tasks</li>
        </ul>
        <p><strong>Recent Completions:</strong></p>
        <ul>
          ${completedTasks.slice(0, 3).map(task => `<li>${task.taskTitle}: ${task.llmInsights.summary}</li>`).join('')}
        </ul>
        ]]>
      </description>
      <pubDate>${formatISO(new Date())}</pubDate>
      <guid>roadmap-insights-${formatISO(new Date(), { format: 'basic' })}</guid>
    </item>
  </channel>
</rss>`;

  return rssEntry;
}

async function main() {
  console.log('🔄 Publishing roadmap insights...');
  
  // Load insights collection
  const collection = await loadInsightsCollection();
  const insights = collection.insights;
  
  if (insights.length === 0) {
    console.log('⚠️  No insights found in collection. Run generate-fresh-llm-insights.ts first.');
    return;
  }
  
  console.log(`📋 Found ${insights.length} insights to publish`);
  
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Generate blog post
  const blogPost = generateBlogPost(insights);
  const blogPath = path.join(OUTPUT_DIR, `roadmap_insights_${formatISO(new Date(), { format: 'basic' })}.md`);
  await fs.writeFile(blogPath, blogPost, 'utf-8');
  console.log(`✅ Generated blog post: ${blogPath}`);
  
  // Generate public API
  const publicAPI = generatePublicAPI(insights);
  const apiPath = path.join(OUTPUT_DIR, 'roadmap_insights_api.json');
  await fs.writeFile(apiPath, JSON.stringify(publicAPI, null, 2), 'utf-8');
  console.log(`✅ Generated public API: ${apiPath}`);
  
  // Generate RSS feed
  const rssFeed = generateRSSEntry(insights);
  const rssPath = path.join(OUTPUT_DIR, 'roadmap_insights.rss');
  await fs.writeFile(rssPath, rssFeed, 'utf-8');
  console.log(`✅ Generated RSS feed: ${rssPath}`);
  
  // Print summary
  const summary = getInsightsSummary(insights);
  console.log('\n📊 Publication Summary:');
  console.log(`  Total tasks: ${summary.total}`);
  console.log(`  Completed: ${summary.completed}`);
  console.log(`  In Progress: ${summary.inProgress}`);
  console.log(`  Planned: ${summary.planned}`);
  console.log(`  High Impact: ${summary.highImpact}`);
  
  console.log('\n✅ Roadmap insights publication completed!');
  console.log(`📁 Output files in: ${OUTPUT_DIR}`);
}

if (require.main === module) {
  main().catch(console.error);
} 