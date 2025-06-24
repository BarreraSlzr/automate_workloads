import { execSync } from "child_process";

function main() {
  // You can parameterize these or use process.argv for flexibility
  const owner = "BarreraSlzr";
  const repo = "automate_workloads";

  try {
    const result = execSync(
      `gh issue list --repo ${owner}/${repo} --state open --json number,title,state`,
      { encoding: "utf-8" }
    );
    const issues = JSON.parse(result);
    if (issues.length === 0) {
      console.log("No open issues found.");
      return;
    }
    for (const issue of issues) {
      console.log(`#${issue.number}: ${issue.title} [${issue.state}]`);
    }
  } catch (err) {
    console.error("Error running gh CLI:", err);
    process.exit(1);
  }
}

main();
