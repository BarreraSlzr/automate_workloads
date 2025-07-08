# GitHub Object Support Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for adding support to all GitHub objects (Pull Requests, Releases, Discussions, Project Boards, Workflow Runs, Repository Settings) using the unified canonical fossil patterns. The implementation follows the existing patterns established for Issues, Labels, and Milestones.

## Current State Analysis

### ✅ Fully Implemented
- **Issues**: `createFossilIssue()` with full fossil-backed creation
- **Labels**: `createFossilLabel()` with deduplication and metadata
- **Milestones**: `createFossilMilestone()` with progress tracking

### ❌ Missing Support
- **Pull Requests**: No fossil-backed creation
- **Releases**: No fossil-backed creation  
- **Discussions**: No fossil-backed creation
- **Project Boards**: No fossil-backed creation
- **Workflow Runs**: No fossil-backed creation
- **Repository Settings**: No fossil-backed creation

## Implementation Strategy

### Phase 1: High Priority Objects (Week 1-2)

#### 1.1 Pull Request Support

**Files to Create/Update:**
- `src/utils/fossilPullRequest.ts` (new)
- `src/types/cli.ts` (add schemas)
- `src/types/schemas.ts` (add schemas)
- `src/utils/githubCliCommands.ts` (add methods)

**Implementation Pattern:**
```typescript
// src/utils/fossilPullRequest.ts
export async function createFossilPullRequest(params: CreateFossilPullRequestParams): Promise<{
  prNumber?: string;
  fossilId: string;
  fossilHash: string;
  deduplicated: boolean;
}> {
  // 1. Validate parameters
  const validatedParams = CreateFossilPullRequestParamsSchema.parse(params);
  
  // 2. Check for existing fossil
  const existingFossil = await fossilService.queryEntries({
    search: validatedParams.title,
    type: 'github_pr_fossil',
    limit: 1
  });
  
  if (existingFossil) {
    return {
      fossilId: existingFossil.id,
      fossilHash: '',
      deduplicated: true
    };
  }
  
  // 3. Create GitHub PR
  const commands = new GitHubCLICommands(validatedParams.owner, validatedParams.repo);
  const result = await commands.createPullRequest({
    title: validatedParams.title,
    body: validatedParams.body,
    base: validatedParams.baseBranch,
    head: validatedParams.headBranch,
    draft: validatedParams.draft
  });
  
  if (!result.success) {
    throw new Error(`Failed to create pull request: ${result.message}`);
  }
  
  // 4. Extract PR number from result
  const prNumber = extractPRNumber(result.stdout);
  
  // 5. Create fossil entry
  const fossilEntry = await createFossilEntry({
    type: 'github_pr_fossil',
    title: validatedParams.title,
    content: validatedParams.body,
    tags: ['github', 'pull_request', ...validatedParams.tags],
    metadata: {
      ...validatedParams.metadata,
      prNumber,
      baseBranch: validatedParams.baseBranch,
      headBranch: validatedParams.headBranch,
      draft: validatedParams.draft,
      owner: validatedParams.owner,
      repo: validatedParams.repo
    }
  });
  
  return {
    prNumber,
    fossilId: fossilEntry.id,
    fossilHash: fossilEntry.fossilHash,
    deduplicated: false
  };
}
```

**Schema Definition:**
```typescript
// src/types/schemas.ts
export const CreateFossilPullRequestParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string(),
  baseBranch: z.string(),
  headBranch: z.string(),
  draft: z.boolean().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});
```

#### 1.2 Release Support

**Implementation Pattern:**
```typescript
// src/utils/fossilRelease.ts
export async function createFossilRelease(params: CreateFossilReleaseParams): Promise<{
  releaseId?: string;
  fossilId: string;
  fossilHash: string;
  deduplicated: boolean;
}> {
  // Similar pattern to PR implementation
  // Uses gh release create command
  // Extracts release ID from result
  // Creates fossil with release metadata
}
```

