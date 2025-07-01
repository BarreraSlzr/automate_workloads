#!/usr/bin/env bun

/**
 * MCP CLI - Modal Context Protocol Command Line Interface
 * 
 * A unified CLI for the automate_workloads ecosystem that provides:
 * - Repository orchestration and analysis
 * - LLM-powered planning and execution
 * - Context fossil storage and management
 * - Progress monitoring and tracking
 * - GitHub integration and automation
 * - QA workflows and testing
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { runIssuesCreate } from './src/cli/issues-create';

class MCPCLIService {
  private projectRoot: string;
  private packageJson: any;

  constructor() {
    this.projectRoot = process.cwd();
    this.packageJson = this.loadPackageJson();
  }

  private loadPackageJson(): any {
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      if (existsSync(packageJsonPath)) {
        return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not load package.json:', error.message);
    }
    return {};
  }

  private async executeBunScript(scriptName: string, args: string[] = []): Promise<string> {
    try {
      const result = execSync(`bun run ${scriptName} ${args.join(' ')}`, {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });
      return result;
    } catch (error) {
      throw new Error(`Bun script execution failed: ${error.message}`);
    }
  }

  async handleRepoCommand(owner: string, repo: string, workflow: string): Promise<void> {
    console.log(`🎯 Repository Orchestration: ${owner}/${repo}`);

    // Set environment variables for GitHub context
    process.env.GITHUB_OWNER = owner;
    process.env.GITHUB_REPO = repo;
    process.env.GITHUB_REPO_FULL = `${owner}/${repo}`;

    // Update fossil file with basic repository context
    await this.updateContextFossil({
      repository: {
        owner,
        repo,
        fullName: `${owner}/${repo}`,
        lastAccessed: new Date().toISOString(),
        workflow: workflow
      }
    });

    try {
      switch (workflow) {
        case 'analyze':
          console.log('📊 Analyzing repository...');
          await this.executeBunScript('repo:analyze', [owner, repo]);
          break;
        case 'plan':
          console.log('🤖 Creating LLM-powered plan...');
          await this.executeBunScript('repo:plan');
          break;
        case 'execute':
          console.log('🚀 Executing automation workflows...');
          await this.executeBunScript('repo:orchestrate', [owner, repo, '--workflow', 'execute']);
          break;
        case 'monitor':
          console.log('📈 Monitoring repository progress...');
          await this.executeBunScript('repo:monitor-progress', [owner, repo]);
          break;
        case 'full':
          console.log('🎯 Starting full orchestration workflow...');
          await this.executeBunScript('repo:analyze', [owner, repo]);
          await this.executeBunScript('repo:plan');
          await this.executeBunScript('repo:orchestrate', [owner, repo, '--workflow', 'execute']);
          await this.executeBunScript('repo:monitor-progress', [owner, repo]);
          break;
        default:
          throw new Error(`Unknown workflow: ${workflow}`);
      }
      console.log('✅ Repository operation completed');
    } catch (error) {
      console.error('❌ Repository operation failed:', error.message);
    }
  }

  /**
   * Update context fossil with repository information
   * @param context - Context data to update
   */
  private async updateContextFossil(context: Record<string, unknown>): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const fossilPath = '.context-fossil.json';

      // Read existing fossil or create new one
      let fossilData: Record<string, unknown> = {};
      try {
        const existingData = await fs.readFile(fossilPath, 'utf8');
        fossilData = JSON.parse(existingData);
      } catch {
        // File doesn't exist, start with empty object
      }

      // Update with new context
      fossilData = {
        ...fossilData,
        ...context,
        lastUpdated: new Date().toISOString()
      };

      // Write back to fossil file
      await fs.writeFile(fossilPath, JSON.stringify(fossilData, null, 2));
      console.log(`🗿 Updated context fossil with repository info`);
    } catch (error) {
      console.warn('⚠️  Could not update context fossil:', error.message);
    }
  }

  async handleContextCommand(action: string): Promise<void> {
    console.log(`🗿 Context Fossil: ${action}`);

    try {
      await this.executeBunScript(`context:${action}`);
      console.log('✅ Context operation completed');
    } catch (error) {
      console.error('❌ Context operation failed:', error.message);
    }
  }

  async handleLLMCommand(action: string): Promise<void> {
    console.log(`🤖 LLM: ${action}`);

    try {
      await this.executeBunScript(`llm:${action}`);
      console.log('✅ LLM operation completed');
    } catch (error) {
      console.error('❌ LLM operation failed:', error.message);
    }
  }

  async handleWorkflowCommand(type: string): Promise<void> {
    console.log(`🔄 Workflow: ${type}`);

    try {
      await this.executeBunScript(`workflow:${type}`);
      console.log('✅ Workflow completed');
    } catch (error) {
      console.error('❌ Workflow failed:', error.message);
    }
  }

  async handleIssuesCommand(action: string): Promise<void> {
    console.log(`📋 Issues: ${action}`);

    const issuesScriptMap: Record<string, string> = {
      list: 'issues:list',
      json: 'issues:json',
      ci: 'issues:ci',
      quality: 'issues:quality',
      testing: 'issues:testing',
      manager: 'issues:manager',
      'milestone:implementation': 'issues:milestone:implementation',
      'milestone:research': 'issues:milestone:research',
      check: 'issues:check',
      'ensure-demo': 'issues:ensure-demo',
      fossilize: 'issues:fossilize',
    };

    if (action === 'create') {
      await runIssuesCreate({
        purpose: options.purpose,
        checklist: options.checklist,
        metadata: options.metadata,
        debug: options.debug,
      });
    } else if (issuesScriptMap[action]) {
      const { execSync } = await import('child_process');
      try {
        const output = execSync(`bun run ${issuesScriptMap[action]}`, { encoding: 'utf8' });
        console.log(output);
      } catch (error) {
        console.error(`❌ Failed to fetch issues (${action}):`, error.message);
      }
    } else {
      await this.executeBunScript(`issues:${action}`);
    }
  }

  async handleProjectsCommand(action: string): Promise<void> {
    console.log(`📊 Projects: ${action}`);

    try {
      await this.executeBunScript(`projects:${action}`);
      console.log('✅ Projects operation completed');
    } catch (error) {
      console.error('❌ Projects operation failed:', error.message);
    }
  }

  async handleQACommand(action: string): Promise<void> {
    console.log(`🧪 QA: ${action}`);

    try {
      await this.executeBunScript(`qa:${action}`);
      console.log('✅ QA operation completed');
    } catch (error) {
      console.error('❌ QA operation failed:', error.message);
    }
  }

  async handleDevCommand(action: string): Promise<void> {
    console.log(`🔧 Dev: ${action}`);

    try {
      await this.executeBunScript(action);
      console.log('✅ Dev operation completed');
    } catch (error) {
      console.error('❌ Dev operation failed:', error.message);
    }
  }

  async handleMigrationCommand(action: string): Promise<void> {
    console.log(`🔄 Migration: ${action}`);

    try {
      await this.executeBunScript(`migrate:${action}`);
      console.log('✅ Migration completed');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
    }
  }

  async handleTestCommand(type: string): Promise<void> {
    console.log(`🧪 Test: ${type}`);

    try {
      await this.executeBunScript(`test:${type}`);
      console.log('✅ Testing completed');
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
    }
  }

  listCommands(): void {
    console.log('📋 Available MCP CLI Commands:\n');

    if (this.packageJson?.scripts) {
      const categories = {
        'Repository': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('repo:')),
        'Context': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('context:')),
        'LLM': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('llm:')),
        'Issues': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('issues:')),
        'Projects': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('projects:')),
        'Workflow': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('workflow:')),
        'QA': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('qa:')),
        'Dev': Object.keys(this.packageJson.scripts).filter(s => !s.includes(':')),
        'Migration': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('migrate:')),
        'Test': Object.keys(this.packageJson.scripts).filter(s => s.startsWith('test:')),
      };

      Object.entries(categories).forEach(([category, commands]) => {
        if (commands.length > 0) {
          console.log(`\n${category}:`);
          commands.forEach(cmd => {
            console.log(`  ${cmd}`);
          });
        }
      });
    }
  }

  async showStatus(): Promise<void> {
    console.log('📊 MCP CLI System Status:\n');

    try {
      // Check if key scripts exist
      const scripts = [
        'scripts/automation/repo-orchestrator.sh',
        'scripts/automation/monitor-progress.sh',
        'scripts/automation/llm-workflow.sh',
        'src/cli/repo-orchestrator.ts',
        'src/cli/llm-plan.ts'
      ];

      console.log('Scripts Status:');
      scripts.forEach(script => {
        const exists = existsSync(join(this.projectRoot, script));
        console.log(`  ${exists ? '✅' : '❌'} ${script}`);
      });

      // Check GitHub CLI
      try {
        execSync('gh --version', { stdio: 'pipe' });
        console.log('  ✅ GitHub CLI available');
      } catch {
        console.log('  ❌ GitHub CLI not available');
      }

      // Check Bun
      try {
        execSync('bun --version', { stdio: 'pipe' });
        console.log('  ✅ Bun runtime available');
      } catch {
        console.log('  ❌ Bun runtime not available');
      }

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
    }
  }
}

