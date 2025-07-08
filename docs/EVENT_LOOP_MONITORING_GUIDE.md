# Event Loop Monitoring Guide

A comprehensive guide to monitoring event loop calls, detecting hanging operations, and analyzing performance bottlenecks in Node.js/Bun applications.

## Overview

The Event Loop Monitoring system provides real-time tracking of function calls, automatic detection of hanging operations, and detailed performance analysis. It's designed to help developers identify performance issues, infinite loops, and resource leaks in their applications.

## Features

- 🔍 **Real-time Call Stack Tracking**: Monitor all function calls with stack traces
- 🚨 **Automatic Hanging Detection**: Detect operations that exceed timeout thresholds
- 📊 **Performance Metrics**: Track memory usage, CPU usage, and execution times
- 📈 **Snapshot Analysis**: Take periodic snapshots of the event loop state
- 🎯 **Configurable Thresholds**: Customize timeout, memory, and CPU thresholds
- 📄 **Detailed Reporting**: Generate comprehensive reports and export data
- ⚡ **Low Overhead**: Minimal performance impact with efficient tracking

## Quick Start

### 1. Basic Usage

```typescript
import { startGlobalMonitoring, trackOperation, stopGlobalMonitoring } from './src/utils/eventLoopMonitor';

// Start monitoring
startGlobalMonitoring(1000); // Take snapshots every 1 second

// Track operations
await trackOperation(
  async () => {
    // Your operation here
    await someAsyncOperation();
    return 'result';
  },
  'myOperation',
  { metadata: 'additional info' }
);

// Stop monitoring and get results
const snapshots = stopGlobalMonitoring();
```

### 2. CLI Usage

```bash
# Start monitoring with test operations
bun run monitor:event-loop start

# Monitor a specific script
bun run monitor:event-loop monitor scripts/my-script.ts

# Show current call stack
bun run monitor:event-loop stack

# Generate a report
bun run monitor:event-loop report

# Stop monitoring
bun run monitor:event-loop stop
```

### 3. Demo

```bash
# Run the comprehensive demo
bun run monitor:event-loop:demo
```

## Configuration

### Hanging Detection Config

```typescript
import { HangingDetectionConfig } from './src/utils/eventLoopMonitor';

const config: Partial<HangingDetectionConfig> = {
  timeoutThreshold: 5000,        // 5 seconds
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  cpuThreshold: 80,              // 80%
  eventLoopLagThreshold: 100,    // 100ms
  maxActiveCalls: 100,           // Maximum concurrent calls
  enableStackTrace: true,        // Capture stack traces
  enableMemoryTracking: true,    // Track memory usage
  enableCpuTracking: true,       // Track CPU usage
  logHangingCalls: true,         // Log hanging calls
  alertOnHanging: true,          // Show alerts for hanging calls
};
```

### Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| `timeoutThreshold` | 5000ms | Maximum time before considering a call "hanging" |
| `memoryThreshold` | 100MB | Memory usage threshold for alerts |
| `cpuThreshold` | 80% | CPU usage threshold for alerts |
| `eventLoopLagThreshold` | 100ms | Event loop lag threshold |
| `maxActiveCalls` | 100 | Maximum number of concurrent calls |
| `enableStackTrace` | true | Capture detailed stack traces |
| `enableMemoryTracking` | true | Track memory usage |
| `enableCpuTracking` | true | Track CPU usage |
| `logHangingCalls` | true | Log hanging calls to console |
| `alertOnHanging` | true | Show alerts for hanging calls |

## API Reference

### Core Functions

#### `startGlobalMonitoring(intervalMs?, config?)`

Start global event loop monitoring.

```typescript
startGlobalMonitoring(1000, {
  timeoutThreshold: 5000,
  memoryThreshold: 50 * 1024 * 1024,
});
```

#### `stopGlobalMonitoring()`

Stop global monitoring and return snapshots.

