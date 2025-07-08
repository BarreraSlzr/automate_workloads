#!/usr/bin/env bun

/**
 * 🚀 Enhanced Commit Message System - Batch Audit Plan
 * 
 * This script creates a comprehensive batch plan to:
 * 1. Review commit message order results
 * 2. Analyze current sync status with GitHub commits
 * 3. Audit commits that don't follow @ENHANCED_COMMIT_MESSAGE_SYSTEM.md
 * 4. Generate curated YAML fossils for git repository audit
 */

import { z } from "zod";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Enhanced Commit Message System Schemas
const EnhancedCommitMessageSchema = z.object({
  metadata: z.object({
    version: z.string(),
    templateId: z.string(),
    createdAt: z.string(),
    author: z.string(),
    validator: z.string(),
  }),
  commit: z.object({
    type: z.enum(["feat", "fix", "docs", "style", "refactor", "test", "chore"]),
    scope: z.string().optional(),
    description: z.string(),
    body: z.string().optional(),
    breakingChange: z.boolean().default(false),
    issues: z.array(z.string()).optional(),
  }),
  llmInsights: z.object({
    reference: z.string(),
    summary: z.string(),
    impact: z.enum(["low", "medium", "high"]),
    category: z.string(),
    blockers: z.array(z.string()).default([]),
    recommendations: z.array(z.string()).default([]),
    automationOpportunities: z.array(z.string()).default([]),
    roadmapImpact: z.object({
      level: z.enum(["low", "medium", "high"]),
      affectedTasks: z.array(z.string()).default([]),
      newTasks: z.array(z.string()).default([]),
      completedTasks: z.array(z.string()).default([]),
    }),
    automationScope: z.array(z.string()).default([]),
  }),
  audit: z.object({
    timestamp: z.string(),
    score: z.number().min(0).max(100),
    valid: z.boolean(),
    metadataComplete: z.boolean(),
    suggestions: z.array(z.string()).default([]),
  }),
});

const CommitAuditResultSchema = z.object({
  commitHash: z.string(),
  commitMessage: z.string(),
  author: z.string(),
  date: z.string(),
  enhancedCompliant: z.boolean(),
  score: z.number().min(0).max(100),
  missingElements: z.array(z.string()),
  suggestions: z.array(z.string()),
  llmInsightsReference: z.string().optional(),
  roadmapImpact: z.enum(["low", "medium", "high"]).optional(),
  automationScope: z.array(z.string()).optional(),
});

const BatchAuditPlanSchema = z.object({
  metadata: z.object({
    planId: z.string(),
    createdAt: z.string(),
    author: z.string(),
    targetCommits: z.number(),
    auditScope: z.enum(["recent", "all", "range"]),
    enhancedSystemCompliance: z.boolean(),
  }),
  analysis: z.object({
    totalCommits: z.number(),
    enhancedCompliant: z.number(),
    nonCompliant: z.number(),
    averageScore: z.number(),
    complianceRate: z.number(),
    syncStatus: z.object({
      localCommits: z.number(),
      remoteCommits: z.number(),
      outOfSync: z.number(),
      lastSync: z.string().optional(),
    }),
  }),
  auditResults: z.array(CommitAuditResultSchema),
  recommendations: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    action: z.string(),
    impact: z.string(),
    effort: z.enum(["low", "medium", "high"]),
  })),
  batchPlan: z.object({
    batches: z.array(z.object({
      batchNumber: z.number(),
      commits: z.array(z.string()),
      estimatedTime: z.number(),
      priority: z.enum(["high", "medium", "low"]),
    })),
    totalBatches: z.number(),
    estimatedTotalTime: z.number(),
  }),
});

type EnhancedCommitMessage = z.infer<typeof EnhancedCommitMessageSchema>;
type CommitAuditResult = z.infer<typeof CommitAuditResultSchema>;
type BatchAuditPlan = z.infer<typeof BatchAuditPlanSchema>;

class EnhancedCommitMessageBatchAuditor {
  private planId: string;
  private auditResults: CommitAuditResult[] = [];
  private localCommits: string[] = [];
  private remoteCommits: string[] = [];

  constructor() {
    this.planId = `batch-audit-${Date.now()}`;
  }