**Schema Definition:**
```typescript
export const CreateFossilReleaseParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  tagName: z.string(),
  title: z.string(),
  body: z.string(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});
```

### Phase 2: Medium Priority Objects (Week 3-4)

#### 2.1 Discussion Support

**Implementation Pattern:**
```typescript
// src/utils/fossilDiscussion.ts
export async function createFossilDiscussion(params: CreateFossilDiscussionParams): Promise<{
  discussionId?: string;
  fossilId: string;
  fossilHash: string;
  deduplicated: boolean;
}> {
  // Uses gh discussion create command
  // Supports categories: announcements, general, ideas, polls, qa
  // Creates fossil with discussion metadata
}
```

#### 2.2 Project Board Support

**Implementation Pattern:**
```typescript
// src/utils/fossilProject.ts
export async function createFossilProject(params: CreateFossilProjectParams): Promise<{
  projectId?: string;
  fossilId: string;
  fossilHash: string;
  deduplicated: boolean;
}> {
  // Uses gh project create command
  // Supports visibility: public, private
  // Creates fossil with project metadata
}
```

### Phase 3: Low Priority Objects (Week 5-6)

#### 3.1 Workflow Run Support

**Implementation Pattern:**
```typescript
// src/utils/fossilWorkflowRun.ts
export async function createFossilWorkflowRun(params: CreateFossilWorkflowRunParams): Promise<{
  runId?: string;
  fossilId: string;
  fossilHash: string;
  deduplicated: boolean;
}> {
  // Uses gh run list and gh run view commands
  // Creates fossils for workflow run metadata
  // Tracks run status, duration, and results
}
```

#### 3.2 Repository Settings Support

**Implementation Pattern:**
```typescript
// src/utils/fossilRepoSetting.ts
export async function createFossilRepoSetting(params: CreateFossilRepoSettingParams): Promise<{
  settingId?: string;
  fossilId: string;
  fossilHash: string;
  deduplicated: boolean;
}> {
  // Uses gh repo edit command
  // Creates fossils for repository configuration changes
  // Tracks settings like description, homepage, topics
}
```

## Enhanced GitHubCLICommands Implementation

### Extended Command Methods

