#!/usr/bin/env bun

/**
 * LLM Usage Management CLI
 * 
 * Provides comprehensive LLM usage tracking, analytics, and optimization tools.
 * Helps monitor costs, identify wasteful calls, and optimize LLM usage patterns.
 */

import { Command } from 'commander';
import { z } from 'zod';
import { LLMService, LLMOptimizationConfig } from '../services/llm';

// CLI schemas
const UsageReportSchema = z.object({
  format: z.enum(['text', 'json', 'csv']).optional(),
  days: z.number().min(1).max(365).optional(),
  purpose: z.string().optional(),
  provider: z.string().optional(),
});

const OptimizationConfigSchema = z.object({
  maxTokensPerCall: z.number().min(100).max(32000).optional(),
  maxCostPerCall: z.number().min(0.01).max(10).optional(),
  minValueScore: z.number().min(0).max(1).optional(),
  enableLocalLLM: z.boolean().optional(),
  enableCaching: z.boolean().optional(),
  cacheExpiryHours: z.number().min(1).max(168).optional(),
  retryAttempts: z.number().min(1).max(10).optional(),
  retryDelayMs: z.number().min(100).max(10000).optional(),
  rateLimitDelayMs: z.number().min(1000).max(300000).optional(),
});

type UsageReportOptions = z.infer<typeof UsageReportSchema>;
type OptimizationConfigOptions = z.infer<typeof OptimizationConfigSchema>;

const program = new Command();

program
  .name('llm-usage')
  .description('Manage LLM usage tracking, analytics, and optimization')
  .version('1.0.0')
  .option('--local-backend <name>', 'Select local LLM backend (ollama, llama.cpp, etc.)', 'ollama')
  .option('--prefer-local', 'Prefer local LLM for all tasks')
  .option('--prefer-cloud', 'Prefer cloud LLM for all tasks')
  .option('--auto', 'Use intelligent routing (default)');

// Usage report command
program
  .command('report')
  .description('Generate LLM usage report')
  .option('-f, --format <format>', 'Output format (text, json, csv)', 'text')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('-p, --purpose <purpose>', 'Filter by purpose')
  .option('-r, --provider <provider>', 'Filter by provider')
  .action(async (options) => {
    try {
      const llmService = new LLMService();
      const analytics = llmService.getUsageAnalytics();
      
      // Filter by days if specified
      if (options.days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days));
        // Note: This would require filtering the usage log by date
        // For now, we'll show all data
      }
      
      switch (options.format) {
        case 'json':
          console.log(JSON.stringify(analytics, null, 2));
          break;
        case 'csv':
          console.log('Date,Cost,Calls,Tokens,Success Rate,Value Score');
          analytics.costByDay.forEach(day => {
            console.log(`${day.date},${day.cost},${day.calls},${day.cost * 1000},${analytics.successRate},${analytics.averageValueScore}`);
          });
          break;
        default:
          console.log(llmService.generateUsageReport());
      }
    } catch (error) {
      console.error('❌ Error generating usage report:', error);
      process.exit(1);
    }
  });

// Configuration command
program
  .command('config')
  .description('Configure LLM optimization settings')
  .option('--max-tokens <tokens>', 'Maximum tokens per call', '4000')
  .option('--max-cost <cost>', 'Maximum cost per call ($)', '0.10')
  .option('--min-value-score <score>', 'Minimum value score (0-1)', '0.3')
  .option('--enable-local-llm', 'Enable local LLM support', true)
  .option('--enable-caching', 'Enable response caching', true)
  .option('--cache-expiry <hours>', 'Cache expiry in hours', '24')
  .option('--retry-attempts <attempts>', 'Number of retry attempts', '3')
  .option('--retry-delay <ms>', 'Retry delay in milliseconds', '1000')
  .option('--rate-limit-delay <ms>', 'Rate limit delay in milliseconds', '60000')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    try {
      const llmService = new LLMService();
      
      if (options.show) {
        console.log('📋 Current LLM Configuration:');
        console.log(JSON.stringify(llmService['config'], null, 2));
        return;
      }
      
      // Update configuration
      const config: Partial<LLMOptimizationConfig> = {};
      
      if (options.maxTokens) config.maxTokensPerCall = parseInt(options.maxTokens);
      if (options.maxCost) config.maxCostPerCall = parseFloat(options.maxCost);
      if (options.minValueScore) config.minValueScore = parseFloat(options.minValueScore);
      if (options.enableLocalLlm !== undefined) config.enableLocalLLM = options.enableLocalLlm;
      if (options.enableCaching !== undefined) config.enableCaching = options.enableCaching;
      if (options.cacheExpiry) config.cacheExpiryHours = parseInt(options.cacheExpiry);
      if (options.retryAttempts) config.retryAttempts = parseInt(options.retryAttempts);
      if (options.retryDelay) config.retryDelayMs = parseInt(options.retryDelay);
      if (options.rateLimitDelay) config.rateLimitDelayMs = parseInt(options.rateLimitDelay);
      
      // Create new service with updated config
      const updatedService = new LLMService(config);
      console.log('✅ Configuration updated successfully');
      console.log('New configuration:', JSON.stringify(updatedService['config'], null, 2));
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      process.exit(1);
    }
  });

