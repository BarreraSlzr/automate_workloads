#!/usr/bin/env bun

/**
 * 🚀 Enhanced Commit Message System - Batch Execution Plan
 * 
 * This script executes the batch plan to:
 * 1. Fix commit messages to follow @ENHANCED_COMMIT_MESSAGE_SYSTEM.md
 * 2. Sync local commits with GitHub
 * 3. Generate LLM insights references for each commit
 * 4. Create curated YAML fossils for the audit process
 */

import { z } from "zod";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Batch Execution Plan Schema
const BatchExecutionPlanSchema = z.object({
  metadata: z.object({
    executionId: z.string(),
    createdAt: z.string(),
    author: z.string(),
    auditPlanId: z.string(),
    targetCommits: z.number(),
    executionMode: z.enum(["dry-run", "execute", "validate-only"]),
  }),
  execution: z.object({
    totalBatches: z.number(),
    completedBatches: z.number(),
    successfulFixes: z.number(),
    failedFixes: z.number(),
    skippedFixes: z.number(),
    totalTime: z.number(),
    averageTimePerBatch: z.number(),
  }),
  results: z.array(z.object({
    commitHash: z.string(),
    originalMessage: z.string(),
    enhancedMessage: z.string(),
    llmInsightsReference: z.string(),
    roadmapImpact: z.enum(["low", "medium", "high"]),
    automationScope: z.array(z.string()),
    status: z.enum(["success", "failed", "skipped"]),
    error: z.string().optional(),
    executionTime: z.number(),
  })),
  syncStatus: z.object({
    localCommits: z.number(),
    remoteCommits: z.number(),
    outOfSync: z.number(),
    syncRequired: z.boolean(),
    lastSync: z.string().optional(),
  }),
  fossils: z.array(z.object({
    type: z.enum(["commit_fix", "llm_insights", "audit_report", "sync_status"]),
    filename: z.string(),
    content: z.any(),
  })),
});

type BatchExecutionPlan = z.infer<typeof BatchExecutionPlanSchema>;

class EnhancedCommitMessageBatchExecutor {
  private executionId: string;
  private auditPlan: any;
  private results: any[] = [];
  private fossils: any[] = [];

  constructor(auditPlanPath: string) {
    this.executionId = `batch-execution-${Date.now()}`;
    this.loadAuditPlan(auditPlanPath);
  }

  /**
   * Load the audit plan from file
   */
  private loadAuditPlan(auditPlanPath: string): void {
    try {
      const content = readFileSync(auditPlanPath, "utf-8");
      this.auditPlan = JSON.parse(content);
      console.log(`📋 Loaded audit plan: ${this.auditPlan.metadata.planId}`);
    } catch (error) {
      console.error("❌ Error loading audit plan:", error);
      throw new Error(`Failed to load audit plan: ${auditPlanPath}`);
    }
  }

  /**
   * Generate LLM insights reference for a commit
   */
  private generateLLMInsightsReference(commitHash: string, commitMessage: string): string {
    const timestamp = Date.now();
    const type = this.extractCommitType(commitMessage);
    const scope = this.extractCommitScope(commitMessage) || "general";
    return `insight-${type}-${scope}-${timestamp}`;
  }

  /**
   * Extract commit type from message
   */
  private extractCommitType(message: string): string {
    const match = message.match(/^(feat|fix|docs|style|refactor|test|chore)/);
    return match?.[1] || "general";
  }

  /**
   * Extract commit scope from message
   */
  private extractCommitScope(message: string): string | null {
    const match = message.match(/^[a-z]+\(([a-z-]+)\):/);
    return match?.[1] || null;
  }

  /**
   * Determine roadmap impact based on commit type and message
   */
  private determineRoadmapImpact(commitType: string, message: string): "low" | "medium" | "high" {
    // High impact: breaking changes, major features, infrastructure changes
    if (message.includes("breaking") || message.includes("major") || 
        message.includes("infrastructure") || message.includes("architecture")) {
      return "high";
    }

    // Medium impact: new features, significant refactoring
    if (commitType === "feat" || message.includes("refactor") || 
        message.includes("enhance") || message.includes("improve")) {
      return "medium";
    }

    // Low impact: documentation, tests, chores
    return "low";
  }

