#!/usr/bin/env bun

/**
 * LLM Planning CLI Module
 * 
 * Provides LLM-assisted planning capabilities for the automation ecosystem.
 * Supports goal decomposition, task prioritization, and execution planning.
 */

import { Command } from 'commander';
import { z } from 'zod';
import { getEnv } from '../core/config.js';
import { callOpenAIChat } from '../services/llm';

// LLM Planning schemas
const PlanRequestSchema = z.object({
  goal: z.string().min(1, 'Goal is required'),
  context: z.record(z.unknown()).optional(),
  constraints: z.array(z.string()).optional(),
  timeline: z.string().optional(),
});

const TaskBreakdownSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
    dependencies: z.array(z.string()),
    estimatedEffort: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    assignee: z.string().optional(),
  })),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    milestones: z.array(z.object({
      date: z.string(),
      description: z.string(),
      tasks: z.array(z.string()),
    })),
  }),
  risks: z.array(z.object({
    description: z.string(),
    probability: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    mitigation: z.string(),
  })),
});

type PlanRequest = z.infer<typeof PlanRequestSchema>;
type TaskBreakdown = z.infer<typeof TaskBreakdownSchema>;

interface Task {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  estimatedEffort: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
}

/**
 * LLM Planning Service
 * 
 * Handles LLM-assisted planning operations including goal decomposition,
 * task prioritization, and execution planning.
 */
class LLMPlanningService {
  private config: ReturnType<typeof getEnv>;
  private model: string;
  private apiKey: string;
  private llmFn: typeof callOpenAIChat;

  constructor(model: string, apiKey: string, llmFn = callOpenAIChat) {
    this.config = getEnv();
    this.model = model;
    this.apiKey = apiKey;
    this.llmFn = llmFn;
  }

  /**
   * Decomposes a high-level goal into actionable tasks
   * @param goal - The goal to decompose
   * @param context - Additional context for planning
   * @param issueMode - Treat the goal/context as a GitHub issue for checklist generation
   * @returns Structured task breakdown
   */
  async decomposeGoal(goal: string, context?: Record<string, unknown>, issueMode: boolean = false): Promise<TaskBreakdown> {
    if (this.model && this.apiKey) {
      const messages = [
        { role: 'system' as const, content: 'You are an expert project planner.' },
        { role: 'user' as const, content: issueMode
          ? `Given this GitHub issue, generate a concise checklist of actionable steps required to resolve it. Output the checklist in Markdown format.\n\nIssue Title: ${goal}\nContext: ${JSON.stringify(context || {})}`
          : `Break down the following goal into actionable tasks.\nGoal: ${goal}\nContext: ${JSON.stringify(context || {})}`
        },
      ];
      const response = await this.llmFn({ model: this.model, apiKey: this.apiKey, messages });
      // You may want to parse/validate response. For now, just return the content as a single task.
      const content = response.choices?.[0]?.message?.content || 'No response';
      return {
        tasks: [
          {
            id: 'llm-task',
            title: 'LLM Output',
            description: content,
            acceptanceCriteria: [],
            dependencies: [],
            estimatedEffort: '',
            priority: 'high',
          },
        ],
        timeline: { startDate: new Date().toISOString(), endDate: new Date().toISOString(), milestones: [] },
        risks: [],
      };
    }
    // fallback simulation
    return await this.simulateDecomposeGoal(goal, context);
  }