```typescript
// src/utils/githubCliCommands.ts
export class GitHubCLICommands {
  // Existing methods...
  
  /**
   * Create a GitHub pull request
   */
  async createPullRequest(params: PullRequestParams): Promise<CommandResult> {
    const cmd = this.buildPullRequestCreateCommand(params);
    return this.executeCommand(cmd);
  }
  
  /**
   * Create a GitHub release
   */
  async createRelease(params: ReleaseParams): Promise<CommandResult> {
    const cmd = this.buildReleaseCreateCommand(params);
    return this.executeCommand(cmd);
  }
  
  /**
   * Create a GitHub discussion
   */
  async createDiscussion(params: DiscussionParams): Promise<CommandResult> {
    const cmd = this.buildDiscussionCreateCommand(params);
    return this.executeCommand(cmd);
  }
  
  /**
   * Create a GitHub project
   */
  async createProject(params: ProjectParams): Promise<CommandResult> {
    const cmd = this.buildProjectCreateCommand(params);
    return this.executeCommand(cmd);
  }
  
  /**
   * List workflow runs
   */
  async listWorkflowRuns(options: {
    workflow?: string;
    status?: string;
    branch?: string;
  } = {}): Promise<CommandResult> {
    const cmd = this.buildWorkflowRunListCommand(options);
    return this.executeCommand(cmd);
  }
  
  /**
   * Update repository settings
   */
  async updateRepoSettings(params: RepoSettingsParams): Promise<CommandResult> {
    const cmd = this.buildRepoSettingsUpdateCommand(params);
    return this.executeCommand(cmd);
  }
  
  // Private command builders...
  private buildPullRequestCreateCommand(params: PullRequestParams): string {
    const { title, body, base, head, draft } = params;
    let cmd = `gh pr create --repo ${this.owner}/${this.repo} --title "${this.escapeString(title)}"`;
    
    if (body) {
      cmd += ` --body "${this.escapeString(body)}"`;
    }
    
    if (base) {
      cmd += ` --base "${this.escapeString(base)}"`;
    }
    
    if (head) {
      cmd += ` --head "${this.escapeString(head)}"`;
    }
    
    if (draft) {
      cmd += ` --draft`;
    }
    
    return cmd;
  }
  
  private buildReleaseCreateCommand(params: ReleaseParams): string {
    const { tagName, title, body, draft, prerelease } = params;
    let cmd = `gh release create "${this.escapeString(tagName)}" --repo ${this.owner}/${this.repo}`;
    
    if (title) {
      cmd += ` --title "${this.escapeString(title)}"`;
    }
    
    if (body) {
      cmd += ` --notes "${this.escapeString(body)}"`;
    }
    
    if (draft) {
      cmd += ` --draft`;
    }
    
    if (prerelease) {
      cmd += ` --prerelease`;
    }
    
    return cmd;
  }
  
  private buildDiscussionCreateCommand(params: DiscussionParams): string {
    const { title, body, category } = params;
    let cmd = `gh discussion create --repo ${this.owner}/${this.repo} --title "${this.escapeString(title)}"`;
    
    if (body) {
      cmd += ` --body "${this.escapeString(body)}"`;
    }
    
    if (category) {
      cmd += ` --category "${this.escapeString(category)}"`;
    }
    
    return cmd;
  }
  
  private buildProjectCreateCommand(params: ProjectParams): string {
    const { title, description, visibility } = params;
    let cmd = `gh project create --repo ${this.owner}/${this.repo} --title "${this.escapeString(title)}"`;
    
    if (description) {
      cmd += ` --description "${this.escapeString(description)}"`;
    }
    
    if (visibility) {
      cmd += ` --visibility ${visibility}`;
    }
    
    return cmd;
  }
  
  private buildWorkflowRunListCommand(options: {
    workflow?: string;
    status?: string;
    branch?: string;
  }): string {
    const { workflow, status, branch } = options;
    let cmd = `gh run list --repo ${this.owner}/${this.repo} --json id,status,conclusion,workflowName,createdAt,updatedAt`;
    
    if (workflow) {
      cmd += ` --workflow "${this.escapeString(workflow)}"`;
    }
    
    if (status) {
      cmd += ` --status ${status}`;
    }
    
    if (branch) {
      cmd += ` --branch "${this.escapeString(branch)}"`;
    }
    
    return cmd;
  }
  
  private buildRepoSettingsUpdateCommand(params: RepoSettingsParams): string {
    const { description, homepage, topics } = params;
    let cmd = `gh repo edit ${this.owner}/${this.repo}`;
    
    if (description) {
      cmd += ` --description "${this.escapeString(description)}"`;
    }
    
    if (homepage) {
      cmd += ` --homepage "${this.escapeString(homepage)}"`;
    }
    
    if (topics && topics.length > 0) {
      cmd += ` --add-topic "${topics.map(t => this.escapeString(t)).join(',')}"`;
    }
    
    return cmd;
  }
}
```

## Unified Fossil Types

### Extended GitHub Fossil Types

