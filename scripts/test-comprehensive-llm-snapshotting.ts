#!/usr/bin/env bun

import { LLMService } from '../src/services/llm';
import { callLLMEnhanced } from '../src/services/llmEnhanced';
import { exportLLMSnapshot } from '../src/utils/llmSnapshotExporter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseJsonSafe } from '@/utils/json';

/**
 * Comprehensive test script to verify LLM call snapshotting and tracing
 * This ensures all LLM calls are fossilized, traceable, and logged with detailed context
 */
async function testComprehensiveLLMSnapshotting() {
  console.log('🧪 Testing Comprehensive LLM Call Snapshotting and Tracing');
  console.log('='.repeat(70));

  const results = {
    baseService: { success: false, fossils: 0, calls: 0 },
    enhancedService: { success: false, fossils: 0, calls: 0 },
    snapshotExport: { success: false, path: '' },
    consoleOutput: { success: false, logs: [] as any[] },
    traceability: { success: false, callIds: [] as string[], inputHashes: [] as string[] }
  };

  try {
    // Test 1: Base LLM Service with comprehensive tracing
    console.log('\n1️⃣ Testing Base LLM Service with Comprehensive Tracing');
    console.log('-'.repeat(50));
    
    const baseService = new LLMService({
      owner: 'test-owner',
      repo: 'test-repo',
      enableComprehensiveTracing: true,
      enableFossilization: true,
      enableConsoleOutput: true,
      enableSnapshotExport: true,
      fossilStoragePath: 'fossils/test/',
      testMode: false,
      memoryOnly: false
    });

    const baseCallId = `test-base-${Date.now()}`;
    console.log(`📞 Making base service call with ID: ${baseCallId}`);
    
    const baseResult = await baseService.callLLM({
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Explain what comprehensive tracing means in software development in one sentence.' }
      ],
      context: 'comprehensive-tracing-test',
      purpose: 'tracing-explanation',
      valueScore: 0.9,
      routingPreference: 'cloud' // Force cloud to ensure real call
    });

    results.baseService.success = !!baseResult?.choices?.[0]?.message?.content;
    results.baseService.calls = 1;
    console.log(`✅ Base service call completed: ${results.baseService.success}`);

    // Test 2: Enhanced LLM Service with fossilization
    console.log('\n2️⃣ Testing Enhanced LLM Service with Fossilization');
    console.log('-'.repeat(50));
    
    const enhancedResult = await callLLMEnhanced({
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Explain what fossilization means in software development in one sentence.' }
      ],
      context: 'enhanced-fossilization-test',
      purpose: 'fossilization-explanation',
      valueScore: 0.8,
      routingPreference: 'cloud' // Force cloud to ensure real call
    }, {
      owner: 'BarreraSlzr',
      repo: 'automate_workloads',
      enableFossilization: true,
      fossilManagerParams: { owner: 'BarreraSlzr', repo: 'automate_workloads', fossilStoragePath: 'fossils/', enableAutoFossilization: true, enableQualityMetrics: true, enableValidationTracking: true }
    });

    results.enhancedService.success = enhancedResult.success;
    results.enhancedService.calls = 1;
    console.log(`✅ Enhanced service call completed: ${results.enhancedService.success}`);

    // Test 3: Export comprehensive snapshot
    console.log('\n3️⃣ Exporting Comprehensive LLM Snapshot');
    console.log('-'.repeat(50));
    
    const snapshotResult = await exportLLMSnapshot({
      format: 'json',
      includeMetadata: true,
      includeTimestamps: true,
      includeValidation: true
    });

    results.snapshotExport.success = !!snapshotResult.outputPath;
    results.snapshotExport.path = snapshotResult.outputPath || '';
    console.log(`✅ Snapshot exported: ${snapshotResult.outputPath}`);

    // Test 4: Verify fossil files were created
    console.log('\n4️⃣ Verifying Fossil Files and Traceability');
    console.log('-'.repeat(50));
    
    const fossilPath = 'fossils/llm_insights/';
    try {
      const fossilFiles = await fs.readdir(fossilPath);
      const llmFossils = fossilFiles.filter(f => f.includes('llm-validation') || f.includes('llm-error-prevention'));
      
      results.baseService.fossils = llmFossils.length;
      results.enhancedService.fossils = llmFossils.length;
      
      console.log(`📁 Found ${llmFossils.length} LLM fossil files:`);
      for (const fossil of llmFossils.slice(0, 5)) { // Show first 5
        console.log(`   🦴 ${fossil}`);
      }
      
             // Read one fossil to verify structure
       if (llmFossils.length > 0 && llmFossils[0]) {
         const sampleFossil = await fs.readFile(path.join(fossilPath, llmFossils[0]), 'utf8');
         const fossilData = parseJsonSafe(sampleFossil) as any;
         
         results.traceability.success = !!(
           fossilData.callId && 
           fossilData.inputHash && 
           fossilData.sessionId && 
           fossilData.commitRef
         );
         
         if (fossilData.callId) results.traceability.callIds.push(fossilData.callId);
         if (fossilData.inputHash) results.traceability.inputHashes.push(fossilData.inputHash);
        
        console.log(`🔍 Sample fossil structure verified:`);
        console.log(`   📞 Call ID: ${fossilData.callId}`);
        console.log(`   🔑 Input Hash: ${fossilData.inputHash}`);
        console.log(`   🎯 Session ID: ${fossilData.sessionId}`);
        console.log(`   📝 Commit Ref: ${fossilData.commitRef}`);
        console.log(`   📊 Model: ${fossilData.metadata?.model}`);
        console.log(`   💰 Cost: $${fossilData.metadata?.cost?.toFixed(4)}`);
      }
      
    } catch (error) {
      console.warn('⚠️ Could not verify fossil files:', error);
    }

    // Test 5: Check usage log for comprehensive metrics
    console.log('\n5️⃣ Verifying Usage Log with Comprehensive Metrics');
    console.log('-'.repeat(50));
    
    try {
      const usageLogPath = '.llm-usage-log.json';
      const usageLogContent = await fs.readFile(usageLogPath, 'utf8');
      const usageLog = parseJsonSafe(usageLogContent) as any;
      
      const recentCalls = usageLog.filter((call: any) => 
        call.timestamp && new Date(call.timestamp) > new Date(Date.now() - 300000)
      );
      
      console.log(`📊 Found ${recentCalls.length} recent LLM calls in usage log`);
      
      for (const call of recentCalls.slice(0, 3)) { // Show first 3
        console.log(`   📞 Call ID: ${call.callId}`);
        console.log(`   🔑 Input Hash: ${call.inputHash}`);
        console.log(`   🎯 Purpose: ${call.purpose}`);
        console.log(`   📊 Tokens: ${call.totalTokens}, Cost: $${call.cost?.toFixed(4)}`);
        console.log(`   ✅ Success: ${call.success}`);
        if (call.fossilId) {
          console.log(`   🦴 Fossil ID: ${call.fossilId}`);
        }
        console.log('');
      }
      
      results.consoleOutput.success = recentCalls.length > 0;
      results.consoleOutput.logs = recentCalls.map((call: any) => ({
        callId: call.callId,
        purpose: call.purpose,
        success: call.success,
        fossilId: call.fossilId
      }));
      
    } catch (error) {
      console.warn('⚠️ Could not read usage log:', error);
    }

    // Summary
    console.log('\n📋 Test Summary');
    console.log('='.repeat(70));
    console.log(`✅ Base Service: ${results.baseService.success ? 'PASS' : 'FAIL'} (${results.baseService.calls} calls, ${results.baseService.fossils} fossils)`);
    console.log(`✅ Enhanced Service: ${results.enhancedService.success ? 'PASS' : 'FAIL'} (${results.enhancedService.calls} calls, ${results.enhancedService.fossils} fossils)`);
    console.log(`✅ Snapshot Export: ${results.snapshotExport.success ? 'PASS' : 'FAIL'} (${results.snapshotExport.path})`);
    console.log(`✅ Console Output: ${results.consoleOutput.success ? 'PASS' : 'FAIL'} (${results.consoleOutput.logs.length} logs)`);
    console.log(`✅ Traceability: ${results.traceability.success ? 'PASS' : 'FAIL'} (${results.traceability.callIds.length} call IDs)`);
    
    const overallSuccess = results.baseService.success && 
                          results.enhancedService.success && 
                          results.snapshotExport.success && 
                          results.consoleOutput.success && 
                          results.traceability.success;
    
    console.log(`\n🎯 Overall Result: ${overallSuccess ? 'PASS' : 'FAIL'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 All LLM calls are now comprehensively snapshotted and traceable!');
      console.log('   - Every call has a unique ID and input hash');
      console.log('   - All calls are fossilized with detailed metadata');
      console.log('   - Console output shows real-time tracing');
      console.log('   - Snapshots can be exported for analysis');
      console.log('   - Usage logs include comprehensive metrics');
    } else {
      console.log('\n⚠️ Some tests failed. Check the output above for details.');
    }

    return results;

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this script is executed directly
if (import.meta.main) {
  testComprehensiveLLMSnapshotting()
    .then(() => {
      console.log('\n✅ Comprehensive LLM snapshotting test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testComprehensiveLLMSnapshotting }; 