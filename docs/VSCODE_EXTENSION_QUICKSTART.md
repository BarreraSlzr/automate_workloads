# VS Code Extension Quick Start Guide

## 🚀 Launching Our First Market-Ready Innovation

This guide will help you build and launch the VS Code extension that brings our ML-powered orchestration to developers worldwide.

## 📋 Prerequisites

### Development Environment
```bash
# Install VS Code Extension Development Tools
npm install -g @vscode/vsce
npm install -g yo generator-code

# Install TypeScript and build tools
npm install -g typescript
npm install -g webpack webpack-cli
```

### Project Structure
```
vscode-extension/
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript config
├── webpack.config.js        # Webpack config
├── src/
│   ├── extension.ts         # Main entry point
│   ├── commands/            # VS Code commands
│   ├── ui/                  # UI components
│   ├── services/            # Backend services
│   └── utils/               # Utilities
├── resources/               # Icons, README, etc.
└── test/                    # Tests
```

## 🔧 Initial Setup

### 1. Create Extension Project
```bash
# Generate extension scaffold
yo code

# Choose options:
# - Extension name: "AI Project Orchestrator"
# - Identifier: "ai-project-orchestrator"
# - Description: "ML-powered project orchestration with canonical fossils"
# - Initialize git repository: Yes
# - Package manager: npm
```

### 2. Configure package.json
```json
{
  "name": "ai-project-orchestrator",
  "displayName": "AI Project Orchestrator",
  "description": "ML-powered project orchestration with canonical fossils",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other",
    "SCM Providers",
    "Machine Learning"
  ],
  "activationEvents": [
    "onCommand:ai-orchestrator.browseFossils",
    "onCommand:ai-orchestrator.createIssue",
    "onCommand:ai-orchestrator.createPR",
    "onCommand:ai-orchestrator.showInsights"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "ai-orchestrator.browseFossils",
        "title": "Browse Fossils",
        "category": "AI Orchestrator"
      },
      {
        "command": "ai-orchestrator.createIssue",
        "title": "Create GitHub Issue",
        "category": "AI Orchestrator"
      },
      {
        "command": "ai-orchestrator.createPR",
        "title": "Create Pull Request",
        "category": "AI Orchestrator"
      },
      {
        "command": "ai-orchestrator.showInsights",
        "title": "Show ML Insights",
        "category": "AI Orchestrator"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "ai-orchestrator",
          "title": "AI Orchestrator",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "ai-orchestrator": [
        {
          "id": "fossilExplorer",
          "name": "Fossils",
          "when": "workspaceHasFossils"
        },
        {
          "id": "orchestrationPanel",
          "name": "Orchestration",
          "when": "workspaceHasGit"
        },
        {
          "id": "insightsPanel",
          "name": "ML Insights",
          "when": "workspaceHasFossils"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "18.x",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🎯 Core Features Implementation

### 1. Fossil Browser Command
```typescript
// src/commands/fossilBrowser.ts
import * as vscode from 'vscode';
import { CanonicalFossilManager } from '../services/canonicalFossilManager';

export class FossilBrowserCommand {
  private fossilManager: CanonicalFossilManager;

  constructor() {
    this.fossilManager = new CanonicalFossilManager();
  }

