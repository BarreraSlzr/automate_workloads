import * as fs from "fs";
import * as yaml from "js-yaml";
import { issueExists } from './cli';
import { createFossilIssue } from './fossilIssue';
import { isTestMode } from '../cli/repo-orchestrator';
import { GitHubCLICommands } from './githubCliCommands';
import { parseJsonSafe } from '@/utils/json';
import { getCurrentRepoOwner, getCurrentRepoName } from '@/utils/cli';

async function runGh(params: { cmd: string; owner: string; repo: string }) {
  const { cmd, owner, repo } = params;
  try {
    const commands = new GitHubCLICommands(owner, repo);
    const result = await commands.executeCommand(cmd);
    return result.success ? result.stdout.trim() : null;
  } catch (e) {
    return null;
  }
}

async function getMilestoneIdByTitle(params: { owner: string; repo: string; title: string }): Promise<string | null> {
  const { owner, repo, title } = params;
  if (isTestMode({ owner, repo, title })) return null;
  const out = await runGh({ cmd: `gh api repos/${owner}/${repo}/milestones --jq '.[] | select(.title=="${title}") | .number'`, owner, repo });
  if (typeof out === "undefined" || out === null) return null;
  const first = out.split("\n")[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

async function ensureMilestone(params: { owner: string; repo: string; name: string }): Promise<string | null> {
  const { owner, repo, name } = params;
  if (isTestMode({ owner, repo, name })) return null;
  let milestoneId: string | null = await getMilestoneIdByTitle({ owner, repo, title: name });
  if (milestoneId) {
    console.log(`✅ Milestone exists: ${name}`);
    return milestoneId;
  }
  const commands = new GitHubCLICommands(owner, repo);
  const result = await commands.createMilestone({
    title: name,
    description: 'Auto-created from tracker'
  });
  if (result.success) {
    milestoneId = await getMilestoneIdByTitle({ owner, repo, title: name });
    if (milestoneId) {
      console.log(`🆕 Created milestone: ${name}`);
      return milestoneId;
    }
  }
  console.error(`❌ Failed to create milestone: ${name}`);
  return null;
}

async function getIssueByTitle(params: { owner: string; repo: string; title: string }): Promise<{number: string, state: string} | null> {
  const { owner, repo, title } = params;
  if (isTestMode({ owner, repo, title })) return null;
  if (!issueExists({ owner, repo, title, state: 'all' })) return null;
  const commands = new GitHubCLICommands(owner, repo);
  const result = await commands.listIssues({ state: 'all' });
  if (!result.success) return null;
  try {
    const arr = parseJsonSafe(result.stdout, 'syncTracker:result.stdout') as any[];
    for (const issue of arr) {
      if (issue.title.trim() === title.trim()) {
        return { number: String(issue.number), state: issue.state };
      }
    }
  } catch {}
  return null;
}

async function ensureIssue(params: { task: { section: string; text: string }; milestoneId: string | undefined; owner: string; repo: string; projectNumber: number }) {
  const { task, milestoneId, owner, repo, projectNumber } = params;
  if (isTestMode({ owner, repo, milestoneId, projectNumber })) return;
  if (!milestoneId || milestoneId === "") return;
  let issue = await getIssueByTitle({ owner, repo, title: task.text });
  if (issue) {
    console.log(`✅ Issue exists: #${String(issue.number ?? "")} - ${task.text}`);
    if (issue.state === "closed") {
      const commands = new GitHubCLICommands(owner, repo);
      const reopenResult = await commands.executeCommand(`gh issue reopen ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
      if (reopenResult.success) {
        console.log(`🔄 Reopened issue #${String(issue.number ?? "")}`);
      }
    }
    await addIssueToProject({ issueNumber: String(issue.number ?? ""), owner, repo, projectNumber });
    return;
  }
  const result = await createFossilIssue({
    body: `(Auto-created from tracker section: ${task.section})`,
    title: task.text,
    section: task.section,
    metadata: { source: 'sync-tracker', trackerSection: task.section },
    type: 'action' as const,
    tags: ['github', 'issue', task.section],
    parsedFields: {}
  });
  if (result.deduplicated) {
    console.log(`⚠️ Issue already exists for fossil hash: ${result.fossilHash}`);
    return;
  } else {
    console.log(`🆕 Created issue: ${task.text} (Fossil ID: ${result.fossilId}, Issue #: ${result.issueNumber})`);
  }
}

async function addIssueToProject(params: { issueNumber: string | undefined; owner: string; repo: string; projectNumber: number }) {
  const { issueNumber, owner, repo, projectNumber } = params;
  if (isTestMode({ owner, repo, issueNumber, projectNumber })) return;
  if (!issueNumber || issueNumber === "") return;
  const addResult = await runGh({ cmd: `gh project item-add ${projectNumber} --owner ${owner} --issue ${String(issueNumber ?? "")}`, owner, repo });
  if (addResult && !addResult.includes("already exists")) {
    console.log(`📋 Added issue #${String(issueNumber ?? "") } to project board`);
  } else {
    console.log(`ℹ️ Issue #${String(issueNumber ?? "") } already in project board or could not add`);
  }
}

async function closeIssueByTitle(params: { title: string; owner: string; repo: string }) {
  const { title, owner, repo } = params;
  if (isTestMode({ owner, repo, title })) return;
  const issue = await getIssueByTitle({ owner, repo, title });
  if (issue && issue.state === "open") {
    const commands = new GitHubCLICommands(owner, repo);
    const closeResult = await commands.executeCommand(`gh issue close ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
    if (closeResult.success) {
      console.log(`✅ Closed issue #${String(issue.number ?? "")} for checked-off item: ${title}`);
    }
  }
}

async function ensureTestOrFossilIssue(params: { item: { type: string; name: string; file: string }; milestoneId: string | undefined; owner: string; repo: string; projectNumber: number }) {
  const { item, milestoneId, owner, repo, projectNumber } = params;
  if (isTestMode({ owner, repo, milestoneId, projectNumber })) return;
  if (!milestoneId || milestoneId === "") return;
  const title = `Add ${item.type} for ${item.name} in ${item.file}`;
  let issue = await getIssueByTitle({ owner, repo, title });
  if (issue) {
    if (issue.state === "closed") {
      const commands = new GitHubCLICommands(owner, repo);
      await commands.executeCommand(`gh issue reopen ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
    }
    await addIssueToProject({ issueNumber: String(issue.number ?? ""), owner, repo, projectNumber });
    return;
  }
  const result = await createFossilIssue({
    body: `(Auto-created for missing ${item.type} in ${item.file})`,
    title: title,
    section: item.type,
    metadata: { source: 'sync-tracker', file: item.file, name: item.name, type: item.type },
    type: 'action' as const,
    tags: ['github', 'issue', item.type],
    parsedFields: {}
  });
  if (result.deduplicated) {
    console.log(`⚠️ Issue already exists for fossil hash: ${result.fossilHash}`);
    return;
  } else {
    console.log(`🆕 Created ${item.type} issue: ${title} (Fossil ID: ${result.fossilId}, Issue #: ${result.issueNumber})`);
  }
}

export async function syncTrackerWithGitHub(options: {
  trackerMdPath: string;
  projectStatusYmlPath: string;
  owner: string;
  repo: string;
  projectNumber: number;
  autoClose?: boolean;
  syncTests?: boolean;
  test?: boolean;
  mock?: boolean;
}) {
  if (isTestMode(options)) {
    console.log('[MOCK] syncTrackerWithGitHub called');
    return;
  }
  // --- 1. Parse master tracker markdown ---
  const trackerMd = fs.readFileSync(options.trackerMdPath, "utf8");
  let currentSection = "";
  const tasks: { section: string; checked: boolean; text: string }[] = [];
  let lastSection = "";
  for (const line of trackerMd.split("\n")) {
    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch) {
      lastSection = sectionMatch[1] || "";
      continue;
    }
    const taskMatch = line.match(/^- \[([ xX])\] (.+)$/);
    if (taskMatch) {
      tasks.push({
        section: lastSection,
        checked: taskMatch[1] !== " ",
        text: taskMatch[2] || "",
      });
    }
  }
  // --- 2. Parse fossils/project_status.yml ---
  const projectStatus = yaml.load(fs.readFileSync(options.projectStatusYmlPath, "utf8")) as any;
  // --- 3. Ensure milestones exist ---
  const uniqueSections = Array.from(new Set(tasks.map((task) => task.section))).map((section, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing section ${i + 1} of ${arr.length}`);
    }
    return section;
  });
  const milestoneIds: Record<string, string> = {};
  for (const section of uniqueSections) {
    if (section) {
      if (uniqueSections.indexOf(section) % 10 === 0 || uniqueSections.indexOf(section) === uniqueSections.length - 1) {
        console.log(`🔄 Processing milestone section ${uniqueSections.indexOf(section) + 1} of ${uniqueSections.length}`);
      }
      const msId = await ensureMilestone({ owner: options.owner, repo: options.repo, name: section });
      if (typeof msId === "string" && msId.length > 0) milestoneIds[section] = msId;
    }
  }
  // --- 4. Ensure issues exist, assign milestone/labels, add to project board ---
  for (const task of tasks) {
    if (tasks.indexOf(task) % 10 === 0 || tasks.indexOf(task) === tasks.length - 1) {
      console.log(`🔄 Processing tracker task ${tasks.indexOf(task) + 1} of ${tasks.length}`);
    }
    const msId = String(milestoneIds[task.section] || "");
    if (!task.checked && task.section && msId.length > 0) {
      await ensureIssue({ task, milestoneId: msId, owner: options.owner, repo: options.repo, projectNumber: options.projectNumber });
    }
    if (options.autoClose && task.checked) {
      await closeIssueByTitle({ title: task.text, owner: options.owner, repo: options.repo });
    }
  }
  // --- 5. Sync missing tests/fossils from fossils/project_status.yml ---
  const modulesObj = (projectStatus && typeof projectStatus.modules === 'object') ? projectStatus.modules : {};
  const entries = Object.entries(modulesObj);
  if (options.syncTests && entries.length > 0) {
    const testMilestone = String(milestoneIds["Testing & Automation"] || "");
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      if (i % 10 === 0 || i === entries.length - 1) {
        console.log(`🔄 Processing module entry ${i + 1} of ${entries.length}`);
      }
      const [moduleKey, module] = entry;
      if (module && Array.isArray((module as any).files)) {
        for (let j = 0; j < (module as any).files.length; j++) {
          const fileObj = (module as any).files[j];
          if (j % 10 === 0 || j === (module as any).files.length - 1) {
            console.log(`🔄 Processing file object ${j + 1} of ${(module as any).files.length}`);
          }
          const fileName = Object.keys(fileObj)[0] || "";
          const fileData = fileObj[fileName];
          if (!fileData) continue;
          // Missing tests
          if (Array.isArray(fileData.functions) && typeof fileData.tests === "undefined" && testMilestone.length > 0) {
            for (let k = 0; k < fileData.functions.length; k++) {
              if (k % 10 === 0 || k === fileData.functions.length - 1) {
                console.log(`🔄 Processing function ${k + 1} of ${fileData.functions.length}`);
              }
              const func = fileData.functions[k];
              await ensureTestOrFossilIssue({ item: { type: "test", name: func, file: fileName }, milestoneId: testMilestone, owner: options.owner, repo: options.repo, projectNumber: options.projectNumber });
            }
          }
          // Missing fossilization
          if (typeof fileData.fossilized_output === "boolean" && fileData.fossilized_output === false && testMilestone.length > 0) {
            await ensureTestOrFossilIssue({ item: { type: "fossilization", name: fileName, file: fileName }, milestoneId: testMilestone, owner: options.owner, repo: options.repo, projectNumber: options.projectNumber });
          }
        }
      }
    }
  }
  console.log("Sync complete!");
} 