#!/usr/bin/env bun

/**
 * Advanced Fossil Query Patterns Example
 * 
 * This example demonstrates how to combine findSimilarFossils() and queryEntries()
 * with local services like LLM snapshots, git diff, and other approaches for
 * advanced fossil operations and analysis.
 */

import { ContextFossilService } from '../src/cli/context-fossil';
import { executeCommand } from '../src/utils/cli';
import { LLMSnapshotExporter } from '../src/utils/llmSnapshotExporter';
import { GitDiffAnalyzer } from '../src/utils/gitDiffAnalyzer';
import { SemanticTaggerService } from '../src/services/semantic-tagger';
import { LLMService } from '../src/services/llm';
import * as fs from 'fs/promises';
import * as path from 'path';

interface FossilAnalysisResult {
  fossil: any;
  similarity: number;
  gitChanges?: string[];
  llmInsights?: string[];
  semanticTags?: string[];
  recommendations?: string[];
}

class AdvancedFossilAnalyzer {
  private fossilService: ContextFossilService;
  private llmService: LLMService;
  private semanticTagger: SemanticTaggerService;
  private gitAnalyzer: GitDiffAnalyzer;
  private snapshotExporter: LLMSnapshotExporter;

  constructor() {
    this.fossilService = new ContextFossilService();
    this.llmService = new LLMService();
    this.semanticTagger = new SemanticTaggerService();
    this.gitAnalyzer = new GitDiffAnalyzer();
    this.snapshotExporter = new LLMSnapshotExporter();
  }

  async initialize() {
    await this.fossilService.initialize();
  }

  /**
   * Example 1: Intelligent Fossil Deduplication with Git Context
   * Combines findSimilarFossils() with git diff analysis
   */
  async intelligentDeduplicationWithGitContext(
    title: string,
    content: string,
    similarityThreshold: number = 80
  ): Promise<FossilAnalysisResult | null> {
    console.log('🔍 Performing intelligent deduplication with git context...');

    // Step 1: Find similar fossils using findSimilarFossils()
    const similarFossils = await this.fossilService['findSimilarFossils'](
      title,
      content,
      similarityThreshold
    );

    if (similarFossils.length === 0) {
      console.log('✅ No similar fossils found - safe to create new fossil');
      return null;
    }

    const bestMatch = similarFossils[0];
    console.log(`📋 Found similar fossil: ${bestMatch.fossil.title} (${bestMatch.similarity}% similar)`);

    // Step 2: Analyze git changes since the similar fossil was created
    const gitChanges = await this.analyzeGitChangesSinceFossil(bestMatch.fossil.createdAt);
    
    // Step 3: Use LLM to analyze if changes make the fossil outdated
    const llmAnalysis = await this.analyzeFossilRelevanceWithLLM(
      bestMatch.fossil,
      gitChanges,
      content
    );

    // Step 4: Generate semantic tags for comparison
    const semanticTags = await this.semanticTagger.analyzeContent({
      content: `${title}\n\n${content}`,
      routingPreference: 'local'
    });

    // Step 5: Make intelligent recommendation
    const recommendation = await this.generateDeduplicationRecommendation(
      bestMatch,
      gitChanges,
      llmAnalysis,
      semanticTags
    );

    return {
      fossil: bestMatch.fossil,
      similarity: bestMatch.similarity,
      gitChanges,
      llmInsights: [llmAnalysis],
      semanticTags,
      recommendations: [recommendation]
    };
  }

  /**
   * Example 2: Fossil Evolution Tracking with LLM Snapshots
   * Combines queryEntries() with LLM snapshot analysis
   */
  async trackFossilEvolutionWithLLMSnapshots(
    fossilId: string,
    timeRange: { start: string; end: string }
  ): Promise<{
    fossil: any;
    evolution: any[];
    llmSnapshots: any[];
    insights: string[];
  }> {
    console.log('📈 Tracking fossil evolution with LLM snapshots...');

    // Step 1: Get the target fossil
    const fossil = await this.fossilService.getEntry(fossilId);
    if (!fossil) {
      throw new Error(`Fossil ${fossilId} not found`);
    }

    // Step 2: Query related fossils using queryEntries()
    const relatedFossils = await this.fossilService.queryEntries({
      type: fossil.type,
      tags: fossil.tags,
      dateRange: timeRange,
      limit: 50,
      offset: 0
    });

    // Step 3: Find semantically similar fossils using findSimilarFossils()
    const similarFossils = await this.fossilService['findSimilarFossils'](
      fossil.title,
      fossil.content,
      70
    );

    // Step 4: Export LLM snapshots for analysis
    const llmSnapshots = await this.snapshotExporter.exportLLMSnapshot({
      format: 'json',
      includeMetadata: true,
      includeTimestamps: true,
      includeValidation: true,
      filters: {
        dateRange: timeRange,
        tags: fossil.tags
      }
    });

    // Step 5: Analyze evolution patterns
    const evolution = await this.analyzeFossilEvolution(
      fossil,
      relatedFossils,
      similarFossils
    );

    // Step 6: Generate insights using LLM
    const insights = await this.generateEvolutionInsights(
      fossil,
      evolution,
      llmSnapshots
    );

    return {
      fossil,
      evolution,
      llmSnapshots: [llmSnapshots],
      insights
    };
  }