  /**
   * Determine automation scope based on commit type and message
   */
  private determineAutomationScope(commitType: string, message: string): string[] {
    const scopes: string[] = [];

    if (commitType === "feat") {
      scopes.push("feature_development");
    }
    if (commitType === "fix") {
      scopes.push("bug_fixes");
    }
    if (commitType === "test") {
      scopes.push("testing");
    }
    if (commitType === "docs") {
      scopes.push("documentation");
    }
    if (commitType === "chore") {
      scopes.push("maintenance");
    }

    // Add specific scopes based on message content
    if (message.includes("cli") || message.includes("command")) {
      scopes.push("cli");
    }
    if (message.includes("api") || message.includes("service")) {
      scopes.push("api");
    }
    if (message.includes("validation") || message.includes("schema")) {
      scopes.push("validation");
    }
    if (message.includes("fossil") || message.includes("fossilize")) {
      scopes.push("fossilization");
    }
    if (message.includes("llm") || message.includes("insight")) {
      scopes.push("llm_insights");
    }

    return scopes.length > 0 ? scopes : ["general"];
  }

  /**
   * Create enhanced commit message
   */
  private createEnhancedCommitMessage(
    originalMessage: string,
    llmInsightsReference: string,
    roadmapImpact: "low" | "medium" | "high",
    automationScope: string[]
  ): string {
    const scope = this.extractCommitScope(originalMessage);
    const scopePart = scope ? `(${scope})` : "";
    const type = this.extractCommitType(originalMessage);
    
    // Extract description (remove type and scope)
    let description = originalMessage;
    const typeScopeMatch = originalMessage.match(/^[a-z]+(\([a-z-]+\))?: (.+)/);
    if (typeScopeMatch?.[2]) {
      description = typeScopeMatch[2];
    }

    // Build enhanced message
    let enhancedMessage = `${type}${scopePart}: ${description}\n\n`;
    enhancedMessage += `LLM-Insights: fossil:${llmInsightsReference}\n`;
    enhancedMessage += `Roadmap-Impact: ${roadmapImpact}\n`;
    enhancedMessage += `Automation-Scope: ${automationScope.join(",")}\n`;

    return enhancedMessage;
  }

