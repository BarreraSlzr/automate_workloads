#!/usr/bin/env bun

/**
 * LLM Predictive Monitoring Demo
 * 
 * Demonstrates tracking computable metrics and human-readable context
 * before LLM calls to understand circumstances that lead to errors.
 * 
 * This example shows how to:
 * - Monitor LLM calls before execution
 * - Track computable metrics (tokens, cost, frequency, etc.)
 * - Collect human-readable context (user intent, workflow, git status)
 * - Assess risk before making calls
 * - Generate predictive alerts
 * - Record results for future predictions
 */

import { LLMPredictiveMonitoringService } from '../src/services/llmPredictiveMonitoring';
import { LLMService } from '../src/services/llm';
import { 
  LLMPredictiveMonitoringConfigSchema,
  LLMPredictiveMetricsSchema 
} from '../src/types/schemas';

/**
 * Demo configuration for predictive monitoring
 */
const demoConfig = {
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
  enableRealTimeAlerts: true
};

/**
 * Demo scenarios with different risk levels
 */
const demoScenarios = [
  {
    name: 'Low Risk - Simple Greeting',
    description: 'Basic greeting with low complexity and cost',
    options: {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user' as const, content: 'Hello, how are you today?' }],
      context: 'demo',
      purpose: 'greeting',
      valueScore: 0.3
    },
    expectedRisk: 'low'
  },
  {
    name: 'Medium Risk - Code Analysis',
    description: 'Moderate complexity with some risk factors',
    options: {
      model: 'gpt-4',
      messages: [{ 
        role: 'user' as const, 
        content: 'Please analyze this TypeScript function and suggest improvements for performance and readability: function processData(data: any[]) { return data.map(item => item.value).filter(val => val > 0).reduce((sum, val) => sum + val, 0); }' 
      }],
      context: 'development',
      purpose: 'code-analysis',
      valueScore: 0.7
    },
    expectedRisk: 'medium'
  },
  {
    name: 'High Risk - Complex Analysis',
    description: 'High complexity with multiple risk factors',
    options: {
      model: 'gpt-4',
      messages: [{ 
        role: 'user' as const, 
        content: 'Please provide a comprehensive analysis of the entire codebase including all dependencies, security vulnerabilities, performance bottlenecks, architectural recommendations, and refactoring suggestions. Consider all files, imports, and external dependencies. Provide detailed explanations for each finding and prioritize recommendations by impact and effort required.' 
      }],
      context: 'production',
      purpose: 'urgent-analysis',
      valueScore: 0.9
    },
    expectedRisk: 'high'
  }
];

/**
 * Display monitoring results in a formatted way
 */
