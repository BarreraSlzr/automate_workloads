# 🦴 Canonical Fossil Management Guide

**Date**: 2025-07-06  
**Purpose**: Comprehensive guide for canonical fossil structure, growth management, and automatic cleanup  
**Status**: Active Implementation - ML-Ready, Cohesion-First Approach  

---

## 🚨 ML-Ready, Cohesion-First Commitment Policy

> **Only canonical, ML-ready fossils are committed.**
> - All test, temp, and redundant fossils are cleaned up automatically before commit.
> - Timestamped files are only allowed in `archive/`.
> - All fossilization must use canonical utilities and types. No ad-hoc or legacy fossil outputs are allowed.
> - The pre-commit validator and canonical fossil manager enforce these rules.

> **Warning:** Any fossil not matching the canonical, ML-ready pattern will be automatically removed during pre-commit validation. Only use the canonical fossil manager/utilities for fossilization.

## ✅ Simplified, Canonical-Only, ML-Ready Approach (2024-07)

The project has adopted a new, streamlined approach to fossil management and validation, focused on:

- **Eliminating complex anti-pattern detection systems** in favor of simple, enforceable naming conventions and enriched extension rules.
- **Consolidating redundant validation frameworks** into a single, unified validation pipeline.
- **Mandating canonical-only fossil outputs**: All outputs (validation, test, monitoring, batch plans) must use structured `.json`/`.yml` formats, never `.txt`.
- **Ensuring traceability and auditability** through canonical fossils, commit audits, and automated reporting.

### Why This Change?
- **Reduce maintenance overhead** and onboarding complexity
- **Increase reliability** and testability
- **Improve ML/LLM readiness** with structured, enriched outputs
- **Accelerate delivery** with faster, more reliable CI/CD

### How to Comply
- **All new fossils must follow canonical naming and structure rules** (see below)
- **Pre-commit hooks and the canonical fossil manager will block non-compliant files**
- **Legacy validation scripts and anti-pattern detection systems are deprecated**
- **Edge case and coverage tests are maintained and expanded** to ensure no loss of quality
- **Monthly canonical audits** are scheduled to review fossil growth, structure, and compliance

### Next Steps (Automated)
- Update documentation and onboarding guides to reflect these changes
- Enforce canonical patterns in pre-commit and fossil manager scripts
- Remove or archive legacy/complex validation and anti-pattern detection code
- Expand edge case and coverage tests for all validation and monitoring utilities
- Schedule and document monthly canonical audits

**This approach is approved and recommended for all future work.**
It will make the project easier to maintain, more robust, and ready for the next generation of automation and ML-powered workflows.

---

## 🎯 Overview

This guide defines the **canonical fossil management system** that combines structure, growth management, and automatic cleanup into a cohesive, ML-ready approach. The system uses **stable, canonical filenames** for current state, **archived timestamped versions** for historical tracking, and **automatic cleanup** to maintain optimal conditions.

## 📊 Current State & Problem Analysis

### Fossil Growth Metrics
- **Total Files**: 672 JSON files (reduced from 24.63MB to 18MB)
- **Growth Rate**: High (multiple files per operation)
- **Value Dilution**: Context spread across many small files
- **Maintenance Overhead**: Managing hundreds of files becomes unwieldy

### Identified Problems
1. **Exponential Growth**: Each operation creates multiple fossils
2. **Context Fragmentation**: Related information scattered across files
3. **Reduced Discoverability**: Too many files make finding relevant context difficult
4. **Value Dilution**: Important context gets lost in the noise

## 🦴 Canonical Fossil Structure (2025, ML-Ready, Canonical-Only)

```
fossils/
├── llm_insights/
│   ├── llm.analysis.json
│   ├── llm.performance.json
├── ml_insights/
│   ├── ml.analysis.json
│   ├── ml.performance.json
├── human_insights/
│   ├── human.actionable_insights.md
├── performance/
│   ├── performance.json
│   ├── performance.md
├── monitoring/
│   ├── monitoring.json
│   ├── monitoring.md
├── tests/
│   ├── integration_tests.yml
│   ├── unit_tests.json
│   ├── performance_tests.md
├── archive/
│   └── ...
├── project_status.yml
├── roadmap.yml
├── roadmap.md
└── readme.md
```

