# 🚀 Advanced Fossil Query Patterns Guide

## 📋 Overview

This guide demonstrates how to combine `findSimilarFossils()` and `queryEntries()` with local services like git diff, LLM snapshots, and semantic analysis for advanced fossil operations. These patterns enable intelligent fossil management, cross-repository analysis, and automated quality assessment.

## 🎯 Key Concepts

### Query Method Synergy

| Method | Purpose | Performance | Best Use Case |
|--------|---------|-------------|---------------|
| `queryEntries()` | Structured filtering | Fast (O(log n)) | General queries, filtering, reporting |
| `findSimilarFossils()` | Semantic similarity | Slow (O(n)) | Deduplication, content discovery |

### Local Services Integration

- **Git Diff Analysis**: Track code changes and fossil relevance
- **LLM Snapshots**: Export and analyze LLM interactions
- **Semantic Tagging**: Intelligent content categorization
- **Quality Assessment**: Multi-factor fossil evaluation

## 🔧 Practical Examples

### Example 1: Intelligent Deduplication with Git Context

**Use Case**: Prevent duplicate fossils while considering code changes

```bash
# Basic deduplication
bun run scripts/advanced-fossil-analysis.ts deduplicate \
  "Database Migration Strategy" \
  "We decided to migrate from MySQL to PostgreSQL..." \
  --threshold 80

# With git context analysis
bun run scripts/advanced-fossil-analysis.ts deduplicate \
  "API Authentication" \
  "Implemented JWT-based authentication..." \
  --git-context \
  --llm-analysis
```

**What it does**:
1. Uses `findSimilarFossils()` to find similar content
2. Analyzes git changes since fossil creation
3. Uses LLM to assess relevance given recent changes
4. Provides intelligent reuse/create/update recommendations

**Output Example**:
```
🔍 Performing intelligent deduplication...
📋 Found similar fossil: API Auth Implementation (85% similar)
📊 Analyzing git changes...
📈 Found 12 git changes since fossil creation
🧠 Analyzing relevance with LLM...
💡 LLM Analysis: Recent changes include new OAuth2 implementation...

🎯 Recommendation: CREATE_NEW: Recent changes or LLM suggests new fossil needed
```

### Example 2: Fossil Evolution Tracking

**Use Case**: Track how fossils evolve over time with related content

```bash
# Track fossil evolution
bun run scripts/advanced-fossil-analysis.ts evolution \
  fossil_123 \
  --start-date 2024-01-01T00:00:00Z \
  --end-date 2024-12-31T23:59:59Z \
  --include-snapshots
```

**What it does**:
1. Uses `queryEntries()` to find related fossils by type/tags
2. Uses `findSimilarFossils()` to find semantically similar content
3. Exports LLM snapshots for temporal analysis
4. Tracks version history and evolution patterns

**Output Example**:
```
📈 Tracking fossil evolution...
📋 Analyzing fossil: Database Migration Strategy
🔍 Finding related fossils...
📊 Found 8 related fossils
🔍 Finding similar fossils...
📊 Found 3 similar fossils
📸 Exporting LLM snapshots...

📊 Evolution Analysis:
- Version updates: 2
- Related fossils: 8
- Similar fossils: 3
- Recent changes (30 days): 5
🔄 Active evolution detected
```

### Example 3: Cross-Repository Analysis

**Use Case**: Analyze fossils across multiple repositories for patterns

```bash
# Cross-repository analysis
bun run scripts/advanced-fossil-analysis.ts cross-repo \
  "database migration" \
  /path/to/repo1 \
  /path/to/repo2 \
  /path/to/repo3 \
  --include-git-diff
```

**What it does**:
1. Uses `queryEntries()` for global fossil search
2. Analyzes repository-specific fossils
3. Compares git diffs across repositories
4. Identifies cross-repository patterns and recommendations

**Output Example**:
```
🌐 Performing cross-repository analysis...
🔍 Querying global fossils...
📊 Found 25 global fossils

📁 Analyzing repository: /path/to/repo1
📊 Found 5 fossils in repo1
📈 Recent git changes: 8 files
🔗 Cross-repo similarities: 2 found

📊 Cross-Repository Analysis Summary:
- Global fossils: 25
- Repositories analyzed: 3
- repo1: 5 fossils
- repo2: 3 fossils
- repo3: 7 fossils

💡 Recommendations:
1. Consider consolidating 2 similar fossils across repositories
2. Repository repo2 has changes but no relevant fossils
```

### Example 4: Intelligent Recommendations

**Use Case**: Generate context-aware fossil recommendations

