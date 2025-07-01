#!/usr/bin/env bun
import * as fs from 'fs/promises';
import * as path from 'path';

const FOSSIL_DIR = path.resolve('.context-fossil/entries');
const TEST_PATTERNS = [/test/i, /excerpt/i, /verification/i];

async function main() {
  const files = await fs.readdir(FOSSIL_DIR);
  const toDelete: any[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const fossil = JSON.parse(await fs.readFile(path.join(FOSSIL_DIR, file), 'utf8'));
    fossil._filename = file;
    // Check title
    if (TEST_PATTERNS.some(re => re.test(fossil.title))) {
      toDelete.push(fossil);
      continue;
    }
    // Check tags
    if ((fossil.tags || []).some((tag: string) => TEST_PATTERNS.some(re => re.test(tag)))) {
      toDelete.push(fossil);
      continue;
    }
  }
  // Delete files
  for (const fossil of toDelete) {
    await fs.unlink(path.join(FOSSIL_DIR, fossil._filename));
  }
  // Print summary
  if (toDelete.length === 0) {
    console.log('No test assertion fossils found to delete.');
    return;
  }
  console.log('Deleted test assertion fossils:');
  for (const fossil of toDelete) {
    console.log(`- [${fossil.type}] ${fossil.title} (${fossil.createdAt}) [${fossil._filename}]`);
  }
}

main().catch(err => {
  console.error('Error during test fossil cleanup:', err);
  process.exit(1);
}); 