- Only these folders are allowed for active fossilization.
- All other folders (misc, test, analysis, etc.) are removed or archived.
- Timestamped files are only allowed in `archive/`.
- All fossilization must use canonical utilities and types.
- The pre-commit validator and canonical fossil manager enforce these rules.
- Test fossils use standardized naming: `[topics_tested].yml|json|md` (e.g., `integration_tests.yml`, `unit_tests.json`, `performance_tests.md`).

## 🔄 Canonical Update Workflow

### **1. Pre-Commit Validation & Fossilization**

```bash
# Pre-commit hook automatically runs:
bun run src/cli/canonical-fossil-manager.ts update-validation --generate-yaml
bun run src/cli/canonical-fossil-manager.ts update-performance --generate-yaml
```

**What happens:**
1. **Archive Previous**: Current canonical file is archived with timestamp
2. **Update Canonical**: New data overwrites canonical file (stable filename)
3. **Generate YAML**: YAML context created for human-LLM chat and ML processes
4. **Git Diff Analysis**: Traceability data captured for commit

### **2. Canonical File Lifecycle**

```
Current State: fossils/canonical/validation-results.json
     ↓ (New validation run)
Archive: fossils/archive/2025/07/validation-results-2025-07-06T10-30-00-000Z.json
     ↓ (Overwrite)
Current State: fossils/canonical/validation-results.json (updated)
```

### **3. Traceability Through Git Diff**

The system tracks fossil changes through git diff analysis:

```json
{
  "timestamp": "2025-07-06T10:30:00.000Z",
  "commit_hash": "abc123...",
  "fossil_changes": [
    "fossils/canonical/validation-results.json",
    "fossils/context/canonical-context.yml"
  ],
  "change_types": {
    "staged": ["fossils/canonical/validation-results.json"],
    "unstaged": []
  },
  "metadata": {
    "fossilized": true,
    "canonical": false,
    "version": "1.0.0",
    "transversalValue": 25
  }
}
```

## 🧹 Automatic Cleanup Integration

### **ML-Powered Automatic Cleanup**

The enhanced `ML-Ready Pre-Commit Validator` includes automatic cleanup functionality that:

1. **Detects and removes test directories** automatically
2. **Cleans up analysis fossils** (preserving canonical ones)
3. **Removes temporary files** and patterns
4. **Maintains fossil growth limits** 
5. **Provides cleanup recommendations**

### **What Gets Cleaned Automatically**

#### Test Directories Removed
- `fossils/test-analysis/`
- `fossils/test-learning-analysis/`
- `fossils/test-monitoring/`
- `fossils/test-orchestrator/`
- `fossils/test/cleanup/`
- `fossils/test/integration/`
- `fossils/llm-planning-snapshots/`
- `non-existent-dir/`

#### Analysis Fossils Cleaned
- All analysis fossils except canonical ones:
  - `fossils/analysis/analysis-anomalous.json`
  - `fossils/analysis/analysis-critical-report.json`
  - `fossils/analysis/analysis-critical.json`
  - `fossils/analysis/analysis-opportunity-report.json`
  - `fossils/analysis/learning-insights-report.md`
  - `fossils/analysis/learning-model.json`

#### Temporary Files Removed
- `fossils/footprint-fossil-*.json`
- `fossils/chat_context.json`
- `fossils/curated_roadmap_manual.json`

### **Cleanup Process**

```typescript
interface CleanupResult {
  removedFiles: string[];
  removedDirectories: string[];
  preservedFiles: string[];
  recommendations: string[];
  totalSizeReduction: number;
  fossilCountReduction: number;
}

class AutomaticCleanup {
  async cleanupTestDirectories(): Promise<CleanupResult> {
    // Remove test directories and preserve important fossils
  }
  
  async cleanupAnalysisFossils(): Promise<CleanupResult> {
    // Clean analysis fossils while preserving canonical ones
  }
  
  async cleanupTemporaryFiles(): Promise<CleanupResult> {
    // Remove temporary files and patterns
  }
  
  async generateRecommendations(): Promise<string[]> {
    // Generate cleanup recommendations
  }
}
```

## 📋 New Rules and Standards

### **1. Fossil Creation Rules**

