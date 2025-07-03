#!/usr/bin/env bun

/**
 * Context Gathering CLI Module
 * 
 * Collects context from various services (GitHub, Obsidian, Gmail, etc.)
 * for LLM processing and decision making.
 */

import { Command } from 'commander';
import { getEnv } from '../core/config';
import { toFossilEntry, outputFossil, writeFossilToFile } from '../utils/fossilize';

interface UnifiedContext {
  timestamp: string;
  github?: {
    issues: any[];
    pullRequests: any[];
    recentActivity: any[];
  };
  obsidian?: {
    recentNotes: any[];
    tags: string[];
    links: any[];
  };
  gmail?: {
    recentEmails: any[];
    labels: string[];
  };
  social?: {
    recentPosts: any[];
    mentions: any[];
  };
  system?: {
    currentTime: string;
    userActivity: any[];
  };
}

/**
 * Context Gathering Service
 * 
 * Collects and synthesizes context from multiple services
 * for LLM-assisted decision making.
 */
class ContextGatheringService {
  private config: ReturnType<typeof getEnv>;

  constructor() {
    this.config = getEnv();
  }

  /**
   * Gathers context from all available services
   * @returns Unified context for LLM processing
   */
  async gatherContext(): Promise<UnifiedContext> {
    console.log('🔄 Gathering context from all services...');
    
    const context: UnifiedContext = {
      timestamp: new Date().toISOString(),
    };

    // Gather GitHub context if available
    if (this.config.GITHUB_TOKEN) {
      try {
        context.github = await this.gatherGitHubContext();
      } catch (error) {
        console.warn('⚠️  Failed to gather GitHub context:', error);
      }
    }

    // Gather Obsidian context if available
    try {
      context.obsidian = await this.gatherObsidianContext();
    } catch (error) {
      console.warn('⚠️  Failed to gather Obsidian context:', error);
    }

    // Gather Gmail context if available
    if (this.config.GMAIL_TOKEN) {
      try {
        context.gmail = await this.gatherGmailContext();
      } catch (error) {
        console.warn('⚠️  Failed to gather Gmail context:', error);
      }
    }

    // Gather social media context if available
    if (this.config.TWITTER_TOKEN || this.config.BUFFER_TOKEN) {
      try {
        context.social = await this.gatherSocialContext();
      } catch (error) {
        console.warn('⚠️  Failed to gather social context:', error);
      }
    }

    // Gather system context
    context.system = await this.gatherSystemContext();

    console.log('✅ Context gathering completed');
    return context;
  }

  /**
   * Gathers GitHub context
   * @returns GitHub context data
   */
  private async gatherGitHubContext(): Promise<UnifiedContext['github']> {
    console.log('📊 Gathering GitHub context...');
    
    // In a real implementation, this would use the GitHub API
    // For now, we'll simulate the data
    return {
      issues: [
        {
          id: 1,
          title: 'Sample Issue',
          state: 'open',
          labels: ['enhancement'],
          created_at: new Date().toISOString(),
        },
      ],
      pullRequests: [
        {
          id: 1,
          title: 'Sample PR',
          state: 'open',
          created_at: new Date().toISOString(),
        },
      ],
      recentActivity: [
        {
          type: 'issue_created',
          timestamp: new Date().toISOString(),
          description: 'New issue created',
        },
      ],
    };
  }

  /**
   * Gathers Obsidian context
   * @returns Obsidian context data
   */
  private async gatherObsidianContext(): Promise<UnifiedContext['obsidian']> {
    console.log('📝 Gathering Obsidian context...');
    
    // In a real implementation, this would read from Obsidian vault
    // For now, we'll simulate the data
    return {
      recentNotes: [
        {
          title: 'Sample Note',
          path: '/path/to/note.md',
          modified: new Date().toISOString(),
          tags: ['project', 'automation'],
        },
      ],
      tags: ['project', 'automation', 'llm', 'workflow'],
      links: [
        {
          source: 'Sample Note',
          target: 'Another Note',
          type: 'internal',
        },
      ],
    };
  }

  /**
   * Gathers Gmail context
   * @returns Gmail context data
   */
  private async gatherGmailContext(): Promise<UnifiedContext['gmail']> {
    console.log('📧 Gathering Gmail context...');
    
    // In a real implementation, this would use the Gmail API
    // For now, we'll simulate the data
    return {
      recentEmails: [
        {
          subject: 'Sample Email',
          from: 'sender@example.com',
          received: new Date().toISOString(),
          labels: ['important'],
        },
      ],
      labels: ['important', 'work', 'personal'],
    };
  }