  /**
   * Example 3: Cross-Repository Fossil Analysis
   * Combines multiple query methods with git diff analysis
   */
  async crossRepositoryFossilAnalysis(
    repositories: string[],
    query: string
  ): Promise<{
    globalFossils: any[];
    repositorySpecific: Record<string, any[]>;
    crossRepoPatterns: string[];
    recommendations: string[];
  }> {
    console.log('🌐 Performing cross-repository fossil analysis...');

    const results = {
      globalFossils: [] as any[],
      repositorySpecific: {} as Record<string, any[]>,
      crossRepoPatterns: [] as string[],
      recommendations: [] as string[]
    };

    // Step 1: Query global fossils using queryEntries()
    const globalFossils = await this.fossilService.queryEntries({
      search: query,
      limit: 100,
      offset: 0
    });

    results.globalFossils = globalFossils;

    // Step 2: Analyze each repository
    for (const repo of repositories) {
      console.log(`📁 Analyzing repository: ${repo}`);

      // Get repository-specific fossils
      const repoFossils = await this.fossilService.queryEntries({
        search: query,
        tags: [repo],
        limit: 50,
        offset: 0
      });

      results.repositorySpecific[repo] = repoFossils;

      // Analyze git diff for each repository
      const gitDiff = await this.analyzeRepositoryGitDiff(repo);
      
      // Find similar fossils across repositories
      const crossRepoSimilar = await this.findCrossRepositorySimilarFossils(
        repoFossils,
        globalFossils
      );

      // Generate repository-specific insights
      const repoInsights = await this.generateRepositoryInsights(
        repo,
        repoFossils,
        gitDiff,
        crossRepoSimilar
      );

      results.crossRepoPatterns.push(...repoInsights.patterns);
      results.recommendations.push(...repoInsights.recommendations);
    }

    return results;
  }

  /**
   * Example 4: Intelligent Fossil Recommendations
   * Combines semantic analysis with query optimization
   */
  async generateIntelligentFossilRecommendations(
    context: string,
    maxRecommendations: number = 5
  ): Promise<{
    recommendations: any[];
    reasoning: string[];
    confidence: number;
  }> {
    console.log('🧠 Generating intelligent fossil recommendations...');

    // Step 1: Use semantic tagging to understand context
    const semanticTags = await this.semanticTagger.analyzeContent({
      content: context,
      routingPreference: 'local'
    });

    // Step 2: Query fossils using semantic tags
    const tagBasedFossils = await this.fossilService.queryEntries({
      tags: semanticTags,
      limit: 20,
      offset: 0
    });

    // Step 3: Find semantically similar fossils
    const similarFossils = await this.fossilService['findSimilarFossils'](
      '', // No title constraint
      context,
      60
    );

    // Step 4: Combine and rank results
    const allFossils = [...tagBasedFossils, ...similarFossils.map(s => s.fossil)];
    const uniqueFossils = this.deduplicateFossils(allFossils);

    // Step 5: Use LLM to generate recommendations
    const recommendations = await this.generateLLMRecommendations(
      context,
      uniqueFossils.slice(0, maxRecommendations)
    );

    return recommendations;
  }

