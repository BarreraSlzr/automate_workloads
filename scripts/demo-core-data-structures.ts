#!/usr/bin/env bun

/**
 * Core Data Structures and Outputs Demo
 * 
 * Demonstrates the YAML→JSON→Markdown→Visual workflow for core data structures.
 * Shows how human-readable YAML fossils are transformed into machine-readable JSON
 * outputs with visual documentation generation.
 */

import { z } from 'zod';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

// Core data structure schemas
const TaskSchema: z.ZodType<any> = z.object({
  task: z.string(),
  status: z.enum(['done', 'in_progress', 'planned', 'pending']),
  owner: z.string().optional(),
  tags: z.array(z.string()).optional(),
  context: z.string().optional(),
  subtasks: z.array(z.lazy(() => TaskSchema)).optional(),
  milestone: z.string().optional(),
  issues: z.array(z.number()).optional(),
  labels: z.array(z.string()).optional(),
  deadline: z.record(z.any()).optional(),
});

const RoadmapSchema = z.object({
  type: z.string(),
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.record(z.any()),
  tasks: z.array(TaskSchema),
});

const ProjectStatusSchema = z.object({
  type: z.string(),
  version: z.string(),
  lastUpdated: z.string(),
  overview: z.object({
    name: z.string(),
    description: z.string(),
    status: z.string(),
    health: z.string(),
  }),
  milestones: z.record(z.object({
    status: z.string(),
    completion_rate: z.number(),
    tasks: z.array(z.string()),
  })),
  automation_metrics: z.object({
    total_tasks: z.number(),
    completed: z.number(),
    in_progress: z.number(),
    planned: z.number(),
    success_rate: z.number(),
  }),
});

// Visual diagram generation utilities
function generateWorkflowDiagram(): string {
  return `graph TD
    A[YAML Source] --> B[Human Review]
    B --> C[Validation]
    C --> D[Transformation]
    D --> E[JSON Output]
    D --> F[Markdown Docs]
    D --> G[Visual Diagrams]
    
    style A fill:#fff3e0
    style B fill:#e3f2fd
    style E fill:#e8f5e8
    style F fill:#f3e5f5
    style G fill:#fce4ec`;
}

function generateDataFlowDiagram(): string {
  return `graph LR
    subgraph "Input Layer"
        A[YAML Fossils]
        B[Human Input]
        C[LLM Insights]
    end
    
    subgraph "Processing Layer"
        D[Validation Engine]
        E[Transformation Engine]
        F[Enrichment Engine]
    end
    
    subgraph "Output Layer"
        G[JSON APIs]
        H[Markdown Docs]
        I[Visual Diagrams]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    
    style A fill:#fff3e0
    style G fill:#e3f2fd
    style H fill:#e8f5e8
    style I fill:#f3e5f5`;
}

function generateRelationshipDiagram(): string {
  return `graph TB
    subgraph "Core Fossils"
        A[roadmap.yml]
        B[project_status.yml]
        C[setup_status.yml]
    end
    
    subgraph "Generated Outputs"
        D[roadmap_insights.json]
        E[project_summary.json]
        F[api_endpoints.json]
    end
    
    subgraph "Documentation"
        G[README.md]
        H[API_REFERENCE.md]
        I[Technical Guides]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
    
    style A fill:#fff3e0
    style D fill:#e3f2fd
    style G fill:#e8f5e8`;
}

// Transformation utilities
function flattenTasks(tasks: any[], parentPath: string[] = []): any[] {
  const flattened: any[] = [];
  
  for (const task of tasks) {
    const taskPath = [...parentPath, task.task];
    const taskId = generateTaskId(task.task);
    
    flattened.push({
      taskId,
      taskTitle: task.task,
      taskPath,
      status: task.status,
      owner: task.owner,
      tags: task.tags || [],
      context: task.context,
      milestone: task.milestone,
      issues: task.issues || [],
      labels: task.labels || [],
      llmInsights: {
        summary: `Task ${task.status} for ${task.task}`,
        impact: task.status === 'done' ? 'Positive' : 'Pending',
        blockers: task.status === 'pending' ? 'Dependencies or resources' : 'None',
        recommendations: 'Review and update as needed',
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'demo',
        provider: 'local',
        fossilId: `demo-${taskId}`,
        roadmapVersion: '1.0.0',
      },
    });
    
    if (task.subtasks) {
      flattened.push(...flattenTasks(task.subtasks, taskPath));
    }
  }
  
  return flattened;
}

function generateTaskId(taskTitle: string): string {
  return taskTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12);
}

function addInsights(flattenedTasks: any[]): any[] {
  return flattenedTasks.map(task => ({
    ...task,
    llmInsights: {
      ...task.llmInsights,
      summary: `${task.taskTitle} is ${task.status} with ${task.llmInsights.impact.toLowerCase()} impact.`,
      recommendations: task.status === 'done' 
        ? 'Document lessons learned and consider optimization opportunities.'
        : 'Review task requirements and prepare for implementation.',
    },
  }));
}

function generateMetadata(): any {
  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    source: 'demo-transformation',
    processor: 'core-data-structures-demo',
  };
}

