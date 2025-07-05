# 🔍 Workflow Utility Detection Rule

## 📋 Overview

This rule provides a systematic approach to identify missing utilities in workflows by analyzing fossil query patterns, automation gaps, and performance anti-patterns. It serves as a checklist for code reviews and automated detection.

## 🎯 Rule Purpose

**Goal**: Ensure all workflows use appropriate fossil query methods and have necessary utilities for efficient operation.

**Scope**: All automation workflows, CLI scripts, and fossil management operations.

**Enforcement**: Code review checklist, automated linting, and performance monitoring.

## 🔍 Detection Patterns

### 1. Query Method Misuse

#### Pattern: Using `findSimilarFossils()` for Simple Queries
**Detection**: Using similarity search for exact matches or simple filtering
**Impact**: Performance degradation, unnecessary complexity
**Fix**: Replace with `queryEntries()` for structured queries

```typescript
// ❌ Anti-pattern
const similarFossils = await fossilService['findSimilarFossils'](title, content, 100);
const exactMatch = similarFossils.find(f => f.similarity === 100);

// ✅ Correct pattern
const exactMatches = await fossilService.queryEntries({
  limit: 1,
  offset: 0,
  search: title,
  type: 'decision'
});
```

#### Pattern: Loading All Entries for Filtering
**Detection**: Using `getAllEntries()` followed by manual filtering
**Impact**: Memory waste, poor performance
**Fix**: Use `queryEntries()` with appropriate filters

```typescript
// ❌ Anti-pattern
const allEntries = await fossilService.getAllEntries();
const decisions = allEntries.filter(e => e.type === 'decision');

// ✅ Correct pattern
const decisions = await fossilService.queryEntries({
  type: 'decision',
  limit: 100,
  offset: 0
});
```

### 2. Missing Deduplication

#### Pattern: Creating Fossils Without Duplicate Check
**Detection**: Direct `addEntry()` calls without similarity check
**Impact**: Duplicate fossils, data inconsistency
**Fix**: Always check for duplicates before creation

```typescript
// ❌ Anti-pattern
await fossilService.addEntry(newEntry);

// ✅ Correct pattern
const similarFossils = await fossilService['findSimilarFossils'](
  newEntry.title,
  newEntry.content,
  80
);

if (similarFossils.length === 0) {
  await fossilService.addEntry(newEntry);
} else {
  console.log(`⚠️ Similar fossil exists: ${similarFossils[0].fossil.title}`);
  return similarFossils[0].fossil;
}
```

### 3. Missing Relationship Tracking

#### Pattern: Creating Isolated Fossils
**Detection**: Fossils created without parent-child relationships
**Impact**: Lost context, poor traceability
**Fix**: Maintain relationship hierarchy

```typescript
// ❌ Anti-pattern
await fossilService.addEntry({
  type: 'plan',
  title: 'Migration Plan',
  content: 'Plan content...'
});

await fossilService.addEntry({
  type: 'action',
  title: 'Execute Migration',
  content: 'Action content...'
});

// ✅ Correct pattern
const planFossil = await fossilService.addEntry({
  type: 'plan',
  title: 'Migration Plan',
  content: 'Plan content...'
});

const actionFossil = await fossilService.addEntry({
  type: 'action',
  title: 'Execute Migration',
  content: 'Action content...',
  parentId: planFossil.id
});
```

### 4. Performance Anti-Patterns

#### Pattern: No Pagination for Large Datasets
**Detection**: Loading large datasets without pagination
**Impact**: Memory issues, slow performance
**Fix**: Implement pagination for datasets > 100 items

```typescript
// ❌ Anti-pattern
const allEntries = await fossilService.queryEntries({
  limit: 10000,
  offset: 0
});

// ✅ Correct pattern
const processLargeDataset = async () => {
  const batchSize = 100;
  const results = [];
  
  for (let offset = 0; ; offset += batchSize) {
    const batch = await fossilService.queryEntries({
      limit: batchSize,
      offset
    });
    
    if (batch.length === 0) break;
    results.push(...batch);
  }
  
  return results;
};
```

#### Pattern: Inefficient Search Patterns
**Detection**: Multiple individual queries instead of batch operations
**Impact**: Poor performance, excessive API calls
**Fix**: Use batch queries and caching

