#!/usr/bin/env bun

/**
 * VS Code AI CLI Command
 * 
 * Provides command-line interface for VS Code AI integration,
 * allowing users to test and use VS Code's built-in AI capabilities
 * for both direct calls and snapshot processing.
 */

import { Command } from 'commander';
import { VSCodeAIService, callVSCodeAI, processSnapshotWithVSCodeAI } from '../services/vscodeAI';
import { 
  VSCodeAIConfigSchema,
  VSCodeAICallParamsSchema,
  VSCodeAISnapshotParamsSchema
} from '../types/schemas';
import { ContextFossilService } from './context-fossil';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

// Test VS Code AI availability
program
  .command('test')
  .description('Test VS Code AI availability and basic functionality')
  .option('--provider <provider>', 'AI provider to test (copilot, claude, auto)', 'auto')
  .option('--timeout <timeout>', 'Timeout in milliseconds', '30000')
  .action(async (options) => {
    try {
      console.log('🧪 Testing VS Code AI availability...\n');
      
      const config = VSCodeAIConfigSchema.parse({
        provider: options.provider,
        enabled: true,
        timeout: parseInt(options.timeout),
        enableFossilization: false // Disable for testing
      });

      const vscodeAI = new VSCodeAIService(config);
      
      // Check availability
      const isAvailable = await vscodeAI.isAvailable();
      console.log(`📋 VS Code AI Available: ${isAvailable ? '✅' : '❌'}`);
      
      if (!isAvailable) {
        console.log('\n⚠️ VS Code AI not available. Please check:');
        console.log('• VS Code is installed and accessible via "code" command');
        console.log('• AI extensions are installed (GitHub Copilot, Claude, etc.)');
        console.log('• Extensions are properly configured');
        return;
      }

      console.log(`🔧 Available Providers: ${vscodeAI.getAvailableProviders().join(', ')}`);
      
      // Test basic call
      console.log('\n🤖 Testing basic AI call...');
      const testResponse = await vscodeAI.callVSCodeAI({
        messages: [{ role: 'user', content: 'Say "VS Code AI is working!"' }],
        context: 'test',
        purpose: 'availability-test',
        valueScore: 1.0
      });

      console.log('✅ Basic call successful!');
      console.log(`📝 Response: ${testResponse.content}`);
      console.log(`🤖 Provider: ${testResponse.provider}`);
      console.log(`⏱️ Duration: ${testResponse.duration}ms`);
      
    } catch (error) {
      console.error('❌ VS Code AI test failed:', error);
      process.exit(1);
    }
  });

// Make direct AI call
program
  .command('call')
  .description('Make a direct call to VS Code AI')
  .option('--message <message>', 'Message to send to AI', 'Hello, VS Code AI!')
  .option('--provider <provider>', 'AI provider to use (copilot, claude, auto)', 'auto')
  .option('--context <context>', 'Context for the call', 'cli-call')
  .option('--purpose <purpose>', 'Purpose of the call', 'general')
  .option('--use-chat', 'Use chat interface', true)
  .option('--use-command-palette', 'Use command palette', false)
  .option('--timeout <timeout>', 'Timeout in milliseconds', '30000')
  .option('--fossilize', 'Fossilize the interaction', true)
  .action(async (options) => {
    try {
      console.log('🤖 Making VS Code AI call...\n');
      
      const config = VSCodeAIConfigSchema.parse({
        provider: options.provider,
        enabled: true,
        useChatInterface: options.useChat,
        useCommandPalette: options.useCommandPalette,
        timeout: parseInt(options.timeout),
        enableFossilization: options.fossilize
      });

      const callParams = VSCodeAICallParamsSchema.parse({
        messages: [{ role: 'user', content: options.message }],
        context: options.context,
        purpose: options.purpose,
        valueScore: 0.8,
        useChat: options.useChat,
        useCommandPalette: options.useCommandPalette
      });

      const response = await callVSCodeAI(callParams, config);
      
      console.log('✅ VS Code AI call successful!');
      console.log('='.repeat(50));
      console.log(`🤖 Provider: ${response.provider}`);
      console.log(`📊 Tokens: ${response.tokens}`);
      console.log(`💰 Cost: $${response.cost}`);
      console.log(`⏱️ Duration: ${response.duration}ms`);
      console.log(`🆔 Call ID: ${response.metadata.callId}`);
      console.log('='.repeat(50));
      console.log('📝 Response:');
      console.log(response.content);
      
    } catch (error) {
      console.error('❌ VS Code AI call failed:', error);
      process.exit(1);
    }
  });

