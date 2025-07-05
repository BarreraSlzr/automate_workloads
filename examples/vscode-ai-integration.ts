#!/usr/bin/env bun

/**
 * VS Code AI Integration Example
 * 
 * This example demonstrates how to use VS Code's built-in AI capabilities
 * as a local LLM service for both direct calls and snapshot processing.
 * 
 * Key features:
 * - Direct LLM calls through VS Code AI (GitHub Copilot Chat, Claude, etc.)
 * - Snapshot processing using VS Code AI
 * - Automatic fossilization of all interactions
 * - Schema validation and type safety
 * - Integration with existing LLM service architecture
 * 
 * Architecture:
 * - VS Code AI acts as a local LLM provider
 * - Snapshots can be processed through VS Code's AI interface
 * - All interactions are fossilized for audit and traceability
 * - Supports both real-time calls and snapshot analysis
 */

import { VSCodeAIService, callVSCodeAI, processSnapshotWithVSCodeAI } from '../src/services/vscodeAI';
import { 
  VSCodeAIConfigSchema,
  VSCodeAICallParamsSchema,
  VSCodeAISnapshotParamsSchema,
  VSCodeAIResponseSchema,
  VSCodeAIFossilSchema
} from '../src/types/schemas';
import { LLMService } from '../src/services/llm';
import { ContextFossilService } from '../src/cli/context-fossil';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Example 1: Basic VS Code AI Integration
 * Demonstrates setting up VS Code AI service and making direct calls
 */
async function basicVSCodeAIIntegration() {
  console.log('🚀 Example 1: Basic VS Code AI Integration');
  console.log('='.repeat(60));

  // Configure VS Code AI service using params object pattern
  const vscodeAIConfig = VSCodeAIConfigSchema.parse({
    provider: 'auto', // Will try copilot, then claude, then fallback
    enabled: true,
    useChatInterface: true,
    useCommandPalette: false,
    timeout: 30000,
    enableFossilization: true,
    fossilStoragePath: 'fossils/vscode_ai/',
    enableSnapshotProcessing: true,
    enableDirectCalls: true
  });

  // Create VS Code AI service
  const vscodeAI = new VSCodeAIService(vscodeAIConfig);

  // Check availability
  const isAvailable = await vscodeAI.isAvailable();
  console.log(`📋 VS Code AI Available: ${isAvailable}`);
  console.log(`🔧 Available Providers: ${vscodeAI.getAvailableProviders().join(', ')}`);

  if (!isAvailable) {
    console.log('⚠️ VS Code AI not available. Make sure VS Code and AI extensions are installed.');
    return;
  }

  // Make a direct call using VS Code AI
  const callParams = VSCodeAICallParamsSchema.parse({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant integrated with VS Code.'
      },
      {
        role: 'user',
        content: 'Explain the benefits of using VS Code AI integration for local LLM calls.'
      }
    ],
    context: 'example',
    purpose: 'demonstration',
    valueScore: 0.9,
    useChat: true
  });

  try {
    console.log('🤖 Making VS Code AI call...');
    const response = await vscodeAI.callVSCodeAI(callParams);
    
    // Validate response using schema
    const validatedResponse = VSCodeAIResponseSchema.parse(response);
    
    console.log('✅ VS Code AI call successful!');
    console.log(`📝 Response: ${validatedResponse.content.substring(0, 200)}...`);
    console.log(`🤖 Provider: ${validatedResponse.provider}`);
    console.log(`📊 Tokens: ${validatedResponse.tokens}`);
    console.log(`💰 Cost: $${validatedResponse.cost}`);
    console.log(`⏱️ Duration: ${validatedResponse.duration}ms`);
    console.log(`🆔 Call ID: ${validatedResponse.metadata.callId}`);
    
  } catch (error) {
    console.error('❌ VS Code AI call failed:', error);
  }

  console.log('');
}

/**
 * Example 2: Snapshot Processing with VS Code AI
 * Demonstrates processing LLM snapshots using VS Code AI
 */
