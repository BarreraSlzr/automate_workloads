# 🧠 LLM Insights Rule Implementation Guide

## 📋 Overview

This guide provides a comprehensive approach for implementing LLM insights rules for future project commits. It integrates the LLM Insights Commit Traceability System with conventional commits, fossil-backed storage, and roadmap materialization to create a robust automation ecosystem.

### 🎯 Purpose
- **Automated Rule Implementation**: Define and implement rules for LLM insight generation
- **Conventional Commit Integration**: Link insights to conventional commit messages
- **Fossil-Backed Traceability**: Store insights as fossils for full audit trail
- **Roadmap Materialization**: Automatically update roadmap.yml with LLM insights
- **Batch Processing**: Support for processing multiple commits and changes

## 🔄 Rule Implementation Strategy

### 1. Rule Definition Framework

#### Rule Structure
```typescript
interface LLMInsightRule {
  id: string;
  name: string;
  description: string;
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  metadata: RuleMetadata;
}

interface RuleTrigger {
  type: 'commit' | 'file-change' | 'roadmap-update' | 'automation-event';
  patterns: string[];
  conditions: TriggerCondition[];
}

interface RuleCondition {
  type: 'file-pattern' | 'commit-message' | 'change-size' | 'author' | 'time';
  operator: 'equals' | 'contains' | 'matches' | 'greater-than' | 'less-than';
  value: any;
  negated?: boolean;
}

interface RuleAction {
  type: 'generate-insight' | 'update-roadmap' | 'create-fossil' | 'trigger-automation';
  parameters: Record<string, any>;
  fallback?: RuleAction;
}
```

#### Example Rule Definitions
```typescript
const RULE_REGISTRY: Record<string, LLMInsightRule> = {
  'conventional-commit-analysis': {
    id: 'conventional-commit-analysis',
    name: 'Conventional Commit Analysis',
    description: 'Analyze conventional commits and generate insights',
    trigger: {
      type: 'commit',
      patterns: ['^(feat|fix|docs|style|refactor|test|chore|perf)\\([^)]+\\):'],
      conditions: []
    },
    conditions: [
      {
        type: 'commit-message',
        operator: 'matches',
        value: '^(feat|fix|docs|style|refactor|test|chore|perf)\\([^)]+\\):'
      }
    ],
    actions: [
      {
        type: 'generate-insight',
        parameters: {
          promptId: 'conventional-commit-analysis-v1',
          model: 'llama2',
          temperature: 0.3
        }
      },
      {
        type: 'update-roadmap',
        parameters: {
          autoUpdate: true,
          createTasks: true
        }
      }
    ],
    priority: 'high',
    enabled: true,
    metadata: {
      version: '1.0.0',
      author: 'automation-system',
      createdAt: '2025-07-05T00:00:00Z'
    }
  },

  'fossil-backed-creation': {
    id: 'fossil-backed-creation',
    name: 'Fossil-Backed Creation Detection',
    description: 'Detect and validate fossil-backed creation patterns',
    trigger: {
      type: 'file-change',
      patterns: ['src/utils/*.ts', 'scripts/*.ts'],
      conditions: []
    },
    conditions: [
      {
        type: 'file-pattern',
        operator: 'contains',
        value: 'createFossilIssue|createFossilLabel|createFossilMilestone'
      }
    ],
    actions: [
      {
        type: 'generate-insight',
        parameters: {
          promptId: 'fossil-pattern-validation-v1',
          model: 'llama2',
          temperature: 0.2
        }
      }
    ],
    priority: 'critical',
    enabled: true,
    metadata: {
      version: '1.0.0',
      author: 'automation-system',
      createdAt: '2025-07-05T00:00:00Z'
    }
  },

  'llm-integration-patterns': {
    id: 'llm-integration-patterns',
    name: 'LLM Integration Pattern Detection',
    description: 'Detect and validate LLM integration patterns',
    trigger: {
      type: 'file-change',
      patterns: ['src/services/*.ts', 'src/utils/*.ts'],
      conditions: []
    },
    conditions: [
      {
        type: 'file-pattern',
        operator: 'contains',
        value: 'LLMService|callLLM|routingPreference'
      }
    ],
    actions: [
      {
        type: 'generate-insight',
        parameters: {
          promptId: 'llm-integration-analysis-v1',
          model: 'llama2',
          temperature: 0.3
        }
      },
      {
        type: 'trigger-automation',
        parameters: {
          automationId: 'llm-pattern-validation',
          parameters: {
            validateRouting: true,
            checkFallbacks: true
          }
        }
      }
    ],
    priority: 'high',
    enabled: true,
    metadata: {
      version: '1.0.0',
      author: 'automation-system',
      createdAt: '2025-07-05T00:00:00Z'
    }
  }
};
```