#### ✅ **Allowed Fossil Creation**
- **Commit Context Fossils**: One per commit with comprehensive context
- **Canonical Fossils**: Only for essential project state (roadmap, status, etc.)
- **Archive Fossils**: Historical fossils moved to archive after 30 days
- **Template Fossils**: Reusable templates for common operations

#### ❌ **Prohibited Fossil Creation**
- **Redundant Analysis**: Multiple fossils for the same analysis
- **Temporary Insights**: Insights that don't contribute to commit context
- **Duplicate Information**: Information already captured in other fossils
- **Unstructured Data**: Raw data without proper context structure

### **2. Context Consolidation Rules**

#### **Merge Criteria**
- **Same Operation**: Multiple fossils from the same operation
- **Related Content**: Fossils with similar or related content
- **Same Timeframe**: Fossils created within the same commit timeframe
- **Same Purpose**: Fossils serving the same purpose or goal

#### **Consolidation Process**
1. **Identify Related Fossils**: Find fossils that can be merged
2. **Extract Key Information**: Extract essential information from each fossil
3. **Create Unified Structure**: Organize information in a logical structure
4. **Preserve References**: Maintain links to original fossils for traceability
5. **Archive Originals**: Move original fossils to archive

### **3. Pre-Commit Integration Rules**

#### **Context Requirements**
- **Complete Analysis**: All analysis results must be included
- **LLM Insights**: All relevant LLM insights must be captured
- **Recommendations**: Actionable recommendations must be provided
- **Dependencies**: All dependencies and related fossils must be linked

#### **Quality Standards**
- **Structured Format**: Must follow defined JSON schema
- **Complete Information**: Must include all relevant context
- **Actionable Insights**: Must provide actionable recommendations
- **Traceable References**: Must link to relevant canonical fossils

## 🛠️ Implementation Tools

### **1. Canonical Fossil Manager**
```typescript
class CanonicalFossilManager {
  async updateValidation(): Promise<UpdateResult> {
    // Update validation results with archiving
  }
  
  async updatePerformance(): Promise<UpdateResult> {
    // Update performance results with archiving
  }
  
  async updateAnalysis(): Promise<UpdateResult> {
    // Update analysis results with archiving
  }
  
  async updateTest(): Promise<UpdateResult> {
    // Update test results with archiving
  }
  
  async generateYaml(): Promise<YamlResult> {
    // Generate YAML context for ML processes
  }
  
  async gitDiffAnalysis(): Promise<DiffResult> {
    // Run git diff analysis for traceability
  }
}
```

### **2. Context Consolidator**
```typescript
class ContextConsolidator {
  async consolidateCommitContext(commitHash: string): Promise<CommitContext> {
    // Implementation for consolidating commit context
  }
  
  async mergeRelatedFossils(fossils: Fossil[]): Promise<ConsolidatedFossil> {
    // Implementation for merging related fossils
  }
  
  async archiveOldFossils(ageDays: number): Promise<ArchiveResult> {
    // Implementation for archiving old fossils
  }
}
```

### **3. Pre-Commit Validator**
```typescript
class PreCommitValidator {
  async validateContext(context: CommitContext): Promise<ValidationResult> {
    // Implementation for validating commit context
  }
  
  async checkFossilGrowth(): Promise<GrowthReport> {
    // Implementation for checking fossil growth
  }
  
  async enforcePolicies(): Promise<PolicyEnforcementResult> {
    // Implementation for enforcing fossil policies
  }
}
```

### **4. Growth Monitor**
```typescript
class FossilGrowthMonitor {
  async trackGrowth(): Promise<GrowthMetrics> {
    // Implementation for tracking fossil growth
  }
  
  async generateAlerts(): Promise<Alert[]> {
    // Implementation for generating growth alerts
  }
  
  async recommendCleanup(): Promise<CleanupRecommendation[]> {
    // Implementation for recommending cleanup actions
  }
}
```

## 📈 Migration Strategy

### Phase 1: Immediate Implementation (Week 1)
1. **Create New Structure**: Implement new fossil directory structure
2. **Develop Consolidation Tools**: Build context consolidation utilities
3. **Update Pre-Commit Hooks**: Integrate context generation into pre-commit
4. **Document New Standards**: Update documentation with new rules

### Phase 2: Consolidation (Week 2-3)
1. **Consolidate Existing Fossils**: Merge related fossils using new tools
2. **Archive Old Fossils**: Move old fossils to archive structure
3. **Update References**: Update all references to use new structure
4. **Validate Migration**: Ensure all functionality works with new structure

