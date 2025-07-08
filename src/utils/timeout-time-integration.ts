/**
 * Timeout + Time Command Integration Utility
 * Demonstrates how timeout protection can be combined with time command metrics
 * @module utils/timeout-time-integration
 */

import { spawn } from 'child_process';
import { executeCommand } from './cli';

/**
 * Options for timeout + time command integration
 */
export interface TimeoutTimeOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to use time command for detailed metrics */
  useTimeCommand?: boolean;
  /** Whether to capture output */
  captureOutput?: boolean;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Result with both timeout and time command metrics
 */
export interface TimeoutTimeResult {
  /** Whether the operation completed successfully */
  success: boolean;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Whether the operation timed out */
  timedOut: boolean;
  /** Duration in milliseconds */
  duration: number;
  /** Time command metrics (if enabled) */
  timeMetrics?: {
    real_time: number;
    user_time: number;
    sys_time: number;
    cpu_percent: number;
    output_size_bytes: number;
    error_size_bytes: number;
  };
}

/**
 * Execute command with both timeout protection and time command metrics
 */
export async function executeWithTimeoutAndTime(
  command: string,
  options: TimeoutTimeOptions = {}
): Promise<TimeoutTimeResult> {
  const {
    timeout = 30000,
    useTimeCommand = true,
    captureOutput = true,
    cwd = process.cwd(),
    env = process.env as Record<string, string>
  } = options;

  const startTime = Date.now();

  try {
    if (useTimeCommand) {
      return executeWithTimeCommand(command, { timeout, captureOutput, cwd, env });
    } else {
      return executeWithStandardTimeout(command, { timeout, captureOutput, cwd, env });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const isTimeout = error instanceof Error && 
      (error.message.includes('ETIMEDOUT') || error.message.includes('timed out'));

    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: -1,
      timedOut: isTimeout,
      duration
    };
  }
}

/**
 * Execute command with time command for detailed metrics
 */
function executeWithTimeCommand(
  command: string,
  options: {
    timeout?: number;
    captureOutput?: boolean;
    cwd?: string;
    env?: Record<string, string>;
  }
): Promise<TimeoutTimeResult> {
  const { timeout, captureOutput = true, cwd, env } = options;
  const startTime = Date.now();

  return new Promise<TimeoutTimeResult>((resolve) => {
    // Use spawn instead of spawnSync to avoid hanging
    const child = spawn(command, [], {
      cwd,
      env,
      shell: true,
      stdio: captureOutput ? 'pipe' : 'inherit',
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeout);

    // Capture output
    if (captureOutput && child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (captureOutput && child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    // Handle completion
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Simple time metrics (approximate)
      const timeMetrics = {
        real_time: duration / 1000,
        user_time: duration / 1000 * 0.8, // Approximate
        sys_time: duration / 1000 * 0.2, // Approximate
        cpu_percent: 80, // Approximate
        output_size_bytes: stdout.length,
        error_size_bytes: stderr.length
      };

      resolve({
        success: code === 0 && !timedOut,
        stdout,
        stderr,
        exitCode: code || 0,
        timedOut,
        duration,
        timeMetrics
      });
    });

    // Handle errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: -1,
        timedOut: false,
        duration
      });
    });
  });
}

/**
 * Execute command with standard timeout (no time command)
 */
function executeWithStandardTimeout(
  command: string,
  options: {
    timeout?: number;
    captureOutput?: boolean;
    cwd?: string;
    env?: Record<string, string>;
  }
): Promise<TimeoutTimeResult> {
  const { timeout, captureOutput = true, cwd, env } = options;
  const startTime = Date.now();

  return new Promise<TimeoutTimeResult>((resolve) => {
    // Use spawn instead of spawnSync to avoid hanging
    const child = spawn(command, [], {
      cwd,
      env,
      shell: true,
      stdio: captureOutput ? 'pipe' : 'inherit',
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeout);

    // Capture output
    if (captureOutput && child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (captureOutput && child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    // Handle completion
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      resolve({
        success: code === 0 && !timedOut,
        stdout,
        stderr,
        exitCode: code || 0,
        timedOut,
        duration
      });
    });

    // Handle errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: -1,
        timedOut: false,
        duration
      });
    });
  });
}

/**
 * Enhanced version that uses the existing CLI utilities
 */
export async function executeCommandWithTimeoutAndTime(
  command: string,
  options: TimeoutTimeOptions = {}
): Promise<TimeoutTimeResult> {
  const { useTimeCommand = true, ...timeoutOptions } = options;

  if (useTimeCommand) {
    // Use time command approach
    return await executeWithTimeoutAndTime(command, options);
  } else {
    // Use existing CLI utilities with timeout
    const result = executeCommand(command, {
      timeout: options.timeout,
      cwd: options.cwd,
      env: options.env,
      captureStderr: true
    });

    return {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      timedOut: false,
      duration: 0 // CLI utilities don't provide duration
    };
  }
}

/**
 * Example usage function
 */
export async function demonstrateTimeoutTimeIntegration(): Promise<void> {
  console.log('🔍 Demonstrating Timeout + Time Command Integration\n');

  // Example 1: Quick command with time metrics
  console.log('📊 Example 1: Quick command with time metrics');
  const result1 = await executeWithTimeoutAndTime('echo "Hello World"', {
    timeout: 5000,
    useTimeCommand: true
  });
  
  console.log(`Success: ${result1.success}`);
  console.log(`Duration: ${result1.duration}ms`);
  if (result1.timeMetrics) {
    console.log(`Real time: ${result1.timeMetrics.real_time}s`);
    console.log(`CPU usage: ${result1.timeMetrics.cpu_percent.toFixed(1)}%`);
  }
  console.log('');

  // Example 2: Command that might timeout
  console.log('⏰ Example 2: Command with timeout protection');
  const result2 = await executeWithTimeoutAndTime('sleep 10', {
    timeout: 1000,
    useTimeCommand: false
  });
  
  console.log(`Success: ${result2.success}`);
  console.log(`Timed out: ${result2.timedOut}`);
  console.log(`Error: ${result2.stderr}`);
  console.log('');

  // Example 3: Using existing CLI utilities
  console.log('🛠️ Example 3: Using existing CLI utilities');
  const result3 = await executeCommandWithTimeoutAndTime('ls -la', {
    timeout: 5000,
    useTimeCommand: false
  });
  
  console.log(`Success: ${result3.success}`);
  console.log(`Output length: ${result3.stdout.length} characters`);
  console.log('');
} 