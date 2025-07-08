#!/usr/bin/env bun

/**
 * Test script to verify pre-commit fallback logic
 */

const { $ } = Bun;

async function testFallback() {
  console.log('🧪 Testing pre-commit fallback logic...');
  
  // Simulate safe test runner failure
  try {
    console.log('1. Attempting safe test runner (should fail)...');
    await $`BUN_TEST_MEMORY_THRESHOLD=500 bun run test:safe:ci`;
    console.log('✅ Safe test runner succeeded (unexpected)');
  } catch (error) {
    console.log('⚠️  Safe test runner failed as expected, testing fallback...');
    
    try {
      console.log('2. Testing fallback to plain bun test...');
      await $`bun test --timeout 5000`;
      console.log('✅ Fallback to plain bun test succeeded');
    } catch (fallbackError) {
      console.error('❌ Fallback to plain bun test also failed');
      process.exit(1);
    }
  }
  
  console.log('🎉 Fallback logic test completed successfully!');
}

testFallback().catch((err) => {
  console.error('❌ Fallback test error:', err);
  process.exit(1);
}); 