async function snapshotProcessingWithVSCodeAI() {
  console.log('🔍 Example 2: Snapshot Processing with VS Code AI');
  console.log('='.repeat(60));

  // Create a sample LLM snapshot for processing
  const sampleSnapshot = {
    id: 'sample-llm-call-123',
    timestamp: new Date().toISOString(),
    model: 'gpt-4',
    provider: 'openai',
    input: {
      messages: [
        { role: 'user', content: 'Analyze this code for potential improvements' }
      ],
      temperature: 0.7,
      maxTokens: 1000
    },
    response: {
      content: 'The code shows good structure but could benefit from better error handling and documentation.',
      tokens: 150,
      cost: 0.003
    },
    metadata: {
      context: 'code-review',
      purpose: 'analysis',
      quality: 0.85
    }
  };

  // Save sample snapshot to file
  const snapshotPath = 'temp-sample-snapshot.json';
  await fs.writeFile(snapshotPath, JSON.stringify(sampleSnapshot, null, 2));

  // Configure VS Code AI for snapshot processing
  const vscodeAIConfig = VSCodeAIConfigSchema.parse({
    provider: 'auto',
    enabled: true,
    enableSnapshotProcessing: true,
    enableFossilization: true,
    fossilStoragePath: 'fossils/vscode_ai/'
  });

  const vscodeAI = new VSCodeAIService(vscodeAIConfig);

  // Process snapshot with different analysis types
  const analysisTypes = ['summary', 'insights', 'recommendations', 'audit'] as const;

  for (const analysisType of analysisTypes) {
    console.log(`\n🔍 Processing snapshot with ${analysisType} analysis...`);
    
    const snapshotParams = VSCodeAISnapshotParamsSchema.parse({
      snapshotPath,
      analysisType,
      context: 'example-snapshot-processing',
      purpose: `analyze-${analysisType}`,
      valueScore: 0.8
    });

    try {
      const response = await vscodeAI.processSnapshot(snapshotParams);
      
      // Validate response
      const validatedResponse = VSCodeAIResponseSchema.parse(response);
      
      console.log(`✅ ${analysisType} analysis completed!`);
      console.log(`📝 ${analysisType}: ${validatedResponse.content.substring(0, 150)}...`);
      console.log(`🤖 Provider: ${validatedResponse.provider}`);
      console.log(`⏱️ Duration: ${validatedResponse.duration}ms`);
      
    } catch (error) {
      console.error(`❌ ${analysisType} analysis failed:`, error);
    }
  }

  // Clean up temporary file
  await fs.unlink(snapshotPath);
  console.log('');
}

/**
 * Example 3: Integration with Existing LLM Service
 * Demonstrates how VS Code AI can be integrated as a provider in the existing LLM service
 */
async function integrationWithExistingLLMService() {
  console.log('🔗 Example 3: Integration with Existing LLM Service');
  console.log('='.repeat(60));

  // Create VS Code AI service
  const vscodeAI = new VSCodeAIService({
    provider: 'auto',
    enabled: true,
    enableFossilization: true
  });

  // Create existing LLM service
  const llmService = new LLMService({
    enableLocalLLM: true,
    preferLocalLLM: false, // Don't prefer local by default
    enableFossilization: true
  });

  // Register VS Code AI as a local backend
  llmService.registerLocalBackend(
    'vscode-ai',
    async (options) => {
      const response = await vscodeAI.callVSCodeAI({
        messages: options.messages,
        context: 'llm-service-integration',
        purpose: 'local-llm-call',
        valueScore: 0.8
      });
      
      return {
        choices: [{ message: { content: response.content } }]
      };
    },
    async () => await vscodeAI.isAvailable()
  );

  // Test the integration
  console.log('🤖 Testing LLM service with VS Code AI integration...');
  
  try {
    const result = await llmService.callLLM({
      model: 'vscode-ai',
      apiKey: 'local',
      messages: [
        {
          role: 'user',
          content: 'How does VS Code AI integration improve the development workflow?'
        }
      ],
      context: 'integration-test',
      purpose: 'workflow-analysis',
      valueScore: 0.9
    });

    console.log('✅ LLM service integration successful!');
    console.log(`📝 Response: ${result.choices?.[0]?.message?.content?.substring(0, 200)}...`);
    
  } catch (error) {
    console.error('❌ LLM service integration failed:', error);
  }

  console.log('');
}

/**
 * Example 4: Fossil Management with VS Code AI
 * Demonstrates how VS Code AI interactions are fossilized and can be managed
 */