### Phase 3: Optimization (Week 4)
1. **Monitor Growth**: Track fossil growth with new metrics
2. **Optimize Performance**: Optimize tools and processes
3. **Refine Policies**: Adjust policies based on usage patterns
4. **Document Lessons**: Document lessons learned and best practices

## 🎯 Expected Outcomes

### Quantitative Benefits
- **Reduced File Count**: From 672 files to ~50-100 active files
- **Improved Performance**: Faster fossil queries and analysis
- **Reduced Storage**: More efficient storage usage
- **Better Organization**: Clear structure and discoverability

### Qualitative Benefits
- **Enhanced Context**: Richer, more comprehensive commit context
- **Improved Traceability**: Better links between commits and context
- **Reduced Maintenance**: Easier to manage and maintain
- **Better Collaboration**: Clearer context for LLM-human collaboration

### Long-Term Benefits
- **Scalable Growth**: Sustainable growth patterns
- **Maintained Value**: Preserved context value without bloat
- **Future-Proof**: Adaptable to changing needs
- **Knowledge Preservation**: Better preservation of important context

## 🔧 Implementation Commands

### **Update Canonical Fossils**
```bash
# Update validation results
bun run src/cli/canonical-fossil-manager.ts update-validation

# Update performance results
bun run src/cli/canonical-fossil-manager.ts update-performance

# Update analysis results
bun run src/cli/canonical-fossil-manager.ts update-analysis

# Update test results
bun run src/cli/canonical-fossil-manager.ts update-test
```

### **Generate YAML Context**
```bash
# Generate YAML context for ML processes
bun run src/cli/canonical-fossil-manager.ts generate-yaml
```

### **Git Diff Analysis**
```bash
# Run git diff analysis for traceability
bun run src/cli/canonical-fossil-manager.ts git-diff-analysis
```

### **Automatic Cleanup**
```bash
# Run automatic cleanup
bun run validate:unified

# Check cleanup recommendations
bun run scripts/check-fossil-cleanup.ts
```

## 📊 Fossil Types and Purposes

### **Canonical Fossils (Core)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `validation-results.json` | Current validation state | Pre-commit | Stable |
| `performance-results.json` | Current performance metrics | Pre-commit | Stable |
| `analysis-results.json` | Current analysis insights | Analysis runs | Stable |
| `test_results.json` | Current test results | Test runs | Stable |

### **Context Fossils (ML Ready)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `canonical-context.yml` | Human-LLM chat context | Pre-commit | Stable |
| `commit-context.yml` | Per-commit context | Pre-commit | Stable |

### **Project State Fossils (Reference)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `project_status.yml` | Project implementation state | Manual/Auto | Stable |
| `setup_status.yml` | Development environment state | Setup scripts | Stable |
| `roadmap.yml` | Project direction | Manual/Auto | Stable |

### **Archive Fossils (Historical)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `*-{timestamp}.json` | Historical versions | Canonical updates | Timestamped |

## 🔍 Traceability and Cohesion

### **Git Diff Analysis Process**
1. **Pre-commit**: Capture staged and unstaged changes
2. **Fossil Filtering**: Identify fossil-related changes
3. **Traceability Fossil**: Create traceability record
4. **ML Integration**: Feed to ML processes for pattern recognition

### **Cohesion Tracking**
- **Cross-references**: Fossils reference related fossils
- **Metadata consistency**: Standardized metadata across all fossils
- **Version tracking**: All fossils have version information
- **Transversal value**: Calculated value for ML processes

### **ML Process Integration**
- **YAML context**: Human-readable format for LLM chat
- **Structured data**: JSON format for ML workflows
- **Transversal value**: Numeric value for ML scoring
- **Historical patterns**: Archive data for ML training

## 🚀 Future Enhancements

### **Planned Improvements**
- [ ] **ML-powered fossil analysis**: Automatic pattern recognition
- [ ] **Cross-fossil correlation**: Automatic linking of related fossils
- [ ] **Predictive fossilization**: ML-driven fossil creation
- [ ] **Automated cleanup**: ML-driven fossil cleanup
- [ ] **Enhanced traceability**: Git blame integration for fossil changes