### 2. Rule Engine Implementation

#### Rule Engine Class
```typescript
class LLMInsightRuleEngine {
  private rules: Map<string, LLMInsightRule>;
  private llmService: LLMService;
  private fossilManager: FossilManager;

  constructor() {
    this.rules = new Map();
    this.llmService = new LLMService();
    this.fossilManager = new FossilManager();
    this.loadRules();
  }

  /**
   * Load rules from registry
   */
  private loadRules(): void {
    Object.entries(RULE_REGISTRY).forEach(([id, rule]) => {
      this.rules.set(id, rule);
    });
  }

  /**
   * Process commit with applicable rules
   */
  async processCommit(params: {
    commitHash: string;
    commitMessage: string;
    changes: FileChange[];
    author: string;
    timestamp: string;
  }): Promise<RuleExecutionResult[]> {
    const results: RuleExecutionResult[] = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      if (await this.shouldTriggerRule(rule, params)) {
        const result = await this.executeRule(rule, params);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Check if rule should be triggered
   */
  private async shouldTriggerRule(
    rule: LLMInsightRule,
    params: any
  ): Promise<boolean> {
    // Check trigger conditions
    if (!this.matchesTrigger(rule.trigger, params)) {
      return false;
    }

    // Check all conditions
    for (const condition of rule.conditions) {
      if (!await this.evaluateCondition(condition, params)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute rule actions
   */
  private async executeRule(
    rule: LLMInsightRule,
    params: any
  ): Promise<RuleExecutionResult> {
    const result: RuleExecutionResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered: true,
      actions: [],
      insights: [],
      fossils: [],
      errors: []
    };

    for (const action of rule.actions) {
      try {
        const actionResult = await this.executeAction(action, params);
        result.actions.push(actionResult);
        
        if (actionResult.type === 'generate-insight') {
          result.insights.push(actionResult.data);
        } else if (actionResult.type === 'create-fossil') {
          result.fossils.push(actionResult.data);
        }
      } catch (error) {
        result.errors.push({
          action: action.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Execute individual action
   */
  private async executeAction(
    action: RuleAction,
    params: any
  ): Promise<ActionResult> {
    switch (action.type) {
      case 'generate-insight':
        return await this.generateInsight(action.parameters, params);
      
      case 'update-roadmap':
        return await this.updateRoadmap(action.parameters, params);
      
      case 'create-fossil':
        return await this.createFossil(action.parameters, params);
      
      case 'trigger-automation':
        return await this.triggerAutomation(action.parameters, params);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Generate LLM insight
   */
  private async generateInsight(
    parameters: any,
    params: any
  ): Promise<ActionResult> {
    const prompt = this.buildInsightPrompt(parameters, params);
    
    const response = await this.llmService.callLLM({
      prompt,
      systemMessage: 'You are an expert code reviewer and automation specialist.',
      model: parameters.model || 'llama2',
      temperature: parameters.temperature || 0.3
    });

    const insight = this.parseInsightResponse(response, params);
    
    return {
      type: 'generate-insight',
      success: true,
      data: insight
    };
  }

  /**
   * Update roadmap with insights
   */
  private async updateRoadmap(
    parameters: any,
    params: any
  ): Promise<ActionResult> {
    // Implementation for roadmap updates
    return {
      type: 'update-roadmap',
      success: true,
      data: { updated: true }
    };
  }

  /**
   * Create fossil for traceability
   */
  private async createFossil(
    parameters: any,
    params: any
  ): Promise<ActionResult> {
    const fossil = await this.fossilManager.createFossil({
      type: 'rule-execution',
      data: parameters,
      metadata: {
        ruleId: parameters.ruleId,
        commitHash: params.commitHash,
        timestamp: new Date().toISOString()
      }
    });

    return {
      type: 'create-fossil',
      success: true,
      data: fossil
    };
  }

  /**
   * Trigger automation
   */
  private async triggerAutomation(
    parameters: any,
    params: any
  ): Promise<ActionResult> {
    // Implementation for automation triggering
    return {
      type: 'trigger-automation',
      success: true,
      data: { triggered: true }
    };
  }

  // Helper methods for condition evaluation
  private matchesTrigger(trigger: RuleTrigger, params: any): boolean {
    // Implementation for trigger matching
    return true;
  }

  private async evaluateCondition(
    condition: RuleCondition,
    params: any
  ): Promise<boolean> {
    // Implementation for condition evaluation
    return true;
  }

  private buildInsightPrompt(parameters: any, params: any): string {
    // Implementation for prompt building
    return `Analyze this commit: ${params.commitMessage}`;
  }

  private parseInsightResponse(response: string, params: any): any {
    // Implementation for response parsing
    return { summary: response };
  }
}
```

