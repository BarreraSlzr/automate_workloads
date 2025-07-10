#!/usr/bin/env bun

import { Command } from 'commander';
import { writeFile, mkdir, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { FossilSummarySchema, FossilSummary } from '../types/cli';
import { parseJsonSafe } from '@/utils/json';

const program = new Command();

program
  .name('fossil-summary')
  .description('Update fossilization summary')
  .option('--update', 'Update the summary')
  .option('--output <path>', 'Output file for summary', 'fossils/fossil_summary.json')
  .parse();

const options = program.opts();

async function updateFossilSummary(): Promise<void> {
  const timestamp = new Date().toISOString();
  const fossilsDir = 'fossils';
  
  // Scan fossils directory
  const fossilCategories: Record<string, number> = {};
  const recentFossils: Array<{category: string, filename: string, timestamp: string}> = [];
  
  try {
    const entries = await readdir(fossilsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const category = entry.name;
        const categoryPath = join(fossilsDir, category);
        
        try {
          const files = await readdir(categoryPath);
          const jsonFiles = files.filter(f => f.endsWith('.json'));
          fossilCategories[category] = jsonFiles.length;
          
          // Get recent fossils (last 5 per category)
          for (const file of jsonFiles.slice(-5)) {
            const filePath = join(categoryPath, file);
            try {
              const content = await readFile(filePath, 'utf-8');
              const data = parseJsonSafe(content, 'cli:fossil-summary:content') as any;
              recentFossils.push({
                category,
                filename: file,
                timestamp: (data && typeof data === 'object' && 'timestamp' in data) ? data.timestamp : new Date().toISOString(),
              });
            } catch (error) {
              // Skip files that can't be parsed
            }
          }
        } catch (error) {
          // Skip directories that can't be read
        }
      }
    }
  } catch (error) {
    console.log('No fossils directory found');
  }
  
  // Sort recent fossils by timestamp
  recentFossils.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const totalFossils = Object.values(fossilCategories).reduce((sum, count) => sum + count, 0);
  
  const fossilSummary: FossilSummary = {
    timestamp,
    total_fossils: totalFossils,
    fossil_categories: fossilCategories,
    recent_fossils: recentFossils.slice(0, 20), // Top 20 most recent
    summary: {
      validation_fossils: fossilCategories['validation'] || 0,
      performance_fossils: fossilCategories['performance'] || 0,
      llm_insights_fossils: fossilCategories['llm_insights'] || 0,
      other_fossils: totalFossils - (fossilCategories['validation'] || 0) - (fossilCategories['performance'] || 0) - (fossilCategories['llm_insights'] || 0),
    },
  };
  
  // Ensure output directory exists
  await mkdir(join(fossilsDir), { recursive: true });
  
  // Write summary file
  await writeFile(options.output, JSON.stringify(fossilSummary, null, 2));
  
  console.log(`✅ Fossil summary updated: ${options.output}`);
  console.log(`📊 Total fossils: ${totalFossils}`);
  console.log(`📁 Categories: ${Object.keys(fossilCategories).join(', ')}`);
}

updateFossilSummary().catch(console.error); 