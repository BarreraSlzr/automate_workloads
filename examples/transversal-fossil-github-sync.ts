#!/usr/bin/env bun

/**
 * Transversal Fossil & GitHub Sync Example
 * Demonstrates the canonical, automation-friendly workflow for:
 *  - Fossilizing the roadmap (YAML → JSON → Markdown)
 *  - Curating as a JSON fossil
 *  - (Dry-run) syncing roadmap tasks to GitHub issues/milestones/labels
 *  - Outputting a summary and canonical fossil paths
 *
 * This script is suitable for CI, documentation, and onboarding.
 */

import { curateAndCheck } from '../src/utils/curateFossil';
import { yamlToJson } from '../src/utils/yamlToJson';
import { roadmapToMarkdown } from '../src/utils/roadmapToMarkdown';
import { githubFossilSync } from '../src/cli/githubFossilSyncCore';
import type { E2ERoadmap } from '../src/types';
import fs from 'fs';

async function main() {
  const owner = 'barreraslzr';
  const repo = 'automate_workloads';
  const roadmapPath = 'fossils/roadmap.yml';
  const outputDir = 'fossils';
  const tag = 'canonical';

  console.log('🌱 Transversal Fossil & GitHub Sync Example');
  console.log('==========================================\n');

  // 1. Curate roadmap YAML as JSON fossil
  console.log('1️⃣ Curating roadmap fossil...');
  const curatedJsonPath = await curateAndCheck({ inputYaml: roadmapPath, outputDir, tag, dryRun: true, validate: true });
  console.log(`✅ Curated JSON fossil: ${curatedJsonPath}\n`);

  // 2. Generate Markdown from roadmap
  console.log('2️⃣ Generating Markdown from roadmap...');
  const roadmap = yamlToJson<E2ERoadmap>(roadmapPath);
  const markdown = roadmapToMarkdown(roadmap);
  const mdPath = `${outputDir}/roadmap.md`;
  fs.writeFileSync(mdPath, markdown);
  console.log(`✅ Markdown generated: ${mdPath}\n`);

  // 3. (Dry-run) Use githubFossilSync to sync issues/milestones/labels
  console.log('3️⃣ (Dry-run) Syncing roadmap to GitHub...');
  const result = await githubFossilSync({
    owner,
    repo,
    roadmapPath,
    createLabels: true,
    createMilestones: true,
    createIssues: true,
    dryRun: true,
    verbose: false,
    testMode: false
  });

  // 4. Output summary
  console.log('4️⃣ Summary of actions:');
  console.log(result.summary);
  console.log('   - All outputs use stable, canonical filenames.');
  console.log('\n🎯 This script is suitable for CI, onboarding, and documentation.');
  console.log('   - To actually create issues/milestones/labels, set dryRun = false and ensure GitHub CLI is authenticated.');
}

main().catch(err => {
  console.error('❌ Example failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}); 