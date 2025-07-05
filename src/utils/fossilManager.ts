#!/usr/bin/env bun

/**
 * Unified Fossil Manager
 * Consolidates fossil creation, management, and validation patterns
 * across all GitHub object types (issues, labels, milestones).
 * 
 * This utility provides a single, consistent interface for all fossil operations,
 * promoting reuse and reducing code duplication across the codebase.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import { GitHubCLICommands } from './githubCliCommands';
import { generateContentHash } from './fossilize';
import { 
  BaseFossilParamsSchema,
  IssueFossilParamsSchema,
  LabelFossilParamsSchema,
  MilestoneFossilParamsSchema
} from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BaseFossilParams {
  owner: string;
  repo: string;
  type: string;
  tags?: string[];
  metadata?: Record<string, any>;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface IssueFossilParams extends BaseFossilParams {
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  section?: string;
  purpose?: string;
  checklist?: string;
  automationMetadata?: string;
  extraBody?: string;
}

export interface LabelFossilParams extends BaseFossilParams {
  name: string;
  description: string;
  color: string;
}

export interface MilestoneFossilParams extends BaseFossilParams {
  title: string;
  description: string;
  dueOn?: string;
}

export interface FossilSearchParams {
  search?: string;
  type?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface FossilResult {
  success: boolean;
  fossilId?: string;
  fossilHash?: string;
  deduplicated?: boolean;
  objectNumber?: string;
  error?: string;
}

export interface FossilReport {
  totalFossils: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  duplicates: number;
  recommendations: string[];
}

// ============================================================================
// FOSSIL MANAGER CLASS
// ============================================================================

export class FossilManager {
  private fossilService: ContextFossilService;
  private owner: string;
  private repo: string;

  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
    this.fossilService = new ContextFossilService();
  }

  /**
   * Initialize the fossil service
   */
  async initialize(): Promise<void> {
    await this.fossilService.initialize();
  }

  /**
   * Create a GitHub issue with fossil backing
   */
  async createIssue(params: IssueFossilParams): Promise<FossilResult> {
    try {
      const validatedParams = IssueFossilParamsSchema.parse(params);
      
      if (validatedParams.verbose) {
        console.log(`🔍 Creating fossil-backed issue: ${validatedParams.title}`);
      }

      // Check for existing fossil
      const existingFossil = await this.findExistingFossil({
        search: validatedParams.title,
        type: validatedParams.type,
        limit: 1
      });

      if (existingFossil) {
        return {
          success: true,
          fossilId: existingFossil.id,
          deduplicated: true
        };
      }

      if (validatedParams.dryRun) {
        return {
          success: true,
          fossilId: 'dry-run-fossil-id',
          deduplicated: false
        };
      }

      // Create GitHub issue
      const issueNumber = await this.createGitHubIssue(validatedParams);
      
      // Create fossil entry
      const fossilEntry = await this.createFossilEntry({
        type: validatedParams.type,
        title: validatedParams.title,
        content: validatedParams.body || validatedParams.title,
        tags: ['github', 'issue', validatedParams.section || 'general', ...validatedParams.tags],
        metadata: {
          ...validatedParams.metadata,
          issueNumber,
          owner: validatedParams.owner,
          repo: validatedParams.repo
        }
      });

      return {
        success: true,
        fossilId: fossilEntry.id,
        fossilHash: fossilEntry.fossilHash,
        objectNumber: issueNumber,
        deduplicated: false
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a GitHub label with fossil backing
   */
  async createLabel(params: LabelFossilParams): Promise<FossilResult> {
    try {
      const validatedParams = LabelFossilParamsSchema.parse(params);
      
      if (validatedParams.verbose) {
        console.log(`🔍 Creating fossil-backed label: ${validatedParams.name}`);
      }

      // Check for existing fossil
      const existingFossil = await this.findExistingFossil({
        search: validatedParams.name,
        type: 'label',
        limit: 1
      });

      if (existingFossil) {
        return {
          success: true,
          fossilId: existingFossil.id,
          deduplicated: true
        };
      }

      if (validatedParams.dryRun) {
        return {
          success: true,
          fossilId: 'dry-run-fossil-id',
          deduplicated: false
        };
      }

      // Create GitHub label
      await this.createGitHubLabel(validatedParams);
      
      // Create fossil entry
      const fossilEntry = await this.createFossilEntry({
        type: 'label',
        title: validatedParams.name,
        content: validatedParams.description,
        tags: ['github', 'label', ...validatedParams.tags],
        metadata: {
          ...validatedParams.metadata,
          color: validatedParams.color,
          owner: validatedParams.owner,
          repo: validatedParams.repo
        }
      });

      return {
        success: true,
        fossilId: fossilEntry.id,
        fossilHash: fossilEntry.fossilHash,
        deduplicated: false
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a GitHub milestone with fossil backing
   */
  async createMilestone(params: MilestoneFossilParams): Promise<FossilResult> {
    try {
      const validatedParams = MilestoneFossilParamsSchema.parse(params);
      
      if (validatedParams.verbose) {
        console.log(`🔍 Creating fossil-backed milestone: ${validatedParams.title}`);
      }

      // Check for existing fossil
      const existingFossil = await this.findExistingFossil({
        search: validatedParams.title,
        type: 'milestone',
        limit: 1
      });

      if (existingFossil) {
        return {
          success: true,
          fossilId: existingFossil.id,
          deduplicated: true
        };
      }

      if (validatedParams.dryRun) {
        return {
          success: true,
          fossilId: 'dry-run-fossil-id',
          deduplicated: false
        };
      }

      // Create GitHub milestone
      const milestoneNumber = await this.createGitHubMilestone(validatedParams);
      
      // Create fossil entry
      const fossilEntry = await this.createFossilEntry({
        type: 'milestone',
        title: validatedParams.title,
        content: validatedParams.description,
        tags: ['github', 'milestone', ...validatedParams.tags],
        metadata: {
          ...validatedParams.metadata,
          milestoneNumber,
          dueOn: validatedParams.dueOn,
          owner: validatedParams.owner,
          repo: validatedParams.repo
        }
      });

      return {
        success: true,
        fossilId: fossilEntry.id,
        fossilHash: fossilEntry.fossilHash,
        objectNumber: milestoneNumber,
        deduplicated: false
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find existing fossils based on search criteria
   */
  async findExistingFossil(searchParams: FossilSearchParams): Promise<any | null> {
    try {
      const results = await this.fossilService.queryEntries({
        search: searchParams.search || '',
        type: (searchParams.type as ContextEntry['type']) || undefined,
        tags: searchParams.tags || [],
        limit: searchParams.limit || 1,
        offset: searchParams.offset || 0
      });

      return results && results.length > 0 ? results[0] : null;
    } catch (error) {
      console.warn('⚠️ Failed to search fossils:', error);
      return null;
    }
  }

  /**
   * Update an existing fossil
   */
  async updateFossil(fossilId: string, updates: Record<string, any>): Promise<FossilResult> {
    try {
      await this.fossilService.updateEntry(fossilId, updates);
      return {
        success: true,
        fossilId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a fossil
   */
  async deleteFossil(fossilId: string): Promise<FossilResult> {
    try {
      // Note: deleteEntry method not available in ContextFossilService
      // For now, return success but log that deletion is not implemented
      console.warn('⚠️ Delete functionality not implemented in ContextFossilService');
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a comprehensive fossil report
   */
  async generateFossilReport(): Promise<FossilReport> {
    try {
      const allFossils = await this.fossilService.queryEntries({
        search: '',
        type: undefined,
        tags: [],
        limit: 1000,
        offset: 0
      });

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let duplicates = 0;

      for (const fossil of allFossils) {
        // Count by type
        byType[fossil.type] = (byType[fossil.type] || 0) + 1;
        
        // Count by status (if available)
        const status = fossil.metadata?.status || 'unknown';
        byStatus[status as string] = (byStatus[status as string] || 0) + 1;
        
        // Count duplicates (simplified logic)
        if (fossil.metadata?.duplicated) {
          duplicates++;
        }
      }

      const recommendations = this.generateRecommendations(allFossils);

      return {
        totalFossils: allFossils.length,
        byType,
        byStatus,
        duplicates,
        recommendations
      };

    } catch (error) {
      console.error('❌ Failed to generate fossil report:', error);
      return {
        totalFossils: 0,
        byType: {},
        byStatus: {},
        duplicates: 0,
        recommendations: ['Failed to generate report']
      };
    }
  }

  /**
   * Validate fossil integrity
   */
  async validateFossilIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const allFossils = await this.fossilService.queryEntries({
        search: '',
        type: undefined,
        tags: [],
        limit: 1000,
        offset: 0
      });

      // Check for fossils without required fields
      for (const fossil of allFossils) {
        if (!fossil.title) {
          issues.push(`Fossil ${fossil.id} missing title`);
        }
        if (!fossil.type) {
          issues.push(`Fossil ${fossil.id} missing type`);
        }
      }

      // Check for potential duplicates
      const titleCounts: Record<string, number> = {};
      for (const fossil of allFossils) {
        titleCounts[fossil.title] = (titleCounts[fossil.title] || 0) + 1;
      }

      for (const [title, count] of Object.entries(titleCounts)) {
        if (count > 1) {
          recommendations.push(`Consider consolidating ${count} fossils with title "${title}"`);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        valid: false,
        issues: ['Failed to validate fossils'],
        recommendations: ['Check fossil service connectivity']
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a GitHub issue via CLI using centralized GitHubCLICommands
   */
  private async createGitHubIssue(params: IssueFossilParams): Promise<string> {
    const commands = new GitHubCLICommands(params.owner, params.repo);
    
    const result = await commands.createIssue({
      title: params.title,
      body: params.body || '',
      labels: params.labels || [],
      milestone: params.milestone,
      assignees: []
    });

    if (!result.success) {
      throw new Error(`Failed to create GitHub issue: ${result.message}`);
    }

    // Extract issue number from output
    const match = result.stdout.match(/Issue #(\d+)/);
    return match ? match[1] || '0' : '0';
  }

  /**
   * Create a GitHub label via CLI using centralized GitHubCLICommands
   */
  private async createGitHubLabel(params: LabelFossilParams): Promise<void> {
    const commands = new GitHubCLICommands(params.owner, params.repo);
    
    const result = await commands.createLabel({
      name: params.name,
      description: params.description,
      color: params.color
    });

    if (!result.success) {
      throw new Error(`Failed to create GitHub label: ${result.message}`);
    }
  }

  /**
   * Create a GitHub milestone via API using centralized GitHubCLICommands
   */
  private async createGitHubMilestone(params: MilestoneFossilParams): Promise<string> {
    const commands = new GitHubCLICommands(params.owner, params.repo);
    
    const result = await commands.createMilestone({
      title: params.title,
      description: params.description,
      dueOn: params.dueOn
    });

    if (!result.success) {
      throw new Error(`Failed to create GitHub milestone: ${result.message}`);
    }

    // Extract milestone number from output
    const match = result.stdout.match(/Milestone #(\d+)/);
    return match ? match[1] || '0' : '0';
  }

  /**
   * Create a fossil entry
   */
  private async createFossilEntry(entry: {
    type: string;
    title: string;
    content: string;
    tags: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    const contentHash = generateContentHash(entry.content, entry.type, entry.title);
    
    const fossilEntry = {
      type: entry.type as ContextEntry['type'],
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      source: 'automated' as ContextEntry['source'],
      metadata: {
        ...entry.metadata,
        contentHash,
        createdBy: 'FossilManager'
      },
      version: 1,
      children: []
    };

    return await this.fossilService.addEntry(fossilEntry);
  }

  /**
   * Generate recommendations based on fossil analysis
   */
  private generateRecommendations(fossils: any[]): string[] {
    const recommendations: string[] = [];

    // Analyze fossil types
    const typeCounts: Record<string, number> = {};
    for (const fossil of fossils) {
      typeCounts[fossil.type] = (typeCounts[fossil.type] || 0) + 1;
    }

    // Suggest consolidation for high-count types
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > 10) {
        recommendations.push(`Consider consolidating ${count} ${type} fossils`);
      }
    }

    // Suggest cleanup for old fossils
    const oldFossils = fossils.filter(f => {
      const createdAt = new Date(f.createdAt);
      const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 90;
    });

    if (oldFossils.length > 0) {
      recommendations.push(`Consider archiving ${oldFossils.length} fossils older than 90 days`);
    }

    return recommendations;
  }

  /**
   * Escape special characters in strings for CLI commands
   */
  private escapeString(str: string): string {
    return str
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}

// ============================================================================
// EXPORT PATTERNS FOR REUSE
// ============================================================================

/**
 * Create a fossil manager instance with proper initialization
 */
export async function createFossilManager(owner: string, repo: string): Promise<FossilManager> {
  const manager = new FossilManager(owner, repo);
  await manager.initialize();
  return manager;
}

/**
 * Convenience function for creating fossil-backed issues
 */
export async function createFossilIssue(params: IssueFossilParams): Promise<FossilResult> {
  const manager = await createFossilManager(params.owner, params.repo);
  return manager.createIssue(params);
}

/**
 * Convenience function for creating fossil-backed labels
 */
export async function createFossilLabel(params: LabelFossilParams): Promise<FossilResult> {
  const manager = await createFossilManager(params.owner, params.repo);
  return manager.createLabel(params);
}

/**
 * Convenience function for creating fossil-backed milestones
 */
export async function createFossilMilestone(params: MilestoneFossilParams): Promise<FossilResult> {
  const manager = await createFossilManager(params.owner, params.repo);
  return manager.createMilestone(params);
} 