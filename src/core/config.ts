/**
 * Core configuration management for the automation ecosystem
 * @module core/config
 */

import { z } from "zod";
import type { EnvironmentConfig } from "../types";

/**
 * Environment variable validation schema using Zod
 * All tokens are optional since we prefer CLI tools when available
 */
export const envSchema = z.object({
  /** GitHub personal access token (optional - uses gh CLI by default) */
  githubToken: z.string().optional(),
  /** Gmail API OAuth token */
  gmailToken: z.string().optional(),
  /** Buffer API access token */
  bufferToken: z.string().optional(),
  /** Twitter API v2 bearer token */
  twitterToken: z.string().optional(),
  /** OpenAI API key */
  openaiApiKey: z.string().optional(),
});

/**
 * Loads and validates environment configuration
 * Attempts to load from Raycast preferences first, falls back to process.env for CLI usage
 * 
 * @returns {EnvironmentConfig} Validated environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 * 
 * @example
 * ```typescript
 * const config = getEnv();
 * console.log(config.twitterToken); // Twitter bearer token
 * ```
 */
export function getEnv(): EnvironmentConfig {
  let raw: Record<string, any> = {};
  
  try {
    // Try to load from Raycast environment (for Raycast extensions)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getPreferenceValues } = require("@raycast/api");
    raw = getPreferenceValues();
  } catch (error) {
    // Fallback to process.env for CLI usage
    raw = {
      githubToken: process.env.GITHUB_TOKEN,
      gmailToken: process.env.GMAIL_TOKEN,
      bufferToken: process.env.BUFFER_TOKEN,
      twitterToken: process.env.TWITTER_BEARER_TOKEN,
      openaiApiKey: process.env.OPENAI_API_KEY,
    };
  }

  try {
    return envSchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Invalid environment configuration: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Validates that a specific service token is available
 * 
 * @param {keyof EnvironmentConfig} service - The service to check
 * @param {Function} getEnvFn - Optional custom getEnv function for testing
 * @returns {boolean} True if the service token is available
 */
export function hasServiceToken(service: keyof EnvironmentConfig, getEnvFn: typeof getEnv = getEnv): boolean {
  try {
    const config = getEnvFn();
    return Boolean(config[service]);
  } catch {
    return false;
  }
}

/**
 * Gets a specific service token with validation
 * 
 * @param {keyof EnvironmentConfig} service - The service token to retrieve
 * @param {Function} getEnvFn - Optional custom getEnv function for testing
 * @returns {string} The service token
 * @throws {Error} If the service token is not available
 */
export function getServiceToken(service: keyof EnvironmentConfig, getEnvFn: typeof getEnv = getEnv): string {
  const config = getEnvFn();
  const token = config[service];
  if (!token) {
    throw new Error(`Service token for ${service} is not configured`);
  }
  return token;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** List of missing required services */
  missingServices: string[];
  /** List of available services */
  availableServices: string[];
}

/**
 * Validates the current configuration and returns detailed status
 * 
 * @returns {ConfigValidationResult} Configuration validation result
 * 
 * @example
 * ```typescript
 * const validation = validateConfig();
 * if (!validation.isValid) {
 *   console.log('Missing services:', validation.missingServices);
 * }
 * ```
 */
export function validateConfig(): ConfigValidationResult {
  const config = getEnv();
  const availableServices: string[] = [];
  const missingServices: string[] = [];
  
  // Check each service
  Object.entries(config).forEach(([service, token]) => {
    if (token) {
      availableServices.push(service);
    } else {
      missingServices.push(service);
    }
  });
  
  return {
    isValid: missingServices.length === 0,
    missingServices,
    availableServices,
  };
} 