  async execute() {
    try {
      // Get workspace root
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      // Load fossils
      const fossils = await this.fossilManager.loadFossils(workspaceRoot);
      
      // Show fossil picker
      const fossilTypes = [...new Set(fossils.map(f => f.type))];
      const selectedType = await vscode.window.showQuickPick(fossilTypes, {
        placeHolder: 'Select fossil type to browse'
      });

      if (!selectedType) return;

      // Filter fossils by type
      const typeFossils = fossils.filter(f => f.type === selectedType);
      
      // Show fossil list
      const fossilNames = typeFossils.map(f => `${f.title || f.id} (${f.createdAt})`);
      const selectedFossil = await vscode.window.showQuickPick(fossilNames, {
        placeHolder: 'Select fossil to view'
      });

      if (!selectedFossil) return;

      // Open fossil in new editor
      const fossilIndex = fossilNames.indexOf(selectedFossil);
      const fossil = typeFossils[fossilIndex];
      
      const document = await vscode.workspace.openTextDocument({
        content: JSON.stringify(fossil, null, 2),
        language: 'json'
      });
      
      await vscode.window.showTextDocument(document);

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to browse fossils: ${error}`);
    }
  }
}
```

### 2. GitHub Orchestration Commands
```typescript
// src/commands/orchestration.ts
import * as vscode from 'vscode';
import { GitHubService } from '../services/githubService';

export class OrchestrationCommands {
  private githubService: GitHubService;

  constructor() {
    this.githubService = new GitHubService();
  }

  async createIssue() {
    try {
      // Get issue title
      const title = await vscode.window.showInputBox({
        prompt: 'Enter issue title',
        placeHolder: 'Bug: Something is broken'
      });

      if (!title) return;

      // Get issue body from active editor
      const activeEditor = vscode.window.activeTextEditor;
      let body = '';
      
      if (activeEditor) {
        const selection = activeEditor.selection;
        if (!selection.isEmpty) {
          body = activeEditor.document.getText(selection);
        } else {
          body = activeEditor.document.getText();
        }
      }

      // Create issue
      const result = await this.githubService.createIssue(title, body);
      
      if (result.success) {
        vscode.window.showInformationMessage(
          `Issue created: #${result.data?.number}`
        );
      } else {
        vscode.window.showErrorMessage(
          `Failed to create issue: ${result.error}`
        );
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create issue: ${error}`);
    }
  }

  async createPR() {
    try {
      // Get PR title
      const title = await vscode.window.showInputBox({
        prompt: 'Enter pull request title',
        placeHolder: 'Feature: Add new functionality'
      });

      if (!title) return;

      // Get PR body
      const body = await vscode.window.showInputBox({
        prompt: 'Enter pull request description',
        placeHolder: 'Describe your changes...'
      });

      if (!body) return;

      // Create PR
      const result = await this.githubService.createPullRequest(title, body);
      
      if (result.success) {
        vscode.window.showInformationMessage(
          `Pull request created: #${result.data?.number}`
        );
      } else {
        vscode.window.showErrorMessage(
          `Failed to create PR: ${result.error}`
        );
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create PR: ${error}`);
    }
  }
}
```

### 3. ML Insights Panel
```typescript
// src/ui/insightsPanel.ts
import * as vscode from 'vscode';
import { LLMService } from '../services/llmService';

export class InsightsPanel {
  private panel: vscode.WebviewPanel | undefined;
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  async show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'aiInsights',
      'ML Insights',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Generate insights
    const insights = await this.generateInsights();
    
    // Set HTML content
    this.panel.webview.html = this.getWebviewContent(insights);

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async generateInsights() {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) return [];

      // Analyze project using LLM
      const analysis = await this.llmService.analyzeProject({
        projectPath: workspaceRoot,
        analysisType: 'insights',
        context: 'vscode-extension'
      });

      return analysis.insights || [];

    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }

  private getWebviewContent(insights: any[]) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ML Insights</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
            .insight { margin: 20px 0; padding: 15px; border-left: 4px solid #007acc; background: #f5f5f5; }
            .insight h3 { margin: 0 0 10px 0; color: #333; }
            .insight p { margin: 0; color: #666; }
            .confidence { font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>🤖 ML Insights</h1>
          ${insights.length === 0 ? '<p>No insights available. Run some orchestration first!</p>' : ''}
          ${insights.map(insight => `
            <div class="insight">
              <h3>${insight.title}</h3>
              <p>${insight.description}</p>
              <div class="confidence">Confidence: ${(insight.confidence * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }
}
```

## 🔗 Integration with Existing Codebase

### 1. Canonical Fossil Manager Integration
```typescript
// src/services/canonicalFossilManager.ts
import { CanonicalFossilManager as BaseManager } from '../../../src/utils/canonical-fossil-manager';
import * as path from 'path';

export class CanonicalFossilManager extends BaseManager {
  async loadFossils(workspaceRoot: string) {
    const fossilsPath = path.join(workspaceRoot, 'fossils');
    return await this.loadAllFossils(fossilsPath);
  }

  async getFossilById(id: string, workspaceRoot: string) {
    const fossilsPath = path.join(workspaceRoot, 'fossils');
    return await this.loadFossil(id, fossilsPath);
  }
}
```

### 2. GitHub Service Integration
```typescript
// src/services/githubService.ts
import { GitHubService as BaseService } from '../../../src/services/github';

export class GitHubService extends BaseService {
  async createPullRequest(title: string, body: string) {
    // Implementation for creating PRs
    // This would integrate with our existing GitHub service
    return await this.createIssue(title, body); // Placeholder
  }
}
```

## 🧪 Testing

### 1. Unit Tests
```typescript
// test/commands/fossilBrowser.test.ts
import * as assert from 'assert';
import { FossilBrowserCommand } from '../../src/commands/fossilBrowser';

suite('Fossil Browser Tests', () => {
  test('Should load fossils from workspace', async () => {
    const command = new FossilBrowserCommand();
    // Test implementation
  });
});
```

### 2. Integration Tests
```typescript
// test/integration/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Tests', () => {
  test('Should register all commands', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('ai-orchestrator.browseFossils'));
    assert.ok(commands.includes('ai-orchestrator.createIssue'));
    assert.ok(commands.includes('ai-orchestrator.createPR'));
    assert.ok(commands.includes('ai-orchestrator.showInsights'));
  });
});
```

## 📦 Packaging and Publishing

### 1. Build Extension
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
vsce package

# This creates ai-project-orchestrator-0.1.0.vsix
```

