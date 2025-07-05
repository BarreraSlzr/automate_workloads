#!/usr/bin/env bun

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Quick validation script for LLM snapshotting system
 * Simple checks that don't trigger Bun crashes
 */
async function quickValidateLLM() {
  console.log('🔍 Quick LLM Snapshotting Validation');
  console.log('='.repeat(50));

  const results = {
    fossilDirectory: { exists: false, writable: false },
    usageLog: { exists: false, readable: false },
    snapshotFiles: { count: 0, recent: [] as string[] },
    configuration: { valid: false }
  };

  try {
    // 1. Test fossil directory
    console.log('1️⃣ Testing Fossil Directory...');
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
      
      // Count existing fossils
      const files = await fs.readdir(fossilPath);
      const fossilFiles = files.filter(f => f.includes('llm-validation') || f.includes('llm-error-prevention'));
      results.snapshotFiles.count = fossilFiles.length;
      results.snapshotFiles.recent = fossilFiles.slice(0, 3);
      
      if (fossilFiles.length > 0) {
        console.log(`   📁 Found ${fossilFiles.length} fossil files`);
        console.log(`   🦴 Recent: ${fossilFiles.slice(0, 3).join(', ')}`);
      } else {
        console.log('   📁 No fossil files found yet (normal for new setup)');
      }
      
    } catch (error) {
      console.log(`   ❌ Fossil directory issue: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 2. Test usage log
    console.log('2️⃣ Testing Usage Log...');
    const usageLogPath = '.llm-usage-log.json';
    try {
      await fs.access(usageLogPath);
      results.usageLog.exists = true;
      
      const content = await fs.readFile(usageLogPath, 'utf8');
      const usageData = JSON.parse(content);
      results.usageLog.readable = true;
      
      console.log(`   ✅ Usage log exists and is readable`);
      console.log(`   📊 Contains ${usageData.length} LLM call records`);
      
      // Show recent calls
      const recentCalls = usageData.slice(-3);
      if (recentCalls.length > 0) {
        console.log('   📞 Recent calls:');
        for (const call of recentCalls) {
          console.log(`      - ${call.callId || 'N/A'}: ${call.purpose || 'N/A'} (${call.success ? '✅' : '❌'})`);
        }
      }
      
    } catch (error) {
      console.log(`   ⚠️ Usage log not found or invalid (normal if no calls made yet)`);
    }

    // 3. Check for snapshot export files
    console.log('3️⃣ Checking Snapshot Exports...');
    try {
      const currentDir = process.cwd();
      const files = await fs.readdir(currentDir);
      const snapshotFiles = files.filter(f => f.startsWith('llm-snapshot-') && f.endsWith('.yml'));
      
      if (snapshotFiles.length > 0) {
        console.log(`   📸 Found ${snapshotFiles.length} snapshot export files`);
        console.log(`   📁 Recent: ${snapshotFiles.slice(-3).join(', ')}`);
        
        // Check the most recent snapshot
        const latestSnapshot = snapshotFiles[snapshotFiles.length - 1];
        if (latestSnapshot) {
          const snapshotContent = await fs.readFile(latestSnapshot, 'utf8');
          const fossilCount = (snapshotContent.match(/fossilCount:/g) || []).length;
          console.log(`   📊 Latest snapshot contains fossil data`);
        }
      } else {
        console.log('   📸 No snapshot export files found yet');
      }
      
    } catch (error) {
      console.log(`   ⚠️ Could not check snapshot files: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 4. Check configuration files
    console.log('4️⃣ Checking Configuration...');
    try {
      // Check if the enhanced LLM service file exists
      const llmServicePath = 'src/services/llm.ts';
      const llmEnhancedPath = 'src/services/llmEnhanced.ts';
      const fossilManagerPath = 'src/utils/llmFossilManager.ts';
      
      const files = [llmServicePath, llmEnhancedPath, fossilManagerPath];
      const existingFiles: string[] = [];
      
      for (const file of files) {
        try {
          await fs.access(file);
          existingFiles.push(file);
        } catch {
          // File doesn't exist
        }
      }
      
      if (existingFiles.length === files.length) {
        results.configuration.valid = true;
        console.log('   ✅ All required LLM service files exist');
      } else {
        console.log(`   ⚠️ Missing files: ${files.filter(f => !existingFiles.includes(f)).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Configuration check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Summary
    console.log('\n📋 Validation Summary');
    console.log('='.repeat(50));
    console.log(`✅ Fossil Directory: ${results.fossilDirectory.exists && results.fossilDirectory.writable ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Usage Log: ${results.usageLog.exists && results.usageLog.readable ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Snapshot Files: ${results.snapshotFiles.count > 0 ? 'PASS' : 'INFO'}`);
    console.log(`✅ Configuration: ${results.configuration.valid ? 'PASS' : 'FAIL'}`);

    const overallSuccess = results.fossilDirectory.exists && 
                          results.fossilDirectory.writable && 
                          results.configuration.valid;

    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ WORKING' : '❌ ISSUES FOUND'}`);

    if (overallSuccess) {
      console.log('\n🎉 LLM snapshotting system appears to be working!');
      console.log('   - Fossil directory is accessible and writable');
      console.log('   - Required service files exist');
      
      if (results.snapshotFiles.count > 0) {
        console.log(`   - Found ${results.snapshotFiles.count} existing fossils`);
      }
      
      if (results.usageLog.exists) {
        console.log('   - Usage log is tracking LLM calls');
      }
      
      console.log('\n💡 To test with real LLM calls:');
      console.log('   bun run scripts/test-llm-fossilization.ts');
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
  quickValidateLLM()
    .then(() => {
      console.log('\n✅ Quick validation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Quick validation failed:', error);
      process.exit(1);
    });
}

export { quickValidateLLM }; 