```bash
# Generate recommendations
bun run scripts/advanced-fossil-analysis.ts recommend \
  "Need to implement database migration strategy for PostgreSQL" \
  --max 5 \
  --use-semantic-tags \
  --use-similarity
```

**What it does**:
1. Uses semantic tagging to understand context
2. Uses `queryEntries()` with semantic tags
3. Uses `findSimilarFossils()` for content similarity
4. Combines results and uses LLM for final recommendations

**Output Example**:
```
🧠 Generating intelligent recommendations...
🏷️ Analyzing with semantic tags...
📊 Found 12 fossils using semantic tags
🔍 Searching by similarity...
📊 Found 8 fossils using similarity search

📋 Recommendations:
1. Database Migration Strategy
   ID: fossil_456
   Type: decision
   Tags: database, migration, postgresql
   Content: Comprehensive strategy for migrating from MySQL to PostgreSQL...

💡 Reasoning:
The "Database Migration Strategy" fossil is highly relevant because it specifically addresses PostgreSQL migration...
```

### Example 5: Quality Assessment

**Use Case**: Comprehensive fossil quality evaluation

```bash
# Assess fossil quality
bun run scripts/advanced-fossil-analysis.ts quality \
  fossil_789 \
  --include-git \
  --include-llm \
  --include-duplicates
```

**What it does**:
1. Analyzes git context and activity
2. Uses LLM for content quality assessment
3. Checks for duplicates using `findSimilarFossils()`
4. Queries related fossils using `queryEntries()`
5. Calculates comprehensive quality score

**Output Example**:
```
🔍 Assessing fossil quality...
📋 Assessing fossil: API Authentication Strategy
📊 Analyzing git context...
📈 Found 15 git commits
🧠 Analyzing content with LLM...
💡 LLM Analysis completed
🔍 Checking for duplicates...
✅ No duplicates found
🔍 Finding related fossils...
📊 Found 6 related fossils

📊 Quality Assessment Results:
- Quality Score: 87/100
🏆 Excellent quality fossil

💡 Improvement Suggestions:
- Add more tags for better discoverability
- Consider expanding content with more details
```

## 🔄 Workflow Integration Patterns

### Pattern 1: Pre-Commit Fossil Validation

```typescript
// In pre-commit hook
const analyzer = new AdvancedFossilAnalyzer();

// Check for duplicates before creating new fossil
const dedupResult = await analyzer.intelligentDeduplicationWithGitContext(
  newFossil.title,
  newFossil.content,
  80
);

if (dedupResult && dedupResult.recommendations.includes('REUSE')) {
  console.log('⚠️ Similar fossil exists - consider reusing');
  process.exit(1);
}
```

### Pattern 2: Automated Quality Gates

```typescript
// In CI/CD pipeline
const qualityResult = await analyzer.assessFossilQuality(fossilId);

if (qualityResult.qualityScore < 60) {
  console.log('❌ Fossil quality below threshold');
  console.log('Issues:', qualityResult.issues);
  process.exit(1);
}
```

### Pattern 3: Cross-Repository Synchronization

```typescript
// In repository sync workflow
const crossRepoResult = await analyzer.crossRepositoryFossilAnalysis(
  ['repo1', 'repo2', 'repo3'],
  'database migration'
);

// Create consolidation recommendations
if (crossRepoResult.recommendations.length > 0) {
  await createConsolidationIssues(crossRepoResult.recommendations);
}
```

## 🛠️ Implementation Details

### Combining Query Methods

```typescript
class AdvancedFossilAnalyzer {
  async intelligentAnalysis(context: string) {
    // Step 1: Fast structured query
    const structuredResults = await this.fossilService.queryEntries({
      search: context,
      tags: ['database', 'migration'],
      limit: 20
    });

    // Step 2: Semantic similarity search
    const similarResults = await this.fossilService['findSimilarFossils'](
      '',
      context,
      70
    );

    // Step 3: Combine and deduplicate
    const allResults = [...structuredResults, ...similarResults.map(s => s.fossil)];
    return this.deduplicateFossils(allResults);
  }
}
```

### Local Services Integration

```typescript
class LocalServicesIntegration {
  async analyzeWithGitContext(fossil: any) {
    // Git diff analysis
    const gitChanges = await this.executeCommand(
      `git log --since="${fossil.createdAt}" --oneline --name-only`
    );

    // LLM snapshot export
    const snapshots = await this.snapshotExporter.exportLLMSnapshot({
      format: 'json',
      filters: { dateRange: { start: fossil.createdAt, end: new Date() } }
    });

    // Semantic tagging
    const tags = await this.semanticTagger.analyzeContent({
      content: fossil.content,
      routingPreference: 'local'
    });

    return { gitChanges, snapshots, tags };
  }
}
```