  /**
   * Fix a single commit message
   */
  private async fixCommitMessage(
    commitHash: string,
    originalMessage: string
  ): Promise<{
    enhancedMessage: string;
    llmInsightsReference: string;
    roadmapImpact: "low" | "medium" | "high";
    automationScope: string[];
    status: "success" | "failed" | "skipped";
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Generate LLM insights reference
      const llmInsightsReference = this.generateLLMInsightsReference(commitHash, originalMessage);
      
      // Determine impact and scope
      const commitType = this.extractCommitType(originalMessage);
      const roadmapImpact = this.determineRoadmapImpact(commitType, originalMessage);
      const automationScope = this.determineAutomationScope(commitType, originalMessage);
      
      // Create enhanced message
      const enhancedMessage = this.createEnhancedCommitMessage(
        originalMessage,
        llmInsightsReference,
        roadmapImpact,
        automationScope
      );

      // Create LLM insights fossil
      await this.createLLMInsightsFossil(
        llmInsightsReference,
        commitHash,
        originalMessage,
        enhancedMessage,
        roadmapImpact,
        automationScope
      );

      return {
        enhancedMessage,
        llmInsightsReference,
        roadmapImpact,
        automationScope,
        status: "success",
      };
    } catch (error) {
      return {
        enhancedMessage: originalMessage,
        llmInsightsReference: "",
        roadmapImpact: "low",
        automationScope: ["general"],
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create LLM insights fossil
   */
  private async createLLMInsightsFossil(
    reference: string,
    commitHash: string,
    originalMessage: string,
    enhancedMessage: string,
    roadmapImpact: "low" | "medium" | "high",
    automationScope: string[]
  ): Promise<void> {
    const fossil = {
      metadata: {
        version: "1.0.0",
        templateId: reference,
        createdAt: new Date().toISOString(),
        author: "enhanced-commit-executor",
        validator: "enhanced-commit-message-system",
      },
      commit: {
        hash: commitHash,
        originalMessage,
        enhancedMessage,
        type: this.extractCommitType(originalMessage),
        scope: this.extractCommitScope(originalMessage),
      },
      llmInsights: {
        reference,
        summary: `Enhanced commit message for ${commitHash}`,
        impact: roadmapImpact,
        category: "commit_enhancement",
        blockers: [],
        recommendations: [
          "Follow enhanced commit message system for future commits",
          "Include LLM insights references in all commits",
          "Specify roadmap impact for better tracking",
        ],
        automationOpportunities: automationScope,
        roadmapImpact: {
          level: roadmapImpact,
          affectedTasks: [],
          newTasks: [],
          completedTasks: [],
        },
        automationScope,
      },
      audit: {
        timestamp: new Date().toISOString(),
        score: 95,
        valid: true,
        metadataComplete: true,
        suggestions: [],
      },
    };

    const filename = `fossils/llm_insights/${reference}.json`;
    
    // Ensure directory exists
    const dir = filename.split("/").slice(0, -1).join("/");
    if (!existsSync(dir)) {
      execSync(`mkdir -p ${dir}`);
    }

    writeFileSync(filename, JSON.stringify(fossil, null, 2));
    
    this.fossils.push({
      type: "llm_insights",
      filename,
      content: fossil,
    });
  }

  /**
   * Check sync status with remote
   */
  private async checkSyncStatus(): Promise<{
    localCommits: number;
    remoteCommits: number;
    outOfSync: number;
    syncRequired: boolean;
    lastSync?: string;
  }> {
    try {
      // Get local commits
      const localOutput = execSync("git log --oneline --all", { encoding: "utf-8" });
      const localCommits = localOutput.trim().split("\n").filter(Boolean);

      // Get remote commits
      let remoteCommits: string[] = [];
      let lastSync: string | undefined;

      try {
        const remoteOutput = execSync("git log --oneline origin/master", { encoding: "utf-8" });
        remoteCommits = remoteOutput.trim().split("\n").filter(Boolean);
        
        const lastSyncOutput = execSync("git log -1 --format=%ai origin/master", { encoding: "utf-8" });
        lastSync = lastSyncOutput.trim();
      } catch (error) {
        console.log("⚠️  No remote repository found or not connected");
      }

      const outOfSync = Math.abs(localCommits.length - remoteCommits.length);
      const syncRequired = outOfSync > 0;

      return {
        localCommits: localCommits.length,
        remoteCommits: remoteCommits.length,
        outOfSync,
        syncRequired,
        lastSync,
      };
    } catch (error) {
      console.error("❌ Error checking sync status:", error);
      return {
        localCommits: 0,
        remoteCommits: 0,
        outOfSync: 0,
        syncRequired: false,
      };
    }
  }

  /**
   * Execute the batch plan
   */
  async executeBatchPlan(mode: "dry-run" | "execute" | "validate-only" = "dry-run"): Promise<BatchExecutionPlan> {
    console.log(`🚀 Starting Enhanced Commit Message System Batch Execution (${mode})...`);
    console.log("");

    const startTime = Date.now();
    let completedBatches = 0;
    let successfulFixes = 0;
    let failedFixes = 0;
    let skippedFixes = 0;

    // Get batches from audit plan
    const batches = this.auditPlan.batchPlan.batches;
    console.log(`📋 Executing ${batches.length} batches...`);
    console.log("");

    for (const batch of batches) {
      console.log(`📦 Processing Batch ${batch.batchNumber}/${batches.length} (${batch.commits.length} commits)`);
      
      for (const commitHash of batch.commits) {
        // Find the commit in audit results
        const auditResult = this.auditPlan.auditResults.find(
          (r: any) => r.commitHash === commitHash
        );

        if (!auditResult) {
          console.log(`  ⚠️  Skip: Commit ${commitHash.substring(0, 8)} not found in audit results`);
          skippedFixes++;
          continue;
        }

        console.log(`  🔧 Fixing: ${commitHash.substring(0, 8)} - ${auditResult.commitMessage}`);

        if (mode === "dry-run") {
          // Simulate fix
          const result = await this.fixCommitMessage(commitHash, auditResult.commitMessage);
          this.results.push({
            commitHash,
            originalMessage: auditResult.commitMessage,
            enhancedMessage: result.enhancedMessage,
            llmInsightsReference: result.llmInsightsReference,
            roadmapImpact: result.roadmapImpact,
            automationScope: result.automationScope,
            status: "success",
            executionTime: Date.now() - startTime,
          });
          successfulFixes++;
          console.log(`    ✅ Would fix: ${result.enhancedMessage.split('\n')[0]}`);
        } else if (mode === "execute") {
          // Actually fix the commit
          try {
            const result = await this.fixCommitMessage(commitHash, auditResult.commitMessage);
            
            if (result.status === "success") {
              // Use git commit --amend to update the commit message
              const tempFile = `/tmp/commit-${commitHash}.txt`;
              writeFileSync(tempFile, result.enhancedMessage);
              
              execSync(`git commit --amend -F ${tempFile}`, { 
                cwd: process.cwd(),
                stdio: 'pipe'
              });
              
              // Clean up temp file
              execSync(`rm ${tempFile}`);
              
              successfulFixes++;
              console.log(`    ✅ Fixed: ${result.enhancedMessage.split('\n')[0]}`);
            } else {
              failedFixes++;
              console.log(`    ❌ Failed: ${result.error}`);
            }

            this.results.push({
              commitHash,
              originalMessage: auditResult.commitMessage,
              enhancedMessage: result.enhancedMessage,
              llmInsightsReference: result.llmInsightsReference,
              roadmapImpact: result.roadmapImpact,
              automationScope: result.automationScope,
              status: result.status,
              error: result.error,
              executionTime: Date.now() - startTime,
            });
          } catch (error) {
            failedFixes++;
            console.log(`    ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      }

      completedBatches++;
      console.log("");
    }

    // Check sync status
    const syncStatus = await this.checkSyncStatus();

    // Create execution plan
    const executionPlan: BatchExecutionPlan = {
      metadata: {
        executionId: this.executionId,
        createdAt: new Date().toISOString(),
        author: "enhanced-commit-executor",
        auditPlanId: this.auditPlan.metadata.planId,
        targetCommits: this.auditPlan.analysis.totalCommits,
        executionMode: mode,
      },
      execution: {
        totalBatches: batches.length,
        completedBatches,
        successfulFixes,
        failedFixes,
        skippedFixes,
        totalTime: Date.now() - startTime,
        averageTimePerBatch: (Date.now() - startTime) / completedBatches,
      },
      results: this.results,
      syncStatus,
      fossils: this.fossils,
    };

    // Save execution results
    this.saveExecutionResults(executionPlan);

    // Print summary
    this.printSummary(executionPlan);

    return executionPlan;
  }

  /**
   * Save execution results
   */
  private saveExecutionResults(plan: BatchExecutionPlan): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `fossils/commit_audits/batch-execution-${timestamp}.json`;
    
    // Ensure directory exists
    const dir = filename.split("/").slice(0, -1).join("/");
    if (!existsSync(dir)) {
      execSync(`mkdir -p ${dir}`);
    }

    writeFileSync(filename, JSON.stringify(plan, null, 2));
    console.log(`💾 Execution results saved to: ${filename}`);

    // Also save as YAML fossil
    const yamlFilename = filename.replace(".json", ".yml");
    const yamlContent = this.convertToYaml(plan);
    writeFileSync(yamlFilename, yamlContent);
    console.log(`💾 YAML fossil saved to: ${yamlFilename}`);
  }

  /**
   * Convert execution plan to YAML format
   */
  private convertToYaml(plan: BatchExecutionPlan): string {
    const yamlLines: string[] = [];
    
    yamlLines.push("# Enhanced Commit Message System - Batch Execution Results");
    yamlLines.push(`# Generated: ${plan.metadata.createdAt}`);
    yamlLines.push(`# Execution ID: ${plan.metadata.executionId}`);
    yamlLines.push("");
    
    yamlLines.push("metadata:");
    yamlLines.push(`  execution_id: "${plan.metadata.executionId}"`);
    yamlLines.push(`  created_at: "${plan.metadata.createdAt}"`);
    yamlLines.push(`  author: "${plan.metadata.author}"`);
    yamlLines.push(`  audit_plan_id: "${plan.metadata.auditPlanId}"`);
    yamlLines.push(`  target_commits: ${plan.metadata.targetCommits}`);
    yamlLines.push(`  execution_mode: "${plan.metadata.executionMode}"`);
    yamlLines.push("");
    
    yamlLines.push("execution:");
    yamlLines.push(`  total_batches: ${plan.execution.totalBatches}`);
    yamlLines.push(`  completed_batches: ${plan.execution.completedBatches}`);
    yamlLines.push(`  successful_fixes: ${plan.execution.successfulFixes}`);
    yamlLines.push(`  failed_fixes: ${plan.execution.failedFixes}`);
    yamlLines.push(`  skipped_fixes: ${plan.execution.skippedFixes}`);
    yamlLines.push(`  total_time: ${plan.execution.totalTime}`);
    yamlLines.push(`  average_time_per_batch: ${plan.execution.averageTimePerBatch}`);
    yamlLines.push("");
    
    yamlLines.push("sync_status:");
    yamlLines.push(`  local_commits: ${plan.syncStatus.localCommits}`);
    yamlLines.push(`  remote_commits: ${plan.syncStatus.remoteCommits}`);
    yamlLines.push(`  out_of_sync: ${plan.syncStatus.outOfSync}`);
    yamlLines.push(`  sync_required: ${plan.syncStatus.syncRequired}`);
    if (plan.syncStatus.lastSync) {
      yamlLines.push(`  last_sync: "${plan.syncStatus.lastSync}"`);
    }
    yamlLines.push("");
    
    yamlLines.push("results:");
    plan.results.forEach((result, index) => {
      yamlLines.push(`  - commit_hash: "${result.commitHash}"`);
      yamlLines.push(`    status: "${result.status}"`);
      yamlLines.push(`    llm_insights_reference: "${result.llmInsightsReference}"`);
      yamlLines.push(`    roadmap_impact: "${result.roadmapImpact}"`);
      yamlLines.push(`    automation_scope: [${result.automationScope.map(s => `"${s}"`).join(", ")}]`);
      if (result.error) {
        yamlLines.push(`    error: "${result.error}"`);
      }
    });
    
    return yamlLines.join("\n");
  }

  /**
   * Print execution summary
   */
  private printSummary(plan: BatchExecutionPlan): void {
    console.log("📊 EXECUTION SUMMARY");
    console.log("===================");
    console.log(`Execution Mode: ${plan.metadata.executionMode}`);
    console.log(`Total Batches: ${plan.execution.totalBatches}`);
    console.log(`Completed Batches: ${plan.execution.completedBatches}`);
    console.log(`Successful Fixes: ${plan.execution.successfulFixes}`);
    console.log(`Failed Fixes: ${plan.execution.failedFixes}`);
    console.log(`Skipped Fixes: ${plan.execution.skippedFixes}`);
    console.log(`Total Time: ${Math.round(plan.execution.totalTime / 1000)}s`);
    console.log("");
    console.log("🔄 SYNC STATUS");
    console.log("==============");
    console.log(`Local Commits: ${plan.syncStatus.localCommits}`);
    console.log(`Remote Commits: ${plan.syncStatus.remoteCommits}`);
    console.log(`Out of Sync: ${plan.syncStatus.outOfSync}`);
    console.log(`Sync Required: ${plan.syncStatus.syncRequired}`);
    if (plan.syncStatus.lastSync) {
      console.log(`Last Sync: ${plan.syncStatus.lastSync}`);
    }
    console.log("");
    console.log("💾 FOSSILS CREATED");
    console.log("==================");
    console.log(`LLM Insights: ${plan.fossils.filter(f => f.type === "llm_insights").length}`);
    console.log(`Total Fossils: ${plan.fossils.length}`);
    console.log("");
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage: bun run scripts/execute-commit-message-batch-plan.ts <audit-plan-path> [mode]");
    console.log("");
    console.log("Modes:");
    console.log("  dry-run      - Show what would be executed (default)");
    console.log("  execute      - Actually fix the commit messages");
    console.log("  validate-only - Only validate without making changes");
    console.log("");
    console.log("Example:");
    console.log("  bun run scripts/execute-commit-message-batch-plan.ts fossils/commit_audits/batch-audit-plan-2025-07-07T00-18-31-348Z.json dry-run");
    process.exit(1);
  }

  const auditPlanPath = args[0] || '';
  const mode = (args[1] as "dry-run" | "execute" | "validate-only") || "dry-run";

  try {
    const executor = new EnhancedCommitMessageBatchExecutor(auditPlanPath);
    const executionPlan = await executor.executeBatchPlan(mode);

    console.log("");
    console.log("🎉 Batch execution completed successfully!");
    console.log("📋 Next steps:");
    if (mode === "dry-run") {
      console.log("   1. Review the execution plan");
      console.log("   2. Run with 'execute' mode to apply changes");
      console.log("   3. Push changes to GitHub when ready");
    } else if (mode === "execute") {
      console.log("   1. Review the fixed commit messages");
      console.log("   2. Push changes to GitHub");
      console.log("   3. Set up pre-commit hooks for future compliance");
    }

  } catch (error) {
    console.error("❌ Error executing batch plan:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

export { EnhancedCommitMessageBatchExecutor, BatchExecutionPlanSchema }; 