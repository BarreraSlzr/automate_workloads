#!/usr/bin/env bun

/**
 * Repository Workflow Orchestration Example
 * 
 * Demonstrates how to use the LLM-powered repository orchestrator
 * to target any GitHub repository and apply automation workflows.
 */

import { execSync } from 'child_process';

/**
 * Example: Orchestrating workflows for popular repositories
 */
async function orchestratePopularRepositories() {
  console.log('🎯 Repository Workflow Orchestration Examples');
  console.log('=============================================\n');

  // Example 1: Analyze VS Code repository
  console.log('📊 Example 1: Analyzing Microsoft VS Code repository');
  console.log('---------------------------------------------------');
  
  try {
    const vscodeAnalysis = execSync(
      'bun run repo:analyze microsoft vscode --output examples/vscode-analysis.json',
      { encoding: 'utf8' }
    );
    console.log('✅ VS Code analysis completed');
    console.log('📄 Results saved to: examples/vscode-analysis.json\n');
  } catch (error) {
    console.log('⚠️  VS Code analysis failed (expected if not authenticated)');
    console.log('   This is normal if GitHub CLI is not authenticated\n');
  }

  // Example 2: Plan automation for React repository
  console.log('🤖 Example 2: Planning automation for Facebook React repository');
  console.log('-------------------------------------------------------------');
  
  try {
    const reactPlan = execSync(
      'bun run repo:orchestrate facebook react --workflow plan --output examples/react-plan.json',
      { encoding: 'utf8' }
    );
    console.log('✅ React planning completed');
    console.log('📄 Results saved to: examples/react-plan.json\n');
  } catch (error) {
    console.log('⚠️  React planning failed (expected if not authenticated)');
    console.log('   This is normal if GitHub CLI is not authenticated\n');
  }

  // Example 3: Full orchestration for a smaller repository
  console.log('🚀 Example 3: Full orchestration for a smaller repository');
  console.log('-------------------------------------------------------');
  
  try {
    const fullOrchestration = execSync(
      'bun run repo:orchestrate octocat Hello-World --workflow full --output examples/hello-world-orchestration.json',
      { encoding: 'utf8' }
    );
    console.log('✅ Full orchestration completed');
    console.log('📄 Results saved to: examples/hello-world-orchestration.json\n');
  } catch (error) {
    console.log('⚠️  Full orchestration failed (expected if not authenticated)');
    console.log('   This is normal if GitHub CLI is not authenticated\n');
  }
}

/**
 * Example: Using the wrapper script
 */
async function demonstrateWrapperScript() {
  console.log('🎯 Repository Orchestrator Wrapper Script Examples');
  console.log('==================================================\n');

  console.log('📋 Available wrapper script commands:');
  console.log('-------------------------------------');
  console.log('./scripts/repo-orchestrator.sh <owner> <repo> [workflow] [branch] [options]');
  console.log('');
  console.log('Examples:');
  console.log('  ./scripts/repo-orchestrator.sh microsoft vscode');
  console.log('  ./scripts/repo-orchestrator.sh facebook react analyze');
  console.log('  ./scripts/repo-orchestrator.sh google tensorflow plan main --create-issues');
  console.log('  ./scripts/repo-orchestrator.sh openai openai-cookbook full main --output results.json');
  console.log('');
  console.log('Workflow Types:');
  console.log('  analyze   - Repository analysis and health check');
  console.log('  plan      - LLM-powered planning and recommendations');
  console.log('  execute   - Execute automation workflows');
  console.log('  monitor   - Monitor and optimize workflows');
  console.log('  full      - Complete orchestration (analyze + plan + execute + monitor)');
  console.log('');
}

/**
 * Example: Custom repository orchestration with context
 */
async function demonstrateCustomOrchestration() {
  console.log('🎯 Custom Repository Orchestration with Context');
  console.log('===============================================\n');

  // Example context for a TypeScript project
  const typescriptContext = {
    projectType: 'typescript-library',
    teamSize: 'small',
    priorities: ['code-quality', 'automation', 'documentation'],
    constraints: ['limited-resources', 'security-requirements'],
    goals: ['improve-ci-cd', 'automate-testing', 'enhance-documentation']
  };

  console.log('📋 Example: Orchestrating with custom context');
  console.log('Context:', JSON.stringify(typescriptContext, null, 2));
  console.log('');

  console.log('Command:');
  console.log(`bun run repo:orchestrate your-org your-repo --workflow full --context '${JSON.stringify(typescriptContext)}'`);
  console.log('');

  console.log('This would:');
  console.log('1. Analyze the repository with TypeScript-specific metrics');
  console.log('2. Generate LLM-powered plans tailored for TypeScript libraries');
  console.log('3. Execute workflows optimized for small teams');
  console.log('4. Monitor and optimize based on the specified goals');
  console.log('');
}

/**
 * Example: Batch repository orchestration
 */