  /**
   * Gathers social media context
   * @returns Social media context data
   */
  private async gatherSocialContext(): Promise<UnifiedContext['social']> {
    console.log('📱 Gathering social media context...');
    
    // In a real implementation, this would use Twitter/Buffer APIs
    // For now, we'll simulate the data
    return {
      recentPosts: [
        {
          platform: 'twitter',
          content: 'Sample tweet about automation',
          posted: new Date().toISOString(),
          engagement: { likes: 10, retweets: 5 },
        },
      ],
      mentions: [
        {
          platform: 'twitter',
          content: 'Mentioned in a tweet',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Gathers system context
   * @returns System context data
   */
  private async gatherSystemContext(): Promise<UnifiedContext['system']> {
    console.log('💻 Gathering system context...');
    
    return {
      currentTime: new Date().toISOString(),
      userActivity: [
        {
          type: 'file_edit',
          timestamp: new Date().toISOString(),
          description: 'Edited source file',
        },
      ],
    };
  }

  /**
   * Synthesizes context for LLM consumption
   * @param context - Raw context from services
   * @returns Processed context optimized for LLM
   */
  async synthesizeContext(context: UnifiedContext): Promise<Record<string, unknown>> {
    console.log('🧠 Synthesizing context for LLM...');
    
    return {
      timestamp: context.timestamp,
      currentState: this.extractCurrentState(context),
      recentActivity: this.extractRecentActivity(context),
      pendingActions: this.extractPendingActions(context),
      recommendations: this.generateRecommendations(context),
    };
  }

  /**
   * Extracts current state from context
   * @param context - Unified context
   * @returns Current state summary
   */
  private extractCurrentState(context: UnifiedContext): Record<string, unknown> {
    return {
      openIssues: context.github?.issues?.filter(i => i.state === 'open').length || 0,
      openPRs: context.github?.pullRequests?.filter(pr => pr.state === 'open').length || 0,
      recentNotes: context.obsidian?.recentNotes?.length || 0,
      unreadEmails: context.gmail?.recentEmails?.length || 0,
      recentPosts: context.social?.recentPosts?.length || 0,
    };
  }

  /**
   * Extracts recent activity from context
   * @param context - Unified context
   * @returns Recent activity summary
   */
  private extractRecentActivity(context: UnifiedContext): any[] {
    const activities = [];
    
    if (context.github?.recentActivity) {
      activities.push(...context.github.recentActivity);
    }
    
    if (context.system?.userActivity) {
      activities.push(...context.system.userActivity);
    }
    
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Extracts pending actions from context
   * @param context - Unified context
   * @returns Pending actions summary
   */
  private extractPendingActions(context: UnifiedContext): any[] {
    const actions = [];
    
    if (context.github?.issues) {
      actions.push(...context.github.issues
        .filter(i => i.state === 'open')
        .map(i => ({ type: 'issue', id: i.id, title: i.title }))
      );
    }
    
    if (context.github?.pullRequests) {
      actions.push(...context.github.pullRequests
        .filter(pr => pr.state === 'open')
        .map(pr => ({ type: 'pr', id: pr.id, title: pr.title }))
      );
    }
    
    return actions;
  }

  /**
   * Generates recommendations based on context
   * @param context - Unified context
   * @returns Recommendations
   */
  private generateRecommendations(context: UnifiedContext): string[] {
    const recommendations = [];
    
    const openIssues = context.github?.issues?.filter(i => i.state === 'open').length || 0;
    if (openIssues > 5) {
      recommendations.push('Consider prioritizing open issues');
    }
    
    const openPRs = context.github?.pullRequests?.filter(pr => pr.state === 'open').length || 0;
    if (openPRs > 3) {
      recommendations.push('Review and merge pending pull requests');
    }
    
    const unreadEmails = context.gmail?.recentEmails?.length || 0;
    if (unreadEmails > 10) {
      recommendations.push('Process unread emails');
    }
    
    return recommendations;
  }
}

/**
 * CLI Command Setup
 */
const program = new Command();

program
  .name('gather-context')
  .description('Gather context from all integrated services for LLM processing')
  .version('1.0.0');

// Main context gathering command
program
  .command('gather')
  .description('Gather context from all services')
  .option('-o, --output <file>', 'Output file for context (JSON)')
  .option('-s, --synthesize', 'Synthesize context for LLM consumption')
  .action(async (options) => {
    try {
      const service = new ContextGatheringService();
      const context = await service.gatherContext();
      
      let outputData: UnifiedContext | Record<string, unknown> = context;
      let fossilType: 'observation' | 'insight' = 'observation';
      let fossilTitle = 'Gathered Context';
      let fossilTags = ['context', 'gather'];
      let fossilContent: string;
      if (options.synthesize) {
        outputData = await service.synthesizeContext(context);
        fossilType = 'insight';
        fossilTitle = 'Synthesized Context Insight';
        fossilTags.push('synthesized', 'llm');
        fossilContent = JSON.stringify(outputData, null, 2);
      } else {
        fossilContent = JSON.stringify(outputData, null, 2);
      }
      const fossilEntry = toFossilEntry({
        type: fossilType,
        title: fossilTitle,
        content: fossilContent,
        tags: fossilTags,
        source: 'terminal',
        metadata: { invocation: 'gather-context-cli' },
      });
      if (options.output) {
        await writeFossilToFile(fossilEntry, options.output);
        console.log(`✅ Fossil context saved to ${options.output}`);
      } else {
        outputFossil(fossilEntry);
      }
    } catch (error) {
      console.error('❌ Error during context gathering:', error);
      process.exit(1);
    }
  });

if (import.meta.main) {
  program.parse();
} 