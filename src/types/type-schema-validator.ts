/**
 * Canonical types for type and schema validator utility
 * @module types/type-schema-validator
 */

/**
 * Type schema validator configuration
 */
export interface TypeSchemaValidatorConfig {
  strict: boolean;
  verbose: boolean;
}

/**
 * Type schema validator result structure
 */
export interface TypeSchemaValidatorResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalSchemas: number;
    validatedSchemas: number;
    failedSchemas: number;
    totalPatterns: number;
    compliantPatterns: number;
    nonCompliantPatterns: number;
    paramsObjectPatternStrict?: number;
    asyncErrorHandling?: number;
    progressLogging?: number;
  };
}

/**
 * Individual schema validation result
 */
export interface SchemaValidationResult {
  schemaName: string;
  success: boolean;
  errors: string[];
  testCases: number;
  passedTests: number;
}

/**
 * Pattern validation result structure
 */
export interface PatternValidationResult {
  patternName: string;
  compliant: boolean;
  violations: string[];
  files: string[];
}

/**
 * Pattern validation result with count fields for strict checks
 */
export interface PatternValidationResultWithCount extends PatternValidationResult {
  total: number;
  compliantCount: number;
}

/**
 * Canonical type for schema test cases
 */
export interface SchemaTestCase {
  name: string;
  data: any;
  shouldPass: boolean;
}

/**
 * Canonical type for the schema registry
 */
export type SchemaRegistry = Record<string, import('zod').ZodSchema>;

/**
 * Canonical type for schema test data
 */
export type SchemaTestData = any; 