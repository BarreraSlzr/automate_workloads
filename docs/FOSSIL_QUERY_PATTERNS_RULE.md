# 🔍 Fossil Query Patterns Rule

## 📋 Overview

This rule provides a systematic approach to identify when to use `findSimilarFossils()` vs `queryEntries()` and how to leverage local services for advanced fossil operations. It serves as a decision tree for fossil query optimization and workflow enhancement.

## 🎯 Rule Purpose

**Goal**: Ensure optimal fossil query performance and intelligent local service integration.

**Scope**: All fossil operations, automation workflows, and analysis tasks.

**Enforcement**: Code review checklist, automated linting, and performance monitoring.

## 🔍 Decision Tree

### Step 1: Query Method Selection

```
Is this a structured search with known filters?
├─ YES → Use queryEntries()
│   ├─ Filtering by type, tags, date range
│   ├─ Pagination and sorting
│   ├─ Exact text matching
│   └─ Reporting and analytics
│
└─ NO → Is this content discovery or similarity search?
    ├─ YES → Use findSimilarFossils()
    │   ├─ Deduplication detection
    │   ├─ Content similarity analysis
    │   ├─ Semantic content discovery
    │   └─ Cross-repository pattern matching
    │
    └─ NO → Consider hybrid approach
        ├─ Use queryEntries() first for fast filtering
        ├─ Then use findSimilarFossils() for detailed analysis
        └─ Combine results for comprehensive insights
```

### Step 2: Local Service Integration

```
Does the operation benefit from local context?
├─ YES → Integrate local services
│   ├─ Git diff analysis for relevance
│   ├─ LLM snapshots for temporal analysis
│   ├─ Semantic tagging for categorization
│   └─ Quality assessment for validation
│
└─ NO → Use basic query methods
    ├─ queryEntries() for simple filtering
    ├─ findSimilarFossils() for similarity
    └─ No additional service overhead
```

## 📊 Query Method Comparison

| Aspect | `queryEntries()` | `findSimilarFossils()` | Hybrid Approach |
|--------|------------------|------------------------|-----------------|
| **Performance** | Fast (O(log n)) | Slow (O(n)) | Balanced |
| **Use Case** | Structured filtering | Content discovery | Comprehensive analysis |
| **Memory Usage** | Low | High | Medium |
| **Accuracy** | Exact matches | Semantic similarity | High |
| **Scalability** | Excellent | Limited | Good |

## 🛠️ Implementation Patterns

### Pattern 1: Intelligent Deduplication

**When to Use**: Creating new fossils, preventing duplicates

```typescript
async function intelligentDeduplication(title: string, content: string) {
  // Step 1: Fast structured query
  const structuredResults = await fossilService.queryEntries({
    search: title,
    tags: extractTags(content),
    limit: 10
  });

  // Step 2: Semantic similarity search
  const similarResults = await fossilService['findSimilarFossils'](
    title,
    content,
    80
  );

  // Step 3: Git context analysis
  const gitChanges = await analyzeGitChanges(similarResults[0]?.fossil?.createdAt);

  // Step 4: LLM relevance analysis
  const llmAnalysis = await analyzeRelevanceWithLLM(
    similarResults[0]?.fossil,
    gitChanges,
    content
  );

  // Step 5: Generate recommendation
  return generateDeduplicationRecommendation(
    similarResults,
    gitChanges,
    llmAnalysis
  );
}
```

### Pattern 2: Fossil Evolution Tracking

**When to Use**: Analyzing fossil lifecycle, tracking changes

```typescript
async function trackFossilEvolution(fossilId: string, timeRange: TimeRange) {
  // Step 1: Get target fossil
  const fossil = await fossilService.getEntry(fossilId);

  // Step 2: Query related fossils (fast)
  const relatedFossils = await fossilService.queryEntries({
    type: fossil.type,
    tags: fossil.tags,
    dateRange: timeRange,
    limit: 50
  });

  // Step 3: Find similar fossils (comprehensive)
  const similarFossils = await fossilService['findSimilarFossils'](
    fossil.title,
    fossil.content,
    70
  );

  // Step 4: Export LLM snapshots
  const llmSnapshots = await snapshotExporter.exportLLMSnapshot({
    format: 'json',
    filters: { dateRange: timeRange, tags: fossil.tags }
  });

  // Step 5: Analyze evolution patterns
  return analyzeEvolutionPatterns(fossil, relatedFossils, similarFossils, llmSnapshots);
}
```

### Pattern 3: Cross-Repository Analysis

