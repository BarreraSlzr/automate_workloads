# 📊 Cohesion Analysis Methodology

## 📋 Overview

This document provides a systematic methodology for analyzing and improving utility cohesion across the automation ecosystem. Cohesion analysis helps identify opportunities for consolidation, reuse, and optimization.

## 🎯 Cohesion Principles

### 1. High Cohesion
Utilities should have a single, well-defined responsibility and be internally focused.

### 2. Low Coupling
Utilities should have minimal dependencies on other utilities and modules.

### 3. Clear Interfaces
Utilities should have clear, well-documented interfaces that are easy to understand and use.

### 4. Consistent Patterns
Utilities should follow consistent patterns for similar operations.

## 🔍 Cohesion Metrics

### 1. Utility Count Metrics
- **Total Utilities**: Number of utility files in `src/utils/`
- **Utility Categories**: Number of distinct utility categories
- **Utility Size**: Lines of code per utility
- **Utility Complexity**: Cyclomatic complexity per utility

### 2. Dependency Metrics
- **Import Dependencies**: Number of imports per utility
- **Cross-Module Dependencies**: Dependencies between different modules
- **Circular Dependencies**: Detection of circular dependency chains
- **Dependency Depth**: Maximum depth of dependency chains

### 3. Duplication Metrics
- **Code Duplication**: Percentage of duplicated code
- **Function Duplication**: Number of duplicate functions
- **Pattern Duplication**: Number of duplicate patterns
- **Interface Duplication**: Number of duplicate interfaces

### 4. Reuse Metrics
- **Utility Reuse Rate**: Percentage of utilities that are reused
- **Import Frequency**: How often utilities are imported
- **Cross-Module Reuse**: Reuse across different modules
- **Pattern Adoption**: Adoption of documented patterns

## 🔧 Cohesion Analysis Tools

### 1. Static Analysis Tools

#### TypeScript Compiler Analysis
```bash
# Analyze TypeScript dependencies
npx tsc --noEmit --listFiles | grep utils/

# Generate dependency graph
npx madge --image dependency-graph.svg src/utils/
```

#### ESLint Analysis
```bash
# Analyze code complexity
npx eslint src/utils/ --format json | jq '.[] | select(.ruleId == "complexity")'

# Analyze import patterns
npx eslint src/utils/ --format json | jq '.[] | select(.ruleId == "import/no-duplicates")'
```

#### Code Duplication Analysis
```bash
# Install jscpd for duplication detection
npm install -g jscpd

# Analyze duplication
jscpd src/utils/ --reporters console,json --output ./cohesion-analysis
```

### 2. Custom Analysis Scripts

#### Utility Discovery Script
```bash
#!/bin/bash
# analyze-utilities.sh
echo "=== Utility Analysis Report ==="
echo ""

echo "1. Utility Count:"
find src/utils/ -name "*.ts" | wc -l

echo ""
echo "2. Utility Categories:"
find src/utils/ -name "*.ts" | sed 's|src/utils/||' | sed 's|\.ts||' | sort

echo ""
echo "3. Import Dependencies:"
grep -r "import.*utils" src/ | wc -l

echo ""
echo "4. Export Analysis:"
grep -r "export.*function\|export.*class" src/utils/ | wc -l
```

#### Dependency Analysis Script
```bash
#!/bin/bash
# analyze-dependencies.sh
echo "=== Dependency Analysis ==="
echo ""

echo "1. Cross-Module Dependencies:"
find src/ -name "*.ts" -exec grep -l "import.*utils" {} \; | sort | uniq -c

echo ""
echo "2. Most Used Utilities:"
grep -r "import.*utils" src/ | sed 's/.*import.*from.*utils\///' | sed 's/[";].*//' | sort | uniq -c | sort -nr

echo ""
echo "3. Circular Dependencies:"
npx madge --circular src/utils/
```

#### Pattern Analysis Script
```bash
#!/bin/bash
# analyze-patterns.sh
echo "=== Pattern Analysis ==="
echo ""

echo "1. Fossil Pattern Usage:"
grep -r "createFossil\|FossilManager" src/ | wc -l

echo ""
echo "2. CLI Pattern Usage:"
grep -r "executeCommand\|GitHubCLICommands" src/ | wc -l

echo ""
echo "3. Validation Pattern Usage:"
grep -r "Schema\.parse\|z\." src/ | wc -l

echo ""
echo "4. Error Handling Pattern Usage:"
grep -r "success.*error\|UtilityResult" src/ | wc -l
```