## 📊 Performance Considerations

### Query Optimization

| Scenario | Recommended Approach | Performance |
|----------|---------------------|-------------|
| General search | `queryEntries()` with filters | Fast |
| Content discovery | `findSimilarFossils()` | Slow but accurate |
| Hybrid approach | `queryEntries()` first, then `findSimilarFossils()` | Balanced |

### Caching Strategies

```typescript
class CachedFossilAnalyzer {
  private cache = new Map();

  async getCachedResults(key: string, operation: () => Promise<any>) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = await operation();
    this.cache.set(key, result);
    return result;
  }
}
```

## 🔍 Error Handling Patterns

### Graceful Degradation

```typescript
async function robustAnalysis(fossilId: string) {
  try {
    // Primary analysis
    return await analyzer.assessFossilQuality(fossilId);
  } catch (error) {
    console.warn('⚠️ Primary analysis failed, falling back to basic assessment');
    
    // Fallback to basic assessment
    const fossil = await fossilService.getEntry(fossilId);
    return {
      fossil,
      qualityScore: 50,
      issues: ['Analysis failed'],
      improvements: ['Retry analysis']
    };
  }
}
```

### Service Availability Checks

```typescript
async function checkServiceAvailability() {
  const services = {
    git: await this.checkGitAvailable(),
    llm: await this.checkLLMAvailable(),
    semantic: await this.checkSemanticTaggerAvailable()
  };

  return services;
}
```

## 🎯 Best Practices

### 1. Query Method Selection

- **Use `queryEntries()` for**: Filtering, pagination, structured searches
- **Use `findSimilarFossils()` for**: Content discovery, deduplication
- **Combine both for**: Comprehensive analysis

### 2. Local Service Integration

- **Git Analysis**: Always check if git repository is available
- **LLM Services**: Use local routing preference when possible
- **Semantic Tagging**: Cache results for performance

### 3. Performance Optimization

- **Batch Operations**: Process multiple fossils together
- **Caching**: Cache expensive operations like similarity calculations
- **Pagination**: Use limits and offsets for large result sets

### 4. Error Handling

- **Graceful Degradation**: Provide fallbacks when services fail
- **Service Checks**: Verify service availability before use
- **Logging**: Log failures for debugging and monitoring

## 📈 Monitoring and Metrics

### Key Metrics to Track

```typescript
interface AnalysisMetrics {
  queryPerformance: {
    queryEntriesTime: number;
    findSimilarFossilsTime: number;
    totalAnalysisTime: number;
  };
  serviceAvailability: {
    gitAvailable: boolean;
    llmAvailable: boolean;
    semanticAvailable: boolean;
  };
  qualityScores: {
    averageScore: number;
    distribution: Record<string, number>;
  };
}
```

### Monitoring Dashboard

```typescript
class AnalysisMonitor {
  async generateReport() {
    return {
      totalAnalyses: this.metrics.totalAnalyses,
      averageQualityScore: this.metrics.averageQualityScore,
      serviceUptime: this.metrics.serviceUptime,
      recommendations: this.metrics.recommendations
    };
  }
}
```

## 🔮 Future Enhancements

### Planned Features

1. **Machine Learning Integration**: Train models on fossil patterns
2. **Real-time Analysis**: WebSocket-based live fossil analysis
3. **Advanced Similarity**: Embedding-based similarity calculations
4. **Automated Consolidation**: AI-powered fossil merging

### Extension Points

```typescript
interface AnalysisPlugin {
  name: string;
  analyze(fossil: any): Promise<AnalysisResult>;
  priority: number;
}

class PluginManager {
  async runAnalysis(fossil: any, plugins: AnalysisPlugin[]) {
    const results = await Promise.all(
      plugins.map(plugin => plugin.analyze(fossil))
    );
    return this.combineResults(results);
  }
}
```

## 📚 Related Documentation

- [Fossil Query Patterns Analysis](./FOSSIL_QUERY_PATTERNS_ANALYSIS.md)
- [Workflow Utility Detection Rule](./WORKFLOW_UTILITY_DETECTION_RULE.md)
- [LLM Error Prevention Guide](./LLM_ERROR_PREVENTION_GUIDE.md)
- [Performance Monitoring Guide](./PERFORMANCE_MONITORING_GUIDE.md)

---

This guide provides comprehensive examples of combining fossil query methods with local services for advanced automation workflows. Use these patterns to build intelligent fossil management systems that leverage the full power of your local development environment. 