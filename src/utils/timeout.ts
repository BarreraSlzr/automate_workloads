/**
 * Timeout utility functions for preventing hanging operations
 * @module utils/timeout
 */

import { spawnSync, execSync } from 'child_process';

/**
 * Options for timeout-protected operations
 */
export interface TimeoutOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string> | NodeJS.ProcessEnv;
  /** Whether to throw on timeout */
  throwOnTimeout?: boolean;
  /** Custom timeout message */
  timeoutMessage?: string;
  /** Whether to use time command for detailed metrics */
  useTimeCommand?: boolean;
  /** Whether to capture output */
  captureOutput?: boolean;
}

/**
 * Default timeout values for different operation types
 */
export const DEFAULT_TIMEOUTS = {
  /** Quick operations (git commands, simple checks) */
  QUICK: 5000,
  /** Standard operations (CLI commands, API calls) */
  STANDARD: 30000,
  /** Long operations (builds, complex processing) */
  LONG: 120000,
  /** Very long operations (full workflows, deployments) */
  VERY_LONG: 300000,
  /** Test operations */
  TEST: 10000,
} as const;

/**
 * Result of a timeout-protected operation
 */
export interface TimeoutResult<T = any> {
  /** Whether the operation completed successfully */
  success: boolean;
  /** The result data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Whether the operation timed out */
  timedOut: boolean;
  /** Duration in milliseconds */
  duration: number;
  /** Performance metrics (when using time command) */
  performance?: {
    real_time: number;
    user_time: number;
    sys_time: number;
    cpu_percent: number;
    memory_usage_mb?: number;
    output_size_bytes?: number;
    error_size_bytes?: number;
  };
}

/**
 * Execute a function with timeout protection
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<TimeoutResult<T>> {
  const {
    timeout = DEFAULT_TIMEOUTS.STANDARD,
    throwOnTimeout = false,
    timeoutMessage = 'Operation timed out'
  } = options;

  const startTime = Date.now();
  let timedOut = false;
  let timer: NodeJS.Timeout;

  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new Error(timeoutMessage));
        }, timeout);
      })
    ]);

    clearTimeout(timer!);
    const duration = Date.now() - startTime;

    return {
      success: true,
      data: result,
      timedOut: false,
      duration
    };
  } catch (error) {
    clearTimeout(timer!);
    const duration = Date.now() - startTime;

    if (timedOut && throwOnTimeout) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timedOut,
      duration
    };
  }
}

/**
 * Execute a shell command with timeout protection using spawnSync
 */
