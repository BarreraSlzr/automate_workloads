#!/usr/bin/env bun
import { getFossilSummary } from '../src/utils/fossilSummary';

async function main() {
  const summary = await getFossilSummary();
  console.log(JSON.stringify(summary, null, 2));
}
main(); 