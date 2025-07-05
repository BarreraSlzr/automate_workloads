import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { createHash } from 'crypto';
import type { 
  RoadmapTaskInsight, 
  RoadmapInsightsCollection,
  RoadmapInsightsWebPublication
} from '../types/roadmapInsights';
import { 
  RoadmapTaskInsightSchema,
  RoadmapInsightsCollectionSchema,
  RoadmapInsightsWebPublicationSchema
} from '../types/roadmapInsights';

/**
 * Extract LLM insights from roadmap tasks recursively
 */
function* extractTaskInsights(
  tasks: any[], 
  parentPath: string[] = []
): Generator<RoadmapTaskInsight> {
  for (const task of tasks) {
    const currentPath = [...parentPath, task.task];
    
    if (task.llmInsights && typeof task.llmInsights === 'object') {
      const taskId = generateTaskId(task.task, currentPath);
      const fossilId = generateFossilId(task.llmInsights);
      
      const insight: RoadmapTaskInsight = {
        taskId,
        taskTitle: task.task,
        taskPath: currentPath,
        status: task.status || 'unknown',
        milestone: task.milestone,
        owner: task.owner,
        tags: task.tags || [],
        llmInsights: {
          summary: task.llmInsights.summary || '',
          blockers: task.llmInsights.blockers || '',
          recommendations: task.llmInsights.recommendations || '',
          impact: task.llmInsights.impact || '',
          deadline: task.llmInsights.deadline ? String(task.llmInsights.deadline) : undefined,
          done: task.llmInsights.done,
        },
        metadata: {
          generatedAt: formatISO(new Date()),
          model: 'llama2',
          provider: 'ollama',
          fossilId,
          roadmapVersion: '1.0.0',
        },
      };
      
      // Validate the insight
      RoadmapTaskInsightSchema.parse(insight);
      yield insight;
    }
    
    // Recursively process subtasks
    if (Array.isArray(task.subtasks)) {
      yield* extractTaskInsights(task.subtasks, currentPath);
    }
  }
}

/**
 * Generate a unique task ID based on task title and path
 */