## 📊 Cohesion Analysis Process

### Phase 1: Data Collection

#### 1.1 Utility Inventory
```bash
# Collect utility information
find src/utils/ -name "*.ts" -exec wc -l {} \; > utility-sizes.txt
find src/utils/ -name "*.ts" -exec grep -c "export" {} \; > utility-exports.txt
```

#### 1.2 Dependency Mapping
```bash
# Map dependencies
npx madge --json src/utils/ > dependency-map.json
npx madge --circular src/utils/ > circular-deps.txt
```

#### 1.3 Usage Analysis
```bash
# Analyze usage patterns
grep -r "import.*utils" src/ > utility-usage.txt
grep -r "from.*utils" src/ > utility-imports.txt
```

### Phase 2: Analysis

#### 2.1 Cohesion Scoring
```typescript
// cohesion-scorer.ts
interface CohesionScore {
  utility: string;
  size: number;
  complexity: number;
  dependencies: number;
  reuse: number;
  patternCompliance: number;
  totalScore: number;
}

function calculateCohesionScore(utility: string): CohesionScore {
  // Implementation for calculating cohesion score
  return {
    utility,
    size: calculateSize(utility),
    complexity: calculateComplexity(utility),
    dependencies: calculateDependencies(utility),
    reuse: calculateReuse(utility),
    patternCompliance: calculatePatternCompliance(utility),
    totalScore: 0 // Calculate weighted score
  };
}
```

#### 2.2 Duplication Analysis
```typescript
// duplication-analyzer.ts
interface DuplicationAnalysis {
  file1: string;
  file2: string;
  similarity: number;
  duplicateLines: number;
  duplicateFunctions: string[];
}

function analyzeDuplication(): DuplicationAnalysis[] {
  // Implementation for duplication analysis
  return [];
}
```

#### 2.3 Pattern Compliance Analysis
```typescript
// pattern-analyzer.ts
interface PatternCompliance {
  utility: string;
  fossilPattern: boolean;
  cliPattern: boolean;
  validationPattern: boolean;
  errorHandlingPattern: boolean;
  complianceScore: number;
}

function analyzePatternCompliance(): PatternCompliance[] {
  // Implementation for pattern compliance analysis
  return [];
}
```

### Phase 3: Reporting

#### 3.1 Cohesion Report Generation
```typescript
// cohesion-reporter.ts
interface CohesionReport {
  summary: {
    totalUtilities: number;
    averageCohesionScore: number;
    duplicationPercentage: number;
    patternCompliancePercentage: number;
  };
  utilities: CohesionScore[];
  duplicates: DuplicationAnalysis[];
  patterns: PatternCompliance[];
  recommendations: string[];
}

function generateCohesionReport(): CohesionReport {
  // Implementation for generating cohesion report
  return {
    summary: {
      totalUtilities: 0,
      averageCohesionScore: 0,
      duplicationPercentage: 0,
      patternCompliancePercentage: 0
    },
    utilities: [],
    duplicates: [],
    patterns: [],
    recommendations: []
  };
}
```

## 📈 Cohesion Improvement Strategies

### 1. Utility Consolidation

#### Identify Consolidation Candidates
```typescript
// consolidation-analyzer.ts
interface ConsolidationCandidate {
  utilities: string[];
  similarity: number;
  consolidationType: 'merge' | 'extract' | 'refactor';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

function findConsolidationCandidates(): ConsolidationCandidate[] {
  // Implementation for finding consolidation candidates
  return [];
}
```

#### Consolidation Planning
```typescript
// consolidation-planner.ts
interface ConsolidationPlan {
  phase: number;
  candidates: ConsolidationCandidate[];
  dependencies: string[];
  risks: string[];
  benefits: string[];
}

function createConsolidationPlan(): ConsolidationPlan {
  // Implementation for creating consolidation plan
  return {
    phase: 1,
    candidates: [],
    dependencies: [],
    risks: [],
    benefits: []
  };
}
```

### 2. Pattern Standardization

#### Pattern Gap Analysis
```typescript
// pattern-gap-analyzer.ts
interface PatternGap {
  utility: string;
  missingPatterns: string[];
  inconsistentPatterns: string[];
  recommendations: string[];
}

function analyzePatternGaps(): PatternGap[] {
  // Implementation for pattern gap analysis
  return [];
}
```