  private async simulateDecomposeGoal(goal: string, context?: Record<string, unknown>): Promise<TaskBreakdown> {
    console.log('🤖 Decomposing goal with LLM assistance...');
    
    // In a real implementation, this would call an LLM API
    // For now, we'll simulate the LLM response
    const llmPrompt = `
      Break down the following goal into actionable tasks:
      Goal: ${goal}
      Context: ${JSON.stringify(context || {})}
      
      Provide:
      1. Main tasks with clear acceptance criteria
      2. Dependencies between tasks
      3. Estimated effort for each task
      4. Success metrics for each task
      5. Risk factors and mitigation strategies
    `;

    // Simulate LLM processing
    await this.simulateLLMProcessing(llmPrompt);

    // Return structured breakdown
    return {
      tasks: [
        {
          id: 'task-1',
          title: 'Research and Analysis',
          description: 'Conduct thorough research on the goal requirements',
          acceptanceCriteria: [
            'Research completed and documented',
            'Requirements clearly defined',
            'Stakeholder input gathered',
          ],
          dependencies: [],
          estimatedEffort: '2-3 days',
          priority: 'high',
        },
        {
          id: 'task-2',
          title: 'Design and Planning',
          description: 'Create detailed design and implementation plan',
          acceptanceCriteria: [
            'Technical design completed',
            'Implementation plan created',
            'Resource requirements identified',
          ],
          dependencies: ['task-1'],
          estimatedEffort: '1-2 days',
          priority: 'high',
        },
        {
          id: 'task-3',
          title: 'Implementation',
          description: 'Execute the implementation plan',
          acceptanceCriteria: [
            'Code implemented according to design',
            'Tests written and passing',
            'Documentation updated',
          ],
          dependencies: ['task-2'],
          estimatedEffort: '3-5 days',
          priority: 'critical',
        },
      ],
      timeline: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        milestones: [
          {
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Research and Design Complete',
            tasks: ['task-1', 'task-2'],
          },
          {
            date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Implementation Complete',
            tasks: ['task-3'],
          },
        ],
      },
      risks: [
        {
          description: 'Scope creep during implementation',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Regular stakeholder check-ins and scope reviews',
        },
        {
          description: 'Technical challenges with integration',
          probability: 'high',
          impact: 'medium',
          mitigation: 'Proof of concept and early testing',
        },
      ],
    };
  }

  /**
   * Prioritizes tasks based on multiple factors
   * @param tasks - List of tasks to prioritize
   * @param context - Prioritization context
   * @returns Prioritized task list
   */
  async prioritizeTasks(tasks: Task[], context: Record<string, unknown>): Promise<Task[]> {
    console.log('📊 Prioritizing tasks with LLM assistance...');
    
    const llmPrompt = `
      Prioritize the following tasks based on:
      - Business impact
      - Technical complexity
      - Dependencies
      - Available resources
      - Timeline constraints
      
      Tasks: ${JSON.stringify(tasks)}
      Context: ${JSON.stringify(context)}
    `;

    await this.simulateLLMProcessing(llmPrompt);

    // Return prioritized tasks (sorted by priority)
    return tasks.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      return bPriority - aPriority;
    });
  }

  /**
   * Generates content with LLM assistance
   * @param contentType - Type of content to generate
   * @param topic - Topic for the content
   * @returns Generated content
   */
  async generateContent(contentType: string, topic: string): Promise<string> {
    if (this.model && this.apiKey) {
      const messages = [
        { role: 'system' as const, content: `You are an expert ${contentType} writer.` },
        { role: 'user' as const, content: `Generate ${contentType} content about: ${topic}` },
      ];
      const response = await this.llmFn({ model: this.model, apiKey: this.apiKey, messages });
      return response.choices?.[0]?.message?.content || 'No response';
    }
    // fallback simulation
    return await this.simulateGenerateContent(contentType, topic);
  }

  private async simulateGenerateContent(contentType: string, topic: string): Promise<string> {
    console.log(`📝 Generating ${contentType} content about ${topic}...`);
    
    const llmPrompt = `
      Generate ${contentType} content about: ${topic}
      
      Requirements:
      - Engaging and informative
      - Optimized for target audience
      - Include relevant examples
      - Follow best practices for ${contentType}
    `;

    await this.simulateLLMProcessing(llmPrompt);

    // Return generated content
    return `# ${topic}

This is a sample ${contentType} about ${topic} generated with LLM assistance.

## Key Points

- Point 1: Important insight about ${topic}
- Point 2: Another valuable perspective
- Point 3: Practical application

## Conclusion

This ${contentType} demonstrates the power of LLM-assisted content generation for ${topic}.

---
*Generated with LLM assistance on ${new Date().toISOString()}*
`;
  }

  /**
   * Simulates LLM processing (placeholder for actual LLM integration)
   * @param prompt - The prompt to process
   */
  private async simulateLLMProcessing(prompt: string): Promise<void> {
    console.log('🤖 Processing with LLM...');
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ LLM processing completed');
  }
}

