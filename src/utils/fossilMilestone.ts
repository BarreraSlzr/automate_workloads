import { execSync } from 'child_process';
import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';

/**
 * Preferred utility for fossil-backed, deduplicated GitHub milestone creation.
 * Always use this instead of direct gh milestone create to ensure traceability and deduplication.
 */

/**
 * Create a GitHub milestone with fossil deduplication and metadata storage
 */
export async function createFossilMilestone({
  owner,
  repo,
  title,
  description,
  dueOn,
  type = 'milestone',
  tags = [],
  metadata = {}
}: {
  owner: string;
  repo: string;
  title: string;
  description: string;
  dueOn?: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<{ milestoneNumber?: string; fossilId: string; fossilHash: string; deduplicated: boolean }> {
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
  
  // Create milestone via GitHub API
  let command = `gh api repos/${owner}/${repo}/milestones --method POST --field title="${title}" --field description="${description}"`;
  if (dueOn) {
    command += ` --field due_on="${new Date(dueOn).toISOString()}"`;
  }
  
  const result = execSync(command, { encoding: 'utf8' });
  const milestoneData = JSON.parse(result);
  const milestoneNumber = milestoneData.number?.toString();
  
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
    // Check if milestone exists
    const listCommand = `gh api repos/${owner}/${repo}/milestones --field state=open`;
    const milestones = JSON.parse(execSync(listCommand, { encoding: 'utf8' }));
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