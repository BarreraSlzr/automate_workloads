import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { 
  executeWithTimeoutAndTime,
  executeCommandWithTimeoutAndTime,
  demonstrateTimeoutTimeIntegration
} from '../../../src/utils/timeout-time-integration';

describe('Timeout Time Integration', () => {
  beforeEach(() => {
    // Set up any test environment
  });

  afterEach(() => {
    // Clean up after tests
  });

  describe('executeWithTimeoutAndTime', () => {
    it('should execute a simple command successfully', async () => {
      const result = await executeWithTimeoutAndTime('echo "test"', {
        timeout: 5000,
        useTimeCommand: false
      });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('test');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(result.timedOut).toBe(false);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle command timeout', async () => {
      const result = await executeWithTimeoutAndTime('sleep 10', {
        timeout: 100,
        useTimeCommand: false
      });

      expect(result.success).toBe(false);
      expect(result.timedOut).toBe(true);
      expect(result.duration).toBeGreaterThan(90); // Should be close to timeout
      expect(result.duration).toBeLessThan(200); // But not much more
    });

    it('should provide time metrics when enabled', async () => {
      const result = await executeWithTimeoutAndTime('echo "metrics test"', {
        timeout: 5000,
        useTimeCommand: true
      });

      expect(result.success).toBe(true);
      expect(result.timeMetrics).toBeDefined();
      if (result.timeMetrics) {
        expect(result.timeMetrics.real_time).toBeGreaterThan(0);
        expect(result.timeMetrics.user_time).toBeGreaterThan(0);
        expect(result.timeMetrics.sys_time).toBeGreaterThan(0);
        expect(result.timeMetrics.cpu_percent).toBeGreaterThan(0);
        expect(result.timeMetrics.output_size_bytes).toBeGreaterThan(0);
      }
    });

    it('should handle non-existent commands gracefully', async () => {
      const result = await executeWithTimeoutAndTime('nonexistentcommand', {
        timeout: 5000,
        useTimeCommand: false
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('nonexistentcommand');
    });

    it('should respect custom working directory', async () => {
      const result = await executeWithTimeoutAndTime('pwd', {
        timeout: 5000,
        useTimeCommand: false,
        cwd: '/tmp'
      });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toContain('/tmp');
    });

    it('should handle environment variables', async () => {
      const result = await executeWithTimeoutAndTime('echo $TEST_VAR', {
        timeout: 5000,
        useTimeCommand: false,
        env: { ...process.env, TEST_VAR: 'test_value' }
      });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('test_value');
    });
  });

  describe('executeCommandWithTimeoutAndTime', () => {
    it('should use CLI utilities when time command is disabled', async () => {
      const result = await executeCommandWithTimeoutAndTime('echo "cli test"', {
        timeout: 5000,
        useTimeCommand: false
      });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('cli test');
      expect(result.timedOut).toBe(false);
      expect(result.duration).toBe(0); // CLI utilities don't provide duration
    });

    it('should use time command when enabled', async () => {
      const result = await executeCommandWithTimeoutAndTime('echo "time test"', {
        timeout: 5000,
        useTimeCommand: true
      });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('time test');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('demonstrateTimeoutTimeIntegration', () => {
    it('should run demonstration without errors', async () => {
      // Capture console output to verify demonstration runs
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await demonstrateTimeoutTimeIntegration();
        
        // Verify that the demonstration ran
        expect(logs.length).toBeGreaterThan(0);
        expect(logs.some(log => log.includes('Demonstrating Timeout + Time Command Integration'))).toBe(true);
        expect(logs.some(log => log.includes('Example 1:'))).toBe(true);
        expect(logs.some(log => log.includes('Example 2:'))).toBe(true);
        expect(logs.some(log => log.includes('Example 3:'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Performance and reliability', () => {
    it('should handle multiple concurrent executions', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        executeWithTimeoutAndTime(`echo "concurrent test ${i}"`, {
          timeout: 5000,
          useTimeCommand: false
        })
      );

      const results = await Promise.all(promises);

      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.stdout.trim()).toBe(`concurrent test ${i}`);
      });
    });

    it('should not hang on long-running commands', async () => {
      const startTime = Date.now();
      
      const result = await executeWithTimeoutAndTime('sleep 2', {
        timeout: 3000,
        useTimeCommand: false
      });

      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.timedOut).toBe(false);
      expect(duration).toBeGreaterThan(1900); // Should be close to 2 seconds
      expect(duration).toBeLessThan(3500); // But not much more
    });

    it('should handle commands with large output', async () => {
      const result = await executeWithTimeoutAndTime('ls -la /usr/bin | head -100', {
        timeout: 10000,
        useTimeCommand: false
      });

      expect(result.success).toBe(true);
      expect(result.stdout.length).toBeGreaterThan(1000);
    });
  });
}); 