#!/usr/bin/env bun

/**
 * Extract Roadmap Insights Script
 * 
 * Extracts LLM insights from roadmap.yml and creates separate fossil files
 * for better human readability and web publication.
 */

import { 
  createRoadmapInsightsCollection,
  createRoadmapInsightsWebPublication,
  generateInsightsMarkdownReport,
  saveInsightsOutputs
} from '../src/utils/roadmapInsightsExtractor';

async function main() {
  console.log('🔍 Extracting LLM insights from roadmap...');
  
  try {
    // Create insights collection
    const collection = await createRoadmapInsightsCollection();
    console.log(`✅ Extracted ${collection.insights.length} insights from roadmap`);
    
    // Create web publication format
    const webPublication = createRoadmapInsightsWebPublication(collection);
    console.log('✅ Generated web publication format');
    
    // Generate markdown report
    const markdownReport = generateInsightsMarkdownReport(collection, webPublication);
    console.log('✅ Generated markdown report');
    
    // Save all outputs
    const outputs = await saveInsightsOutputs(collection, webPublication, markdownReport);
    
    console.log('\n📊 Summary:');
    console.log(`- Total tasks with insights: ${collection.summary.totalTasks}`);
    console.log(`- Completed tasks: ${collection.summary.completedTasks}`);
    console.log(`- Pending tasks: ${collection.summary.pendingTasks}`);
    console.log(`- Insights generated: ${collection.summary.insightsGenerated}`);
    console.log(`- Active milestones: ${collection.summary.milestones.length}`);
    console.log(`- Active owners: ${collection.summary.owners.length}`);
    
    console.log('\n📁 Generated files:');
    console.log(`- Collection: ${outputs.collectionFile}`);
    console.log(`- Web publication: ${outputs.webPublicationFile}`);
    console.log(`- Markdown report: ${outputs.markdownFile}`);
    
    console.log('\n✅ Roadmap insights extraction completed successfully!');
    
  } catch (error) {
    console.error('❌ Error extracting roadmap insights:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 