  /**
   * Example 5: Fossil Quality Assessment with Local Services
   * Comprehensive quality analysis using multiple approaches
   */
  async assessFossilQuality(
    fossilId: string
  ): Promise<{
    fossil: any;
    qualityScore: number;
    issues: string[];
    improvements: string[];
    gitContext: any;
    llmAnalysis: any;
  }> {
    console.log('🔍 Assessing fossil quality...');

    const fossil = await this.fossilService.getEntry(fossilId);
    if (!fossil) {
      throw new Error(`Fossil ${fossilId} not found`);
    }

    // Step 1: Analyze git context
    const gitContext = await this.analyzeGitContext(fossil);

    // Step 2: Use LLM for content analysis
    const llmAnalysis = await this.analyzeFossilContentWithLLM(fossil);

    // Step 3: Check for duplicates using findSimilarFossils()
    const duplicates = await this.fossilService['findSimilarFossils'](
      fossil.title,
      fossil.content,
      90
    );

    // Step 4: Query related fossils using queryEntries()
    const relatedFossils = await this.fossilService.queryEntries({
      type: fossil.type,
      tags: fossil.tags,
      limit: 10,
      offset: 0
    });

    // Step 5: Calculate quality score
    const qualityScore = this.calculateQualityScore(
      fossil,
      gitContext,
      llmAnalysis,
      duplicates,
      relatedFossils
    );

    // Step 6: Generate improvement suggestions
    const improvements = await this.generateImprovementSuggestions(
      fossil,
      qualityScore,
      gitContext,
      llmAnalysis
    );

    return {
      fossil,
      qualityScore,
      issues: this.identifyQualityIssues(fossil, qualityScore),
      improvements,
      gitContext,
      llmAnalysis
    };
  }

  // Helper methods

  private async analyzeGitChangesSinceFossil(createdAt: string): Promise<string[]> {
    try {
      const result = await executeCommand(
        `git log --since="${createdAt}" --oneline --name-only`
      );
      
      if (result.success) {
        return result.stdout.split('\n').filter(line => line.trim());
      }
      return [];
    } catch (error) {
      console.warn('⚠️ Could not analyze git changes:', error);
      return [];
    }
  }

  private async analyzeFossilRelevanceWithLLM(
    fossil: any,
    gitChanges: string[],
    newContent: string
  ): Promise<string> {
    const prompt = `
Analyze if this fossil is still relevant given recent changes:

Fossil: ${fossil.title}
Content: ${fossil.content}
Created: ${fossil.createdAt}

Recent Git Changes:
${gitChanges.join('\n')}

New Proposed Content:
${newContent}

Is the existing fossil still relevant, or should a new one be created? Provide reasoning.
`;

    try {
      const response = await this.llmService.callLLM({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        routingPreference: 'local'
      });

      return response.choices[0]?.message?.content || 'Analysis unavailable';
    } catch (error) {
      return 'LLM analysis failed';
    }
  }

  private async generateDeduplicationRecommendation(
    bestMatch: any,
    gitChanges: string[],
    llmAnalysis: string,
    semanticTags: string[]
  ): Promise<string> {
    const hasRecentChanges = gitChanges.length > 0;
    const isHighlySimilar = bestMatch.similarity > 90;
    const llmSuggestsNew = llmAnalysis.toLowerCase().includes('new') || 
                          llmAnalysis.toLowerCase().includes('outdated');

    if (isHighlySimilar && !hasRecentChanges && !llmSuggestsNew) {
      return 'REUSE: High similarity, no recent changes, LLM suggests reuse';
    } else if (hasRecentChanges || llmSuggestsNew) {
      return 'CREATE_NEW: Recent changes or LLM suggests new fossil needed';
    } else {
      return 'UPDATE: Moderate similarity, consider updating existing fossil';
    }
  }

  private async analyzeFossilEvolution(
    fossil: any,
    relatedFossils: any[],
    similarFossils: any[]
  ): Promise<any[]> {
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

    return evolution.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private async generateEvolutionInsights(
    fossil: any,
    evolution: any[],
    llmSnapshots: any[]
  ): Promise<string[]> {
    const insights = [];

    // Analyze evolution patterns
    const versionCount = evolution.filter(e => e.type === 'version').length;
    const relatedCount = evolution.filter(e => e.type === 'related').length;
    const similarCount = evolution.filter(e => e.type === 'similar').length;

    insights.push(`Fossil has ${versionCount} version updates`);
    insights.push(`${relatedCount} related fossils created`);
    insights.push(`${similarCount} similar fossils detected`);

    // Analyze temporal patterns
    const recentEvolution = evolution.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentEvolution.length > 0) {
      insights.push(`Active evolution: ${recentEvolution.length} changes in last 30 days`);
    } else {
      insights.push('Stable fossil: No recent changes');
    }

    return insights;
  }

