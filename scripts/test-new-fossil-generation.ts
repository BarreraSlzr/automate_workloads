#!/usr/bin/env bun

import { LLMService } from '../src/services/llm';

/**
 * Test script to generate a new fossil with sanitization
 */
async function testNewFossilGeneration() {
  console.log('🧪 Testing New Fossil Generation with Sanitization');
  console.log('='.repeat(50));

  try {
    // Create LLM service with fossilization enabled
    const service = new LLMService({
      enableComprehensiveTracing: true,
      enableFossilization: true,
      enableConsoleOutput: true,
      enableSnapshotExport: true,
      fossilStoragePath: 'fossils/llm_insights/',
      memoryOnly: false
    });

    // Test input with API key
    const testInput = {
      model: 'gpt-3.5-turbo',
      apiKey: 'sk-proj-test-key-that-should-be-redacted',
      messages: [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Test message for new fossil generation.' }
      ],
      context: 'new-fossil-test',
      purpose: 'sanitization-verification',
      valueScore: 0.8
    };

    console.log('1️⃣ Making LLM call with API key...');
    console.log(`   Original API key: ${testInput.apiKey}`);
    
    // Make a call (this will fail due to invalid API key, but should still fossilize)
    try {
      await service.callLLM(testInput);
    } catch (error) {
      console.log('   ✅ Expected error (invalid API key)');
    }

    // Check if new fossil was created
    console.log('\n2️⃣ Checking for new fossil files...');
    
    const fossilPath = 'fossils/llm_insights/';
    const fs = await import('fs/promises');
    
    try {
      const fossilFiles = await fs.readdir(fossilPath);
      const llmFossils = fossilFiles.filter(f => f.includes('llm-validation') || f.includes('llm-error-prevention'));
      
      if (llmFossils.length > 0) {
        console.log(`   📁 Found ${llmFossils.length} new fossil files`);
        
        for (const fossilFile of llmFossils) {
          const fossilContent = await fs.readFile(`${fossilPath}/${fossilFile}`, 'utf8');
          
          // Check if API key is redacted
          const hasApiKey = fossilContent.includes('sk-proj-test-key-that-should-be-redacted');
          const hasRedacted = fossilContent.includes('[REDACTED]');
          
          console.log(`   🦴 ${fossilFile}:`);
          console.log(`      ❌ Contains API key: ${hasApiKey}`);
          console.log(`      ✅ Contains [REDACTED]: ${hasRedacted}`);
          
          if (hasApiKey) {
            console.log(`      ⚠️  WARNING: API key found in new fossil!`);
          } else if (hasRedacted) {
            console.log(`      ✅ SUCCESS: API key properly redacted in new fossil`);
          } else {
            console.log(`      ℹ️  No API key field found (may be normal)`);
          }
        }
      } else {
        console.log('   📁 No new fossil files found');
      }
    } catch (error) {
      console.log(`   ❌ Error checking fossils: ${error}`);
    }

    // Test snapshot export
    console.log('\n3️⃣ Testing snapshot export with new fossils...');
    
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
          console.log(`      ⚠️  WARNING: API key found in new snapshot!`);
        } else if (hasRedacted) {
          console.log(`      ✅ SUCCESS: API key properly redacted in new snapshot`);
        } else {
          console.log(`      ℹ️  No API key field found in new snapshot (may be normal)`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error exporting snapshot: ${error}`);
    }

    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));
    console.log('✅ New fossil generation test completed');
    console.log('💡 Check the output above for any warnings about API keys in new fossils/snapshots');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this script is executed directly
if (import.meta.main) {
  testNewFossilGeneration()
    .then(() => {
      console.log('\n✅ New fossil generation test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ New fossil generation test failed:', error);
      process.exit(1);
    });
}

export { testNewFossilGeneration }; 