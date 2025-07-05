import { createFossilIssue } from '../utils/fossilIssue';

async function main() {
  const owner = "BarreraSlzr";
  const repo = "automate_workloads";
  const title = "Ensure tool-centric-demo.ts is up to date";
  const body =
    "This issue is automatically created to ensure that `examples/tool-centric-demo.ts` remains in sync with the latest core features and integration patterns. Please review and update the demo as new capabilities are added to the automation ecosystem.";
  const labels = ["maintenance", "demo"];
  // Use fossil-backed issue creation
  const result = await createFossilIssue({
    body: body,
    title: title,
    section: 'demo',
    metadata: { source: 'demo-issue-cli' },
    type: 'action',
    tags: ['demo', 'automation'],
    parsedFields: {}
  });
  if (result.deduplicated) {
    console.log(`⚠️ Issue already exists for fossil hash: ${result.fossilHash} (Fossil ID: ${result.fossilId})`);
  } else {
    console.log(`✅ Created issue #${result.issueNumber} (Fossil ID: ${result.fossilId}, Hash: ${result.fossilHash})`);
  }
}

main(); 