### **Integration Points**
- [ ] **CI/CD pipelines**: Automated fossil updates
- [ ] **LLM services**: Direct fossil consumption
- [ ] **ML workflows**: Structured data feeds
- [ ] **Human review**: YAML context for human analysis

## 📋 Maintenance Guidelines

### **Regular Tasks**
1. **Monitor fossil growth**: Track total fossil count and size
2. **Review canonical fossils**: Ensure they reflect current state
3. **Archive cleanup**: Remove old archives when no longer needed
4. **YAML context validation**: Ensure context is accurate and useful

### **Quality Standards**
1. **Schema compliance**: All fossils must follow defined schemas
2. **Content quality**: Fossils must provide valuable, distinct context
3. **Traceability**: Fossils must be traceable to their source
4. **Cohesion**: Related fossils must be properly linked
5. **Transversal value**: Fossils must have meaningful transversal value

### **Cleanup Policies**
1. **Archive retention**: Keep archives for 1 year by default
2. **Size limits**: Monitor total fossil directory size
3. **Duplicate detection**: Remove duplicate fossils
4. **Orphan cleanup**: Remove fossils not referenced in git history

## ✅ Success Metrics

### Growth Management
- **File Count**: Maintain <100 active fossils
- **Growth Rate**: <5 new fossils per week
- **Archive Rate**: >80% of fossils archived after 30 days

### Context Quality
- **Completeness**: >90% of commits have complete context
- **Relevance**: >85% of context is relevant to commit
- **Actionability**: >80% of recommendations are actionable

### Performance
- **Query Speed**: <1 second for context retrieval
- **Storage Efficiency**: <20MB total fossil storage
- **Maintenance Time**: <30 minutes per week for fossil management

### 📋 Naming Standard (2025)

- **Prefix**: Information source (llm., ml., human., etc.)
- **Topic**: Concise, topic-driven name (analysis, performance, actionable_insights, etc.)
- **Extension**: .json (machine), .yml (config/context), .md (human-facing)
- **No hyphens, camelCase, or ambiguous names**
- **Examples**: llm.analysis.json, ml.analysis.json, human.actionable_insights.md, performance.json, llm.performance.json, ml.performance.json

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## 🎯 Expected Outcomes

### Quantitative Benefits
- **Reduced File Count**: From 672 files to ~50-100 active files
- **Improved Performance**: Faster fossil queries and analysis
- **Reduced Storage**: More efficient storage usage
- **Better Organization**: Clear structure and discoverability

### Qualitative Benefits
- **Enhanced Context**: Richer, more comprehensive commit context
- **Improved Traceability**: Better links between commits and context
- **Reduced Maintenance**: Easier to manage and maintain
- **Better Collaboration**: Clearer context for LLM-human collaboration

### Long-Term Benefits
- **Scalable Growth**: Sustainable growth patterns
- **Maintained Value**: Preserved context value without bloat
- **Future-Proof**: Adaptable to changing needs
- **Knowledge Preservation**: Better preservation of important context

## 🔧 Implementation Commands

### **Update Canonical Fossils**
```bash
# Update validation results
bun run src/cli/canonical-fossil-manager.ts update-validation

# Update performance results
bun run src/cli/canonical-fossil-manager.ts update-performance

# Update analysis results
bun run src/cli/canonical-fossil-manager.ts update-analysis

# Update test results
bun run src/cli/canonical-fossil-manager.ts update-test
```

### **Generate YAML Context**
```bash
# Generate YAML context for ML processes
bun run src/cli/canonical-fossil-manager.ts generate-yaml
```

### **Git Diff Analysis**
```bash
# Run git diff analysis for traceability
bun run src/cli/canonical-fossil-manager.ts git-diff-analysis
```

### **Automatic Cleanup**
```bash
# Run automatic cleanup
bun run validate:unified

# Check cleanup recommendations
bun run scripts/check-fossil-cleanup.ts
```

## 📊 Fossil Types and Purposes

### **Canonical Fossils (Core)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `validation-results.json` | Current validation state | Pre-commit | Stable |
| `performance-results.json` | Current performance metrics | Pre-commit | Stable |
| `analysis-results.json` | Current analysis insights | Analysis runs | Stable |
| `test_results.json` | Current test results | Test runs | Stable |