```typescript
// ❌ Anti-pattern
for (const tag of tags) {
  const entries = await fossilService.queryEntries({
    tags: [tag],
    limit: 10,
    offset: 0
  });
  results.push(...entries);
}

// ✅ Correct pattern
const entries = await fossilService.queryEntries({
  tags: tags,
  limit: 100,
  offset: 0
});
```

## 🛠️ Automated Detection

### 1. Linting Rules

```typescript
// ESLint rule for detecting anti-patterns
const fossilQueryRules = {
  'no-findSimilarFossils-for-exact-match': {
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.property?.name === 'findSimilarFossils') {
            const args = node.arguments;
            if (args.length >= 3 && args[2].value === 100) {
              context.report({
                node,
                message: 'Use queryEntries() for exact matches instead of findSimilarFossils() with 100% threshold'
              });
            }
          }
        }
      };
    }
  },
  
  'no-getAllEntries-for-filtering': {
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.property?.name === 'getAllEntries') {
            const parent = node.parent;
            if (parent.type === 'MemberExpression' && 
                parent.property?.name === 'filter') {
              context.report({
                node,
                message: 'Use queryEntries() with filters instead of getAllEntries().filter()'
              });
            }
          }
        }
      };
    }
  }
};
```

### 2. Code Analysis Script

```typescript
// Automated detection script
const detectWorkflowIssues = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Pattern 1: findSimilarFossils with 100% threshold
  const similarityPattern = /findSimilarFossils\([^,]+,\s*[^,]+,\s*100\)/g;
  if (similarityPattern.test(content)) {
    issues.push({
      type: 'performance',
      pattern: 'findSimilarFossils with 100% threshold',
      suggestion: 'Use queryEntries() for exact matches',
      severity: 'medium'
    });
  }
  
  // Pattern 2: getAllEntries followed by filter
  const filterPattern = /getAllEntries\(\)\.filter\(/g;
  if (filterPattern.test(content)) {
    issues.push({
      type: 'performance',
      pattern: 'getAllEntries().filter()',
      suggestion: 'Use queryEntries() with appropriate filters',
      severity: 'high'
    });
  }
  
  // Pattern 3: addEntry without duplicate check
  const addEntryPattern = /addEntry\([^)]*\)(?!.*findSimilarFossils)/g;
  if (addEntryPattern.test(content)) {
    issues.push({
      type: 'data-quality',
      pattern: 'addEntry without duplicate check',
      suggestion: 'Check for duplicates before adding entries',
      severity: 'medium'
    });
  }
  
  return issues;
};
```

### 3. Performance Monitoring

```typescript
// Performance monitoring wrapper
const monitorFossilQueries = async <T>(
  method: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;
  
  // Log performance metrics
  console.log(`Fossil query ${method}: ${duration}ms`);
  
  // Alert on slow queries
  if (duration > 1000) {
    console.warn(`⚠️ Slow fossil query detected: ${method} took ${duration}ms`);
  }
  
  return result;
};

// Usage
const entries = await monitorFossilQueries(
  'queryEntries',
  () => fossilService.queryEntries({ limit: 100, offset: 0 })
);
```

## 📋 Code Review Checklist

### Before Code Review
- [ ] **Query method selection**: Is the fastest appropriate method being used?
- [ ] **Deduplication**: Are duplicates being checked before fossil creation?
- [ ] **Relationship tracking**: Are parent-child relationships being maintained?
- [ ] **Performance**: Are large datasets being handled efficiently?
- [ ] **Error handling**: Are query failures being handled gracefully?
- [ ] **Consistency**: Are similar queries using the same patterns?

### During Code Review
- [ ] **Pattern compliance**: Does the code follow established query patterns?
- [ ] **Performance impact**: Will this code scale with larger datasets?
- [ ] **Data integrity**: Will this maintain fossil data quality?
- [ ] **Maintainability**: Is the code easy to understand and modify?
- [ ] **Testability**: Can this code be easily tested?

### After Code Review
- [ ] **Performance testing**: Has the code been tested with realistic data volumes?
- [ ] **Integration testing**: Does it work correctly with other components?
- [ ] **Documentation**: Are the query patterns documented?
- [ ] **Monitoring**: Are performance metrics being tracked?

## 🚨 Common Issues and Solutions

### Issue 1: Slow Query Performance
**Symptoms**: Queries taking > 1 second
**Causes**: Using wrong query method, no pagination, inefficient filtering
**Solutions**:
- Use `queryEntries()` instead of `findSimilarFossils()` for exact matches
- Implement pagination for large datasets
- Use appropriate filters instead of post-processing

