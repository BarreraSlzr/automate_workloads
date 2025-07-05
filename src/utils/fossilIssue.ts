import { execSync } from 'child_process';
import { ContextFossilService } from '../cli/context-fossil';
import type { ContextEntry } from '../types';
import * as fs from 'fs';
import { extractJsonBlock } from './markdownChecklist';
import type { CreateFossilIssueParams, CheckExistingFossilParams, CreateFossilEntryParams } from '../types/cli';
import { CreateFossilIssueParamsSchema, CheckExistingFossilParamsSchema, CreateFossilEntryParamsSchema } from '../types';
import { isTestMode } from '../cli/repo-orchestrator';
import { GitHubCLICommands } from './githubCliCommands';

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
async function ensureLabel(params: { owner: string; repo: string; label: string; options?: any }) {
  const { owner, repo, label, options } = params;
  if (isTestMode(options)) return;
  try {
    const commands = new GitHubCLICommands(owner, repo);
    
    // Check if label exists
    const listResult = await commands.listLabels();
    if (listResult.success) {
      const labels = JSON.parse(listResult.stdout);
      if (labels.some((l: any) => l.name === label)) {
        // Label exists, do nothing
        return;
      }
    }
    
    // Create label if it doesn't exist
    const createResult = await commands.createLabel({
      name: label,
      description: 'Auto-created section label',
      color: 'ededed'
    });
    
    if (createResult.success) {
      console.log(`🆕 Created label: ${label}`);
    } else if (createResult.message?.includes('already exists')) {
      // Label already exists, ignore
      return;
    } else {
      console.warn(`⚠️ Could not ensure label '${label}':`, createResult.message);
    }
  } catch (e: any) {
    console.warn(`⚠️ Could not ensure label '${label}':`, e && e.message ? e.message : e);
  }
}

/**
 * Generate a detailed issue body matching the automation_task.yml template.
 * Enhanced with visual elements for better human audit and understanding.
 */
function generateAutomationIssueBody({
  purpose,
  checklist,
  metadata,
  extra,
  visualContext,
}: {
  purpose: string;
  checklist?: string;
  metadata?: string;
  extra?: string;
  visualContext?: {
    workflow?: string[];
    dependencies?: string[];
    risks?: Array<{ risk: string; impact: string; mitigation: string }>;
  };
}): string {
  const sections = [
    '## 🤖 Automation Task',
    'This issue was created automatically by a script or bot to track automation-related work.',
    '',
    `### Purpose\n${purpose}`,
  ];

  // Add visual workflow if provided
  if (visualContext?.workflow) {
    sections.push(
      '\n### Workflow',
      '```mermaid',
      'graph TD',
      ...visualContext.workflow.map((step, i) => `    ${String.fromCharCode(65 + i)}[${step}]`),
      ...visualContext.workflow.map((_, i) => 
        i < visualContext.workflow!.length - 1 
          ? `    ${String.fromCharCode(65 + i)} --> ${String.fromCharCode(66 + i)}`
          : ''
      ).filter(Boolean),
      '```'
    );
  }

  // Add dependencies diagram if provided
  if (visualContext?.dependencies) {
    sections.push(
      '\n### Dependencies',
      '```mermaid',
      'graph LR',
      ...visualContext.dependencies.map((dep, i) => `    ${String.fromCharCode(65 + i)}[${dep}]`),
      ...visualContext.dependencies.map((_, i) => 
        i < visualContext.dependencies!.length - 1 
          ? `    ${String.fromCharCode(65 + i)} --> ${String.fromCharCode(66 + i)}`
          : ''
      ).filter(Boolean),
      '```'
    );
  }

  // Add risk assessment if provided
  if (visualContext?.risks) {
    sections.push(
      '\n### Risk Assessment',
      '```mermaid',
      'graph TD',
      ...visualContext.risks.map((risk, i) => [
        `    ${String.fromCharCode(65 + i)}[${risk.risk}]`,
        `    ${String.fromCharCode(65 + i)} --> ${String.fromCharCode(66 + i)}[Impact: ${risk.impact}]`,
        `    ${String.fromCharCode(66 + i)} --> ${String.fromCharCode(67 + i)}[Mitigation: ${risk.mitigation}]`
      ]).flat(),
      '```'
    );
  }

  sections.push(
    checklist ? `\n### Checklist\n${checklist}` : '',
    metadata ? `\n### Automation Metadata\n${metadata}` : '',
    extra ? `\n${extra}` : ''
  );

  return sections.filter(Boolean).join('\n');
}

