import { GitHubService } from '../services/github.ts';
import { ContextFossilService } from './context-fossil.ts';
import * as fs from 'fs';

export interface IssuesCreateOptions {
  purpose?: string;
  checklist?: string;
  metadata?: string;
  debug?: boolean;
}

export async function runIssuesCreate(options: IssuesCreateOptions = {}) {
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

  // Create the GitHub issue
  let response;
  try {
    const labels = ['automation', 'bot'];
    response = await github.createIssue(
      title,
      'TEMPLATE',
      Object.assign({ labels }, { purpose, checklist, metadata }) as any
    );
  } catch (githubError: any) {
    console.error('❌ Exception while creating GitHub issue:', githubError.message);
    if (debug) console.error(githubError);
    return 1;
  }

  if (response && response.success && response.data) {
    console.log('✅ Automation issue created:', response.data.title, response.data.number);
    // Store in fossil storage
    try {
      await fossil.addEntry({
        type: 'action',
        title,
        content,
        tags: ['automation', 'bot'],
        source: 'automated',
        metadata: {
          githubIssueNumber: response.data.number,
          githubIssueState: response.data.state,
          ...response.data
        },
        version: 1,
        children: [],
      });
    } catch (addError: any) {
      console.error('❌ Failed to add entry to fossil storage:', addError.message);
      if (debug) console.error(addError);
      return 1;
    }
    return 0;
  } else {
    console.error('❌ Failed to create automation issue:', response?.error);
    if (response?.error?.includes('authentication')) {
      console.error('👉 Please check your GitHub authentication: gh auth login');
    }
    if (response?.error?.includes('template')) {
      console.error('👉 Please ensure the issue template exists and is readable.');
    }
    if (debug && response) console.error(response);
    return 1;
  }
} 