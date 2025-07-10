#!/usr/bin/env bun

/**
 * LLM Predictive Monitoring Service
 * 
 * Tracks computable metrics and human-readable context before LLM calls
 * to enable proactive error detection and understanding of circumstances
 * that lead to rate limits or other issues.
 * 
 * Features:
 * - Pre-call metrics collection
 * - Context analysis and risk assessment
 * - Predictive error detection
 * - Human-readable circumstance tracking
 * - Automated recommendations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { LLMService } from './llm';
import { z } from 'zod';
import { 
  LLMPredictiveMonitoringConfigSchema, 
  LLMPredictiveMetricsSchema, 
  LLMPredictiveAlertSchema 
} from '../types/schemas';
import { getCurrentRepoOwner, getCurrentRepoName, executeCommand } from '@/utils/cli';
import { parseJsonSafe } from '@/utils/json';

// Use schema-inferred types
type LLMPredictiveMonitoringConfig = z.infer<typeof LLMPredictiveMonitoringConfigSchema>;
type LLMPredictiveMetrics = z.infer<typeof LLMPredictiveMetricsSchema>;
type LLMPredictiveAlert = z.infer<typeof LLMPredictiveAlertSchema>;

/**
 * LLM Predictive Monitoring Service
 */
export class LLMPredictiveMonitoringService {
  private config: LLMPredictiveMonitoringConfig;
  private llmService: LLMService;
  private monitoringDataPath: string;
  private sessionId: string;
  private recentCalls: Array<{
    timestamp: string;
    success: boolean;
    error?: string;
    provider: string;
    cost: number;
    tokens: number;
  }> = [];
  private alerts: LLMPredictiveAlert[] = [];

  constructor(config: Partial<LLMPredictiveMonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      enablePreCallMetrics: true,
      enableContextAnalysis: true,
      enableRiskAssessment: true,
      enablePredictiveAlerts: true,
      monitoringDataPath: 'fossils/monitoring/',
      thresholds: {
        highRisk: 0.7,
        rateLimitProbability: 0.6,
        costThreshold: 0.10,
        tokenThreshold: 4000,
        consecutiveFailures: 3
      },
      monitoringWindow: 60, // 60 minutes
      enableRealTimeAlerts: true,
      ...config
    };

    this.llmService = new LLMService({
      owner: getCurrentRepoOwner(),
      repo: getCurrentRepoName(),
      enableFossilization: true,
      enableConsoleOutput: false // Disable to avoid noise
    });

