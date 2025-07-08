// ============================================================================
// FOSSIL AUDIT TYPE DEFINITIONS
// ============================================================================
// Centralized type definitions for fossil audit functionality

import { z } from 'zod';
import { BaseFossil } from './core';

// ============================================================================
// FOSSIL AUDIT SCHEMAS
// ============================================================================

export const FossilAuditArgsSchema = z.object({
  analyzeTimestamps: z.boolean().default(true),
  checkDeduplication: z.boolean().default(true),
  auditState: z.boolean().default(true),
  monitorBunTest: z.boolean().default(false),
  outputFormat: z.enum(['json', 'markdown', 'table']).default('markdown'),
  verbose: z.boolean().default(false),
  createFossil: z.boolean().default(true),
  fossilTags: z.array(z.string()).default(['audit', 'fossil-analysis']),
  fossilDescription: z.string().optional()
});

export const FossilAuditFossilSchema = z.object({
  type: z.literal('fossil_audit_fossil'),
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  fossilId: z.string(),
  fossilHash: z.string(),
  auditResults: z.object({
    totalFiles: z.number(),
    totalSize: z.number(),
    directories: z.record(z.object({
      count: z.number(),
      size: z.number(),
      patterns: z.array(z.string())
    })),
    timestampPatterns: z.array(z.object({
      pattern: z.string(),
      count: z.number(),
      directories: z.array(z.string()),
      examples: z.array(z.string())
    })),
    duplicates: z.array(z.object({
      hash: z.string(),
      count: z.number(),
      totalSize: z.number(),
      recommendations: z.array(z.string())
    })),
    recentActivity: z.array(z.object({
      filename: z.string(),
      directory: z.string(),
      size: z.number(),
      timestamp: z.string().nullable()
    })),
    recommendations: z.array(z.string())
  }),
  bunTestResults: z.object({
    sessionId: z.string(),
    fossilsCreated: z.number(),
    fossilsDeleted: z.number(),
    patterns: z.array(z.string()),
    performance: z.object({
      peakCreationRate: z.number(),
      memoryUsage: z.number()
    })
  }).optional(),
  metadata: z.object({
    auditDuration: z.number(),
    scanDirectories: z.array(z.string()),
    duplicateGroupsFound: z.number(),
    largeDirectories: z.array(z.string())
  }),
  tags: z.array(z.string()),
  description: z.string()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FossilAuditArgs = z.infer<typeof FossilAuditArgsSchema>;
export type FossilAuditFossil = z.infer<typeof FossilAuditFossilSchema> & BaseFossil; 