async function demonstrateBatchOrchestration() {
  console.log('🎯 Batch Repository Orchestration');
  console.log('==================================\n');

  const repositories = [
    { owner: 'microsoft', repo: 'vscode', workflow: 'analyze' },
    { owner: 'facebook', repo: 'react', workflow: 'plan' },
    { owner: 'google', repo: 'tensorflow', workflow: 'analyze' },
    { owner: 'openai', repo: 'openai-cookbook', workflow: 'full' }
  ];

  console.log('📋 Example: Batch orchestration script');
  console.log('Repositories to orchestrate:');
  repositories.forEach((repo, index) => {
    console.log(`  ${index + 1}. ${repo.owner}/${repo.repo} (${repo.workflow})`);
  });
  console.log('');

  console.log('Batch script example:');
  console.log('```bash');
  console.log('#!/bin/bash');
  console.log('# Batch repository orchestration');
  console.log('');
  repositories.forEach(repo => {
    console.log(`echo "🎯 Orchestrating ${repo.owner}/${repo.repo}..."`);
    console.log(`bun run repo:orchestrate ${repo.owner} ${repo.repo} --workflow ${repo.workflow} --output results/${repo.owner}-${repo.repo}.json`);
    console.log(`echo "✅ Completed ${repo.owner}/${repo.repo}"`);
    console.log('');
  });
  console.log('echo "🎉 All repositories orchestrated!"');
  console.log('```');
  console.log('');
}

/**
 * Example: Integration with other automation tools
 */
async function demonstrateIntegration() {
  console.log('🎯 Integration with Other Automation Tools');
  console.log('==========================================\n');

  console.log('📋 Example: Repository orchestration + LLM planning');
  console.log('```bash');
  console.log('# 1. Analyze repository');
  console.log('bun run repo:analyze microsoft vscode --output vscode-analysis.json');
  console.log('');
  console.log('# 2. Use analysis for LLM planning');
  console.log('bun run llm:plan decompose "Improve VS Code automation based on analysis" --context vscode-analysis.json');
  console.log('');
  console.log('# 3. Execute the plan');
  console.log('bun run repo:orchestrate microsoft vscode --workflow execute --context plan-results.json');
  console.log('```');
  console.log('');

  console.log('📋 Example: Repository orchestration + content automation');
  console.log('```bash');
  console.log('# 1. Analyze repository');
  console.log('bun run repo:analyze facebook react --output react-analysis.json');
  console.log('');
  console.log('# 2. Generate content about the analysis');
  console.log('./scripts/llm-content-automation.sh "blog-post" "React Repository Analysis" "medium,twitter"');
  console.log('');
  console.log('# 3. Create automation issues');
  console.log('bun run repo:orchestrate facebook react --workflow execute --create-issues');
  console.log('```');
  console.log('');
}

/**
 * Example: Monitoring and optimization
 */
async function demonstrateMonitoring() {
  console.log('🎯 Repository Monitoring and Optimization');
  console.log('==========================================\n');

  console.log('📋 Example: Continuous monitoring setup');
  console.log('```bash');
  console.log('# Set up monitoring for a repository');
  console.log('bun run repo:orchestrate your-org your-repo --workflow monitor --output monitoring-baseline.json');
  console.log('');
  console.log('# Schedule regular monitoring (cron job)');
  console.log('0 9 * * * cd /path/to/project && bun run repo:orchestrate your-org your-repo --workflow monitor --output monitoring-$(date +%Y%m%d).json');
  console.log('');
  console.log('# Compare results over time');
  console.log('bun run llm:analyze --compare monitoring-baseline.json monitoring-$(date +%Y%m%d).json');
  console.log('```');
  console.log('');

  console.log('📋 Example: Automated optimization triggers');
  console.log('```bash');
  console.log('# Monitor repository health score');
  console.log('HEALTH_SCORE=$(bun run repo:analyze your-org your-repo --output temp.json && jq -r ".health.score" temp.json)');
  console.log('');
  console.log('# Trigger optimization if score drops below threshold');
  console.log('if [ "$HEALTH_SCORE" -lt 70 ]; then');
  console.log('  echo "⚠️  Repository health score is low: $HEALTH_SCORE"');
  console.log('  bun run repo:orchestrate your-org your-repo --workflow full --create-issues');
  console.log('fi');
  console.log('```');
  console.log('');
}

/**
 * Main function
 */
async function main() {
  console.log('🤖 Repository Workflow Orchestration Examples');
  console.log('=============================================\n');

  // Run examples
  await orchestratePopularRepositories();
  await demonstrateWrapperScript();
  await demonstrateCustomOrchestration();
  await demonstrateBatchOrchestration();
  await demonstrateIntegration();
  await demonstrateMonitoring();

  console.log('🎉 Repository orchestration examples completed!');
  console.log('');
  console.log('📚 Next Steps:');
  console.log('1. Authenticate with GitHub CLI: gh auth login');
  console.log('2. Try orchestrating your own repositories');
  console.log('3. Customize workflows for your specific needs');
  console.log('4. Integrate with your existing automation tools');
  console.log('5. Set up continuous monitoring and optimization');
  console.log('');
  console.log('🔗 For more information, see:');
  console.log('- CONTRIBUTING_GUIDE.md - LLM-friendly patterns and workflows');
  console.log('- docs/API_REFERENCE.md - Complete API documentation');
  console.log('- docs/DEVELOPMENT_GUIDE.md - Technical development guidelines');
}

// Run the examples
main().catch(console.error); 