```typescript
// src/types/github.ts
export interface GitHubPullRequestFossil extends BaseFossil {
  type: 'github_pr_fossil';
  prNumber?: number;
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  reviewStatus?: 'pending' | 'approved' | 'changes_requested';
  mergeStatus?: 'mergeable' | 'conflicting' | 'unknown';
}

export interface GitHubReleaseFossil extends BaseFossil {
  type: 'github_release_fossil';
  releaseId?: string;
  tagName: string;
  title: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  publishedAt?: string;
  assets?: Array<{
    name: string;
    size: number;
    downloadCount: number;
  }>;
}

export interface GitHubDiscussionFossil extends BaseFossil {
  type: 'github_discussion_fossil';
  discussionId?: string;
  title: string;
  body: string;
  category: 'announcements' | 'general' | 'ideas' | 'polls' | 'qa';
  state: 'open' | 'closed';
  answerChosenAt?: string;
  upvoteCount?: number;
  commentCount?: number;
}

export interface GitHubProjectFossil extends BaseFossil {
  type: 'github_project_fossil';
  projectId?: string;
  title: string;
  description: string;
  visibility: 'public' | 'private';
  state: 'open' | 'closed';
  itemCount?: number;
  columnCount?: number;
}

export interface GitHubWorkflowRunFossil extends BaseFossil {
  type: 'github_workflow_run_fossil';
  runId?: string;
  workflowName: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  createdAt: string;
  updatedAt: string;
  duration?: number;
  jobs?: Array<{
    name: string;
    status: string;
    conclusion?: string;
  }>;
}

export interface GitHubRepoSettingsFossil extends BaseFossil {
  type: 'github_repo_settings_fossil';
  settingId?: string;
  settingType: 'description' | 'homepage' | 'topics' | 'visibility' | 'default_branch';
  oldValue?: string;
  newValue: string;
  updatedAt: string;
}
```

## Pre-Commit Integration

### Enhanced Validation

```typescript
// scripts/ml-ready-pre-commit-validator.ts
class MLReadyPreCommitValidator {
  async validateGitHubObjects(): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    // Check for new GitHub objects that need fossilization
    const newObjects = await this.detectNewGitHubObjects();
    
    for (const obj of newObjects) {
      if (!obj.hasFossil) {
        try {
          await this.createFossilForObject(obj);
          results.push({
            success: true,
            message: `Created fossil for ${obj.type}: ${obj.title}`
          });
        } catch (error) {
          results.push({
            success: false,
            message: `Failed to create fossil for ${obj.type}: ${error.message}`
          });
        }
      }
    }
    
    return {
      success: results.every(r => r.success),
      message: `GitHub objects validation: ${results.filter(r => r.success).length}/${results.length} successful`
    };
  }
  
  private async detectNewGitHubObjects(): Promise<GitHubObject[]> {
    // Implementation to detect new GitHub objects
    // Checks git diff for new objects without fossils
  }
  
  private async createFossilForObject(obj: GitHubObject): Promise<void> {
    // Implementation to create appropriate fossil based on object type
    switch (obj.type) {
      case 'pull_request':
        await createFossilPullRequest(obj.params);
        break;
      case 'release':
        await createFossilRelease(obj.params);
        break;
      case 'discussion':
        await createFossilDiscussion(obj.params);
        break;
      case 'project':
        await createFossilProject(obj.params);
        break;
      // ... other types
    }
  }
}
```

## YAML Context Integration

### Enhanced Context Generation

