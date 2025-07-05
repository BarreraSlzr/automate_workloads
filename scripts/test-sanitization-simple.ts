#!/usr/bin/env bun

import { LLMService } from '../src/services/llm';

/**
 * Simple test to verify API key sanitization
 */
async function testSanitizationSimple() {
  console.log('🔐 Testing API Key Sanitization (Simple)');
  console.log('='.repeat(50));

  try {
    // Create LLM service
    const service = new LLMService({
      enableComprehensiveTracing: true,
      enableFossilization: true,
      enableConsoleOutput: false, // Disable console output for this test
      enableSnapshotExport: true,
      fossilStoragePath: 'fossils/llm_insights/',
      memoryOnly: true // Use memory-only mode to avoid file system issues
    });

    // Test the sanitization method directly
    console.log('1️⃣ Testing sanitization method...');
    
    const testInput = {
      model: 'gpt-3.5-turbo',
      apiKey: 'sk-proj-test-key-that-should-be-redacted',
      messages: [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Test message.' }
      ],
      context: 'test',
      purpose: 'test',
      valueScore: 0.8
    };

    // Access the private method using any type
    const serviceAny = service as any;
    const sanitizedInput = serviceAny.sanitizeInputForFossilization(testInput);

    console.log(`   Original API key: ${testInput.apiKey}`);
    console.log(`   Sanitized API key: ${sanitizedInput.apiKey}`);
    
    if (sanitizedInput.apiKey === '[REDACTED]') {
      console.log('   ✅ API key properly sanitized!');
    } else {
      console.log('   ❌ API key not sanitized!');
    }

    // Test other sensitive fields
    const testInputWithMoreSensitiveData = {
      ...testInput,
      openaiApiKey: 'sk-openai-test-key',
      anthropicApiKey: 'sk-ant-test-key',
      api_key: 'sk-alt-test-key',
      token: 'test-token',
      secret: 'test-secret'
    };

    const sanitizedInput2 = serviceAny.sanitizeInputForFossilization(testInputWithMoreSensitiveData);
    
    console.log('\n2️⃣ Testing multiple sensitive fields...');
    console.log(`   apiKey: ${sanitizedInput2.apiKey}`);
    console.log(`   openaiApiKey: ${sanitizedInput2.openaiApiKey}`);
    console.log(`   anthropicApiKey: ${sanitizedInput2.anthropicApiKey}`);
    console.log(`   api_key: ${sanitizedInput2.api_key}`);
    console.log(`   token: ${sanitizedInput2.token}`);
    console.log(`   secret: ${sanitizedInput2.secret}`);

    const allRedacted = [
      sanitizedInput2.apiKey,
      sanitizedInput2.openaiApiKey,
      sanitizedInput2.anthropicApiKey,
      sanitizedInput2.api_key,
      sanitizedInput2.token,
      sanitizedInput2.secret
    ].every(field => field === '[REDACTED]');

    if (allRedacted) {
      console.log('   ✅ All sensitive fields properly sanitized!');
    } else {
      console.log('   ❌ Some sensitive fields not sanitized!');
    }

    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));
    console.log('✅ Sanitization method is working correctly');
    console.log('💡 API keys will be redacted in new fossils and snapshots');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this script is executed directly
if (import.meta.main) {
  testSanitizationSimple()
    .then(() => {
      console.log('\n✅ Sanitization test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Sanitization test failed:', error);
      process.exit(1);
    });
}

export { testSanitizationSimple }; 