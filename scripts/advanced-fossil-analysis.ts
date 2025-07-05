#!/usr/bin/env bun

/**
 * Advanced Fossil Analysis CLI
 * 
 * Demonstrates combining findSimilarFossils() and queryEntries() with local services
 * like git diff, LLM snapshots, and semantic analysis for advanced fossil operations.
 */

import { Command } from 'commander';
import { ContextFossilService } from '../src/cli/context-fossil';
import { executeCommand } from '../src/utils/cli';
import { LLMSnapshotExporter } from '../src/utils/llmSnapshotExporter';
import { SemanticTaggerService } from '../src/services/semantic-tagger';
import { LLMService } from '../src/services/llm';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('advanced-fossil-analysis')
  .description('Advanced fossil analysis combining multiple query methods with local services')
  .version('1.0.0');

// Example 1: Intelligent Deduplication with Git Context
program
  .command('deduplicate')
  .description('Intelligent fossil deduplication with git context analysis')
  .argument('<title>', 'Fossil title')
  .argument('<content>', 'Fossil content')
  .option('-t, --threshold <number>', 'Similarity threshold (0-100)', '80')
  .option('--git-context', 'Include git context analysis', true)
  .option('--llm-analysis', 'Include LLM relevance analysis', true)
  .action(async (title, content, options) => {
    try {
      console.log('🔍 Performing intelligent deduplication...');
      
      const fossilService = new ContextFossilService();
      await fossilService.initialize();

      // Step 1: Find similar fossils using findSimilarFossils()
      const similarFossils = await fossilService['findSimilarFossils'](
        title,
        content,
        parseInt(options.threshold)
      );

      if (similarFossils.length === 0) {
        console.log('✅ No similar fossils found - safe to create new fossil');
        return;
      }

      const bestMatch = similarFossils[0];
      if (!bestMatch || !bestMatch.fossil) {
        console.log('✅ No valid similar fossil found - safe to create new fossil');
        return;
      }

      let gitChanges: string[] = [];
      let llmAnalysis = '';

      // Step 2: Analyze git changes if requested
      if (options.gitContext) {
        console.log('📊 Analyzing git changes...');
        try {
          const result = await executeCommand(
            `git log --since="${bestMatch.fossil.createdAt ?? ''}" --oneline --name-only`
          );
          
          if (result.success) {
            gitChanges = result.stdout.split('\n').filter(line => line.trim());
            console.log(`📈 Found ${gitChanges.length} git changes since fossil creation`);
          }
        } catch (error) {
          console.warn('⚠️ Could not analyze git changes:', error);
        }
      }

      // Step 3: Use LLM for relevance analysis if requested
      if (options.llmAnalysis) {
        console.log('🧠 Analyzing relevance with LLM...');
        const llmService = new LLMService();
        
        const prompt = `
Analyze if this fossil is still relevant given recent changes:

Fossil: ${bestMatch.fossil.title ?? ''}
Content: ${bestMatch.fossil.content ?? ''}
Created: ${bestMatch.fossil.createdAt ?? ''}

Recent Git Changes:
${gitChanges.join('\n')}

New Proposed Content:
${content ?? ''}

Is the existing fossil still relevant, or should a new one be created? Provide reasoning.
`;

        try {
          const response = await llmService.callLLM({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            routingPreference: 'local'
          });

          llmAnalysis = response.choices?.[0]?.message?.content || 'Analysis unavailable';
          console.log('💡 LLM Analysis:', llmAnalysis);
        } catch (error) {
          console.warn('⚠️ LLM analysis failed:', error);
        }
      }

      // Step 4: Generate recommendation
      const hasRecentChanges = gitChanges.length > 0;
      const isHighlySimilar = (bestMatch.similarity ?? 0) > 90;
      const llmSuggestsNew = llmAnalysis.toLowerCase().includes('new') || 
                            llmAnalysis.toLowerCase().includes('outdated');

      let recommendation = '';
      if (isHighlySimilar && !hasRecentChanges && !llmSuggestsNew) {
        recommendation = 'REUSE: High similarity, no recent changes, LLM suggests reuse';
      } else if (hasRecentChanges || llmSuggestsNew) {
        recommendation = 'CREATE_NEW: Recent changes or LLM suggests new fossil needed';
      } else {
        recommendation = 'UPDATE: Moderate similarity, consider updating existing fossil';
      }

      console.log('\n🎯 Recommendation:', recommendation);
      console.log('\n📊 Analysis Summary:');
      console.log(`- Similarity: ${bestMatch.similarity ?? 0}%`);
      console.log(`- Git Changes: ${gitChanges.length}`);
      console.log(`- LLM Suggests New: ${llmSuggestsNew ? 'Yes' : 'No'}`);

    } catch (error) {
      console.error('❌ Deduplication failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Example 2: Fossil Evolution Tracking
program
  .command('evolution')
  .description('Track fossil evolution with LLM snapshots and related fossils')
  .argument('<fossil-id>', 'Fossil ID to track')
  .option('--start-date <date>', 'Start date for analysis (ISO format)')
  .option('--end-date <date>', 'End date for analysis (ISO format)')
  .option('--include-snapshots', 'Include LLM snapshots in analysis', true)
  .action(async (fossilId, options) => {
    try {
      console.log('📈 Tracking fossil evolution...');
      
      const fossilService = new ContextFossilService();
      await fossilService.initialize();

      // Step 1: Get the target fossil
      const fossil = await fossilService.getEntry(fossilId);
      if (!fossil) {
        throw new Error(`Fossil ${fossilId} not found`);
      }

      console.log(`📋 Analyzing fossil: ${fossil.title}`);

      const timeRange = {
        start: options.startDate || '2024-01-01T00:00:00Z',
        end: options.endDate || new Date().toISOString()
      };

      // Step 2: Query related fossils using queryEntries()
      console.log('🔍 Finding related fossils...');
      const relatedFossils = await fossilService.queryEntries({
        type: fossil.type,
        tags: fossil.tags,
        dateRange: timeRange,
        limit: 50,
        offset: 0
      });

      console.log(`📊 Found ${relatedFossils.length} related fossils`);

      // Step 3: Find semantically similar fossils using findSimilarFossils()
      console.log('🔍 Finding similar fossils...');
      const similarFossils = await fossilService['findSimilarFossils'](
        fossil.title,
        fossil.content,
        70
      );

      console.log(`📊 Found ${similarFossils.length} similar fossils`);

      // Step 4: Export LLM snapshots if requested
      let llmSnapshots: any = null;
      if (options.includeSnapshots) {
        console.log('📸 Exporting LLM snapshots...');
        const snapshotExporter = new LLMSnapshotExporter();
        llmSnapshots = await snapshotExporter.exportSnapshot({
          format: 'json',
          includeMetadata: true,
          includeTimestamps: true,
          includeValidation: true,
          filters: {
            dateRange: timeRange,
            tags: fossil.tags
          }
        });
      }

      // Step 5: Analyze evolution patterns
      const evolution = [];
      
      // Analyze version history
      if (fossil.previousVersions) {
        evolution.push(...fossil.previousVersions.map((v: any) => ({
          type: 'version',
          timestamp: v.createdAt,
          changes: 'Version update',
          content: v.content
        })));
      }

      // Analyze related fossils
      for (const related of relatedFossils) {
        if (related.id !== fossil.id) {
          evolution.push({
            type: 'related',
            timestamp: related.createdAt,
            changes: 'Related fossil created',
            content: related.title,
            relationship: 'same_type_and_tags'
          });
        }
      }

      // Analyze similar fossils
      for (const similar of similarFossils) {
        evolution.push({
          type: 'similar',
          timestamp: similar.fossil.createdAt,
          changes: 'Similar content detected',
          content: similar.fossil.title,
          similarity: similar.similarity
        });
      }

      const sortedEvolution = evolution.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Step 6: Generate insights
      const versionCount = evolution.filter(e => e.type === 'version').length;
      const relatedCount = evolution.filter(e => e.type === 'related').length;
      const similarCount = evolution.filter(e => e.type === 'similar').length;

      const recentEvolution = evolution.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      console.log('\n📊 Evolution Analysis:');
      console.log(`- Version updates: ${versionCount}`);
      console.log(`- Related fossils: ${relatedCount}`);
      console.log(`- Similar fossils: ${similarCount}`);
      console.log(`- Recent changes (30 days): ${recentEvolution.length}`);

      if (recentEvolution.length > 0) {
        console.log('🔄 Active evolution detected');
      } else {
        console.log('✅ Stable fossil - no recent changes');
      }

      console.log('\n📈 Evolution Timeline:');
      sortedEvolution.slice(0, 10).forEach((event, index) => {
        console.log(`${index + 1}. ${event.timestamp} - ${event.type}: ${event.changes}`);
      });

    } catch (error) {
      console.error('❌ Evolution tracking failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Example 3: Cross-Repository Analysis
program
  .command('cross-repo')
  .description('Analyze fossils across multiple repositories')
  .argument('<query>', 'Search query')
  .argument('[repositories...]', 'Repository paths')
  .option('--limit <number>', 'Maximum fossils per repository', '50')
  .option('--include-git-diff', 'Include git diff analysis', true)
  .action(async (query, repositories, options) => {
    try {
      console.log('🌐 Performing cross-repository analysis...');
      
      const fossilService = new ContextFossilService();
      await fossilService.initialize();

      // Step 1: Query global fossils using queryEntries()
      console.log('🔍 Querying global fossils...');
      const globalFossils = await fossilService.queryEntries({
        search: query,
        limit: 100,
        offset: 0
      });

      console.log(`📊 Found ${globalFossils.length} global fossils`);

      const results = {
        globalFossils,
        repositorySpecific: {} as Record<string, any[]>,
        crossRepoPatterns: [] as string[],
        recommendations: [] as string[]
      };

      // Step 2: Analyze each repository
      for (const repo of repositories) {
        console.log(`\n📁 Analyzing repository: ${repo}`);

        // Get repository-specific fossils
        const repoFossils = await fossilService.queryEntries({
          search: query,
          tags: [repo],
          limit: parseInt(options.limit),
          offset: 0
        });

        results.repositorySpecific[repo] = repoFossils;
        console.log(`📊 Found ${repoFossils.length} fossils in ${repo}`);

        // Analyze git diff if requested
        let gitDiff: string[] = [];
        if (options.includeGitDiff) {
          try {
            const result = await executeCommand(
              `cd ${repo} && git diff --name-only HEAD~10..HEAD`
            );
            
            if (result.success) {
              gitDiff = result.stdout.split('\n').filter(line => line.trim());
              console.log(`📈 Recent git changes: ${gitDiff.length} files`);
            }
          } catch (error) {
            console.warn(`⚠️ Could not analyze git diff for ${repo}:`, error);
          }
        }

        // Find cross-repository similarities
        const crossRepoSimilar = [];
        for (const repoFossil of repoFossils) {
          for (const globalFossil of globalFossils) {
            if (repoFossil.id !== globalFossil.id) {
              // Simple similarity check (in practice, use proper similarity algorithm)
              const similarity = calculateSimpleSimilarity(
                repoFossil.content,
                globalFossil.content
              );

              if (similarity > 70) {
                crossRepoSimilar.push({
                  repoFossil,
                  globalFossil,
                  similarity
                });
              }
            }
          }
        }

        console.log(`🔗 Cross-repo similarities: ${crossRepoSimilar.length} found`);

        // Generate insights
        if (crossRepoSimilar.length > 0) {
          results.recommendations.push(
            `Consider consolidating ${crossRepoSimilar.length} similar fossils across repositories`
          );
        }

        if (gitDiff.length > 0 && repoFossils.length === 0) {
          results.recommendations.push(
            `Repository ${repo} has changes but no relevant fossils - consider creating fossils for recent changes`
          );
        }
      }

      // Step 3: Generate summary
      console.log('\n📊 Cross-Repository Analysis Summary:');
      console.log(`- Global fossils: ${results.globalFossils.length}`);
      console.log(`- Repositories analyzed: ${repositories.length}`);
      
      for (const [repo, fossils] of Object.entries(results.repositorySpecific)) {
        console.log(`- ${repo}: ${fossils.length} fossils`);
      }

      if (results.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

    } catch (error) {
      console.error('❌ Cross-repository analysis failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Example 4: Intelligent Recommendations
program
  .command('recommend')
  .description('Generate intelligent fossil recommendations using semantic analysis')
  .argument('<context>', 'Context for recommendations')
  .option('-n, --max <number>', 'Maximum recommendations', '5')
  .option('--use-semantic-tags', 'Use semantic tagging', true)
  .option('--use-similarity', 'Use similarity search', true)
  .action(async (context, options) => {
    try {
      console.log('🧠 Generating intelligent recommendations...');
      
      const fossilService = new ContextFossilService();
      await fossilService.initialize();

      const recommendations = {
        tagBased: [] as any[],
        similarityBased: [] as any[],
        combined: [] as any[],
        reasoning: [] as string[]
      };

      // Step 1: Use semantic tagging if requested
      if (options.useSemanticTags) {
        console.log('🏷️ Analyzing with semantic tags...');
        const semanticTagger = new SemanticTaggerService();
        
        try {
          const semanticTags = await semanticTagger.generateSemanticTags({
            id: 'temp',
            type: 'insight',
            title: 'Context Analysis',
            content: context,
            tags: [],
            metadata: {},
            source: 'manual',
            version: 1,
            children: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          const tagBasedFossils = await fossilService.queryEntries({
            tags: semanticTags?.concepts || [],
            limit: 20,
            offset: 0
          });

          recommendations.tagBased = tagBasedFossils;
          console.log(`📊 Found ${tagBasedFossils.length} fossils using semantic tags`);
        } catch (error) {
          console.warn('⚠️ Semantic tagging failed:', error);
        }
      }

      // Step 2: Use similarity search if requested
      if (options.useSimilarity) {
        console.log('🔍 Searching by similarity...');
        try {
          const similarFossils = await fossilService['findSimilarFossils'](
            '', // No title constraint
            context,
            60
          );

          recommendations.similarityBased = similarFossils.map(s => s.fossil);
          console.log(`📊 Found ${similarFossils.length} fossils using similarity search`);
        } catch (error) {
          console.warn('⚠️ Similarity search failed:', error);
        }
      }

      // Step 3: Combine and deduplicate results
      const allFossils = [...recommendations.tagBased, ...recommendations.similarityBased];
      const uniqueFossils = deduplicateFossils(allFossils || []);
      recommendations.combined = uniqueFossils.slice(0, parseInt(options.max));

      // Step 4: Use LLM to generate reasoning
      console.log('🧠 Generating reasoning with LLM...');
      const llmService = new LLMService();
      
      const fossilSummaries = recommendations.combined.map(f => 
        `${f.title}: ${f.content.substring(0, 100)}...`
      ).join('\n');

      const prompt = `
Given this context: "${context}"

And these available fossils:
${fossilSummaries}

Explain why these fossils are relevant to the context. Provide 2-3 sentences per fossil.
`;

      try {
        const response = await llmService.callLLM({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          routingPreference: 'local'
        });

        recommendations.reasoning = [response.choices[0]?.message?.content || 'Reasoning unavailable'];
      } catch (error) {
        recommendations.reasoning = ['LLM analysis failed, using top fossils by relevance'];
      }

      // Step 5: Display results
      console.log('\n📋 Recommendations:');
      recommendations.combined.forEach((fossil, index) => {
        console.log(`\n${index + 1}. ${fossil.title}`);
        console.log(`   ID: ${fossil.id}`);
        console.log(`   Type: ${fossil.type}`);
        console.log(`   Tags: ${fossil.tags.join(', ')}`);
        console.log(`   Content: ${fossil.content.substring(0, 100)}...`);
      });

      if (recommendations.reasoning.length > 0) {
        console.log('\n💡 Reasoning:');
        recommendations.reasoning.forEach(reason => {
          console.log(reason);
        });
      }

      console.log('\n📊 Summary:');
      console.log(`- Tag-based results: ${recommendations.tagBased.length}`);
      console.log(`- Similarity-based results: ${recommendations.similarityBased.length}`);
      console.log(`- Combined unique results: ${recommendations.combined.length}`);

    } catch (error) {
      console.error('❌ Recommendations failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Example 5: Quality Assessment
program
  .command('quality')
  .description('Assess fossil quality using multiple analysis methods')
  .argument('<fossil-id>', 'Fossil ID to assess')
  .option('--include-git', 'Include git context analysis', true)
  .option('--include-llm', 'Include LLM content analysis', true)
  .option('--include-duplicates', 'Include duplicate detection', true)
  .action(async (fossilId, options) => {
    try {
      console.log('🔍 Assessing fossil quality...');
      
      const fossilService = new ContextFossilService();
      await fossilService.initialize();

      // Step 1: Get the fossil
      const fossil = await fossilService.getEntry(fossilId);
      if (!fossil) {
        throw new Error(`Fossil ${fossilId} not found`);
      }

      console.log(`📋 Assessing fossil: ${fossil.title}`);

      let qualityScore = 50; // Base score
      const issues: string[] = [];
      const improvements: string[] = [];

      // Step 2: Analyze git context if requested
      let gitContext: any = null;
      if (options.includeGit) {
        console.log('📊 Analyzing git context...');
        try {
          const result = await executeCommand(
            `git log --since="${fossil.createdAt}" --until="${fossil.updatedAt}" --oneline`
          );
          
          gitContext = {
            commits: result.success ? result.stdout.split('\n').filter(line => line.trim()) : [],
            timeSpan: {
              start: fossil.createdAt,
              end: fossil.updatedAt
            }
          };

          if (gitContext.commits.length > 0) {
            qualityScore += 10;
            console.log(`📈 Found ${gitContext.commits.length} git commits`);
          } else {
            issues.push('No recent git activity');
            improvements.push('Consider updating fossil with recent changes');
          }
        } catch (error) {
          console.warn('⚠️ Git analysis failed:', error);
        }
      }

      // Step 3: Use LLM for content analysis if requested
      let llmAnalysis: any = null;
      if (options.includeLlm) {
        console.log('🧠 Analyzing content with LLM...');
        const llmService = new LLMService();
        
        const prompt = `
Analyze this fossil for quality and completeness:

Title: ${fossil.title}
Content: ${fossil.content}
Type: ${fossil.type}
Tags: ${fossil.tags.join(', ')}

Provide analysis in JSON format with:
- contentQuality (1-10)
- completeness (1-10)
- clarity (1-10)
- relevance (1-10)
- suggestions (array of improvement suggestions)
`;

        try {
          const response = await llmService.callLLM({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            routingPreference: 'local'
          });

          const content = response.choices[0]?.message?.content || '{}';
          llmAnalysis = JSON.parse(content);

          // Update quality score based on LLM analysis
          if (llmAnalysis.contentQuality) qualityScore += llmAnalysis.contentQuality * 0.4;
          if (llmAnalysis.completeness) qualityScore += llmAnalysis.completeness * 0.4;
          if (llmAnalysis.clarity) qualityScore += llmAnalysis.clarity * 0.4;
          if (llmAnalysis.relevance) qualityScore += llmAnalysis.relevance * 0.4;

          console.log('💡 LLM Analysis completed');
        } catch (error) {
          console.warn('⚠️ LLM analysis failed:', error);
        }
      }

      // Step 4: Check for duplicates if requested
      let duplicates: any[] = [];
      if (options.includeDuplicates) {
        console.log('🔍 Checking for duplicates...');
        try {
          duplicates = await fossilService['findSimilarFossils'](
            fossil.title,
            fossil.content,
            90
          );

          if (duplicates.length > 0) {
            qualityScore -= duplicates.length * 5;
            issues.push(`${duplicates.length} potential duplicates found`);
            improvements.push('Consider consolidating with similar fossils');
          } else {
            console.log('✅ No duplicates found');
          }
        } catch (error) {
          console.warn('⚠️ Duplicate detection failed:', error);
        }
      }

      // Step 5: Query related fossils
      console.log('🔍 Finding related fossils...');
      const relatedFossils = await fossilService.queryEntries({
        type: fossil.type,
        tags: fossil.tags,
        limit: 10,
        offset: 0
      });

      if (relatedFossils.length > 0) {
        qualityScore += Math.min(relatedFossils.length * 2, 20);
        console.log(`📊 Found ${relatedFossils.length} related fossils`);
      }

      // Step 6: Identify additional issues
      if (fossil.content.length < 50) {
        issues.push('Content too short');
        improvements.push('Consider expanding content with more details');
      }
      if (fossil.tags.length === 0) {
        issues.push('No tags assigned');
        improvements.push('Add tags for better categorization');
      }
      if (fossil.tags.length < 3) {
        improvements.push('Add more tags for better discoverability');
      }

      // Step 7: Display results
      qualityScore = Math.max(0, Math.min(100, qualityScore));

      console.log('\n📊 Quality Assessment Results:');
      console.log(`- Quality Score: ${qualityScore}/100`);
      
      if (qualityScore >= 80) {
        console.log('🏆 Excellent quality fossil');
      } else if (qualityScore >= 60) {
        console.log('✅ Good quality fossil');
      } else if (qualityScore >= 40) {
        console.log('⚠️ Average quality fossil');
      } else {
        console.log('❌ Poor quality fossil');
      }

      if (issues.length > 0) {
        console.log('\n❌ Issues Found:');
        issues.forEach(issue => console.log(`- ${issue}`));
      }

      if (improvements.length > 0) {
        console.log('\n💡 Improvement Suggestions:');
        improvements.forEach(improvement => console.log(`- ${improvement}`));
      }

      if (llmAnalysis && llmAnalysis.suggestions) {
        console.log('\n🧠 LLM Suggestions:');
        llmAnalysis.suggestions.forEach((suggestion: string) => console.log(`- ${suggestion}`));
      }

    } catch (error) {
      console.error('❌ Quality assessment failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Helper methods
function calculateSimpleSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return (commonWords.length / Math.max(words1.length, words2.length)) * 100;
}

function deduplicateFossils(fossils: any[]): any[] {
  const seen = new Set();
  return fossils.filter(fossil => {
    if (seen.has(fossil.id)) {
      return false;
    }
    seen.add(fossil.id);
    return true;
  });
}

if (import.meta.main) {
  program.parse();
} 