// Process snapshot with VS Code AI
program
  .command('process-snapshot')
  .description('Process an LLM snapshot using VS Code AI')
  .requiredOption('--snapshot <path>', 'Path to the snapshot file')
  .option('--analysis-type <type>', 'Type of analysis (summary, insights, recommendations, audit)', 'summary')
  .option('--provider <provider>', 'AI provider to use (copilot, claude, auto)', 'auto')
  .option('--context <context>', 'Context for the analysis', 'snapshot-processing')
  .option('--purpose <purpose>', 'Purpose of the analysis', 'analysis')
  .option('--timeout <timeout>', 'Timeout in milliseconds', '30000')
  .option('--fossilize', 'Fossilize the interaction', true)
  .option('--output <path>', 'Output path for results')
  .action(async (options) => {
    try {
      console.log('🔍 Processing snapshot with VS Code AI...\n');
      
      // Check if snapshot file exists
      if (!await fs.access(options.snapshot).then(() => true).catch(() => false)) {
        console.error(`❌ Snapshot file not found: ${options.snapshot}`);
        process.exit(1);
      }

      const config = VSCodeAIConfigSchema.parse({
        provider: options.provider,
        enabled: true,
        timeout: parseInt(options.timeout),
        enableFossilization: options.fossilize,
        enableSnapshotProcessing: true
      });

      const snapshotParams = VSCodeAISnapshotParamsSchema.parse({
        snapshotPath: options.snapshot,
        analysisType: options.analysisType,
        context: options.context,
        purpose: options.purpose,
        valueScore: 0.8
      });

      const response = await processSnapshotWithVSCodeAI(snapshotParams, config);
      
      console.log('✅ Snapshot processing successful!');
      console.log('='.repeat(50));
      console.log(`🤖 Provider: ${response.provider}`);
      console.log(`📊 Tokens: ${response.tokens}`);
      console.log(`💰 Cost: $${response.cost}`);
      console.log(`⏱️ Duration: ${response.duration}ms`);
      console.log(`🆔 Call ID: ${response.metadata.callId}`);
      console.log('='.repeat(50));
      console.log(`📝 ${options.analysisType} Analysis:`);
      console.log(response.content);

      // Save output if specified
      if (options.output) {
        const outputData = {
          snapshotPath: options.snapshot,
          analysisType: options.analysisType,
          timestamp: new Date().toISOString(),
          response: response,
          metadata: {
            provider: response.provider,
            duration: response.duration,
            callId: response.metadata.callId
          }
        };

        await fs.writeFile(options.output, JSON.stringify(outputData, null, 2));
        console.log(`\n💾 Results saved to: ${options.output}`);
      }
      
    } catch (error) {
      console.error('❌ Snapshot processing failed:', error);
      process.exit(1);
    }
  });

// List VS Code AI fossils
program
  .command('list-fossils')
  .description('List VS Code AI interaction fossils')
  .option('--limit <limit>', 'Maximum number of fossils to show', '20')
  .option('--provider <provider>', 'Filter by provider', '')
  .option('--type <type>', 'Filter by type (vscode-ai-call, vscode-ai-snapshot)', '')
  .option('--since <date>', 'Show fossils since date (ISO format)', '')
  .option('--output <format>', 'Output format (json, table)', 'table')
  .action(async (options) => {
    try {
      console.log('💾 Listing VS Code AI fossils...\n');
      
      const fossilService = new ContextFossilService();
      
      // Build query filters
      const filters: any = {
        tags: ['vscode-ai'],
        limit: parseInt(options.limit)
      };

      if (options.provider) {
        filters.provider = options.provider;
      }

      if (options.type) {
        filters.type = options.type;
      }

      if (options.since) {
        filters.dateRange = {
          start: options.since,
          end: new Date().toISOString()
        };
      }

      const fossils = await fossilService.queryEntries(filters);
      
      console.log(`📊 Found ${fossils.length} VS Code AI fossils`);
      
      if (options.output === 'json') {
        console.log(JSON.stringify(fossils, null, 2));
      } else {
        // Table format
        console.log('='.repeat(100));
        console.log('ID'.padEnd(30) + 'Type'.padEnd(20) + 'Provider'.padEnd(15) + 'Purpose'.padEnd(20) + 'Timestamp');
        console.log('='.repeat(100));
        
        fossils.forEach(fossil => {
          const id = fossil.id.substring(0, 28) + (fossil.id.length > 28 ? '..' : '');
          const type = fossil.type.substring(0, 18) + (fossil.type.length > 18 ? '..' : '');
          const provider = ((fossil as any).provider || 'unknown').substring(0, 13) + (((fossil as any).provider || 'unknown').length > 13 ? '..' : '');
          const purpose = ((fossil as any).purpose || 'unknown').substring(0, 18) + (((fossil as any).purpose || 'unknown').length > 18 ? '..' : '');
          const timestamp = new Date((fossil as any).timestamp || new Date()).toLocaleString();
          
          console.log(id.padEnd(30) + type.padEnd(20) + provider.padEnd(15) + purpose.padEnd(20) + timestamp);
        });
        
        console.log('='.repeat(100));
      }
      
    } catch (error) {
      console.error('❌ Failed to list fossils:', error);
      process.exit(1);
    }
  });

