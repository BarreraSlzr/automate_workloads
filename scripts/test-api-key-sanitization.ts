#!/usr/bin/env bun

import { LLMService } from '../src/services/llm';
import { createErrorSnapshot } from '../src/utils/errorSnapshotLogUtils';
import { TypeSchemaValidator } from '../src/utils/typeSchemaValidator';
import { parseJsonSafe } from '@/utils/json';

/**
 * Test script to verify API key sanitization in LLM snapshots
 */
async function testApiKeySanitization() {
  console.log('🔐 Testing API Key Sanitization in LLM Snapshots');
  console.log('='.repeat(50));

  try {
    // Create LLM service with fossilization enabled
    const service = new LLMService({
      owner: 'test-owner',
      repo: 'test-repo',
      enableComprehensiveTracing: true,
      enableFossilization: true,
      enableConsoleOutput: true,
      enableSnapshotExport: true,
      fossilStoragePath: 'fossils/test/',
      memoryOnly: false
    });

    // Test input with API key
    const testInput = {
      model: 'gpt-3.5-turbo',
      apiKey: 'sk-proj-test-key-that-should-be-redacted',
      messages: [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Test message for API key sanitization.' }
      ],
      context: 'api-key-test',
      purpose: 'sanitization-test',
      valueScore: 0.8
    };

    console.log('1️⃣ Testing with API key in input...');
    console.log(`   Original API key: ${testInput.apiKey}`);
    
    // Make a call (this will fail due to invalid API key, but should still fossilize)
    try {
      await service.callLLM(testInput);
    } catch (error) {
      console.log('   ✅ Expected error (invalid API key)');
    }

    // Check if fossils were created
    console.log('\n2️⃣ Checking fossil files for API key sanitization...');
    
    const fossilPath = 'fossils/llm_insights/';
    const fs = await import('fs/promises');
    
    try {
      const fossilFiles = await fs.readdir(fossilPath);
      const recentFossils = fossilFiles
        .filter(f => f.includes('llm-validation'))
        .sort()
        .slice(-3); // Get last 3 fossils
      
      if (recentFossils.length > 0) {
        console.log(`   📁 Found ${recentFossils.length} recent fossil files`);
        
        for (const fossilFile of recentFossils) {
          const fossilContent = await fs.readFile(`${fossilPath}/${fossilFile}`, 'utf8');
          const fossilData = parseJsonSafe(fossilContent);
          
          // Check if API key is redacted
          const hasApiKey = fossilContent.includes('sk-proj-test-key-that-should-be-redacted');
          const hasRedacted = fossilContent.includes('[REDACTED]');
          
          console.log(`   🦴 ${fossilFile}:`);
          console.log(`      ❌ Contains API key: ${hasApiKey}`);
          console.log(`      ✅ Contains [REDACTED]: ${hasRedacted}`);
          
          if (hasApiKey) {
            console.log(`      ⚠️  WARNING: API key found in fossil!`);
          } else if (hasRedacted) {
            console.log(`      ✅ SUCCESS: API key properly redacted`);
          } else {
            console.log(`      ℹ️  No API key field found (may be normal)`);
          }
        }
      } else {
        console.log('   📁 No recent fossil files found');
      }
    } catch (error) {
      console.log(`   ❌ Error checking fossils: ${error}`);
    }

    // Test snapshot export
    console.log('\n3️⃣ Testing snapshot export for API key sanitization...');
    
    try {
      const { exportLLMSnapshot } = await import('../src/utils/llmSnapshotExporter');
      
      const snapshotResult = await exportLLMSnapshot({
        format: 'yaml',
        includeMetadata: true,
        includeValidation: true,
        filters: {
          dateRange: {
            start: new Date(Date.now() - 300000).toISOString(), // Last 5 minutes
            end: new Date().toISOString()
          }
        }
      });
      
      if (snapshotResult.outputPath) {
        const snapshotContent = await fs.readFile(snapshotResult.outputPath, 'utf8');
        const hasApiKey = snapshotContent.includes('sk-proj-test-key-that-should-be-redacted');
        const hasRedacted = snapshotContent.includes('[REDACTED]');
        
        console.log(`   📸 Snapshot exported: ${snapshotResult.outputPath}`);
        console.log(`      ❌ Contains API key: ${hasApiKey}`);
        console.log(`      ✅ Contains [REDACTED]: ${hasRedacted}`);
        
        if (hasApiKey) {
          console.log(`      ⚠️  WARNING: API key found in snapshot!`);
        } else if (hasRedacted) {
          console.log(`      ✅ SUCCESS: API key properly redacted in snapshot`);
        } else {
          console.log(`      ℹ️  No API key field found in snapshot (may be normal)`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error exporting snapshot: ${error}`);
    }

    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));
    console.log('✅ API key sanitization test completed');
    console.log('💡 Check the output above for any warnings about API keys in fossils/snapshots');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this script is executed directly
if (import.meta.main) {
  testApiKeySanitization()
    .then(() => {
      console.log('\n✅ API key sanitization test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API key sanitization test failed:', error);
      process.exit(1);
    });
}

export { testApiKeySanitization }; 