function displayMonitoringResults(metrics: any, scenarioName: string): void {
  console.log(`\n📊 Monitoring Results for: ${scenarioName}`);
  console.log('='.repeat(60));
  
  // Pre-call metrics
  console.log('\n🔢 Computable Metrics:');
  console.log(`   Estimated Tokens: ${metrics.preCallMetrics.estimatedTokens}`);
  console.log(`   Estimated Cost: $${metrics.preCallMetrics.estimatedCost.toFixed(4)}`);
  console.log(`   Message Complexity: ${(metrics.preCallMetrics.messageComplexity * 100).toFixed(1)}%`);
  console.log(`   Request Urgency: ${(metrics.preCallMetrics.requestUrgency * 100).toFixed(1)}%`);
  console.log(`   Recent Call Frequency: ${metrics.preCallMetrics.recentCallFrequency.toFixed(2)} calls/min`);
  console.log(`   Recent Error Rate: ${(metrics.preCallMetrics.recentErrorRate * 100).toFixed(1)}%`);
  console.log(`   Recent Rate Limit Events: ${metrics.preCallMetrics.recentRateLimitEvents}`);
  console.log(`   Provider Load: ${(metrics.preCallMetrics.providerLoad * 100).toFixed(1)}%`);
  console.log(`   Memory Usage: ${metrics.preCallMetrics.memoryUsage.toFixed(1)} MB`);
  console.log(`   CPU Usage: ${metrics.preCallMetrics.cpuUsage.toFixed(1)}%`);
  console.log(`   Network Latency: ${metrics.preCallMetrics.networkLatency.toFixed(0)}ms`);
  
  // Human-readable context
  console.log('\n👤 Human-Readable Context:');
  console.log(`   User Intent: ${metrics.humanReadableContext.userIntent}`);
  console.log(`   Current Workflow: ${metrics.humanReadableContext.currentWorkflow}`);
  console.log(`   Recent Actions: ${metrics.humanReadableContext.recentActions.join(', ')}`);
  
  if (metrics.humanReadableContext.gitContext) {
    console.log(`   Git Branch: ${metrics.humanReadableContext.gitContext.branch}`);
    console.log(`   Git Status: ${metrics.humanReadableContext.gitContext.status}`);
    console.log(`   Uncommitted Changes: ${metrics.humanReadableContext.gitContext.uncommittedChanges}`);
  }
  
  console.log(`   Time of Day: ${metrics.humanReadableContext.systemContext.timeOfDay}`);
  console.log(`   Day of Week: ${metrics.humanReadableContext.systemContext.dayOfWeek}`);
  console.log(`   Business Hours: ${metrics.humanReadableContext.systemContext.isBusinessHours ? 'Yes' : 'No'}`);
  console.log(`   Weekend: ${metrics.humanReadableContext.systemContext.isWeekend ? 'Yes' : 'No'}`);
  
  if (metrics.humanReadableContext.errorContext) {
    console.log(`   Previous Errors: ${metrics.humanReadableContext.errorContext.previousErrors.length}`);
    console.log(`   Error Patterns: ${metrics.humanReadableContext.errorContext.errorPatterns.join(', ')}`);
  }
  
  // Risk assessment
  console.log('\n⚠️ Risk Assessment:');
  console.log(`   Overall Risk: ${(metrics.riskAssessment.overallRisk * 100).toFixed(1)}%`);
  console.log(`   Rate Limit Probability: ${(metrics.riskAssessment.rateLimitProbability * 100).toFixed(1)}%`);
  console.log(`   Cost Risk: ${(metrics.riskAssessment.costRisk * 100).toFixed(1)}%`);
  console.log(`   Performance Risk: ${(metrics.riskAssessment.performanceRisk * 100).toFixed(1)}%`);
  console.log(`   Security Risk: ${(metrics.riskAssessment.securityRisk * 100).toFixed(1)}%`);
  
  if (metrics.riskAssessment.riskFactors.length > 0) {
    console.log(`   Risk Factors: ${metrics.riskAssessment.riskFactors.join(', ')}`);
  }
  
  if (metrics.riskAssessment.recommendations.length > 0) {
    console.log(`   Recommendations: ${metrics.riskAssessment.recommendations.join(', ')}`);
  }
  
  // Alerts
  console.log('\n🚨 Predictive Alerts:');
  if (metrics.alerts.highRisk) {
    console.log('   🔴 HIGH RISK DETECTED');
  }
  if (metrics.alerts.rateLimitWarning) {
    console.log('   🟡 RATE LIMIT WARNING');
  }
  if (metrics.alerts.costAlert) {
    console.log('   🟠 COST ALERT');
  }
  if (metrics.alerts.performanceAlert) {
    console.log('   🔵 PERFORMANCE ALERT');
  }
  
  if (metrics.alerts.messages.length > 0) {
    console.log(`   Messages: ${metrics.alerts.messages.join(', ')}`);
  }
  
  // Decision recommendation
  console.log('\n💡 Decision Recommendation:');
  if (metrics.riskAssessment.overallRisk > 0.7) {
    console.log('   ❌ HIGH RISK - Consider postponing or using alternative approach');
  } else if (metrics.riskAssessment.overallRisk > 0.4) {
    console.log('   ⚠️ MEDIUM RISK - Proceed with caution and monitoring');
  } else {
    console.log('   ✅ LOW RISK - Safe to proceed');
  }
}

/**
 * Main demo function
 */