// Show fossil details
program
  .command('show-fossil')
  .description('Show detailed information about a specific VS Code AI fossil')
  .requiredOption('--id <id>', 'Fossil ID to show')
  .option('--output <format>', 'Output format (json, text)', 'text')
  .action(async (options) => {
    try {
      console.log(`🔍 Showing fossil details for: ${options.id}\n`);
      
      const fossilService = new ContextFossilService();
      const fossil = await fossilService.getEntry(options.id);
      
      if (!fossil) {
        console.error(`❌ Fossil not found: ${options.id}`);
        process.exit(1);
      }

      if (options.output === 'json') {
        console.log(JSON.stringify(fossil, null, 2));
      } else {
        console.log('='.repeat(60));
        console.log(`🆔 ID: ${fossil.id}`);
        console.log(`📅 Timestamp: ${(fossil as any).timestamp || 'unknown'}`);
        console.log(`🤖 Provider: ${(fossil as any).provider || 'unknown'}`);
        console.log(`🎯 Purpose: ${(fossil as any).purpose || 'unknown'}`);
        console.log(`📝 Context: ${fossil.content || (fossil as any).context || 'unknown'}`);
        console.log('='.repeat(60));
        
        if (fossil.content) {
          console.log('📄 Content:');
          console.log(fossil.content);
        }
        
        if (fossil.metadata && Object.keys(fossil.metadata).length > 0) {
          console.log('\n🔧 Metadata:');
          console.log(JSON.stringify(fossil.metadata, null, 2));
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to show fossil:', error);
      process.exit(1);
    }
  });

// Analyze VS Code AI patterns
program
  .command('analyze')
  .description('Analyze VS Code AI interaction patterns')
  .option('--since <date>', 'Analyze fossils since date (ISO format)', '')
  .option('--provider <provider>', 'Filter by provider', '')
  .option('--output <format>', 'Output format (json, text)', 'text')
  .action(async (options) => {
    try {
      console.log('📊 Analyzing VS Code AI patterns...\n');
      
      const fossilService = new ContextFossilService();
      
      // Build query filters
      const filters: any = {
        tags: ['vscode-ai'],
        limit: 1000 // Get more fossils for analysis
      };

      if (options.provider) {
        filters.provider = options.provider;
      }

      if (options.since) {
        filters.dateRange = {
          start: options.since,
          end: new Date().toISOString()
        };
      }

      const fossils = await fossilService.queryEntries(filters);
      
      if (fossils.length === 0) {
        console.log('📭 No VS Code AI fossils found for analysis');
        return;
      }

      // Analyze patterns
      const analysis = {
        totalFossils: fossils.length,
        providers: {} as Record<string, number>,
        types: {} as Record<string, number>,
        purposes: {} as Record<string, number>,
        contexts: {} as Record<string, number>,
        timeRange: {
          earliest: fossils[fossils.length - 1] ? (fossils[fossils.length - 1] as any).timestamp : undefined,
          latest: fossils[0] ? (fossils[0] as any).timestamp : undefined
        },
        averageQuality: 0,
        totalTokens: 0,
        totalCost: 0
      };

      fossils.forEach(fossil => {
        // Count providers
        const provider = (fossil as any).provider || 'unknown';
        analysis.providers[provider] = (analysis.providers[provider] || 0) + 1;
        
        // Count types
        const type = fossil.type || 'unknown';
        analysis.types[type] = (analysis.types[type] || 0) + 1;
        
        // Count purposes
        const purpose = (fossil as any).purpose || 'unknown';
        analysis.purposes[purpose] = (analysis.purposes[purpose] || 0) + 1;
        
        // Count contexts
        const context = fossil.content || (fossil as any).context || 'unknown';
        analysis.contexts[context] = (analysis.contexts[context] || 0) + 1;
        
        // Accumulate metrics
        if (fossil.metadata?.quality) {
          analysis.averageQuality += (fossil.metadata.quality as number) || 0;
        }
        if (fossil.metadata?.tokens) {
          analysis.totalTokens += (fossil.metadata.tokens as number) || 0;
        }
        if (fossil.metadata?.cost) {
          analysis.totalCost += (fossil.metadata.cost as number) || 0;
        }
      });

      // Calculate averages
      analysis.averageQuality = analysis.averageQuality / fossils.length;

      if (options.output === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log('📊 VS Code AI Pattern Analysis');
        console.log('='.repeat(50));
        console.log(`📈 Total Interactions: ${analysis.totalFossils}`);
        console.log(`📅 Time Range: ${analysis.timeRange.earliest} to ${analysis.timeRange.latest}`);
        console.log(`📊 Average Quality: ${analysis.averageQuality.toFixed(3)}`);
        console.log(`🔢 Total Tokens: ${analysis.totalTokens}`);
        console.log(`💰 Total Cost: $${analysis.totalCost.toFixed(4)}`);
        
        console.log('\n🤖 Providers:');
        Object.entries(analysis.providers)
          .sort(([,a], [,b]) => b - a)
          .forEach(([provider, count]) => {
            const percentage = ((count / analysis.totalFossils) * 100).toFixed(1);
            console.log(`  ${provider}: ${count} (${percentage}%)`);
          });
        
        console.log('\n🏷️ Types:');
        Object.entries(analysis.types)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            const percentage = ((count / analysis.totalFossils) * 100).toFixed(1);
            console.log(`  ${type}: ${count} (${percentage}%)`);
          });
        
        console.log('\n🎯 Top Purposes:');
        Object.entries(analysis.purposes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([purpose, count]) => {
            const percentage = ((count / analysis.totalFossils) * 100).toFixed(1);
            console.log(`  ${purpose}: ${count} (${percentage}%)`);
          });
      }
      
    } catch (error) {
      console.error('❌ Failed to analyze patterns:', error);
      process.exit(1);
    }
  });