```yaml
# fossils/context/github-objects-context.yml
github_objects:
  issues:
    total: 15
    open: 8
    closed: 7
    recent_activity: "2025-07-06T10:30:00Z"
    priority_distribution:
      high: 3
      medium: 8
      low: 4
  
  pull_requests:
    total: 3
    open: 2
    merged: 1
    draft: 1
    recent_activity: "2025-07-06T09:15:00Z"
    review_status:
      pending: 1
      approved: 1
      changes_requested: 1
  
  releases:
    total: 5
    latest: "v1.2.0"
    recent_activity: "2025-07-05T14:20:00Z"
    release_types:
      major: 1
      minor: 3
      patch: 1
  
  discussions:
    total: 2
    open: 1
    closed: 1
    recent_activity: "2025-07-04T16:45:00Z"
    categories:
      announcements: 0
      general: 1
      ideas: 1
      polls: 0
      qa: 0
  
  projects:
    total: 1
    active: 1
    recent_activity: "2025-07-06T11:00:00Z"
    project_types:
      board: 1
      table: 0
  
  workflow_runs:
    total: 25
    recent_activity: "2025-07-06T12:00:00Z"
    status_distribution:
      success: 20
      failure: 3
      cancelled: 1
      skipped: 1
  
  repository_settings:
    last_updated: "2025-07-06T08:30:00Z"
    visibility: "public"
    default_branch: "main"
    topics: ["automation", "llm", "fossils", "github"]
```

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/utils/fossilPullRequest.test.ts
describe('createFossilPullRequest', () => {
  it('should create a pull request and fossil', async () => {
    const params = {
      owner: 'test-owner',
      repo: 'test-repo',
      title: 'Test PR',
      body: 'Test body',
      baseBranch: 'main',
      headBranch: 'feature/test'
    };
    
    const result = await createFossilPullRequest(params);
    
    expect(result.prNumber).toBeDefined();
    expect(result.fossilId).toBeDefined();
    expect(result.deduplicated).toBe(false);
  });
  
  it('should deduplicate existing pull requests', async () => {
    // Test deduplication logic
  });
  
  it('should handle GitHub CLI errors', async () => {
    // Test error handling
  });
});
```

### Integration Tests

```typescript
// tests/integration/github-objects.integration.test.ts
describe('GitHub Objects Integration', () => {
  it('should create all GitHub object types with fossils', async () => {
    // Test complete workflow for all object types
  });
  
  it('should generate correct YAML context', async () => {
    // Test YAML context generation
  });
  
  it('should pass pre-commit validation', async () => {
    // Test pre-commit validation
  });
});
```

## Migration Path

### Week 1: Pull Request Support
- [ ] Implement `createFossilPullRequest()`
- [ ] Add PR schemas and types
- [ ] Extend `GitHubCLICommands` with PR methods
- [ ] Add unit tests
- [ ] Update documentation

### Week 2: Release Support
- [ ] Implement `createFossilRelease()`
- [ ] Add release schemas and types
- [ ] Extend `GitHubCLICommands` with release methods
- [ ] Add unit tests
- [ ] Update documentation

### Week 3: Discussion & Project Support
- [ ] Implement `createFossilDiscussion()`
- [ ] Implement `createFossilProject()`
- [ ] Add schemas and types
- [ ] Extend `GitHubCLICommands`
- [ ] Add unit tests

### Week 4: Workflow Run & Repo Settings Support
- [ ] Implement `createFossilWorkflowRun()`
- [ ] Implement `createFossilRepoSetting()`
- [ ] Add schemas and types
- [ ] Extend `GitHubCLICommands`
- [ ] Add unit tests

### Week 5: Integration & Testing
- [ ] Integrate with pre-commit validation
- [ ] Update YAML context generation
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Performance testing

### Week 6: Documentation & Deployment
- [ ] Update API reference
- [ ] Update workflow diagrams
- [ ] Create migration guide
- [ ] Deploy to production
- [ ] Monitor and optimize

## Success Metrics

1. **Coverage**: 100% of GitHub objects supported with fossil-backed creation
2. **Performance**: < 2s average creation time for all object types
3. **Reliability**: 99.9% success rate for fossil creation
4. **Integration**: All objects pass pre-commit validation
5. **Documentation**: Complete API reference and examples
6. **Testing**: 90%+ test coverage for all new functionality

## Benefits

1. **Unified Fossilization**: All GitHub objects follow the same canonical fossil pattern
2. **Complete Traceability**: Every GitHub object is linked to a fossil for audit trails
3. **Deduplication**: Prevents duplicate objects across all GitHub object types
4. **Consistent Metadata**: Standardized metadata storage for all objects
5. **ML Integration**: All objects contribute to YAML context for LLM workflows
6. **Pre-Commit Validation**: Automated validation ensures fossil compliance
7. **Automation**: Enables comprehensive GitHub workflow automation
8. **Collaboration**: Standardized approach for team collaboration

This implementation plan ensures that all GitHub objects are supported with fossil-backed creation, following the unified canonical fossil patterns established in the project. 