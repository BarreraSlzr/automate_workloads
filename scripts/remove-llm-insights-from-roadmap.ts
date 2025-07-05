#!/usr/bin/env bun

/**
 * Remove LLM Insights from Roadmap Script
 * 
 * Removes all llmInsights properties from roadmap.yml to clean up the structure
 * and prepare for external LLM insight analysis from new outputs.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';

const ROADMAP_YML = 'fossils/roadmap.yml';
const BACKUP_DIR = 'fossils/backups';

/**
 * Recursively remove llmInsights from tasks and subtasks
 */
function removeLLMInsights(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeLLMInsights);
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'llmInsights') {
        // Skip llmInsights entirely
        continue;
      }
      
      cleaned[key] = removeLLMInsights(value);
    }
    
    return cleaned;
  }
  
  return obj;
}

/**
 * Create backup of current roadmap
 */
async function createBackup(): Promise<string> {
  const timestamp = formatISO(new Date()).replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `roadmap_with_llm_insights_${timestamp}.yml`);
  
  // Ensure backup directory exists
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  
  // Copy current roadmap to backup
  const currentContent = await fs.readFile(ROADMAP_YML, 'utf-8');
  await fs.writeFile(backupFile, currentContent, 'utf-8');
  
  return backupFile;
}

/**
 * Add metadata about the cleaning process
 */
function addCleaningMetadata(roadmap: any): any {
  return {
    ...roadmap,
    metadata: {
      ...roadmap.metadata,
      llmInsightsRemoved: true,
      removedAt: formatISO(new Date()),
      insightsLocation: 'fossils/roadmap_insights/',
      note: 'LLM insights have been removed from roadmap.yml and are now managed externally. Use the insights collection and web publication for detailed analysis.'
    }
  };
}

async function main() {
  console.log('🧹 Removing LLM insights from roadmap.yml...');
  
  try {
    // Create backup
    const backupFile = await createBackup();
    console.log(`✅ Created backup: ${backupFile}`);
    
    // Read current roadmap
    const ymlRaw = await fs.readFile(ROADMAP_YML, 'utf-8');
    const roadmap = yaml.load(ymlRaw);
    
    if (!roadmap || typeof roadmap !== 'object') {
      throw new Error('Invalid roadmap.yml structure');
    }
    
    // Remove llmInsights recursively
    const cleanedRoadmap = removeLLMInsights(roadmap);
    
    // Add metadata about the cleaning
    const finalRoadmap = addCleaningMetadata(cleanedRoadmap);
    
    // Write cleaned roadmap
    const output = yaml.dump(finalRoadmap, { 
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
    
    await fs.writeFile(ROADMAP_YML, output, 'utf-8');
    
    console.log('✅ Successfully removed all llmInsights from roadmap.yml');
    console.log('📝 Note: LLM insights are now managed externally in fossils/roadmap_insights/');
    
  } catch (error) {
    console.error('❌ Error removing LLM insights:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 