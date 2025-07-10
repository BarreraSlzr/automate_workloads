#!/usr/bin/env bun

/**
 * LLM Predictive Monitoring CLI
 * 
 * Demonstrates tracking computable metrics and human-readable context
 * before LLM calls to understand circumstances that lead to errors.
 */

import { Command } from 'commander';
import { LLMPredictiveMonitoringService, monitorBeforeLLMCall } from '../services/llmPredictiveMonitoring';
import { LLMService } from '../services/llm';
import { 
  LLMPredictiveMonitoringConfigSchema,
  LLMPredictiveMetricsSchema 
} from '../types/schemas';
import { promises as fs } from 'fs';
import path from 'path';
import { parseJsonSafe } from '@/utils/json';
import { getCurrentRepoOwner, getCurrentRepoName } from '@/utils/cli';

const program = new Command();

program
  .name('llm-predictive-monitoring')
  .description('Monitor LLM calls before execution to predict and prevent errors')
  .version('1.0.0');

// Monitor before call command
program
  .command('monitor-before-call')
  .description('Monitor and analyze circumstances before making an LLM call')
  .option('--model <model>', 'LLM model to use', 'gpt-3.5-turbo')
  .option('--context <context>', 'Context for the call', 'general')
  .option('--purpose <purpose>', 'Purpose of the call', 'analysis')
  .option('--value-score <score>', 'Value score (0-1)', '0.7')
  .option('--message <message>', 'Message content', 'Hello, how are you?')
  .option('--config <file>', 'Monitoring configuration file')
  .option('--output <file>', 'Output file for monitoring results')
  .option('--execute', 'Actually execute the LLM call after monitoring')
  .action(async (options) => {
    try {
      console.log('🔍 LLM Predictive Monitoring - Pre-call Analysis\n');
      
      // Load configuration
      let config = {};
      if (options.config) {
        const configData = await fs.readFile(options.config, 'utf-8');
        config = parseJsonSafe(configData, 'cli:llm-predictive-monitoring:configData');
      }
      
      // Validate configuration
      const validatedConfig = LLMPredictiveMonitoringConfigSchema.parse(config);
      
      // Create monitoring service
      const monitoring = new LLMPredictiveMonitoringService(validatedConfig);
      
      // Prepare LLM call options
      const llmOptions = {
        model: options.model,
        messages: [{ role: 'user' as const, content: options.message }],
        context: options.context,
        purpose: options.purpose,
        valueScore: parseFloat(options.valueScore)
      };
      
      console.log('📊 Collecting pre-call metrics and context...');
      
      // Monitor before call
      const metrics = await monitoring.monitorBeforeCall(llmOptions);
      
      // Validate metrics
      const validatedMetrics = LLMPredictiveMetricsSchema.parse(metrics);
      
      // Display results
      console.log('\n📈 Pre-call Analysis Results:');
      console.log('================================');
      
      // Pre-call metrics
      console.log('\n🔢 Computable Metrics:');
      console.log(`   Estimated Tokens: ${validatedMetrics.preCallMetrics.estimatedTokens}`);
      console.log(`   Estimated Cost: $${validatedMetrics.preCallMetrics.estimatedCost.toFixed(4)}`);
      console.log(`   Message Complexity: ${(validatedMetrics.preCallMetrics.messageComplexity * 100).toFixed(1)}%`);
      console.log(`   Request Urgency: ${(validatedMetrics.preCallMetrics.requestUrgency * 100).toFixed(1)}%`);
      console.log(`   Recent Call Frequency: ${validatedMetrics.preCallMetrics.recentCallFrequency.toFixed(2)} calls/min`);
      console.log(`   Recent Error Rate: ${(validatedMetrics.preCallMetrics.recentErrorRate * 100).toFixed(1)}%`);
      console.log(`   Recent Rate Limit Events: ${validatedMetrics.preCallMetrics.recentRateLimitEvents}`);
      console.log(`   Provider Load: ${(validatedMetrics.preCallMetrics.providerLoad * 100).toFixed(1)}%`);
      console.log(`   Memory Usage: ${validatedMetrics.preCallMetrics.memoryUsage.toFixed(1)} MB`);
      console.log(`   CPU Usage: ${validatedMetrics.preCallMetrics.cpuUsage.toFixed(1)}%`);
      console.log(`   Network Latency: ${validatedMetrics.preCallMetrics.networkLatency.toFixed(0)}ms`);
      
      // Human-readable context
      console.log('\n👤 Human-Readable Context:');
      console.log(`   User Intent: ${validatedMetrics.humanReadableContext.userIntent}`);
      console.log(`   Current Workflow: ${validatedMetrics.humanReadableContext.currentWorkflow}`);
      console.log(`   Recent Actions: ${validatedMetrics.humanReadableContext.recentActions.join(', ')}`);
      
      if (validatedMetrics.humanReadableContext.gitContext) {
        console.log(`   Git Branch: ${validatedMetrics.humanReadableContext.gitContext.branch}`);
        console.log(`   Git Status: ${validatedMetrics.humanReadableContext.gitContext.status}`);
        console.log(`   Uncommitted Changes: ${validatedMetrics.humanReadableContext.gitContext.uncommittedChanges}`);
      }
      
      console.log(`   Time of Day: ${validatedMetrics.humanReadableContext.systemContext.timeOfDay}`);
      console.log(`   Day of Week: ${validatedMetrics.humanReadableContext.systemContext.dayOfWeek}`);
      console.log(`   Business Hours: ${validatedMetrics.humanReadableContext.systemContext.isBusinessHours ? 'Yes' : 'No'}`);
      console.log(`   Weekend: ${validatedMetrics.humanReadableContext.systemContext.isWeekend ? 'Yes' : 'No'}`);
      
      if (validatedMetrics.humanReadableContext.errorContext) {
        console.log(`   Previous Errors: ${validatedMetrics.humanReadableContext.errorContext.previousErrors.length}`);
        console.log(`   Error Patterns: ${validatedMetrics.humanReadableContext.errorContext.errorPatterns.join(', ')}`);
      }
      
      // Risk assessment
      console.log('\n⚠️ Risk Assessment:');
      console.log(`   Overall Risk: ${(validatedMetrics.riskAssessment.overallRisk * 100).toFixed(1)}%`);
      console.log(`   Rate Limit Probability: ${(validatedMetrics.riskAssessment.rateLimitProbability * 100).toFixed(1)}%`);
      console.log(`   Cost Risk: ${(validatedMetrics.riskAssessment.costRisk * 100).toFixed(1)}%`);
      console.log(`   Performance Risk: ${(validatedMetrics.riskAssessment.performanceRisk * 100).toFixed(1)}%`);
      console.log(`   Security Risk: ${(validatedMetrics.riskAssessment.securityRisk * 100).toFixed(1)}%`);
      
      if (validatedMetrics.riskAssessment.riskFactors.length > 0) {
        console.log(`   Risk Factors: ${validatedMetrics.riskAssessment.riskFactors.join(', ')}`);
      }
      
      if (validatedMetrics.riskAssessment.recommendations.length > 0) {
        console.log(`   Recommendations: ${validatedMetrics.riskAssessment.recommendations.join(', ')}`);
      }
      
      // Alerts
      console.log('\n🚨 Predictive Alerts:');
      if (validatedMetrics.alerts.highRisk) {
        console.log('   🔴 HIGH RISK DETECTED');
      }
      if (validatedMetrics.alerts.rateLimitWarning) {
        console.log('   🟡 RATE LIMIT WARNING');
      }
      if (validatedMetrics.alerts.costAlert) {
        console.log('   🟠 COST ALERT');
      }
      if (validatedMetrics.alerts.performanceAlert) {
        console.log('   🔵 PERFORMANCE ALERT');
      }
      
      if (validatedMetrics.alerts.messages.length > 0) {
        console.log(`   Messages: ${validatedMetrics.alerts.messages.join(', ')}`);
      }
      
      // Decision recommendation
      console.log('\n💡 Decision Recommendation:');
      if (validatedMetrics.riskAssessment.overallRisk > 0.7) {
        console.log('   ❌ HIGH RISK - Consider postponing or using alternative approach');
      } else if (validatedMetrics.riskAssessment.overallRisk > 0.4) {
        console.log('   ⚠️ MEDIUM RISK - Proceed with caution and monitoring');
      } else {
        console.log('   ✅ LOW RISK - Safe to proceed');
      }
      
      // Save results
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(validatedMetrics, null, 2));
        console.log(`\n💾 Results saved to: ${options.output}`);
      }
      
      // Execute call if requested
      if (options.execute) {
        console.log('\n🚀 Executing LLM call...');
        
        const llmService = new LLMService({ owner: getCurrentRepoOwner(), repo: getCurrentRepoName() });
        const startTime = Date.now();
        
        try {
          const result = await llmService.callLLM({
            ...llmOptions,
            apiKey: process.env.OPENAI_API_KEY
          });
          
          const duration = Date.now() - startTime;
          
          // Record result for future predictions
          await monitoring.recordCallResult(
            `call-${Date.now()}`,
            true,
            undefined,
            'openai',
            validatedMetrics.preCallMetrics.estimatedCost,
            validatedMetrics.preCallMetrics.estimatedTokens
          );
          
          console.log(`✅ Call completed successfully in ${duration}ms`);
          console.log(`   Response: ${result.choices[0].message.content.substring(0, 100)}...`);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          
          // Record failure for future predictions
          await monitoring.recordCallResult(
            `call-${Date.now()}`,
            false,
            (error as Error).message,
            'openai',
            validatedMetrics.preCallMetrics.estimatedCost,
            validatedMetrics.preCallMetrics.estimatedTokens
          );
          
          console.log(`❌ Call failed after ${duration}ms`);
          console.log(`   Error: ${(error as Error).message}`);
        }
      }
      
      console.log('\n✨ Predictive monitoring analysis complete!');
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Analyze monitoring data command
program
  .command('analyze-monitoring')
  .description('Analyze historical monitoring data for patterns and insights')
  .option('--days <days>', 'Number of days to analyze', '7')
  .option('--output <file>', 'Output file for analysis results')
  .action(async (options) => {
    try {
      console.log('📊 Analyzing LLM Predictive Monitoring Data\n');
      
      const monitoring = new LLMPredictiveMonitoringService();
      const analytics = monitoring.getMonitoringAnalytics();
      const recentAlerts = monitoring.getRecentAlerts();
      
      console.log('📈 Monitoring Analytics:');
      console.log(`   Total Sessions: ${analytics.totalSessions}`);
      console.log(`   Average Risk Score: ${(analytics.averageRiskScore * 100).toFixed(1)}%`);
      console.log(`   Alert Count: ${analytics.alertCount}`);
      console.log(`   Top Risk Factors: ${analytics.topRiskFactors.join(', ')}`);
      
      if (analytics.recommendations.length > 0) {
        console.log(`   Recommendations: ${analytics.recommendations.join(', ')}`);
      }
      
      if (recentAlerts.length > 0) {
        console.log('\n🚨 Recent Alerts:');
        recentAlerts.forEach((alert, index) => {
          console.log(`   ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`);
          console.log(`      Type: ${alert.type}, Time: ${alert.timestamp}`);
          if (alert.actions.length > 0) {
            console.log(`      Actions: ${alert.actions.join(', ')}`);
          }
        });
      }
      
      // Save analysis
      if (options.output) {
        const analysis = {
          analytics,
          recentAlerts,
          analysisDate: new Date().toISOString(),
          daysAnalyzed: parseInt(options.days)
        };
        
        await fs.writeFile(options.output, JSON.stringify(analysis, null, 2));
        console.log(`\n💾 Analysis saved to: ${options.output}`);
      }
      
      console.log('\n✨ Monitoring analysis complete!');
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Generate monitoring report command
program
  .command('generate-report')
  .description('Generate a comprehensive monitoring report')
  .option('--days <days>', 'Number of days to include in report', '7')
  .option('--format <format>', 'Report format (json, markdown)', 'markdown')
  .option('--output <file>', 'Output file for report')
  .action(async (options) => {
    try {
      console.log('📋 Generating LLM Predictive Monitoring Report\n');
      
      const monitoring = new LLMPredictiveMonitoringService();
      const analytics = monitoring.getMonitoringAnalytics();
      const recentAlerts = monitoring.getRecentAlerts();
      
      let report: string;
      
      if (options.format === 'json') {
        report = JSON.stringify({
          reportDate: new Date().toISOString(),
          daysAnalyzed: parseInt(options.days),
          analytics,
          recentAlerts,
          summary: {
            totalSessions: analytics.totalSessions,
            averageRiskScore: analytics.averageRiskScore,
            alertCount: analytics.alertCount,
            topRiskFactors: analytics.topRiskFactors,
            recommendations: analytics.recommendations
          }
        }, null, 2);
      } else {
        // Markdown format
        report = `# LLM Predictive Monitoring Report

**Generated:** ${new Date().toLocaleString()}
**Period:** Last ${options.days} days

## 📊 Analytics Summary

- **Total Sessions:** ${analytics.totalSessions}
- **Average Risk Score:** ${(analytics.averageRiskScore * 100).toFixed(1)}%
- **Alert Count:** ${analytics.alertCount}

## ⚠️ Top Risk Factors

${analytics.topRiskFactors.map(factor => `- ${factor}`).join('\n')}

## 💡 Recommendations

${analytics.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🚨 Recent Alerts

${recentAlerts.map(alert => `
### ${alert.severity.toUpperCase()} - ${alert.type}
**Time:** ${alert.timestamp}
**Message:** ${alert.message}

**Actions:**
${alert.actions.map(action => `- ${action}`).join('\n')}
`).join('\n')}

## 📈 Key Insights

1. **Risk Patterns:** ${analytics.topRiskFactors.length > 0 ? analytics.topRiskFactors[0] : 'No patterns identified'}
2. **Alert Trends:** ${recentAlerts.length} alerts in the last ${options.days} days
3. **Recommendations:** ${analytics.recommendations.length} actionable recommendations

---
*Report generated by LLM Predictive Monitoring System*
`;
      }
      
      // Save report
      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(`💾 Report saved to: ${options.output}`);
      } else {
        console.log('\n' + report);
      }
      
      console.log('\n✨ Report generation complete!');
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Demo command
program
  .command('demo')
  .description('Run a demonstration of predictive monitoring')
  .option('--execute', 'Actually execute LLM calls in demo')
  .action(async (options) => {
    try {
      console.log('🎭 LLM Predictive Monitoring Demo\n');
      
      const monitoring = new LLMPredictiveMonitoringService({
        enableRealTimeAlerts: true,
        thresholds: {
          highRisk: 0.6,
          rateLimitProbability: 0.5,
          costThreshold: 0.05,
          tokenThreshold: 2000,
          consecutiveFailures: 2
        }
      });
      
      // Demo scenarios
      const scenarios = [
        {
          name: 'Low Risk Scenario',
          options: {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user' as const, content: 'Hello, how are you?' }],
            context: 'demo',
            purpose: 'greeting',
            valueScore: 0.3
          }
        },
        {
          name: 'Medium Risk Scenario',
          options: {
            model: 'gpt-4',
            messages: [{ role: 'user' as const, content: 'Please analyze this complex code and provide detailed recommendations for optimization and refactoring...'.repeat(10) }],
            context: 'production',
            purpose: 'code-analysis',
            valueScore: 0.8
          }
        },
        {
          name: 'High Risk Scenario',
          options: {
            model: 'gpt-4',
            messages: [{ role: 'user' as const, content: 'Generate a comprehensive analysis of the entire codebase including all dependencies, security vulnerabilities, performance bottlenecks, and architectural recommendations...'.repeat(20) }],
            context: 'production',
            purpose: 'urgent-analysis',
            valueScore: 0.9
          }
        }
      ];
      
      for (const scenario of scenarios) {
        console.log(`\n🔍 Scenario: ${scenario.name}`);
        console.log('='.repeat(50));
        
        const metrics = await monitoring.monitorBeforeCall(scenario.options);
        
        console.log(`Risk Score: ${(metrics.riskAssessment.overallRisk * 100).toFixed(1)}%`);
        console.log(`Rate Limit Probability: ${(metrics.riskAssessment.rateLimitProbability * 100).toFixed(1)}%`);
        console.log(`Estimated Cost: $${metrics.preCallMetrics.estimatedCost.toFixed(4)}`);
        console.log(`Estimated Tokens: ${metrics.preCallMetrics.estimatedTokens}`);
        
        if (metrics.alerts.highRisk) {
          console.log('🚨 HIGH RISK DETECTED');
        }
        if (metrics.alerts.rateLimitWarning) {
          console.log('⚠️ RATE LIMIT WARNING');
        }
        
        if (options.execute && metrics.riskAssessment.overallRisk < 0.8) {
          console.log('🚀 Executing call...');
          
          const llmService = new LLMService({ owner: getCurrentRepoOwner(), repo: getCurrentRepoName() });
          try {
            const result = await llmService.callLLM({
              ...scenario.options,
              apiKey: process.env.OPENAI_API_KEY
            });
            
            await monitoring.recordCallResult(
              `demo-${Date.now()}`,
              true,
              undefined,
              'openai',
              metrics.preCallMetrics.estimatedCost,
              metrics.preCallMetrics.estimatedTokens
            );
            
            console.log('✅ Call successful');
          } catch (error) {
            await monitoring.recordCallResult(
              `demo-${Date.now()}`,
              false,
              (error as Error).message,
              'openai',
              metrics.preCallMetrics.estimatedCost,
              metrics.preCallMetrics.estimatedTokens
            );
            
            console.log(`❌ Call failed: ${(error as Error).message}`);
          }
        }
      }
      
      console.log('\n✨ Demo complete!');
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(); 