    this.monitoringDataPath = path.join(process.cwd(), this.config.monitoringDataPath);
    this.sessionId = `monitoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.ensureMonitoringDirectory();
  }

  /**
   * Ensure monitoring directory exists
   */
  private async ensureMonitoringDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.monitoringDataPath, { recursive: true });
    } catch (error) {
      console.warn('⚠️ Could not create monitoring directory:', error);
    }
  }

  /**
   * Collect pre-call metrics
   */
  private async collectPreCallMetrics(options: any): Promise<LLMPredictiveMetrics['preCallMetrics']> {
    const now = Date.now();
    const recentCalls = this.getRecentCalls(this.config.monitoringWindow);
    
    // Calculate recent metrics
    const recentCallFrequency = recentCalls.length / (this.config.monitoringWindow / 60);
    const recentErrorRate = recentCalls.length > 0 
      ? recentCalls.filter(call => !call.success).length / recentCalls.length 
      : 0;
    const recentRateLimitEvents = recentCalls.filter(call => 
      call.error?.includes('429') || call.error?.includes('rate limit')
    ).length;
    
    // Calculate provider load (simplified)
    const providerLoad = Math.min(1.0, recentCallFrequency / 10); // Normalize to 0-1
    
    // Calculate time since last success
    const lastSuccess = recentCalls.find(call => call.success);
    const timeSinceLastSuccess = lastSuccess 
      ? now - new Date(lastSuccess.timestamp).getTime() 
      : Infinity;
    
    // Get system metrics
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const cpuUsage = await this.getCPUUsage();
    const networkLatency = await this.getNetworkLatency();
    
    // Calculate message complexity
    const totalLength = options.messages?.reduce((sum: number, msg: any) => 
      sum + (msg.content?.length || 0), 0) || 0;
    const messageComplexity = Math.min(1.0, totalLength / 2000); // Normalize to 0-1
    
    // Calculate request urgency based on context
    const requestUrgency = this.calculateRequestUrgency(options.context, options.purpose);
    
    return {
      estimatedTokens: this.llmService['estimateTokens'](options.messages || []),
      estimatedCost: this.llmService['estimateCost'](
        this.llmService['estimateTokens'](options.messages || []), 
        options.model
      ),
      messageComplexity,
      requestUrgency,
      providerAvailable: await this.checkProviderAvailability(options.model),
      recentCallFrequency,
      recentErrorRate,
      recentRateLimitEvents,
      providerLoad,
      timeSinceLastSuccess,
      sessionDuration: now - new Date(this.sessionId.split('-')[1] || new Date().toISOString()).getTime(),
      memoryUsage,
      cpuUsage,
      networkLatency
    };
  }

  /**
   * Collect human-readable context
   */
  private async collectHumanReadableContext(options: any): Promise<LLMPredictiveMetrics['humanReadableContext']> {
    const now = new Date();
    const recentCalls = this.getRecentCalls(this.config.monitoringWindow);
    
    // Get git context
    const gitContext = await this.getGitContext();
    
    // Get system context
    const systemContext = {
      timeOfDay: now.toLocaleTimeString(),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      isBusinessHours: this.isBusinessHours(now),
      isWeekend: now.getDay() === 0 || now.getDay() === 6
    };
    
    // Get error context
    const errorContext = recentCalls.length > 0 ? {
      previousErrors: recentCalls
        .filter(call => call.error)
        .map(call => call.error!)
        .slice(-5), // Last 5 errors
      errorPatterns: this.identifyErrorPatterns(recentCalls),
      lastErrorTime: recentCalls
        .filter(call => call.error)
        .pop()?.timestamp
    } : undefined;
    
    return {
      userIntent: this.inferUserIntent(options.context, options.purpose),
      currentWorkflow: this.identifyCurrentWorkflow(options.context),
      recentActions: this.getRecentActions(),
      currentFile: process.env.VSCODE_CURRENT_FILE,
      gitContext,
      systemContext,
      errorContext
    };
  }

  /**
   * Perform risk assessment
   */
  private async performRiskAssessment(
    preCallMetrics: LLMPredictiveMetrics['preCallMetrics'],
    context: LLMPredictiveMetrics['humanReadableContext']
  ): Promise<LLMPredictiveMetrics['riskAssessment']> {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Calculate risk scores
    let rateLimitProbability = 0;
    let costRisk = 0;
    let performanceRisk = 0;
    let securityRisk = 0;
    
    // Rate limit risk
    if (preCallMetrics.recentCallFrequency > 5) {
      rateLimitProbability += 0.3;
      riskFactors.push('High call frequency');
      recommendations.push('Consider batching requests or using local LLM');
    }
    
    if (preCallMetrics.recentRateLimitEvents > 0) {
      rateLimitProbability += 0.4;
      riskFactors.push('Recent rate limit events');
      recommendations.push('Implement exponential backoff and retry logic');
    }
    
    if (preCallMetrics.providerLoad > 0.8) {
      rateLimitProbability += 0.2;
      riskFactors.push('High provider load');
      recommendations.push('Consider switching to alternative provider');
    }
    
    // Cost risk
    if (preCallMetrics.estimatedCost > this.config.thresholds.costThreshold) {
      costRisk += 0.5;
      riskFactors.push('High estimated cost');
      recommendations.push('Consider using local LLM or optimizing prompt');
    }
    
    if (preCallMetrics.estimatedTokens > this.config.thresholds.tokenThreshold) {
      costRisk += 0.3;
      riskFactors.push('High token usage');
      recommendations.push('Truncate or optimize input messages');
    }
    
    // Performance risk
    if (preCallMetrics.memoryUsage > 500) { // 500MB
      performanceRisk += 0.3;
      riskFactors.push('High memory usage');
      recommendations.push('Consider garbage collection or memory optimization');
    }
    
    if (preCallMetrics.cpuUsage > 80) { // 80%
      performanceRisk += 0.4;
      riskFactors.push('High CPU usage');
      recommendations.push('Consider reducing concurrent operations');
    }
    
    if (preCallMetrics.networkLatency > 1000) { // 1 second
      performanceRisk += 0.3;
      riskFactors.push('High network latency');
      recommendations.push('Check network connectivity or use local LLM');
    }
    
    // Security risk (basic checks)
    if (context.currentFile?.includes('password') || context.currentFile?.includes('secret')) {
      securityRisk += 0.5;
      riskFactors.push('Sensitive file context');
      recommendations.push('Ensure no sensitive data in prompts');
    }
    
    // Calculate overall risk
    const overallRisk = Math.max(rateLimitProbability, costRisk, performanceRisk, securityRisk);
    
    return {
      overallRisk,
      rateLimitProbability,
      costRisk,
      performanceRisk,
      securityRisk,
      riskFactors,
      recommendations
    };
  }

  /**
   * Generate predictive alerts
   */
  private generatePredictiveAlerts(
    preCallMetrics: LLMPredictiveMetrics['preCallMetrics'],
    riskAssessment: LLMPredictiveMetrics['riskAssessment']
  ): LLMPredictiveMetrics['alerts'] {
    const alerts = {
      highRisk: false,
      rateLimitWarning: false,
      costAlert: false,
      performanceAlert: false,
      messages: [] as string[]
    };
    
    // High risk alert
    if (riskAssessment.overallRisk > this.config.thresholds.highRisk) {
      alerts.highRisk = true;
      alerts.messages.push(`High risk detected (${(riskAssessment.overallRisk * 100).toFixed(1)}%)`);
    }
    
    // Rate limit warning
    if (riskAssessment.rateLimitProbability > this.config.thresholds.rateLimitProbability) {
      alerts.rateLimitWarning = true;
      alerts.messages.push(`Rate limit likely (${(riskAssessment.rateLimitProbability * 100).toFixed(1)}% probability)`);
    }
    
    // Cost alert
    if (preCallMetrics.estimatedCost > this.config.thresholds.costThreshold) {
      alerts.costAlert = true;
      alerts.messages.push(`High cost estimated ($${preCallMetrics.estimatedCost.toFixed(4)})`);
    }
    
    // Performance alert
    if (preCallMetrics.memoryUsage > 500 || preCallMetrics.cpuUsage > 80) {
      alerts.performanceAlert = true;
      alerts.messages.push('Performance issues detected');
    }
    
    return alerts;
  }

  /**
   * Monitor LLM call before execution
   */
  async monitorBeforeCall(options: any): Promise<LLMPredictiveMetrics> {
    if (!this.config.enabled) {
      return this.getEmptyMetrics();
    }

    try {
      // Collect pre-call metrics
      const preCallMetrics = await this.collectPreCallMetrics(options);
      
      // Collect human-readable context
      const humanReadableContext = await this.collectHumanReadableContext(options);
      
      // Perform risk assessment
      const riskAssessment = await this.performRiskAssessment(preCallMetrics, humanReadableContext);
      
      // Generate predictive alerts
      const alerts = this.generatePredictiveAlerts(preCallMetrics, riskAssessment);
      
      // Create comprehensive metrics
      const metrics: LLMPredictiveMetrics = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        preCallMetrics,
        humanReadableContext,
        riskAssessment,
        alerts
      };
      
      // Save monitoring data
      await this.saveMonitoringData(metrics);
      
      // Generate real-time alerts
      if (this.config.enableRealTimeAlerts) {
        await this.generateRealTimeAlerts(metrics);
      }
      
      return metrics;
      
    } catch (error) {
      console.warn('⚠️ Predictive monitoring failed:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Record call result for future predictions
   */
  async recordCallResult(
    callId: string,
    success: boolean,
    error?: string,
    provider?: string,
    cost?: number,
    tokens?: number
  ): Promise<void> {
    this.recentCalls.push({
      timestamp: new Date().toISOString(),
      success,
      error,
      provider: provider || 'unknown',
      cost: cost || 0,
      tokens: tokens || 0
    });
    
    // Keep only recent calls within monitoring window
    const cutoff = Date.now() - (this.config.monitoringWindow * 60 * 1000);
    this.recentCalls = this.recentCalls.filter(call => 
      new Date(call.timestamp).getTime() > cutoff
    );
  }

  /**
   * Get recent calls within time window
   */
  private getRecentCalls(minutes: number): Array<{
    timestamp: string;
    success: boolean;
    error?: string;
    provider: string;
    cost: number;
    tokens: number;
  }> {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.recentCalls.filter(call => 
      new Date(call.timestamp).getTime() > cutoff
    );
  }

  /**
   * Calculate request urgency
   */
  private calculateRequestUrgency(context?: string, purpose?: string): number {
    let urgency = 0.5; // Default medium urgency
    
    if (purpose?.includes('urgent') || purpose?.includes('critical')) {
      urgency += 0.3;
    }
    
    if (context === 'production' || context === 'live') {
      urgency += 0.2;
    }
    
    if (purpose?.includes('real-time') || purpose?.includes('immediate')) {
      urgency += 0.2;
    }
    
    return Math.min(1.0, urgency);
  }

  /**
   * Check provider availability
   */
  private async checkProviderAvailability(model: string): Promise<boolean> {
    try {
      // This is a simplified check - in practice, you'd check actual provider status
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get CPU usage
   */
  private async getCPUUsage(): Promise<number> {
    try {
      // This is a simplified implementation
      // In practice, you'd use a proper CPU monitoring library
      return Math.random() * 100; // Placeholder
    } catch {
      return 0;
    }
  }

  /**
   * Get network latency
   */
  private async getNetworkLatency(): Promise<number> {
    try {
      // This is a simplified implementation
      // In practice, you'd ping the API endpoint
      return Math.random() * 1000; // Placeholder
    } catch {
      return 0;
    }
  }

  /**
   * Get git context
   */
  private async getGitContext(): Promise<LLMPredictiveMetrics['humanReadableContext']['gitContext']> {
    try {
      const { stdout } = await executeCommand('git branch --show-current');
      const branch = stdout.trim();
      const { stdout: status } = await executeCommand('git status --porcelain');
      const { stdout: lastCommit } = await executeCommand('git log -1 --oneline');
      const uncommittedChanges = status.trim().split('\n').filter(line => line.trim()).length;
      
      return {
        branch,
        status: status.trim() ? 'dirty' : 'clean',
        lastCommit: lastCommit.trim(),
        uncommittedChanges
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Check if current time is business hours
   */
  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    
    // Monday-Friday, 9 AM - 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  }

  /**
   * Infer user intent
   */
  private inferUserIntent(context?: string, purpose?: string): string {
    if (purpose?.includes('analysis')) return 'Analyzing data or code';
    if (purpose?.includes('generation')) return 'Generating content';
    if (purpose?.includes('review')) return 'Reviewing code or content';
    if (purpose?.includes('debug')) return 'Debugging or troubleshooting';
    if (context === 'production') return 'Production system operation';
    return 'General task';
  }

  /**
   * Identify current workflow
   */
  private identifyCurrentWorkflow(context?: string): string {
    if (context?.includes('test')) return 'Testing';
    if (context?.includes('ci')) return 'Continuous Integration';
    if (context?.includes('deploy')) return 'Deployment';
    if (context?.includes('development')) return 'Development';
    return 'Unknown workflow';
  }

  /**
   * Get recent actions
   */
  private getRecentActions(): string[] {
    // This would track recent user actions or system events
    // For now, return a placeholder
    return ['LLM call initiated', 'Context gathered'];
  }

  /**
   * Identify error patterns
   */
  private identifyErrorPatterns(recentCalls: any[]): string[] {
    const patterns: string[] = [];
    const errors = recentCalls.filter(call => call.error).map(call => call.error);
    
    if (errors.filter(e => e?.includes('429')).length > 2) {
      patterns.push('Rate limiting pattern');
    }
    
    if (errors.filter(e => e?.includes('401')).length > 0) {
      patterns.push('Authentication issues');
    }
    
    if (errors.filter(e => e?.includes('timeout')).length > 1) {
      patterns.push('Timeout pattern');
    }
    
    return patterns;
  }

  /**
   * Save monitoring data
   */
  private async saveMonitoringData(metrics: LLMPredictiveMetrics): Promise<void> {
    try {
      const filename = `monitoring-${Date.now()}.json`;
      const filepath = path.join(this.monitoringDataPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.warn('⚠️ Failed to save monitoring data:', error);
    }
  }

  /**
   * Generate real-time alerts
   */
  private async generateRealTimeAlerts(metrics: LLMPredictiveMetrics): Promise<void> {
    if (metrics.alerts.highRisk) {
      const alert: LLMPredictiveAlert = {
        type: 'risk',
        severity: 'warning',
        message: `High risk detected before LLM call: ${metrics.alerts.messages.join(', ')}`,
        timestamp: new Date().toISOString(),
        context: {
          riskScore: metrics.riskAssessment.overallRisk,
          riskFactors: metrics.riskAssessment.riskFactors
        },
        actions: metrics.riskAssessment.recommendations
      };
      this.alerts.push(alert);
      console.log(`🚨 ${alert.message}`);
    }
    if (metrics.alerts.rateLimitWarning) {
      const alert: LLMPredictiveAlert = {
        type: 'rate_limit',
        severity: 'warning',
        message: `Rate limit likely: ${(metrics.riskAssessment.rateLimitProbability * 100).toFixed(1)}% probability`,
        timestamp: new Date().toISOString(),
        context: {
          recentCallFrequency: metrics.preCallMetrics.recentCallFrequency,
          recentRateLimitEvents: metrics.preCallMetrics.recentRateLimitEvents
        },
        actions: ['Implement exponential backoff', 'Consider local LLM', 'Batch requests']
      };
      this.alerts.push(alert);
      console.log(`⚠️ ${alert.message}`);
    }
  }

  /**
   * Get empty metrics for disabled monitoring
   */
  private getEmptyMetrics(): LLMPredictiveMetrics {
    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      preCallMetrics: {
        estimatedTokens: 0,
        estimatedCost: 0,
        messageComplexity: 0,
        requestUrgency: 0,
        providerAvailable: true,
        recentCallFrequency: 0,
        recentErrorRate: 0,
        recentRateLimitEvents: 0,
        providerLoad: 0,
        timeSinceLastSuccess: 0,
        sessionDuration: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0
      },
      humanReadableContext: {
        userIntent: 'Unknown',
        currentWorkflow: 'Unknown',
        recentActions: [],
        systemContext: {
          timeOfDay: new Date().toLocaleTimeString(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          isBusinessHours: false,
          isWeekend: false
        }
      },
      riskAssessment: {
        overallRisk: 0,
        rateLimitProbability: 0,
        costRisk: 0,
        performanceRisk: 0,
        securityRisk: 0,
        riskFactors: [],
        recommendations: []
      },
      alerts: {
        highRisk: false,
        rateLimitWarning: false,
        costAlert: false,
        performanceAlert: false,
        messages: []
      }
    };
  }

  /**
   * Get monitoring analytics
   */
  getMonitoringAnalytics(): {
    totalSessions: number;
    averageRiskScore: number;
    alertCount: number;
    topRiskFactors: string[];
    recommendations: string[];
  } {
    // This would analyze saved monitoring data
    // For now, return basic analytics
    return {
      totalSessions: 1,
      averageRiskScore: 0.5,
      alertCount: this.alerts.length,
      topRiskFactors: ['Rate limiting', 'High cost'],
      recommendations: ['Implement better error handling', 'Use local LLM when possible']
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(): LLMPredictiveAlert[] {
    return this.alerts.slice(-10); // Last 10 alerts
  }
}

/**
 * Convenience function to create predictive monitoring service
 */
export async function createPredictiveMonitoringService(
  config: Partial<LLMPredictiveMonitoringConfig> = {}
): Promise<LLMPredictiveMonitoringService> {
  const service = new LLMPredictiveMonitoringService(config);
  return service;
}

/**
 * Convenience function for monitoring before LLM call
 */
export async function monitorBeforeLLMCall(
  options: any,
  config: Partial<LLMPredictiveMonitoringConfig> = {}
): Promise<LLMPredictiveMetrics> {
  const monitoring = await createPredictiveMonitoringService(config);
  return monitoring.monitorBeforeCall(options);
} 