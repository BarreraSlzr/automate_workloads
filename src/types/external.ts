/**
 * External service type definitions
 * @module types/external
 */

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
 * External service performance metrics
 */
export interface ExternalServiceMetrics {
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
  /** Obsidian metrics */
  obsidian?: {
    notesCreated: number;
    notesUpdated: number;
    tagsUsed: number;
  };
}

/**
 * External service configuration
 */
export interface ExternalServiceConfig {
  /** Twitter configuration */
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  /** Gmail configuration */
  gmail?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  /** Buffer configuration */
  buffer?: {
    accessToken: string;
    clientId: string;
    clientSecret: string;
  };
  /** Obsidian configuration */
  obsidian?: {
    vaultPath: string;
    templatesPath?: string;
    attachmentsPath?: string;
  };
}

/**
 * External service status
 */
export interface ExternalServiceStatus {
  /** Service name */
  service: 'twitter' | 'gmail' | 'buffer' | 'obsidian';
  /** Connection status */
  status: 'connected' | 'disconnected' | 'error';
  /** Last sync time */
  lastSync?: string;
  /** Error message if any */
  error?: string;
  /** Service-specific metadata */
  metadata?: Record<string, unknown>;
} 