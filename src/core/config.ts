/**
 * Core configuration management for the automation ecosystem
 * @module core/config
 */

import { ZodError } from '@/types/schemas';
import type { EnvironmentConfig, ConfigValidationResult } from "../types";
import { envSchema } from '@/types/schemas';

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
    const prefs = getPreferenceValues();
    raw = {
      GITHUB_TOKEN: prefs.GITHUB_TOKEN || prefs.githubToken,
      GMAIL_TOKEN: prefs.GMAIL_TOKEN || prefs.gmailToken,
      BUFFER_TOKEN: prefs.BUFFER_TOKEN || prefs.bufferToken,
      TWITTER_TOKEN: prefs.TWITTER_TOKEN || prefs.twitterToken,
      OPENAI_API_KEY: prefs.OPENAI_API_KEY || prefs.openaiApiKey,
    };
  } catch (error) {
    // Fallback to process.env for CLI usage
    raw = {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GMAIL_TOKEN: process.env.GMAIL_TOKEN,
      BUFFER_TOKEN: process.env.BUFFER_TOKEN,
      TWITTER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    };
  }

  try {
    return envSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      const missingVars = error.errors.map((err, i) => {
        if (i % 10 === 0 || i === error.errors.length - 1) {
          console.log(`🔄 Processing missing var ${i + 1} of ${error.errors.length}`);
        }
        return err.path.join('.');
      });
      for (let i = 0; i < missingVars.length; i++) {
        if (i % 10 === 0 || i === missingVars.length - 1) {
          console.log(`🔄 Processing missing var ${i + 1} of ${missingVars.length}`);
        }
      }
      throw new Error(`Invalid environment configuration: ${missingVars.join(', ')}`);
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
  
  for (let i = 0; i < missingServices.length; i++) {
    if (i % 10 === 0 || i === missingServices.length - 1) {
      console.log(`🔄 Processing missing service ${i + 1} of ${missingServices.length}`);
    }
  }

  return {
    isValid: missingServices.length === 0,
    missingServices,
    availableServices,
  };
}

export { envSchema }; 