async function main() {
  const program = new Command();
  const mcpService = new MCPCLIService();

  program
    .name('mcp')
    .description('Modal Context Protocol CLI - Unified automation workload interface')
    .version('1.0.0');

  // Repository orchestration commands
  program
    .command('repo')
    .description('Repository orchestration and automation')
    .argument('<owner>', 'Repository owner')
    .argument('<repo>', 'Repository name')
    .option('-w, --workflow <type>', 'Workflow type: analyze, plan, execute, monitor, full', 'full')
    .action(async (owner, repo, options) => {
      await mcpService.handleRepoCommand(owner, repo, options.workflow);
    });

  // Context fossil storage commands
  program
    .command('context')
    .description('Context fossil storage operations')
    .argument('<action>', 'Action: add, get, query, update, backup, export, init, stats, summary')
    .action(async (action) => {
      await mcpService.handleContextCommand(action);
    });

  // LLM commands
  program
    .command('llm')
    .description('LLM-powered operations')
    .argument('<action>', 'Action: plan, analyze, execute, monitor')
    .action(async (action) => {
      await mcpService.handleLLMCommand(action);
    });

  // Workflow commands
  program
    .command('workflow')
    .description('Workflow automation')
    .argument('<type>', 'Workflow type: qa, review, content, issues, automate, sync')
    .action(async (type) => {
      await mcpService.handleWorkflowCommand(type);
    });

  // Issues commands
  program
    .command('issues')
    .description('GitHub issues management')
    .argument('<action>', 'Action: list, ci, quality, testing, manager, ensure-demo, create, json')
    .option('--purpose <purpose>', 'Purpose of the automation issue')
    .option('--checklist <checklist>', 'Checklist for the automation issue (markdown)')
    .option('--metadata <metadata>', 'Metadata for the automation issue')
    .option('--debug', 'Enable debug output')
    .action(async (action, options) => {
      await mcpService.handleIssuesCommand(action);
    });

  // Projects commands
  program
    .command('projects')
    .description('GitHub projects integration')
    .argument('<action>', 'Action: integration, report, setup, sync')
    .action(async (action) => {
      await mcpService.handleProjectsCommand(action);
    });

  // QA commands
  program
    .command('qa')
    .description('QA and testing workflows')
    .argument('<action>', 'Action: test, review, workflow')
    .action(async (action) => {
      await mcpService.handleQACommand(action);
    });

  // Dev commands
  program
    .command('dev')
    .description('Development operations')
    .argument('<action>', 'Action: build, start, setup, test, format, lint, type-check')
    .action(async (action) => {
      await mcpService.handleDevCommand(action);
    });

  // Migration commands
  program
    .command('migrate')
    .description('Migration operations')
    .argument('<action>', 'Action: up, down, status, list')
    .action(async (action) => {
      await mcpService.handleMigrationCommand(action);
    });

  // Test commands
  program
    .command('test')
    .description('Testing operations')
    .argument('<type>', 'Test type: unit, integration, audit')
    .action(async (type) => {
      await mcpService.handleTestCommand(type);
    });

  // Utility commands
  program
    .command('list')
    .description('List all available commands')
    .action(() => {
      mcpService.listCommands();
    });

  program
    .command('status')
    .description('Show system status')
    .action(async () => {
      await mcpService.showStatus();
    });

  // Parse command line arguments
  await program.parseAsync();
}

// Run the CLI
if (import.meta.main) {
  main().catch(console.error);
}

export { MCPCLIService };