```typescript
const snapshots = stopGlobalMonitoring();
```

#### `trackOperation(operation, functionName?, metadata?)`

Track a single operation with timeout protection.

```typescript
const result = await trackOperation(
  async () => {
    // Your operation
    return 'result';
  },
  'myFunction',
  { userId: 123, operation: 'data-processing' }
);
```

#### `getCallStackSummary()`

Get current call stack summary.

```typescript
const summary = getCallStackSummary();
console.log(`Active calls: ${summary.summary.totalActive}`);
console.log(`Hanging calls: ${summary.summary.totalHanging}`);
```

### EventLoopMonitor Class

#### Constructor

```typescript
import { EventLoopMonitor } from './src/utils/eventLoopMonitor';

const monitor = new EventLoopMonitor({
  timeoutThreshold: 3000,
  memoryThreshold: 50 * 1024 * 1024,
});
```

#### Methods

##### `startMonitoring(intervalMs?)`

Start monitoring with specified snapshot interval.

```typescript
monitor.startMonitoring(1000); // Snapshots every 1 second
```

##### `stopMonitoring()`

Stop monitoring and return snapshots.

```typescript
const snapshots = monitor.stopMonitoring();
```

##### `trackCall(functionName, operation, metadata?)`

Track a function call with detailed monitoring.

```typescript
const result = await monitor.trackCall(
  'processData',
  async () => {
    // Your operation
    return processedData;
  },
  { batchSize: 1000, priority: 'high' }
);
```

##### `getStatus()`

Get current monitoring status.

```typescript
const status = monitor.getStatus();
console.log(`Monitoring active: ${status.isMonitoring}`);
console.log(`Active calls: ${status.activeCalls}`);
```

##### `getCallStackSummary()`

Get detailed call stack summary.

```typescript
const summary = monitor.getCallStackSummary();
console.log('Active calls:', summary.active);
console.log('Hanging calls:', summary.hanging);
console.log('Recent calls:', summary.recent);
```

##### `generateReport()`

Generate a human-readable report.

```typescript
const report = monitor.generateReport();
console.log(report);
```

##### `exportData(filePath)`

Export monitoring data to file.

```typescript
monitor.exportData('fossils/event-loop-data.json');
```

##### `clear()`

Clear all monitoring data.

```typescript
monitor.clear();
```

## CLI Commands

### `monitor:event-loop start`

Start monitoring with test operations.

**Options:**
- `--verbose, -v`: Enable verbose output
- `--output <file>`: Output file for reports
- `--interval <ms>`: Snapshot interval (default: 1000ms)
- `--timeout <ms>`: Timeout threshold (default: 5000ms)
- `--memory <mb>`: Memory threshold in MB (default: 100)

**Example:**
```bash
bun run monitor:event-loop start --interval 500 --timeout 3000 --memory 50
```

### `monitor:event-loop monitor <script>`

Monitor a specific script.

**Example:**
```bash
bun run monitor:event-loop monitor scripts/my-script.ts
```

### `monitor:event-loop stack`

Show current call stack summary.

**Example:**
```bash
bun run monitor:event-loop stack
```

### `monitor:event-loop report`

Generate a quick monitoring report.

**Example:**
```bash
bun run monitor:event-loop report --output fossils/report.md
```

### `monitor:event-loop stop`

Stop monitoring and generate final report.

**Example:**
```bash
bun run monitor:event-loop stop
```

## Use Cases

### 1. Debugging Hanging Operations

```typescript
import { trackOperation } from './src/utils/eventLoopMonitor';

// Wrap suspicious operations
try {
  await trackOperation(
    async () => {
      // This might hang
      await someExternalAPI();
    },
    'externalAPICall',
    { endpoint: '/api/data', timeout: 5000 }
  );
} catch (error) {
  if (error.message.includes('timed out')) {
    console.log('Operation hung - investigate external API');
  }
}
```