### **Context Fossils (ML Ready)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `canonical-context.yml` | Human-LLM chat context | Pre-commit | Stable |
| `commit-context.yml` | Per-commit context | Pre-commit | Stable |

### **Project State Fossils (Reference)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `project_status.yml` | Project implementation state | Manual/Auto | Stable |
| `setup_status.yml` | Development environment state | Setup scripts | Stable |
| `roadmap.yml` | Project direction | Manual/Auto | Stable |

### **Archive Fossils (Historical)**
| File | Purpose | Update Trigger | Filename Pattern |
|------|---------|----------------|------------------|
| `*-{timestamp}.json` | Historical versions | Canonical updates | Timestamped |

## 🔍 Traceability and Cohesion

### **Git Diff Analysis Process**
1. **Pre-commit**: Capture staged and unstaged changes
2. **Fossil Filtering**: Identify fossil-related changes
3. **Traceability Fossil**: Create traceability record
4. **ML Integration**: Feed to ML processes for pattern recognition

### **Cohesion Tracking**
- **Cross-references**: Fossils reference related fossils
- **Metadata consistency**: Standardized metadata across all fossils
- **Version tracking**: All fossils have version information
- **Transversal value**: Calculated value for ML processes

### **ML Process Integration**
- **YAML context**: Human-readable format for LLM chat
- **Structured data**: JSON format for ML workflows
- **Transversal value**: Numeric value for ML scoring
- **Historical patterns**: Archive data for ML training

## 🚀 Future Enhancements

### **Planned Improvements**
- [ ] **ML-powered fossil analysis**: Automatic pattern recognition
- [ ] **Cross-fossil correlation**: Automatic linking of related fossils
- [ ] **Predictive fossilization**: ML-driven fossil creation
- [ ] **Automated cleanup**: ML-driven fossil cleanup
- [ ] **Enhanced traceability**: Git blame integration for fossil changes

### **Integration Points**
- [ ] **CI/CD pipelines**: Automated fossil updates
- [ ] **LLM services**: Direct fossil consumption
- [ ] **ML workflows**: Structured data feeds
- [ ] **Human review**: YAML context for human analysis

## 📋 Maintenance Guidelines

### **Regular Tasks**
1. **Monitor fossil growth**: Track total fossil count and size
2. **Review canonical fossils**: Ensure they reflect current state
3. **Archive cleanup**: Remove old archives when no longer needed
4. **YAML context validation**: Ensure context is accurate and useful

### **Quality Standards**
1. **Schema compliance**: All fossils must follow defined schemas
2. **Content quality**: Fossils must provide valuable, distinct context
3. **Traceability**: Fossils must be traceable to their source
4. **Cohesion**: Related fossils must be properly linked
5. **Transversal value**: Fossils must have meaningful transversal value

### **Cleanup Policies**
1. **Archive retention**: Keep archives for 1 year by default
2. **Size limits**: Monitor total fossil directory size
3. **Duplicate detection**: Remove duplicate fossils
4. **Orphan cleanup**: Remove fossils not referenced in git history

## ✅ Success Metrics

### Growth Management
- **File Count**: Maintain <100 active fossils
- **Growth Rate**: <5 new fossils per week
- **Archive Rate**: >80% of fossils archived after 30 days

### Context Quality
- **Completeness**: >90% of commits have complete context
- **Relevance**: >85% of context is relevant to commit
- **Actionability**: >80% of recommendations are actionable

### Performance
- **Query Speed**: <1 second for context retrieval
- **Storage Efficiency**: <20MB total fossil storage
- **Maintenance Time**: <30 minutes per week for fossil management

### 📋 Naming Standard (2025)

