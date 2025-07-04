#!/usr/bin/env bun

/**
 * CLI Usage Demo
 * 
 * Demonstrates the proper way to use the automation system through CLI commands
 * instead of direct imports. This is the recommended approach for all automation.
 */

import { executeCommand, executeCommandJSON } from '../src/utils/cli';
import { promises as fs } from 'fs';
import type { DemoResult } from '../src/types/examples';

class CLIUsageDemo {
  private owner: string;
  private repo: string;

  constructor(owner: string = 'barreraslzr', repo: string = 'automate_workloads') {
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Demo 1: Fossil-backed issue creation via CLI
   */
  async demoFossilIssueCreation(): Promise<DemoResult> {
    console.log('🔧 Demo 1: Fossil-backed issue creation via CLI');
    
    try {
      // Use CLI command instead of direct import
      const result = await executeCommand(
        `bun run src/cli/create-fossil-issue.ts \
          --owner ${this.owner} \
          --repo ${this.repo} \
          --title "CLI Demo Issue" \
          --body "This issue was created via CLI command" \
          --labels demo,cli \
          --section demo \
          --type action \
          --tags demo,automation`
      );

      if (result.success) {
        return {
          success: true,
          message: '✅ Fossil-backed issue created via CLI',
          data: result.stdout
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to create issue: ${result.stderr}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error in fossil issue creation: ${error}`
      };
    }
  }

  /**
   * Demo 2: Context fossil management via CLI
   */
  async demoContextFossilManagement(): Promise<DemoResult> {
    console.log('🔧 Demo 2: Context fossil management via CLI');
    
    try {
      // Add a fossil entry via CLI
      const addResult = await executeCommand(
        `bun run src/cli/context-fossil.ts add \
          --type knowledge \
          --title "CLI Demo Fossil" \
          --content "This fossil was added via CLI command" \
          --tags demo,cli,knowledge \
          --source automated`
      );

      if (!addResult.success) {
        return {
          success: false,
          message: `❌ Failed to add fossil: ${addResult.stderr}`
        };
      }

      // List fossils via CLI
      const listResult = await executeCommand(
        `bun run src/cli/context-fossil.ts list --type knowledge`
      );

      if (listResult.success) {
        return {
          success: true,
          message: '✅ Context fossil management via CLI',
          data: listResult.stdout
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to list fossils: ${listResult.stderr}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error in context fossil management: ${error}`
      };
    }
  }

  /**
   * Demo 3: Checklist updates via CLI
   */
  async demoChecklistUpdates(): Promise<DemoResult> {
    console.log('🔧 Demo 3: Checklist updates via CLI');
    
    try {
      // Create a sample markdown file for testing
      const sampleFile = 'temp-checklist-demo.md';
      const sampleContent = `# Demo Checklist

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Completed
- [x] Setup demo
`;

      await Bun.write(sampleFile, sampleContent);

      // Update checklist via CLI
      const result = await executeCommand(
        `bun run src/cli/update-checklist.ts file ${sampleFile} \
          --updates '{"Task 1": "done", "Task 2": "done"}'`
      );

      // Clean up
      await fs.unlink(sampleFile);

      if (result.success) {
        return {
          success: true,
          message: '✅ Checklist updates via CLI',
          data: result.stdout
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to update checklist: ${result.stderr}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error in checklist updates: ${error}`
      };
    }
  }

  /**
   * Demo 4: Repository orchestration via CLI
   */
  async demoRepositoryOrchestration(): Promise<DemoResult> {
    console.log('🔧 Demo 4: Repository orchestration via CLI');
    
    try {
      // Analyze repository via CLI
      const result = await executeCommand(
        `bun run src/cli/repo-orchestrator.ts analyze ${this.owner} ${this.repo}`
      );

      if (result.success) {
        return {
          success: true,
          message: '✅ Repository orchestration via CLI',
          data: result.stdout
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to orchestrate repository: ${result.stderr}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error in repository orchestration: ${error}`
      };
    }
  }

  /**
   * Demo 5: GitHub issues management via CLI
   */
  async demoGitHubIssuesManagement(): Promise<DemoResult> {
    console.log('🔧 Demo 5: GitHub issues management via CLI');
    
    try {
      // List issues via CLI
      const result = await executeCommand(
        `bun run src/cli/github-issues.ts list \
          --owner ${this.owner} \
          --repo ${this.repo} \
          --state open \
          --limit 5`
      );

      if (result.success) {
        return {
          success: true,
          message: '✅ GitHub issues management via CLI',
          data: result.stdout
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to list issues: ${result.stderr}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error in GitHub issues management: ${error}`
      };
    }
  }

  /**
   * Run all demos
   */
  async runAllDemos(): Promise<void> {
    console.log('🚀 CLI Usage Demo');
    console.log('=================\n');

    const demos = [
      this.demoFossilIssueCreation.bind(this),
      this.demoContextFossilManagement.bind(this),
      this.demoChecklistUpdates.bind(this),
      this.demoRepositoryOrchestration.bind(this),
      this.demoGitHubIssuesManagement.bind(this)
    ];

    let successCount = 0;
    let totalCount = 0;

    for (const demo of demos) {
      totalCount++;
      const result = await demo();
      
      console.log(result.message);
      if (result.data) {
        console.log('📊 Data:', result.data.substring(0, 200) + '...');
      }
      console.log('');

      if (result.success) {
        successCount++;
      }
    }

    console.log('📊 Demo Summary:');
    console.log(`   Total demos: ${totalCount}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${totalCount - successCount}`);
    console.log(`   Success rate: ${Math.round((successCount / totalCount) * 100)}%`);
    console.log('');

    if (successCount === totalCount) {
      console.log('✅ All CLI demos completed successfully!');
      console.log('🎯 This demonstrates the proper CLI-first approach.');
    } else {
      console.log('⚠️ Some demos failed. Check the error messages above.');
    }
  }
}

// Run the demo
async function main() {
  const demo = new CLIUsageDemo();
  await demo.runAllDemos();
}

main().catch(error => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
}); 