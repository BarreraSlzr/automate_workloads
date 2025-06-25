import { GitHubService } from "../src/services/github";

async function main() {
  const owner = "BarreraSlzr";
  const repo = "automate_workloads";
  const title = "Ensure tool-centric-demo.ts is up to date";
  const body =
    "This issue is automatically created to ensure that `examples/tool-centric-demo.ts` remains in sync with the latest core features and integration patterns. Please review and update the demo as new capabilities are added to the automation ecosystem.";
  const labels = ["maintenance", "demo"];

  const github = new GitHubService(owner, repo);

  // Get all open issues and check for an existing one with the same title
  const issuesResponse = await github.getIssues({ state: "open" });
  if (!issuesResponse.success || !issuesResponse.data) {
    console.error("Failed to fetch issues:", issuesResponse.error);
    process.exit(1);
  }

  const existing = issuesResponse.data.find(issue => issue.title === title);
  if (existing) {
    console.log(`✅ Issue already exists: #${existing.number} - ${existing.title}`);
    return;
  }

  // Create the issue
  const createResponse = await github.createIssue(title, body, { labels });
  if (createResponse.success && createResponse.data) {
    console.log(`✅ Created issue: #${createResponse.data.number} - ${createResponse.data.title}`);
  } else {
    console.error("❌ Failed to create issue:", createResponse.error);
    process.exit(1);
  }
}

main(); 