### 2. Performance Profiling

```typescript
import { startGlobalMonitoring, stopGlobalMonitoring } from './src/utils/eventLoopMonitor';

// Profile a complex workflow
startGlobalMonitoring(100);

await complexWorkflow();

const snapshots = stopGlobalMonitoring();
const summary = getCallStackSummary();

console.log(`Average duration: ${summary.summary.averageDuration}ms`);
console.log(`Max duration: ${summary.summary.maxDuration}ms`);
```

### 3. Memory Leak Detection

```typescript
import { EventLoopMonitor } from './src/utils/eventLoopMonitor';

const monitor = new EventLoopMonitor({
  memoryThreshold: 50 * 1024 * 1024, // 50MB
  enableMemoryTracking: true,
});

monitor.startMonitoring(1000);

// Run operations that might leak memory
for (let i = 0; i < 1000; i++) {
  await monitor.trackCall(
    'memoryIntensiveOperation',
    () => {
      // This might leak memory
      return new Array(10000).fill(0);
    }
  );
}

const snapshots = monitor.stopMonitoring();
// Check for memory growth in snapshots
```

### 4. Production Monitoring

```typescript
import { startGlobalMonitoring, trackOperation } from './src/utils/eventLoopMonitor';

// Start monitoring in production
startGlobalMonitoring(5000, {
  timeoutThreshold: 30000, // 30 seconds for production
  memoryThreshold: 200 * 1024 * 1024, // 200MB
  logHangingCalls: true,
  alertOnHanging: true,
});

// Wrap critical operations
app.post('/api/process', async (req, res) => {
  try {
    const result = await trackOperation(
      async () => {
        return await processUserData(req.body);
      },
      'processUserData',
      { userId: req.body.userId, dataSize: req.body.data.length }
    );
    res.json(result);
  } catch (error) {
    if (error.message.includes('timed out')) {
      res.status(408).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

## Integration with Existing Code

### Decorator Pattern

```typescript
import { trackCall } from './src/utils/eventLoopMonitor';

class DataProcessor {
  @trackCall({ type: 'data-processing' })
  async processData(data: any[]) {
    // Your processing logic
    return processedData;
  }
}
```

### Wrapper Functions

```typescript
import { trackOperation } from './src/utils/eventLoopMonitor';

// Wrap existing functions
const originalFunction = async (data: any) => {
  // Original logic
};

const monitoredFunction = async (data: any) => {
  return trackOperation(
    () => originalFunction(data),
    'originalFunction',
    { dataType: typeof data }
  );
};
```

### Middleware Integration

```typescript
import { trackOperation } from './src/utils/eventLoopMonitor';

// Express middleware
app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    await trackOperation(
      () => next(),
      `${req.method} ${req.path}`,
      { 
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    if (error.message.includes('timed out')) {
      res.status(408).json({ error: 'Request timeout' });
    } else {
      next(error);
    }
  }
});
```

## Performance Considerations

### Overhead

The monitoring system is designed to have minimal overhead:

- **Memory**: ~1-5MB additional memory usage
- **CPU**: <1% CPU overhead during normal operation
- **Latency**: <1ms per tracked operation

### Optimization Tips

1. **Use appropriate snapshot intervals**: Higher frequency = more overhead
2. **Limit metadata size**: Large metadata objects increase memory usage
3. **Disable unused features**: Turn off CPU/memory tracking if not needed
4. **Clear data periodically**: Use `monitor.clear()` to free memory

### Production Settings

```typescript
const productionConfig = {
  timeoutThreshold: 30000,        // 30 seconds
  memoryThreshold: 500 * 1024 * 1024, // 500MB
  cpuThreshold: 90,               // 90%
  eventLoopLagThreshold: 200,     // 200ms
  maxActiveCalls: 1000,           // Higher limit for production
  enableStackTrace: false,        // Disable for performance
  enableMemoryTracking: true,     // Keep enabled
  enableCpuTracking: false,       // Disable for performance
  logHangingCalls: true,          // Keep enabled
  alertOnHanging: true,           // Keep enabled
};
```

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Symptoms**: Memory usage grows continuously
**Solutions**:
- Reduce snapshot frequency
- Clear monitoring data periodically
- Limit metadata size
- Disable unused tracking features

#### 2. False Positives

**Symptoms**: Operations marked as hanging when they're not
**Solutions**:
- Increase timeout threshold
- Check for legitimate long-running operations
- Use more specific function names
- Add appropriate metadata

#### 3. Performance Impact

**Symptoms**: Application becomes slower
**Solutions**:
- Increase snapshot interval
- Disable stack trace capture
- Use production configuration
- Monitor only critical operations

#### 4. Missing Data

**Symptoms**: Expected calls not appearing in reports
**Solutions**:
- Ensure monitoring is started before operations
- Check that operations are wrapped with `trackOperation`
- Verify timeout thresholds are appropriate
- Check for early process termination

### Debug Mode

Enable debug mode for detailed logging:

```typescript
import { EventLoopMonitor } from './src/utils/eventLoopMonitor';