**When to Use**: Multi-repo fossil management, pattern discovery

```typescript
async function crossRepositoryAnalysis(repositories: string[], query: string) {
  // Step 1: Global fossil search (fast)
  const globalFossils = await fossilService.queryEntries({
    search: query,
    limit: 100
  });

  const results = { globalFossils, repositorySpecific: {}, patterns: [] };

  // Step 2: Repository-specific analysis
  for (const repo of repositories) {
    // Fast structured query per repo
    const repoFossils = await fossilService.queryEntries({
      search: query,
      tags: [repo],
      limit: 50
    });

    // Git diff analysis
    const gitDiff = await analyzeRepositoryGitDiff(repo);

    // Cross-repo similarity analysis
    const crossRepoSimilar = await findCrossRepositorySimilarFossils(
      repoFossils,
      globalFossils
    );

    results.repositorySpecific[repo] = { repoFossils, gitDiff, crossRepoSimilar };
  }

  return results;
}
```

### Pattern 4: Quality Assessment

**When to Use**: Fossil validation, quality gates, improvement suggestions

```typescript
async function assessFossilQuality(fossilId: string) {
  const fossil = await fossilService.getEntry(fossilId);

  // Step 1: Git context analysis
  const gitContext = await analyzeGitContext(fossil);

  // Step 2: LLM content analysis
  const llmAnalysis = await analyzeFossilContentWithLLM(fossil);

  // Step 3: Duplicate detection (similarity search)
  const duplicates = await fossilService['findSimilarFossils'](
    fossil.title,
    fossil.content,
    90
  );

  // Step 4: Related fossils (structured query)
  const relatedFossils = await fossilService.queryEntries({
    type: fossil.type,
    tags: fossil.tags,
    limit: 10
  });

  // Step 5: Calculate quality score
  return calculateQualityScore(fossil, gitContext, llmAnalysis, duplicates, relatedFossils);
}
```

## 🔍 Detection Rules

### Rule 1: Query Method Misuse

**Pattern**: Using `findSimilarFossils()` for simple filtering

```typescript
// ❌ Anti-pattern
const fossils = await fossilService['findSimilarFossils']('', '', 50);
const filtered = fossils.filter(f => f.fossil.type === 'decision');

// ✅ Correct pattern
const fossils = await fossilService.queryEntries({
  type: 'decision',
  limit: 50
});
```

**Detection**: Look for `findSimilarFossils()` calls with empty title/content and low similarity thresholds.

### Rule 2: Missing Local Service Integration

**Pattern**: Fossil operations without git or LLM context

```typescript
// ❌ Anti-pattern
const similarFossils = await fossilService['findSimilarFossils'](title, content, 80);
if (similarFossils.length > 0) {
  console.log('Duplicate found');
}

// ✅ Correct pattern
const similarFossils = await fossilService['findSimilarFossils'](title, content, 80);
if (similarFossils.length > 0) {
  const gitChanges = await analyzeGitChanges(similarFossils[0].fossil.createdAt);
  const llmAnalysis = await analyzeRelevanceWithLLM(similarFossils[0].fossil, gitChanges, content);
  const recommendation = generateRecommendation(similarFossils[0], gitChanges, llmAnalysis);
}
```

**Detection**: Look for fossil operations without git diff or LLM analysis in the same function.

### Rule 3: Performance Anti-Patterns

**Pattern**: Using `findSimilarFossils()` for large datasets without pagination

```typescript
// ❌ Anti-pattern
const allFossils = await fossilService['findSimilarFossils']('', '', 0);

// ✅ Correct pattern
const fossils = await fossilService.queryEntries({
  limit: 100,
  offset: 0
});
const similar = await fossilService['findSimilarFossils']('', content, 80);
```

**Detection**: Look for `findSimilarFossils()` calls with very low similarity thresholds or no limits.

### Rule 4: Missing Error Handling

**Pattern**: No fallback for service failures

```typescript
// ❌ Anti-pattern
const gitChanges = await analyzeGitChanges(fossil.createdAt);
const llmAnalysis = await analyzeWithLLM(fossil);

// ✅ Correct pattern
let gitChanges = [];
let llmAnalysis = null;

try {
  gitChanges = await analyzeGitChanges(fossil.createdAt);
} catch (error) {
  console.warn('Git analysis failed, continuing without git context');
}

try {
  llmAnalysis = await analyzeWithLLM(fossil);
} catch (error) {
  console.warn('LLM analysis failed, using basic assessment');
  llmAnalysis = { quality: 5, suggestions: ['LLM analysis unavailable'] };
}
```

