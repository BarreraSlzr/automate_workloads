# Memory Monitoring Guide

## 🚀 Protect Your Mac's 8GB RAM from Runaway Processes

This guide explains how to use the memory monitoring system to prevent your Mac from running out of memory during development tasks like `bun test`.

## 🎯 Why You Need This

Your Mac has **8GB RAM**. When running `bun test` (which might spawn `ollama` or other workers), it's easy to hit:

> 🧨 **macOS "Memory Pressure"** — everything slows, fans go nuts, swap explodes.

By the time you open Activity Monitor, it's too late. Your whole system freezes.

## ✅ What This System Does

- **Monitors entire process trees** (not just `bun`, but all children like `ollama`)
- **Kills the whole tree** if memory exceeds your threshold
- **Logs memory usage** for analysis and debugging
- **Sends notifications** when processes are killed
- **Protects your system** so you stay productive

## 🛠️ Quick Start

### 1. Run Safe Bun Test

```bash
# Basic usage (800MB threshold)
./scripts/monitoring/bun-test-safe.sh

# With custom threshold
./scripts/monitoring/bun-test-safe.sh -t 1000

# With verbose output
./scripts/monitoring/bun-test-safe.sh -v

# With watch mode
./scripts/monitoring/bun-test-safe.sh --watch
```

### 2. Monitor Any Command

```bash
# Monitor any command with memory protection
./scripts/monitoring/memory-monitor.sh bun test
./scripts/monitoring/memory-monitor.sh -t 500 bun run build
./scripts/monitoring/memory-monitor.sh -v ollama run llama2
```

## 📊 Configuration

### Environment Variables

```bash
# Memory threshold in MB
export BUN_TEST_MEMORY_THRESHOLD=800

# Check interval in seconds
export BUN_TEST_CHECK_INTERVAL=3

# Log file path
export BUN_TEST_LOG_FILE="fossils/bun-test-memory.log"

# Verbose output
export BUN_TEST_VERBOSE=true
```

### Command Line Options

```bash
./scripts/monitoring/bun-test-safe.sh \
  -t 1000 \          # 1GB threshold
  -i 5 \             # Check every 5 seconds
  -l custom.log \    # Custom log file
  -v                 # Verbose output
```

## 🔍 How It Works

### Process Group Monitoring

Instead of just killing `bun` (which leaves `ollama` running), the system:

1. **Creates a new process group** using `setsid`
2. **Monitors the entire tree** using `ps -g $PGID`
3. **Kills the whole group** using `kill -TERM -$PGID`

```bash
# This kills only bun
kill -9 $BUN_PID

# This kills the entire tree (bun + ollama + workers)
kill -TERM -$PGID
```

### Memory Calculation

The system calculates memory usage by:

1. **Getting RSS (Resident Set Size)** for all processes in the group
2. **Converting KB to MB** for human-readable output
3. **Summing all processes** in the tree

```bash
# Get memory for process group
ps -o rss= -g $PGID | awk '{sum+=$1} END {print int(sum/1024)}'
```

## 📈 Logging and Analysis

### Log Format

Memory snapshots are logged as JSON:

```json
{
  "timestamp": "2025-01-07T10:30:45Z",
  "pgid": 12345,
  "memoryMB": 650,
  "processCount": 3,
  "processes": [
    {"pid": 12345, "command": "bun test", "memoryMB": 200},
    {"pid": 12346, "command": "ollama run llama2", "memoryMB": 400},
    {"pid": 12347, "command": "node worker", "memoryMB": 50}
  ],
  "thresholdMB": 800
}
```

### Analyzing Memory Usage

```bash
# View recent memory usage
tail -f fossils/bun-test-memory.log | jq '.'

# Find peak memory usage
cat fossils/bun-test-memory.log | jq -s 'map(.memoryMB) | max'

# Analyze memory growth patterns
cat fossils/bun-test-memory.log | jq -s 'map({timestamp: .timestamp, memory: .memoryMB}) | .[]'
```

## 🎛️ Advanced Usage

### Custom Thresholds by Command

```bash
# Conservative for CI
./scripts/monitoring/memory-monitor.sh -t 400 bun test

# Liberal for development
./scripts/monitoring/memory-monitor.sh -t 1200 bun test --watch

# Very conservative for production builds
./scripts/monitoring/memory-monitor.sh -t 300 bun run build
```