// Configure VS Code AI
program
  .command('config')
  .description('Show or update VS Code AI configuration')
  .option('--show', 'Show current configuration')
  .option('--provider <provider>', 'Set default provider (copilot, claude, auto)')
  .option('--timeout <timeout>', 'Set timeout in milliseconds')
  .option('--fossil-path <path>', 'Set fossil storage path')
  .option('--enable-fossilization', 'Enable fossilization', true)
  .option('--disable-fossilization', 'Disable fossilization')
  .action(async (options) => {
    try {
      if (options.show) {
        console.log('⚙️ Current VS Code AI Configuration:');
        console.log('='.repeat(50));
        
        const defaultConfig = VSCodeAIConfigSchema.parse({});
        console.log(JSON.stringify(defaultConfig, null, 2));
        
        console.log('\n💡 To update configuration, use the options above');
        console.log('Example: bun run vscode-ai config --provider copilot --timeout 45000');
      } else {
        console.log('⚙️ VS Code AI configuration options:');
        console.log('='.repeat(50));
        console.log('• --provider: Set default AI provider (copilot, claude, auto)');
        console.log('• --timeout: Set timeout in milliseconds');
        console.log('• --fossil-path: Set fossil storage path');
        console.log('• --enable-fossilization: Enable interaction fossilization');
        console.log('• --disable-fossilization: Disable interaction fossilization');
        console.log('\n💡 Configuration is applied per-command using --config option');
      }
      
    } catch (error) {
      console.error('❌ Configuration error:', error);
      process.exit(1);
    }
  });

// Set up program
program
  .name('vscode-ai')
  .description('VS Code AI Integration CLI')
  .version('1.0.0');

// Add help text
program.addHelpText('after', `

Examples:
  $ bun run vscode-ai test
  $ bun run vscode-ai call --message "Explain TypeScript interfaces"
  $ bun run vscode-ai process-snapshot --snapshot fossils/llm_insights/sample.json
  $ bun run vscode-ai list-fossils --limit 10
  $ bun run vscode-ai analyze --since 2024-01-01

Requirements:
  • VS Code installed and accessible via "code" command
  • AI extensions installed (GitHub Copilot, Claude, etc.)
  • Extensions properly configured and authenticated
`);

export default program; 