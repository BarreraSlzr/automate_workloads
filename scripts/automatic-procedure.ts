#!/usr/bin/env bun

/**
 * Automatic Procedure Script
 * 
 * Combines TypeScript validation, testing, and git diff analysis
 * to ensure quality and track changes automatically.
 * 
 * Order of operations:
 * 1. TypeScript validation (tsc --noEmit)
 * 2. Test suite execution (bun test)
 * 3. Git diff analysis for monitoring changes
 * 4. Generate comprehensive report
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface ProcedureResult {
  timestamp: string;
  success: boolean;
  steps: {
    typescript: StepResult;
    testing: StepResult;
    gitAnalysis: StepResult;
  };
  summary: string;
  recommendations: string[];
  outputFiles: string[];
}

interface StepResult {
  name: string;
  success: boolean;
  duration: number;
  output: string;
  errors: string[];
  warnings: string[];
}

/**
 * Run TypeScript validation
 */
async function runTypeScriptValidation(): Promise<StepResult> {
  const startTime = Date.now();
  const result: StepResult = {
    name: 'TypeScript Validation',
    success: false,
    duration: 0,
    output: '',
    errors: [],
    warnings: []
  };
  
  try {
    console.log('🔍 Running TypeScript validation...');
    
    const output = execSync('bun run tsc --noEmit', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    result.success = true;
    result.output = output;
    result.duration = Date.now() - startTime;
    
    console.log('✅ TypeScript validation passed');
    
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    
    if (error instanceof Error) {
      result.output = error.message;
      result.errors = error.message.split('\n').filter(line => line.trim());
    }
    
    console.log('❌ TypeScript validation failed');
    console.log(result.output);
  }
  
  return result;
}

/**
 * Run test suite
 */
async function runTestSuite(): Promise<StepResult> {
  const startTime = Date.now();
  const result: StepResult = {
    name: 'Test Suite',
    success: false,
    duration: 0,
    output: '',
    errors: [],
    warnings: []
  };
  
  try {
    console.log('🧪 Running test suite...');
    
    const output = execSync('bun test', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    result.success = true;
    result.output = output;
    result.duration = Date.now() - startTime;
    
    console.log('✅ Test suite passed');
    
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    
    if (error instanceof Error) {
      result.output = error.message;
      result.errors = error.message.split('\n').filter(line => line.trim());
    }
    
    console.log('❌ Test suite failed');
    console.log(result.output);
  }
  
  return result;
}

/**
 * Run git diff analysis
 */
async function runGitDiffAnalysis(): Promise<StepResult> {
  const startTime = Date.now();
  const result: StepResult = {
    name: 'Git Diff Analysis',
    success: false,
    duration: 0,
    output: '',
    errors: [],
    warnings: []
  };
  
  try {
    console.log('📊 Running git diff analysis...');
    
    // Import and run the git diff analysis
    const { analyzeGitDiff } = await import('./analyze-git-diff');
    const analysis = await analyzeGitDiff({ verbose: false });
    
    result.success = true;
    result.output = JSON.stringify(analysis, null, 2);
    result.duration = Date.now() - startTime;
    
    console.log('✅ Git diff analysis completed');
    
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    
    if (error instanceof Error) {
      result.output = error.message;
      result.errors = error.message.split('\n').filter(line => line.trim());
    }
    
    console.log('❌ Git diff analysis failed');
    console.log(result.output);
  }
  
  return result;
}

/**
 * Generate comprehensive report
 */
function generateReport(results: ProcedureResult): string {
  const { steps, summary, recommendations } = results;
  
  let report = `# Automatic Procedure Report
Generated: ${results.timestamp}

## Summary
${summary}

## Step Results

### 1. TypeScript Validation
- **Status:** ${steps.typescript.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${steps.typescript.duration}ms
- **Errors:** ${steps.typescript.errors.length}
- **Warnings:** ${steps.typescript.warnings.length}

### 2. Test Suite
- **Status:** ${steps.testing.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${steps.testing.duration}ms
- **Errors:** ${steps.testing.errors.length}
- **Warnings:** ${steps.testing.warnings.length}

### 3. Git Diff Analysis
- **Status:** ${steps.gitAnalysis.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${steps.gitAnalysis.duration}ms
- **Errors:** ${steps.gitAnalysis.errors.length}
- **Warnings:** ${steps.gitAnalysis.warnings.length}

## Recommendations
${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Output Files
${results.outputFiles.map(file => `- ${file}`).join('\n')}

---
*Report generated by Automatic Procedure Script*
`;

  return report;
}

/**
 * Generate recommendations based on results
 */
function generateRecommendations(results: ProcedureResult): string[] {
  const recommendations: string[] = [];
  
  // TypeScript issues
  if (!results.steps.typescript.success) {
    recommendations.push('Fix TypeScript compilation errors before proceeding');
    recommendations.push('Review type definitions and ensure all imports are correct');
  }
  
  // Test issues
  if (!results.steps.testing.success) {
    recommendations.push('Fix failing tests before committing changes');
    recommendations.push('Review test output for specific failure reasons');
  }
  
  // Git analysis issues
  if (!results.steps.gitAnalysis.success) {
    recommendations.push('Check git repository status and ensure changes are staged');
    recommendations.push('Review git diff analysis for monitoring changes');
  }
  
  // General recommendations
  if (results.steps.typescript.success && results.steps.testing.success) {
    recommendations.push('All validation steps passed - safe to proceed with commit');
    recommendations.push('Consider running git diff analysis to review monitoring changes');
  }
  
  return recommendations;
}

/**
 * Main automatic procedure
 */
async function runAutomaticProcedure(options: {
  outputDir?: string;
  saveReport?: boolean;
  verbose?: boolean;
} = {}): Promise<ProcedureResult> {
  const { outputDir = 'fossils/procedures', saveReport = true, verbose = false } = options;
  
  console.log('🚀 Starting Automatic Procedure\n');
  console.log('Order: TypeScript → Testing → Git Analysis → Report\n');
  
  const startTime = Date.now();
  const outputFiles: string[] = [];
  
  try {
    // Step 1: TypeScript validation
    const typescriptResult = await runTypeScriptValidation();
    
    // Step 2: Test suite
    const testResult = await runTestSuite();
    
    // Step 3: Git diff analysis
    const gitResult = await runGitDiffAnalysis();
    
    // Generate summary
    const overallSuccess = typescriptResult.success && testResult.success;
    const summary = overallSuccess 
      ? 'All validation steps passed successfully'
      : 'Some validation steps failed - review recommendations';
    
    // Generate recommendations
    const recommendations = generateRecommendations({
      timestamp: new Date().toISOString(),
      success: overallSuccess,
      steps: { typescript: typescriptResult, testing: testResult, gitAnalysis: gitResult },
      summary,
      recommendations: [],
      outputFiles
    });
    
    const result: ProcedureResult = {
      timestamp: new Date().toISOString(),
      success: overallSuccess,
      steps: {
        typescript: typescriptResult,
        testing: testResult,
        gitAnalysis: gitResult
      },
      summary,
      recommendations,
      outputFiles
    };
    
    // Save report if requested
    if (saveReport) {
      await fs.mkdir(outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(outputDir, `procedure-report-${timestamp}.md`);
      const jsonFile = path.join(outputDir, `procedure-data-${timestamp}.json`);
      
      const report = generateReport(result);
      await fs.writeFile(reportFile, report);
      await fs.writeFile(jsonFile, JSON.stringify(result, null, 2));
      
      result.outputFiles = [reportFile, jsonFile];
      
      console.log(`\n💾 Report saved to: ${reportFile}`);
      console.log(`💾 Data saved to: ${jsonFile}`);
    }
    
    // Display summary
    console.log('\n📊 Procedure Summary');
    console.log('===================');
    console.log(`Overall Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${Date.now() - startTime}ms`);
    console.log(`Summary: ${result.summary}`);
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Automatic procedure failed:', error instanceof Error ? error.message : error);
    
    const errorResult: ProcedureResult = {
      timestamp: new Date().toISOString(),
      success: false,
      steps: {
        typescript: { name: 'TypeScript', success: false, duration: 0, output: '', errors: [], warnings: [] },
        testing: { name: 'Testing', success: false, duration: 0, output: '', errors: [], warnings: [] },
        gitAnalysis: { name: 'Git Analysis', success: false, duration: 0, output: '', errors: [], warnings: [] }
      },
      summary: 'Automatic procedure failed due to unexpected error',
      recommendations: ['Review error logs and fix underlying issues'],
      outputFiles: []
    };
    
    return errorResult;
  }
}

/**
 * Quick validation (TypeScript + Tests only)
 */
async function runQuickValidation(): Promise<{ typescript: boolean; tests: boolean }> {
  console.log('⚡ Running Quick Validation (TypeScript + Tests)\n');
  
  const typescriptResult = await runTypeScriptValidation();
  const testResult = await runTestSuite();
  
  const result = {
    typescript: typescriptResult.success,
    tests: testResult.success
  };
  
  console.log('\n📊 Quick Validation Results');
  console.log('==========================');
  console.log(`TypeScript: ${result.typescript ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Tests: ${result.tests ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Overall: ${result.typescript && result.tests ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  return result;
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'full':
      const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
      const saveReport = !args.includes('--no-save');
      const verbose = args.includes('--verbose');
      
      await runAutomaticProcedure({ outputDir, saveReport, verbose });
      break;
      
    case 'quick':
      await runQuickValidation();
      break;
      
    case 'typescript':
      await runTypeScriptValidation();
      break;
      
    case 'test':
      await runTestSuite();
      break;
      
    case 'git':
      await runGitDiffAnalysis();
      break;
      
    default:
      console.log('Usage:');
      console.log('  bun run automatic-procedure.ts full [--output=dir] [--no-save] [--verbose]');
      console.log('  bun run automatic-procedure.ts quick');
      console.log('  bun run automatic-procedure.ts typescript');
      console.log('  bun run automatic-procedure.ts test');
      console.log('  bun run automatic-procedure.ts git');
      break;
  }
} 