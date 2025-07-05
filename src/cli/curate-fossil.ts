#!/usr/bin/env bun

import { Command } from 'commander';
import { curateAndCheck } from '../utils/curateFossil';

const program = new Command();

program
  .name('curate-fossil')
  .description('Curate a canonical YAML (e.g., fossils/project_status.yml) into a JSON fossil')
  .argument('<inputYaml>', 'Path to the input YAML file (e.g., fossils/project_status.yml)')
  .option('-t, --tag <tag>', 'Tag for the curation', 'manual')
  .action(async (inputYaml, options) => {
    await curateAndCheck({ 
      owner: options.owner, 
      repo: options.repo, 
      metadata: options.metadata, 
      verbose: options.verbose, 
      dryRun: false, 
      type: options.type,
      tags: options.tags
    });
  });

if (import.meta.main) {
  program.parse(process.argv); 
}