#!/usr/bin/env bun
import * as fs from 'fs/promises';
import * as path from 'path';

const FOSSIL_DIR = path.resolve('.context-fossil/entries');

async function main() {
  const files = await fs.readdir(FOSSIL_DIR);
  const fossils: any[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const fossil = JSON.parse(await fs.readFile(path.join(FOSSIL_DIR, file), 'utf8'));
    fossil._filename = file;
    fossils.push(fossil);
  }

  const toDelete: any[] = [];
  const toKeep: any[] = [];
  const groupKey = (f: any) => `${f.type}||${f.title}`;
  const groups: Record<string, any[]> = {};

  for (const fossil of fossils) {
    // Rule 1: Delete if title contains unwanted repo
    if (
      /test-owner\/test-repo|owner\/repo|emmanuelbarrera\/automate_workloads/i.test(fossil.title)
    ) {
      toDelete.push(fossil);
      continue;
    }
    // Group by (type, title)
    const key = groupKey(fossil);
    if (!groups[key]) groups[key] = [];
    groups[key].push(fossil);
  }

  // For each group, keep only the most recent, delete the rest
  for (const group of Object.values(groups)) {
    if (group.length === 1) {
      toKeep.push(group[0]);
    } else {
      group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      toKeep.push(group[0]);
      toDelete.push(...group.slice(1));
    }
  }

  // Delete files
  for (const fossil of toDelete) {
    await fs.unlink(path.join(FOSSIL_DIR, fossil._filename));
  }

  // Print summary
  console.log('Deleted fossils:');
  for (const fossil of toDelete) {
    console.log(`- [${fossil.type}] ${fossil.title} (${fossil.createdAt}) [${fossil._filename}]`);
  }
  console.log('\nKept fossils:');
  for (const fossil of toKeep) {
    console.log(`- [${fossil.type}] ${fossil.title} (${fossil.createdAt}) [${fossil._filename}]`);
  }
}

main().catch(err => {
  console.error('Error during fossil cleanup:', err);
  process.exit(1);
}); 