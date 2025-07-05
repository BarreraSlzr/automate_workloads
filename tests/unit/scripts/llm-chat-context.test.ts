import { test, expect } from "bun:test";
import { ScriptTester } from "../../base-tester.ts";

const tester = new ScriptTester("./scripts/llm-chat-context.ts", "LLM Chat Context Script Test");

test("llm-chat-context.ts is executable", async () => {
  await tester.isExecutable();
});

test("llm-chat-context.ts generates context file", async () => {
  await tester.realMode({
    args: [],
    expectedOutput: [
      "🔍 Generating LLM chat context",
      "📝 Running TypeScript type check",
      "🧪 Running test suite",
      "📊 Gathering project information...",
      "🗿 Analyzing fossils",
      "🔍 Analyzing git changes",
      "📋 LLM Chat Context Summary",
      "Context saved to: fossils/chat_context.json",
      "🚀 Ready for LLM chat"
    ],
    expectedExitCode: 0,
    timeoutMs: 60000,
    normalize: output => output.trim(),
  });
  
  // Verify the context file was created
  const fs = await import('fs/promises');
  const contextFile = 'fossils/chat_context.json';
  
  try {
    const content = await fs.readFile(contextFile, 'utf-8');
    const context = JSON.parse(content);
    
    // Verify required fields
    expect(context).toHaveProperty('timestamp');
    expect(context).toHaveProperty('validation');
    expect(context).toHaveProperty('project');
    expect(context).toHaveProperty('fossils');
    expect(context).toHaveProperty('environment');
    expect(context).toHaveProperty('recommendations');
    
    // Verify validation structure
    expect(context.validation).toHaveProperty('typescript');
    expect(context.validation).toHaveProperty('tests');
    expect(context.validation.typescript).toHaveProperty('status');
    expect(context.validation.typescript).toHaveProperty('duration');
    expect(context.validation.tests).toHaveProperty('status');
    expect(context.validation.tests).toHaveProperty('total');
    expect(context.validation.tests).toHaveProperty('passed');
    expect(context.validation.tests).toHaveProperty('failed');
    expect(context.validation.tests).toHaveProperty('skipped');
    expect(context.validation.tests).toHaveProperty('duration');
    
    // Verify project structure
    expect(context.project).toHaveProperty('name');
    expect(context.project).toHaveProperty('description');
    expect(context.project).toHaveProperty('lastCommit');
    expect(context.project).toHaveProperty('recentChanges');
    expect(context.project).toHaveProperty('openIssues');
    expect(context.project).toHaveProperty('pendingTasks');
    
    // Verify fossils structure
    expect(context.fossils).toHaveProperty('roadmap');
    expect(context.fossils).toHaveProperty('projectStatus');
    expect(context.fossils).toHaveProperty('insights');
    
    // Verify environment structure
    expect(context.environment).toHaveProperty('nodeVersion');
    expect(context.environment).toHaveProperty('bunVersion');
    expect(context.environment).toHaveProperty('platform');
    expect(context.environment).toHaveProperty('architecture');
    expect(context.environment).toHaveProperty('workingDirectory');
    
    // Verify recommendations is an array
    expect(Array.isArray(context.recommendations)).toBe(true);
    
  } catch (error) {
    throw new Error(`Context file validation failed: ${error}`);
  }
}); 