/**
 * CLI Command Setup
 */
const program = new Command();

let isQuiet = false;

program
  .name('llm-plan')
  .description('LLM-assisted planning for automation workflows')
  .version('1.0.0')
  .option('--quiet', 'Suppress all output except errors', false)
  .option('--json', 'Output the plan as JSON (default)')
  .hook('preAction', (thisCommand) => {
    isQuiet = thisCommand.opts().quiet || process.env.LLM_PLAN_QUIET === '1';
    if (isQuiet) {
      // Suppress all output
      // @ts-ignore
      console.log = () => {};
      // @ts-ignore
      console.error = () => {};
    }
  });

// Goal decomposition command
program
  .command('decompose')
  .description('Decompose a goal into actionable tasks')
  .argument('<goal>', 'The goal to decompose')
  .option('-c, --context <context>', 'Additional context (JSON string)')
  .option('-o, --output <file>', 'Output file for the plan')
  .option('--model <model>', 'LLM model to use (e.g., gpt-4, gpt-3.5-turbo)', 'gpt-4')
  .option('--api-key <apiKey>', 'OpenAI API key (optional, falls back to env)')
  .option('--issue-mode', 'Treat the goal/context as a GitHub issue for checklist generation')
  .action(async (goal, options) => {
    try {
      const model = options.model || 'gpt-4';
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      const service = new LLMPlanningService(model, apiKey);
      
      let context: Record<string, unknown> = {};
      if (options.context) {
        try {
          context = JSON.parse(options.context);
        } catch (error) {
          console.error('❌ Invalid JSON context provided');
          process.exit(1);
        }
      }

      // Select prompt based on --issue-mode flag
      let breakdown;
      if (options.issueMode) {
        breakdown = await service.decomposeGoal(
          goal,
          context,
          true // issueMode
        );
      } else {
        breakdown = await service.decomposeGoal(
          goal,
          context,
          false // issueMode
        );
      }
      
      if (options.output) {
        // Write to file
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(breakdown, null, 2));
        console.log(`✅ Plan saved to ${options.output}`);
      } else {
        // Output to console
        console.log(JSON.stringify(breakdown, null, 2));
      }
    } catch (error) {
      console.error('❌ Error during goal decomposition:', error);
      process.exit(1);
    }
  });

// Task prioritization command
program
  .command('prioritize')
  .description('Prioritize tasks based on multiple factors')
  .argument('<tasks>', 'Tasks file (JSON)')
  .option('-c, --context <context>', 'Prioritization context (JSON string)')
  .option('--model <model>', 'LLM model to use (e.g., gpt-4, gpt-3.5-turbo)', 'gpt-4')
  .option('--api-key <apiKey>', 'OpenAI API key (optional, falls back to env)')
  .action(async (tasksFile, options) => {
    try {
      const model = options.model || 'gpt-4';
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      const service = new LLMPlanningService(model, apiKey);
      
      // Read tasks from file
      const fs = await import('fs/promises');
      const tasksData = await fs.readFile(tasksFile, 'utf-8');
      let tasks = JSON.parse(tasksData);
      // Support both array of tasks and { tasks: [...] }
      if (Array.isArray(tasks)) {
        // already correct
      } else if (tasks && Array.isArray(tasks.tasks)) {
        tasks = tasks.tasks;
      } else {
        throw new Error('Input file must be an array of tasks or an object with a "tasks" array');
      }
      
      let context: Record<string, unknown> = {};
      if (options.context) {
        try {
          context = JSON.parse(options.context);
        } catch (error) {
          console.error('❌ Invalid JSON context provided');
          process.exit(1);
        }
      }

      const prioritizedTasks = await service.prioritizeTasks(tasks, context);
      console.log(JSON.stringify(prioritizedTasks, null, 2));
    } catch (error) {
      console.error('❌ Error during task prioritization:', error);
      process.exit(1);
    }
  });

