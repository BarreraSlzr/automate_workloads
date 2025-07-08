#!/usr/bin/env bun

/**
 * Event Loop Monitoring Demo
 * Demonstrates the event loop monitoring system with various scenarios
 * @module examples/event-loop-monitoring-demo
 */

import { 
  startGlobalMonitoring, 
  stopGlobalMonitoring, 
  trackOperation, 
  getCallStackSummary,
  generateMonitoringReport,
  exportMonitoringData,
  HangingDetectionConfig 
} from '../src/utils/eventLoopMonitor';

// ============================================================================
// DEMO SCENARIOS
// ============================================================================

/**
 * Scenario 1: Normal operations
 */
async function normalOperations() {
  console.log('\n🧪 Scenario 1: Normal Operations');
  console.log('================================');

  // Quick operation
  await trackOperation(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'quick operation';
    },
    'quickOperation',
    { scenario: 'normal', type: 'fast' }
  );

  // Medium operation
  await trackOperation(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return 'medium operation';
    },
    'mediumOperation',
    { scenario: 'normal', type: 'medium' }
  );

  // CPU-intensive operation
  await trackOperation(
    () => {
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i);
      }
      return result;
    },
    'cpuIntensive',
    { scenario: 'normal', type: 'cpu-intensive' }
  );

  console.log('✅ Normal operations completed');
}

/**
 * Scenario 2: Hanging operations (will be detected)
 */
async function hangingOperations() {
  console.log('\n🚨 Scenario 2: Hanging Operations');
  console.log('=================================');

  // This will timeout after 5 seconds
  try {
    await trackOperation(
      async () => {
        console.log('  Starting hanging operation...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        return 'this should timeout';
      },
      'hangingOperation',
      { scenario: 'hanging', shouldTimeout: true }
    );
  } catch (error) {
    console.log(`  Expected timeout: ${error.message}`);
  }

  // Another hanging operation
  try {
    await trackOperation(
      async () => {
        console.log('  Starting another hanging operation...');
        await new Promise(resolve => setTimeout(resolve, 8000)); // 8 seconds
        return 'this should also timeout';
      },
      'anotherHangingOperation',
      { scenario: 'hanging', shouldTimeout: true }
    );
  } catch (error) {
    console.log(`  Expected timeout: ${error.message}`);
  }

  console.log('✅ Hanging operations handled');
}

/**
 * Scenario 3: Memory-intensive operations
 */
async function memoryIntensiveOperations() {
  console.log('\n💾 Scenario 3: Memory-Intensive Operations');
  console.log('==========================================');

  // Large array creation
  await trackOperation(
    () => {
      const array = new Array(1000000).fill(0).map((_, i) => i);
      return array.length;
    },
    'largeArrayCreation',
    { scenario: 'memory', operation: 'array-creation' }
  );

  // Object creation
  await trackOperation(
    () => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < 100000; i++) {
        obj[`key${i}`] = `value${i}`;
      }
      return Object.keys(obj).length;
    },
    'largeObjectCreation',
    { scenario: 'memory', operation: 'object-creation' }
  );

  console.log('✅ Memory-intensive operations completed');
}

/**
 * Scenario 4: Concurrent operations
 */
async function concurrentOperations() {
  console.log('\n⚡ Scenario 4: Concurrent Operations');
  console.log('====================================');

  const operations = [
    trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'concurrent-1';
      },
      'concurrentOperation1',
      { scenario: 'concurrent', id: 1 }
    ),
    trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return 'concurrent-2';
      },
      'concurrentOperation2',
      { scenario: 'concurrent', id: 2 }
    ),
    trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return 'concurrent-3';
      },
      'concurrentOperation3',
      { scenario: 'concurrent', id: 3 }
    ),
  ];

  await Promise.all(operations);
  console.log('✅ Concurrent operations completed');
}

/**
 * Scenario 5: Error scenarios
 */