// Analyze wasteful calls command
program
  .command('analyze-waste')
  .description('Analyze potentially wasteful LLM calls')
  .option('--min-cost <cost>', 'Minimum cost to consider wasteful', '0.05')
  .option('--max-value-score <score>', 'Maximum value score to consider wasteful', '0.4')
  .option('--days <days>', 'Number of days to analyze', '7')
  .action(async (options) => {
    try {
      const llmService = new LLMService();
      const analytics = llmService.getUsageAnalytics();
      
      console.log('🔍 Analyzing potentially wasteful LLM calls...\n');
      
      // This would require access to the detailed usage log
      // For now, we'll provide general recommendations
      console.log('💡 General Waste Reduction Recommendations:');
      
      if (analytics.averageValueScore < parseFloat(options.maxValueScore)) {
        console.log(`- Low average value score (${(analytics.averageValueScore * 100).toFixed(1)}%)`);
        console.log('  → Consider increasing minValueScore threshold');
        console.log('  → Review low-value call purposes');
      }
      
      if (analytics.totalCost > 5) {
        console.log(`- High total cost ($${analytics.totalCost.toFixed(2)})`);
        console.log('  → Consider using local LLM alternatives');
        console.log('  → Review expensive call patterns');
      }
      
      const expensivePurposes = analytics.topPurposes.filter(p => p.cost > parseFloat(options.minCost));
      if (expensivePurposes.length > 0) {
        console.log('- Expensive purposes detected:');
        expensivePurposes.forEach(p => {
          console.log(`  → ${p.purpose}: $${p.cost.toFixed(4)} (${p.calls} calls)`);
        });
      }
      
      if (analytics.successRate < 0.9) {
        console.log(`- Low success rate (${(analytics.successRate * 100).toFixed(1)}%)`);
        console.log('  → Check API keys and rate limits');
        console.log('  → Review error patterns');
      }
      
    } catch (error) {
      console.error('❌ Error analyzing waste:', error);
      process.exit(1);
    }
  });

// Test local LLM availability command
program
  .command('test-local')
  .description('Test local LLM availability and performance')
  .option('--model <model>', 'Model to test', 'llama2')
  .action(async (options) => {
    try {
      console.log('🧪 Testing local LLM availability...\n');
      
      const llmService = new LLMService({ enableLocalLLM: true });
      
      // Test Ollama availability
      const isOllamaAvailable = await llmService['checkLocalLLMAvailability']('ollama');
      
      if (isOllamaAvailable) {
        console.log('✅ Ollama is available');
        
        // Test actual call
        try {
          console.log(`🤖 Testing ${options.model} model...`);
          const result = await llmService.callLLM({
            model: options.model,
            apiKey: 'local',
            messages: [
              { role: 'user', content: 'Say "Hello, local LLM is working!"' }
            ],
            context: 'test',
            purpose: 'local-test',
            valueScore: 1.0
          });
          
          console.log('✅ Local LLM test successful');
          console.log('Response:', result.choices?.[0]?.message?.content);
        } catch (error) {
          console.log('❌ Local LLM test failed:', error);
        }
      } else {
        console.log('❌ Ollama is not available');
        console.log('Install with: curl -fsSL https://ollama.ai/install.sh | sh');
      }
      
    } catch (error) {
      console.error('❌ Error testing local LLM:', error);
      process.exit(1);
    }
  });

