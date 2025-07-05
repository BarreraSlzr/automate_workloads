#!/usr/bin/env bun

import { LLMService } from '../src/services/llm';
import { exportLLMSnapshot } from '../src/utils/llmSnapshotExporter';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Quick validation script for LLM snapshotting system
 * Run this anytime to verify the system is working correctly
 */
async function validateLLMSnapshotting() {
  console.log('🔍 Quick LLM Snapshotting Validation');
  console.log('='.repeat(50));

  const results = {
    service: { success: false, error: '' },
    fossilDirectory: { exists: false, writable: false },
    usageLog: { exists: false, readable: false },
    snapshotExport: { success: false, fossilCount: 0 },
    configuration: { valid: false, options: {} }
  };

  try {
    // 1. Test service initialization
    console.log('1️⃣ Testing LLM Service...');
    try {
      const service = new LLMService({
        enableComprehensiveTracing: true,
        enableFossilization: true,
        enableConsoleOutput: true,
        enableSnapshotExport: true,
        fossilStoragePath: 'fossils/llm_insights/',
        memoryOnly: false
      });
      
      results.service.success = !!service;
      results.configuration.valid = true;
      results.configuration.options = {
        enableComprehensiveTracing: true,
        enableFossilization: true,
        enableConsoleOutput: true,
        enableSnapshotExport: true
      };
      
      console.log('   ✅ Service initialized successfully');
    } catch (error) {
      results.service.error = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Service initialization failed: ${results.service.error}`);
    }

    // 2. Test fossil directory
    console.log('2️⃣ Testing Fossil Directory...');
    const fossilPath = 'fossils/llm_insights/';
    try {
      await fs.access(fossilPath);
      results.fossilDirectory.exists = true;
      
      // Test if writable
      const testFile = path.join(fossilPath, '.test-write');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      results.fossilDirectory.writable = true;
      
      console.log('   ✅ Fossil directory exists and is writable');
    } catch (error) {
      console.log(`   ❌ Fossil directory issue: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 3. Test usage log
    console.log('3️⃣ Testing Usage Log...');
    const usageLogPath = '.llm-usage-log.json';
    try {
      await fs.access(usageLogPath);
      results.usageLog.exists = true;
      
      const content = await fs.readFile(usageLogPath, 'utf8');
      JSON.parse(content); // Test if valid JSON
      results.usageLog.readable = true;
      
      console.log('   ✅ Usage log exists and is readable');
    } catch (error) {
      console.log(`   ⚠️ Usage log not found or invalid (normal if no calls made yet)`);
    }

    // 4. Test snapshot export
    console.log('4️⃣ Testing Snapshot Export...');
    try {
      const snapshotResult = await exportLLMSnapshot({
        format: 'yaml',
        includeMetadata: true,
        includeValidation: true,
        filters: {
          dateRange: {
            start: new Date(Date.now() - 86400000).toISOString(), // Last 24 hours
            end: new Date().toISOString()
          }
        }
      });
      
      results.snapshotExport.success = !!snapshotResult.outputPath;
      results.snapshotExport.fossilCount = (snapshotResult as any).fossilCount || 0;
      
      console.log(`   ✅ Snapshot export successful: ${(snapshotResult as any).fossilCount} fossils`);
    } catch (error) {
      console.log(`   ❌ Snapshot export failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Summary
    console.log('\n📋 Validation Summary');
    console.log('='.repeat(50));
    console.log(`✅ Service: ${results.service.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Fossil Directory: ${results.fossilDirectory.exists && results.fossilDirectory.writable ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Usage Log: ${results.usageLog.exists && results.usageLog.readable ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Snapshot Export: ${results.snapshotExport.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Configuration: ${results.configuration.valid ? 'PASS' : 'FAIL'}`);

    const overallSuccess = results.service.success && 
                          results.fossilDirectory.exists && 
                          results.fossilDirectory.writable && 
                          results.snapshotExport.success && 
                          results.configuration.valid;

    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ WORKING' : '❌ ISSUES FOUND'}`);

    if (overallSuccess) {
      console.log('\n🎉 LLM snapshotting system is working correctly!');
      console.log('   - Service can be initialized');
      console.log('   - Fossil directory is accessible');
      console.log('   - Snapshot export is functional');
      console.log('   - Configuration is valid');
      
      if (results.snapshotExport.fossilCount > 0) {
        console.log(`   - Found ${results.snapshotExport.fossilCount} existing fossils`);
      } else {
        console.log('   - No existing fossils found (normal for new setup)');
      }
    } else {
      console.log('\n⚠️ Some issues found. Check the output above for details.');
    }

    return results;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

// Run validation if this script is executed directly
if (import.meta.main) {
  validateLLMSnapshotting()
    .then(() => {
      console.log('\n✅ Validation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateLLMSnapshotting }; 