// Main transformation function
async function transformYamlToJson(yamlData: any, outputPath: string): Promise<any> {
  console.log('🔄 Transforming YAML to JSON...');
  
  // Validate YAML structure
  const validatedData = RoadmapSchema.parse(yamlData);
  
  // Flatten tasks
  const flattenedTasks = flattenTasks(validatedData.tasks);
  
  // Add insights
  const tasksWithInsights = addInsights(flattenedTasks);
  
  // Generate summary
  const summary = {
    total: tasksWithInsights.length,
    completed: tasksWithInsights.filter(t => t.status === 'done').length,
    inProgress: tasksWithInsights.filter(t => t.status === 'in_progress').length,
    planned: tasksWithInsights.filter(t => t.status === 'planned').length,
    pending: tasksWithInsights.filter(t => t.status === 'pending').length,
    highImpact: 0,
    withBlockers: tasksWithInsights.filter(t => t.status === 'pending').length,
    withDeadlines: 0,
  };
  
  // Create JSON output
  const jsonOutput = {
    type: 'roadmap-insights',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    roadmapSource: 'demo-roadmap.yml',
    summary,
    insights: tasksWithInsights,
    metadata: generateMetadata(),
  };
  
  // Write JSON file
  await writeFile(outputPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`✅ JSON output written to: ${outputPath}`);
  
  return jsonOutput;
}

// Documentation generation
async function generateMarkdownDocumentation(jsonData: any, outputPath: string): Promise<void> {
  console.log('📝 Generating Markdown documentation...');
  
  const markdown = `# Core Data Structures Demo

## Overview
This document demonstrates the YAML→JSON→Markdown transformation workflow for core data structures.

## Summary
- **Total Tasks**: ${jsonData.summary.total}
- **Completed**: ${jsonData.summary.completed}
- **In Progress**: ${jsonData.summary.inProgress}
- **Planned**: ${jsonData.summary.planned}
- **Pending**: ${jsonData.summary.pending}

## Workflow Diagram
\`\`\`mermaid
${generateWorkflowDiagram()}
\`\`\`

## Data Flow Architecture
\`\`\`mermaid
${generateDataFlowDiagram()}
\`\`\`

## Relationship Mapping
\`\`\`mermaid
${generateRelationshipDiagram()}
\`\`\`

## Task Insights
${jsonData.insights.map((insight: any) => `
### ${insight.taskTitle}
- **Status**: ${insight.status}
- **Owner**: ${insight.owner || 'Unassigned'}
- **Tags**: ${insight.tags.join(', ') || 'None'}
- **Summary**: ${insight.llmInsights.summary}
- **Impact**: ${insight.llmInsights.impact}
- **Recommendations**: ${insight.llmInsights.recommendations}
`).join('\n')}

## JSON API Structure
\`\`\`json
${JSON.stringify(jsonData, null, 2)}
\`\`\`

---
*Generated by Core Data Structures Demo - ${new Date().toISOString()}*
`;
  
  await writeFile(outputPath, markdown);
  console.log(`✅ Markdown documentation written to: ${outputPath}`);
}

// Demo execution
async function runDemo(): Promise<void> {
  console.log('🚀 Core Data Structures and Outputs Demo\n');
  
  // Sample YAML data (simulating fossils/roadmap.yml)
  const sampleYamlData = {
    type: 'e2e_automation_roadmap',
    source: 'demo',
    createdBy: 'demo-script',
    createdAt: {},
    tasks: [
      {
        task: 'Project Setup and Onboarding',
        status: 'done',
        owner: 'emmanuelbarrera',
        tags: ['setup', 'onboarding'],
        context: 'Complete project setup and onboarding documentation',
        milestone: 'Immediate Actions',
        issues: [201],
        labels: ['automation', 'onboarding'],
      },
      {
        task: 'Visual Documentation System',
        status: 'in_progress',
        owner: 'emmanuelbarrera',
        tags: ['documentation', 'visual', 'mermaid'],
        context: 'Add comprehensive visual documentation using Mermaid diagrams',
        subtasks: [
          {
            task: 'Create Visual Standards Guide',
            status: 'done',
            owner: 'emmanuelbarrera',
            tags: ['documentation', 'standards'],
          },
          {
            task: 'Implement Diagram Generation',
            status: 'in_progress',
            owner: 'emmanuelbarrera',
            tags: ['implementation', 'diagrams'],
          },
        ],
        milestone: 'Documentation Enhancement',
        issues: [202],
        labels: ['documentation', 'enhancement'],
      },
      {
        task: 'API Integration Framework',
        status: 'planned',
        owner: 'emmanuelbarrera',
        tags: ['api', 'integration'],
        context: 'Create comprehensive API integration framework',
        milestone: 'Future Development',
        issues: [203],
        labels: ['api', 'framework'],
      },
    ],
  };
  
  try {
    // Step 1: Transform YAML to JSON
    const jsonOutput = await transformYamlToJson(
      sampleYamlData,
      'fossils/demo-roadmap-insights.json'
    );
    
    // Step 2: Generate Markdown documentation
    await generateMarkdownDocumentation(
      jsonOutput,
      'docs/demo-core-data-structures.md'
    );
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📁 Generated files:');
    console.log('  - fossils/demo-roadmap-insights.json');
    console.log('  - docs/demo-core-data-structures.md');
    
    console.log('\n📊 Summary:');
    console.log(`  - Total tasks processed: ${jsonOutput.summary.total}`);
    console.log(`  - Completed: ${jsonOutput.summary.completed}`);
    console.log(`  - In progress: ${jsonOutput.summary.inProgress}`);
    console.log(`  - Planned: ${jsonOutput.summary.planned}`);
    
    console.log('\n🔗 Next steps:');
    console.log('  1. Review the generated JSON file');
    console.log('  2. Check the Markdown documentation');
    console.log('  3. Examine the Mermaid diagrams');
    console.log('  4. Use as a template for real implementations');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demo if called directly
if (import.meta.main) {
  runDemo();
}

export {
  transformYamlToJson,
  generateMarkdownDocumentation,
  generateWorkflowDiagram,
  generateDataFlowDiagram,
  generateRelationshipDiagram,
  flattenTasks,
  addInsights,
  generateMetadata,
}; 