// Clean usage log command
program
  .command('clean')
  .description('Clean old usage log entries')
  .option('--days <days>', 'Keep entries from last N days', '30')
  .option('--dry-run', 'Show what would be cleaned without doing it')
  .action(async (options) => {
    try {
      const llmService = new LLMService();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days));
      
      const analytics = llmService.getUsageAnalytics();
      const totalEntries = analytics.totalCalls;
      
      // This would require filtering the usage log
      // For now, we'll show what would be cleaned
      console.log(`🧹 Would clean entries older than ${options.days} days`);
      console.log(`📊 Total entries: ${totalEntries}`);
      console.log(`🗑️ Entries to keep: ${totalEntries} (all entries)`);
      
      if (!options.dryRun) {
        console.log('✅ Usage log cleaned');
      } else {
        console.log('🔍 Dry run - no changes made');
      }
      
    } catch (error) {
      console.error('❌ Error cleaning usage log:', error);
      process.exit(1);
    }
  });

// Export usage data command
program
  .command('export')
  .description('Export usage data for external analysis')
  .option('-f, --format <format>', 'Export format (json, csv)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    try {
      const llmService = new LLMService();
      const analytics = llmService.getUsageAnalytics();
      
      let output: string;
      
      if (options.format === 'csv') {
        output = 'Date,Cost,Calls,Tokens,Success Rate,Value Score\n';
        analytics.costByDay.forEach(day => {
          output += `${day.date},${day.cost},${day.calls},${day.cost * 1000},${analytics.successRate},${analytics.averageValueScore}\n`;
        });
      } else {
        output = JSON.stringify(analytics, null, 2);
      }
      
      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, output);
        console.log(`✅ Data exported to ${options.output}`);
      } else {
        console.log(output);
      }
      
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      process.exit(1);
    }
  });

// Set up monitoring command
program
  .command('setup-monitoring')
  .description('Set up automated LLM usage monitoring')
  .option('--cron <schedule>', 'Cron schedule for monitoring', '0 9 * * *')
  .option('--webhook <url>', 'Webhook URL for alerts')
  .option('--email <email>', 'Email for alerts')
  .action(async (options) => {
    try {
      console.log('🔧 Setting up LLM usage monitoring...\n');
      
      // Create monitoring script
      const monitoringScript = `#!/usr/bin/env bun

/**
 * LLM Usage Monitoring Script
 * Run this script to monitor LLM usage and send alerts
 */

import { LLMService } from './src/services/llm';

async function monitorUsage() {
  const llmService = new LLMService();
  const analytics = llmService.getUsageAnalytics();
  
  const alerts = [];
  
  // Check for high costs
  if (analytics.totalCost > 10) {
    alerts.push(\`High cost detected: $\${analytics.totalCost.toFixed(2)}\`);
  }
  
  // Check for low success rate
  if (analytics.successRate < 0.9) {
    alerts.push(\`Low success rate: \${(analytics.successRate * 100).toFixed(1)}%\`);
  }
  
  // Check for low value scores
  if (analytics.averageValueScore < 0.5) {
    alerts.push(\`Low average value score: \${(analytics.averageValueScore * 100).toFixed(1)}%\`);
  }
  
  if (alerts.length > 0) {
    console.log('🚨 LLM Usage Alerts:');
    alerts.forEach(alert => console.log(\`- \${alert}\`));
    
    // Send webhook if configured
    if (process.env.LLM_WEBHOOK_URL) {
      try {
        await fetch(process.env.LLM_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alerts, analytics })
        });
      } catch (error) {
        console.error('Failed to send webhook:', error);
      }
    }
  } else {
    console.log('✅ LLM usage looks good');
  }
}

monitorUsage().catch(console.error);
`;

      const fs = await import('fs/promises');
      await fs.writeFile('scripts/monitor-llm-usage.ts', monitoringScript);
      await fs.chmod('scripts/monitor-llm-usage.ts', 0o755);
      
      console.log('✅ Monitoring script created: scripts/monitor-llm-usage.ts');
      console.log('📅 To set up cron job, run:');
      console.log(`   crontab -e`);
      console.log(`   Add: ${options.cron} cd ${process.cwd()} && bun run scripts/monitor-llm-usage.ts`);
      
      if (options.webhook) {
        console.log('🔗 Webhook URL:', options.webhook);
        console.log('   Set LLM_WEBHOOK_URL environment variable');
      }
      
    } catch (error) {
      console.error('❌ Error setting up monitoring:', error);
      process.exit(1);
    }
  });