### Issue 2: Memory Exhaustion
**Symptoms**: Out of memory errors, slow system performance
**Causes**: Loading all entries, no pagination, large result sets
**Solutions**:
- Use pagination for datasets > 100 items
- Stream results instead of loading all at once
- Use targeted queries instead of broad searches

### Issue 3: Duplicate Fossils
**Symptoms**: Multiple fossils with similar content
**Causes**: No duplicate checking, low similarity thresholds
**Solutions**:
- Always check for duplicates before creation
- Use appropriate similarity thresholds (80%+ for deduplication)
- Implement content hashing for exact duplicate detection

### Issue 4: Lost Relationships
**Symptoms**: Fossils without context, poor traceability
**Causes**: Not maintaining parent-child relationships
**Solutions**:
- Always set `parentId` when creating related fossils
- Use `getRelatedEntries()` to traverse relationships
- Maintain relationship metadata

## 📊 Metrics and Monitoring

### Key Performance Indicators

```typescript
interface FossilQueryMetrics {
  // Performance metrics
  averageQueryTime: number;
  slowQueryCount: number;
  memoryUsage: number;
  
  // Quality metrics
  duplicateRate: number;
  relationshipCompleteness: number;
  queryMethodDistribution: {
    queryEntries: number;
    findSimilarFossils: number;
    getAllEntries: number;
  };
  
  // Usage metrics
  totalQueries: number;
  cacheHitRate: number;
  errorRate: number;
}
```

### Monitoring Dashboard

```typescript
const generateQueryReport = (metrics: FossilQueryMetrics) => {
  return {
    performance: {
      status: metrics.averageQueryTime < 100 ? 'good' : 'needs_attention',
      averageQueryTime: `${metrics.averageQueryTime}ms`,
      slowQueries: metrics.slowQueryCount
    },
    quality: {
      status: metrics.duplicateRate < 0.01 ? 'good' : 'needs_attention',
      duplicateRate: `${(metrics.duplicateRate * 100).toFixed(2)}%`,
      relationshipCompleteness: `${(metrics.relationshipCompleteness * 100).toFixed(2)}%`
    },
    usage: {
      totalQueries: metrics.totalQueries,
      methodDistribution: metrics.queryMethodDistribution,
      cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`
    }
  };
};
```

## 🎯 Implementation Guidelines

### 1. Utility Creation
When a needed utility is missing, create it following these patterns:

```typescript
// Pattern: Wrapper for common queries
export const FossilQueries = {
  async getRecentDecisions(limit: number = 10) {
    return fossilService.queryEntries({
      type: 'decision',
      limit,
      offset: 0,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    });
  },

  async findRelatedContent(content: string, threshold: number = 70) {
    return fossilService['findSimilarFossils']('', content, threshold);
  },

  async getFossilsBySource(source: ContextEntry['source'], limit: number = 50) {
    return fossilService.queryEntries({
      source,
      limit,
      offset: 0
    });
  }
};
```

### 2. Error Handling
Always handle query failures gracefully:

```typescript
const safeQuery = async (queryFn: () => Promise<any>) => {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Fossil query failed:', error);
    return []; // Return empty array as fallback
  }
};

// Usage
const entries = await safeQuery(() => 
  fossilService.queryEntries({ limit: 10, offset: 0 })
);
```

### 3. Caching Strategy
Implement caching for frequently accessed queries:

```typescript
const queryCache = new Map<string, { data: any; timestamp: number }>();

const getCachedQuery = async (key: string, queryFn: () => Promise<any>) => {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  
  const data = await queryFn();
  queryCache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

## 🔮 Future Enhancements

### 1. Automated Detection
- **Static analysis**: Automated detection of anti-patterns during development
- **Runtime monitoring**: Real-time detection of performance issues
- **Code generation**: Automatic generation of utility functions

### 2. Performance Optimization
- **Query optimization**: Automatic query optimization suggestions
- **Indexing**: Database-style indexing for faster queries
- **Caching**: Intelligent caching with automatic invalidation

### 3. Quality Assurance
- **Automated testing**: Test generation for query patterns
- **Data validation**: Automatic validation of fossil data quality
- **Relationship verification**: Automatic verification of fossil relationships

---

*This rule provides a comprehensive framework for identifying and fixing missing utilities in workflows. By following these guidelines, teams can ensure efficient, maintainable, and high-quality fossil query operations.* 