/**
 * File operations for issue body management
 */
class IssueBodyFileManager {
  public static readonly TEMP_FILE = 'issue_body.md';
  
  /**
   * Write issue body to temporary file for GitHub CLI
   */
  static writeTempFile(body: string): void {
    fs.writeFileSync(this.TEMP_FILE, body);
  }
  
  /**
   * Clean up temporary file
   */
  static cleanupTempFile(): void {
    try {
      fs.unlinkSync(this.TEMP_FILE);
    } catch (cleanupError) {
      console.warn(`⚠️ Could not clean up temporary file ${this.TEMP_FILE}:`, cleanupError);
    }
  }
  
  /**
   * Save issue fossil to fossils/issues/<number>.md
   */
  static saveIssueFossil(issueNumber: string, body: string): void {
    try {
      const fossilsDir = 'fossils/issues';
      if (!fs.existsSync(fossilsDir)) {
        fs.mkdirSync(fossilsDir, { recursive: true });
      }
      const fossilPath = `${fossilsDir}/${issueNumber}.md`;
      fs.writeFileSync(fossilPath, body);
      console.log(`🗿 Issue fossil saved: ${fossilPath}`);
    } catch (fossilError) {
      console.warn(`⚠️ Could not save issue fossil:`, fossilError);
    }
  }
}

/**
 * GitHub CLI operations for issue creation
 */
class GitHubIssueManager {
  /**
   * Create GitHub issue using CLI
   */
  static async createIssue(params: {
    owner: string;
    repo: string;
    title: string;
    tempFile: string;
    labels: string[];
    milestone?: string;
  }): Promise<{ issueNumber?: string; output: string }> {
    const { owner, repo, title, tempFile, labels, milestone } = params;
    
    // Read the body from the temp file
    const body = fs.readFileSync(tempFile, 'utf8');
    
    const commands = new GitHubCLICommands(owner, repo);
    const result = await commands.createIssue({
      title,
      body,
      labels,
      milestone
    });
    
    let issueNumber = undefined;
    if (result.success && result.stdout) {
      const match = result.stdout.match(/#(\d+)/);
      if (match) issueNumber = match[1];
    }
    
    return { issueNumber, output: result.stdout || '' };
  }
  
  /**
   * Fetch issue body from GitHub
   */
  static async fetchIssueBody(params: { owner: string; repo: string; issueNumber: string }): Promise<string> {
    const { owner, repo, issueNumber } = params;
    try {
      const commands = new GitHubCLICommands(owner, repo);
      const result = await commands.executeCommand(`gh issue view ${issueNumber} --repo ${owner}/${repo} --json body -q ".body"`);
      return result.success ? result.stdout : '';
    } catch {
      return '';
    }
  }
}

/**
 * Fossil management operations
 */
class IssueFossilManager {
  /**
   * Check for existing fossil by content hash or similarity
   */
  static async checkExistingFossil(params: CheckExistingFossilParams): Promise<ContextEntry | null> {
    CheckExistingFossilParamsSchema.parse(params);
    
    const { fossilService, contentHash, title, content, type } = params;
    
    // First check for exact content hash match (fastest)
    if (contentHash) {
      const byHash = await fossilService.queryEntries({ search: contentHash, type, limit: 1, offset: 0 });
      if (byHash && byHash.length > 0 && byHash[0]) {
        return byHash[0];
      }
    }
    
    // Then check for similar fossils using the more sophisticated similarity algorithm
    // Note: We need to access the private method through a workaround since it's not public
    const similarFossils = await fossilService['findSimilarFossils'](title, content, 60);
    if (similarFossils.length > 0) {
      const mostSimilar = similarFossils[0]!;
      console.log(`🔍 Found similar fossil (${mostSimilar.similarity}% similarity): ${mostSimilar.fossil.id}`);
      return mostSimilar.fossil;
    }
    
    return null;
  }
  
  /**
   * Create fossil entry for the issue
   */
  static async createFossilEntry(params: CreateFossilEntryParams): Promise<ContextEntry> {
    CreateFossilEntryParamsSchema.parse(params);
    
    const { fossilService, type, title, body, section, tags, metadata, issueNumber, parsedFields } = params;
    
    const fossilEntry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      type,
      title,
      content: body,
      tags: ['github', 'issue', section, ...tags],
      source: 'automated',
      metadata: { ...metadata, ...parsedFields, issueNumber },
      version: 1,
      children: [],
    };
    