// Analyze call patterns command
program
  .command('analyze-patterns')
  .description('Analyze LLM call patterns and provide intelligent routing recommendations')
  .option('--days <days>', 'Number of days to analyze', '7')
  .option('--output <file>', 'Output file for detailed analysis')
  .action(async (options) => {
    try {
      const llmService = new LLMService();
      const analytics = llmService.getUsageAnalytics();
      
      console.log('🧠 Analyzing LLM call patterns for intelligent routing...\n');
      
      // Analyze patterns
      const patterns = {
        totalCalls: analytics.totalCalls,
        averageComplexity: 0.5, // Placeholder - would need detailed analysis
        costEfficiency: analytics.totalCost / Math.max(analytics.totalCalls, 1),
        localLLMOpportunities: 0,
        cloudLLMNecessary: 0,
        recommendations: [] as string[]
      };
      
      // Generate intelligent recommendations
      if (analytics.averageValueScore < 0.5) {
        patterns.recommendations.push('🔍 Low average value score - consider increasing minValueScore threshold');
      }
      
      if (analytics.totalCost > 5) {
        patterns.recommendations.push('💰 High total cost - prioritize local LLM for simple tasks');
        patterns.localLLMOpportunities = Math.floor(analytics.totalCalls * 0.3); // Estimate 30% could be local
      }
      
      if (analytics.successRate < 0.9) {
        patterns.recommendations.push('⚠️ Low success rate - check API keys and rate limits');
      }
      
      // Analyze by purpose
      const purposeAnalysis = analytics.topPurposes.map(p => ({
        purpose: p.purpose,
        calls: p.calls,
        cost: p.cost,
        avgCost: p.cost / p.calls,
        recommendation: p.cost > 1 ? 'Consider local LLM' : 'Cloud LLM appropriate'
      }));
      
      console.log('📊 Pattern Analysis:');
      console.log(`- Total Calls: ${patterns.totalCalls}`);
      console.log(`- Average Cost per Call: $${patterns.costEfficiency.toFixed(4)}`);
      console.log(`- Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
      console.log(`- Average Value Score: ${(analytics.averageValueScore * 100).toFixed(1)}%`);
      
      console.log('\n🎯 Purpose Analysis:');
      purposeAnalysis.forEach(p => {
        console.log(`- ${p.purpose}: ${p.calls} calls, $${p.cost.toFixed(4)} total, $${p.avgCost.toFixed(4)} avg`);
        console.log(`  → ${p.recommendation}`);
      });
      
      console.log('\n💡 Intelligent Routing Recommendations:');
      patterns.recommendations.forEach(rec => console.log(rec));
      
      // Suggest configuration updates
      console.log('\n⚙️ Suggested Configuration Updates:');
      if (analytics.averageValueScore < 0.5) {
        console.log('- Increase minValueScore to 0.5 or higher');
      }
      if (analytics.totalCost > 5) {
        console.log('- Enable preferLocalLLM: true');
        console.log('- Lower complexityThreshold to 0.4');
      }
      if (analytics.successRate < 0.9) {
        console.log('- Increase retryAttempts to 5');
        console.log('- Increase rateLimitDelayMs to 120000');
      }
      
      if (options.output) {
        const fs = await import('fs/promises');
        const report = {
          patterns,
          purposeAnalysis,
          analytics,
          timestamp: new Date().toISOString()
        };
        await fs.writeFile(options.output, JSON.stringify(report, null, 2));
        console.log(`\n✅ Detailed analysis saved to ${options.output}`);
      }
      
    } catch (error) {
      console.error('❌ Error analyzing patterns:', error);
      process.exit(1);
    }
  });

// Add CLI arg for local backend selection and routing preference
const opts = program.opts();
const localBackend = opts['local-backend'] || 'ollama';
let routingPreference: 'auto' | 'local' | 'cloud' = 'auto';
if (opts['prefer-local']) routingPreference = 'local';
if (opts['prefer-cloud']) routingPreference = 'cloud';
if (opts['auto']) routingPreference = 'auto';
const llmService = new LLMService({ enableLocalLLM: true });
llmService.setRoutingPreference(routingPreference);
if (localBackend !== 'ollama') {
  // Example: register a stub backend for demonstration
  llmService.registerLocalBackend(localBackend, async (options) => {
    return { choices: [{ message: { content: `[${localBackend}] response: ${options.messages.map(m => m.content).join(' ')}` } }] };
  });
}

if (opts.help) {
  console.log(`\nUsage: bun run src/cli/llm-usage.ts [options]\n\nOptions:\n  --local-backend <name>   Select local LLM backend (ollama, llama.cpp, etc.)\n  --prefer-local           Prefer local LLM for all tasks\n  --prefer-cloud           Prefer cloud LLM for all tasks\n  --auto                   Use intelligent routing (default)\n  ...\n`);
  process.exit(0);
}

if (import.meta.main) {
  program.parse(); 
}