- **Prefix**: Information source (llm., ml., human., etc.)
- **Topic**: Concise, topic-driven name (analysis, performance, actionable_insights, etc.)
- **Extension**: .json (machine), .yml (config/context), .md (human-facing)
- **No hyphens, camelCase, or ambiguous names**
- **Examples**: llm.analysis.json, ml.analysis.json, human.actionable_insights.md, performance.json, llm.performance.json, ml.performance.json

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  | File/Folder                                               | Purpose/Type                    | Status/Notes                                                                                 |
|----|-----------------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| 1  | `fossils/roadmap.yml`                                    | Project roadmap (YAML)           | Canonical, referenced in all planning                                                        |
| 2  | `fossils/project_status.yml`                             | Project status (YAML)            | Canonical, referenced in status checks                                                       |
| 3  | `fossils/setup_status.yml`                               | Setup/onboarding status          | Canonical, updated by onboarding scripts                                                     |
| 4  | `fossils/footprint.json`                                 | File footprint (full)            | **Exceeds limit**: Split/Archive recommended                                                |
| 5  | `fossils/footprint-results.json`                         | File footprint (results)         | **Exceeds limit**: Split/Archive recommended                                                |
| 6  | `fossils/analysis-results.json`                          | Analysis summary                 | Canonical, ML-ready                                                                         |
| 7  | `fossils/llm_insights/llm.analysis.json`                 | LLM insights (JSON)              | Canonical, ML-ready                                                                         |
| 8  | `fossils/llm_insights/llm.performance.json`              | LLM performance                  | Canonical, ML-ready                                                                         |
| 9  | `fossils/ml_insights/ml.analysis.json`                   | ML insights (JSON)               | Canonical, ML-ready                                                                         |
| 10 | `fossils/ml_insights/ml.performance.json`                | ML performance                   | Canonical, ML-ready                                                                         |
| 11 | `fossils/human_insights/human.actionable_insights.md`    | Human insights                   | Canonical, human-facing                                                                     |
| 12 | `fossils/performance/performance.json`                   | Performance metrics              | Canonical, ML-ready                                                                         |
| 13 | `fossils/performance/performance.md`                     | Performance report               | Human-facing, summary                                                                       |
| 14 | `fossils/monitoring/monitoring.json`                     | Monitoring metrics               | Canonical, ML-ready                                                                         |
| 15 | `fossils/monitoring/monitoring.md`                       | Monitoring report                | Human-facing, summary                                                                       |
| 16 | `fossils/tests/integration_tests.yml`                    | Integration test results         | Canonical, ML-ready                                                                         |
| 17 | `fossils/tests/unit_tests.json`                          | Unit test results                | Canonical, ML-ready                                                                         |
| 18 | `fossils/tests/performance_tests.md`                     | Test performance report          | Human-facing, summary                                                                       |
| 19 | `fossils/context/canonical_context.yml`                  | LLM/ML context                   | Canonical, ML-ready, for LLM chat                                                           |
| 20 | `fossils/context/commit-context.yml`                     | Per-commit context               | Canonical, ML-ready, for traceability                                                       |
| 21 | `fossils/commit_audits/commit_audits.summary.json`       | Commit audits                    | Canonical, ML-ready                                                                         |
| 22 | `fossils/traceability/current_traceability.json`         | Traceability                     | Canonical, ML-ready                                                                         |
| 23 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 24 | `fossils/FOSSIL_STRUCTURE_TREE_DIAGRAM.md`               | Structure diagram                | Human-facing, summary                                                                       |
| 25 | `fossils/CURRENT_FOSSIL_STRUCTURE_SOURCE_OF_TRUTH.md`    | Source of truth                  | Canonical, ML-ready                                                                         |
| 26 | `fossils/readme.md`                                      | Fossil system readme             | Human-facing, summary                                                                       |
| 27 | `fossils/roadmap/roadmap_insights_report.md`             | Roadmap insights report          | Human-facing, summary                                                                       |
| 28 | `fossils/roadmap/roadmap_progress.md`                    | Roadmap progress                 | Human-facing, summary                                                                       |
| 29 | `fossils/roadmap/roadmap.md`                             | Roadmap markdown                 | Human-facing, summary                                                                       |
| 30 | `fossils/ephemeral/address/llm.draft.patterns.project_concepts.yml` | LLM draft patterns | Ephemeral, ML/LLM context, **review for canonicalization**                                  |
| 31 | `fossils/commit_audits/batch-execution-*.json`           | Batch commit audits (JSON)       | **Exceeds limit**: Archive or summarize older entries                                       |
| 32 | `fossils/commit_audits/batch-audit-plan-*.json`          | Batch audit plans (JSON)         | **Exceeds limit**: Archive or summarize older entries                                       |
| 33 | `fossils/commit_audits/batch-execution-*.yml`            | Batch commit audits (YAML)       | Archive or summarize as needed                                                              |
| 34 | `fossils/commit_audits/batch-audit-plan-*.yml`           | Batch audit plans (YAML)         | Archive or summarize as needed                                                              |
| 35 | `fossils/roadmap.llm.insights.json`                      | Roadmap LLM insights             | **Exceeds limit**: Split/Archive recommended                                                |
| 36 | `fossils/roadmap_insights.json`                          | Roadmap insights (JSON)          | **Exceeds limit**: Split/Archive recommended                                                |
| 37 | `fossils/roadmap.insights_summary.json`                  | Roadmap insights summary         | **Exceeds limit**: Split/Archive recommended                                                |
| 38 | `fossils/roadmap.insights.web.json`                      | Roadmap insights (web)           | **Exceeds limit**: Split/Archive recommended                                                |
| 39 | `fossils/roadmap.insights.api.json`                      | Roadmap insights (API)           | **Exceeds limit**: Split/Archive recommended                                                |
| 40 | `fossils/structure_definition.yml`                       | Structure definition             | Canonical, ML-ready                                                                         |
| 41 | `fossils/context/patterns/project_concepts.yml`          | Project concept patterns         | Canonical, ML-ready                                                                         |
| 42 | `fossils/validation.json`                                | Validation results               | Canonical, ML-ready                                                                         |
| 43 | `fossils/monitoring/performance_data.json`               | Monitoring performance data      | Canonical, ML-ready                                                                         |
| 44 | `fossils/monitoring/test_monitoring_data.json`           | Test monitoring data             | Canonical, ML-ready                                                                         |
| 45 | `fossils/ml.analysis.json`                               | ML analysis                      | Canonical, ML-ready                                                                         |
| 46 | `fossils/llm.snapshots.json`                             | LLM snapshots                    | Canonical, ML-ready                                                                         |
| 47 | `fossils/llm-snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 48 | `fossils/llm_snapshots.json`                             | LLM snapshots (alt)              | Canonical, ML-ready                                                                         |
| 49 | `fossils/coverage_report.json`                           | Coverage report                  | Canonical, ML-ready                                                                         |
| 50 | (reserved for new high-value fossil)                     | (TBD)                            | Only add if it meets all criteria above                                                     |

- **Legend:**
  - **Exceeds limit**: File is over 500 lines/128KB (recommended) or 1000 lines/256KB (hard limit); split, archive, or summarize.
  - **Ephemeral**: Not canonical; review for promotion or cleanup.
  - **Canonical**: ML-ready, referenced, and validated.
  - **Human-facing**: Markdown/MDX, for documentation or audit.

## Ephemeral Pattern Enforcement & Audit Utility

A dedicated audit/refactor utility is provided to enforce the ephemeral pattern for all temp/original/backup files/scripts. This utility detects, renames, and moves files to follow the ephemeral convention, ensuring .gitignore compliance and project cleanliness. Integrate this as a DX transversal utility and run it pre-commit or in CI to maintain canonical standards.

- **Run:** `bun run scripts/audit-ephemeral-pattern.ts`
- **Purpose:** Enforces ephemeral pattern, prevents bloat and ambiguity.
- **Integration:** Recommended for all contributors and CI workflows.
- **See also:** [Ephemeral Context Management Guide](./ephemeral/address/ephemeral_context_management.md)

## 🆕 Canonical Fossil File Limit and Management Policy (2025-07)

### 50-File Limit: Canonical, ML-Ready Fossils Only

- **Maximum of 50 active canonical fossils** in the main fossil structure (see table below).
- **Each fossil must:**
  - Be ML-ready, canonical, and follow naming conventions
  - Serve a unique, high-value purpose (no redundancy)
  - Be referenced in roadmap, project status, or automation scripts
  - Have a clear schema and excerpt/metadata for auditability
  - Not exceed 500 lines or 128KB (recommended); hard limit: 1000 lines/256KB
- **Policy:**
  - Only add a new fossil if it replaces/archives an existing one or is required for a new, high-value context
  - If the limit is reached, archive or consolidate existing fossils before adding new ones
  - Use the canonical fossil manager for all changes
- **Enforcement:**
  - Pre-commit validator and canonical fossil manager check file count and size/line limits
  - Commits exceeding these limits are blocked with clear error messages

### Canonical Fossil File Table (2025, ML-Ready, Canonical-Only)

| #  |