    return await fossilService.addEntry(fossilEntry);
  }
}

export async function createFossilIssue(params: CreateFossilIssueParams): Promise<{ issueNumber?: string; fossilId: string; fossilHash: string; deduplicated: boolean }> {
  if (isTestMode(params)) {
    console.log(`[MOCK] createFossilIssue: ${params.title}`);
    return { deduplicated: false, issueNumber: '1', fossilId: 'mock-fossil-id', fossilHash: 'mock-fossil-hash' };
  }
  
  CreateFossilIssueParamsSchema.parse(params);
  
  const { 
    body: issueBody, 
    title: issueTitle, 
    section: issueSection, 
    metadata: issueMetadata, 
    type: issueType, 
    tags: issueTags, 
    parsedFields: issueParsedFields, 
    fossilService: issueFossilService, 
    issueNumber: existingIssueNumber 
  } = params;
  
  // Default values for missing properties
  const owner = 'automate-workloads';
  const repo = 'automate_workloads';
  const labels = issueTags || [];
  const milestone = '';
  const purpose = 'issue-creation';
  const checklist: string[] = [];
  const automationMetadata: Record<string, any> = {};
  const extraBody = '';
  
  // Initialize fossil service
  const fossilService = new ContextFossilService();
  await fossilService.initialize();
  
  // Check for existing fossil
  const contentHash = typeof issueMetadata?.contentHash === 'string' ? issueMetadata.contentHash : undefined;
  const existingFossil = await IssueFossilManager.checkExistingFossil({
    fossilService,
    contentHash,
    title: issueTitle,
    content: issueBody || issueTitle,
    type: issueType,
  });
  
  if (existingFossil) {
    return { fossilId: existingFossil.id, fossilHash: contentHash || '', deduplicated: true };
  }
  
  // Generate issue body
  const detailedBody = generateAutomationIssueBody({
    purpose: purpose || issueBody || issueTitle,
    checklist: checklist.join('\n'),
    metadata: automationMetadata ? JSON.stringify(automationMetadata, null, 2) : undefined,
    extra: extraBody,
  });
  const bodyWithFossil = `${detailedBody}\n\n---\nFossil Content Hash: ${contentHash || ''}`;
  
  // Prepare labels
  let sectionLabel = '';
  if (typeof issueSection === 'string' && issueSection.trim().length > 0) {
    sectionLabel = toSectionLabel(issueSection);
    await ensureLabel({ owner, repo, label: sectionLabel, options: params });
  }
  const traceLabel = `${issueType}-${contentHash || ''}`;
  await ensureLabel({ owner, repo, label: traceLabel, options: params });
  const filteredLabels = labels.filter((l: string) => l && l !== issueSection);
  const validLabels = [...filteredLabels, sectionLabel, traceLabel].filter(Boolean);
  
  // Create issue using GitHub CLI
  IssueBodyFileManager.writeTempFile(bodyWithFossil);
  
  const { issueNumber, output } = await GitHubIssueManager.createIssue({
    owner,
    repo,
    title: issueTitle,
    tempFile: IssueBodyFileManager.TEMP_FILE,
    labels: validLabels,
    milestone,
  });
  
  // Clean up temp file
  IssueBodyFileManager.cleanupTempFile();
  
  // Save fossil copy if issue was created
  if (issueNumber) {
    IssueBodyFileManager.saveIssueFossil(issueNumber, bodyWithFossil);
  }
  
  // Fetch and parse issue metadata
  let parsedFields: Record<string, any> = {};
  if (issueNumber) {
    const ghBody = await GitHubIssueManager.fetchIssueBody({ owner, repo, issueNumber });
    const jsonBlock = extractJsonBlock(ghBody);
    if (jsonBlock) parsedFields = jsonBlock;
  }
  
  // Create fossil entry
  const fossil = await IssueFossilManager.createFossilEntry({
    fossilService,
    type: issueType,
    title: issueTitle,
    body: bodyWithFossil,
    section: issueSection,
    tags: issueTags,
    metadata: issueMetadata,
    issueNumber,
    parsedFields,
  });
  
  return { issueNumber, fossilId: fossil.id, fossilHash: contentHash || '', deduplicated: false };
} 