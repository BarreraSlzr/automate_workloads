import * as fs from "fs";
import * as yaml from "js-yaml";
import { issueExists } from './cli';
import { createFossilIssue } from './fossilIssue';
import { isTestMode } from '../cli/repo-orchestrator';
import { GitHubCLICommands } from './githubCliCommands';

async function runGh(cmd: string, owner: string, repo: string) {
  try {
    const commands = new GitHubCLICommands(owner, repo);
    const result = await commands.executeCommand(cmd);
    return result.success ? result.stdout.trim() : null;
  } catch (e) {
    return null;
  }
}

async function getMilestoneIdByTitle(owner: string, repo: string, title: string): Promise<string | null> {
  if (isTestMode({ owner, repo, title })) return null;
  const out = await runGh(`gh api repos/${owner}/${repo}/milestones --jq '.[] | select(.title=="${title}") | .number'`, owner, repo);
  if (typeof out === "undefined" || out === null) return null;
  const first = out.split("\n")[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

async function ensureMilestone(owner: string, repo: string, name: string): Promise<string | null> {
  if (isTestMode({ owner, repo, name })) return null;
  let milestoneId: string | null = await getMilestoneIdByTitle(owner, repo, name);
  if (milestoneId) {
    console.log(`✅ Milestone exists: ${name}`);
    return milestoneId;
  }
  
  // Use centralized GitHubCLICommands for milestone creation
  const commands = new GitHubCLICommands(owner, repo);
  const result = await commands.createMilestone({
    title: name,
    description: 'Auto-created from tracker'
  });
  
  if (result.success) {
    milestoneId = await getMilestoneIdByTitle(owner, repo, name);
    if (milestoneId) {
      console.log(`🆕 Created milestone: ${name}`);
      return milestoneId;
    }
  }
  
  console.error(`❌ Failed to create milestone: ${name}`);
  return null;
}

async function getIssueByTitle(owner: string, repo: string, title: string): Promise<{number: string, state: string} | null> {
  if (isTestMode({ owner, repo, title })) return null;
  if (!issueExists(owner, repo, title, 'all')) return null;
  
  // Use centralized GitHubCLICommands for issue listing
  const commands = new GitHubCLICommands(owner, repo);
  const result = await commands.listIssues({ state: 'all' });
  
  if (!result.success) return null;
  
  try {
    const arr = JSON.parse(result.stdout);
    for (const issue of arr) {
      if (issue.title.trim() === title.trim()) {
        return { number: String(issue.number), state: issue.state };
      }
    }
  } catch {}
  return null;
}

async function ensureIssue(task: { section: string; text: string }, milestoneId: string | undefined, owner: string, repo: string, projectNumber: number) {
  if (isTestMode({ owner, repo, milestoneId, projectNumber })) return;
  if (!milestoneId || milestoneId === "") return;
  let issue = await getIssueByTitle(owner, repo, task.text);
  if (issue) {
    console.log(`✅ Issue exists: #${String(issue.number ?? "")} - ${task.text}`);
    if (issue.state === "closed") {
      // Use centralized GitHubCLICommands for issue reopening
      const commands = new GitHubCLICommands(owner, repo);
      const reopenResult = await commands.executeCommand(`gh issue reopen ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
      if (reopenResult.success) {
        console.log(`🔄 Reopened issue #${String(issue.number ?? "")}`);
      }
    }
    await addIssueToProject(String(issue.number ?? ""), owner, repo, projectNumber);
    return;
  }
  // Use fossil-backed issue creation
  const result = await createFossilIssue({
    owner,
    repo,
    title: task.text,
    body: `(Auto-created from tracker section: ${task.section})`,
    labels: [task.section],
    milestone: task.section,
    section: task.section,
    tags: ['github', 'issue', task.section],
    metadata: { trackerSection: task.section },
  });
  if (result.deduplicated) {
    console.log(`⚠️ Issue already exists for fossil hash: ${result.fossilHash}`);
    return;
  } else {
    console.log(`🆕 Created issue: ${task.text} (Fossil ID: ${result.fossilId}, Issue #: ${result.issueNumber})`);
  }
}

async function addIssueToProject(issueNumber: string | undefined, owner: string, repo: string, projectNumber: number) {
  if (isTestMode({ owner, repo, issueNumber, projectNumber })) return;
  if (!issueNumber || issueNumber === "") return;
  const addResult = await runGh(`gh project item-add ${projectNumber} --owner ${owner} --issue ${String(issueNumber ?? "")}`, owner, repo);
  if (addResult && !addResult.includes("already exists")) {
    console.log(`📋 Added issue #${String(issueNumber ?? "") } to project board`);
  } else {
    console.log(`ℹ️ Issue #${String(issueNumber ?? "") } already in project board or could not add`);
  }
}

async function closeIssueByTitle(title: string, owner: string, repo: string) {
  if (isTestMode({ owner, repo, title })) return;
  const issue = await getIssueByTitle(owner, repo, title);
  if (issue && issue.state === "open") {
    // Use centralized GitHubCLICommands for issue closing
    const commands = new GitHubCLICommands(owner, repo);
    const closeResult = await commands.executeCommand(`gh issue close ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
    if (closeResult.success) {
      console.log(`✅ Closed issue #${String(issue.number ?? "")} for checked-off item: ${title}`);
    }
  }
}

async function ensureTestOrFossilIssue(item: { type: string; name: string; file: string }, milestoneId: string | undefined, owner: string, repo: string, projectNumber: number) {
  if (isTestMode({ owner, repo, milestoneId, projectNumber })) return;
  if (!milestoneId || milestoneId === "") return;
  const title = `Add ${item.type} for ${item.name} in ${item.file}`;
  let issue = await getIssueByTitle(owner, repo, title);
  if (issue) {
    if (issue.state === "closed") {
      // Use centralized GitHubCLICommands for issue reopening
      const commands = new GitHubCLICommands(owner, repo);
      await commands.executeCommand(`gh issue reopen ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
    }
    await addIssueToProject(String(issue.number ?? ""), owner, repo, projectNumber);
    return;
  }
  // Use fossil-backed issue creation
  const result = await createFossilIssue({
    owner,
    repo,
    title,
    body: `(Auto-created for missing ${item.type} in ${item.file})`,
    labels: [item.type],
    milestone: milestoneId,
    section: item.type,
    tags: ['github', 'issue', item.type],
    metadata: { file: item.file, name: item.name, type: item.type },
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
  const uniqueSections = Array.from(new Set(tasks.map(t => t.section)));
  const milestoneIds: Record<string, string> = {};
  for (const section of uniqueSections) {
    if (section) {
      const msId = await ensureMilestone(options.owner, options.repo, section);
      if (typeof msId === "string" && msId.length > 0) milestoneIds[section] = msId;
    }
  }
  // --- 4. Ensure issues exist, assign milestone/labels, add to project board ---
  for (const task of tasks) {
    const msId = String(milestoneIds[task.section] || "");
    if (!task.checked && task.section && msId.length > 0) {
      await ensureIssue(task, msId, options.owner, options.repo, options.projectNumber);
    }
    if (options.autoClose && task.checked) {
      await closeIssueByTitle(task.text, options.owner, options.repo);
    }
  }
  // --- 5. Sync missing tests/fossils from fossils/project_status.yml ---
  if (options.syncTests && projectStatus && projectStatus.modules) {
    const testMilestone = String(milestoneIds["Testing & Automation"] || "");
    for (const moduleKey of Object.keys(projectStatus.modules)) {
      const module = projectStatus.modules[moduleKey];
      if (module && Array.isArray(module.files)) {
        for (const fileObj of module.files) {
          const fileName = Object.keys(fileObj)[0] || "";
          const fileData = fileObj[fileName];
          if (!fileData) continue;
          // Missing tests
          if (Array.isArray(fileData.functions) && typeof fileData.tests === "undefined" && testMilestone.length > 0) {
            for (const func of fileData.functions) {
              await ensureTestOrFossilIssue({ type: "test", name: func, file: fileName }, testMilestone, options.owner, options.repo, options.projectNumber);
            }
          }
          // Missing fossilization
          if (typeof fileData.fossilized_output === "boolean" && fileData.fossilized_output === false && testMilestone.length > 0) {
            await ensureTestOrFossilIssue({ type: "fossilization", name: fileName, file: fileName }, testMilestone, options.owner, options.repo, options.projectNumber);
          }
        }
      }
    }
  }
  console.log("Sync complete!");
} 