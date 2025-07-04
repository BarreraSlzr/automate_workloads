import { parseDocument, isMap } from 'yaml';
import { describe, it, expect } from 'bun:test';

describe('llmInsights merge preserves context newlines and comments', () => {
  it('should preserve comments and context block formatting when merging llmInsights', () => {
    const yamlTemplate = `
# Task List
---
tasks:
  - task: Example Task
    status: done
    # This is a context comment
    context: |
      Line 1

      Line 2
      
      Line 3
`;
    const jsonData = {
      tasks: [
        {
          task: 'Example Task',
          status: 'done',
          llmInsights: {
            summary: 'Test summary',
            blockers: 'None',
            recommendations: 'Test rec',
            impact: 'Test impact',
            deadline: '',
            done: {
              retrospective: 'Test retro',
              insights: 'Test insights',
              completedAt: '2024-07-05T00:00:00Z',
            },
          },
        },
      ],
    };
    // Parse YAML with comments
    const doc = parseDocument(yamlTemplate);
    const tasks = doc.get('tasks') as any;
    if (Array.isArray(jsonData.tasks) && tasks && tasks.items) {
      for (let i = 0; i < tasks.items.length; i++) {
        const yamlTask = tasks.items[i];
        const jsonTask = jsonData.tasks[i];
        if (yamlTask && jsonTask && jsonTask.llmInsights) {
          yamlTask.set('llmInsights', jsonTask.llmInsights);
        }
      }
    }
    const output = doc.toString();
    // Check comments are preserved
    expect(output).toContain('# This is a context comment');
    // Check context block formatting and newlines are preserved
    expect(output).toContain('context: |');
    expect(output).toContain('Line 1');
    expect(output).toContain('Line 2');
    expect(output).toContain('Line 3');
    // Check llmInsights is present
    expect(output).toContain('llmInsights:');
    expect(output).toContain('Test summary');
  });

  it('should preserve a multi-line checklist context (✅ COMPLETED) as multiple lines', () => {
    const yamlTemplate = `
# Checklist Example
---
tasks:
  - task: Checklist Task
    status: done
    # Checklist context
    context: |
      ✅ COMPLETED: Task 1 
      ✅ COMPLETED: Task 2 
      ✅ COMPLETED: Task 3
`;
    const jsonData = {
      tasks: [
        {
          task: 'Checklist Task',
          status: 'done',
          llmInsights: {
            summary: 'Checklist summary',
            blockers: 'None',
            recommendations: 'Checklist rec',
            impact: 'Checklist impact',
            deadline: '',
            done: {
              retrospective: 'Checklist retro',
              insights: 'Checklist insights',
              completedAt: '2024-07-05T00:00:00Z',
            },
          },
        },
      ],
    };
    const doc = parseDocument(yamlTemplate);
    const tasks = doc.get('tasks') as any;
    if (Array.isArray(jsonData.tasks) && tasks && tasks.items) {
      for (let i = 0; i < tasks.items.length; i++) {
        const yamlTask = tasks.items[i];
        const jsonTask = jsonData.tasks[i];
        if (yamlTask && jsonTask && jsonTask.llmInsights) {
          yamlTask.set('llmInsights', jsonTask.llmInsights);
        }
      }
    }
    const output = doc.toString();
    // Check comments are preserved
    expect(output).toContain('# Checklist context');
    // Check context block is block literal
    expect(output).toContain('context: |');
    // Check each checklist line is present as a separate line
    expect(output).toContain('✅ COMPLETED: Task 1');
    expect(output).toContain('✅ COMPLETED: Task 2');
    expect(output).toContain('✅ COMPLETED: Task 3');
    // Optionally, check that all three lines appear in order
    const contextBlock = output.split('context: |')[1]?.split('llmInsights:')[0] ?? '';
    const lines = contextBlock.trim().split('\n').map(l => l.trim()).filter(Boolean);
    expect(lines).toContain('✅ COMPLETED: Task 1');
    expect(lines).toContain('✅ COMPLETED: Task 2');
    expect(lines).toContain('✅ COMPLETED: Task 3');
    // Check llmInsights is present
    expect(output).toContain('llmInsights:');
    expect(output).toContain('Checklist summary');
  });
}); 