  private async analyzeRepositoryGitDiff(repo: string): Promise<string[]> {
    try {
      const result = await executeCommand(
        `cd ${repo} && git diff --name-only HEAD~10..HEAD`
      );
      
      if (result.success) {
        return result.stdout.split('\n').filter(line => line.trim());
      }
      return [];
    } catch (error) {
      console.warn(`⚠️ Could not analyze git diff for ${repo}:`, error);
      return [];
    }
  }

  private async findCrossRepositorySimilarFossils(
    repoFossils: any[],
    globalFossils: any[]
  ): Promise<any[]> {
    const similar = [];

    for (const repoFossil of repoFossils) {
      for (const globalFossil of globalFossils) {
        if (repoFossil.id !== globalFossil.id) {
          const similarity = this.calculateSimilarity(
            repoFossil.content,
            globalFossil.content
          );

          if (similarity > 70) {
            similar.push({
              repoFossil,
              globalFossil,
              similarity
            });
          }
        }
      }
    }

    return similar;
  }

  private async generateRepositoryInsights(
    repo: string,
    repoFossils: any[],
    gitDiff: string[],
    crossRepoSimilar: any[]
  ): Promise<{ patterns: string[]; recommendations: string[] }> {
    const patterns = [];
    const recommendations = [];

    // Analyze patterns
    patterns.push(`Repository ${repo} has ${repoFossils.length} relevant fossils`);
    patterns.push(`Recent git changes: ${gitDiff.length} files modified`);
    patterns.push(`Cross-repo similarities: ${crossRepoSimilar.length} found`);

    // Generate recommendations
    if (crossRepoSimilar.length > 0) {
      recommendations.push(`Consider consolidating ${crossRepoSimilar.length} similar fossils across repositories`);
    }

    if (gitDiff.length > 0 && repoFossils.length === 0) {
      recommendations.push(`Repository has changes but no relevant fossils - consider creating fossils for recent changes`);
    }

    return { patterns, recommendations };
  }

  private deduplicateFossils(fossils: any[]): any[] {
    const seen = new Set();
    return fossils.filter(fossil => {
      if (seen.has(fossil.id)) {
        return false;
      }
      seen.add(fossil.id);
      return true;
    });
  }

