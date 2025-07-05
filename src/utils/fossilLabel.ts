import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import { CreateFossilLabelParamsSchema } from '../types';
import type { CreateFossilLabelParams } from '../types/cli';
import { GitHubCLICommands } from './githubCliCommands';
import { safeParseJSON } from './cli';

/**
 * Preferred utility for fossil-backed, deduplicated GitHub label creation.
 * Always use this instead of direct gh label create to ensure traceability and deduplication.
 */

/**
 * Create a GitHub label with fossil deduplication and metadata storage
 */
export async function createFossilLabel(params: CreateFossilLabelParams): Promise<{ fossilId: string; fossilHash: string; deduplicated: boolean }> {
  CreateFossilLabelParamsSchema.parse(params);
  const { fossilService, type, title, body, section, tags, metadata, issueNumber, parsedFields } = params;
  
  // Default values for missing properties
  const owner = 'automate-workloads';
  const repo = 'automate_workloads';
  const name = title;
  const description = body.substring(0, 100);
  const color = '0366d6'; // Default GitHub blue
  
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
  
  // Create label via GitHub CLI using centralized commands
  const commands = new GitHubCLICommands(owner, repo);
  const result = await commands.createLabel({
    name,
    description,
    color
  });
  
  if (!result.success) {
    throw new Error(`Failed to create GitHub label: ${result.message}`);
  }
  
  // Store fossil entry
  const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    type,
    title,
    content: body,
    tags: ['github', 'label', section, ...tags],
    source: 'automated',
    metadata: { ...metadata, color, owner, repo, name, description },
    version: 1,
    children: [],
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
export async function ensureLabel(params: { owner: string; repo: string; name: string; description?: string; color?: string }): Promise<{ created: boolean }> {
  const { owner, repo, name, description = 'Auto-created label', color = 'ededed' } = params;
  try {
    // Check if label exists using centralized commands
    const commands = new GitHubCLICommands(owner, repo);
    const listResult = await commands.listLabels();
    if (!listResult.success) {
      throw new Error(`Failed to list labels: ${listResult.message}`);
    }
    const labels = safeParseJSON<any[]>(listResult.stdout, 'label list');
    const existing = labels.find((l: any) => l.name === name);
    if (existing) {
      return { created: false };
    }
    // Create label
    const fossilService = new ContextFossilService();
    const result = await createFossilLabel({
      fossilService,
      type: 'action',
      title: name,
      body: description,
      section: 'labels',
      tags: ['automated'],
      metadata: { source: 'ensure-label', color, owner, repo },
      parsedFields: {}
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