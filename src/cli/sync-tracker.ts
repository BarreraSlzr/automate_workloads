// If you see a type error for 'js-yaml', run: bun add -d @types/js-yaml
// If needed, add: declare module 'js-yaml';
import { Command } from "commander";
import { syncTrackerWithGitHub } from '../utils/syncTracker';

const program = new Command();

// --- CONFIG ---
const TRACKER_MD = ".temp-issue-14-body.md";
const PROJECT_STATUS_YML = "project_status.yml";
const OWNER = "barreraslzr";
const REPO = "automate_workloads";
const PROJECT_NUMBER = 4; // Update as needed

program
  .command("sync-tracker")
  .description("Sync master tracker and project_status.yml with GitHub milestones, issues, and project board")
  .option("--auto-close", "Auto-close issues for checked-off items")
  .option("--sync-tests", "Sync missing tests/fossils from project_status.yml")
  .action(async (opts) => {
    await syncTrackerWithGitHub({
      trackerMdPath: TRACKER_MD,
      projectStatusYmlPath: PROJECT_STATUS_YML,
      owner: OWNER,
      repo: REPO,
      projectNumber: PROJECT_NUMBER,
      autoClose: opts.autoClose,
      syncTests: opts.syncTests,
    });
  });

program.parse(process.argv); 