  /**
   * Get recent commits from git log
   */
  private getRecentCommits(limit: number = 50): Array<{
    hash: string;
    message: string;
    author: string;
    date: string;
  }> {
    try {
      const output = execSync(
        `git log --pretty=format:"%H|%s|%an|%ai" -n ${limit}`,
        { encoding: "utf-8" }
      );

      return output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(line => {
          const [hash, message, author, date] = line.split("|");
          return { 
            hash: hash || '', 
            message: message || '', 
            author: author || '', 
            date: date || '' 
          };
        });
    } catch (error) {
      console.error("❌ Error getting recent commits:", error);
      return [];
    }
  }

  /**
   * Check if commit message follows enhanced system
   */
  private analyzeCommitMessage(
    hash: string,
    message: string,
    author: string,
    date: string
  ): CommitAuditResult {
    const missingElements: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    let enhancedCompliant = false;

    // Check conventional commit format
    const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore)(\([a-z-]+\))?: .+/;
    if (conventionalPattern.test(message)) {
      score += 30;
    } else {
      missingElements.push("conventional_commit_format");
      suggestions.push("Use conventional commit format: type(scope): description");
    }

    // Check message length
    if (message.length >= 10 && message.length <= 72) {
      score += 20;
    } else {
      missingElements.push("message_length");
      suggestions.push("Message should be between 10-72 characters");
    }

    // Check for scope
    const scopePattern = /^[a-z]+\([a-z-]+\):/;
    if (scopePattern.test(message)) {
      score += 15;
    } else {
      missingElements.push("scope");
      suggestions.push("Add scope to commit message for better categorization");
    }

    // Check for issue references
    const issuePattern = /#\d+/;
    if (issuePattern.test(message)) {
      score += 10;
    } else {
      missingElements.push("issue_references");
      suggestions.push("Add issue references (e.g., #123)");
    }

    // Check for LLM insights reference (enhanced system requirement)
    const llmInsightsPattern = /LLM-Insights: fossil:[a-zA-Z0-9-]+/;
    if (llmInsightsPattern.test(message)) {
      score += 15;
      enhancedCompliant = true;
    } else {
      missingElements.push("llm_insights_reference");
      suggestions.push("Add LLM-Insights: fossil:reference for enhanced system compliance");
    }

    // Check for roadmap impact
    const roadmapImpactPattern = /Roadmap-Impact: (low|medium|high)/;
    if (roadmapImpactPattern.test(message)) {
      score += 5;
    } else {
      missingElements.push("roadmap_impact");
      suggestions.push("Add Roadmap-Impact: low|medium|high");
    }

    // Check for automation scope
    const automationScopePattern = /Automation-Scope: [a-z,-]+/;
    if (automationScopePattern.test(message)) {
      score += 5;
    } else {
      missingElements.push("automation_scope");
      suggestions.push("Add Automation-Scope: area1,area2");
    }

    // Extract LLM insights reference if present
    const llmMatch = message.match(/LLM-Insights: fossil:([a-zA-Z0-9-]+)/);
    const llmInsightsReference = llmMatch?.[1] || undefined;

    // Extract roadmap impact if present
    const roadmapMatch = message.match(/Roadmap-Impact: (low|medium|high)/);
    const roadmapImpact = roadmapMatch ? roadmapMatch[1] as "low" | "medium" | "high" : undefined;

    // Extract automation scope if present
    const automationMatch = message.match(/Automation-Scope: ([a-z,-]+)/);
    const automationScope = automationMatch?.[1]?.split(",") || undefined;

