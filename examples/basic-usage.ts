/**
 * Basic Usage Examples for the Automation Ecosystem
 * This file demonstrates how to use the various services and utilities
 * @module examples/basic-usage
 */

import { GitHubService } from "../src/services/github";
import { executeCommand, executeCommandJSON } from "../src/utils/cli";
import { getEnv, validateConfig } from "../src/core/config";
import type { GitHubIssue } from "../src/types";

/**
 * Example 1: Basic GitHub Issues Management
 * Demonstrates how to fetch and display GitHub issues
 */
async function exampleGitHubIssues(): Promise<void> {
  console.log("🔍 Example 1: GitHub Issues Management");
  console.log("=" .repeat(50));

  // Create GitHub service instance
  const github = new GitHubService('BarreraSlzr', 'automate_workloads');

  // Check if GitHub CLI is ready
  const isReady = await github.isReady();
  if (!isReady) {
    console.log("❌ GitHub CLI is not ready. Please run: gh auth login");
    return;
  }

  console.log("✅ GitHub CLI is ready");

  // Fetch open issues
  const response = await github.getIssues({ state: 'open' });
  
  if (response.success && response.data) {
    console.log(`📋 Found ${response.data.length} open issues:`);
    console.log(github.formatIssues(response.data, 'table'));
  } else {
    console.log("❌ Failed to fetch issues:", response.error);
  }

  console.log("\n");
}

/**
 * Example 2: Configuration Validation
 * Shows how to validate the current configuration
 */
function exampleConfigValidation(): void {
  console.log("⚙️ Example 2: Configuration Validation");
  console.log("=" .repeat(50));

  try {
    // Get environment configuration
    const config = getEnv();
    console.log("📋 Current configuration:");
    console.log("- GitHub Token:", config.githubToken ? "✅ Set" : "❌ Not set");
    console.log("- Twitter Token:", config.twitterToken ? "✅ Set" : "❌ Not set");
    console.log("- Gmail Token:", config.gmailToken ? "✅ Set" : "❌ Not set");
    console.log("- Buffer Token:", config.bufferToken ? "✅ Set" : "❌ Not set");

    // Validate configuration
    const validation = validateConfig();
    console.log("\n🔍 Configuration validation:");
    console.log("- Is Valid:", validation.isValid ? "✅ Yes" : "❌ No");
    console.log("- Available Services:", validation.availableServices.join(", ") || "None");
    console.log("- Missing Services:", validation.missingServices.join(", ") || "None");

  } catch (error) {
    console.log("❌ Configuration error:", error instanceof Error ? error.message : error);
  }

  console.log("\n");
}

/**
 * Example 3: CLI Command Execution
 * Demonstrates how to execute shell commands programmatically
 */
function exampleCLIExecution(): void {
  console.log("🖥️ Example 3: CLI Command Execution");
  console.log("=" .repeat(50));

  // Example 1: Simple command execution
  try {
    const result = executeCommand('echo "Hello from CLI!"');
    console.log("📤 Simple command result:");
    console.log("- Success:", result.success);
    console.log("- Output:", result.stdout.trim());
  } catch (error) {
    console.log("❌ Command failed:", error instanceof Error ? error.message : error);
  }

  // Example 2: JSON command execution
  try {
    const result = executeCommandJSON<{ version: string }>('node --version --json');
    console.log("\n📤 JSON command result:");
    console.log("- Node version:", result.version);
  } catch (error) {
    console.log("❌ JSON command failed:", error instanceof Error ? error.message : error);
  }

  // Example 3: Command with error handling
  try {
    const result = executeCommand('nonexistent-command', { throwOnError: false });
    console.log("\n📤 Command with error handling:");
    console.log("- Success:", result.success);
    console.log("- Exit Code:", result.exitCode);
    console.log("- Error:", result.stderr);
  } catch (error) {
    console.log("❌ Unexpected error:", error instanceof Error ? error.message : error);
  }

  console.log("\n");
}

/**
 * Example 4: GitHub Issue Creation
 * Shows how to create a new GitHub issue
 */
