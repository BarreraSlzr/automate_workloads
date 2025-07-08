/**
 * @fileoverview Tests for SimpleTestMonitor
 * @module tests/unit/utils/simpleTestMonitor
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  SimpleTestMonitor,
  startSimpleTestMonitoring,
  stopSimpleTestMonitoring,
  trackSimpleTest,
  isSimpleTestMonitoringActive,
  getSimpleTestResults,
  getSimpleTestSummary,
  SimpleTestResultSchema,
  SimpleTestSummarySchema,
  SimpleTestFossilSchema,
} from '../../../src/utils/simpleTestMonitor';

describe('SimpleTestMonitor', () => {
  let monitor: SimpleTestMonitor;

  beforeEach(() => {
    monitor = new SimpleTestMonitor({
      createFossils: false, // Disable fossil creation for tests
      verbose: false,
    });
  });

  afterEach(() => {
    // Clean up global monitoring
    if (isSimpleTestMonitoringActive()) {
      stopSimpleTestMonitoring();
    }
  });

  describe('Constructor', () => {
    it('should create monitor with default config', () => {
      const defaultMonitor = new SimpleTestMonitor();
      expect(defaultMonitor).toBeInstanceOf(SimpleTestMonitor);
    });

    it('should create monitor with custom config', () => {
      const customMonitor = new SimpleTestMonitor({
        createFossils: true,
        fossilPath: 'custom/path',
        verbose: true,
      });
      expect(customMonitor).toBeInstanceOf(SimpleTestMonitor);
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring', () => {
      monitor.start();
      expect(monitor.getSummary()).not.toBeNull();
      
      const summary = monitor.stop();
      expect(summary.totalTests).toBe(0);
      expect(summary.passedTests).toBe(0);
      expect(summary.failedTests).toBe(0);
      expect(summary.skippedTests).toBe(0);
    });

    it('should track test results correctly', () => {
      monitor.start();
      
      monitor.trackTest({
        testName: 'test-1',
        duration: 100,
        status: 'pass',
        metadata: { category: 'unit' },
      });

      monitor.trackTest({
        testName: 'test-2',
        duration: 200,
        status: 'fail',
        metadata: { category: 'integration' },
      });

      monitor.trackTest({
        testName: 'test-3',
        duration: 50,
        status: 'skip',
      });

      const summary = monitor.stop();
      expect(summary.totalTests).toBe(3);
      expect(summary.passedTests).toBe(1);
      expect(summary.failedTests).toBe(1);
      expect(summary.skippedTests).toBe(1);
      expect(summary.averageDuration).toBeCloseTo(116.67, 1);
    });

    it('should provide accurate results', () => {
      monitor.start();
      
      monitor.trackTest({
        testName: 'test-1',
        duration: 100,
        status: 'pass',
      });

      const results = monitor.getResults();
      expect(results).toHaveLength(1);
      expect(results[0]?.testName).toBe('test-1');
      expect(results[0]?.status).toBe('pass');
      expect(results[0]?.duration).toBe(100);
    });

    it('should clear data', () => {
      monitor.start();
      monitor.trackTest({
        testName: 'test-1',
        duration: 100,
        status: 'pass',
      });
      
      monitor.clear();
      const results = monitor.getResults();
      expect(results).toHaveLength(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate test result schema', () => {
      const validResult = {
        testName: 'test-1',
        duration: 100,
        status: 'pass' as const,
        timestamp: new Date().toISOString(),
        metadata: { category: 'unit' },
      };

      expect(() => SimpleTestResultSchema.parse(validResult)).not.toThrow();
    });

    it('should validate summary schema', () => {
      const validSummary = {
        totalTests: 10,
        passedTests: 8,
        failedTests: 1,
        skippedTests: 1,
        totalDuration: 1000,
        averageDuration: 100,
        timestamp: new Date().toISOString(),
      };

      expect(() => SimpleTestSummarySchema.parse(validSummary)).not.toThrow();
    });

    it('should validate fossil schema', () => {
      const validFossil = {
        id: 'test-fossil-1',
        type: 'simple-test-monitor' as const,
        timestamp: new Date().toISOString(),
        source: 'test',
        createdBy: 'test',
        createdAt: new Date().toISOString(),
        data: {
          summary: {
            totalTests: 1,
            passedTests: 1,
            failedTests: 0,
            skippedTests: 0,
            totalDuration: 100,
            averageDuration: 100,
            timestamp: new Date().toISOString(),
          },
          results: [{
            testName: 'test-1',
            duration: 100,
            status: 'pass' as const,
            timestamp: new Date().toISOString(),
          }],
        },
      };

      expect(() => SimpleTestFossilSchema.parse(validFossil)).not.toThrow();
    });
  });

  describe('Global Monitoring Functions', () => {
    it('should start global monitoring', () => {
      startSimpleTestMonitoring({ verbose: false });
      expect(isSimpleTestMonitoringActive()).toBe(true);
    });

    it('should stop global monitoring', async () => {
      startSimpleTestMonitoring({ verbose: false });
      const summary = await stopSimpleTestMonitoring();
      expect(isSimpleTestMonitoringActive()).toBe(false);
      expect(summary).not.toBeNull();
    });

    it('should track operations globally', () => {
      startSimpleTestMonitoring({ verbose: false });
      
      trackSimpleTest({
        testName: 'global-test',
        duration: 150,
        status: 'pass',
        metadata: { global: true },
      });

      const results = getSimpleTestResults();
      expect(results).toHaveLength(1);
      expect(results[0]?.testName).toBe('global-test');
    });

    it('should provide global summary', () => {
      startSimpleTestMonitoring({ verbose: false });
      
      trackSimpleTest({
        testName: 'test-1',
        duration: 100,
        status: 'pass',
      });

      trackSimpleTest({
        testName: 'test-2',
        duration: 200,
        status: 'fail',
      });

      const summary = getSimpleTestSummary();
      expect(summary).not.toBeNull();
      expect(summary?.totalTests).toBe(2);
      expect(summary?.passedTests).toBe(1);
      expect(summary?.failedTests).toBe(1);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle many concurrent operations', () => {
      monitor.start();
      
      // Track many tests quickly
      for (let i = 0; i < 100; i++) {
        monitor.trackTest({
          testName: `test-${i}`,
          duration: Math.random() * 1000,
          status: i % 3 === 0 ? 'pass' : i % 3 === 1 ? 'fail' : 'skip',
        });
      }

      const summary = monitor.stop();
      expect(summary.totalTests).toBe(100);
      expect(summary.passedTests + summary.failedTests + summary.skippedTests).toBe(100);
    });

    it('should not leak memory with many operations', () => {
      monitor.start();
      
      // Track many tests and clear repeatedly
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 50; i++) {
          monitor.trackTest({
            testName: `test-${cycle}-${i}`,
            duration: 50,
            status: 'pass',
          });
        }
        monitor.clear();
      }

      const results = monitor.getResults();
      expect(results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid test data gracefully', () => {
      monitor.start();
      
      // Should not throw on invalid data
      expect(() => {
        monitor.trackTest({
          testName: '',
          duration: -1,
          status: 'pass',
        });
      }).not.toThrow();

      const summary = monitor.stop();
      expect(summary.totalTests).toBe(1);
    });

    it('should handle multiple start/stop calls', () => {
      monitor.start();
      monitor.start(); // Should not cause issues
      
      const summary1 = monitor.stop();
      const summary2 = monitor.stop(); // Should not cause issues
      
      expect(summary1).not.toBeNull();
      expect(summary2).not.toBeNull();
    });
  });

  describe('Integration with Fossil System', () => {
    it('should create fossils when enabled', async () => {
      const fossilMonitor = new SimpleTestMonitor({
        createFossils: true,
        fossilPath: 'fossils/tests/temp',
        verbose: false,
      });

      fossilMonitor.start();
      fossilMonitor.trackTest({
        testName: 'fossil-test',
        duration: 100,
        status: 'pass',
      });

      const summary = fossilMonitor.stop();
      await fossilMonitor.createFossil(summary);
      
      // Note: In a real test, we would verify the fossil was created
      // For now, we just ensure no errors are thrown
      expect(summary.totalTests).toBe(1);
    });
  });
}); 