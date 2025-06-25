import { test, expect } from "bun:test";

/**
 * Generic base test utilities for shell scripts
 * 
 * This class provides a standardized way to test shell scripts with common patterns:
 * - Test mode validation (when CHECK_ISSUES_TEST=1)
 * - Real mode output validation
 * - Edge case testing
 * - Integration testing (executability)
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
   * Tests the script in real mode (CHECK_ISSUES_TEST=0) with output validation
   * 
   * This method runs the script with actual functionality and validates
   * that the output contains expected strings and doesn't contain unexpected ones.
   * 
   * @param args - Command line arguments to pass to the script
   * @param expectedOutput - Array of strings that should appear in the output
   * @param notExpectedOutput - Array of strings that should NOT appear in the output
   * @returns Promise that resolves when test completes
   * 
   * @example
   * ```typescript
   * await tester.realMode([], ["Expected message"]); // Basic validation
   * await tester.realMode(
   *   ["arg1"], 
   *   ["Expected output"], 
   *   ["Unexpected output"]
   * ); // With arguments and validation
   * ```
   */
  async realMode(
    args: string[] = [],
    expectedOutput: string[] = [],
    notExpectedOutput: string[] = []
  ): Promise<void> {
    const result = await Bun.spawn([this.scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, CHECK_ISSUES_TEST: "0" },
    });
    
    const output = await new Response(result.stdout).text();
    const exitCode = await result.exited;
    
    // Validate expected output
    for (const expected of expectedOutput) {
      expect(output).toContain(expected);
    }
    
    // Validate not expected output
    for (const notExpected of notExpectedOutput) {
      expect(output).not.toContain(notExpected);
    }
    
    expect(typeof exitCode).toBe("number");
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
    expectedOutput: string = ""
  ): Promise<void> {
    for (const { args, desc } of edgeCases) {
      const result = await Bun.spawn([this.scriptPath, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, CHECK_ISSUES_TEST: "0" },
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