/**
 * Comprehensive checklist updater for markdown, JSON, and YAML files
 * @module utils/checklistUpdater
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { updateMarkdownChecklist, ChecklistUpdate } from './markdownChecklist';
import { E2ERoadmapTask, Status } from '../types';

/**
 * Checklist update operation types
 */
export type ChecklistItemUpdate = {
  /** Item identifier (task name, issue number, etc.) */
  id: string;
  /** New status/checked state */
  status: Status | boolean;
  /** Optional comment or context */
  comment?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
};

/**
 * File type detection
 */
export type FileType = 'markdown' | 'json' | 'yaml' | 'yml';

/**
 * Update result with statistics
 */
export interface UpdateResult {
  /** Whether the update was successful */
  success: boolean;
  /** Number of items updated */
  updatedCount: number;
  /** Number of items not found */
  notFoundCount: number;
  /** Error message if any */
  error?: string;
  /** Updated content */
  content?: string;
  /** Backup file path */
  backupPath?: string;
}

/**
 * Detect file type based on extension and content
 */
export function detectFileType(filePath: string): FileType {
  const ext = filePath.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      // Try to detect by content
      const content = fs.readFileSync(filePath, 'utf8').trim();
      if (content.startsWith('{') || content.startsWith('[')) {
        return 'json';
      } else if (content.startsWith('---') || content.includes(':')) {
        return 'yaml';
      } else {
        return 'markdown';
      }
  }
}

/**
 * Create backup of original file
 */
