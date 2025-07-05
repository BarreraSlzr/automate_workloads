#!/usr/bin/env bun
/**
 * Enhanced Commit Message System Demo
 * 
 * Demonstrates the comprehensive commit message validation and template system
 * with strict enforcement, JSON/YAML templates, and programmatic audit capabilities.
 * 
 * Usage:
 *   bun run examples/enhanced-commit-message-demo.ts
 * 
 * Roadmap reference: Integrate LLM insights for completed tasks
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface DemoResult {
  step: string;
  success: boolean;
  output?: string;
  error?: string;
}

class EnhancedCommitMessageDemo {
  private results: DemoResult[] = [];
  private demoDir = 'examples/demo_output';

  constructor() {
    this.ensureDemoDir();
  }

  /**
   * Run the complete demo
   */
  async run(): Promise<void> {
    console.log('🚀 Enhanced Commit Message System Demo');
    console.log('='.repeat(60));
    console.log('');

    await this.runStep('Demo Setup', () => this.setupDemo());
    await this.runStep('Template Creation', () => this.createTemplates());
    await this.runStep('Validation Testing', () => this.testValidation());
    await this.runStep('Audit Simulation', () => this.simulateAudit());
    await this.runStep('Fix Demonstration', () => this.demonstrateFixes());
    await this.runStep('Tracking Analysis', () => this.analyzeTracking());
    await this.runStep('Integration Examples', () => this.showIntegrations());

    this.displayResults();
    this.generateDemoReport();
  }

  /**
   * Setup demo environment
   */
  private async setupDemo(): Promise<void> {
    // Create demo commit messages
    const demoCommits = [
      {
        type: 'feat',
        scope: 'cli',
        description: 'add enhanced commit message validation',
        body: 'This commit adds comprehensive validation for commit messages including LLM insights metadata, roadmap impact tracking, and automation scope identification.',
        llmInsightsRef: 'insight-feat-cli-validation-123',
        roadmapImpact: 'high' as const,
        automationScope: ['cli', 'validation', 'pre-commit']
      },
      {
        type: 'fix',
        scope: 'utils',
        description: 'fix fossil generation edge case',
        body: 'Fixes an edge case where fossil generation would fail with empty input.',
        llmInsightsRef: 'insight-fix-utils-fossil-456',
        roadmapImpact: 'medium' as const,
        automationScope: ['utils', 'fossils']
      },
      {
        type: 'docs',
        scope: 'docs',
        description: 'update enhanced commit message documentation',
        body: 'Comprehensive documentation for the enhanced commit message system.',
        llmInsightsRef: 'insight-docs-commit-system-789',
        roadmapImpact: 'low' as const,
        automationScope: ['docs', 'documentation']
      }
    ];

    // Create template files
    for (const commit of demoCommits) {
      const template = await this.createTemplate(commit);
      const filename = `${commit.type}-${commit.scope}-template.json`;
      const filepath = join(this.demoDir, filename);
      writeFileSync(filepath, JSON.stringify(template, null, 2));
    }

    // Create invalid commit messages for testing
    const invalidCommits = [
      'add new feature', // Missing conventional format
      'feat: add feature', // Missing scope
      'feat(cli): add feature', // Missing metadata
      'feat(cli): add feature\n\nLLM-Insights: fossil:test', // Missing roadmap impact
    ];

    for (let i = 0; i < invalidCommits.length; i++) {
      const filename = `invalid-commit-${i + 1}.txt`;
      const filepath = join(this.demoDir, filename);
      writeFileSync(filepath, invalidCommits[i]);
    }
  }

  /**
   * Create commit message templates
   */
  private async createTemplates(): Promise<void> {
    console.log('📝 Creating commit message templates...');

    // Demo template creation
    const template = await this.createTemplate({
      type: 'feat',
      scope: 'demo',
      description: 'demonstrate enhanced commit message system',
      body: 'This is a demonstration of the enhanced commit message system with comprehensive validation and metadata.',
      llmInsightsRef: 'insight-demo-system-123',
      roadmapImpact: 'high',
      automationScope: ['demo', 'validation', 'templates']
    });

    const filepath = join(this.demoDir, 'demo-template.json');
    writeFileSync(filepath, JSON.stringify(template, null, 2));

    console.log('✅ Created demo template');
    console.log(`📄 Template saved to: ${filepath}`);
    console.log(`📊 Template score: ${template.audit.score}/100`);
    console.log(`✅ Valid: ${template.audit.valid}`);
    console.log(`📋 Metadata complete: ${template.audit.metadataComplete}`);
  }

  /**
   * Test validation with various commit messages
   */
  private async testValidation(): Promise<void> {
    console.log('🔍 Testing validation with various commit messages...');

    const testCases = [
      {
        name: 'Valid commit with full metadata',
        message: `feat(cli): add enhanced validation system

This commit adds comprehensive validation for commit messages.

LLM-Insights: fossil:insight-validation-123
Roadmap-Impact: high
Automation-Scope: cli,validation,pre-commit

Closes #123, #456`,
        expectedValid: true
      },
      {
        name: 'Invalid commit - missing conventional format',
        message: 'add new feature without proper format',
        expectedValid: false
      },
      {
        name: 'Invalid commit - missing scope',
        message: 'feat: add feature without scope',
        expectedValid: false
      },
      {
        name: 'Invalid commit - missing LLM insights',
        message: `feat(cli): add feature

Roadmap-Impact: medium
Automation-Scope: cli`,
        expectedValid: false
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      try {
        const result = await this.validateCommit(testCase.message);
        const passed = result.valid === testCase.expectedValid;
        
        console.log(`  ${passed ? '✅' : '❌'} Expected: ${testCase.expectedValid}, Got: ${result.valid}`);
        console.log(`  📊 Score: ${result.score}/100`);
        
        if (!result.valid && result.suggestions.length > 0) {
          console.log('  💡 Suggestions:');
          result.suggestions.forEach(suggestion => {
            console.log(`    • ${suggestion}`);
          });
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error}`);
      }
    }
  }

  /**
   * Simulate audit process
   */
  private async simulateAudit(): Promise<void> {
    console.log('📊 Simulating commit audit process...');

    // Create mock audit data
    const auditData = {
      period: {
        start: '2025-01-01',
        end: '2025-01-07',
        totalCommits: 25
      },
      validation: {
        valid: 22,
        invalid: 3,
        metadataComplete: 20,
        averageScore: 85.6
      },
      issues: {
        missingLLMInsights: 5,
        missingRoadmapImpact: 3,
        missingAutomationScope: 2,
        invalidFormat: 2,
        missingScope: 1
      },
      fixes: {
        applied: 8,
        suggested: 12,
        total: 20
      },
      recommendations: [
        'Add LLM insights to 5 commits for better traceability',
        'Add scope to 1 commit for better categorization',
        'Improve 2 commits with scores below 70'
      ]
    };

    const auditFile = join(this.demoDir, 'audit-report.json');
    writeFileSync(auditFile, JSON.stringify(auditData, null, 2));

    console.log('✅ Generated audit report');
    console.log(`📄 Report saved to: ${auditFile}`);
    console.log(`📊 Total commits analyzed: ${auditData.period.totalCommits}`);
    console.log(`✅ Valid commits: ${auditData.validation.valid}/${auditData.period.totalCommits}`);
    console.log(`📋 Metadata complete: ${auditData.validation.metadataComplete}/${auditData.period.totalCommits}`);
    console.log(`📈 Average score: ${auditData.validation.averageScore}/100`);
  }

  /**
   * Demonstrate fix capabilities
   */
  private async demonstrateFixes(): Promise<void> {
    console.log('🔧 Demonstrating fix capabilities...');

    const fixExamples = [
      {
        original: 'feat: add new feature',
        fixes: [
          {
            type: 'add_scope',
            description: 'Add commit scope',
            suggestedMessage: 'feat(cli): add new feature'
          },
          {
            type: 'add_llm_insights',
            description: 'Add LLM insights reference',
            suggestedMessage: `feat(cli): add new feature

LLM-Insights: fossil:insight-feat-cli-${Date.now()}`
          },
          {
            type: 'add_roadmap_impact',
            description: 'Add roadmap impact',
            suggestedMessage: `feat(cli): add new feature

LLM-Insights: fossil:insight-feat-cli-${Date.now()}
Roadmap-Impact: medium`
          },
          {
            type: 'add_automation_scope',
            description: 'Add automation scope',
            suggestedMessage: `feat(cli): add new feature

LLM-Insights: fossil:insight-feat-cli-${Date.now()}
Roadmap-Impact: medium
Automation-Scope: cli,feature`
          }
        ]
      }
    ];

    for (const example of fixExamples) {
      console.log(`\n🔍 Original: ${example.original}`);
      console.log('🔧 Suggested fixes:');
      
      for (const fix of example.fixes) {
        console.log(`  ${fix.type}: ${fix.description}`);
        console.log(`  Suggested: ${fix.suggestedMessage.replace(/\n/g, '\n    ')}`);
      }
    }

    const fixesFile = join(this.demoDir, 'fix-examples.json');
    writeFileSync(fixesFile, JSON.stringify(fixExamples, null, 2));
    console.log(`\n📄 Fix examples saved to: ${fixesFile}`);
  }

  /**
   * Analyze tracking capabilities
   */
  private async analyzeTracking(): Promise<void> {
    console.log('📈 Analyzing tracking capabilities...');

    const trackingData = {
      period: {
        start: '2025-01-01',
        end: '2025-01-07',
        totalCommits: 25
      },
      evolution: {
        formatImprovement: 92.5,
        metadataCompleteness: 88.0,
        averageScore: 85.6,
        trends: {
          formatImprovement: 'increasing',
          metadataCompleteness: 'stable',
          averageScore: 'improving'
        }
      },
      recommendations: [
        'Continue enforcing strict commit message validation',
        'Add more comprehensive LLM insights generation',
        'Improve automation scope detection',
        'Consider implementing commit message templates'
      ]
    };

    const trackingFile = join(this.demoDir, 'tracking-data.json');
    writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));

    console.log('✅ Generated tracking data');
    console.log(`📄 Data saved to: ${trackingFile}`);
    console.log(`📊 Format improvement: ${trackingData.evolution.formatImprovement}%`);
    console.log(`📋 Metadata completeness: ${trackingData.evolution.metadataCompleteness}%`);
    console.log(`📈 Average score: ${trackingData.evolution.averageScore}/100`);
  }

  /**
   * Show integration examples
   */
  private async showIntegrations(): Promise<void> {
    console.log('🔗 Showing integration examples...');

    const integrations = {
      ciCd: {
        githubActions: `
- name: Validate Commit Messages
  run: |
    bun run scripts/enhanced-pre-commit-validator.ts --validate --pre-commit --strict
    
- name: Generate Audit Report
  run: |
    bun run scripts/enhanced-pre-commit-validator.ts --audit --since ${{ github.event.head_commit.timestamp }} --output audit.json
        `,
        gitlabCi: `
validate_commits:
  script:
    - bun run scripts/enhanced-pre-commit-validator.ts --validate --pre-commit --strict
  stage: test
        `
      },
      ide: {
        vscode: `
// settings.json
{
  "git.commitTemplate": "fossils/commit_templates/default.json",
  "git.preCommitHook": "bun run scripts/enhanced-pre-commit-validator.ts --validate --pre-commit --strict"
}
        `,
        intellij: `
// .idea/workspace.xml
<component name="GitCommitTemplate">
  <option name="template" value="fossils/commit_templates/default.json" />
</component>
        `
      },
      teamDashboard: `
# Generate team metrics
bun run scripts/enhanced-pre-commit-validator.ts --track \\
  --since 2025-01-01 \\
  --output team-metrics.json

# Upload to dashboard
curl -X POST https://dashboard.example.com/api/metrics \\
  -H "Content-Type: application/json" \\
  -d @team-metrics.json
      `
    };

    const integrationsFile = join(this.demoDir, 'integration-examples.json');
    writeFileSync(integrationsFile, JSON.stringify(integrations, null, 2));

    console.log('✅ Generated integration examples');
    console.log(`📄 Examples saved to: ${integrationsFile}`);
    console.log('🔗 Available integrations:');
    console.log('  • CI/CD (GitHub Actions, GitLab CI)');
    console.log('  • IDE (VS Code, IntelliJ)');
    console.log('  • Team Dashboard');
    console.log('  • Custom Scripts');
  }

  // Helper methods
  private async runStep(name: string, step: () => Promise<void>): Promise<void> {
    console.log(`\n📋 Step: ${name}`);
    console.log('-'.repeat(40));
    
    try {
      await step();
      this.results.push({ step: name, success: true });
    } catch (error) {
      console.error(`❌ Error in ${name}:`, error);
      this.results.push({ step: name, success: false, error: error.message });
    }
  }

  private ensureDemoDir(): void {
    if (!existsSync(this.demoDir)) {
      mkdirSync(this.demoDir, { recursive: true });
    }
  }

  private async createTemplate(args: any): Promise<any> {
    const templateId = `${args.type}-${args.scope}-${Date.now()}`;
    
    return {
      metadata: {
        version: '1.0.0',
        templateId,
        createdAt: new Date().toISOString(),
        author: 'demo-user',
        validator: 'enhanced-pre-commit-validator'
      },
      commit: {
        type: args.type,
        scope: args.scope,
        description: args.description,
        body: args.body,
        footer: '',
        breakingChange: false,
        issues: []
      },
      llmInsights: {
        reference: args.llmInsightsRef,
        summary: `Commit ${args.type}(${args.scope}): ${args.description}`,
        impact: args.roadmapImpact,
        category: this.determineCategory(args.type),
        blockers: [],
        recommendations: this.generateRecommendations(args.type, args.scope),
        automationOpportunities: this.generateAutomationOpportunities(args.type, args.scope),
        roadmapImpact: {
          level: args.roadmapImpact,
          affectedTasks: [],
          newTasks: [],
          completedTasks: []
        },
        automationScope: args.automationScope
      },
      audit: {
        timestamp: new Date().toISOString(),
        score: this.calculateScore(args),
        valid: true,
        metadataComplete: true,
        suggestions: []
      }
    };
  }

  private async validateCommit(message: string): Promise<any> {
    // Simulate validation
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\([^)]+\))?:\s+(.+)$/;
    const llmInsightsRegex = /LLM-Insights:\s*fossil:([^\n]+)/;
    const roadmapImpactRegex = /Roadmap-Impact:\s*(low|medium|high)/;
    const automationScopeRegex = /Automation-Scope:\s*([^\n]+)/;

    const lines = message.trim().split('\n');
    const firstLine = lines[0] || '';
    const body = lines.slice(1).join('\n');

    const conventionalFormat = !!firstLine.match(conventionalRegex);
    const llmInsightsRef = body.match(llmInsightsRegex)?.[1]?.trim();
    const roadmapImpact = body.match(roadmapImpactRegex)?.[1] as 'low' | 'medium' | 'high' | undefined;
    const automationScope = body.match(automationScopeRegex)?.[1]?.split(',').map(s => s.trim()).filter(Boolean);

    const suggestions: string[] = [];
    if (!conventionalFormat) suggestions.push('Use conventional commit format: type(scope): description');
    if (!llmInsightsRef) suggestions.push('Add LLM-Insights: fossil:reference for traceability');
    if (!roadmapImpact) suggestions.push('Add Roadmap-Impact: low|medium|high for tracking');
    if (!automationScope || automationScope.length === 0) suggestions.push('Add Automation-Scope: area1,area2 for automation tracking');

    const score = this.calculateValidationScore(message, conventionalFormat, llmInsightsRef, roadmapImpact, automationScope);
    const valid = conventionalFormat && llmInsightsRef && roadmapImpact && automationScope && automationScope.length > 0;

    return {
      conventionalFormat,
      llmInsightsRef,
      roadmapImpact,
      automationScope,
      suggestions,
      score,
      valid
    };
  }

  private determineCategory(type: string): string {
    const categories: Record<string, string> = {
      feat: 'feature',
      fix: 'bugfix',
      docs: 'documentation',
      style: 'style',
      refactor: 'refactoring',
      test: 'testing',
      chore: 'maintenance',
      perf: 'performance'
    };
    return categories[type] || 'general';
  }

  private generateRecommendations(type: string, scope: string): string[] {
    const recommendations: string[] = [];

    if (type === 'feat') {
      recommendations.push('Add tests for the new feature');
      recommendations.push('Update documentation');
    } else if (type === 'fix') {
      recommendations.push('Add regression tests');
      recommendations.push('Review similar code for potential issues');
    }

    if (scope === 'cli') {
      recommendations.push('Test CLI functionality');
      recommendations.push('Update help documentation');
    }

    return recommendations;
  }

  private generateAutomationOpportunities(type: string, scope: string): string[] {
    const opportunities: string[] = [];

    if (type === 'docs') {
      opportunities.push('Automate documentation generation');
    } else if (type === 'test') {
      opportunities.push('Automate test execution');
    } else if (type === 'chore') {
      opportunities.push('Automate build and deployment');
    }

    if (scope === 'cli') {
      opportunities.push('Automate CLI testing');
    }

    return opportunities;
  }

  private calculateScore(args: any): number {
    let score = 0;
    score += 40; // Base score
    if (args.type && args.scope) score += 20;
    if (args.description && args.description.length >= 10 && args.description.length <= 72) score += 20;
    if (args.llmInsightsRef) score += 10;
    if (args.roadmapImpact) score += 5;
    if (args.automationScope && args.automationScope.length > 0) score += 5;
    return Math.min(score, 100);
  }

  private calculateValidationScore(message: string, conventionalFormat: boolean, llmInsightsRef?: string, roadmapImpact?: string, automationScope?: string[]): number {
    let score = 0;
    if (conventionalFormat) score += 30;
    if (message.length >= 10 && message.length <= 72) score += 20;
    if (message.includes('(') && message.includes(')')) score += 15;
    if (llmInsightsRef) score += 15;
    if (roadmapImpact) score += 10;
    if (automationScope && automationScope.length > 0) score += 10;
    return Math.min(score, 100);
  }

  private displayResults(): void {
    console.log('\n📊 Demo Results Summary');
    console.log('='.repeat(40));
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`✅ Successful steps: ${successful}/${total}`);
    console.log(`📈 Success rate: ${((successful / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Step Results:');
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.step}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }
  }

  private generateDemoReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      demo: 'Enhanced Commit Message System',
      results: this.results,
      summary: {
        totalSteps: this.results.length,
        successfulSteps: this.results.filter(r => r.success).length,
        successRate: (this.results.filter(r => r.success).length / this.results.length) * 100
      },
      outputFiles: [
        'demo-template.json',
        'audit-report.json',
        'fix-examples.json',
        'tracking-data.json',
        'integration-examples.json'
      ]
    };

    const reportFile = join(this.demoDir, 'demo-report.json');
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 Demo report saved to: ${reportFile}`);
    console.log('🎉 Demo completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  • Review generated files in examples/demo_output/');
    console.log('  • Try the enhanced validator with your own commits');
    console.log('  • Integrate into your development workflow');
    console.log('  • Customize templates for your project needs');
  }
}

// Run demo
if (import.meta.main) {
  const demo = new EnhancedCommitMessageDemo();
  demo.run().catch(console.error);
} 