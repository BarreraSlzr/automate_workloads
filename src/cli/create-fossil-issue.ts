#!/usr/bin/env bun
import { Command } from 'commander';
import { createFossilIssue } from '../utils/fossilIssue';

const program = new Command();

program
  .name('create-fossil-issue')
  .description('Preferred CLI for fossil-backed, deduplicated GitHub issue creation. Always use this instead of direct gh issue create!')
  .requiredOption('--owner <owner>', 'Repository owner')
  .requiredOption('--repo <repo>', 'Repository name')
  .requiredOption('--title <title>', 'Issue title')
  .requiredOption('--body <body>', 'Issue body content')
  .option('--labels <labels>', 'Comma-separated labels')
  .option('--milestone <milestone>', 'Milestone title')
  .option('--section <section>', 'Section or context for the issue')
  .option('--type <type>', 'Fossil type (default: action)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--metadata <metadata>', 'JSON string for additional metadata')
  .action(async (opts) => {
    const labels = opts.labels ? opts.labels.split(',') : [];
    const tags = opts.tags ? opts.tags.split(',') : [];
    let metadata = {};
    if (opts.metadata) {
      try {
        metadata = JSON.parse(opts.metadata);
      } catch {
        console.error('Invalid JSON for --metadata');
        process.exit(1);
      }
    }
    const result = await createFossilIssue({
      owner: opts.owner,
      repo: opts.repo,
      title: opts.title,
      body: opts.body,
      labels,
      milestone: opts.milestone,
      section: opts.section,
      type: opts.type,
      tags,
      metadata,
    });
    if (result.deduplicated) {
      console.log(`⚠️ Issue already exists for fossil hash: ${result.fossilHash} (Fossil ID: ${result.fossilId})`);
    } else {
      console.log(`🆕 Created issue #${result.issueNumber} (Fossil ID: ${result.fossilId}, Hash: ${result.fossilHash})`);
    }
  });

program.parse(process.argv); 