async function runPredictiveMonitoringDemo(): Promise<void> {
  console.log('🎭 LLM Predictive Monitoring Demo');
  console.log('==================================');
  console.log('This demo shows how to track computable metrics and human-readable context');
  console.log('before LLM calls to understand circumstances that lead to errors.\n');
  
  try {
    // Validate configuration
    const validatedConfig = LLMPredictiveMonitoringConfigSchema.parse(demoConfig);
    
    // Create monitoring service
    const monitoring = new LLMPredictiveMonitoringService(validatedConfig);
    
    console.log('✅ Predictive monitoring service initialized');
    console.log(`📁 Monitoring data will be saved to: ${validatedConfig.monitoringDataPath}`);
    
    // Run through demo scenarios
    for (const scenario of demoScenarios) {
      console.log(`\n🔍 Running scenario: ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Expected Risk: ${scenario.expectedRisk}`);
      
      // Monitor before call
      const metrics = await monitoring.monitorBeforeCall(scenario.options);
      
      // Validate metrics
      const validatedMetrics = LLMPredictiveMetricsSchema.parse(metrics);
      
      // Display results
      displayMonitoringResults(validatedMetrics, scenario.name);
      
      // Simulate call execution (without actually calling LLM)
      console.log('\n🚀 Simulating LLM call execution...');
      
      // Record simulated result for future predictions
      const callId = `demo-${Date.now()}-${(scenario.name || 'unknown').toLowerCase().replace(/\s+/g, '-')}`;
      await monitoring.recordCallResult(
        callId,
        true, // Simulate success
        undefined,
        'openai',
        validatedMetrics.preCallMetrics.estimatedCost,
        validatedMetrics.preCallMetrics.estimatedTokens
      );
      
      console.log('✅ Simulated call completed and recorded');
      
      // Add delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Show monitoring analytics
    console.log('\n📈 Monitoring Analytics Summary:');
    console.log('================================');
    
    const analytics = monitoring.getMonitoringAnalytics();
    console.log(`   Total Sessions: ${analytics.totalSessions}`);
    console.log(`   Average Risk Score: ${(analytics.averageRiskScore * 100).toFixed(1)}%`);
    console.log(`   Alert Count: ${analytics.alertCount}`);
    console.log(`   Top Risk Factors: ${analytics.topRiskFactors.join(', ')}`);
    
    if (analytics.recommendations.length > 0) {
      console.log(`   Recommendations: ${analytics.recommendations.join(', ')}`);
    }
    
    // Show recent alerts
    const recentAlerts = monitoring.getRecentAlerts();
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
    
    console.log('\n✨ Demo completed successfully!');
    console.log('\nKey Benefits of Predictive Monitoring:');
    console.log('   • Proactive error detection before LLM calls');
    console.log('   • Understanding of circumstances leading to errors');
    console.log('   • Computable metrics for systematic analysis');
    console.log('   • Human-readable context for debugging');
    console.log('   • Risk assessment and mitigation recommendations');
    console.log('   • Historical pattern analysis for continuous improvement');
    
  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Example of integrating predictive monitoring with actual LLM calls
 */
async function demonstrateIntegrationWithLLM(): Promise<void> {
  console.log('\n🔗 Integration Example: Predictive Monitoring + LLM Service');
  console.log('==========================================================');
  
  try {
    const monitoring = new LLMPredictiveMonitoringService(demoConfig);
    const llmService = new LLMService();
    
    const llmOptions = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user' as const, content: 'Explain the benefits of predictive monitoring in software development.' }],
      context: 'integration-demo',
      purpose: 'explanation',
      valueScore: 0.6
    };
    
    // Step 1: Monitor before call
    console.log('📊 Step 1: Monitoring before LLM call...');
    const metrics = await monitoring.monitorBeforeCall(llmOptions);
    
    console.log(`   Risk Score: ${(metrics.riskAssessment.overallRisk * 100).toFixed(1)}%`);
    console.log(`   Estimated Cost: $${metrics.preCallMetrics.estimatedCost.toFixed(4)}`);
    console.log(`   Rate Limit Probability: ${(metrics.riskAssessment.rateLimitProbability * 100).toFixed(1)}%`);
    
    // Step 2: Make decision based on monitoring
    if (metrics.riskAssessment.overallRisk > 0.7) {
      console.log('   ❌ Risk too high - skipping call');
      return;
    }
    
    // Step 3: Execute LLM call
    console.log('🚀 Step 2: Executing LLM call...');
    const startTime = Date.now();
    
    try {
      const result = await llmService.callLLM({
        ...llmOptions,
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const duration = Date.now() - startTime;
      
      // Step 4: Record successful result
      await monitoring.recordCallResult(
        `integration-${Date.now()}`,
        true,
        undefined,
        'openai',
        metrics.preCallMetrics.estimatedCost,
        metrics.preCallMetrics.estimatedTokens
      );
      
      console.log(`✅ Call completed successfully in ${duration}ms`);
      console.log(`   Response: ${result.choices[0].message.content.substring(0, 100)}...`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Step 4: Record failed result
      await monitoring.recordCallResult(
        `integration-${Date.now()}`,
        false,
        (error as Error).message,
        'openai',
        metrics.preCallMetrics.estimatedCost,
        metrics.preCallMetrics.estimatedTokens
      );
      
      console.log(`❌ Call failed after ${duration}ms`);
      console.log(`   Error: ${(error as Error).message}`);
    }
    
    console.log('✨ Integration example completed!');
    
  } catch (error) {
    console.error('❌ Integration example failed:', error instanceof Error ? error.message : error);
  }
}

// Run the demo
if (import.meta.main) {
  await runPredictiveMonitoringDemo();
  
  // Uncomment the line below to also run the integration example
  // await demonstrateIntegrationWithLLM();
} 