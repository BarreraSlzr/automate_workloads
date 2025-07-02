import { execSync } from 'child_process';
import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import { CreateFossilLabelParamsSchema } from '../types';
import type { CreateFossilLabelParams } from '../types/cli';

/**
 * Preferred utility for fossil-backed, deduplicated GitHub label creation.
 * Always use this instead of direct gh label create to ensure traceability and deduplication.
 */

/**
 * Create a GitHub label with fossil deduplication and metadata storage
 */
export async function createFossilLabel(params: CreateFossilLabelParams): Promise<{ fossilId: string; fossilHash: string; deduplicated: boolean }> {
  CreateFossilLabelParamsSchema.parse(params);
  const {
    owner,
    repo,
    name,
    description,
    color,
    type = 'label',
    tags = [],
    metadata = {}
  } = params;
  
  const fossilService = new ContextFossilService();
  await fossilService.initialize();
  
  // Check for existing fossil by name
  const existingFossil = await fossilService.queryEntries({ 
    search: name, type: 'action', limit: 1, offset: 0 
  });
  
  if (existingFossil && existingFossil.length > 0 && existingFossil[0]) {
    return { 
      fossilId: existingFossil[0].id, 
      fossilHash: '', 
      deduplicated: true 
    };
  }
  
  // Create label via GitHub CLI
  const command = `gh label create "${name}" --repo ${owner}/${repo} --color "${color}" --description "${description}"`;
  execSync(command, { encoding: 'utf8' });
  
  // Store fossil entry
  const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    type: 'action',
    title: name,
    content: description,
    tags: ['github', 'label', ...tags],
    source: 'automated',
    metadata: { ...metadata, color },
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
 * Ensure a label exists in the repo, create if missing
 */
export async function ensureLabel(
  owner: string, 
  repo: string, 
  name: string, 
  description: string = 'Auto-created label',
  color: string = 'ededed'
): Promise<{ created: boolean }> {
  try {
    // Check if label exists
    const listCommand = `gh label list --repo ${owner}/${repo} --json name`;
    const labels = JSON.parse(execSync(listCommand, { encoding: 'utf8' }));
    const existing = labels.find((l: any) => l.name === name);
    
    if (existing) {
      return { created: false };
    }
    
    // Create label
    const result = await createFossilLabel({
      owner,
      repo,
      name,
      description,
      color,
      tags: ['automated'],
      metadata: { source: 'ensure-label' }
    });
    
    return { created: !result.deduplicated };
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      // Label already exists, ignore
      return { created: false };
    }
    console.warn(`⚠️ Could not ensure label '${name}':`, error?.message || error);
    return { created: false };
  }
} 