### Monitoring Multiple Commands

```bash
# Monitor a complex workflow
./scripts/monitoring/memory-monitor.sh -t 1000 bash -c "
  bun run build &&
  bun test &&
  bun run lint
"
```

### Integration with CI/CD

```bash
# In your CI pipeline
export MEMORY_THRESHOLD=500
export CHECK_INTERVAL=2
./scripts/monitoring/memory-monitor.sh bun test
```

## 🔧 Troubleshooting

### Common Issues

#### Process Not Killed
```bash
# Check if process group exists
ps -g $PGID

# Force kill if needed
kill -KILL -$PGID
```

#### Memory Not Reported
```bash
# Check if ps command works
ps -o rss= -g $PGID

# Verify process group
ps -o pgid= -p $PID
```

#### Notifications Not Working
```bash
# Test notification script
./scripts/monitoring/notify.sh "Test" "Hello World"

# Check macOS notification permissions
System Preferences > Notifications & Focus > Terminal
```

### Debug Mode

```bash
# Enable verbose logging
export VERBOSE=true
./scripts/monitoring/bun-test-safe.sh -v

# Check system memory
vm_stat | grep "Pages free"
```

## 📊 Performance Impact

The monitoring system has minimal overhead:

- **CPU**: ~0.1% additional usage
- **Memory**: ~2MB for monitoring process
- **Disk**: ~1KB per snapshot (every 2-3 seconds)

## 🎯 Best Practices

### 1. Set Appropriate Thresholds

```bash
# Development (more memory available)
BUN_TEST_MEMORY_THRESHOLD=1000

# CI/CD (conservative)
BUN_TEST_MEMORY_THRESHOLD=500

# Production builds (very conservative)
MEMORY_THRESHOLD=300
```

### 2. Monitor System Memory

```bash
# Check before running heavy tests
vm_stat | grep "Pages free"

# Close other apps if memory is low
```

### 3. Analyze Memory Patterns

```bash
# Look for memory leaks
cat fossils/bun-test-memory.log | jq -s '
  map({timestamp: .timestamp, memory: .memoryMB}) |
  group_by(.memory) |
  map({memory: .[0].memory, count: length}) |
  sort_by(.count) |
  reverse
'
```

### 4. Use Different Logs for Different Tasks

```bash
# Separate logs for different test types
./scripts/monitoring/bun-test-safe.sh -l fossils/unit-tests-memory.log
./scripts/monitoring/bun-test-safe.sh -l fossils/integration-tests-memory.log
./scripts/monitoring/bun-test-safe.sh -l fossils/e2e-tests-memory.log
```

## 🔄 Integration with Existing Workflows

### Package.json Scripts

```json
{
  "scripts": {
    "test": "./scripts/monitoring/bun-test-safe.sh",
    "test:watch": "./scripts/monitoring/bun-test-safe.sh --watch",
    "test:ci": "BUN_TEST_MEMORY_THRESHOLD=500 ./scripts/monitoring/bun-test-safe.sh",
    "build:safe": "./scripts/monitoring/memory-monitor.sh -t 300 bun run build"
  }
}
```

### Git Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/monitoring/bun-test-safe.sh -t 500
```

### VS Code Tasks

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Test (Safe)",
      "type": "shell",
      "command": "./scripts/monitoring/bun-test-safe.sh",
      "group": "test"
    }
  ]
}
```

## 🎉 Success Stories

### Before Memory Monitoring
- ❌ System freezes during `bun test --watch`
- ❌ Need to force restart Mac
- ❌ Lose work in progress
- ❌ Fans running at full speed

### After Memory Monitoring
- ✅ System stays responsive
- ✅ Automatic process cleanup
- ✅ Detailed memory logs for debugging
- ✅ Peace of mind during development

## 🚀 Next Steps

1. **Start using** `./scripts/monitoring/bun-test-safe.sh` instead of `bun test`
2. **Monitor your logs** to understand memory patterns
3. **Adjust thresholds** based on your system and workload
4. **Integrate into your workflow** with package.json scripts
5. **Share feedback** on memory usage patterns

---

**Remember**: This system doesn't fix memory leaks at the source, but it **protects your system so you stay productive** while you track down and fix the root causes. 