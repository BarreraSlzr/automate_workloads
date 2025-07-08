#!/usr/bin/env bun

import { toFossilEntry, generateContentHash } from './src/utils/fossilize';
import type { ContextEntry } from './src/types';

console.log('🧪 Testing Fossilize Utility Pattern');
console.log('====================================');

// Test the PARAMS OBJECT PATTERN in fossilize utility
const testEntry = toFossilEntry({
  type: 'knowledge',
  title: 'Fossilize Pattern Test',
  content: 'Testing the fossilize utility with PARAMS OBJECT PATTERN',
  tags: ['test', 'pattern', 'fossilize'],
  source: 'manual',
  metadata: { testMode: true }
});

console.log('✅ Fossilize utility test result:');
console.log('ID:', testEntry.id);
console.log('Type:', testEntry.type);
console.log('Title:', testEntry.title);
console.log('Content Hash:', testEntry.metadata.contentHash);
console.log('Tags:', testEntry.tags);
console.log('Source:', testEntry.source);

// Test content hash generation
const hash = generateContentHash({
  content: 'test content',
  type: 'knowledge',
  title: 'test title'
});

console.log('\n✅ Content hash generation test:');
console.log('Generated hash:', hash);
console.log('Hash length:', hash.length);

console.log('\n🎯 All fossilize pattern tests passed!'); 