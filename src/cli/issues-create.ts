import { GitHubService } from '../services/github.ts';
import { ContextFossilService } from './context-fossil.ts';
import * as fs from 'fs';
import { createFossilIssue } from '../utils/fossilIssue';
import { IssuesCreateParamsSchema, IssuesCreateParams } from '../types/cli';

export async function runIssuesCreate(options: IssuesCreateParams = {}) {
  const debug = !!options.debug || process.env.DEBUG === '1';
  const fossil = new ContextFossilService();
  const title = '[AUTOMATION] Streamlined Automation Workflow Progression';
  const purpose = options.purpose || 'Track and ensure the tested progression of the streamlined automation workflow, from issue creation to orchestration and documentation.';
  const checklist = options.checklist || '- [ ] Document the end-to-end workflow\n- [ ] Automate orchestration and reporting\n- [ ] Enforce consistency with templates and CI\n- [ ] Monitor and iterate on the process\n- [ ] Provide onboarding and contribution guides';
  const metadata = options.metadata || `Created by automation on ${new Date().toISOString()}`;
  const content = `Purpose: ${purpose}\n\nChecklist:\n${checklist}\n\nMetadata: ${metadata}`;
  const templatePath = '.github/ISSUE_TEMPLATE/automation_task.yml';
  const owner = process.env.GITHUB_OWNER || 'BarreraSlzr';
  const repo = process.env.GITHUB_REPO || 'automate_workloads';

  // Preflight: Check GitHub CLI
  const github = new GitHubService(owner, repo);
  if (!(await github.isReady())) {
    console.error('❌ GitHub CLI is not ready. Please run: gh auth login');
    return 1;
  }

  // Preflight: Check template file
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Issue template file is missing at ${templatePath}`);
    return 1;
  }

  // Preflight: Check fossil storage
  try {
    await fossil.initialize();
  } catch (fossilError: any) {
    console.error('❌ Failed to initialize fossil storage:', fossilError.message);
    if (debug) console.error(fossilError);
    return 1;
  }

  // Check for duplicate in fossil storage
  let existing;
  try {
    existing = await fossil.queryEntries({
      search: title,
      type: 'action',
      limit: 1,
      offset: 0
    });
  } catch (queryError: any) {
    console.error('❌ Failed to query fossil storage:', queryError.message);
    if (debug) console.error(queryError);
    return 1;
  }
  if (existing && existing.length > 0) {
    console.log('⚠️  Duplicate automation issue found in fossil storage. Skipping creation.');
    return 0;
  }

  // Use fossil-backed issue creation
  try {
    const result = await createFossilIssue({
      body: content,
      title,
      section: 'general',
      metadata: { source: 'cli-issues-create' },
      type: 'action',
      tags: ['automation', 'bot'],
      parsedFields: {}
    });
    if (result.deduplicated) {
      console.log(`⚠️ Duplicate automation issue found for fossil hash: ${result.fossilHash}. Skipping creation.`);
      return 0;
    } else {
      console.log(`✅ Automation issue created: ${title} (Fossil ID: ${result.fossilId}, Issue #: ${result.issueNumber})`);
      return 0;
    }
  } catch (err: any) {
    console.error('❌ Failed to create automation issue:', err.message);
    if (debug) console.error(err);
    return 1;
  }
} 