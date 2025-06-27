/**
 * Core type definitions for the automation ecosystem
 * @module types
 */

/**
 * Environment configuration schema
 * All tokens are optional since we prefer CLI tools when available
 */
export interface EnvironmentConfig {
  /** GitHub personal access token (optional - uses gh CLI by default) */
  githubToken?: string;
  /** Gmail API OAuth token */
  gmailToken?: string;
  /** Buffer API access token */
  bufferToken?: string;
  /** Twitter API v2 bearer token */
  twitterToken?: string;
}

/**
 * Context entry for fossil storage
 */
export interface ContextEntry {
  /** Unique identifier */
  id: string;
  /** Entry type */
  type: 'knowledge' | 'decision' | 'action' | 'observation' | 'plan' | 'result' | 'insight';
  /** Entry title */
  title: string;
  /** Entry content */
  content: string;
  /** Entry tags */
  tags: string[];
  /** Entry metadata */
  metadata: Record<string, unknown>;
  /** Entry source */
  source: 'llm' | 'terminal' | 'api' | 'manual' | 'automated';
  /** Entry version */
  version: number;
  /** Parent entry ID */
  parentId?: string;
  /** Child entry IDs */
  children: string[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Context query parameters
 */
export interface ContextQuery {
  /** Maximum number of entries to return */
  limit: number;
  /** Number of entries to skip */
  offset: number;
  /** Filter by entry type */
  type?: ContextEntry['type'];
  /** Filter by tags */
  tags?: string[];
  /** Filter by source */
  source?: ContextEntry['source'];
  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Search in title and content */
  search?: string;
}

/**
 * GitHub issue information
 */
export interface GitHubIssue {
  /** Issue number */
  number: number;
  /** Issue title */
  title: string;
  /** Issue state (open, closed) */
  state: 'open' | 'closed';
  /** Issue body content */
  body?: string;
  /** Issue labels */
  labels: string[];
  /** Issue assignees */
  assignees: string[];
  /** Creation date */
  created_at: string;
  /** Last updated date */
  updated_at: string;
}

/**
 * Twitter tweet information
 */
export interface TwitterTweet {
  /** Tweet ID */
  id: string;
  /** Tweet text content */
  text: string;
  /** Author username */
  author_id: string;
  /** Creation date */
  created_at: string;
  /** Engagement metrics */
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

/**
 * Gmail message information
 */
export interface GmailMessage {
  /** Message ID */
  id: string;
  /** Message subject */
  subject: string;
  /** Sender email */
  from: string;
  /** Recipient emails */
  to: string[];
  /** Message snippet */
  snippet: string;
  /** Internal date */
  internalDate: string;
  /** Message labels */
  labelIds: string[];
}

/**
 * Buffer post information
 */
export interface BufferPost {
  /** Post ID */
  id: string;
  /** Post text content */
  text: string;
  /** Scheduled date */
  scheduled_at?: string;
  /** Post status */
  status: 'pending' | 'sent' | 'failed';
  /** Social media profiles */
  profile_ids: string[];
}

/**
 * Obsidian note information
 */
export interface ObsidianNote {
  /** File path relative to vault */
  path: string;
  /** Note title */
  title: string;
  /** Note content */
  content: string;
  /** Last modified date */
  modified: string;
  /** Note tags */
  tags: string[];
}

/**
 * CLI command options
 */
export interface CLIOptions {
  /** Repository owner (for GitHub operations) */
  owner?: string;
  /** Repository name (for GitHub operations) */
  repo?: string;
  /** Output format (json, text, table) */
  format?: 'json' | 'text' | 'table';
  /** Verbose output */
  verbose?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  /** Success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message */
  error?: string;
  /** HTTP status code */
  statusCode?: number;
}

/**
 * Automation workflow step
 */
export interface WorkflowStep {
  /** Step name */
  name: string;
  /** Step description */
  description: string;
  /** Service to use */
  service: 'github' | 'twitter' | 'gmail' | 'buffer' | 'obsidian';
  /** Action to perform */
  action: string;
  /** Step parameters */
  parameters: Record<string, any>;
  /** Whether step is required */
  required: boolean;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** GitHub metrics */
  github?: {
    issuesCreated: number;
    issuesClosed: number;
    pullRequestsMerged: number;
  };
  /** Twitter metrics */
  twitter?: {
    tweetsPosted: number;
    mentionsReceived: number;
    engagementRate: number;
  };
  /** Gmail metrics */
  gmail?: {
    emailsSent: number;
    emailsReceived: number;
    responseRate: number;
  };
  /** Buffer metrics */
  buffer?: {
    postsScheduled: number;
    postsPublished: number;
    engagementRate: number;
  };
} 