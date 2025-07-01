#!/usr/bin/env bun
import { getFossilSummary } from '../src/utils/fossilSummary';

async function main() {
  const summary = await getFossilSummary();
  console.log('| Type | Title | Created | Tags | Excerpt |');
  console.log('|------|-------|---------|------|---------|');
  for (const f of summary) {
    const tags = f.tags.join(', ');
    const excerpt = f.excerpt.replace(/\|/g, ''); // Remove pipe chars for MD table
    console.log(`| ${f.type} | ${f.title} | ${f.createdAt} | ${tags} | ${excerpt} |`);
  }
}
main(); 