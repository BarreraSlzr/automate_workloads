#!/usr/bin/env bun

/**
 * Git Diff Fossil Analyzer
 * 
 * Analyzes git diff for fossil references and creates transversal insights
 * for retrospective analysis and traceability across commits.
 * 
 * This enables:
 * - Cross-commit fossil reference tracking
 * - Transversal insights over time
 * - ML-ready analysis patterns
 * - Human-LLM chat context generation
 * 
 * Usage:
 *   bun run src/cli/git-diff-fossil-analyzer.ts --analyze --fossilize
 *   bun run src/cli/git-diff-fossil-analyzer.ts --retrospective --since 2025-01-01
 *   bun run src/cli/git-diff-fossil-analyzer.ts --insights --commit HEAD~5..HEAD
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { parseCLIArgs } from '../types/cli';
import { 
  GitDiffAnalyzerArgsSchema,
  GitDiffFossilDataSchema 
} from '../types/schemas';


// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Schemas are imported from ../types/schemas

// ============================================================================
// TYPES
// ============================================================================

type GitDiffAnalyzerArgs = z.infer<typeof GitDiffAnalyzerArgsSchema>;
type GitDiffFossilData = z.infer<typeof GitDiffFossilDataSchema>;

// ============================================================================
// MAIN CLASS
// ============================================================================

class GitDiffFossilAnalyzer {
  private args: GitDiffAnalyzerArgs;
  private fossilPatterns = [
    /fossils\/[^\/]+\.(json|yml|md)$/,
    /fossils\/[^\/]+\/[^\/]+\.(json|yml|md)$/,
    /fossils\/[^\/]+\/[^\/]+\/[^\/]+\.(json|yml|md)$/
  ];

  constructor(args: GitDiffAnalyzerArgs) {
    this.args = args;
  }

  async run(): Promise<void> {
    if (this.args.analyze) {
      await this.analyzeCurrentDiff();
    } else if (this.args.retrospective) {
      await this.analyzeRetrospective();
    } else if (this.args.insights) {
      await this.generateInsights();
    } else if (this.args.generateYaml) {
      await this.generateYamlContext();
    } else {
      console.log('❌ No action specified. Use --analyze, --retrospective, --insights, or --generateYaml');
      process.exit(1);
    }
  }

  private async analyzeCurrentDiff(): Promise<void> {
    console.log('🔍 Analyzing current git diff for fossil references...');
    
    const diffData = await this.getCurrentDiff();
    const fossilInsights = await this.extractFossilInsights(diffData);
    const transversalPatterns = await this.identifyTransversalPatterns(diffData);
    
    const analysis: GitDiffFossilData = {
      commitHash: this.getCurrentCommitHash(),
      timestamp: new Date().toISOString(),
      filesChanged: diffData.filesChanged,
      fossilInsights,
      transversalPatterns
    };

    this.displayAnalysis(analysis);

    if (this.args.fossilize) {
      await this.fossilizeAnalysis(analysis);
    }
  }

  private async analyzeRetrospective(): Promise<void> {
    console.log('📚 Analyzing retrospective fossil patterns...');
    
    const since = this.args.since || '2025-01-01';
    const commits = await this.getCommitsSince(since);
    const patterns = await this.analyzeCommitPatterns(commits);
    
    console.log(`📊 Found ${patterns.length} transversal patterns across ${commits.length} commits`);
    
    for (const pattern of patterns.slice(0, 10)) {
      console.log(`  🔗 ${pattern.pattern} (${pattern.frequency} occurrences, value: ${pattern.value.toFixed(2)})`);
    }
  }

  private async generateInsights(): Promise<void> {
    console.log('🧠 Generating transversal insights...');
    
    const commitRange = this.args.commit || 'HEAD~5..HEAD';
    const insights = await this.generateTransversalInsights(commitRange);
    
    console.log('💡 Transversal Insights:');
    for (const insight of insights) {
      console.log(`  ${insight.type}: ${insight.description}`);
      console.log(`    Value: ${insight.value.toFixed(2)}, Impact: ${insight.impact}`);
    }
  }

  private async getCurrentDiff(): Promise<any> {
    try {
      const diffOutput = execSync('git diff --cached --name-status', { encoding: 'utf8' });
      const filesChanged = diffOutput.trim().split('\n').filter(Boolean).map(line => {
        const [status, filePath] = line.split('\t');
        if (!filePath) return null;
        
        const additions = this.getFileAdditions(filePath);
        const deletions = this.getFileDeletions(filePath);
        
        return {
          path: filePath,
          status: this.normalizeStatus(status || ''),
          additions,
          deletions,
          fossilReferences: this.extractFossilReferences(filePath)
        };
      }).filter(Boolean);

      return { filesChanged };
    } catch (error) {
      console.warn('⚠️ No staged changes found');
      return { filesChanged: [] };
    }
  }

  private async extractFossilInsights(diffData: any): Promise<any[]> {
    const insights: any[] = [];
    
    for (const file of diffData.filesChanged) {
      if (this.isFossilFile(file.path)) {
        const insight = await this.analyzeFossilFile(file);
        insights.push(insight);
      }
    }

    // Cross-reference with existing fossils
    const crossReferences = await this.findCrossReferences(diffData.filesChanged);
    insights.push(...crossReferences);

    return insights;
  }

  private async identifyTransversalPatterns(diffData: any): Promise<any[]> {
    const patterns: any[] = [];
    
    // Pattern 1: Fossil creation patterns
    const fossilCreations = diffData.filesChanged.filter((f: any) => 
      f.status === 'added' && this.isFossilFile(f.path)
    );
    
    if (fossilCreations.length > 0) {
      patterns.push({
        pattern: 'fossil_creation',
        frequency: fossilCreations.length,
        value: 0.8,
        recommendations: [
          'Consider consolidating related fossils',
          'Verify fossil follows canonical structure',
          'Update fossil reference documentation'
        ]
      });
    }

    // Pattern 2: Fossil modification patterns
    const fossilModifications = diffData.filesChanged.filter((f: any) => 
      f.status === 'modified' && this.isFossilFile(f.path)
    );
    
    if (fossilModifications.length > 0) {
      patterns.push({
        pattern: 'fossil_modification',
        frequency: fossilModifications.length,
        value: 0.6,
        recommendations: [
          'Track fossil evolution over time',
          'Maintain fossil version history',
          'Update related fossil references'
        ]
      });
    }

    // Pattern 3: Code-fossil relationship patterns
    const codeFossilRelations = this.analyzeCodeFossilRelations(diffData.filesChanged);
    if (codeFossilRelations.length > 0) {
      patterns.push({
        pattern: 'code_fossil_relationship',
        frequency: codeFossilRelations.length,
        value: 0.9,
        recommendations: [
          'Maintain bidirectional traceability',
          'Update fossil references in code',
          'Validate fossil-code consistency'
        ]
      });
    }

    return patterns;
  }

  private async analyzeFossilFile(file: any): Promise<any> {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      const fossilData = JSON.parse(content);
      
      return {
        fossilPath: file.path,
        referenceType: 'direct',
        impact: this.assessImpact(file.path, fossilData),
        context: this.extractContext(fossilData),
        transversalValue: this.calculateTransversalValue(fossilData)
      };
    } catch (error) {
      return {
        fossilPath: file.path,
        referenceType: 'direct',
        impact: 'low',
        context: 'Error reading fossil file',
        transversalValue: 0.1
      };
    }
  }

  private async findCrossReferences(filesChanged: any[]): Promise<any[]> {
    const crossReferences: any[] = [];
    
    // Find fossils that reference changed files
    const fossilFiles = await this.getAllFossilFiles();
    
    for (const fossilFile of fossilFiles) {
      try {
        const content = await fs.readFile(fossilFile, 'utf8');
        const fossilData = JSON.parse(content);
        
        const references = this.findFileReferences(fossilData, filesChanged);
        if (references.length > 0) {
          crossReferences.push({
            fossilPath: fossilFile,
            referenceType: 'indirect',
            impact: 'medium',
            context: `References ${references.length} changed files`,
            transversalValue: 0.5
          });
        }
      } catch (error) {
        // Skip invalid fossils
      }
    }

    return crossReferences;
  }

  private async getAllFossilFiles(): Promise<string[]> {
    const fossilFiles: string[] = [];
    
    try {
      const findOutput = execSync('find fossils/ -name "*.json" -o -name "*.yml" -o -name "*.md"', { encoding: 'utf8' });
      return findOutput.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  private findFileReferences(fossilData: any, filesChanged: any[]): string[] {
    const references: string[] = [];
    const fossilStr = JSON.stringify(fossilData).toLowerCase();
    
    for (const file of filesChanged) {
      const fileName = path.basename(file.path);
      if (fossilStr.includes(fileName.toLowerCase())) {
        references.push(file.path);
      }
    }
    
    return references;
  }

  private analyzeCodeFossilRelations(filesChanged: any[]): any[] {
    const relations: any[] = [];
    
    const codeFiles = filesChanged.filter(f => 
      f.path.endsWith('.ts') || f.path.endsWith('.js') || f.path.endsWith('.sh')
    );
    
    const fossilFiles = filesChanged.filter(f => this.isFossilFile(f.path));
    
    for (const codeFile of codeFiles) {
      for (const fossilFile of fossilFiles) {
        relations.push({
          codeFile: codeFile.path,
          fossilFile: fossilFile.path,
          relationship: 'code_fossil_pair'
        });
      }
    }
    
    return relations;
  }

  private isFossilFile(filePath: string): boolean {
    return this.fossilPatterns.some(pattern => pattern.test(filePath));
  }

  private extractFossilReferences(filePath: string): string[] {
    // Extract fossil references from file path or content
    const references: string[] = [];
    
    if (this.isFossilFile(filePath)) {
      references.push(filePath);
    }
    
    return references;
  }

  private normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'A': 'added',
      'M': 'modified',
      'D': 'deleted',
      'R': 'renamed'
    };
    return statusMap[status] || status;
  }

  private getFileAdditions(filePath: string): number {
    try {
      const diffOutput = execSync(`git diff --cached --numstat ${filePath}`, { encoding: 'utf8' });
      const [additions] = diffOutput.trim().split('\t');
      return parseInt(additions || '0') || 0;
    } catch {
      return 0;
    }
  }

  private getFileDeletions(filePath: string): number {
    try {
      const diffOutput = execSync(`git diff --cached --numstat ${filePath}`, { encoding: 'utf8' });
      const [, deletions] = diffOutput.trim().split('\t');
      return parseInt(deletions || '0') || 0;
    } catch {
      return 0;
    }
  }

  private assessImpact(filePath: string, fossilData: any): 'low' | 'medium' | 'high' {
    // Assess impact based on fossil type and content
    if (filePath.includes('canonical') || filePath.includes('roadmap')) {
      return 'high';
    }
    if (filePath.includes('analysis') || filePath.includes('audit')) {
      return 'medium';
    }
    return 'low';
  }

  private extractContext(fossilData: any): string {
    // Extract meaningful context from fossil data
    if (fossilData.content?.tasks) {
      return `Contains ${fossilData.content.tasks.length} tasks`;
    }
    if (fossilData.type) {
      return `Type: ${fossilData.type}`;
    }
    return 'Standard fossil';
  }

  private calculateTransversalValue(fossilData: any): number {
    // Calculate transversal value based on fossil characteristics
    let value = 0.5; // Base value
    
    if (fossilData.content?.tasks) {
      value += 0.2; // Has structured content
    }
    if (fossilData.type === 'canonical') {
      value += 0.3; // Canonical fossils have high value
    }
    if (fossilData.tags?.length > 0) {
      value += 0.1; // Has tags for categorization
    }
    
    return Math.min(value, 1.0);
  }

  private async getCommitsSince(since: string): Promise<any[]> {
    try {
      const logOutput = execSync(`git log --since="${since}" --pretty=format:"%H|%an|%ad|%s"`, { encoding: 'utf8' });
      return logOutput.trim().split('\n').filter(Boolean).map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });
    } catch {
      return [];
    }
  }

  private async analyzeCommitPatterns(commits: any[]): Promise<any[]> {
    const patterns: any[] = [];
    
    // Analyze fossil-related commits
    const fossilCommits = commits.filter(c => 
      c.message.toLowerCase().includes('fossil') ||
      c.message.toLowerCase().includes('canonical') ||
      c.message.toLowerCase().includes('roadmap')
    );
    
    if (fossilCommits.length > 0) {
      patterns.push({
        pattern: 'fossil_commit_pattern',
        frequency: fossilCommits.length,
        value: 0.8,
        recommendations: [
          'Track fossil evolution patterns',
          'Maintain fossil commit history',
          'Analyze fossil growth trends'
        ]
      });
    }
    
    return patterns;
  }

  private async generateTransversalInsights(commitRange: string): Promise<any[]> {
    const insights: any[] = [];
    
    try {
      const diffOutput = execSync(`git diff ${commitRange} --name-only`, { encoding: 'utf8' });
      const files = diffOutput.trim().split('\n').filter(Boolean);
      
      const fossilFiles = files.filter(f => this.isFossilFile(f));
      const codeFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      
      if (fossilFiles.length > 0) {
        insights.push({
          type: 'fossil_evolution',
          description: `Fossil evolution across ${fossilFiles.length} files`,
          value: 0.8,
          impact: 'high'
        });
      }
      
      if (codeFiles.length > 0 && fossilFiles.length > 0) {
        insights.push({
          type: 'code_fossil_sync',
          description: 'Code and fossil synchronization patterns',
          value: 0.9,
          impact: 'high'
        });
      }
      
    } catch (error) {
      console.warn('⚠️ Could not analyze commit range');
    }
    
    return insights;
  }

  private displayAnalysis(analysis: GitDiffFossilData): void {
    console.log('\n📊 Git Diff Fossil Analysis:');
    console.log('='.repeat(50));
    console.log(`🔗 Commit: ${analysis.commitHash}`);
    console.log(`📅 Timestamp: ${analysis.timestamp}`);
    console.log(`📁 Files Changed: ${analysis.filesChanged.length}`);
    
    if (analysis.fossilInsights.length > 0) {
      console.log('\n🦴 Fossil Insights:');
      for (const insight of analysis.fossilInsights) {
        console.log(`  ${insight.fossilPath} (${insight.impact} impact, value: ${insight.transversalValue.toFixed(2)})`);
      }
    }
    
    if (analysis.transversalPatterns.length > 0) {
      console.log('\n🔗 Transversal Patterns:');
      for (const pattern of analysis.transversalPatterns) {
        console.log(`  ${pattern.pattern} (${pattern.frequency} occurrences, value: ${pattern.value.toFixed(2)})`);
      }
    }
  }

  private async fossilizeAnalysis(analysis: GitDiffFossilData): Promise<void> {
    try {
      // Use canonical fossil manager instead of direct file creation
      const { CanonicalFossilManager } = await import('@/cli/canonical-fossil-manager');
      
      const fossilManager = new CanonicalFossilManager();
      await fossilManager.updateGitDiffAnalysis(analysis, { generateYaml: true });
      
      console.log(`💾 Analysis fossilized using canonical fossil manager`);
    } catch (error) {
      console.warn('⚠️  Failed to fossilize analysis using canonical manager, falling back to direct save:', error);
      
      // Fallback to canonical save if canonical manager fails
      const fossilPath = `fossils/analysis/analysis.json`;
      
      const fossil = {
        type: 'git_diff_analysis',
        timestamp: new Date().toISOString(),
        commitHash: analysis.commitHash,
        analysis,
        metadata: {
          generatedBy: 'git-diff-fossil-analyzer',
          fossilized: true,
          canonical: true, // Make it canonical
          version: '1.0.0',
          transversalValue: analysis.fossilInsights.reduce((sum, i) => sum + i.transversalValue, 0) / Math.max(analysis.fossilInsights.length, 1)
        }
      };
      
      await fs.mkdir(path.dirname(fossilPath), { recursive: true });
      await fs.writeFile(fossilPath, JSON.stringify(fossil, null, 2));
      
      console.log(`💾 Analysis fossilized to canonical location: ${fossilPath}`);
    }
  }

  private async generateYamlContext(): Promise<void> {
    console.log('📄 Generating YAML context for human-LLM chat and ML processes...');
    
    const diffData = await this.getCurrentDiff();
    const fossilInsights = await this.extractFossilInsights(diffData);
    const transversalPatterns = await this.identifyTransversalPatterns(diffData);
    
    // Generate human-LLM context
    const humanLLMContext = this.generateHumanLLMContext(diffData, fossilInsights, transversalPatterns);
    
    const analysis: GitDiffFossilData = {
      commitHash: this.getCurrentCommitHash(),
      timestamp: new Date().toISOString(),
      filesChanged: diffData.filesChanged,
      fossilInsights,
      transversalPatterns,
      humanLLMContext
    };

    // Generate YAML output
    const yamlOutput = this.generateYamlOutput(analysis);
    
    // Use canonical filename instead of timestamped filename
    const outputPath = this.args.yamlOutput || `fossils/context/canonical-context.yml`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, yamlOutput, 'utf8');
    
    console.log(`📄 Canonical YAML context generated: ${outputPath}`);
    this.displayYamlSummary(analysis);
  }

  private generateHumanLLMContext(diffData: any, fossilInsights: any[], transversalPatterns: any[]): any {
    const summary = this.generateSummary(diffData);
    const keyChanges = this.extractKeyChanges(diffData);
    const fossilImpact = this.assessFossilImpact(fossilInsights);
    const transversalInsights = this.generateTransversalInsightsList(transversalPatterns);
    const mlReadyData = this.generateMLReadyData(diffData, fossilInsights, transversalPatterns);

    return {
      summary,
      keyChanges,
      fossilImpact,
      transversalInsights,
      mlReadyData
    };
  }

  private generateSummary(diffData: any): string {
    const totalFiles = diffData.filesChanged.length;
    const fossilFiles = diffData.filesChanged.filter((f: any) => this.isFossilFile(f.path)).length;
    const codeFiles = diffData.filesChanged.filter((f: any) => 
      f.path.endsWith('.ts') || f.path.endsWith('.js') || f.path.endsWith('.sh')
    ).length;

    return `Commit analysis: ${totalFiles} files changed (${fossilFiles} fossils, ${codeFiles} code files)`;
  }

  private extractKeyChanges(diffData: any): string[] {
    const changes: string[] = [];
    
    for (const file of diffData.filesChanged.slice(0, 5)) {
      const changeType = file.status === 'added' ? 'Added' : 
                        file.status === 'modified' ? 'Modified' : 
                        file.status === 'deleted' ? 'Deleted' : 'Renamed';
      changes.push(`${changeType}: ${file.path} (+${file.additions}/-${file.deletions})`);
    }
    
    return changes;
  }

  private assessFossilImpact(fossilInsights: any[]): string {
    if (fossilInsights.length === 0) return 'No fossil impact detected';
    
    const highImpact = fossilInsights.filter(i => i.impact === 'high').length;
    const mediumImpact = fossilInsights.filter(i => i.impact === 'medium').length;
    
    if (highImpact > 0) return `High fossil impact: ${highImpact} high-impact changes`;
    if (mediumImpact > 0) return `Medium fossil impact: ${mediumImpact} medium-impact changes`;
    return 'Low fossil impact detected';
  }

  private generateTransversalInsightsList(transversalPatterns: any[]): string[] {
    return transversalPatterns.map(pattern => 
      `${pattern.pattern}: ${pattern.frequency} occurrences (value: ${pattern.value.toFixed(2)})`
    );
  }

  private generateMLReadyData(diffData: any, fossilInsights: any[], transversalPatterns: any[]): any {
    const patterns = transversalPatterns.map(p => p.pattern);
    const recommendations = transversalPatterns.flatMap(p => p.recommendations);
    const nextActions = this.generateNextActions(diffData, fossilInsights);

    return {
      patterns,
      recommendations,
      nextActions
    };
  }

  private generateNextActions(diffData: any, fossilInsights: any[]): string[] {
    const actions: string[] = [];
    
    if (fossilInsights.length > 0) {
      actions.push('Review fossil changes for consistency');
      actions.push('Update related fossil references');
    }
    
    if (diffData.filesChanged.some((f: any) => f.path.includes('test'))) {
      actions.push('Run affected test suites');
    }
    
    if (diffData.filesChanged.some((f: any) => f.path.includes('docs'))) {
      actions.push('Update documentation references');
    }
    
    return actions;
  }

  private generateYamlOutput(analysis: GitDiffFossilData): string {
    const yamlData = {
      commit_analysis: {
        commit_hash: analysis.commitHash,
        timestamp: analysis.timestamp,
        summary: analysis.humanLLMContext?.summary,
        key_changes: analysis.humanLLMContext?.keyChanges,
        fossil_impact: analysis.humanLLMContext?.fossilImpact,
        transversal_insights: analysis.humanLLMContext?.transversalInsights,
        ml_ready_data: analysis.humanLLMContext?.mlReadyData
      },
      files_changed: analysis.filesChanged.map(f => ({
        path: f.path,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        fossil_references: f.fossilReferences
      })),
      fossil_insights: analysis.fossilInsights.map(i => ({
        fossil_path: i.fossilPath,
        reference_type: i.referenceType,
        impact: i.impact,
        context: i.context,
        transversal_value: i.transversalValue
      })),
      transversal_patterns: analysis.transversalPatterns.map(p => ({
        pattern: p.pattern,
        frequency: p.frequency,
        value: p.value,
        recommendations: p.recommendations
      })),
      metadata: {
        generated_by: 'git-diff-fossil-analyzer',
        version: '1.0.0',
        purpose: 'human-llm-chat-context-and-ml-processes'
      }
    };

    // Simple YAML generation (you might want to use a proper YAML library)
    return this.objectToYaml(yamlData);
  }

  private objectToYaml(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${key.replace(/_/g, ' ')}:\n`;
            yaml += this.objectToYaml(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  private displayYamlSummary(analysis: GitDiffFossilData): void {
    console.log('\n📊 YAML Context Summary:');
    console.log('='.repeat(50));
    console.log(`🔗 Commit: ${analysis.commitHash}`);
    console.log(`📝 Summary: ${analysis.humanLLMContext?.summary}`);
    console.log(`🦴 Fossil Impact: ${analysis.humanLLMContext?.fossilImpact}`);
    console.log(`🔗 Transversal Patterns: ${analysis.transversalPatterns.length}`);
    console.log(`🤖 ML Ready Patterns: ${analysis.humanLLMContext?.mlReadyData.patterns.length}`);
  }

  private getCurrentCommitHash(): string {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, any> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg && arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        parsedArgs[key] = value;
        i++;
      } else {
        parsedArgs[key] = true;
      }
    }
  }
  
  try {
    const validatedArgs = GitDiffAnalyzerArgsSchema.parse(parsedArgs);
    const analyzer = new GitDiffFossilAnalyzer(validatedArgs);
    await analyzer.run();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 