const monitor = new EventLoopMonitor({
  logHangingCalls: true,
  alertOnHanging: true,
  enableStackTrace: true,
});

// Debug output will show:
// - All tracked calls
// - Snapshot details
// - Memory/CPU metrics
// - Hanging call alerts
```

## Best Practices

### 1. Strategic Monitoring

- Monitor critical paths only
- Use appropriate timeout thresholds
- Focus on user-facing operations
- Monitor database and external API calls

### 2. Configuration Management

- Use different configs for development and production
- Adjust thresholds based on application characteristics
- Monitor resource usage of the monitoring system itself
- Regular review and adjustment of settings

### 3. Data Management

- Export data regularly for analysis
- Clear old data to prevent memory leaks
- Archive important reports
- Use data for capacity planning

### 4. Integration

- Integrate with existing logging systems
- Connect with alerting systems
- Use data for performance optimization
- Include in CI/CD pipelines

## Examples

### Complete Example

```typescript
#!/usr/bin/env bun

import { 
  startGlobalMonitoring, 
  trackOperation, 
  stopGlobalMonitoring,
  getCallStackSummary 
} from './src/utils/eventLoopMonitor';

async function main() {
  console.log('🚀 Starting application with monitoring...');
  
  // Start monitoring
  startGlobalMonitoring(1000, {
    timeoutThreshold: 5000,
    memoryThreshold: 100 * 1024 * 1024,
    logHangingCalls: true,
    alertOnHanging: true,
  });

  try {
    // Simulate application operations
    await trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'quick operation';
      },
      'quickOperation'
    );

    await trackOperation(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return 'medium operation';
      },
      'mediumOperation'
    );

    // This will timeout
    try {
      await trackOperation(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return 'hanging operation';
        },
        'hangingOperation'
      );
    } catch (error) {
      console.log(`Expected timeout: ${error.message}`);
    }

  } finally {
    // Stop monitoring and generate report
    const snapshots = stopGlobalMonitoring();
    const summary = getCallStackSummary();
    
    console.log('\n📊 Final Summary:');
    console.log(`Snapshots: ${snapshots.length}`);
    console.log(`Completed: ${summary.summary.totalCompleted}`);
    console.log(`Hanging: ${summary.summary.totalHanging}`);
    console.log(`Average Duration: ${summary.summary.averageDuration.toFixed(2)}ms`);
  }
}

main().catch(console.error);
```

## Conclusion

The Event Loop Monitoring system provides powerful tools for detecting and analyzing performance issues in Node.js/Bun applications. By following the patterns and best practices outlined in this guide, you can effectively monitor your applications and prevent hanging operations from affecting user experience.

For more advanced usage and integration patterns, refer to the test files and examples in the codebase. 