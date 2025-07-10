// Utilities for legacy issue migration
import { checklistToMarkdown, metadataToMarkdown } from './markdownChecklist';

export function parseLegacySections(body: string) {
  const purposeMatch = body.match(/### Purpose\n([\s\S]*?)(\n###|$)/);
  const checklistMatch = body.match(/### Checklist\n([\s\S]*?)(\n###|$)/);
  const metadataMatch = body.match(/### Automation Metadata\n([\s\S]*?)(\n###|$)/);
  // Fallback: try to find first paragraph as purpose
  const fallbackPurpose = body.split('\n').find(line => line.trim() && !line.startsWith('#')) || '';
  // Parse checklist items
  let checklist: {task: string, checked: boolean}[] = [];
  if (checklistMatch) {
    checklist = (checklistMatch[1] || '').split('\n').map(line => {
      const m = line.match(/- \[( |x|X)\] (.+)/);
      if (m && m[1] && m[2]) return { task: m[2].trim(), checked: m[1].toLowerCase() === 'x' };
      return null;
    }).filter(Boolean) as {task: string, checked: boolean}[];
  }
  // Parse metadata as key: value pairs
  let automationMetadata: Record<string, any> = {};
  if (metadataMatch) {
    (metadataMatch[1] || '').split('\n').forEach(line => {
      const m = line.match(/^([\w\s]+):\s*(.+)$/);
      if (m && m[1] && m[2]) automationMetadata[m[1].trim()] = m[2].trim();
    });
  }
  return {
    purpose: (purposeMatch && purposeMatch[1]?.trim()) || fallbackPurpose,
    checklist,
    automationMetadata
  };
}

export function buildModernBody(params: { title: string, purpose: string, checklist: {task: string, checked: boolean}[], automationMetadata: Record<string, any> }) {
  const { title, purpose, checklist, automationMetadata } = params;
  return [
    `# [GH] Issue: ${title}`,
    '',
    '## Purpose',
    purpose || '*No purpose provided*',
    '',
    '## Checklist',
    checklistToMarkdown(checklist),
    '',
    '## Automation Metadata',
    metadataToMarkdown(automationMetadata),
    '',
    '---',
    '',
    '```json',
    JSON.stringify({ purpose, checklist, automationMetadata }, null, 2),
    '```'
  ].join('\n');
} 