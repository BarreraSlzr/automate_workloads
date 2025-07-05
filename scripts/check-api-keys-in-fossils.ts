#!/usr/bin/env bun

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Check existing fossils and snapshots for API keys
 */
async function checkApiKeysInFossils() {
  console.log('🔐 Checking Existing Fossils and Snapshots for API Keys');
  console.log('='.repeat(60));

  const results = {
    fossils: { checked: 0, withApiKeys: 0, withRedacted: 0 },
    snapshots: { checked: 0, withApiKeys: 0, withRedacted: 0 }
  };

  try {
    // Check fossil files
    console.log('1️⃣ Checking Fossil Files...');
    const fossilPath = 'fossils/llm_insights/';
    
    try {
      const fossilFiles = await fs.readdir(fossilPath);
      const llmFossils = fossilFiles.filter(f => f.includes('llm-validation') || f.includes('llm-error-prevention'));
      
      console.log(`   📁 Found ${llmFossils.length} LLM fossil files`);
      
      for (const fossilFile of llmFossils.slice(-5)) { // Check last 5 fossils
        const fossilContent = await fs.readFile(`${fossilPath}/${fossilFile}`, 'utf8');
        results.fossils.checked++;
        
        // Check for API keys
        const hasApiKey = fossilContent.includes('sk-') || fossilContent.includes('apiKey') || fossilContent.includes('api_key');
        const hasRedacted = fossilContent.includes('[REDACTED]');
        
        if (hasApiKey) {
          results.fossils.withApiKeys++;
          console.log(`   ⚠️  ${fossilFile}: Contains potential API key`);
        } else if (hasRedacted) {
          results.fossils.withRedacted++;
          console.log(`   ✅ ${fossilFile}: Contains [REDACTED] (good)`);
        } else {
          console.log(`   ℹ️  ${fossilFile}: No API key field found`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking fossils: ${error}`);
    }

    // Check snapshot files
    console.log('\n2️⃣ Checking Snapshot Export Files...');
    
    try {
      const currentDir = process.cwd();
      const files = await fs.readdir(currentDir);
      const snapshotFiles = files.filter(f => f.startsWith('llm-snapshot-') && f.endsWith('.yml'));
      
      console.log(`   📸 Found ${snapshotFiles.length} snapshot files`);
      
      for (const snapshotFile of snapshotFiles.slice(-3)) { // Check last 3 snapshots
        const snapshotContent = await fs.readFile(snapshotFile, 'utf8');
        results.snapshots.checked++;
        
        // Check for API keys
        const hasApiKey = snapshotContent.includes('sk-') || snapshotContent.includes('apiKey') || snapshotContent.includes('api_key');
        const hasRedacted = snapshotContent.includes('[REDACTED]');
        
        if (hasApiKey) {
          results.snapshots.withApiKeys++;
          console.log(`   ⚠️  ${snapshotFile}: Contains potential API key`);
          
          // Show the problematic lines
          const lines = snapshotContent.split('\n');
          const apiKeyLines = lines.filter(line => line.includes('sk-') || line.includes('apiKey') || line.includes('api_key'));
          if (apiKeyLines.length > 0) {
            console.log(`      📝 Problematic lines:`);
            apiKeyLines.slice(0, 3).forEach(line => {
              console.log(`         ${line.trim()}`);
            });
          }
        } else if (hasRedacted) {
          results.snapshots.withRedacted++;
          console.log(`   ✅ ${snapshotFile}: Contains [REDACTED] (good)`);
        } else {
          console.log(`   ℹ️  ${snapshotFile}: No API key field found`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking snapshots: ${error}`);
    }

    // Summary
    console.log('\n📋 API Key Check Summary');
    console.log('='.repeat(60));
    console.log(`🦴 Fossils checked: ${results.fossils.checked}`);
    console.log(`   ⚠️  With API keys: ${results.fossils.withApiKeys}`);
    console.log(`   ✅ With [REDACTED]: ${results.fossils.withRedacted}`);
    console.log(`📸 Snapshots checked: ${results.snapshots.checked}`);
    console.log(`   ⚠️  With API keys: ${results.snapshots.withApiKeys}`);
    console.log(`   ✅ With [REDACTED]: ${results.snapshots.withRedacted}`);

    if (results.fossils.withApiKeys > 0 || results.snapshots.withApiKeys > 0) {
      console.log('\n❌ ISSUES FOUND: API keys detected in fossils/snapshots!');
      console.log('💡 The sanitization may not be working properly.');
    } else {
      console.log('\n✅ NO ISSUES: No API keys found in fossils/snapshots');
      console.log('🎉 API key sanitization appears to be working correctly!');
    }

    return results;

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  }
}

// Run check if this script is executed directly
if (import.meta.main) {
  checkApiKeysInFossils()
    .then(() => {
      console.log('\n✅ API key check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API key check failed:', error);
      process.exit(1);
    });
}

export { checkApiKeysInFossils }; 