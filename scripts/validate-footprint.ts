#!/usr/bin/env bun

import { z } from 'zod';
import { readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { parseCLIArgs } from '../src/types/cli';
import { parseJsonSafe } from '../src/utils/json';
import type { TestResult } from '@/types/validation';

const ValidateFootprintParams = z.object({
  footprint: z.string().optional().default('fossils/file-footprint.yml'),
  strict: z.boolean().optional().default(false),
  output: z.string().optional(),
  format: z.enum(['json', 'yaml']).optional().default('json'),
});

interface ValidationResult {
  timestamp: string;
  footprint: string;
  passed: boolean;
  score: number;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical: number;
  };
}

export async function validateFootprint(params: z.infer<typeof ValidateFootprintParams>): Promise<ValidationResult> {
  console.log(`🔍 Validating footprint: ${params.footprint}`);
  
  const timestamp = new Date().toISOString();
  const tests: TestResult[] = [];
  
  try {
    // Load footprint file
    const footprintContent = await readFile(params.footprint, 'utf-8');
    const footprint = parseFootprint(footprintContent);
    
    // Run validation tests
    tests.push(...await runValidationTests(footprint, params.strict));
    
    // Calculate results
    const summary = calculateSummary(tests);
    const score = calculateScore(tests);
    const passed = params.strict ? summary.failed === 0 : summary.critical === 0;
    
    const result: ValidationResult = {
      timestamp,
      footprint: params.footprint,
      passed,
      score,
      tests,
      summary,
    };
    
    // Output results
    if (params.output) {
      await writeValidationResult({ result, outputPath: params.output, format: params.format });
    }
    
    // Print summary
    printValidationSummary(result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

function parseFootprint(content: string): any {
  try {
    // Try YAML first
    const yaml = require('yaml');
    return yaml.parse(content);
  } catch {
    try {
      // Try JSON
      return parseJsonSafe(content, 'scripts/validate-footprint:parseFootprint');
    } catch {
      throw new Error('Failed to parse footprint file');
    }
  }
}

async function runValidationTests(footprint: any, strict: boolean): Promise<TestResult[]> {
  const tests: TestResult[] = [];
  
  // Test 1: Basic structure validation
  tests.push(validateBasicStructure(footprint));
  
  // Test 2: Git information validation
  tests.push(validateGitInfo(footprint));
  
  // Test 3: File information validation
  tests.push(validateFileInfo(footprint));
  
  // Test 4: Statistics validation
  tests.push(validateStatistics(footprint));
  
  // Test 5: Machine information validation
  tests.push(validateMachineInfo(footprint));
  
  // Test 6: Fossilization validation
  tests.push(validateFossilization(footprint));
  
  // Test 7: File path security (critical)
  tests.push(validateFilePathSecurity(footprint));
  
  // Test 8: File size limits (critical)
  tests.push(validateFileSizeLimits(footprint));
  
  // Test 9: Timestamp validation
  tests.push(validateTimestamp(footprint));
  
  // Test 10: Checksum validation
  tests.push(validateChecksum(footprint));
  
  // Additional strict tests
  if (strict) {
    tests.push(validateStrictRules(footprint));
  }
  
  return tests;
}

function validateBasicStructure(footprint: any): TestResult {
  const requiredFields = ['timestamp', 'git', 'files', 'stats', 'machine', 'fossilization'];
  const missingFields = requiredFields.filter(field => !footprint[field]);
  
  return {
    name: 'Basic structure validation',
    passed: missingFields.length === 0,
    critical: true,
    message: missingFields.length === 0 
      ? 'All required fields present' 
      : `Missing required fields: ${missingFields.join(', ')}`,
    details: missingFields,
  };
}

function validateGitInfo(footprint: any): TestResult {
  const git = footprint.git;
  const issues = [];
  
  if (!git.branch || git.branch === 'unknown') {
    issues.push('Invalid branch');
  }
  
  if (!git.commit || git.commit === 'unknown') {
    issues.push('Invalid commit');
  }
  
  if (!git.lastCommit?.hash) {
    issues.push('Missing last commit hash');
  }
  
  return {
    name: 'Git information validation',
    passed: issues.length === 0,
    critical: false,
    message: issues.length === 0 ? 'Git information valid' : `Git issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateFileInfo(footprint: any): TestResult {
  const files = footprint.files;
  const issues = [];
  
  if (!Array.isArray(files.staged)) {
    issues.push('Staged files not an array');
  }
  
  if (!Array.isArray(files.unstaged)) {
    issues.push('Unstaged files not an array');
  }
  
  if (!Array.isArray(files.untracked)) {
    issues.push('Untracked files not an array');
  }
  
  if (!Array.isArray(files.all)) {
    issues.push('All files not an array');
  }
  
  // Check file count consistency
  const expectedTotal = files.staged.length + files.unstaged.length + files.untracked.length;
  if (files.all.length !== expectedTotal) {
    issues.push(`File count mismatch: expected ${expectedTotal}, got ${files.all.length}`);
  }
  
  return {
    name: 'File information validation',
    passed: issues.length === 0,
    critical: true,
    message: issues.length === 0 ? 'File information valid' : `File issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateStatistics(footprint: any): TestResult {
  const stats = footprint.stats;
  const issues = [];
  
  if (typeof stats.totalFiles !== 'number' || stats.totalFiles < 0) {
    issues.push('Invalid total files count');
  }
  
  if (typeof stats.stagedCount !== 'number' || stats.stagedCount < 0) {
    issues.push('Invalid staged count');
  }
  
  if (typeof stats.unstagedCount !== 'number' || stats.unstagedCount < 0) {
    issues.push('Invalid unstaged count');
  }
  
  if (typeof stats.untrackedCount !== 'number' || stats.untrackedCount < 0) {
    issues.push('Invalid untracked count');
  }
  
  // Check count consistency
  const expectedTotal = stats.stagedCount + stats.unstagedCount + stats.untrackedCount;
  if (stats.totalFiles !== expectedTotal) {
    issues.push(`Statistics mismatch: expected ${expectedTotal}, got ${stats.totalFiles}`);
  }
  
  return {
    name: 'Statistics validation',
    passed: issues.length === 0,
    critical: true,
    message: issues.length === 0 ? 'Statistics valid' : `Statistics issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateMachineInfo(footprint: any): TestResult {
  const machine = footprint.machine;
  const issues = [];
  
  if (!machine.hostname || machine.hostname === 'unknown') {
    issues.push('Invalid hostname');
  }
  
  if (!machine.username || machine.username === 'unknown') {
    issues.push('Invalid username');
  }
  
  if (!machine.workingDirectory) {
    issues.push('Missing working directory');
  }
  
  if (!machine.timestamp) {
    issues.push('Missing timestamp');
  }
  
  return {
    name: 'Machine information validation',
    passed: issues.length === 0,
    critical: false,
    message: issues.length === 0 ? 'Machine information valid' : `Machine issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateFossilization(footprint: any): TestResult {
  const fossilization = footprint.fossilization;
  const issues = [];
  
  if (!fossilization.version) {
    issues.push('Missing fossilization version');
  }
  
  if (!fossilization.checksum) {
    issues.push('Missing checksum');
  }
  
  if (typeof fossilization.validated !== 'boolean') {
    issues.push('Invalid validation flag');
  }
  
  return {
    name: 'Fossilization validation',
    passed: issues.length === 0,
    critical: false,
    message: issues.length === 0 ? 'Fossilization valid' : `Fossilization issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateFilePathSecurity(footprint: any): TestResult {
  const files = footprint.files;
  const allFiles = [...files.staged, ...files.unstaged, ...files.untracked];
  const securityIssues = [];
  
  for (const file of allFiles) {
    if (file.path && (file.path.includes('..') || file.path.includes('~'))) {
      securityIssues.push(`Potentially unsafe path: ${file.path}`);
    }
  }
  
  return {
    name: 'File path security validation',
    passed: securityIssues.length === 0,
    critical: true,
    message: securityIssues.length === 0 ? 'All file paths secure' : `Security issues found: ${securityIssues.length}`,
    details: securityIssues,
  };
}

function validateFileSizeLimits(footprint: any): TestResult {
  const files = footprint.files;
  const allFiles = [...files.staged, ...files.unstaged, ...files.untracked];
  const oversizedFiles = [];
  
  for (const file of allFiles) {
    if (file.size && file.size > 100 * 1024 * 1024) { // 100MB limit
      oversizedFiles.push(`${file.path}: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  return {
    name: 'File size limits validation',
    passed: oversizedFiles.length === 0,
    critical: true,
    message: oversizedFiles.length === 0 ? 'All files within size limits' : `Oversized files: ${oversizedFiles.length}`,
    details: oversizedFiles,
  };
}

function validateTimestamp(footprint: any): TestResult {
  const timestamp = footprint.timestamp;
  const issues = [];
  
  if (!timestamp) {
    issues.push('Missing timestamp');
  } else {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      issues.push('Invalid timestamp format');
    }
    
    // Check if timestamp is reasonable (not too old or future)
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const maxDiff = 24 * 60 * 60 * 1000; // 24 hours
    
    if (diff > maxDiff) {
      issues.push('Timestamp too old or in future');
    }
  }
  
  return {
    name: 'Timestamp validation',
    passed: issues.length === 0,
    critical: false,
    message: issues.length === 0 ? 'Timestamp valid' : `Timestamp issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateChecksum(footprint: any): TestResult {
  const fossilization = footprint.fossilization;
  const issues = [];
  
  if (!fossilization.checksum) {
    issues.push('Missing checksum');
  } else {
    // Basic checksum format validation
    if (!/^[a-f0-9]+$/i.test(fossilization.checksum)) {
      issues.push('Invalid checksum format');
    }
  }
  
  return {
    name: 'Checksum validation',
    passed: issues.length === 0,
    critical: false,
    message: issues.length === 0 ? 'Checksum valid' : `Checksum issues: ${issues.join(', ')}`,
    details: issues,
  };
}

function validateStrictRules(footprint: any): TestResult {
  const issues = [];
  
  // Strict validation rules
  if (footprint.files.all.length === 0) {
    issues.push('No files tracked');
  }
  
  if (footprint.stats.totalLinesAdded === 0 && footprint.stats.totalLinesDeleted === 0) {
    issues.push('No line changes detected');
  }
  
  if (!footprint.fossilization.validated) {
    issues.push('Footprint not validated');
  }
  
  return {
    name: 'Strict rules validation',
    passed: issues.length === 0,
    critical: false,
    message: issues.length === 0 ? 'Strict rules passed' : `Strict rule violations: ${issues.join(', ')}`,
    details: issues,
  };
}

function calculateSummary(tests: TestResult[]): ValidationResult['summary'] {
  const total = tests.length;
  const passed = tests.filter(t => t.passed).length;
  const failed = total - passed;
  const critical = tests.filter(t => t.critical && !t.passed).length;
  
  return { total, passed, failed, critical };
}

function calculateScore(tests: TestResult[]): number {
  if (tests.length === 0) return 0;
  
  const weights = {
    critical: 2,
    normal: 1,
  };
  
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const test of tests) {
    const weight = test.critical ? weights.critical : weights.normal;
    totalWeight += weight;
    if (test.passed) {
      weightedScore += weight;
    }
  }
  
  return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
}

function printValidationSummary(result: ValidationResult) {
  console.log('\n📊 Validation Summary:');
  console.log(`   Overall: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Score: ${result.score.toFixed(1)}%`);
  console.log(`   Tests: ${result.summary.passed}/${result.summary.total} passed`);
  console.log(`   Critical failures: ${result.summary.critical}`);
  
  if (result.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    result.tests
      .filter(t => !t.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
  }
}

async function writeValidationResult(params: { result: ValidationResult, outputPath: string, format: 'json' | 'yaml' }) {
  const { mkdir } = await import('fs/promises');
  const { dirname } = await import('path');
  await mkdir(dirname(params.outputPath), { recursive: true });
  if (params.format === 'yaml') {
    const yaml = await import('yaml');
    const content = yaml.stringify(params.result, { indent: 2 });
    await writeFile(params.outputPath, content);
  } else {
    await writeFile(params.outputPath, JSON.stringify(params.result, null, 2));
  }
  console.log(`📄 Validation result written to: ${params.outputPath}`);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = parseCLIArgs(ValidateFootprintParams, args);
  validateFootprint(params).catch(console.error);
} 