### 3. Integration with Commit Workflow

#### Enhanced Pre-commit Hook
```typescript
// scripts/precommit-llm-rule-engine.ts
import { LLMInsightRuleEngine } from '../src/utils/llmInsightRuleEngine';

async function precommitLLMRuleEngine() {
  console.log('🧠 Running LLM Insight Rule Engine...');

  // 1. Initialize rule engine
  const ruleEngine = new LLMInsightRuleEngine();

  // 2. Get staged changes
  const stagedChanges = await getStagedChanges();
  const commitMessage = await getCommitMessage();
  const commitHash = await getCommitHash();

  // 3. Process with rules
  const results = await ruleEngine.processCommit({
    commitHash,
    commitMessage,
    changes: stagedChanges,
    author: await getCommitAuthor(),
    timestamp: new Date().toISOString()
  });

  // 4. Handle results
  for (const result of results) {
    if (result.errors.length > 0) {
      console.warn(`⚠️ Rule ${result.ruleName} had errors:`, result.errors);
    }

    if (result.insights.length > 0) {
      console.log(`💡 Generated ${result.insights.length} insights from ${result.ruleName}`);
    }

    if (result.fossils.length > 0) {
      console.log(`🦴 Created ${result.fossils.length} fossils from ${result.ruleName}`);
    }
  }

  // 5. Update commit message with rule results
  await updateCommitMessageWithRuleResults(commitMessage, results);

  console.log('✅ LLM Insight Rule Engine completed');
}
```

#### Commit Message Enhancement
```typescript
async function updateCommitMessageWithRuleResults(
  originalMessage: string,
  results: RuleExecutionResult[]
): Promise<void> {
  const enhancements: string[] = [];

  // Add rule execution metadata
  const executedRules = results.filter(r => r.triggered).map(r => r.ruleId);
  if (executedRules.length > 0) {
    enhancements.push(`LLM-Rules: ${executedRules.join(', ')}`);
  }

  // Add insight references
  const insightRefs = results
    .flatMap(r => r.insights)
    .map(insight => insight.fossilId)
    .filter(Boolean);
  
  if (insightRefs.length > 0) {
    enhancements.push(`LLM-Insights: ${insightRefs.join(', ')}`);
  }

  // Add automation triggers
  const automationTriggers = results
    .flatMap(r => r.actions)
    .filter(a => a.type === 'trigger-automation')
    .map(a => a.data.automationId)
    .filter(Boolean);
  
  if (automationTriggers.length > 0) {
    enhancements.push(`Automation-Triggers: ${automationTriggers.join(', ')}`);
  }

  // Combine with original message
  const enhancedMessage = [
    originalMessage,
    '',
    ...enhancements
  ].join('\n');

  // Update commit message
  await updateCommitMessage(enhancedMessage);
}
```

### 4. Rule Configuration Management

#### Rule Configuration Schema
```typescript
interface RuleConfiguration {
  rules: LLMInsightRule[];
  globalSettings: {
    enabled: boolean;
    defaultModel: string;
    defaultTemperature: number;
    maxInsightsPerCommit: number;
    fossilStoragePath: string;
  };
  triggers: {
    preCommit: boolean;
    postCommit: boolean;
    batchProcessing: boolean;
    scheduledProcessing: boolean;
  };
  integrations: {
    roadmap: boolean;
    fossilSystem: boolean;
    automationSystem: boolean;
    notificationSystem: boolean;
  };
}
```

