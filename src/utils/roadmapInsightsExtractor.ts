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
function* extractTaskInsights(params: { tasks: any[]; parentPath?: string[] }): Generator<RoadmapTaskInsight> {
  const { tasks, parentPath = [] } = params;
  for (const task of tasks) {
    const currentPath = [...parentPath, task.task];
    
    if (task.llmInsights && typeof task.llmInsights === 'object') {
      const taskId = generateTaskId({ taskTitle: task.task, taskPath: currentPath });
      const fossilId = generateFossilId({ llmInsights: task.llmInsights });
      
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
      yield* extractTaskInsights({ tasks: task.subtasks, parentPath: currentPath });
    }
  }
}

/**
 * Generate a unique task ID based on task title and path
 */
function generateTaskId(params: { taskTitle: string; taskPath: string[] }): string {
  const { taskTitle, taskPath } = params;
  const pathString = taskPath.join('-');
  return createHash('sha256')
    .update(`${taskTitle}-${pathString}`)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Generate a fossil ID for the LLM insight
 */
function generateFossilId(params: { llmInsights: any }): string {
  const { llmInsights } = params;
  const content = JSON.stringify(llmInsights);
  return createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Create a collection of all roadmap insights
 */
export async function createRoadmapInsightsCollection(params: { roadmapPath?: string }): Promise<RoadmapInsightsCollection> {
  const roadmapPath = params.roadmapPath || 'fossils/roadmap.yml';
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
  for (const [i, insight] of Array.from(extractTaskInsights({ tasks: roadmap.tasks || [] })).entries()) {
    if (i % 10 === 0 || i === (roadmap.tasks?.length || 0) - 1) {
      console.log(`🔄 Processing extracted insight ${i + 1} of ${roadmap.tasks?.length || 0}`);
    }
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
export function createRoadmapInsightsWebPublication(params: { collection: RoadmapInsightsCollection }): RoadmapInsightsWebPublication {
  const { collection } = params;
  const completed = collection.insights.filter((i, idx, arr) => {
    if (idx % 10 === 0 || idx === arr.length - 1) {
      console.log(`🔄 Processing completed insight ${idx + 1} of ${arr.length}`);
    }
    return i.status === 'done';
  });
  const inProgress = collection.insights.filter((i, idx, arr) => {
    if (idx % 10 === 0 || idx === arr.length - 1) {
      console.log(`🔄 Processing in-progress insight ${idx + 1} of ${arr.length}`);
    }
    return i.status === 'in-progress' || i.status === 'in progress';
  });
  const planned = collection.insights.filter((i, idx, arr) => {
    if (idx % 10 === 0 || idx === arr.length - 1) {
      console.log(`🔄 Processing planned insight ${idx + 1} of ${arr.length}`);
    }
    return i.status === 'planned' || i.status === 'pending';
  });
  
  // Extract key recommendations
  const priority = collection.insights
    .filter((i, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Processing priority recommendation ${idx + 1} of ${arr.length}`);
      }
      return i.llmInsights.recommendations;
    })
    .map((i, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Mapping priority recommendation ${idx + 1} of ${arr.length}`);
      }
      return i.llmInsights.recommendations;
    })
    .slice(0, 5);
  
  const blockers = collection.insights
    .filter((i, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Processing blocker ${idx + 1} of ${arr.length}`);
      }
      return i.llmInsights.blockers && i.llmInsights.blockers !== 'None reported.';
    })
    .map((i, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Mapping blocker ${idx + 1} of ${arr.length}`);
      }
      return i.llmInsights.blockers;
    })
    .slice(0, 5);
  
  const opportunities = collection.insights
    .filter((i, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Processing opportunity ${idx + 1} of ${arr.length}`);
      }
      return i.llmInsights.impact && i.llmInsights.impact.includes('high');
    })
    .map((i, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Mapping opportunity ${idx + 1} of ${arr.length}`);
      }
      return i.taskTitle;
    })
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
export function generateInsightsMarkdownReport(params: { collection: RoadmapInsightsCollection; webPublication: RoadmapInsightsWebPublication }): string {
  const { collection, webPublication } = params;
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
    sections.overview.recentUpdates.forEach((update, idx, arr) => {
      if (idx % 10 === 0 || idx === arr.length - 1) {
        console.log(`🔄 Processing recent update ${idx + 1} of ${arr.length}`);
      }
      markdown += `- ${update}\n`;
    });
    markdown += `\n`;
  }
  
  // Priority Recommendations
  if (sections.recommendations.priority.length > 0) {
    markdown += `## Priority Recommendations\n\n`;
    sections.recommendations.priority.forEach((rec, index, arr) => {
      if (index % 10 === 0 || index === arr.length - 1) {
        console.log(`🔄 Processing priority recommendation ${index + 1} of ${arr.length}`);
      }
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  // Blockers
  if (sections.recommendations.blockers.length > 0) {
    markdown += `## Current Blockers\n\n`;
    sections.recommendations.blockers.forEach((blocker, index, arr) => {
      if (index % 10 === 0 || index === arr.length - 1) {
        console.log(`🔄 Processing blocker ${index + 1} of ${arr.length}`);
      }
      markdown += `${index + 1}. ${blocker}\n`;
    });
    markdown += `\n`;
  }
  
  // Completed Tasks with Insights
  if (sections.insights.completed.length > 0) {
    markdown += `## Completed Tasks\n\n`;
    sections.insights.completed.forEach((task, index, arr) => {
      if (index % 10 === 0 || index === arr.length - 1) {
        console.log(`🔄 Processing completed task ${index + 1} of ${arr.length}`);
      }
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
    sections.insights.inProgress.forEach((task, index, arr) => {
      if (index % 10 === 0 || index === arr.length - 1) {
        console.log(`🔄 Processing in-progress task ${index + 1} of ${arr.length}`);
      }
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
    sections.recommendations.opportunities.forEach((opportunity, index, arr) => {
      if (index % 10 === 0 || index === arr.length - 1) {
        console.log(`🔄 Processing opportunity ${index + 1} of ${arr.length}`);
      }
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
export async function saveInsightsOutputs(params: { collection: RoadmapInsightsCollection; webPublication: RoadmapInsightsWebPublication; markdownReport: string; outputDir?: string }): Promise<{
  collectionFile: string;
  webPublicationFile: string;
  markdownFile: string;
}> {
  const { collection, webPublication, markdownReport, outputDir = 'fossils' } = params;
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