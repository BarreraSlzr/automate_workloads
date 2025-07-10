#!/usr/bin/env bun

/**
 * VS Code AI Service Integration
 * 
 * This service integrates with VS Code's built-in AI capabilities to provide:
 * 1. Local LLM service using VS Code AI extensions (GitHub Copilot Chat, Claude, etc.)
 * 2. Snapshot processing through VS Code's AI interface
 * 3. Direct LLM calls redirected to VS Code AI
 * 4. Seamless fossilization of VS Code AI interactions
 * 
 * Architecture:
 * - VS Code AI acts as a local LLM provider
 * - Snapshots can be processed through VS Code's AI interface
 * - All interactions are fossilized for audit and traceability
 * - Supports both real-time calls and snapshot analysis
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
type VSCodeAIConfig = any;
type VSCodeAIProvider = any;
type VSCodeAICallOptions = any;
type VSCodeAISnapshotOptions = any;
type VSCodeAIResponse = any;
type VSCodeAIFossil = any;
import type { 
  VSCodeAIConfigSchema,
  VSCodeAIProviderSchema,
  VSCodeAICallParamsSchema,
  VSCodeAISnapshotParamsSchema,
  VSCodeAIResponseSchema,
  VSCodeAIFossilSchema
} from '../types/schemas';
import { executeCommand } from '@/utils/cli';

/**
 * VS Code AI Service - Integrates with VS Code's built-in AI capabilities
 */
export class VSCodeAIService {
  private config: VSCodeAIConfig;
  private providers: Map<string, VSCodeAIProvider>;
  private sessionId: string;
  private fossilStoragePath: string;