export function createBackup(filePath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Update markdown checklist
 */
export function updateMarkdownChecklistFile(
  filePath: string, 
  updates: ChecklistItemUpdate[]
): UpdateResult {
  try {
    const backupPath = createBackup(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Convert updates to markdown checklist format
    const checklistUpdates: ChecklistUpdate = {};
    updates.forEach(update => {
      checklistUpdates[update.id] = typeof update.status === 'boolean' 
        ? update.status 
        : update.status === 'done' || update.status === 'ready';
    });
    
    const updatedContent = updateMarkdownChecklist(content, checklistUpdates);
    fs.writeFileSync(filePath, updatedContent);
    
    // Count actual updates by comparing content
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const update of updates) {
      const expectedChecked = typeof update.status === 'boolean' 
        ? update.status 
        : update.status === 'done' || update.status === 'ready';
      
      const expectedMark = expectedChecked ? 'x' : ' ';
      const pattern = new RegExp(`^[ \\t]*[-*] \\[${expectedMark}\\] ${update.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
      
      if (pattern.test(updatedContent)) {
        updatedCount++;
      } else {
        notFoundCount++;
      }
    }
    
    return {
      success: true,
      updatedCount,
      notFoundCount,
      content: updatedContent,
      backupPath
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      notFoundCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Update JSON checklist/roadmap
 */
export function updateJsonChecklistFile(
  filePath: string, 
  updates: ChecklistItemUpdate[]
): UpdateResult {
  try {
    const backupPath = createBackup(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Handle different JSON structures
    if (data.tasks && Array.isArray(data.tasks)) {
      // Roadmap format
      updatedCount = updateRoadmapTasks(data.tasks, updates);
      notFoundCount = updates.length - updatedCount;
    } else if (Array.isArray(data)) {
      // Simple checklist array
      updatedCount = updateChecklistArray(data, updates);
      notFoundCount = updates.length - updatedCount;
    } else if (data.checklist && Array.isArray(data.checklist)) {
      // Issue format with checklist
      updatedCount = updateChecklistArray(data.checklist, updates);
      notFoundCount = updates.length - updatedCount;
    } else {
      throw new Error('Unsupported JSON structure');
    }
    
    const updatedContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, updatedContent);
    
    return {
      success: true,
      updatedCount,
      notFoundCount,
      content: updatedContent,
      backupPath
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      notFoundCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Update YAML checklist/roadmap
 */
export function updateYamlChecklistFile(
  filePath: string, 
  updates: ChecklistItemUpdate[]
): UpdateResult {
  try {
    const backupPath = createBackup(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as any;
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Handle different YAML structures
    if (data.tasks && Array.isArray(data.tasks)) {
      // Roadmap format
      updatedCount = updateRoadmapTasks(data.tasks, updates);
      notFoundCount = updates.length - updatedCount;
    } else if (Array.isArray(data)) {
      // Simple checklist array
      updatedCount = updateChecklistArray(data, updates);
      notFoundCount = updates.length - updatedCount;
    } else if (data.checklist && Array.isArray(data.checklist)) {
      // Issue format with checklist
      updatedCount = updateChecklistArray(data.checklist, updates);
      notFoundCount = updates.length - updatedCount;
    } else {
      throw new Error('Unsupported YAML structure');
    }
    
    const updatedContent = yaml.dump(data, { 
      indent: 2, 
      lineWidth: 120,
      noRefs: true 
    });
    fs.writeFileSync(filePath, updatedContent);
    
    return {
      success: true,
      updatedCount,
      notFoundCount,
      content: updatedContent,
      backupPath
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      notFoundCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Update roadmap tasks recursively
 */
function updateRoadmapTasks(tasks: E2ERoadmapTask[], updates: ChecklistItemUpdate[]): number {
  let updatedCount = 0;
  
  for (const task of tasks) {
    // Check if this task matches any update
    const update = updates.find(u => u.id === task.task);
    if (update) {
      task.status = typeof update.status === 'string' ? update.status : 
        (update.status ? 'done' : 'pending');
      
      if (update.comment) {
        task.context = update.comment;
      }
      
      if (update.metadata) {
        // Store metadata in context or create a custom field
        task.context = task.context ? `${task.context}\n\nMetadata: ${JSON.stringify(update.metadata)}` : JSON.stringify(update.metadata);
      }
      
      updatedCount++;
    }
    
    // Recursively update subtasks
    if (task.subtasks && Array.isArray(task.subtasks)) {
      updatedCount += updateRoadmapTasks(task.subtasks, updates);
    }
  }
  
  return updatedCount;
}

/**
 * Update simple checklist array
 */
function updateChecklistArray(
  checklist: Array<{ task: string; checked?: boolean; status?: string }>, 
  updates: ChecklistItemUpdate[]
): number {
  let updatedCount = 0;
  
  for (const item of checklist) {
    const update = updates.find(u => u.id === item.task);
    if (update) {
      if (typeof update.status === 'boolean') {
        item.checked = update.status;
      } else {
        item.status = update.status;
        item.checked = update.status === 'done' || update.status === 'ready';
      }
      updatedCount++;
    }
  }
  
  return updatedCount;
}

/**
 * Main function to update any checklist file
 */
export function updateChecklistFile(
  filePath: string, 
  updates: ChecklistItemUpdate[]
): UpdateResult {
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      updatedCount: 0,
      notFoundCount: 0,
      error: `File not found: ${filePath}`
    };
  }
  
  const fileType = detectFileType(filePath);
  
  switch (fileType) {
    case 'markdown':
      return updateMarkdownChecklistFile(filePath, updates);
    case 'json':
      return updateJsonChecklistFile(filePath, updates);
    case 'yaml':
    case 'yml':
      return updateYamlChecklistFile(filePath, updates);
    default:
      return {
        success: false,
        updatedCount: 0,
        notFoundCount: 0,
        error: `Unsupported file type: ${fileType}`
      };
  }
}

/**
 * Batch update multiple files
 */
export function updateMultipleChecklistFiles(
  files: Array<{ path: string; updates: ChecklistItemUpdate[] }>
): Array<{ filePath: string; result: UpdateResult }> {
  return files.map(({ path, updates }) => ({
    filePath: path,
    result: updateChecklistFile(path, updates)
  }));
}

/**
 * Parse checklist updates from command line arguments
 */
export function parseChecklistUpdates(updatesString: string): ChecklistItemUpdate[] {
  try {
    const parsed = JSON.parse(updatesString);
    
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        id: item.id || item.task || item.name,
        status: item.status || item.checked || false,
        comment: item.comment || item.context,
        metadata: item.metadata
      }));
    } else if (typeof parsed === 'object') {
      // Convert simple object format
      return Object.entries(parsed).map(([id, value]) => ({
        id,
        status: typeof value === 'boolean' ? value : (value as Status),
        comment: undefined,
        metadata: undefined
      }));
    }
    
    throw new Error('Invalid updates format');
  } catch (error) {
    throw new Error(`Failed to parse updates: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate summary report of updates
 */
export function generateUpdateReport(results: Array<{ filePath: string; result: UpdateResult }>): string {
  const totalFiles = results.length;
  const successfulFiles = results.filter(r => r.result.success).length;
  const totalUpdated = results.reduce((sum, r) => sum + r.result.updatedCount, 0);
  const totalNotFound = results.reduce((sum, r) => sum + r.result.notFoundCount, 0);
  
  const report = [
    `# Checklist Update Report`,
    '',
    `## Summary`,
    `- Files processed: ${totalFiles}`,
    `- Files updated successfully: ${successfulFiles}`,
    `- Total items updated: ${totalUpdated}`,
    `- Total items not found: ${totalNotFound}`,
    '',
    `## Details`,
    ''
  ];
  
  results.forEach(({ filePath, result }) => {
    report.push(`### ${filePath}`);
    if (result.success) {
      report.push(`- ✅ Updated ${result.updatedCount} items`);
      if (result.notFoundCount > 0) {
        report.push(`- ⚠️  ${result.notFoundCount} items not found`);
      }
      if (result.backupPath) {
        report.push(`- 💾 Backup created: ${result.backupPath}`);
      }
    } else {
      report.push(`- ❌ Error: ${result.error}`);
    }
    report.push('');
  });
  
  return report.join('\n');
} 