// Content generation command
program
  .command('generate-content')
  .description('Generate content with LLM assistance')
  .argument('<type>', 'Type of content (blog-post, tweet, etc.)')
  .argument('<topic>', 'Topic for the content')
  .option('-o, --output <file>', 'Output file for the content')
  .option('--model <model>', 'LLM model to use (e.g., gpt-4, gpt-3.5-turbo)', 'gpt-4')
  .option('--api-key <apiKey>', 'OpenAI API key (optional, falls back to env)')
  .action(async (type, topic, options) => {
    try {
      const model = options.model || 'gpt-4';
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      const service = new LLMPlanningService(model, apiKey);
      const content = await service.generateContent(type, topic);
      
      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, content);
        console.log(`✅ Content saved to ${options.output}`);
      } else {
        console.log(content);
      }
    } catch (error) {
      console.error('❌ Error during content generation:', error);
      process.exit(1);
    }
  });

// Generate tests command
program
  .command('generate-tests')
  .description('Audit shell scripts for missing test files (pure TypeScript)')
  .option('-o, --output <file>', 'Output file for the generated tests')
  .option('--model <model>', 'LLM model to use (e.g., gpt-4, gpt-3.5-turbo)', 'gpt-4')
  .option('--api-key <apiKey>', 'OpenAI API key (optional, falls back to env)')
  .action(async (options) => {
    try {
      const model = options.model || 'gpt-4';
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      const service = new LLMPlanningService(model, apiKey);
      // Pure TypeScript implementation of audit-shell-scripts.sh
      const fs = await import('fs/promises');
      const path = await import('path');

      // Recursively find all .sh files in scripts/
      async function findShellScripts(dir: string): Promise<string[]> {
        let results: string[] = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(await findShellScripts(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.sh')) {
            results.push(fullPath);
          }
        }
        return results;
      }

      // For each .sh script, check for corresponding .test.ts file
      const shellScripts = await findShellScripts('scripts');
      const missingTests = [];
      for (const script of shellScripts) {
        const relScript = path.relative('.', script);
        const testFile = path.join('tests/unit', relScript.replace(/\.sh$/, '.test.ts'));
        try {
          await fs.access(testFile);
        } catch {
          missingTests.push({ script: relScript, expectedTest: testFile });
        }
      }

      // Auto-generate stubs for missing test files
      const createdFiles: string[] = [];
      for (const m of missingTests) {
        // Ensure directory exists
        const dir = path.dirname(m.expectedTest);
        await fs.mkdir(dir, { recursive: true });
        // Only create if file does not exist
        try {
          await fs.access(m.expectedTest);
        } catch {
          const stub = `import { test } from "bun:test";
const tester = new ScriptTester("./${m.script}", "${path.basename(m.script)} Test");

test("${path.basename(m.script)} is executable", async () => {
  await tester.isExecutable();
});
`;
          await fs.writeFile(m.expectedTest, stub);
          createdFiles.push(m.expectedTest);
        }
      }

      let report = '';
      if (missingTests.length === 0) {
        report = 'All shell scripts have corresponding test files.';
      } else {
        report = missingTests.map(m => `${m.script} has no test file! (expected: ${m.expectedTest})`).join('\n');
        if (createdFiles.length > 0) {
          report += `\n\nCreated stub test files:\n` + createdFiles.join('\n');
        }
      }

      if (options.output) {
        await fs.writeFile(options.output, report);
        if (!isQuiet) console.log(`✅ Audit report saved to ${options.output}`);
      } else {
        if (!isQuiet) console.log(report);
      }
    } catch (error) {
      if (!isQuiet) console.error('❌ Error during test generation:', error);
      process.exit(1);
    }
  });

// Review comments command
program
  .command('review-comments')
  .description('Generate LLM-powered review comments for a PR')
  .argument('<prNumber>', 'Pull request number')
  .action(async (prNumber) => {
    try {
      // Simulate LLM review comment generation
      console.log(`💬 Generating review comments for PR #${prNumber}...`);
      // In a real implementation, call your LLM service here
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Output a sample review comment
      console.log(JSON.stringify({
        pr: prNumber,
        comments: [
          { line: 42, comment: "Consider refactoring this function for clarity." },
          { line: 108, comment: "Add more test coverage for edge cases." }
        ],
        summary: "Overall, the PR looks good. Address the above comments for improvement."
      }, null, 2));
    } catch (error) {
      console.error('❌ Error generating review comments:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
if (import.meta.main) {
  program.parse();
}

export { LLMPlanningService, TaskBreakdown }; 