#### Pattern Implementation Plan
```typescript
// pattern-implementation-plan.ts
interface PatternImplementation {
  pattern: string;
  utilities: string[];
  implementationSteps: string[];
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

function createPatternImplementationPlan(): PatternImplementation[] {
  // Implementation for pattern implementation planning
  return [];
}
```

### 3. Dependency Optimization

#### Dependency Analysis
```typescript
// dependency-optimizer.ts
interface DependencyOptimization {
  utility: string;
  currentDependencies: string[];
  unnecessaryDependencies: string[];
  missingDependencies: string[];
  optimizationSteps: string[];
}

function analyzeDependencies(): DependencyOptimization[] {
  // Implementation for dependency analysis
  return [];
}
```

#### Dependency Reduction Plan
```typescript
// dependency-reduction-plan.ts
interface DependencyReduction {
  utility: string;
  currentCount: number;
  targetCount: number;
  reductionSteps: string[];
  impact: 'low' | 'medium' | 'high';
}

function createDependencyReductionPlan(): DependencyReduction[] {
  // Implementation for dependency reduction planning
  return [];
}
```

## 🔄 Continuous Cohesion Monitoring

### 1. Automated Analysis

#### CI/CD Integration
```yaml
# .github/workflows/cohesion-analysis.yml
name: Cohesion Analysis
on: [push, pull_request]

jobs:
  cohesion-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run cohesion analysis
        run: |
          npm run analyze:cohesion
          npm run analyze:duplication
          npm run analyze:patterns
      
      - name: Generate report
        run: npm run generate:cohesion-report
      
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: cohesion-report
          path: cohesion-analysis/
```

#### Scheduled Analysis
```yaml
# .github/workflows/scheduled-cohesion.yml
name: Scheduled Cohesion Analysis
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  weekly-cohesion:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run weekly cohesion analysis
        run: npm run analyze:cohesion:weekly
```

### 2. Monitoring Dashboard

#### Cohesion Metrics Dashboard
```typescript
// cohesion-dashboard.ts
interface CohesionDashboard {
  metrics: {
    cohesionScore: number;
    duplicationPercentage: number;
    patternCompliance: number;
    utilityCount: number;
  };
  trends: {
    cohesionScore: number[];
    duplicationPercentage: number[];
    patternCompliance: number[];
  };
  alerts: {
    lowCohesion: string[];
    highDuplication: string[];
    patternViolations: string[];
  };
}

function generateCohesionDashboard(): CohesionDashboard {
  // Implementation for generating cohesion dashboard
  return {
    metrics: {
      cohesionScore: 0,
      duplicationPercentage: 0,
      patternCompliance: 0,
      utilityCount: 0
    },
    trends: {
      cohesionScore: [],
      duplicationPercentage: [],
      patternCompliance: []
    },
    alerts: {
      lowCohesion: [],
      highDuplication: [],
      patternViolations: []
    }
  };
}
```

## 📋 Cohesion Analysis Checklist

### Before Analysis
- [ ] **Setup Tools**: Install analysis tools (madge, jscpd, etc.)
- [ ] **Define Metrics**: Establish cohesion metrics and thresholds
- [ ] **Create Baselines**: Establish current cohesion baselines
- [ ] **Set Goals**: Define target cohesion improvements

### During Analysis
- [ ] **Collect Data**: Gather utility and dependency data
- [ ] **Calculate Metrics**: Compute cohesion scores and metrics
- [ ] **Identify Issues**: Find low cohesion and duplication issues
- [ ] **Generate Reports**: Create detailed analysis reports

### After Analysis
- [ ] **Review Results**: Review analysis results with team
- [ ] **Prioritize Improvements**: Prioritize cohesion improvements
- [ ] **Create Action Plan**: Develop improvement action plan
- [ ] **Track Progress**: Monitor improvement progress

## 📚 Additional Resources

### Tools
- **madge**: Dependency analysis and visualization
- **jscpd**: Code duplication detection
- **eslint**: Code quality and complexity analysis
- **TypeScript compiler**: Type checking and dependency analysis

### Documentation
- `docs/UTILITY_PATTERNS.md` - Utility pattern documentation
- `docs/REUSE_GUIDELINES.md` - Utility reuse guidelines
- `docs/API_REFERENCE.md` - Complete utility reference

### Examples
- `examples/cohesion-analysis/` - Cohesion analysis examples
- `tests/cohesion/` - Cohesion analysis tests
- `scripts/cohesion/` - Cohesion analysis scripts

This cohesion analysis methodology provides a systematic approach to measuring and improving utility cohesion across the automation ecosystem. 