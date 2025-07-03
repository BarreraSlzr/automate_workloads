import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { z } from "zod";
import {
  getEnv,
  hasServiceToken,
  getServiceToken,
  validateConfig,
  envSchema,
  type ConfigValidationResult
} from "../../../src/core/config";

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  // Reset process.env before each test
  process.env = { ...originalEnv };
});

afterEach(() => {
  // Restore process.env after each test
  process.env = originalEnv;
});

test("envSchema validates valid configuration", () => {
  const validConfig = {
    GITHUB_TOKEN: "ghp_test123",
    GMAIL_TOKEN: "gmail_test123",
    BUFFER_TOKEN: "buffer_test123",
    TWITTER_TOKEN: "twitter_test123"
  };

  const result = envSchema.parse(validConfig);
  expect(result).toEqual(validConfig);
});

test("envSchema validates partial configuration", () => {
  const partialConfig = {
    GITHUB_TOKEN: "ghp_test123"
  };

  const result = envSchema.parse(partialConfig);
  expect(result.GITHUB_TOKEN).toBe("ghp_test123");
  expect(result.GMAIL_TOKEN).toBeUndefined();
  expect(result.BUFFER_TOKEN).toBeUndefined();
  expect(result.TWITTER_TOKEN).toBeUndefined();
});

test("envSchema validates empty configuration", () => {
  const emptyConfig = {};

  const result = envSchema.parse(emptyConfig);
  expect(result.GITHUB_TOKEN).toBeUndefined();
  expect(result.GMAIL_TOKEN).toBeUndefined();
  expect(result.BUFFER_TOKEN).toBeUndefined();
  expect(result.TWITTER_TOKEN).toBeUndefined();
});

test("envSchema rejects invalid configuration", () => {
  const invalidConfig = {
    GITHUB_TOKEN: 123, // Should be string
    GMAIL_TOKEN: "gmail_test123"
  };

  expect(() => envSchema.parse(invalidConfig)).toThrow(z.ZodError);
});

test("getEnv loads configuration from process.env", () => {
  // Set up test environment variables
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "buffer_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";

  const config = getEnv();

  expect(config.GITHUB_TOKEN).toBe("ghp_test123");
  expect(config.GMAIL_TOKEN).toBe("gmail_test123");
  expect(config.BUFFER_TOKEN).toBe("buffer_test123");
  expect(config.TWITTER_TOKEN).toBe("twitter_test123");
});

test("getEnv handles missing environment variables", () => {
  // Clear environment variables
  delete process.env.GITHUB_TOKEN;
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;
  delete process.env.TWITTER_BEARER_TOKEN;

  const config = getEnv();

  expect(config.GITHUB_TOKEN).toBeUndefined();
  expect(config.GMAIL_TOKEN).toBeUndefined();
  expect(config.BUFFER_TOKEN).toBeUndefined();
  expect(config.TWITTER_TOKEN).toBeUndefined();
});

test("getEnv handles partial environment variables", () => {
  // Set only some environment variables
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;

  const config = getEnv();

  expect(config.GITHUB_TOKEN).toBe("ghp_test123");
  expect(config.GMAIL_TOKEN).toBeUndefined();
  expect(config.BUFFER_TOKEN).toBeUndefined();
  expect(config.TWITTER_TOKEN).toBe("twitter_test123");
});

test("hasServiceToken returns true for available tokens", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";

  expect(hasServiceToken("GITHUB_TOKEN")).toBe(true);
  expect(hasServiceToken("TWITTER_TOKEN")).toBe(true);
});

test("hasServiceToken returns false for missing tokens", () => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.GMAIL_TOKEN;

  expect(hasServiceToken("GITHUB_TOKEN")).toBe(false);
  expect(hasServiceToken("GMAIL_TOKEN")).toBe(false);
});

test("hasServiceToken handles invalid configuration gracefully", () => {
  // Use dependency injection to simulate error
  const throwingGetEnv = () => { throw new Error("Configuration error"); };
  expect(hasServiceToken("GITHUB_TOKEN", throwingGetEnv)).toBe(false);
});

test("getServiceToken returns token for available service", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";

  const token = getServiceToken("GITHUB_TOKEN");
  expect(token).toBe("ghp_test123");
});

test("getServiceToken throws error for missing service", () => {
  delete process.env.GITHUB_TOKEN;

  expect(() => getServiceToken("GITHUB_TOKEN")).toThrow("Service token for GITHUB_TOKEN is not configured");
});

test("getServiceToken throws error for empty token", () => {
  process.env.GITHUB_TOKEN = "";

  expect(() => getServiceToken("GITHUB_TOKEN")).toThrow("Service token for GITHUB_TOKEN is not configured");
});

