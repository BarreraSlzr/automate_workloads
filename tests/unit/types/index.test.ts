import { test, expect } from "bun:test";
import type {
  EnvironmentConfig,
  ContextEntry,
  ContextQuery,
  GitHubIssue,
  TwitterTweet,
  GmailMessage,
  BufferPost,
  ObsidianNote,
  CLIOptions,
  ServiceResponse,
  WorkflowStep,
  PerformanceMetrics
} from "../../../src/types/index";

test("EnvironmentConfig interface validation", () => {
  const config: EnvironmentConfig = {
    githubToken: "ghp_test123",
    gmailToken: "gmail_test123",
    bufferToken: "buffer_test123",
    twitterToken: "twitter_test123"
  };

  expect(config.githubToken).toBe("ghp_test123");
  expect(config.gmailToken).toBe("gmail_test123");
  expect(config.bufferToken).toBe("buffer_test123");
  expect(config.twitterToken).toBe("twitter_test123");
});

test("EnvironmentConfig with partial tokens", () => {
  const config: EnvironmentConfig = {
    githubToken: "ghp_test123"
  };

  expect(config.githubToken).toBe("ghp_test123");
  expect(config.gmailToken).toBeUndefined();
  expect(config.bufferToken).toBeUndefined();
  expect(config.twitterToken).toBeUndefined();
});

