// Canonical safe JSON parsing utility

/**
 * Safely parse a JSON string. Throws a canonical error with context if parsing fails.
 * @param input - The JSON string to parse
 * @param context - Optional context for error reporting
 */
export function parseJsonSafe<T>(input: string, context?: string): T {
  try {
    return JSON.parse(input) as T;
  } catch (error) {
    throw new Error(
      `[parseJsonSafe] Failed to parse JSON${context ? ` in ${context}` : ''}: ${error instanceof Error ? error.message : error}`
    );
  }
} 