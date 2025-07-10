/**
 * Canonical types for checklist updater utility
 * @module types/checklist-updater
 */

import type { Status } from './core';

/**
 * Supported file types for checklist updates
 */
export type FileType = 'markdown' | 'json' | 'yaml' | 'yml';

/**
 * Checklist item update structure
 */
export interface ChecklistItemUpdate {
  id: string;
  status: boolean | Status;
  comment?: string;
  metadata?: any;
}

/**
 * Result of a checklist update operation
 */
export interface UpdateResult {
  success: boolean;
  updatedCount: number;
  notFoundCount: number;
  content?: string;
  backupPath?: string;
  error?: string;
} 