**Detection**: Look for local service calls without try-catch blocks.

## 📈 Performance Guidelines

### Query Optimization

| Scenario | Recommended Approach | Expected Performance |
|----------|---------------------|---------------------|
| Simple filtering | `queryEntries()` only | < 100ms |
| Content discovery | `findSimilarFossils()` only | 1-5s |
| Comprehensive analysis | Hybrid approach | 2-10s |
| Large datasets | `queryEntries()` with pagination | < 500ms |

### Caching Strategy

```typescript
class CachedFossilAnalyzer {
  private cache = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async getCachedResults(key: string, operation: () => Promise<any>) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const result = await operation();
    this.cache.set(key, { data: result, timestamp: Date.now() });
    return result;
  }
}
```

## 🔍 Code Review Checklist

### Query Method Selection

- [ ] Is `queryEntries()` used for structured filtering?
- [ ] Is `findSimilarFossils()` used only for similarity search?
- [ ] Are hybrid approaches used for comprehensive analysis?
- [ ] Are performance implications considered?

### Local Service Integration

- [ ] Are git changes analyzed for fossil relevance?
- [ ] Are LLM snapshots used for temporal analysis?
- [ ] Is semantic tagging used for categorization?
- [ ] Is quality assessment performed?

### Error Handling

- [ ] Are local service failures handled gracefully?
- [ ] Are fallback mechanisms in place?
- [ ] Are errors logged for debugging?
- [ ] Is user experience maintained on failures?

### Performance

- [ ] Are large datasets paginated?
- [ ] Are expensive operations cached?
- [ ] Are similarity thresholds appropriate?
- [ ] Are query limits enforced?

## 🎯 Best Practices Summary

### 1. Query Method Selection

- **Use `queryEntries()` for**: Filtering, pagination, structured searches
- **Use `findSimilarFossils()` for**: Content discovery, deduplication
- **Combine both for**: Comprehensive analysis with performance optimization

### 2. Local Service Integration

- **Always include git context** for fossil relevance analysis
- **Use LLM services** for content quality and relevance assessment
- **Implement semantic tagging** for intelligent categorization
- **Provide quality assessment** for fossil validation

### 3. Performance Optimization

- **Cache expensive operations** like similarity calculations
- **Use pagination** for large result sets
- **Implement graceful degradation** when services fail
- **Monitor performance metrics** for optimization opportunities

### 4. Error Handling

- **Check service availability** before use
- **Provide meaningful fallbacks** when services fail
- **Log errors** for debugging and monitoring
- **Maintain user experience** even with service failures

## 📊 Monitoring Metrics

### Key Performance Indicators

```typescript
interface FossilQueryMetrics {
  queryPerformance: {
    queryEntriesAvgTime: number;
    findSimilarFossilsAvgTime: number;
    hybridAnalysisAvgTime: number;
  };
  serviceAvailability: {
    gitAvailable: number; // percentage
    llmAvailable: number; // percentage
    semanticAvailable: number; // percentage
  };
  qualityMetrics: {
    averageQualityScore: number;
    duplicateDetectionRate: number;
    recommendationAccuracy: number;
  };
}
```

### Alerting Rules

- **Query Performance**: Alert if `findSimilarFossils()` takes > 10s
- **Service Availability**: Alert if any service < 95% uptime
- **Quality Scores**: Alert if average quality < 60
- **Error Rates**: Alert if error rate > 5%

## 🔮 Future Enhancements

### Planned Improvements

1. **Machine Learning Integration**: Train models on fossil patterns for better similarity detection
2. **Real-time Analysis**: WebSocket-based live fossil analysis
3. **Advanced Similarity**: Embedding-based similarity calculations
4. **Automated Consolidation**: AI-powered fossil merging

### Extension Points

```typescript
interface FossilAnalysisPlugin {
  name: string;
  analyze(fossil: any, context: any): Promise<AnalysisResult>;
  priority: number;
  required: boolean;
}

class PluginManager {
  async runAnalysis(fossil: any, plugins: FossilAnalysisPlugin[]) {
    const results = await Promise.allSettled(
      plugins.map(plugin => plugin.analyze(fossil, this.context))
    );
    return this.combineResults(results);
  }
}
```

---

This rule provides a comprehensive framework for optimal fossil query patterns and local service integration. Follow these guidelines to ensure efficient, intelligent, and robust fossil operations in your automation workflows. 