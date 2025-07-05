# Automatic Procedure Guide

## Overview

This guide explains the **automatic procedure system** that combines TypeScript validation, testing, and git diff analysis to ensure quality and track changes automatically. The system is designed to **address logs better** and use **git diff analysis** to ensure automatic procedures work correctly.

## 🎯 Best Order for Addressing Logs & Automation

### 1. **TypeScript/Interface Validation First** ✅
```bash
bun run tsc --noEmit
```
- Catches type errors before runtime
- Validates all schemas and interfaces
- Ensures type safety across the codebase
- **Why first?** Type errors can cascade and cause runtime issues

### 2. **Test Suite Validation** ✅
```bash
bun test
```
- Ensures existing functionality works
- Catches regressions from new changes
- Validates predictive monitoring logic
- **Why second?** Tests verify that code changes don't break existing features

### 3. **Git Diff Analysis for Automatic Procedures** 🎯
```bash
bun run scripts/analyze-git-diff.ts analyze
```
- Automatically detects what files changed
- Identifies new monitoring data and log patterns
- Tracks evolution of the predictive monitoring system
- **Why third?** Git diff provides context about what was changed and why

## 🔍 Git Diff as Automatic Procedure Driver

### **What Git Diff Can Tell Us Automatically:**

#### **Monitoring Data Tracking**
- **New monitoring files** in `fossils/monitoring/`
- **Updated schemas** in `src/types/schemas.ts`
- **New CLI commands** added
- **Log format changes** or improvements
- **Performance metrics** over time

#### **Change Analysis**
```bash
# Analyze recent changes
bun run scripts/analyze-git-diff.ts analyze --verbose

# Track monitoring evolution over time
bun run scripts/analyze-git-diff.ts track --days=7
```

#### **Automatic Detection**
- **File changes** with impact assessment (high/medium/low)
- **Log patterns** (console.log, fossilization, monitoring references)
- **Risk factors** based on changes
- **Recommendations** for next steps

## 🚀 Automatic Procedure Script

### **Full Procedure**
```bash
bun run scripts/automatic-procedure.ts full
```

**Order of Operations:**
1. **TypeScript validation** (`tsc --noEmit`)
2. **Test suite execution** (`bun test`)
3. **Git diff analysis** for monitoring changes
4. **Generate comprehensive report**

### **Quick Validation**
```bash
bun run scripts/automatic-procedure.ts quick
```

**Fast path for development:**
- TypeScript validation only
- Test suite execution only
- No git analysis (for speed)

### **Individual Steps**
```bash
# TypeScript only
bun run scripts/automatic-procedure.ts typescript

# Tests only
bun run scripts/automatic-procedure.ts test

# Git analysis only
bun run scripts/automatic-procedure.ts git
```

## 📊 Git Diff Analysis Features

### **File Change Analysis**
```typescript
interface FileChange {
  file: string;
  additions: number;
  deletions: number;
  type: 'added' | 'modified' | 'deleted';
  impact: 'high' | 'medium' | 'low';
}
```

### **Log Pattern Detection**
- `console.log` statements
- `console.warn` statements
- `console.error` statements
- `fossilize` calls
- `monitoring` references
- `predictive` monitoring
- `rate limit` handling
- `LLM` service usage

### **Automatic Recommendations**
- **Monitoring changes**: Run predictive monitoring tests
- **Schema changes**: Run type checking, update dependent code
- **CLI changes**: Test new commands, update documentation
- **Log patterns**: Review for production readiness
- **Rate limit handling**: Test with real API calls

## 🔄 Monitoring Evolution Tracking

### **Historical Analysis**
```bash
bun run scripts/analyze-git-diff.ts track --days=30 --output=evolution.json
```

**Tracks:**
- Commits with monitoring changes
- Evolution of predictive monitoring features
- Patterns in monitoring data generation
- Performance improvements over time

### **Evolution Data Structure**
```typescript
interface EvolutionData {
  period: string;
  totalCommits: number;
  monitoringCommits: number;
  evolution: Array<{
    commit: string;
    message: string;
    timestamp: string;
    hasMonitoringChanges: boolean;
  }>;
}
```

## 📈 Predictive Monitoring Integration