function generateTaskId(taskTitle: string, taskPath: string[]): string {
  const pathString = taskPath.join('-');
  return createHash('sha256')
    .update(`${taskTitle}-${pathString}`)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Generate a fossil ID for the LLM insight
 */
function generateFossilId(llmInsights: any): string {
  const content = JSON.stringify(llmInsights);
  return createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Create a collection of all roadmap insights
 */
export async function createRoadmapInsightsCollection(
  roadmapPath: string = 'fossils/roadmap.yml'
): Promise<RoadmapInsightsCollection> {
  const roadmapContent = await fs.readFile(roadmapPath, 'utf-8');
  const roadmap = yaml.load(roadmapContent) as any;
  
  const insights: RoadmapTaskInsight[] = [];
  const fossilIds: string[] = [];
  const milestones = new Set<string>();
  const owners = new Set<string>();
  const tags = new Set<string>();
  
  let totalTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let insightsGenerated = 0;
  
  // Extract insights and collect metadata
  for (const insight of extractTaskInsights(roadmap.tasks || [])) {
    insights.push(insight);
    fossilIds.push(insight.metadata.fossilId);
    
    if (insight.milestone) milestones.add(insight.milestone);
    if (insight.owner) owners.add(insight.owner);
    insight.tags?.forEach(tag => tags.add(tag));
    
    totalTasks++;
    if (insight.status === 'done') completedTasks++;
    else if (insight.status === 'planned' || insight.status === 'pending') pendingTasks++;
    
    if (insight.llmInsights.summary) insightsGenerated++;
  }
  
  const collection: RoadmapInsightsCollection = {
    type: 'roadmap-insights',
    version: '1.0.0',
    generatedAt: formatISO(new Date()),
    roadmapSource: roadmapPath,
    insights,
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      insightsGenerated,
      milestones: Array.from(milestones),
      owners: Array.from(owners),
      tags: Array.from(tags),
    },
    metadata: {
      generator: 'roadmap-insights-extractor',
      model: 'llama2',
      provider: 'ollama',
      fossilIds,
    },
  };
  
  // Validate the collection
  RoadmapInsightsCollectionSchema.parse(collection);
  return collection;
}

/**
 * Create a web publication format for human-readable display
 */
export function createRoadmapInsightsWebPublication(
  collection: RoadmapInsightsCollection
): RoadmapInsightsWebPublication {
  const completed = collection.insights.filter(i => i.status === 'done');
  const inProgress = collection.insights.filter(i => i.status === 'in-progress' || i.status === 'in progress');
  const planned = collection.insights.filter(i => i.status === 'planned' || i.status === 'pending');
  
  // Extract key recommendations
  const priority = collection.insights
    .filter(i => i.llmInsights.recommendations)
    .map(i => i.llmInsights.recommendations)
    .slice(0, 5);
  
  const blockers = collection.insights
    .filter(i => i.llmInsights.blockers && i.llmInsights.blockers !== 'None reported.')
    .map(i => i.llmInsights.blockers)
    .slice(0, 5);
  
  const opportunities = collection.insights
    .filter(i => i.llmInsights.impact && i.llmInsights.impact.includes('high'))
    .map(i => i.taskTitle)
    .slice(0, 5);
  
  const webPublication: RoadmapInsightsWebPublication = {
    type: 'roadmap-insights-web',
    version: '1.0.0',
    generatedAt: formatISO(new Date()),
    title: 'Roadmap Progress & Insights',
    description: 'AI-generated insights and progress tracking for the automation workload project roadmap.',
    sections: {
      overview: {
        summary: `Project has ${collection.summary.completedTasks} completed tasks out of ${collection.summary.totalTasks} total tasks, with ${collection.summary.insightsGenerated} AI-generated insights.`,
        keyMetrics: {
          completionRate: Math.round((collection.summary.completedTasks / collection.summary.totalTasks) * 100),
          insightsCoverage: Math.round((collection.summary.insightsGenerated / collection.summary.totalTasks) * 100),
          activeMilestones: collection.summary.milestones.length,
          activeOwners: collection.summary.owners.length,
        },
        recentUpdates: completed
          .filter(i => i.llmInsights.done?.completedAt)
          .sort((a, b) => new Date(b.llmInsights.done!.completedAt).getTime() - new Date(a.llmInsights.done!.completedAt).getTime())
          .slice(0, 3)
          .map(i => `${i.taskTitle} - ${i.llmInsights.done!.completedAt}`),
      },
      insights: {
        completed,
        inProgress,
        planned,
      },
      recommendations: {
        priority,
        blockers,
        opportunities,
      },
    },
    metadata: {
      lastUpdated: formatISO(new Date()),
      roadmapVersion: collection.version,
      insightsCount: collection.insights.length,
    },
  };
  
  // Validate the web publication
  RoadmapInsightsWebPublicationSchema.parse(webPublication);
  return webPublication;
}

/**
 * Generate markdown report from insights collection
 */
export function generateInsightsMarkdownReport(
  collection: RoadmapInsightsCollection,
  webPublication: RoadmapInsightsWebPublication
): string {
  const { sections } = webPublication;
  
  let markdown = `# Roadmap Progress & Insights Report\n\n`;
  markdown += `*Generated on ${webPublication.generatedAt}*\n\n`;
  
  // Executive Summary
  markdown += `## Executive Summary\n\n`;
  markdown += `${sections.overview.summary}\n\n`;
  markdown += `### Key Metrics\n`;
  markdown += `- **Completion Rate**: ${sections.overview.keyMetrics.completionRate}%\n`;
  markdown += `- **Insights Coverage**: ${sections.overview.keyMetrics.insightsCoverage}%\n`;
  markdown += `- **Active Milestones**: ${sections.overview.keyMetrics.activeMilestones}\n`;
  markdown += `- **Active Owners**: ${sections.overview.keyMetrics.activeOwners}\n\n`;
  
  // Recent Updates
  if (sections.overview.recentUpdates.length > 0) {
    markdown += `### Recent Completions\n`;
    sections.overview.recentUpdates.forEach(update => {
      markdown += `- ${update}\n`;
    });
    markdown += `\n`;
  }
  
  // Priority Recommendations
  if (sections.recommendations.priority.length > 0) {
    markdown += `## Priority Recommendations\n\n`;
    sections.recommendations.priority.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  // Blockers
  if (sections.recommendations.blockers.length > 0) {
    markdown += `## Current Blockers\n\n`;
    sections.recommendations.blockers.forEach((blocker, index) => {
      markdown += `${index + 1}. ${blocker}\n`;
    });
    markdown += `\n`;
  }
  
  // Completed Tasks with Insights
  if (sections.insights.completed.length > 0) {
    markdown += `## Completed Tasks\n\n`;
    sections.insights.completed.forEach(task => {
      markdown += `### ${task.taskTitle}\n`;
      markdown += `- **Status**: ${task.status}\n`;
      if (task.milestone) markdown += `- **Milestone**: ${task.milestone}\n`;
      if (task.owner) markdown += `- **Owner**: ${task.owner}\n`;
      markdown += `- **Summary**: ${task.llmInsights.summary}\n`;
      if (task.llmInsights.done?.retrospective) {
        markdown += `- **Retrospective**: ${task.llmInsights.done.retrospective}\n`;
      }
      markdown += `\n`;
    });
  }
  
  // In Progress Tasks
  if (sections.insights.inProgress.length > 0) {
    markdown += `## In Progress Tasks\n\n`;
    sections.insights.inProgress.forEach(task => {
      markdown += `### ${task.taskTitle}\n`;
      markdown += `- **Status**: ${task.status}\n`;
      if (task.milestone) markdown += `- **Milestone**: ${task.milestone}\n`;
      if (task.owner) markdown += `- **Owner**: ${task.owner}\n`;
      markdown += `- **Summary**: ${task.llmInsights.summary}\n`;
      if (task.llmInsights.blockers && task.llmInsights.blockers !== 'None reported.') {
        markdown += `- **Blockers**: ${task.llmInsights.blockers}\n`;
      }
      markdown += `\n`;
    });
  }
  
  // Opportunities
  if (sections.recommendations.opportunities.length > 0) {
    markdown += `## High-Impact Opportunities\n\n`;
    sections.recommendations.opportunities.forEach((opportunity, index) => {
      markdown += `${index + 1}. ${opportunity}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `*This report was automatically generated from roadmap LLM insights. `;
  markdown += `For detailed information, see the JSON collection file.*\n`;
  
  return markdown;
}

/**
 * Save insights collection and web publication to files
 */
export async function saveInsightsOutputs(
  collection: RoadmapInsightsCollection,
  webPublication: RoadmapInsightsWebPublication,
  markdownReport: string,
  outputDir: string = 'fossils'
): Promise<{
  collectionFile: string;
  webPublicationFile: string;
  markdownFile: string;
}> {
  await fs.mkdir(outputDir, { recursive: true });
  
  const collectionFile = path.join(outputDir, 'roadmap_insights_collection.json');
  const webPublicationFile = path.join(outputDir, 'roadmap_insights_web.json');
  const markdownFile = path.join(outputDir, 'roadmap_progress_report.md');
  
  await fs.writeFile(collectionFile, JSON.stringify(collection, null, 2));
  await fs.writeFile(webPublicationFile, JSON.stringify(webPublication, null, 2));
  await fs.writeFile(markdownFile, markdownReport);
  
  return {
    collectionFile,
    webPublicationFile,
    markdownFile,
  };
} 