#### Configuration Management
```typescript
class RuleConfigurationManager {
  private configPath: string;
  private config: RuleConfiguration;

  constructor(configPath: string = 'fossils/llm_insights/rules-config.json') {
    this.configPath = configPath;
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from file
   */
  private loadConfiguration(): RuleConfiguration {
    if (existsSync(this.configPath)) {
      const content = readFileSync(this.configPath, 'utf8');
      return JSON.parse(content);
    }

    return this.getDefaultConfiguration();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): RuleConfiguration {
    return {
      rules: Object.values(RULE_REGISTRY),
      globalSettings: {
        enabled: true,
        defaultModel: 'llama2',
        defaultTemperature: 0.3,
        maxInsightsPerCommit: 5,
        fossilStoragePath: 'fossils/commit_insights/'
      },
      triggers: {
        preCommit: true,
        postCommit: false,
        batchProcessing: true,
        scheduledProcessing: false
      },
      integrations: {
        roadmap: true,
        fossilSystem: true,
        automationSystem: true,
        notificationSystem: false
      }
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(): Promise<void> {
    const content = JSON.stringify(this.config, null, 2);
    writeFileSync(this.configPath, content);
  }

  /**
   * Enable/disable rule
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      await this.saveConfiguration();
    }
  }

  /**
   * Add new rule
   */
  async addRule(rule: LLMInsightRule): Promise<void> {
    this.config.rules.push(rule);
    await this.saveConfiguration();
  }

  /**
   * Remove rule
   */
  async removeRule(ruleId: string): Promise<void> {
    this.config.rules = this.config.rules.filter(r => r.id !== ruleId);
    await this.saveConfiguration();
  }
}
```

## 🚀 Usage Examples

### 1. Basic Rule Usage

#### Enable Rule Engine
```bash
# Enable rule engine in pre-commit hook
echo 'bun run scripts/precommit-llm-rule-engine.ts' >> .husky/pre-commit
```

#### Run Rule Engine Manually
```bash
# Process current commit
bun run scripts/precommit-llm-rule-engine.ts

# Process specific commit
bun run scripts/commit-insight-generator.ts --commit HEAD

# Process commit range
bun run scripts/commit-insight-generator.ts --range HEAD~5..HEAD
```

### 2. Custom Rule Creation

#### Create Custom Rule
```typescript
// scripts/create-custom-rule.ts
import { RuleConfigurationManager } from '../src/utils/ruleConfigurationManager';

async function createCustomRule() {
  const configManager = new RuleConfigurationManager();

  const customRule: LLMInsightRule = {
    id: 'custom-security-pattern',
    name: 'Security Pattern Detection',
    description: 'Detect security-related patterns in code changes',
    trigger: {
      type: 'file-change',
      patterns: ['src/**/*.ts', 'scripts/**/*.ts'],
      conditions: []
    },
    conditions: [
      {
        type: 'file-pattern',
        operator: 'contains',
        value: 'password|token|secret|key'
      }
    ],
    actions: [
      {
        type: 'generate-insight',
        parameters: {
          promptId: 'security-pattern-analysis-v1',
          model: 'llama2',
          temperature: 0.2
        }
      },
      {
        type: 'trigger-automation',
        parameters: {
          automationId: 'security-scan',
          parameters: {
            scanType: 'pattern-detection',
            severity: 'high'
          }
        }
      }
    ],
    priority: 'critical',
    enabled: true,
    metadata: {
      version: '1.0.0',
      author: 'security-team',
      createdAt: new Date().toISOString()
    }
  };

  await configManager.addRule(customRule);
  console.log('✅ Custom rule created successfully');
}
```

### 3. Rule Testing and Validation

#### Test Rule Execution
```typescript
// scripts/test-rule-execution.ts
import { LLMInsightRuleEngine } from '../src/utils/llmInsightRuleEngine';

async function testRuleExecution() {
  const ruleEngine = new LLMInsightRuleEngine();

  const testParams = {
    commitHash: 'test-commit-123',
    commitMessage: 'feat(security): add password validation',
    changes: [
      {
        path: 'src/utils/security.ts',
        status: 'added' as const,
        additions: 50,
        deletions: 0
      }
    ],
    author: 'test-author',
    timestamp: new Date().toISOString()
  };

  const results = await ruleEngine.processCommit(testParams);

  console.log('Test Results:');
  for (const result of results) {
    console.log(`Rule: ${result.ruleName}`);
    console.log(`  Triggered: ${result.triggered}`);
    console.log(`  Insights: ${result.insights.length}`);
    console.log(`  Fossils: ${result.fossils.length}`);
    console.log(`  Errors: ${result.errors.length}`);
  }
}
```

## 📊 Monitoring and Analytics

### 1. Rule Execution Metrics