  private async generateLLMRecommendations(
    context: string,
    fossils: any[]
  ): Promise<{
    recommendations: any[];
    reasoning: string[];
    confidence: number;
  }> {
    const fossilSummaries = fossils.map(f => 
      `${f.title}: ${f.content.substring(0, 100)}...`
    ).join('\n');

    const prompt = `
Given this context: "${context}"

And these available fossils:
${fossilSummaries}

Recommend the top ${fossils.length} most relevant fossils and explain why.
Format as JSON with "recommendations" array containing fossil IDs and "reasoning" array.
`;

    try {
      const response = await this.llmService.callLLM({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        routingPreference: 'local'
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        recommendations: parsed.recommendations || [],
        reasoning: parsed.reasoning || [],
        confidence: 0.8
      };
    } catch (error) {
      return {
        recommendations: fossils.slice(0, 3),
        reasoning: ['LLM analysis failed, using top fossils by relevance'],
        confidence: 0.5
      };
    }
  }

  private async analyzeGitContext(fossil: any): Promise<any> {
    try {
      const result = await executeCommand(
        `git log --since="${fossil.createdAt}" --until="${fossil.updatedAt}" --oneline`
      );
      
      return {
        commits: result.success ? result.stdout.split('\n').filter(line => line.trim()) : [],
        timeSpan: {
          start: fossil.createdAt,
          end: fossil.updatedAt
        }
      };
    } catch (error) {
      return { commits: [], timeSpan: { start: fossil.createdAt, end: fossil.updatedAt } };
    }
  }

  private async analyzeFossilContentWithLLM(fossil: any): Promise<any> {
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
      const response = await this.llmService.callLLM({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        routingPreference: 'local'
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      return {
        contentQuality: 5,
        completeness: 5,
        clarity: 5,
        relevance: 5,
        suggestions: ['LLM analysis failed']
      };
    }
  }

  private calculateQualityScore(
    fossil: any,
    gitContext: any,
    llmAnalysis: any,
    duplicates: any[],
    relatedFossils: any[]
  ): number {
    let score = 50; // Base score

    // LLM analysis contribution (40%)
    if (llmAnalysis.contentQuality) score += llmAnalysis.contentQuality * 0.4;
    if (llmAnalysis.completeness) score += llmAnalysis.completeness * 0.4;
    if (llmAnalysis.clarity) score += llmAnalysis.clarity * 0.4;
    if (llmAnalysis.relevance) score += llmAnalysis.relevance * 0.4;

    // Git context contribution (20%)
    if (gitContext.commits.length > 0) score += 10;
    if (gitContext.commits.length > 5) score += 10;

    // Duplicate detection penalty (20%)
    if (duplicates.length > 0) score -= duplicates.length * 5;

    // Related fossils bonus (20%)
    if (relatedFossils.length > 0) score += Math.min(relatedFossils.length * 2, 20);

    return Math.max(0, Math.min(100, score));
  }

  private identifyQualityIssues(fossil: any, qualityScore: number): string[] {
    const issues = [];

    if (qualityScore < 30) issues.push('Very low quality score');
    if (qualityScore < 50) issues.push('Below average quality');
    if (fossil.content.length < 50) issues.push('Content too short');
    if (fossil.tags.length === 0) issues.push('No tags assigned');
    if (!fossil.metadata) issues.push('No metadata');

    return issues;
  }

  private async generateImprovementSuggestions(
    fossil: any,
    qualityScore: number,
    gitContext: any,
    llmAnalysis: any
  ): Promise<string[]> {
    const suggestions = [];

    if (qualityScore < 50) {
      suggestions.push('Consider expanding content with more details');
      suggestions.push('Add more specific tags for better categorization');
    }

    if (llmAnalysis.suggestions) {
      suggestions.push(...llmAnalysis.suggestions);
    }

    if (gitContext.commits.length === 0) {
      suggestions.push('No recent git activity - consider updating fossil');
    }

    if (fossil.tags.length < 3) {
      suggestions.push('Add more tags for better discoverability');
    }

    return suggestions;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1,
          matrix[j - 1]![i]! + 1,
          matrix[j - 1]![i - 1]! + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - matrix[str2.length]![str1.length]!) / maxLength) * 100;
    return Math.round(similarity * 100) / 100;
  }
}

// Example usage
async function main() {
  const analyzer = new AdvancedFossilAnalyzer();
  await analyzer.initialize();

  console.log('🚀 Advanced Fossil Query Patterns Examples\n');

  // Example 1: Intelligent deduplication with git context
  console.log('=== Example 1: Intelligent Deduplication ===');
  const dedupResult = await analyzer.intelligentDeduplicationWithGitContext(
    'Database Migration Strategy',
    'We decided to migrate from MySQL to PostgreSQL for better performance and ACID compliance...',
    80
  );
  console.log('Deduplication result:', JSON.stringify(dedupResult, null, 2));

  // Example 2: Fossil evolution tracking
  console.log('\n=== Example 2: Fossil Evolution Tracking ===');
  const evolutionResult = await analyzer.trackFossilEvolutionWithLLMSnapshots(
    'fossil_example_id',
    {
      start: '2024-01-01T00:00:00Z',
      end: '2024-12-31T23:59:59Z'
    }
  );
  console.log('Evolution result:', JSON.stringify(evolutionResult, null, 2));

  // Example 3: Cross-repository analysis
  console.log('\n=== Example 3: Cross-Repository Analysis ===');
  const crossRepoResult = await analyzer.crossRepositoryFossilAnalysis(
    ['repo1', 'repo2', 'repo3'],
    'database migration'
  );
  console.log('Cross-repo result:', JSON.stringify(crossRepoResult, null, 2));

  // Example 4: Intelligent recommendations
  console.log('\n=== Example 4: Intelligent Recommendations ===');
  const recommendationsResult = await analyzer.generateIntelligentFossilRecommendations(
    'Need to implement database migration strategy for PostgreSQL',
    5
  );
  console.log('Recommendations result:', JSON.stringify(recommendationsResult, null, 2));

  // Example 5: Quality assessment
  console.log('\n=== Example 5: Quality Assessment ===');
  const qualityResult = await analyzer.assessFossilQuality('fossil_example_id');
  console.log('Quality assessment result:', JSON.stringify(qualityResult, null, 2));
}

if (import.meta.main) {
  main().catch(console.error);
} 