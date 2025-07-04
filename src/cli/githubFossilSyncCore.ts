import { GitHubFossilManager } from '../utils/githubFossilManager';
import { yamlToJson } from '../utils/yamlToJson';
import { E2ERoadmap } from '../types';
import { GitHubService } from '../services/github';
import * as fs from 'fs';

export interface GithubFossilSyncOptions {
  owner: string;
  repo: string;
  roadmapPath: string;
  createLabels?: boolean;
  createMilestones?: boolean;
  createIssues?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  testMode?: boolean;
  output?: string;
}

export interface GithubFossilSyncResult {
  issues: any[];
  milestones: any[];
  labels: any[];
  fossilCollection: any;
  outputPath?: string;
  summary: string;
}

export async function githubFossilSync(options: GithubFossilSyncOptions): Promise<GithubFossilSyncResult> {
  const {
    owner,
    repo,
    roadmapPath,
    createLabels = true,
    createMilestones = true,
    createIssues = true,
    dryRun = false,
    verbose = false,
    testMode = false,
    output
  } = options;

  if (testMode) {
    return {
      issues: [],
      milestones: [],
      labels: [],
      fossilCollection: {},
      summary: 'Test mode: no actions performed.'
    };
  }

  if (!fs.existsSync(roadmapPath)) {
    throw new Error(`Roadmap file not found: ${roadmapPath}`);
  }

  // Optionally check GitHub CLI readiness (skip for test/dryRun)
  if (!dryRun && !testMode) {
    const github = new GitHubService(owner, repo);
    const isReady = await github.isReady();
    if (!isReady) {
      throw new Error('GitHub CLI is not ready. Please run: gh auth login');
    }
  }

  const roadmap = yamlToJson<E2ERoadmap>(roadmapPath);
  if (verbose) {
    console.log(`📖 Loaded roadmap with ${roadmap.tasks.length} tasks`);
  }

  const manager = new GitHubFossilManager(owner, repo);
  let labels: any[] = [];
  let milestones: any[] = [];
  let issues: any[] = [];

  if (dryRun) {
    const dryIssues = roadmap.tasks.filter(task => !task.issues || task.issues.length === 0);
    const dryMilestones = roadmap.tasks.filter(task => task.milestone);
    const dryLabels = ['roadmap', 'automation', 'e2e', 'fossil', 'status:pending', 'status:done'];
    return {
      issues: dryIssues,
      milestones: dryMilestones,
      labels: dryLabels,
      fossilCollection: {},
      summary: `Dry run: would create ${dryIssues.length} issues, ${dryMilestones.length} milestones, ${dryLabels.length} labels.`
    };
  }

  if (createLabels) {
    labels = await manager.createLabelsForRoadmap();
    if (verbose) console.log(`✅ Created ${labels.length} labels`);
  }
  if (createMilestones) {
    milestones = await manager.createMilestonesFromRoadmap(roadmap);
    if (verbose) console.log(`✅ Created ${milestones.length} milestones`);
  }
  if (createIssues) {
    issues = await manager.createIssuesFromRoadmap(roadmap);
    if (verbose) console.log(`✅ Created ${issues.length} issues`);
  }

  const fossilCollection = manager.createFossilCollection(issues, milestones, labels);
  let outputPath: string | undefined = undefined;
  if (output) {
    fs.writeFileSync(output, JSON.stringify(fossilCollection, null, 2));
    outputPath = output;
  }

  const summary = `Issues created: ${issues.length}, Milestones created: ${milestones.length}, Labels created: ${labels.length}`;
  return { issues, milestones, labels, fossilCollection, outputPath, summary };
} 