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
    githubToken: "ghp_test123",
    gmailToken: "gmail_test123",
    bufferToken: "buffer_test123",
    twitterToken: "twitter_test123"
  };

  const result = envSchema.parse(validConfig);
  expect(result).toEqual(validConfig);
});

test("envSchema validates partial configuration", () => {
  const partialConfig = {
    githubToken: "ghp_test123"
  };

  const result = envSchema.parse(partialConfig);
  expect(result.githubToken).toBe("ghp_test123");
  expect(result.gmailToken).toBeUndefined();
  expect(result.bufferToken).toBeUndefined();
  expect(result.twitterToken).toBeUndefined();
});

test("envSchema validates empty configuration", () => {
  const emptyConfig = {};

  const result = envSchema.parse(emptyConfig);
  expect(result.githubToken).toBeUndefined();
  expect(result.gmailToken).toBeUndefined();
  expect(result.bufferToken).toBeUndefined();
  expect(result.twitterToken).toBeUndefined();
});

test("envSchema rejects invalid configuration", () => {
  const invalidConfig = {
    githubToken: 123, // Should be string
    gmailToken: "gmail_test123"
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

  expect(config.githubToken).toBe("ghp_test123");
  expect(config.gmailToken).toBe("gmail_test123");
  expect(config.bufferToken).toBe("buffer_test123");
  expect(config.twitterToken).toBe("twitter_test123");
});

test("getEnv handles missing environment variables", () => {
  // Clear environment variables
  delete process.env.GITHUB_TOKEN;
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;
  delete process.env.TWITTER_BEARER_TOKEN;

  const config = getEnv();

  expect(config.githubToken).toBeUndefined();
  expect(config.gmailToken).toBeUndefined();
  expect(config.bufferToken).toBeUndefined();
  expect(config.twitterToken).toBeUndefined();
});

test("getEnv handles partial environment variables", () => {
  // Set only some environment variables
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;

  const config = getEnv();

  expect(config.githubToken).toBe("ghp_test123");
  expect(config.gmailToken).toBeUndefined();
  expect(config.bufferToken).toBeUndefined();
  expect(config.twitterToken).toBe("twitter_test123");
});

test("hasServiceToken returns true for available tokens", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";

  expect(hasServiceToken("githubToken")).toBe(true);
  expect(hasServiceToken("twitterToken")).toBe(true);
});

test("hasServiceToken returns false for missing tokens", () => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.GMAIL_TOKEN;

  expect(hasServiceToken("githubToken")).toBe(false);
  expect(hasServiceToken("gmailToken")).toBe(false);
});

test("hasServiceToken handles invalid configuration gracefully", () => {
  // Use dependency injection to simulate error
  const throwingGetEnv = () => { throw new Error("Configuration error"); };
  expect(hasServiceToken("githubToken", throwingGetEnv)).toBe(false);
});

test("getServiceToken returns token for available service", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";

  const token = getServiceToken("githubToken");
  expect(token).toBe("ghp_test123");
});

test("getServiceToken throws error for missing service", () => {
  delete process.env.GITHUB_TOKEN;

  expect(() => getServiceToken("githubToken")).toThrow("Service token for githubToken is not configured");
});

test("getServiceToken throws error for empty token", () => {
  process.env.GITHUB_TOKEN = "";

  expect(() => getServiceToken("githubToken")).toThrow("Service token for githubToken is not configured");
});

test("validateConfig returns valid result for complete configuration", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "buffer_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";

  const result = validateConfig();

  expect(result.isValid).toBe(true);
  expect(result.availableServices).toEqual([
    "githubToken",
    "gmailToken", 
    "bufferToken",
    "twitterToken"
  ]);
  expect(result.missingServices).toEqual([]);
});

test("validateConfig returns invalid result for missing configuration", () => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;
  delete process.env.TWITTER_BEARER_TOKEN;

  const result = validateConfig();

  expect(result.isValid).toBe(false);
  expect(result.availableServices).toEqual([]);
  expect(result.missingServices).toEqual([
    "githubToken",
    "gmailToken",
    "bufferToken", 
    "twitterToken"
  ]);
});

test("validateConfig returns partial result for mixed configuration", () => {
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;

  const result = validateConfig();

  expect(result.isValid).toBe(false);
  expect(result.availableServices).toEqual([
    "githubToken",
    "twitterToken"
  ]);
  expect(result.missingServices).toEqual([
    "gmailToken",
    "bufferToken"
  ]);
});

test("validateConfig handles empty tokens", () => {
  process.env.GITHUB_TOKEN = "";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";

  const result = validateConfig();

  expect(result.isValid).toBe(false);
  expect(result.availableServices).toEqual([
    "gmailToken",
    "twitterToken"
  ]);
  expect(result.missingServices).toEqual([
    "githubToken",
    "bufferToken"
  ]);
});

test("ConfigValidationResult interface validation", () => {
  const result: ConfigValidationResult = {
    isValid: true,
    missingServices: [],
    availableServices: ["githubToken", "twitterToken"]
  };

  expect(result.isValid).toBe(true);
  expect(result.missingServices).toEqual([]);
  expect(result.availableServices).toEqual(["githubToken", "twitterToken"]);
});

test("Integration test: full configuration workflow", () => {
  // Set up complete configuration
  process.env.GITHUB_TOKEN = "ghp_test123";
  process.env.GMAIL_TOKEN = "gmail_test123";
  process.env.BUFFER_TOKEN = "buffer_test123";
  process.env.TWITTER_BEARER_TOKEN = "twitter_test123";

  // Test getEnv
  const config = getEnv();
  expect(config.githubToken).toBe("ghp_test123");

  // Test hasServiceToken
  expect(hasServiceToken("githubToken")).toBe(true);
  expect(hasServiceToken("gmailToken")).toBe(true);

  // Test getServiceToken
  expect(getServiceToken("githubToken")).toBe("ghp_test123");
  expect(getServiceToken("twitterToken")).toBe("twitter_test123");

  // Test validateConfig
  const validation = validateConfig();
  expect(validation.isValid).toBe(true);
  expect(validation.availableServices).toHaveLength(4);
  expect(validation.missingServices).toHaveLength(0);
});

test("Integration test: partial configuration workflow", () => {
  // Set up partial configuration
  process.env.GITHUB_TOKEN = "ghp_test123";
  delete process.env.GMAIL_TOKEN;
  delete process.env.BUFFER_TOKEN;
  delete process.env.TWITTER_BEARER_TOKEN;

  // Test getEnv
  const config = getEnv();
  expect(config.githubToken).toBe("ghp_test123");
  expect(config.gmailToken).toBeUndefined();

  // Test hasServiceToken
  expect(hasServiceToken("githubToken")).toBe(true);
  expect(hasServiceToken("gmailToken")).toBe(false);

  // Test getServiceToken
  expect(getServiceToken("githubToken")).toBe("ghp_test123");
  expect(() => getServiceToken("gmailToken")).toThrow();

  // Test validateConfig
  const validation = validateConfig();
  expect(validation.isValid).toBe(false);
  expect(validation.availableServices).toEqual(["githubToken"]);
  expect(validation.missingServices).toEqual([
    "gmailToken",
    "bufferToken",
    "twitterToken"
  ]);
}); 