    return {
      commitHash: hash,
      commitMessage: message,
      author,
      date,
      enhancedCompliant,
      score,
      missingElements,
      suggestions,
      llmInsightsReference,
      roadmapImpact,
      automationScope,
    };
  }

  /**
   * Check sync status with remote repository
   */
  private async checkSyncStatus(): Promise<{
    localCommits: number;
    remoteCommits: number;
    outOfSync: number;
    lastSync?: string;
  }> {
    try {
      // Get local commits
      const localOutput = execSync("git log --oneline --all", { encoding: "utf-8" });
      this.localCommits = localOutput.trim().split("\n").filter(Boolean);

      // Get remote commits (if remote exists)
      let remoteCommits: string[] = [];
      let lastSync: string | undefined;

      try {
        const remoteOutput = execSync("git log --oneline origin/master", { encoding: "utf-8" });
        remoteCommits = remoteOutput.trim().split("\n").filter(Boolean);
        this.remoteCommits = remoteCommits;

        // Get last sync time
        const lastSyncOutput = execSync("git log -1 --format=%ai origin/master", { encoding: "utf-8" });
        lastSync = lastSyncOutput.trim();
      } catch (error) {
        console.log("⚠️  No remote repository found or not connected");
      }

      // Calculate out of sync commits
      const outOfSync = Math.abs(this.localCommits.length - remoteCommits.length);

      return {
        localCommits: this.localCommits.length,
        remoteCommits: remoteCommits.length,
        outOfSync,
        lastSync,
      };
    } catch (error) {
      console.error("❌ Error checking sync status:", error);
      return {
        localCommits: 0,
        remoteCommits: 0,
        outOfSync: 0,
      };
    }
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(): Array<{
    priority: "high" | "medium" | "low";
    action: string;
    impact: string;
    effort: "low" | "medium" | "high";
  }> {
    const recommendations: Array<{
      priority: "high" | "medium" | "low";
      action: string;
      impact: string;
      effort: "low" | "medium" | "high";
    }> = [];

    const nonCompliantCount = this.auditResults.filter(r => !r.enhancedCompliant).length;
    const lowScoreCount = this.auditResults.filter(r => r.score < 70).length;

    // High priority recommendations
    if (nonCompliantCount > 0) {
      recommendations.push({
        priority: "high",
        action: "Add LLM insights references to non-compliant commits",
        impact: "Enable enhanced commit message system compliance",
        effort: "medium",
      });
    }

    if (lowScoreCount > 0) {
      recommendations.push({
        priority: "high",
        action: "Fix low-scoring commit messages",
        impact: "Improve commit quality and traceability",
        effort: "medium",
      });
    }

    // Medium priority recommendations
    if (this.auditResults.some(r => r.missingElements.includes("scope"))) {
      recommendations.push({
        priority: "medium",
        action: "Add scopes to commits without them",
        impact: "Better categorization and filtering",
        effort: "low",
      });
    }

    if (this.auditResults.some(r => r.missingElements.includes("issue_references"))) {
      recommendations.push({
        priority: "medium",
        action: "Add issue references to commits",
        impact: "Better traceability to issues",
        effort: "low",
      });
    }

    // Low priority recommendations
    recommendations.push({
      priority: "low",
      action: "Set up pre-commit hooks for enhanced validation",
      impact: "Prevent future non-compliant commits",
      effort: "medium",
    });

    return recommendations;
  }

  /**
   * Create batch plan for fixing commits
   */
  private createBatchPlan(): {
    batches: Array<{
      batchNumber: number;
      commits: string[];
      estimatedTime: number;
      priority: "high" | "medium" | "low";
    }>;
    totalBatches: number;
    estimatedTotalTime: number;
  } {
    const nonCompliantCommits = this.auditResults
      .filter(r => !r.enhancedCompliant)
      .map(r => r.commitHash);

    const lowScoreCommits = this.auditResults
      .filter(r => r.score < 70 && r.enhancedCompliant)
      .map(r => r.commitHash);

    const batches = [];
    const batchSize = 5;
    let batchNumber = 1;

    // High priority batches (non-compliant commits)
    for (let i = 0; i < nonCompliantCommits.length; i += batchSize) {
      const batch = nonCompliantCommits.slice(i, i + batchSize);
      batches.push({
        batchNumber: batchNumber++,
        commits: batch,
        estimatedTime: batch.length * 2, // 2 minutes per commit
        priority: "high" as const,
      });
    }

    // Medium priority batches (low score commits)
    for (let i = 0; i < lowScoreCommits.length; i += batchSize) {
      const batch = lowScoreCommits.slice(i, i + batchSize);
      batches.push({
        batchNumber: batchNumber++,
        commits: batch,
        estimatedTime: batch.length * 1.5, // 1.5 minutes per commit
        priority: "medium" as const,
      });
    }

    const estimatedTotalTime = batches.reduce((sum, batch) => sum + batch.estimatedTime, 0);

    return {
      batches,
      totalBatches: batches.length,
      estimatedTotalTime,
    };
  }

  /**
   * Execute the complete batch audit
   */
  async executeAudit(commitLimit: number = 50): Promise<BatchAuditPlan> {
    console.log("🚀 Starting Enhanced Commit Message System Batch Audit...");
    console.log("");

    // Get recent commits
    console.log("📋 Analyzing recent commits...");
    const commits = this.getRecentCommits(commitLimit);
    console.log(`   Found ${commits.length} commits to audit`);
    console.log("");

    // Analyze each commit
    console.log("🔍 Analyzing commit messages...");
    for (const commit of commits) {
      const result = this.analyzeCommitMessage(
        commit.hash,
        commit.message,
        commit.author,
        commit.date
      );
      this.auditResults.push(result);
    }

    // Check sync status
    console.log("🔄 Checking sync status with remote...");
    const syncStatus = await this.checkSyncStatus();

    // Calculate statistics
    const totalCommits = this.auditResults.length;
    const enhancedCompliant = this.auditResults.filter(r => r.enhancedCompliant).length;
    const nonCompliant = totalCommits - enhancedCompliant;
    const averageScore = Math.round(
      this.auditResults.reduce((sum, r) => sum + r.score, 0) / totalCommits
    );
    const complianceRate = Math.round((enhancedCompliant / totalCommits) * 100);

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Create batch plan
    const batchPlan = this.createBatchPlan();

    // Create the complete audit plan
    const auditPlan: BatchAuditPlan = {
      metadata: {
        planId: this.planId,
        createdAt: new Date().toISOString(),
        author: "enhanced-commit-auditor",
        targetCommits: commitLimit,
        auditScope: "recent",
        enhancedSystemCompliance: true,
      },
      analysis: {
        totalCommits,
        enhancedCompliant,
        nonCompliant,
        averageScore,
        complianceRate,
        syncStatus,
      },
      auditResults: this.auditResults,
      recommendations,
      batchPlan,
    };

    console.log("✅ Audit completed successfully!");
    console.log("");

    // Print summary
    this.printSummary(auditPlan);

    return auditPlan;
  }

  /**
   * Print audit summary
   */
  private printSummary(plan: BatchAuditPlan): void {
    console.log("📊 AUDIT SUMMARY");
    console.log("================");
    console.log(`Total Commits Analyzed: ${plan.analysis.totalCommits}`);
    console.log(`Enhanced System Compliant: ${plan.analysis.enhancedCompliant} (${plan.analysis.complianceRate}%)`);
    console.log(`Non-Compliant: ${plan.analysis.nonCompliant}`);
    console.log(`Average Score: ${plan.analysis.averageScore}/100`);
    console.log("");
    console.log("🔄 SYNC STATUS");
    console.log("==============");
    console.log(`Local Commits: ${plan.analysis.syncStatus.localCommits}`);
    console.log(`Remote Commits: ${plan.analysis.syncStatus.remoteCommits}`);
    console.log(`Out of Sync: ${plan.analysis.syncStatus.outOfSync}`);
    if (plan.analysis.syncStatus.lastSync) {
      console.log(`Last Sync: ${plan.analysis.syncStatus.lastSync}`);
    }
    console.log("");
    console.log("📋 BATCH PLAN");
    console.log("=============");
    console.log(`Total Batches: ${plan.batchPlan.totalBatches}`);
    console.log(`Estimated Time: ${plan.batchPlan.estimatedTotalTime} minutes`);
    console.log("");
    console.log("🎯 RECOMMENDATIONS");
    console.log("==================");
    plan.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
      console.log(`   Impact: ${rec.impact}`);
      console.log(`   Effort: ${rec.effort}`);
      console.log("");
    });
  }

  /**
   * Save audit plan to fossils directory
   */
  saveAuditPlan(plan: BatchAuditPlan, filename?: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultFilename = `fossils/commit_audits/batch-audit-plan-${timestamp}.json`;
    const finalFilename = filename || defaultFilename;

    // Ensure fossils/commit_audits directory exists
    const dir = finalFilename.split("/").slice(0, -1).join("/");
    if (!existsSync(dir)) {
      execSync(`mkdir -p ${dir}`);
    }

    writeFileSync(finalFilename, JSON.stringify(plan, null, 2));
    console.log(`💾 Audit plan saved to: ${finalFilename}`);

    // Also save as YAML fossil for enhanced system compliance
    const yamlFilename = finalFilename.replace(".json", ".yml");
    const yamlContent = this.convertToYaml(plan);
    writeFileSync(yamlFilename, yamlContent);
    console.log(`💾 YAML fossil saved to: ${yamlFilename}`);
  }

  /**
   * Convert audit plan to YAML format
   */
  private convertToYaml(plan: BatchAuditPlan): string {
    const yamlLines: string[] = [];
    
    yamlLines.push("# Enhanced Commit Message System - Batch Audit Plan");
    yamlLines.push(`# Generated: ${plan.metadata.createdAt}`);
    yamlLines.push(`# Plan ID: ${plan.metadata.planId}`);
    yamlLines.push("");
    
    yamlLines.push("metadata:");
    yamlLines.push(`  plan_id: "${plan.metadata.planId}"`);
    yamlLines.push(`  created_at: "${plan.metadata.createdAt}"`);
    yamlLines.push(`  author: "${plan.metadata.author}"`);
    yamlLines.push(`  target_commits: ${plan.metadata.targetCommits}`);
    yamlLines.push(`  audit_scope: "${plan.metadata.auditScope}"`);
    yamlLines.push(`  enhanced_system_compliance: ${plan.metadata.enhancedSystemCompliance}`);
    yamlLines.push("");
    
    yamlLines.push("analysis:");
    yamlLines.push(`  total_commits: ${plan.analysis.totalCommits}`);
    yamlLines.push(`  enhanced_compliant: ${plan.analysis.enhancedCompliant}`);
    yamlLines.push(`  non_compliant: ${plan.analysis.nonCompliant}`);
    yamlLines.push(`  average_score: ${plan.analysis.averageScore}`);
    yamlLines.push(`  compliance_rate: ${plan.analysis.complianceRate}`);
    yamlLines.push("  sync_status:");
    yamlLines.push(`    local_commits: ${plan.analysis.syncStatus.localCommits}`);
    yamlLines.push(`    remote_commits: ${plan.analysis.syncStatus.remoteCommits}`);
    yamlLines.push(`    out_of_sync: ${plan.analysis.syncStatus.outOfSync}`);
    if (plan.analysis.syncStatus.lastSync) {
      yamlLines.push(`    last_sync: "${plan.analysis.syncStatus.lastSync}"`);
    }
    yamlLines.push("");
    
    yamlLines.push("recommendations:");
    plan.recommendations.forEach((rec, index) => {
      yamlLines.push(`  - priority: "${rec.priority}"`);
      yamlLines.push(`    action: "${rec.action}"`);
      yamlLines.push(`    impact: "${rec.impact}"`);
      yamlLines.push(`    effort: "${rec.effort}"`);
    });
    yamlLines.push("");
    
    yamlLines.push("batch_plan:");
    yamlLines.push(`  total_batches: ${plan.batchPlan.totalBatches}`);
    yamlLines.push(`  estimated_total_time: ${plan.batchPlan.estimatedTotalTime}`);
    yamlLines.push("  batches:");
    plan.batchPlan.batches.forEach(batch => {
      yamlLines.push(`    - batch_number: ${batch.batchNumber}`);
      yamlLines.push(`      priority: "${batch.priority}"`);
      yamlLines.push(`      estimated_time: ${batch.estimatedTime}`);
      yamlLines.push("      commits:");
      batch.commits.forEach(commit => {
        yamlLines.push(`        - "${commit}"`);
      });
    });
    
    return yamlLines.join("\n");
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const commitLimit = parseInt(args[0] || '50');
  const outputFile = args[1] || undefined;

  try {
    const auditor = new EnhancedCommitMessageBatchAuditor();
    const auditPlan = await auditor.executeAudit(commitLimit);
    
    if (outputFile) {
      auditor.saveAuditPlan(auditPlan, outputFile);
    } else {
      auditor.saveAuditPlan(auditPlan);
    }

    console.log("");
    console.log("🎉 Batch audit plan completed successfully!");
    console.log("📋 Next steps:");
    console.log("   1. Review the audit results");
    console.log("   2. Execute the batch plan to fix non-compliant commits");
    console.log("   3. Set up pre-commit hooks for future compliance");
    console.log("   4. Monitor compliance rates over time");

  } catch (error) {
    console.error("❌ Error executing batch audit:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

export { EnhancedCommitMessageBatchAuditor, BatchAuditPlanSchema };