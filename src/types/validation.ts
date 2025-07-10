// ============================================================================
// VALIDATION TYPE DEFINITIONS
// ============================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  critical: boolean;
  message: string;
  details?: any;
}

export interface ValidationResult {
  schema: string;
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  message: string;
  path?: string[];
}

export interface ValidationWarning {
  type: 'missing_tag' | 'unexpected_tag' | 'timeline_mismatch' | 'priority_mismatch';
  message: string;
  path?: string;
  suggestion?: string;
  expected?: any;
  actual?: any;
}

export interface ValidationSummary {
  totalTasks: number;
  tasksWithTags: number;
  tasksWithoutTags: number;
  averageTagsPerTask: number;
  timelineDays: number;
  riskCount: number;
  criticalTasks: number;
  highPriorityTasks: number;
}

export interface ValidationOptions {
  strictMode?: boolean; // If true, warnings become errors
  ignoreTimeline?: boolean; // Ignore timeline differences
  ignoreRisks?: boolean; // Ignore risk differences
  requiredTags?: string[]; // Tags that must be present
  forbiddenTags?: string[]; // Tags that should not be present
  minTasks?: number; // Minimum number of tasks required
  maxTasks?: number; // Maximum number of tasks allowed
  minTagsPerTask?: number; // Minimum tags per task
  maxTagsPerTask?: number; // Maximum tags per task
} 