  constructor(config: Partial<VSCodeAIConfig> = {}) {
    this.config = {
      provider: 'auto',
      enabled: true,
      useChatInterface: true,
      useCommandPalette: true,
      timeout: 30000,
      enableFossilization: true,
      fossilStoragePath: 'fossils/vscode_ai/',
      enableSnapshotProcessing: true,
      enableDirectCalls: true,
      ...config
    };

    this.providers = new Map();
    this.sessionId = `vscode-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.fossilStoragePath = path.join(process.cwd(), this.config.fossilStoragePath);
    
    this.initializeProviders();
    this.ensureFossilStorage();
  }

  /**
   * Initialize available VS Code AI providers
   */
  private initializeProviders(): void {
    // GitHub Copilot Chat provider
    this.providers.set('copilot', {
      name: 'copilot',
      isAvailable: (options: any) => this.checkCopilotAvailability(options),
      call: (options: any) => this.callCopilot(options),
      processSnapshot: (options: any) => this.processSnapshotWithCopilot(options),
      estimateTokens: (messages: any) => this.estimateTokens(messages),
      estimateCost: () => 0 // Copilot is included in GitHub subscription
    });

    // Claude provider (if Claude extension is installed)
    this.providers.set('claude', {
      name: 'claude',
      isAvailable: (options: any) => this.checkClaudeAvailability(options),
      call: (options: any) => this.callClaude(options),
      processSnapshot: (options: any) => this.processSnapshotWithClaude(options),
      estimateTokens: (messages: any) => this.estimateTokens(messages),
      estimateCost: () => 0 // Local Claude extension
    });

    // Auto provider (tries available providers in order)
    this.providers.set('auto', {
      name: 'auto',
      isAvailable: async (options: any) => {
        for (const [name, provider] of this.providers) {
          if (name !== 'auto' && await provider.isAvailable(options)) {
            return true;
          }
        }
        return false;
      },
      call: async (options: any) => {
        for (const [name, provider] of this.providers) {
          if (name !== 'auto' && await provider.isAvailable(options)) {
            return provider.call(options);
          }
        }
        throw new Error('No VS Code AI providers available');
      },
      processSnapshot: async (options: any) => {
        for (const [name, provider] of this.providers) {
          if (name !== 'auto' && await provider.isAvailable(options)) {
            return provider.processSnapshot(options);
          }
        }
        throw new Error('No VS Code AI providers available for snapshot processing');
      },
      estimateTokens: (messages: any) => this.estimateTokens(messages),
      estimateCost: () => 0
    });
  }

  /**
   * Ensure fossil storage directory exists
   */
  private async ensureFossilStorage(): Promise<void> {
    try {
      await fs.mkdir(this.fossilStoragePath, { recursive: true });
    } catch (error) {
      console.warn('⚠️ Could not create fossil storage directory:', error);
    }
  }

  /**
   * Check if GitHub Copilot is available
   */
  private async checkCopilotAvailability(options: any): Promise<boolean> {
    try {
      // Check if VS Code is available
      const versionResult = executeCommand('code --version');
      if (!versionResult.success) return false;
      const extResult = executeCommand('code --list-extensions');
      if (!extResult.success) return false;
      const extensions = extResult.stdout;
      return extensions.includes('GitHub.copilot') || extensions.includes('GitHub.copilot-chat');
    } catch {
      return false;
    }
  }

  /**
   * Check if Claude extension is available
   */
  private async checkClaudeAvailability(options: any): Promise<boolean> {
    try {
      const versionResult = executeCommand('code --version');
      if (!versionResult.success) return false;
      const extResult = executeCommand('code --list-extensions');
      if (!extResult.success) return false;
      const extensions = extResult.stdout;
      return extensions.includes('anthropic.claude') || extensions.includes('claude');
    } catch {
      return false;
    }
  }

  /**
   * Make a call using GitHub Copilot
   */
  private async callCopilot(options: VSCodeAICallOptions): Promise<VSCodeAIResponse> {
    const startTime = Date.now();
    const callId = this.generateCallId();
    const inputHash = this.generateInputHash(options);

    try {
      // Use VS Code's command palette to trigger Copilot Chat
      const command = this.buildCopilotCommand(options);
      const response = await this.executeVSCodeCommand(command);

      const duration = Date.now() - startTime;
      const tokens = this.estimateTokens(options.messages);

      return {
        content: response,
        model: 'copilot-chat',
        provider: 'copilot',
        tokens,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: true
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        content: '',
        model: 'copilot-chat',
        provider: 'copilot',
        tokens: 0,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: false,
          error: (error as Error).message
        }
      };
    }
  }

  /**
   * Make a call using Claude
   */
  private async callClaude(options: VSCodeAICallOptions): Promise<VSCodeAIResponse> {
    const startTime = Date.now();
    const callId = this.generateCallId();
    const inputHash = this.generateInputHash(options);

    try {
      // Use VS Code's command palette to trigger Claude
      const command = this.buildClaudeCommand(options);
      const response = await this.executeVSCodeCommand(command);

      const duration = Date.now() - startTime;
      const tokens = this.estimateTokens(options.messages);

      return {
        content: response,
        model: 'claude-3-sonnet',
        provider: 'claude',
        tokens,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: true
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        content: '',
        model: 'claude-3-sonnet',
        provider: 'claude',
        tokens: 0,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: false,
          error: (error as Error).message
        }
      };
    }
  }

  /**
   * Process snapshot using Copilot
   */
  private async processSnapshotWithCopilot(options: VSCodeAISnapshotOptions): Promise<VSCodeAIResponse> {
    const startTime = Date.now();
    const callId = this.generateCallId();
    const inputHash = this.generateInputHash(options);

    try {
      // Read snapshot file
      const snapshotContent = await fs.readFile(options.snapshotPath, 'utf-8');
      
      // Build analysis prompt
      const analysisPrompt = this.buildSnapshotAnalysisPrompt(snapshotContent, options);
      
      // Use Copilot to analyze the snapshot
      const command = this.buildCopilotCommand({
        messages: [{ role: 'user', content: analysisPrompt }],
        context: 'snapshot-analysis',
        purpose: `analyze-${options.analysisType}`,
        valueScore: options.valueScore || 0.8
      });

      const response = await this.executeVSCodeCommand(command);
      const duration = Date.now() - startTime;
      const tokens = this.estimateTokens([{ content: analysisPrompt }]);

      return {
        content: response,
        model: 'copilot-chat',
        provider: 'copilot',
        tokens,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: true
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        content: '',
        model: 'copilot-chat',
        provider: 'copilot',
        tokens: 0,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: false,
          error: (error as Error).message
        }
      };
    }
  }

  /**
   * Process snapshot using Claude
   */
  private async processSnapshotWithClaude(options: VSCodeAISnapshotOptions): Promise<VSCodeAIResponse> {
    const startTime = Date.now();
    const callId = this.generateCallId();
    const inputHash = this.generateInputHash(options);

    try {
      // Read snapshot file
      const snapshotContent = await fs.readFile(options.snapshotPath, 'utf-8');
      
      // Build analysis prompt
      const analysisPrompt = this.buildSnapshotAnalysisPrompt(snapshotContent, options);
      
      // Use Claude to analyze the snapshot
      const command = this.buildClaudeCommand({
        messages: [{ role: 'user', content: analysisPrompt }],
        context: 'snapshot-analysis',
        purpose: `analyze-${options.analysisType}`,
        valueScore: options.valueScore || 0.8
      });

      const response = await this.executeVSCodeCommand(command);
      const duration = Date.now() - startTime;
      const tokens = this.estimateTokens([{ content: analysisPrompt }]);

      return {
        content: response,
        model: 'claude-3-sonnet',
        provider: 'claude',
        tokens,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: true
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        content: '',
        model: 'claude-3-sonnet',
        provider: 'claude',
        tokens: 0,
        cost: 0,
        duration,
        metadata: {
          callId,
          inputHash,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          success: false,
          error: (error as Error).message
        }
      };
    }
  }

  /**
   * Build Copilot command
   */
  private buildCopilotCommand(options: VSCodeAICallOptions): string {
    const message = options.messages[options.messages.length - 1]?.content || '';
    
    if (this.config.useChatInterface) {
      return `code --command "copilot.chat" --args "${message}"`;
    } else if (this.config.useCommandPalette) {
      return `code --command "workbench.action.quickOpen" --args ">Copilot: ${message}"`;
    } else {
      // Use custom command if provided
      const customCommand = this.config.customCommands?.chat;
      if (customCommand) {
        return customCommand.replace('{message}', message);
      }
      
      // Fallback to chat interface
      return `code --command "copilot.chat" --args "${message}"`;
    }
  }

  /**
   * Build Claude command
   */
  private buildClaudeCommand(options: VSCodeAICallOptions): string {
    const message = options.messages[options.messages.length - 1]?.content || '';
    
    if (this.config.useChatInterface) {
      return `code --command "claude.chat" --args "${message}"`;
    } else if (this.config.useCommandPalette) {
      return `code --command "workbench.action.quickOpen" --args ">Claude: ${message}"`;
    } else {
      // Use custom command if provided
      const customCommand = this.config.customCommands?.chat;
      if (customCommand) {
        return customCommand.replace('{message}', message);
      }
      
      // Fallback to chat interface
      return `code --command "claude.chat" --args "${message}"`;
    }
  }

  /**
   * Build snapshot analysis prompt
   */
  private buildSnapshotAnalysisPrompt(snapshotContent: string, options: VSCodeAISnapshotOptions): string {
    const analysisType = options.analysisType;
    const context = options.context || 'general';
    const purpose = options.purpose || 'analysis';

    return `Please analyze this LLM call snapshot and provide ${analysisType}:

Snapshot Content:
${snapshotContent}

Analysis Type: ${analysisType}
Context: ${context}
Purpose: ${purpose}

Please provide a comprehensive ${analysisType} that includes:
1. Key insights and patterns
2. Quality assessment
3. Recommendations for improvement
4. Potential issues or concerns
5. Actionable next steps

Format your response in a clear, structured manner.`;
  }

  /**
   * Execute VS Code command
   */
  private async executeVSCodeCommand(command: string): Promise<string> {
    try {
      const result = executeCommand(command);
      if (!result.success) throw new Error(result.stderr);
      return result.stdout.trim();
    } catch (error) {
      throw new Error(`VS Code command failed: ${(error as Error).message}`);
    }
  }

  /**
   * Main method to call VS Code AI
   */
  async callVSCodeAI(options: VSCodeAICallOptions): Promise<VSCodeAIResponse> {
    if (!this.config.enabled) {
      throw new Error('VS Code AI service is disabled');
    }

    const provider = this.providers.get(this.config.provider);
    if (!provider) {
      throw new Error(`VS Code AI provider not found: ${this.config.provider}`);
    }

    if (!await provider.isAvailable(options)) {
      throw new Error(`VS Code AI provider not available: ${this.config.provider}`);
    }

    const response = await provider.call(options);

    // Fossilize the interaction if enabled
    if (this.config.enableFossilization) {
      await this.fossilizeInteraction({
        type: 'vscode-ai-call',
        input: options,
        response
      });
    }

    return response;
  }

  /**
   * Process snapshot using VS Code AI
   */
  async processSnapshot(options: VSCodeAISnapshotOptions): Promise<VSCodeAIResponse> {
    if (!this.config.enabled || !this.config.enableSnapshotProcessing) {
      throw new Error('VS Code AI snapshot processing is disabled');
    }

    const provider = this.providers.get(this.config.provider);
    if (!provider) {
      throw new Error(`VS Code AI provider not found: ${this.config.provider}`);
    }

    if (!await provider.isAvailable(options)) {
      throw new Error(`VS Code AI provider not available: ${this.config.provider}`);
    }

    const response = await provider.processSnapshot(options);

    // Fossilize the interaction if enabled
    if (this.config.enableFossilization) {
      await this.fossilizeInteraction({
        type: 'vscode-ai-snapshot',
        input: options,
        response
      });
    }

    return response;
  }

  /**
   * Fossilize VS Code AI interaction
   */
  private async fossilizeInteraction(data: {
    type: 'vscode-ai-call' | 'vscode-ai-snapshot';
    input: VSCodeAICallOptions | VSCodeAISnapshotOptions;
    response: VSCodeAIResponse;
  }): Promise<void> {
    try {
      const fossil: VSCodeAIFossil = {
        id: data.response.metadata.callId,
        type: data.type,
        timestamp: data.response.metadata.timestamp,
        provider: data.response.provider,
        model: data.response.model,
        input: data.input,
        response: data.response,
        metadata: {
          workspacePath: this.config.workspacePath || process.cwd(),
          fileContext: this.getCurrentFileContext(),
          gitBranch: this.getGitBranch(),
          gitCommit: this.getGitCommit()
        }
      };

      const fossilPath = path.join(
        this.fossilStoragePath,
        `${fossil.id}.json`
      );

      await fs.writeFile(fossilPath, JSON.stringify(fossil, null, 2));
      
      console.log(`💾 Fossilized VS Code AI interaction: ${fossil.id}`);
    } catch (error) {
      console.warn('⚠️ Failed to fossilize VS Code AI interaction:', error);
    }
  }

  /**
   * Get current file context
   */
  private getCurrentFileContext(): string | undefined {
    // In a real VS Code extension, this would get the current file
    return process.env.VSCODE_CURRENT_FILE || undefined;
  }

  /**
   * Get current git branch
   */
  private getGitBranch(): string | undefined {
    try {
      const result = executeCommand('git branch --show-current');
      return result.success ? result.stdout.trim() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current git commit
   */
  private getGitCommit(): string | undefined {
    try {
      const result = executeCommand('git rev-parse HEAD');
      return result.success ? result.stdout.trim() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `vscode-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate input hash
   */
  private generateInputHash(input: any): string {
    const content = JSON.stringify(input);
    return createHash('sha256').update(content).digest('hex').substr(0, 16);
  }

  /**
   * Estimate tokens in messages
   */
  private estimateTokens(messages: any[]): number {
    return messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / 4;
  }

  /**
   * Check if VS Code AI is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const provider = this.providers.get(this.config.provider);
    return provider ? await provider.isAvailable() : false;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys()).filter(name => name !== 'auto');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VSCodeAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Convenience function to create VS Code AI service
 */
export async function createVSCodeAIService(config: Partial<VSCodeAIConfig> = {}): Promise<VSCodeAIService> {
  const service = new VSCodeAIService(config);
  
  // Check availability
  const isAvailable = await service.isAvailable();
  if (!isAvailable) {
    console.warn('⚠️ VS Code AI service is not available. Make sure VS Code and AI extensions are installed.');
  }
  
  return service;
}

/**
 * Convenience function for quick VS Code AI calls
 */
export async function callVSCodeAI(
  input: VSCodeAICallOptions,
  config: Partial<VSCodeAIConfig> = {}
): Promise<VSCodeAIResponse> {
  const service = await createVSCodeAIService(config);
  return service.callVSCodeAI(input);
}

/**
 * Convenience function for snapshot processing
 */
export async function processSnapshotWithVSCodeAI(
  input: VSCodeAISnapshotOptions,
  config: Partial<VSCodeAIConfig> = {}
): Promise<VSCodeAIResponse> {
  const service = await createVSCodeAIService(config);
  return service.processSnapshot(input);
} 