#!/usr/bin/env bun

/**
 * Clean Roadmap LLM Insights Script
 * 
 * Removes LLM insights from roadmap.yml while preserving task structure
 * and adding traceability references to the separate insights files.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';
import { createHash } from 'crypto';

const ROADMAP_YML = path.resolve('fossils/roadmap.yml');
const ROADMAP_BACKUP = path.resolve('fossils/roadmap.yml.backup');

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
 * Clean LLM insights from tasks recursively while preserving structure
 */
function cleanTaskInsights(tasks: any[], parentPath: string[] = []): any[] {
  return tasks.map(task => {
    const currentPath = [...parentPath, task.task];
    const cleanedTask = { ...task };
    
    // If task has LLM insights, replace with traceability reference
    if (task.llmInsights && typeof task.llmInsights === 'object') {
      const fossilId = generateFossilId(task.llmInsights);
      cleanedTask.llmInsights = {
        fossilId,
        extractedAt: formatISO(new Date()),
        source: 'roadmap-insights-collection.json',
        summary: task.llmInsights.summary || '',
        status: task.status || 'unknown',
        taskPath: currentPath,
      };
    }
    
    // Recursively clean subtasks
    if (Array.isArray(task.subtasks)) {
      cleanedTask.subtasks = cleanTaskInsights(task.subtasks, currentPath);
    }
    
    return cleanedTask;
  });
}

/**
 * Add metadata about the cleaning process
 */
function addCleaningMetadata(roadmap: any): any {
  return {
    ...roadmap,
    metadata: {
      ...roadmap.metadata,
      llmInsightsCleaned: true,
      cleanedAt: formatISO(new Date()),
      insightsLocation: 'fossils/roadmap_insights/roadmap_insights.json',
      webPublicationLocation: 'fossils/public/roadmap_progress.md',
      note: 'LLM insights have been extracted to separate files for better readability and web publication. Use the insightsReference field to trace back to detailed insights.'
    }
  };
}

async function main() {
  console.log('🧹 Cleaning LLM insights from roadmap...');
  
  try {
    // Read current roadmap
    const roadmapContent = await fs.readFile(ROADMAP_YML, 'utf-8');
    const roadmap = yaml.load(roadmapContent) as any;
    
    // Create backup
    await fs.writeFile(ROADMAP_BACKUP, roadmapContent, 'utf-8');
    console.log(`✅ Created backup: ${ROADMAP_BACKUP}`);
    
    // Clean LLM insights
    const cleanedRoadmap = {
      ...roadmap,
      tasks: cleanTaskInsights(roadmap.tasks || []),
      metadata: {
        ...roadmap.metadata,
        llmInsightsCleaned: {
          cleanedAt: formatISO(new Date()),
          fossilId: createHash('sha256')
            .update(roadmapContent)
            .digest('hex')
            .substring(0, 12),
          insightsExtracted: true,
          traceabilityReference: 'roadmap_insights_collection.json',
        },
      },
    };
    
    // Write cleaned roadmap
    const cleanedYaml = yaml.dump(cleanedRoadmap, { lineWidth: 120 });
    await fs.writeFile(ROADMAP_YML, cleanedYaml, 'utf-8');
    
    console.log('✅ Cleaned roadmap saved');
    console.log('📝 LLM insights replaced with traceability references');
    console.log('🔗 See roadmap_insights_collection.json for full insights');
    
  } catch (error) {
    console.error('❌ Error cleaning roadmap:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 