export function executeWithTimeout(
  command: string,
  args: string[] = [],
  options: TimeoutOptions = {}
): TimeoutResult<{ stdout: string; stderr: string; exitCode: number }> {
  const {
    timeout = DEFAULT_TIMEOUTS.STANDARD,
    cwd = process.cwd(),
    env = process.env,
    throwOnTimeout = false,
    timeoutMessage = `Command timed out: ${command} ${args.join(' ')}`,
    useTimeCommand = false,
    captureOutput = true
  } = options;

  const startTime = Date.now();

  try {
    let result;
    let performance;

    if (useTimeCommand) {
      // Use time command for detailed metrics
      const timeResult = executeWithTimeCommand(command, args, {
        cwd,
        env,
        timeout,
        captureOutput
      });
      
      result = timeResult.data;
      performance = timeResult.performance;
    } else {
      // Use standard spawnSync
      result = spawnSync(command, args, {
        encoding: 'utf8',
        timeout,
        cwd,
        env,
        stdio: captureOutput ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      });
    }

    const duration = Date.now() - startTime;

    if (!result) {
      return {
        success: false,
        data: { stdout: '', stderr: 'No result from command execution', exitCode: -1 },
        timedOut: true,
        duration,
      };
    }
    
    const exitCode = 'status' in result ? result.status : result.exitCode;
    const success = exitCode === 0;
    
    return {
      success,
      data: {
        stdout: result?.stdout || '',
        stderr: result?.stderr || '',
        exitCode: exitCode || 0
      },
      timedOut: false,
      duration,
      performance
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const isTimeout = error instanceof Error && error.message.includes('ETIMEDOUT');

    if (isTimeout && throwOnTimeout) {
      throw new Error(timeoutMessage);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timedOut: isTimeout,
      duration
    };
  }
}

/**
 * Execute a shell command with time command for detailed metrics
 */
function executeWithTimeCommand(
  command: string,
  args: string[] = [],
  options: {
    cwd?: string;
    env?: Record<string, string> | NodeJS.ProcessEnv;
    timeout?: number;
    captureOutput?: boolean;
  } = {}
): TimeoutResult<{ stdout: string; stderr: string; exitCode: number }> {
  const { cwd, env, timeout, captureOutput = true } = options;
  const startTime = Date.now();

  // Create temporary files for time command output
  const tempTimeFile = require('fs').mkdtempSync('/tmp/time-') + '/time.txt';
  const tempOutputFile = require('fs').mkdtempSync('/tmp/time-') + '/output.txt';
  const tempErrorFile = require('fs').mkdtempSync('/tmp/time-') + '/error.txt';

  try {
    // Build the command with time
    const timeCommand = ['/usr/bin/time', '-p', '-o', tempTimeFile];
    const fullCommand = [...timeCommand, command, ...args];

    // Execute with timeout
    const result = spawnSync('bash', ['-c', fullCommand.join(' ')], {
      encoding: 'utf8',
      timeout,
      cwd,
      env,
      stdio: captureOutput ? ['pipe', 'pipe', 'pipe'] : 'inherit',
    });

    // Parse time output
    let performance;
    try {
      const timeOutput = require('fs').readFileSync(tempTimeFile, 'utf8');
      const realTime = parseFloat(timeOutput.match(/^real\s+(.+)$/m)?.[1] || '0');
      const userTime = parseFloat(timeOutput.match(/^user\s+(.+)$/m)?.[1] || '0');
      const sysTime = parseFloat(timeOutput.match(/^sys\s+(.+)$/m)?.[1] || '0');
      const cpuPercent = realTime > 0 ? ((userTime + sysTime) / realTime) * 100 : 0;

      performance = {
        real_time: realTime,
        user_time: userTime,
        sys_time: sysTime,
        cpu_percent: cpuPercent,
        output_size_bytes: captureOutput ? require('fs').statSync(tempOutputFile).size : 0,
        error_size_bytes: captureOutput ? require('fs').statSync(tempErrorFile).size : 0
      };
    } catch (parseError) {
      console.warn('Failed to parse time output:', parseError);
    }

    return {
      success: result.status === 0,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.status || 0
      },
      timedOut: false,
      duration: Date.now() - startTime,
      performance
    };
  } finally {
    // Cleanup temporary files
    try {
      require('fs').unlinkSync(tempTimeFile);
      require('fs').unlinkSync(tempOutputFile);
      require('fs').unlinkSync(tempErrorFile);
      require('fs').rmdirSync(require('path').dirname(tempTimeFile));
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute a shell command with timeout protection using execSync
 */
export function executeShellWithTimeout(
  command: string,
  options: TimeoutOptions = {}
): TimeoutResult<{ stdout: string; stderr: string; exitCode: number }> {
  const {
    timeout = DEFAULT_TIMEOUTS.STANDARD,
    cwd = process.cwd(),
    env = process.env,
    throwOnTimeout = false,
    timeoutMessage = `Shell command timed out: ${command}`,
    useTimeCommand = false
  } = options;

  const startTime = Date.now();

  try {
    let result;
    let performance;

    if (useTimeCommand) {
      // Use time command for detailed metrics
      const timeResult = executeShellWithTimeCommand(command, {
        cwd,
        env,
        timeout
      });
      
      result = timeResult.data;
      performance = timeResult.performance;
    } else {
      // Use standard execSync
      result = execSync(command, {
        encoding: 'utf8',
        timeout,
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        stdout: typeof result === 'string' ? result : result?.stdout || '',
        stderr: '',
        exitCode: 0
      },
      timedOut: false,
      duration,
      performance
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const isTimeout = error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM';

    if (isTimeout && throwOnTimeout) {
      throw new Error(timeoutMessage);
    }

    return {
      success: false,
      error: error.message || String(error),
      timedOut: isTimeout,
      duration
    };
  }
}

/**
 * Execute a shell command with time command for detailed metrics
 */
function executeShellWithTimeCommand(
  command: string,
  options: {
    cwd?: string;
    env?: Record<string, string> | NodeJS.ProcessEnv;
    timeout?: number;
  } = {}
): TimeoutResult<{ stdout: string; stderr: string; exitCode: number }> {
  const { cwd, env, timeout } = options;
  const startTime = Date.now();

  // Create temporary file for time output
  const tempTimeFile = require('fs').mkdtempSync('/tmp/time-') + '/time.txt';

  try {
    // Execute with time command
    const timeCommand = `/usr/bin/time -p -o ${tempTimeFile} bash -c "${command}"`;
    
    const result = execSync(timeCommand, {
      encoding: 'utf8',
      timeout,
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Parse time output
    let performance;
    try {
      const timeOutput = require('fs').readFileSync(tempTimeFile, 'utf8');
      const realTime = parseFloat(timeOutput.match(/^real\s+(.+)$/m)?.[1] || '0');
      const userTime = parseFloat(timeOutput.match(/^user\s+(.+)$/m)?.[1] || '0');
      const sysTime = parseFloat(timeOutput.match(/^sys\s+(.+)$/m)?.[1] || '0');
      const cpuPercent = realTime > 0 ? ((userTime + sysTime) / realTime) * 100 : 0;

      performance = {
        real_time: realTime,
        user_time: userTime,
        sys_time: sysTime,
        cpu_percent: cpuPercent,
        output_size_bytes: Buffer.byteLength(result, 'utf8'),
        error_size_bytes: 0
      };
    } catch (parseError) {
      console.warn('Failed to parse time output:', parseError);
    }

    return {
      success: true,
      data: {
        stdout: result,
        stderr: '',
        exitCode: 0
      },
      timedOut: false,
      duration: Date.now() - startTime,
      performance
    };
  } finally {
    // Cleanup temporary file
    try {
      require('fs').unlinkSync(tempTimeFile);
      require('fs').rmdirSync(require('path').dirname(tempTimeFile));
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Create a timeout-aware promise that resolves after a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with timeout and exponential backoff
 */
export async function retryWithTimeout<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    timeout?: number;
    throwOnTimeout?: boolean;
  } = {}
): Promise<TimeoutResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = DEFAULT_TIMEOUTS.STANDARD,
    throwOnTimeout = false
  } = options;

  let lastError: Error | undefined;
  let totalDuration = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await withTimeout(operation, { timeout, throwOnTimeout: false });
    totalDuration += result.duration;

    if (result.success) {
      return {
        ...result,
        duration: totalDuration
      };
    }

    lastError = new Error(result.error);

    if (result.timedOut && throwOnTimeout) {
      throw lastError;
    }

    if (attempt < maxRetries) {
      const delayMs = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await delay(delayMs);
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded',
    timedOut: false,
    duration: totalDuration
  };
}

/**
 * Timeout-aware version of Promise.all with individual timeouts
 */
export async function allWithTimeout<T>(
  operations: Array<{ operation: () => Promise<T>; timeout?: number }>,
  options: { throwOnTimeout?: boolean } = {}
): Promise<TimeoutResult<T>[]> {
  const { throwOnTimeout = false } = options;

  const results = await Promise.all(
    operations.map(({ operation, timeout }) =>
      withTimeout(operation, { timeout, throwOnTimeout })
    )
  );

  return results;
}

/**
 * Timeout-aware version of Promise.race
 */
export async function raceWithTimeout<T>(
  operations: Array<{ operation: () => Promise<T>; timeout?: number }>,
  options: { throwOnTimeout?: boolean } = {}
): Promise<TimeoutResult<T>> {
  const { throwOnTimeout = false } = options;

  const timeoutPromises = operations.map(({ operation, timeout }) =>
    withTimeout(operation, { timeout, throwOnTimeout })
  );

  const results = await Promise.race(timeoutPromises);
  return results;
}

/**
 * Enhanced executeCommand with timeout and time command integration
 */
export function executeCommandWithTimeAndTimeout(
  command: string,
  options: TimeoutOptions & { 
    commandType?: 'shell' | 'spawn';
    args?: string[];
  } = {}
): TimeoutResult<{ stdout: string; stderr: string; exitCode: number }> {
  const { commandType = 'shell', args = [] } = options;

  if (commandType === 'spawn') {
    return executeWithTimeout(command, args, options);
  } else {
    return executeShellWithTimeout(command, options);
  }
} 