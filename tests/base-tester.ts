// This file is being renamed to base-tester.ts to avoid being picked up as a test file by Bun.
// Please update all imports to use './base-tester' instead of './base.test'.

import { test, expect } from "bun:test";

/**
 * Generic base test utilities for shell scripts
 * 
 * This class provides a standardized way to test shell scripts with common patterns:
 * - Test mode validation (when CHECK_ISSUES_TEST=1)
 * - Real mode output validation (with SKIP_BUN_TEST=1 to prevent recursion)
 * - Edge case testing
 * - Integration testing (executability)
 * 
 * Uses SKIP_BUN_TEST=1 in real mode to prevent recursive test execution when scripts call bun test.
 * 
 * @example
 * ```typescript
 * const tester = new ScriptTester("./scripts/my-script.sh", "Custom test message");
 * await tester.testMode();
 * await tester.realMode([], ["Expected output"]);
 * await tester.isExecutable();
 * ```
 */
export class ScriptTester {
  /**
   * Creates a new ScriptTester instance
   * 
   * @param scriptPath - Path to the shell script to test
   * @param testModeMessage - Expected message when script runs in test mode (CHECK_ISSUES_TEST=1)
   */
  constructor(
    private scriptPath: string,
    private testModeMessage: string = "[TEST MODE] script ran successfully."
  ) {}

  /**
   * Tests the script in test mode (CHECK_ISSUES_TEST=1)
   * 
   * This method validates that the script responds correctly to the test mode
   * environment variable and returns the expected test message.
   * 
   * @param args - Command line arguments to pass to the script
   * @returns Promise that resolves when test completes
   * 
   * @example
   * ```typescript
   * await tester.testMode(); // No arguments
   * await tester.testMode(["arg1", "arg2"]); // With arguments
   * ```
   */
  async testMode(args: string[] = []): Promise<void> {
    const result = await Bun.spawn([this.scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, CHECK_ISSUES_TEST: "1" },
    });
    
    const output = await new Response(result.stdout).text();
    const exitCode = await result.exited;
    
    expect(output.trim()).toBe(this.testModeMessage);
    expect(exitCode).toBe(0);
  }

  /**
   * Enhanced realMode: supports output filtering, timeouts, flexible matching, exit code assertions, setup/teardown, stdin, etc.
   */
  async realMode({
    args = [],
    expectedOutput = [],
    notExpectedOutput = [],
    expectedExitCode = 0,
    extraEnv = {},
    normalize,
    timeoutMs = 10000,
    stdin = undefined,
    setup,
    teardown,
  }: {
    args?: string[];
    expectedOutput?: (string | RegExp)[];
    notExpectedOutput?: (string | RegExp)[];
    expectedExitCode?: number;
    extraEnv?: Record<string, string>;
    normalize?: (output: string) => string;
    timeoutMs?: number;
    stdin?: string;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
  }): Promise<{ output: string; exitCode: number }> {
    if (setup) await setup();

    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    try {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      const result = await Bun.spawn([this.scriptPath, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, CHECK_ISSUES_TEST: "0", SKIP_BUN_TEST: "1", ...extraEnv },
        signal: controller.signal,
      });

      let output = await new Response(result.stdout).text();
      const exitCode = await result.exited;

      if (normalize) output = normalize(output);

      // Flexible output matching
      for (const expected of expectedOutput) {
        if (typeof expected === "string") {
          expect(output).toContain(expected);
        } else {
          expect(output).toMatch(expected);
        }
      }
      for (const notExpected of notExpectedOutput) {
        if (typeof notExpected === "string") {
          expect(output).not.toContain(notExpected);
        } else {
          expect(output).not.toMatch(notExpected);
        }
      }

      expect(exitCode).toBe(expectedExitCode);

      if (timedOut) {
        throw new Error(`Test timed out after ${timeoutMs}ms`);
      }
      // Return output and exitCode for custom assertions
      return { output, exitCode };
    } catch (err) {
      // Better error reporting
      console.error("ScriptTester error:");
      console.error("Script:", this.scriptPath);
      console.error("Args:", args);
      console.error("Env:", extraEnv);
      if (err instanceof Error) {
        console.error("Error:", err.message);
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
      if (teardown) await teardown();
    }
  }

  /**
   * Tests that the script file is executable
   * 
   * This method validates that the script has the proper execute permissions
   * and can be called by the system.
   * 
   * @returns Promise that resolves when test completes
   * 
   * @example
   * ```typescript
   * await tester.isExecutable();
   * ```
   */
  async isExecutable(): Promise<void> {
    const result = await Bun.spawn(["test", "-x", this.scriptPath]);
    const exitCode = await result.exited;
    expect(exitCode).toBe(0);
  }

  /**
   * Tests edge cases with various argument combinations
   * 
   * This method runs the script with different edge case scenarios
   * and validates that it handles them gracefully.
   * 
   * @param edgeCases - Array of edge case scenarios to test
   * @param expectedOutput - Optional string that should appear in all outputs
   * @param extraEnv - Optional extra environment variables to set
   * @returns Promise that resolves when all edge cases are tested
   * 
   * @example
   * ```typescript
   * const edgeCases = [
   *   { args: ["spaces in arg"], desc: "arguments with spaces" },
   *   { args: ["special!@#"], desc: "special characters" }
   * ];
   * await tester.testEdgeCases(edgeCases, "Expected output");
   * ```
   */
  async testEdgeCases(
    edgeCases: Array<{ args: string[]; desc: string }>,
    expectedOutput: string = "",
    extraEnv: Record<string, string> = {}
  ): Promise<void> {
    for (const { args, desc } of edgeCases) {
      const result = await Bun.spawn([this.scriptPath, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, CHECK_ISSUES_TEST: "0", SKIP_BUN_TEST: "1", ...extraEnv },
      });
      
      const output = await new Response(result.stdout).text();
      const exitCode = await result.exited;
      
      if (expectedOutput) {
        expect(output).toContain(expectedOutput);
      }
      expect(typeof exitCode).toBe("number");
    }
  }
} 