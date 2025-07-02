import * as fs from "fs";
import * as yaml from "js-yaml";
import { execSync } from "child_process";
import { issueExists } from './cli';
import { createFossilIssue } from './fossilIssue';

function runGh(cmd: string) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (e) {
    return null;
  }
}

function getMilestoneIdByTitle(owner: string, repo: string, title: string): string | null {
  const out = runGh(`gh api repos/${owner}/${repo}/milestones --jq '.[] | select(.title=="${title}") | .number'`);
  if (typeof out === "undefined" || out === null) return null;
  const first = out.split("\n")[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

function ensureMilestone(owner: string, repo: string, name: string): string | null {
  let milestoneId: string | null = getMilestoneIdByTitle(owner, repo, name);
  if (milestoneId) {
    console.log(`✅ Milestone exists: ${name}`);
    return milestoneId;
  }
  runGh(`gh api repos/${owner}/${repo}/milestones -f title='${name}' -f description='Auto-created from tracker'`);
  milestoneId = getMilestoneIdByTitle(owner, repo, name);
  if (milestoneId) {
    console.log(`🆕 Created milestone: ${name}`);
    return milestoneId;
  } else {
    console.error(`❌ Failed to create milestone: ${name}`);
    return null;
  }
}

function getIssueByTitle(owner: string, repo: string, title: string): {number: string, state: string} | null {
  if (!issueExists(owner, repo, title, 'all')) return null;
  const out = runGh(`gh issue list --repo ${owner}/${repo} --state all --search "${title}" --json number,title,state`);
  if (!out) return null;
  try {
    const arr = JSON.parse(out);
    for (const issue of arr) {
      if (issue.title.trim() === title.trim()) {
        return { number: String(issue.number), state: issue.state };
      }
    }
  } catch {}
  return null;
}

async function ensureIssue(task: { section: string; text: string }, milestoneId: string | undefined, owner: string, repo: string, projectNumber: number) {
  if (!milestoneId || milestoneId === "") return;
  let issue = getIssueByTitle(owner, repo, task.text);
  if (issue) {
    console.log(`✅ Issue exists: #${String(issue.number ?? "")} - ${task.text}`);
    if (issue.state === "closed") {
      runGh(`gh issue reopen ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
      console.log(`🔄 Reopened issue #${String(issue.number ?? "")}`);
    }
    addIssueToProject(String(issue.number ?? ""), owner, repo, projectNumber);
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

function addIssueToProject(issueNumber: string | undefined, owner: string, repo: string, projectNumber: number) {
  if (!issueNumber || issueNumber === "") return;
  const addResult = runGh(`gh project item-add ${projectNumber} --owner ${owner} --issue ${String(issueNumber ?? "")}`);
  if (addResult && !addResult.includes("already exists")) {
    console.log(`📋 Added issue #${String(issueNumber ?? "") } to project board`);
  } else {
    console.log(`ℹ️ Issue #${String(issueNumber ?? "") } already in project board or could not add`);
  }
}

function closeIssueByTitle(title: string, owner: string, repo: string) {
  const issue = getIssueByTitle(owner, repo, title);
  if (issue && issue.state === "open") {
    runGh(`gh issue close ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
    console.log(`✅ Closed issue #${String(issue.number ?? "")} for checked-off item: ${title}`);
  }
}

async function ensureTestOrFossilIssue(item: { type: string; name: string; file: string }, milestoneId: string | undefined, owner: string, repo: string, projectNumber: number) {
  if (!milestoneId || milestoneId === "") return;
  const title = `Add ${item.type} for ${item.name} in ${item.file}`;
  let issue = getIssueByTitle(owner, repo, title);
  if (issue) {
    if (issue.state === "closed") {
      runGh(`gh issue reopen ${String(issue.number ?? "")} --repo ${owner}/${repo}`);
    }
    addIssueToProject(String(issue.number ?? ""), owner, repo, projectNumber);
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

export async function syncTrackerWithGitHub({
  trackerMdPath,
  projectStatusYmlPath,
  owner,
  repo,
  projectNumber,
  autoClose = false,
  syncTests = false,
}: {
  trackerMdPath: string;
  projectStatusYmlPath: string;
  owner: string;
  repo: string;
  projectNumber: number;
  autoClose?: boolean;
  syncTests?: boolean;
}) {
  // --- 1. Parse master tracker markdown ---
  const trackerMd = fs.readFileSync(trackerMdPath, "utf8");
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
  // --- 2. Parse project_status.yml ---
  const projectStatus = yaml.load(fs.readFileSync(projectStatusYmlPath, "utf8")) as any;
  // --- 3. Ensure milestones exist ---
  const uniqueSections = Array.from(new Set(tasks.map(t => t.section)));
  const milestoneIds: Record<string, string> = {};
  for (const section of uniqueSections) {
    if (section) {
      const msId = ensureMilestone(owner, repo, section);
      if (typeof msId === "string" && msId.length > 0) milestoneIds[section] = msId;
    }
  }
  // --- 4. Ensure issues exist, assign milestone/labels, add to project board ---
  for (const task of tasks) {
    const msId = String(milestoneIds[task.section] || "");
    if (!task.checked && task.section && msId.length > 0) {
      await ensureIssue(task, msId, owner, repo, projectNumber);
    }
    if (autoClose && task.checked) {
      closeIssueByTitle(task.text, owner, repo);
    }
  }
  // --- 5. Sync missing tests/fossils from project_status.yml ---
  if (syncTests && projectStatus && projectStatus.modules) {
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
              await ensureTestOrFossilIssue({ type: "test", name: func, file: fileName }, testMilestone, owner, repo, projectNumber);
            }
          }
          // Missing fossilization
          if (typeof fileData.fossilized_output === "boolean" && fileData.fossilized_output === false && testMilestone.length > 0) {
            await ensureTestOrFossilIssue({ type: "fossilization", name: fileName, file: fileName }, testMilestone, owner, repo, projectNumber);
          }
        }
      }
    }
  }
  console.log("Sync complete!");
} 