test("validateConfig returns valid result for complete configuration", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "buffer_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  process.env.OPENAI_API_KEY = "openai_test123";

  const result = validateConfig();

  expect(result.isValid).toBe(true);
  expect(result.availableServices).toEqual([
    "GITHUB_TOKEN",
    "GMAIL_TOKEN",
    "BUFFER_TOKEN",
    "TWITTER_TOKEN",
    "OPENAI_API_KEY"
  ]);
  expect(result.missingServices).toEqual([]);
});

test("validateConfig returns invalid result for missing configuration", () => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;
  delete process.env.TWITTER_BEARER_TOKEN;
  delete process.env.OPENAI_API_KEY;

  const result = validateConfig();

  expect(result.isValid).toBe(false);
  expect(result.availableServices).toEqual([]);
  expect(result.missingServices).toEqual([
    "GITHUB_TOKEN",
    "GMAIL_TOKEN",
    "BUFFER_TOKEN",
    "TWITTER_TOKEN",
    "OPENAI_API_KEY"
  ]);
});

test("validateConfig returns partial result for mixed configuration", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  process.env.OPENAI_API_KEY = "openai_test123";
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;

  const result = validateConfig();

  expect(result.isValid).toBe(false);
  expect(result.availableServices).toEqual([
    "GITHUB_TOKEN",
    "TWITTER_TOKEN",
    "OPENAI_API_KEY"
  ]);
  expect(result.missingServices).toEqual([
    "GMAIL_TOKEN",
    "BUFFER_TOKEN"
  ]);
});

test("validateConfig handles empty tokens", () => {
  process.env.GITHUB_TOKEN = "";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  process.env.OPENAI_API_KEY = "openai_test123";

  const result = validateConfig();

  expect(result.isValid).toBe(false);
  expect(result.availableServices).toEqual([
    "GMAIL_TOKEN",
    "TWITTER_TOKEN",
    "OPENAI_API_KEY"
  ]);
  expect(result.missingServices).toEqual([
    "GITHUB_TOKEN",
    "BUFFER_TOKEN"
  ]);
});

test("ConfigValidationResult interface validation", () => {
  const result = {
    isValid: true,
    missingServices: [],
    availableServices: ["GITHUB_TOKEN", "TWITTER_TOKEN", "OPENAI_API_KEY"]
  };

  expect(result.isValid).toBe(true);
  expect(result.missingServices).toEqual([]);
  expect(result.availableServices).toEqual(["GITHUB_TOKEN", "TWITTER_TOKEN", "OPENAI_API_KEY"]);
});

test("Integration test: full configuration workflow", () => {
  // Set up complete configuration
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "buffer_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  process.env.OPENAI_API_KEY = "openai_test123";

  // Test getEnv
  const config = getEnv();
  expect(config.GITHUB_TOKEN).toBe("ghp_test123");

  // Test hasServiceToken
  expect(hasServiceToken("GITHUB_TOKEN")).toBe(true);
  expect(hasServiceToken("GMAIL_TOKEN")).toBe(true);

  // Test getServiceToken
  expect(getServiceToken("GITHUB_TOKEN")).toBe("ghp_test123");
  expect(getServiceToken("TWITTER_TOKEN")).toBe("twitter_test123");

  // Test validateConfig
  const validation = validateConfig();
  expect(validation.isValid).toBe(true);
  expect(validation.availableServices).toHaveLength(5);
  expect(validation.missingServices).toHaveLength(0);
});

test("Integration test: partial configuration workflow", () => {
  // Set up partial configuration
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.OPENAI_API_KEY = "openai_test123";
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;
  delete process.env.TWITTER_BEARER_TOKEN;

  // Test getEnv
  const config = getEnv();
  expect(config.GITHUB_TOKEN).toBe("ghp_test123");
  expect(config.GMAIL_TOKEN).toBeUndefined();

  // Test hasServiceToken
  expect(hasServiceToken("GITHUB_TOKEN")).toBe(true);
  expect(hasServiceToken("GMAIL_TOKEN")).toBe(false);

  // Test getServiceToken
  expect(getServiceToken("GITHUB_TOKEN")).toBe("ghp_test123");
  expect(() => getServiceToken("GMAIL_TOKEN")).toThrow();

  // Test validateConfig
  const validation = validateConfig();
  expect(validation.isValid).toBe(false);
  expect(validation.availableServices).toEqual(["GITHUB_TOKEN", "OPENAI_API_KEY"]);
  expect(validation.missingServices).toEqual([
    "GMAIL_TOKEN",
    "BUFFER_TOKEN",
    "TWITTER_TOKEN"
  ]);
});

test("returns invalid result if OPENAI_API_KEY is missing", () => {
  const prev = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const result = validateConfig();
  expect(result.isValid).toBe(false);
  expect(result.missingServices).toContain("OPENAI_API_KEY");
  process.env.OPENAI_API_KEY = prev;
});

test("does not throw if OPENAI_API_KEY is present", () => {
  process.env.OPENAI_API_KEY = "test-key";
  expect(() => validateConfig()).not.toThrow();
}); 