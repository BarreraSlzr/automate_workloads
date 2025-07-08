import { test, expect } from 'bun:test';
import { 
  withTimeout, 
  executeWithTimeout, 
  executeShellWithTimeout,
  retryWithTimeout,
  delay,
  DEFAULT_TIMEOUTS 
} from '../../../src/utils/timeout';

test('withTimeout completes successfully within timeout', async () => {
  const result = await withTimeout(async () => {
    await delay(100);
    return 'success';
  }, { timeout: 1000 });

  expect(result.success).toBe(true);
  expect(result.data).toBe('success');
  expect(result.timedOut).toBe(false);
  expect(result.duration).toBeGreaterThan(90);
  expect(result.duration).toBeLessThan(200);
});

test('withTimeout times out when operation takes too long', async () => {
  const result = await withTimeout(async () => {
    await delay(2000);
    return 'success';
  }, { timeout: 100 });

  expect(result.success).toBe(false);
  expect(result.timedOut).toBe(true);
  expect(result.error).toContain('Operation timed out');
  expect(result.duration).toBeGreaterThan(90);
  expect(result.duration).toBeLessThan(200);
});

test('executeWithTimeout runs command successfully', () => {
  const result = executeWithTimeout('echo', ['hello world'], { 
    timeout: DEFAULT_TIMEOUTS.QUICK 
  });

  expect(result.success).toBe(true);
  expect(result.data?.stdout.trim()).toBe('hello world');
  expect(result.data?.exitCode).toBe(0);
  expect(result.timedOut).toBe(false);
});

test('executeWithTimeout handles command failure', () => {
  const result = executeWithTimeout('false', [], { 
    timeout: DEFAULT_TIMEOUTS.QUICK 
  });

  expect(result.success).toBe(false);
  expect(result.data?.exitCode).toBe(1);
  expect(result.timedOut).toBe(false);
});

test('executeShellWithTimeout runs shell command successfully', () => {
  const result = executeShellWithTimeout('echo "hello world"', { 
    timeout: DEFAULT_TIMEOUTS.QUICK 
  });

  expect(result.success).toBe(true);
  expect(result.data?.stdout.trim()).toBe('hello world');
  expect(result.data?.exitCode).toBe(0);
  expect(result.timedOut).toBe(false);
});

test('retryWithTimeout succeeds on first attempt', async () => {
  const result = await retryWithTimeout(async () => {
    await delay(50);
    return 'success';
  }, { 
    maxRetries: 3,
    timeout: 1000,
    baseDelay: 100
  });

  expect(result.success).toBe(true);
  expect(result.data).toBe('success');
  expect(result.timedOut).toBe(false);
});

test('retryWithTimeout succeeds after retries', async () => {
  let attempts = 0;
  const result = await retryWithTimeout(async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Temporary failure');
    }
    return 'success';
  }, { 
    maxRetries: 3,
    timeout: 1000,
    baseDelay: 50
  });

  expect(result.success).toBe(true);
  expect(result.data).toBe('success');
  expect(attempts).toBe(3);
});

test('retryWithTimeout fails after max retries', async () => {
  const result = await retryWithTimeout(async () => {
    throw new Error('Persistent failure');
  }, { 
    maxRetries: 2,
    timeout: 1000,
    baseDelay: 50
  });

  expect(result.success).toBe(false);
  expect(result.error).toContain('Persistent failure');
});

test('delay function works correctly', async () => {
  const start = Date.now();
  await delay(100);
  const duration = Date.now() - start;
  
  expect(duration).toBeGreaterThan(90);
  expect(duration).toBeLessThan(200);
});

test('DEFAULT_TIMEOUTS has expected values', () => {
  expect(DEFAULT_TIMEOUTS.QUICK).toBe(5000);
  expect(DEFAULT_TIMEOUTS.STANDARD).toBe(30000);
  expect(DEFAULT_TIMEOUTS.LONG).toBe(120000);
  expect(DEFAULT_TIMEOUTS.VERY_LONG).toBe(300000);
  expect(DEFAULT_TIMEOUTS.TEST).toBe(10000);
}); 