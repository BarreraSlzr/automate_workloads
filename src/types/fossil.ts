import { z } from 'zod';
import {
  BaseFossilParamsSchema,
  IssueFossilParamsSchema,
  LabelFossilParamsSchema,
  MilestoneFossilParamsSchema,
} from './schemas';

// ============================================================================
// FOSSIL TYPE DEFINITIONS
// ============================================================================

export interface BaseFossilParams {
  owner: string;
  repo: string;
  type: string;
  tags?: string[];
  metadata?: Record<string, any>;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface IssueFossilParams extends BaseFossilParams {
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  section?: string;
  purpose?: string;
  checklist?: string;
  automationMetadata?: string;
  extraBody?: string;
}

export interface LabelFossilParams extends BaseFossilParams {
  name: string;
  description: string;
  color: string;
}

export interface MilestoneFossilParams extends BaseFossilParams {
  title: string;
  description: string;
  dueOn?: string;
}

export interface FossilSearchParams {
  search?: string;
  type?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface FossilResult {
  success: boolean;
  fossilId?: string;
  fossilHash?: string;
  deduplicated?: boolean;
  objectNumber?: string;
  error?: string;
}

export interface FossilReport {
  totalFossils: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  duplicates: number;
  recommendations: string[];
}

// ============================================================================
// FOSSIL ZOD SCHEMAS (imported from schemas.ts)
// ============================================================================

// Re-export schemas from the central registry
export {
  BaseFossilParamsSchema,
  IssueFossilParamsSchema,
  LabelFossilParamsSchema,
  MilestoneFossilParamsSchema,
};

export const FossilSearchParamsSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const FossilResultSchema = z.object({
  success: z.boolean(),
  fossilId: z.string().optional(),
  fossilHash: z.string().optional(),
  deduplicated: z.boolean().optional(),
  objectNumber: z.string().optional(),
  error: z.string().optional(),
});

export const FossilReportSchema = z.object({
  totalFossils: z.number(),
  byType: z.record(z.number()),
  byStatus: z.record(z.number()),
  duplicates: z.number(),
  recommendations: z.array(z.string()),
}); 