### **Pre-Call Logging**
The predictive monitoring system automatically logs before each LLM call:

```typescript
// Computable metrics
preCallMetrics: {
  estimatedTokens: number;
  estimatedCost: number;
  messageComplexity: number;
  recentCallFrequency: number;
  recentErrorRate: number;
  // ... more metrics
}

// Human-readable context
humanReadableContext: {
  userIntent: string;
  currentWorkflow: string;
  gitContext: GitContext;
  systemContext: SystemContext;
  // ... more context
}
```

### **Git Diff Integration**
Git diff analysis helps track:
- **New monitoring features** added
- **Log format improvements**
- **Schema changes** for monitoring data
- **CLI enhancements** for monitoring

## 🎯 Benefits of This Approach

### **1. Proactive Error Detection**
- Catch type errors before runtime
- Identify potential issues through git diff analysis
- Validate changes before they cause problems

### **2. Systematic Quality Assurance**
- Consistent validation order
- Automated testing and analysis
- Comprehensive reporting

### **3. Change Tracking & Evolution**
- Track how monitoring system evolves
- Identify patterns in changes
- Generate actionable recommendations

### **4. CLI-Friendly Logs**
- Easy to read and understand
- Actionable recommendations
- Historical context through git diff

## 📋 Usage Examples

### **Development Workflow**
```bash
# 1. Make changes to code
# 2. Run quick validation
bun run scripts/automatic-procedure.ts quick

# 3. If quick validation passes, run full procedure
bun run scripts/automatic-procedure.ts full

# 4. Review git diff analysis
bun run scripts/analyze-git-diff.ts analyze --verbose
```

### **Continuous Integration**
```bash
# In CI pipeline
bun run scripts/automatic-procedure.ts full --output=ci-results --no-save
```

### **Monitoring System Evolution**
```bash
# Track last 7 days of monitoring changes
bun run scripts/analyze-git-diff.ts track --days=7 --output=weekly-evolution.json
```

## 🔧 Configuration

### **Automatic Procedure Options**
```typescript
interface ProcedureOptions {
  outputDir?: string;        // Default: 'fossils/procedures'
  saveReport?: boolean;      // Default: true
  verbose?: boolean;         // Default: false
}
```

### **Git Diff Analysis Options**
```typescript
interface GitDiffOptions {
  since?: string;            // Date range start
  until?: string;            // Date range end
  output?: string;           // Output file
  verbose?: boolean;         // Detailed output
}
```

## 📊 Reports and Output

### **Automatic Procedure Report**
- **Markdown report** with step-by-step results
- **JSON data** for programmatic analysis
- **Recommendations** for next steps
- **Timing information** for performance tracking

### **Git Diff Analysis Report**
- **File change summary** with impact assessment
- **Log pattern detection** results
- **Monitoring evolution** tracking
- **Actionable recommendations**

## 🚨 Error Handling

### **TypeScript Errors**
- Detailed error messages with file locations
- Recommendations for fixing type issues
- Impact assessment on overall procedure

### **Test Failures**
- Specific test failure details
- Recommendations for fixing test issues
- Integration with git diff for context

### **Git Analysis Issues**
- Repository status validation
- Change detection accuracy
- Fallback options for analysis

## 🔮 Future Enhancements

### **Planned Features**
- **Real-time monitoring** integration
- **Performance benchmarking** over time
- **Automated fix suggestions** for common issues
- **Integration with CI/CD** pipelines
- **Dashboard visualization** of evolution data

### **Advanced Analysis**
- **Machine learning** for pattern recognition
- **Predictive analytics** for potential issues
- **Cross-repository** analysis
- **Team collaboration** insights

## 📚 Related Documentation

- [Type and Schema Patterns](../docs/TYPE_AND_SCHEMA_PATTERNS.md)
- [LLM Predictive Monitoring](../src/services/llmPredictiveMonitoring.ts)
- [Git Diff Analysis](../scripts/analyze-git-diff.ts)
- [Automatic Procedure](../scripts/automatic-procedure.ts)

---

*This guide demonstrates how the automatic procedure system addresses logs better through systematic validation, testing, and git diff analysis, ensuring quality and tracking changes automatically.* 