#### Metrics Collection
```typescript
interface RuleExecutionMetrics {
  ruleId: string;
  executions: number;
  successRate: number;
  averageExecutionTime: number;
  insightsGenerated: number;
  fossilsCreated: number;
  errors: number;
  lastExecution: string;
}

class RuleMetricsCollector {
  private metrics: Map<string, RuleExecutionMetrics> = new Map();

  recordExecution(result: RuleExecutionResult, executionTime: number): void {
    const ruleId = result.ruleId;
    const current = this.metrics.get(ruleId) || this.initializeMetrics(ruleId);

    current.executions++;
    current.successRate = result.errors.length === 0 ? 
      (current.successRate * (current.executions - 1) + 1) / current.executions :
      (current.successRate * (current.executions - 1)) / current.executions;
    
    current.averageExecutionTime = 
      (current.averageExecutionTime * (current.executions - 1) + executionTime) / current.executions;
    
    current.insightsGenerated += result.insights.length;
    current.fossilsCreated += result.fossils.length;
    current.errors += result.errors.length;
    current.lastExecution = new Date().toISOString();

    this.metrics.set(ruleId, current);
  }

  private initializeMetrics(ruleId: string): RuleExecutionMetrics {
    return {
      ruleId,
      executions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      insightsGenerated: 0,
      fossilsCreated: 0,
      errors: 0,
      lastExecution: ''
    };
  }

  getMetrics(): RuleExecutionMetrics[] {
    return Array.from(this.metrics.values());
  }

  exportMetrics(): void {
    const metrics = this.getMetrics();
    const content = JSON.stringify(metrics, null, 2);
    writeFileSync('fossils/llm_insights/rule-metrics.json', content);
  }
}
```

### 2. Performance Monitoring

#### Performance Tracking
```typescript
class RulePerformanceMonitor {
  private startTime: number = 0;
  private metrics: RuleExecutionMetrics[] = [];

  startMonitoring(): void {
    this.startTime = Date.now();
  }

  endMonitoring(): number {
    return Date.now() - this.startTime;
  }

  async monitorRuleExecution(
    rule: LLMInsightRule,
    executionFn: () => Promise<RuleExecutionResult>
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    
    try {
      const result = await executionFn();
      const executionTime = Date.now() - startTime;
      
      // Record metrics
      this.recordMetrics(rule, result, executionTime);
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record error metrics
      this.recordErrorMetrics(rule, error, executionTime);
      
      throw error;
    }
  }

  private recordMetrics(
    rule: LLMInsightRule,
    result: RuleExecutionResult,
    executionTime: number
  ): void {
    // Implementation for metrics recording
  }

  private recordErrorMetrics(
    rule: LLMInsightRule,
    error: any,
    executionTime: number
  ): void {
    // Implementation for error metrics recording
  }
}
```

## 🎯 Best Practices

### 1. Rule Design
- **Specificity**: Make rules specific and focused on single concerns
- **Reusability**: Design rules to be reusable across different contexts
- **Testability**: Ensure rules can be easily tested and validated
- **Maintainability**: Keep rules simple and well-documented

### 2. Performance Optimization
- **Conditional Execution**: Use conditions to avoid unnecessary rule execution
- **Caching**: Cache rule evaluation results when possible
- **Parallel Processing**: Execute independent rules in parallel
- **Resource Management**: Monitor and limit resource usage

### 3. Error Handling
- **Graceful Degradation**: Handle rule failures without breaking the workflow
- **Fallback Actions**: Provide fallback actions for failed rules
- **Error Reporting**: Collect and report errors for analysis
- **Recovery Mechanisms**: Implement recovery mechanisms for failed rules

### 4. Monitoring and Maintenance
- **Metrics Collection**: Collect comprehensive metrics for rule performance
- **Regular Review**: Regularly review and update rules based on metrics
- **Version Control**: Version control rule configurations
- **Documentation**: Maintain comprehensive documentation for all rules

## 📚 Related Documentation

- [LLM Insights Commit Traceability](./LLM_INSIGHTS_COMMIT_TRACEABILITY.md) - Core commit traceability system
- [LLM Insights Workflow](./LLM_INSIGHTS_WORKFLOW.md) - LLM insights workflow patterns
- [Fossil Management](./FOSSIL_MANAGEMENT_ANALYSIS.md) - Fossil management patterns
- [Conventional Commits](./DEVELOPMENT_GUIDE.md#commit-message-format) - Commit message standards
- [Automation Ecosystem](./COMPLETE_AUTOMATION_ECOSYSTEM.md) - Complete automation overview

---

*This guide provides a comprehensive foundation for implementing LLM insights rules that integrate seamlessly with conventional commits, fossil-backed storage, and roadmap materialization, enabling enhanced automation and insight generation across the development workflow.* 