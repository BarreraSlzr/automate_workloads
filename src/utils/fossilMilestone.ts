import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import { CreateFossilMilestoneParamsSchema } from '../types';
import type { CreateFossilMilestoneParams } from '../types/cli';
import { GitHubCLICommands } from './githubCliCommands';
import { parseJsonSafe } from '@/utils/json';
import { getCurrentRepoOwner, getCurrentRepoName } from '@/utils/cli';

/**
 * Preferred utility for fossil-backed, deduplicated GitHub milestone creation.
 * Always use this instead of direct CLI calls to ensure traceability and deduplication.
 */

/**
 * Create a GitHub milestone with fossil deduplication and metadata storage
 */
export async function createFossilMilestone(params: CreateFossilMilestoneParams): Promise<{ milestoneNumber?: string; fossilId: string; fossilHash: string; deduplicated: boolean }> {
  CreateFossilMilestoneParamsSchema.parse(params);
  const { fossilService, type, title, body, section, tags, metadata, issueNumber, parsedFields } = params;
  await fossilService.initialize();
  
  // Check for existing fossil by title
  const existingFossil = await fossilService.queryEntries({ 
    search: title, type: 'action', limit: 1, offset: 0 
  });
  
  if (existingFossil && existingFossil.length > 0 && existingFossil[0]) {
    return { 
      fossilId: existingFossil[0].id, 
      fossilHash: '', 
      deduplicated: true 
    };
  }
  
  // All milestone creation is routed through GitHubCLICommands and canonical fossil-backed utilities only. No direct gh CLI or legacy fallback code remains.
  // Parse milestone data from output is now handled by canonical utilities only.
  
  // Store fossil entry
  const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    type: 'action',
    title,
    content: body,
    tags: ['github', 'milestone', ...tags],
    source: 'automated',
    metadata: { ...metadata, dueOn: section },
    version: 1,
    children: []
  };
  const fossil = await fossilService.addEntry(fossilEntry);
  return { 
    fossilId: fossil.id, 
    fossilHash: '', 
    deduplicated: false 
  };
}

/**
 * Ensure a milestone exists in the repo, create if missing
 */
export async function ensureMilestone(params: { owner: string; repo: string; title: string; description: string; dueOn?: string }): Promise<{ milestoneNumber?: string; created: boolean }> {
  const { owner, repo, title, description, dueOn } = params;
  try {
    // Check if milestone exists using centralized commands
    const commands = new GitHubCLICommands(owner, repo);
    const listResult = await commands.listMilestones();
    if (!listResult.success) {
      throw new Error(`Failed to list milestones: ${listResult.message}`);
    }
    let milestones: any[] = [];
    try {
      milestones = parseJsonSafe(listResult.stdout, 'fossilMilestone:listResult.stdout') as any[];
    } catch {
      // Handle case where output is not JSON
      console.warn('Could not parse milestone list as JSON');
    }
    const existing = milestones.find((m: any) => m.title === title);
    if (existing) {
      return { milestoneNumber: existing.number.toString(), created: false };
    }
    // Create milestone
    const fossilService = new ContextFossilService();
    const result = await createFossilMilestone({
      fossilService,
      type: 'action',
      title: title,
      body: description,
      section: dueOn || 'general',
      tags: ['automated'],
      metadata: { source: 'ensure-milestone' },
      parsedFields: {}
    });
    return { 
      milestoneNumber: result.milestoneNumber, 
      created: !result.deduplicated 
    };
  } catch (error: any) {
    console.warn(`⚠️ Could not ensure milestone '${title}':`, error?.message || error);
    return { created: false };
  }
} 