async function errorScenarios() {
  console.log('\n❌ Scenario 5: Error Scenarios');
  console.log('==============================');

  // Operation that throws an error
  try {
    await trackOperation(
      () => {
        throw new Error('Simulated error');
      },
      'errorOperation',
      { scenario: 'error', type: 'thrown' }
    );
  } catch (error) {
    console.log(`  Expected error: ${error.message}`);
  }

  // Operation that rejects
  try {
    await trackOperation(
      async () => {
        throw new Error('Simulated rejection');
      },
      'rejectionOperation',
      { scenario: 'error', type: 'rejected' }
    );
  } catch (error) {
    console.log(`  Expected rejection: ${error.message}`);
  }

  console.log('✅ Error scenarios handled');
}

// ============================================================================
// MAIN DEMO FUNCTION
// ============================================================================

async function runDemo() {
  console.log('🚀 Event Loop Monitoring Demo');
  console.log('=============================');
  console.log('This demo will show various scenarios and how the monitoring system tracks them.');
  console.log('Press Ctrl+C to stop early.');

  // Configure monitoring
  const config: Partial<HangingDetectionConfig> = {
    timeoutThreshold: 5000, // 5 seconds
    memoryThreshold: 50 * 1024 * 1024, // 50MB
    cpuThreshold: 80,
    eventLoopLagThreshold: 100,
    maxActiveCalls: 50,
    enableStackTrace: true,
    enableMemoryTracking: true,
    enableCpuTracking: true,
    logHangingCalls: true,
    alertOnHanging: true,
  };

  // Start monitoring
  startGlobalMonitoring(1000, config); // Take snapshots every second

  try {
    // Run all scenarios
    await normalOperations();
    await hangingOperations();
    await memoryIntensiveOperations();
    await concurrentOperations();
    await errorScenarios();

    // Wait a bit for any hanging operations to be detected
    console.log('\n⏳ Waiting for hanging operations to be detected...');
    await new Promise(resolve => setTimeout(resolve, 6000));

  } catch (error) {
    console.error('❌ Demo error:', error);
  } finally {
    // Stop monitoring and generate report
    console.log('\n🛑 Stopping monitoring...');
    const snapshots = stopGlobalMonitoring();

    // Show final summary
    const summary = getCallStackSummary();
    console.log('\n📊 Final Summary:');
    console.log(`Total Snapshots: ${snapshots.length}`);
    console.log(`Active Calls: ${summary.summary.totalActive}`);
    console.log(`Completed Calls: ${summary.summary.totalCompleted}`);
    console.log(`Hanging Calls: ${summary.summary.totalHanging}`);
    console.log(`Average Duration: ${summary.summary.averageDuration.toFixed(2)}ms`);
    console.log(`Max Duration: ${summary.summary.maxDuration.toFixed(2)}ms`);

    // Show hanging calls if any
    if (summary.hanging.length > 0) {
      console.log('\n🚨 Hanging Calls Detected:');
      summary.hanging.forEach(call => {
        console.log(`  - ${call.functionName} (${call.duration?.toFixed(2)}ms)`);
        console.log(`    Location: ${call.fileName}:${call.lineNumber}`);
        if (call.metadata) {
          console.log(`    Metadata: ${JSON.stringify(call.metadata)}`);
        }
      });
    }

    // Generate report
    const report = generateMonitoringReport();
    console.log('\n📄 Generated Report:');
    console.log(report);

    // Export data
    exportMonitoringData('fossils/event-loop-demo-data.json');
    console.log('\n📊 Data exported to: fossils/event-loop-demo-data.json');

    console.log('\n✅ Demo completed!');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show real-time call stack
 */
function showCallStack() {
  const summary = getCallStackSummary();
  
  console.log('\n📋 Current Call Stack:');
  console.log(`Active: ${summary.summary.totalActive}`);
  console.log(`Completed: ${summary.summary.totalCompleted}`);
  console.log(`Hanging: ${summary.summary.totalHanging}`);

  if (summary.active.length > 0) {
    console.log('\n🔄 Active Calls:');
    summary.active.forEach(call => {
      const duration = Date.now() - call.timestamp;
      console.log(`  ${call.functionName} (${duration.toFixed(2)}ms)`);
    });
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Demo interrupted by user');
    stopGlobalMonitoring();
    process.exit(0);
  });

  runDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
} 