test("ContextEntry interface validation", () => {
  const entry: ContextEntry = {
    id: "test-123",
    type: "knowledge",
    title: "Test Entry",
    content: "This is a test entry",
    tags: ["test", "automation"],
    metadata: { priority: "high", category: "testing" },
    source: "manual",
    version: 1,
    parentId: "parent-123",
    children: ["child-1", "child-2"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  };

  expect(entry.id).toBe("test-123");
  expect(entry.type).toBe("knowledge");
  expect(entry.title).toBe("Test Entry");
  expect(entry.content).toBe("This is a test entry");
  expect(entry.tags).toEqual(["test", "automation"]);
  expect(entry.metadata).toEqual({ priority: "high", category: "testing" });
  expect(entry.source).toBe("manual");
  expect(entry.version).toBe(1);
  expect(entry.parentId).toBe("parent-123");
  expect(entry.children).toEqual(["child-1", "child-2"]);
  expect(entry.createdAt).toBe("2024-01-01T00:00:00Z");
  expect(entry.updatedAt).toBe("2024-01-01T00:00:00Z");
});

test("ContextEntry with all valid types", () => {
  const types: ContextEntry['type'][] = ['knowledge', 'decision', 'action', 'observation', 'plan', 'result', 'insight'];
  const sources: ContextEntry['source'][] = ['llm', 'terminal', 'api', 'manual', 'automated'];

  types.forEach(type => {
    const entry: ContextEntry = {
      id: `test-${type}`,
      type,
      title: `Test ${type}`,
      content: `Content for ${type}`,
      tags: [],
      metadata: {},
      source: 'manual',
      version: 1,
      children: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    };
    expect(entry.type).toBe(type);
  });

  sources.forEach(source => {
    const entry: ContextEntry = {
      id: `test-${source}`,
      type: 'knowledge',
      title: `Test ${source}`,
      content: `Content for ${source}`,
      tags: [],
      metadata: {},
      source,
      version: 1,
      children: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    };
    expect(entry.source).toBe(source);
  });
});

test("ContextQuery interface validation", () => {
  const query: ContextQuery = {
    limit: 10,
    offset: 0,
    type: "knowledge",
    tags: ["test", "automation"],
    source: "manual",
    dateRange: {
      start: "2024-01-01T00:00:00Z",
      end: "2024-12-31T23:59:59Z"
    },
    search: "test query"
  };

  expect(query.limit).toBe(10);
  expect(query.offset).toBe(0);
  expect(query.type).toBe("knowledge");
  expect(query.tags).toEqual(["test", "automation"]);
  expect(query.source).toBe("manual");
  expect(query.dateRange?.start).toBe("2024-01-01T00:00:00Z");
  expect(query.dateRange?.end).toBe("2024-12-31T23:59:59Z");
  expect(query.search).toBe("test query");
});

test("GitHubIssue interface validation", () => {
  const issue: GitHubIssue = {
    number: 123,
    title: "Test Issue",
    state: "open",
    body: "This is a test issue body",
    labels: ["bug", "enhancement"],
    assignees: ["user1", "user2"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  };

  expect(issue.number).toBe(123);
  expect(issue.title).toBe("Test Issue");
  expect(issue.state).toBe("open");
  expect(issue.body).toBe("This is a test issue body");
  expect(issue.labels).toEqual(["bug", "enhancement"]);
  expect(issue.assignees).toEqual(["user1", "user2"]);
  expect(issue.created_at).toBe("2024-01-01T00:00:00Z");
  expect(issue.updated_at).toBe("2024-01-02T00:00:00Z");
});

test("TwitterTweet interface validation", () => {
  const tweet: TwitterTweet = {
    id: "123456789",
    text: "This is a test tweet",
    author_id: "user123",
    created_at: "2024-01-01T00:00:00Z",
    public_metrics: {
      retweet_count: 10,
      reply_count: 5,
      like_count: 25,
      quote_count: 2
    }
  };

  expect(tweet.id).toBe("123456789");
  expect(tweet.text).toBe("This is a test tweet");
  expect(tweet.author_id).toBe("user123");
  expect(tweet.created_at).toBe("2024-01-01T00:00:00Z");
  expect(tweet.public_metrics?.retweet_count).toBe(10);
  expect(tweet.public_metrics?.reply_count).toBe(5);
  expect(tweet.public_metrics?.like_count).toBe(25);
  expect(tweet.public_metrics?.quote_count).toBe(2);
});

test("GmailMessage interface validation", () => {
  const message: GmailMessage = {
    id: "msg123",
    subject: "Test Email",
    from: "sender@example.com",
    to: ["recipient@example.com"],
    snippet: "This is a test email snippet",
    internalDate: "2024-01-01T00:00:00Z",
    labelIds: ["INBOX", "UNREAD"]
  };

  expect(message.id).toBe("msg123");
  expect(message.subject).toBe("Test Email");
  expect(message.from).toBe("sender@example.com");
  expect(message.to).toEqual(["recipient@example.com"]);
  expect(message.snippet).toBe("This is a test email snippet");
  expect(message.internalDate).toBe("2024-01-01T00:00:00Z");
  expect(message.labelIds).toEqual(["INBOX", "UNREAD"]);
});

test("BufferPost interface validation", () => {
  const post: BufferPost = {
    id: "post123",
    text: "This is a test post",
    scheduled_at: "2024-01-01T12:00:00Z",
    status: "pending",
    profile_ids: ["profile1", "profile2"]
  };

  expect(post.id).toBe("post123");
  expect(post.text).toBe("This is a test post");
  expect(post.scheduled_at).toBe("2024-01-01T12:00:00Z");
  expect(post.status).toBe("pending");
  expect(post.profile_ids).toEqual(["profile1", "profile2"]);
});

test("BufferPost with all valid statuses", () => {
  const statuses: BufferPost['status'][] = ['pending', 'sent', 'failed'];

  statuses.forEach(status => {
    const post: BufferPost = {
      id: `post-${status}`,
      text: `Test ${status} post`,
      status,
      profile_ids: []
    };
    expect(post.status).toBe(status);
  });
});

test("ObsidianNote interface validation", () => {
  const note: ObsidianNote = {
    path: "notes/test-note.md",
    title: "Test Note",
    content: "# Test Note\n\nThis is a test note content.",
    modified: "2024-01-01T00:00:00Z",
    tags: ["test", "note"]
  };

  expect(note.path).toBe("notes/test-note.md");
  expect(note.title).toBe("Test Note");
  expect(note.content).toBe("# Test Note\n\nThis is a test note content.");
  expect(note.modified).toBe("2024-01-01T00:00:00Z");
  expect(note.tags).toEqual(["test", "note"]);
});

test("CLIOptions interface validation", () => {
  const options: CLIOptions = {
    owner: "test-owner",
    repo: "test-repo",
    format: "json",
    verbose: true,
    dryRun: false
  };

  expect(options.owner).toBe("test-owner");
  expect(options.repo).toBe("test-repo");
  expect(options.format).toBe("json");
  expect(options.verbose).toBe(true);
  expect(options.dryRun).toBe(false);
});

test("CLIOptions with all valid formats", () => {
  const formats: NonNullable<CLIOptions['format']>[] = ['json', 'text', 'table'];

  formats.forEach(format => {
    const options: CLIOptions = { format };
    expect(options.format).toBe(format);
  });
});

test("ServiceResponse interface validation", () => {
  const successResponse: ServiceResponse<string> = {
    success: true,
    data: "test data",
    statusCode: 200
  };

  const errorResponse: ServiceResponse<string> = {
    success: false,
    error: "Something went wrong",
    statusCode: 500
  };

  expect(successResponse.success).toBe(true);
  expect(successResponse.data).toBe("test data");
  expect(successResponse.statusCode).toBe(200);
  expect(successResponse.error).toBeUndefined();

  expect(errorResponse.success).toBe(false);
  expect(errorResponse.data).toBeUndefined();
  expect(errorResponse.error).toBe("Something went wrong");
  expect(errorResponse.statusCode).toBe(500);
});

test("WorkflowStep interface validation", () => {
  const step: WorkflowStep = {
    name: "Create GitHub Issue",
    description: "Create a new issue in the repository",
    service: "github",
    action: "create_issue",
    parameters: {
      title: "Test Issue",
      body: "This is a test issue",
      labels: ["bug"]
    },
    required: true
  };

  expect(step.name).toBe("Create GitHub Issue");
  expect(step.description).toBe("Create a new issue in the repository");
  expect(step.service).toBe("github");
  expect(step.action).toBe("create_issue");
  expect(step.parameters).toEqual({
    title: "Test Issue",
    body: "This is a test issue",
    labels: ["bug"]
  });
  expect(step.required).toBe(true);
});

test("WorkflowStep with all valid services", () => {
  const services: WorkflowStep['service'][] = ['github', 'twitter', 'gmail', 'buffer', 'obsidian'];

  services.forEach(service => {
    const step: WorkflowStep = {
      name: `Test ${service} step`,
      description: `Test step for ${service}`,
      service,
      action: "test_action",
      parameters: {},
      required: false
    };
    expect(step.service).toBe(service);
  });
});

test("PerformanceMetrics interface validation", () => {
  const metrics: PerformanceMetrics = {
    github: {
      issuesCreated: 10,
      issuesClosed: 8,
      pullRequestsMerged: 5
    },
    twitter: {
      tweetsPosted: 20,
      mentionsReceived: 15,
      engagementRate: 0.75
    },
    gmail: {
      emailsSent: 50,
      emailsReceived: 100,
      responseRate: 0.8
    },
    buffer: {
      postsScheduled: 30,
      postsPublished: 28,
      engagementRate: 0.6
    }
  };

  expect(metrics.github?.issuesCreated).toBe(10);
  expect(metrics.github?.issuesClosed).toBe(8);
  expect(metrics.github?.pullRequestsMerged).toBe(5);

  expect(metrics.twitter?.tweetsPosted).toBe(20);
  expect(metrics.twitter?.mentionsReceived).toBe(15);
  expect(metrics.twitter?.engagementRate).toBe(0.75);

  expect(metrics.gmail?.emailsSent).toBe(50);
  expect(metrics.gmail?.emailsReceived).toBe(100);
  expect(metrics.gmail?.responseRate).toBe(0.8);

  expect(metrics.buffer?.postsScheduled).toBe(30);
  expect(metrics.buffer?.postsPublished).toBe(28);
  expect(metrics.buffer?.engagementRate).toBe(0.6);
});

test("PerformanceMetrics with partial data", () => {
  const metrics: PerformanceMetrics = {
    github: {
      issuesCreated: 5,
      issuesClosed: 3,
      pullRequestsMerged: 2
    }
  };

  expect(metrics.github?.issuesCreated).toBe(5);
  expect(metrics.twitter).toBeUndefined();
  expect(metrics.gmail).toBeUndefined();
  expect(metrics.buffer).toBeUndefined();
}); 