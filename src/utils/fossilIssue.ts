import { execSync } from 'child_process';
import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import * as fs from 'fs';
import { extractJsonBlock } from './markdownChecklist';

/**
 * Preferred utility for fossil-backed, deduplicated GitHub issue creation.
 * Always use this instead of direct gh issue create to ensure traceability and deduplication.
 */

/**
 * Sanitize a section name to a valid GitHub label (prefix with 'section:')
 */
function toSectionLabel(section: string): string {
  if (!section) return '';
  // Replace spaces with dashes, remove invalid chars
  let sanitized = section.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
  // Add prefix, then truncate to 50 chars (GitHub max)
  let label = `section:${sanitized}`;
  if (label.length > 50) label = label.slice(0, 50);
  return label;
}

/**
 * Ensure a label exists in the repo, create if missing
 */
function ensureLabel(owner: string, repo: string, label: string) {
  try {
    const out = execSync(`gh label list --repo ${owner}/${repo} --json name`, { encoding: 'utf8' });
    const arr = JSON.parse(out);
    if (arr.some((l: any) => l.name === label)) {
      // Label exists, do nothing
      return;
    }
    execSync(`gh label create "${label}" --repo ${owner}/${repo} --color "ededed" --description "Auto-created section label"`, { encoding: 'utf8' });
    console.log(`🆕 Created label: ${label}`);
  } catch (e: any) {
    if (e.message && e.message.includes('already exists')) {
      // Label already exists, ignore
      return;
    }
    console.warn(`⚠️ Could not ensure label '${label}':`, e && e.message ? e.message : e);
  }
}

/**
 * Generate a detailed issue body matching the automation_task.yml template.
 */
function generateAutomationIssueBody({
  purpose,
  checklist,
  metadata,
  extra,
}: {
  purpose: string;
  checklist?: string;
  metadata?: string;
  extra?: string;
}): string {
  return [
    '## Automation Task',
    'This issue was created automatically by a script or bot to track automation-related work.',
    '',
    `### Purpose\n${purpose}`,
    checklist ? `\n### Checklist\n${checklist}` : '',
    metadata ? `\n### Automation Metadata\n${metadata}` : '',
    extra ? `\n${extra}` : '',
  ].filter(Boolean).join('\n');
}

export async function createFossilIssue({
  owner,
  repo,
  title,
  body,
  labels = [],
  milestone = '',
  section = '',
  type = 'action',
  tags = [],
  metadata = {},
  purpose,
  checklist,
  automationMetadata,
  extraBody,
}: {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  section?: string;
  type?: ContextEntry['type'];
  tags?: string[];
  metadata?: Record<string, unknown>;
  purpose?: string;
  checklist?: string;
  automationMetadata?: string;
  extraBody?: string;
}): Promise<{ issueNumber?: string; fossilId: string; fossilHash: string; deduplicated: boolean }> {
  const fossilService = new ContextFossilService();
  await fossilService.initialize();
  // Check for existing fossil by content hash or title
  const contentHash = typeof metadata?.contentHash === 'string' ? metadata.contentHash : undefined;
  let existingFossil: ContextEntry | null = null;
  if (contentHash) {
    const byHash = await fossilService.queryEntries({ search: contentHash, type, limit: 1, offset: 0 });
    if (byHash && byHash.length > 0 && byHash[0]) {
      existingFossil = byHash[0];
    } else {
      existingFossil = null;
    }
  }
  if (!existingFossil) {
    const byTitle = await fossilService.queryEntries({ search: title, type, limit: 1, offset: 0 });
    if (byTitle && byTitle.length > 0 && byTitle[0]) {
      existingFossil = byTitle[0];
    } else {
      existingFossil = null;
    }
  }
  if (existingFossil) {
    return { fossilId: existingFossil.id, fossilHash: contentHash || '', deduplicated: true };
  }
  // Compose detailed body using template-aligned helper
  const detailedBody = generateAutomationIssueBody({
    purpose: purpose || body || title,
    checklist,
    metadata: automationMetadata || (metadata ? JSON.stringify(metadata, null, 2) : undefined),
    extra: extraBody,
  });
  const bodyWithFossil = `${detailedBody}\n\n---\nFossil Content Hash: ${contentHash || ''}`;
  const tempFile = `.temp-issue-body-${Date.now()}.md`;
  fs.writeFileSync(tempFile, bodyWithFossil);
  let sectionLabel = '';
  if (typeof section === 'string' && section.trim().length > 0) {
    sectionLabel = toSectionLabel(section);
    ensureLabel(owner, repo, sectionLabel);
  }
  const traceLabel = `${type}-${contentHash || ''}`;
  ensureLabel(owner, repo, traceLabel);
  const filteredLabels = labels.filter(l => l && l !== section);
  const validLabels = [...filteredLabels, sectionLabel, traceLabel].filter(Boolean);
  let createCmd = `gh issue create --repo ${owner}/${repo} --title "${title}" --body-file "${tempFile}"`;
  if (validLabels.length > 0) createCmd += ` --label "${validLabels.join(',')}"`;
  if (milestone) createCmd += ` --milestone "${milestone}"`;
  const createOut = execSync(createCmd, { encoding: 'utf8' });
  fs.unlinkSync(tempFile);
  let issueNumber = undefined;
  if (createOut) {
    const match = createOut.match(/#(\d+)/);
    if (match) issueNumber = match[1];
  }
  // After creation, fetch the issue body and parse JSON block for metadata
  let parsedFields = {};
  if (issueNumber) {
    try {
      const ghBody = execSync(`gh issue view ${issueNumber} --repo ${owner}/${repo} --json body -q ".body"`).toString();
      const jsonBlock = extractJsonBlock(ghBody);
      if (jsonBlock) parsedFields = jsonBlock;
    } catch {}
  }
  // Store parsed fields in fossil metadata
  const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    type,
    title,
    content: bodyWithFossil,
    tags: ['github', 'issue', section, ...tags],
    source: 'automated',
    metadata: { ...metadata, ...parsedFields, issueNumber },
    version: 1,
    children: [],
  };
  const fossil = await fossilService.addEntry(fossilEntry);
  return { issueNumber, fossilId: fossil.id, fossilHash: contentHash || '', deduplicated: false };
} 