import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import { CreateFossilMilestoneParamsSchema } from '../types';
import type { CreateFossilMilestoneParams } from '../types/cli';
import { GitHubCLICommands } from './githubCliCommands';

/**
 * Preferred utility for fossil-backed, deduplicated GitHub milestone creation.
 * Always use this instead of direct gh milestone create to ensure traceability and deduplication.
 */

/**
 * Create a GitHub milestone with fossil deduplication and metadata storage
 */
export async function createFossilMilestone(params: CreateFossilMilestoneParams): Promise<{ milestoneNumber?: string; fossilId: string; fossilHash: string; deduplicated: boolean }> {
  CreateFossilMilestoneParamsSchema.parse(params);
  const {
    owner,
    repo,
    title,
    description,
    dueOn,
    type = 'milestone',
    tags = [],
    metadata = {}
  } = params;
  const fossilService = new ContextFossilService();
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
  
  // Create milestone via GitHub CLI using centralized commands
  const commands = new GitHubCLICommands(owner, repo);
  const result = await commands.createMilestone({
    title,
    description,
    dueOn
  });
  
  if (!result.success) {
    throw new Error(`Failed to create GitHub milestone: ${result.message}`);
  }
  
  // Parse milestone data from output
  let milestoneNumber: string | undefined;
  try {
    const milestoneData = JSON.parse(result.stdout);
    milestoneNumber = milestoneData.number?.toString();
  } catch {
    // Fallback: try to extract from stdout if JSON parsing fails
    const match = result.stdout.match(/Milestone #(\d+)/);
    milestoneNumber = match ? match[1] : undefined;
  }
  
  // Store fossil entry
  const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    type: 'action',
    title,
    content: description,
    tags: ['github', 'milestone', ...tags],
    source: 'automated',
    metadata: { ...metadata, milestoneNumber, dueOn },
    version: 1,
    children: []
  };
  
  const fossil = await fossilService.addEntry(fossilEntry);
  return { 
    milestoneNumber, 
    fossilId: fossil.id, 
    fossilHash: '', 
    deduplicated: false 
  };
}

/**
 * Ensure a milestone exists in the repo, create if missing
 */
export async function ensureMilestone(
  owner: string, 
  repo: string, 
  title: string, 
  description: string, 
  dueOn?: string
): Promise<{ milestoneNumber?: string; created: boolean }> {
  try {
    // Check if milestone exists using centralized commands
    const commands = new GitHubCLICommands(owner, repo);
    const listResult = await commands.listMilestones();
    
    if (!listResult.success) {
      throw new Error(`Failed to list milestones: ${listResult.message}`);
    }
    
    let milestones: any[] = [];
    try {
      milestones = JSON.parse(listResult.stdout);
    } catch {
      // Handle case where output is not JSON
      console.warn('Could not parse milestone list as JSON');
    }
    
    const existing = milestones.find((m: any) => m.title === title);
    
    if (existing) {
      return { milestoneNumber: existing.number.toString(), created: false };
    }
    
    // Create milestone
    const result = await createFossilMilestone({
      owner,
      repo,
      title,
      description,
      dueOn,
      tags: ['automated'],
      metadata: { source: 'ensure-milestone' }
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