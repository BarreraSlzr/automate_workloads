#!/usr/bin/env bun
/**
 * Demo script showcasing checklist updater functionality
 * Creates sample files and demonstrates updates
 */

import { 
  updateChecklistFile, 
  updateMultipleChecklistFiles,
  generateUpdateReport,
  ChecklistItemUpdate 
} from '../src/utils/checklistUpdater';
import * as fs from 'fs';
import * as path from 'path';

// Sample markdown checklist
const sampleMarkdown = `# Project Tasks

## Development
- [ ] Set up development environment
- [ ] Write unit tests
- [ ] Implement core features
- [ ] Add documentation

## Testing
- [ ] Run integration tests
- [ ] Perform code review
- [ ] Test in staging environment

## Deployment
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Update documentation
`;

// Sample JSON checklist
const sampleJson = {
  "type": "project_checklist",
  "title": "Feature Implementation",
  "checklist": [
    {
      "task": "Design API endpoints",
      "checked": false,
      "priority": "high"
    },
    {
      "task": "Implement database schema",
      "checked": true,
      "priority": "high"
    },
    {
      "task": "Write API documentation",
      "checked": false,
      "priority": "medium"
    },
    {
      "task": "Add error handling",
      "checked": false,
      "priority": "high"
    }
  ]
};

// Sample YAML roadmap
const sampleYaml = `type: project_roadmap
title: Q1 2024 Goals
tasks:
  - task: Improve test coverage
    status: pending
    owner: team
    context: Target 90% coverage across all modules
    deadline: 2024-03-31
    subtasks:
      - task: Add unit tests for core modules
        status: done
        context: Core modules now have 95% coverage
      - task: Add integration tests
        status: partial
        context: Basic integration tests added, need more edge cases
      - task: Add E2E tests
        status: pending
        context: Framework selected, implementation pending
  - task: Refactor legacy code
    status: ready
    owner: senior-dev
    context: Modernize codebase and improve maintainability
    deadline: 2024-04-15
  - task: Update documentation
    status: partial
    owner: tech-writer
    context: Keep docs in sync with code changes
    deadline: 2024-04-30
`;

async function createSampleFiles() {
  console.log('📁 Creating sample files...');
  
  // Create sample markdown
  fs.writeFileSync('sample-checklist.md', sampleMarkdown);
  console.log('✅ Created sample-checklist.md');
  
  // Create sample JSON
  fs.writeFileSync('sample-checklist.json', JSON.stringify(sampleJson, null, 2));
  console.log('✅ Created sample-checklist.json');
  
  // Create sample YAML
  fs.writeFileSync('sample-roadmap.yaml', sampleYaml);
  console.log('✅ Created sample-roadmap.yaml');
}

async function demoMarkdownUpdate() {
  console.log('\n📝 Demo: Updating Markdown Checklist');
  console.log('=====================================');
  
  const updates: ChecklistItemUpdate[] = [
    { id: 'Set up development environment', status: true },
    { id: 'Write unit tests', status: true, comment: 'Completed with 95% coverage' },
    { id: 'Run integration tests', status: true }
  ];
  
  const result = updateChecklistFile('sample-checklist.md', updates);
  
  if (result.success) {
    console.log(`✅ Updated ${result.updatedCount} items`);
    console.log('📄 Updated content preview:');
    console.log(result.content?.split('\n').slice(0, 15).join('\n'));
    console.log('...');
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
}

async function demoJsonUpdate() {
  console.log('\n📝 Demo: Updating JSON Checklist');
  console.log('=================================');
  
  const updates: ChecklistItemUpdate[] = [
    { id: 'Design API endpoints', status: true, comment: 'RESTful API designed and documented' },
    { id: 'Write API documentation', status: true },
    { id: 'Add error handling', status: 'partial' as any }
  ];
  
  const result = updateChecklistFile('sample-checklist.json', updates);
  
  if (result.success) {
    console.log(`✅ Updated ${result.updatedCount} items`);
    console.log('📄 Updated content preview:');
    const data = JSON.parse(result.content || '{}');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
}

async function demoYamlUpdate() {
  console.log('\n📝 Demo: Updating YAML Roadmap');
  console.log('===============================');
  
  const updates: ChecklistItemUpdate[] = [
    { 
      id: 'Add unit tests for core modules', 
      status: 'done', 
      comment: 'All core modules now have comprehensive test coverage' 
    },
    { 
      id: 'Add integration tests', 
      status: 'done', 
      comment: 'Integration test suite completed with edge case coverage' 
    },
    { 
      id: 'Refactor legacy code', 
      status: 'partial', 
      comment: 'Started refactoring, 60% complete' 
    }
  ];
  
  const result = updateChecklistFile('sample-roadmap.yaml', updates);
  
  if (result.success) {
    console.log(`✅ Updated ${result.updatedCount} items`);
    console.log('📄 Updated content preview:');
    console.log(result.content?.split('\n').slice(0, 20).join('\n'));
    console.log('...');
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
}

async function demoBatchUpdate() {
  console.log('\n📝 Demo: Batch Update Multiple Files');
  console.log('====================================');
  
  const batchUpdates = [
    {
      path: 'sample-checklist.md',
      updates: [
        { id: 'Deploy to production', status: true, comment: 'Successfully deployed v2.1.0' }
      ]
    },
    {
      path: 'sample-checklist.json',
      updates: [
        { id: 'Add error handling', status: true, comment: 'Comprehensive error handling implemented' }
      ]
    },
    {
      path: 'sample-roadmap.yaml',
      updates: [
        { id: 'Update documentation', status: 'done' as any, comment: 'All documentation updated and reviewed' }
      ]
    }
  ];
  
  const results = updateMultipleChecklistFiles(batchUpdates);
  const report = generateUpdateReport(results);
  
  console.log(report);
}

async function demoErrorHandling() {
  console.log('\n📝 Demo: Error Handling');
  console.log('=======================');
  
  // Try to update non-existent file
  const result = updateChecklistFile('non-existent-file.md', [
    { id: 'Some task', status: true }
  ]);
  
  console.log('❌ Expected error for non-existent file:');
  console.log(`   ${result.error}`);
  
  // Try to update with non-existent task
  const result2 = updateChecklistFile('sample-checklist.md', [
    { id: 'Non-existent task', status: true }
  ]);
  
  console.log('\n⚠️  Update with non-existent task:');
  console.log(`   Updated: ${result2.updatedCount}, Not found: ${result2.notFoundCount}`);
}

async function cleanup() {
  console.log('\n🧹 Cleaning up sample files...');
  
  const files = [
    'sample-checklist.md',
    'sample-checklist.json', 
    'sample-roadmap.yaml'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🗑️  Deleted ${file}`);
    }
  });
  
  // Clean up backup files
  const backupFiles = fs.readdirSync('.').filter(f => f.includes('.backup.'));
  backupFiles.forEach(file => {
    fs.unlinkSync(file);
    console.log(`🗑️  Deleted backup ${file}`);
  });
}

async function main() {
  console.log('🚀 Checklist Updater Demo');
  console.log('==========================');
  
  try {
    await createSampleFiles();
    await demoMarkdownUpdate();
    await demoJsonUpdate();
    await demoYamlUpdate();
    await demoBatchUpdate();
    await demoErrorHandling();
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\n💡 Try running the CLI commands:');
    console.log('   bun src/cli/update-checklist.ts file sample-checklist.md --updates \'{"Set up development environment": true}\'');
    console.log('   bun src/cli/update-checklist.ts roadmap sample-roadmap.yaml --task "Improve test coverage" --status done');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await cleanup();
  }
}

if (require.main === module) {
  main();
} 