### 2. Test Locally
```bash
# Install extension locally
code --install-extension ai-project-orchestrator-0.1.0.vsix

# Test in VS Code
code --new-window
```

### 3. Publish to Marketplace
```bash
# Login to VS Code Marketplace
vsce login <publisher-name>

# Publish extension
vsce publish

# Or publish with specific version
vsce publish patch  # 0.1.0 -> 0.1.1
vsce publish minor  # 0.1.0 -> 0.2.0
vsce publish major  # 0.1.0 -> 1.0.0
```

## 🎯 Next Steps

### Week 1: Core Features
- [ ] Set up extension project structure
- [ ] Implement fossil browser command
- [ ] Add basic UI components
- [ ] Test with local fossils

### Week 2: GitHub Integration
- [ ] Implement issue creation
- [ ] Add PR creation
- [ ] Test with real GitHub repos
- [ ] Add error handling

### Week 3: ML Insights
- [ ] Create insights panel
- [ ] Integrate with LLM service
- [ ] Add real-time updates
- [ ] Test insights generation

### Week 4: Polish & Launch
- [ ] Add comprehensive tests
- [ ] Create documentation
- [ ] Package and publish
- [ ] Launch beta program

## 🔥 Innovation Highlights

### What Makes This Special

#### 1. **Direct Fossil Access**
- Browse canonical fossils directly in VS Code
- Real-time fossil updates
- Rich fossil viewing experience

#### 2. **Seamless Orchestration**
- Create GitHub objects without leaving VS Code
- Integrated with existing fossil system
- ML-powered insights and recommendations

#### 3. **Developer Experience**
- Native VS Code integration
- Command palette access
- Custom views and panels
- IntelliSense support

#### 4. **Market Ready**
- Clear value proposition
- Easy installation and setup
- Comprehensive documentation
- Active community support

This extension will be our first market-facing product, bringing our ML-powered orchestration to developers worldwide through the VS Code marketplace. 