async function fossilManagementWithVSCodeAI() {
  console.log('💾 Example 4: Fossil Management with VS Code AI');
  console.log('='.repeat(60));

  // Create VS Code AI service with fossilization enabled
  const vscodeAI = new VSCodeAIService({
    provider: 'auto',
    enabled: true,
    enableFossilization: true,
    fossilStoragePath: 'fossils/vscode_ai/'
  });

  // Create fossil service for management
  const fossilService = new ContextFossilService();

  // Make several VS Code AI calls to generate fossils
  const testCalls = [
    {
      messages: [{ role: 'user', content: 'Explain TypeScript interfaces' }],
      context: 'typescript-learning',
      purpose: 'education'
    },
    {
      messages: [{ role: 'user', content: 'Review this code for best practices' }],
      context: 'code-review',
      purpose: 'quality-assurance'
    },
    {
      messages: [{ role: 'user', content: 'Generate unit test examples' }],
      context: 'testing',
      purpose: 'test-generation'
    }
  ];

  console.log('🤖 Making VS Code AI calls to generate fossils...');
  
  for (const [index, call] of testCalls.entries()) {
    try {
      const response = await vscodeAI.callVSCodeAI({
        ...call,
        valueScore: 0.8
      });
      
      console.log(`✅ Call ${index + 1} completed: ${response.metadata.callId}`);
      
    } catch (error) {
      console.error(`❌ Call ${index + 1} failed:`, error);
    }
  }

  // Query and analyze VS Code AI fossils
  console.log('\n🔍 Querying VS Code AI fossils...');
  
  try {
    const fossils = await fossilService.queryEntries({
      search: 'vscode-ai',
      tags: ['vscode-ai'],
      limit: 10
    });

    console.log(`📊 Found ${fossils.length} VS Code AI fossils`);
    
    // Analyze fossil patterns
    const providers = new Set(fossils.map(f => f.provider));
    const purposes = new Set(fossils.map(f => f.purpose));
    
    console.log(`🤖 Providers used: ${Array.from(providers).join(', ')}`);
    console.log(`🎯 Purposes: ${Array.from(purposes).join(', ')}`);
    
    // Show recent fossil
    if (fossils.length > 0) {
      const recentFossil = fossils[0];
      console.log(`\n📋 Recent fossil: ${recentFossil.id}`);
      console.log(`🕒 Timestamp: ${recentFossil.timestamp}`);
      console.log(`🎯 Purpose: ${recentFossil.purpose}`);
      console.log(`📝 Content preview: ${recentFossil.content?.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Fossil query failed:', error);
  }

  console.log('');
}

/**
 * Example 5: Advanced VS Code AI Configuration
 * Demonstrates advanced configuration options and custom commands
 */
async function advancedVSCodeAIConfiguration() {
  console.log('⚙️ Example 5: Advanced VS Code AI Configuration');
  console.log('='.repeat(60));

  // Advanced configuration with custom commands
  const advancedConfig = VSCodeAIConfigSchema.parse({
    provider: 'copilot', // Specifically use Copilot
    enabled: true,
    vscodePath: '/usr/local/bin/code', // Custom VS Code path
    workspacePath: process.cwd(),
    useChatInterface: true,
    useCommandPalette: true,
    timeout: 45000, // Longer timeout
    enableFossilization: true,
    fossilStoragePath: 'fossils/vscode_ai/advanced/',
    enableSnapshotProcessing: true,
    enableDirectCalls: true,
    customCommands: {
      chat: 'code --command "copilot.chat" --args "{message}"',
      analyze: 'code --command "copilot.analyze" --args "{message}"',
      explain: 'code --command "copilot.explain" --args "{message}"',
      generate: 'code --command "copilot.generate" --args "{message}"'
    }
  });

  const vscodeAI = new VSCodeAIService(advancedConfig);

  // Test different custom commands
  const testCommands = [
    {
      type: 'chat',
      message: 'What are the benefits of using custom VS Code AI commands?',
      context: 'custom-commands',
      purpose: 'exploration'
    },
    {
      type: 'analyze',
      message: 'Analyze the current project structure for improvements',
      context: 'project-analysis',
      purpose: 'optimization'
    }
  ];

  for (const test of testCommands) {
    console.log(`\n🔧 Testing ${test.type} command...`);
    
    try {
      const response = await vscodeAI.callVSCodeAI({
        messages: [{ role: 'user', content: test.message }],
        context: test.context,
        purpose: test.purpose,
        valueScore: 0.9,
        useChat: test.type === 'chat',
        useCommandPalette: test.type !== 'chat'
      });
      
      console.log(`✅ ${test.type} command successful!`);
      console.log(`📝 Response: ${response.content.substring(0, 150)}...`);
      console.log(`🤖 Provider: ${response.provider}`);
      console.log(`⏱️ Duration: ${response.duration}ms`);
      
    } catch (error) {
      console.error(`❌ ${test.type} command failed:`, error);
    }
  }

  console.log('');
}

/**
 * Example 6: Error Handling and Fallback Strategies
 * Demonstrates robust error handling and fallback mechanisms
 */
async function errorHandlingAndFallbacks() {
  console.log('🛡️ Example 6: Error Handling and Fallback Strategies');
  console.log('='.repeat(60));

  // Create VS Code AI service with error handling
  const vscodeAI = new VSCodeAIService({
    provider: 'auto',
    enabled: true,
    timeout: 10000, // Short timeout to trigger errors
    enableFossilization: true
  });

  // Test error scenarios
  const errorScenarios = [
    {
      name: 'Timeout scenario',
      config: { timeout: 1000 }, // Very short timeout
      expectedError: 'timeout'
    },
    {
      name: 'Invalid provider scenario',
      config: { provider: 'nonexistent' as any },
      expectedError: 'provider not found'
    },
    {
      name: 'Disabled service scenario',
      config: { enabled: false },
      expectedError: 'service is disabled'
    }
  ];

  for (const scenario of errorScenarios) {
    console.log(`\n🧪 Testing ${scenario.name}...`);
    
    try {
      // Create service with error-prone config
      const errorService = new VSCodeAIService(scenario.config);
      
      const response = await errorService.callVSCodeAI({
        messages: [{ role: 'user', content: 'Test message' }],
        context: 'error-test',
        purpose: 'error-handling'
      });
      
      console.log(`✅ Unexpected success: ${response.metadata.callId}`);
      
    } catch (error) {
      console.log(`❌ Expected error: ${(error as Error).message}`);
      
      // Demonstrate fallback to regular LLM service
      console.log('🔄 Attempting fallback to regular LLM service...');
      
      try {
        const fallbackLLM = new LLMService({
          enableLocalLLM: false,
          enableFossilization: true
        });
        
        const fallbackResponse = await fallbackLLM.callLLM({
          model: 'gpt-3.5-turbo',
          apiKey: process.env.OPENAI_API_KEY || 'test',
          messages: [{ role: 'user', content: 'Fallback test message' }],
          context: 'fallback-test',
          purpose: 'error-recovery',
          valueScore: 0.7
        });
        
        console.log('✅ Fallback successful!');
        console.log(`📝 Fallback response: ${fallbackResponse.choices?.[0]?.message?.content?.substring(0, 100)}...`);
        
      } catch (fallbackError) {
        console.log(`❌ Fallback also failed: ${(fallbackError as Error).message}`);
      }
    }
  }

  console.log('');
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🎯 VS Code AI Integration Examples');
  console.log('='.repeat(60));
  console.log('This example demonstrates how to use VS Code\'s built-in AI capabilities');
  console.log('as a local LLM service for both direct calls and snapshot processing.\n');

  try {
    // Run all examples
    await basicVSCodeAIIntegration();
    await snapshotProcessingWithVSCodeAI();
    await integrationWithExistingLLMService();
    await fossilManagementWithVSCodeAI();
    await advancedVSCodeAIConfiguration();
    await errorHandlingAndFallbacks();

    console.log('🎉 All VS Code AI integration examples completed!');
    console.log('\n📚 Key Takeaways:');
    console.log('• VS Code AI can act as a local LLM provider');
    console.log('• Snapshots can be processed through VS Code\'s AI interface');
    console.log('• All interactions are automatically fossilized');
    console.log('• Integration with existing LLM service architecture');
    console.log('• Robust error handling and fallback strategies');
    console.log('• Schema validation ensures type safety');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (import.meta.main) {
  main();
}

export {
  basicVSCodeAIIntegration,
  snapshotProcessingWithVSCodeAI,
  integrationWithExistingLLMService,
  fossilManagementWithVSCodeAI,
  advancedVSCodeAIConfiguration,
  errorHandlingAndFallbacks
}; 