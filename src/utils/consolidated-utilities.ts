/**
 * @fileoverview Consolidated Small Utilities
 * @description Automatically consolidated small utility functions
 * @generated 2025-07-06T02:52:44.893Z
 */

import fs from 'fs';
import yaml from 'js-yaml';

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

// From: src/utils/yamlToJson.ts
// Size: 365 characters

/**
 * Loads a YAML file and returns its JSON representation, optionally validating against a shared type.
 * @param yamlPath Path to the YAML file
 */
function yamlToJson<T>(yamlPath: string): T {
  const content = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(content);
  return data as T;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { yamlToJson };