async function exampleCreateIssue(): Promise<void> {
  console.log("📝 Example 4: GitHub Issue Creation");
  console.log("=" .repeat(50));

  const github = new GitHubService('BarreraSlzr', 'automate_workloads');

  // Check if ready
  const isReady = await github.isReady();
  if (!isReady) {
    console.log("❌ GitHub CLI is not ready");
    return;
  }

  // Create a test issue
  const title = "Test Issue from Automation Ecosystem";
  const body = `This is a test issue created by the automation ecosystem.

## Details
- Created: ${new Date().toISOString()}
- Purpose: Testing the GitHub service integration
- Status: Testing

## Next Steps
- [ ] Verify issue creation
- [ ] Test issue management
- [ ] Clean up test issues`;

  console.log("📝 Creating test issue...");
  const response = await github.createIssue(title, body, {
    labels: ['automation', 'test']
  });

  if (response.success && response.data) {
    console.log("✅ Issue created successfully!");
    console.log(`- Issue #${response.data.number}: ${response.data.title}`);
    console.log(`- State: ${response.data.state}`);
    console.log(`- Labels: ${response.data.labels.join(', ')}`);
    
    // Add a comment to the issue
    console.log("\n💬 Adding a comment...");
    const commentResponse = await github.addComment(
      response.data.number,
      "This comment was added automatically by the automation ecosystem! 🤖"
    );
    
    if (commentResponse.success) {
      console.log("✅ Comment added successfully!");
    } else {
      console.log("❌ Failed to add comment:", commentResponse.error);
    }
  } else {
    console.log("❌ Failed to create issue:", response.error);
  }

  console.log("\n");
}

/**
 * Example 5: Repository Information
 * Demonstrates how to fetch repository metadata
 */
async function exampleRepoInfo(): Promise<void> {
  console.log("📊 Example 5: Repository Information");
  console.log("=" .repeat(50));

  const github = new GitHubService('BarreraSlzr', 'automate_workloads');

  const isReady = await github.isReady();
  if (!isReady) {
    console.log("❌ GitHub CLI is not ready");
    return;
  }

  const response = await github.getRepoInfo();
  
  if (response.success && response.data) {
    console.log("📋 Repository Information:");
    console.log("- Name:", response.data.name);
    console.log("- Description:", response.data.description || "No description");
    console.log("- URL:", response.data.url);
    console.log("- Created:", new Date(response.data.createdAt).toLocaleDateString());
    console.log("- Updated:", new Date(response.data.updatedAt).toLocaleDateString());
    console.log("- Open Issues:", response.data.openIssuesCount);
    console.log("- Closed Issues:", response.data.closedIssuesCount);
  } else {
    console.log("❌ Failed to fetch repository info:", response.error);
  }

  console.log("\n");
}

/**
 * Example 6: Error Handling Patterns
 * Shows different error handling approaches
 */
function exampleErrorHandling(): void {
  console.log("🛡️ Example 6: Error Handling Patterns");
  console.log("=" .repeat(50));

  // Pattern 1: Try-catch with specific error types
  try {
    const config = getEnv();
    console.log("✅ Configuration loaded successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.log("❌ Configuration error:", error.message);
    } else {
      console.log("❌ Unknown configuration error");
    }
  }

  // Pattern 2: Service response pattern
  const mockResponse = {
    success: false,
    error: "This is a mock error",
    statusCode: 500
  };

  if (mockResponse.success) {
    console.log("✅ Operation successful");
  } else {
    console.log(`❌ Operation failed (${mockResponse.statusCode}):`, mockResponse.error);
  }

  // Pattern 3: Graceful degradation
  try {
    const result = executeCommand('nonexistent-command', { throwOnError: false });
    if (result.success) {
      console.log("✅ Command executed successfully");
    } else {
      console.log("⚠️ Command failed, but handled gracefully");
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error instanceof Error ? error.message : error);
  }

  console.log("\n");
}

/**
 * Main function to run all examples
 */
async function runAllExamples(): Promise<void> {
  console.log("🚀 Automation Ecosystem - Basic Usage Examples");
  console.log("=" .repeat(60));
  console.log();

  // Run examples
  await exampleGitHubIssues();
  exampleConfigValidation();
  exampleCLIExecution();
  await exampleCreateIssue();
  await exampleRepoInfo();
  exampleErrorHandling();

  console.log("🎉 All examples completed!");
  console.log("\n💡 Tips:");
  console.log("- Use --verbose flag for detailed output");
  console.log("- Check the documentation for more examples");
  console.log("- Customize the examples for your use case");
}

// Run examples if this file is executed directly
if (import.meta.main) {
  runAllExamples().catch(console.error);
}

export {
  exampleGitHubIssues,
  exampleConfigValidation,
  exampleCLIExecution,
  exampleCreateIssue,
  exampleRepoInfo,
  exampleErrorHandling,
  runAllExamples
}; 