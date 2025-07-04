import { executeCommand } from './cli';

export interface TimestampChange {
  file: string;
  lineNumber: number;
  oldTimestamp: string;
  newTimestamp: string;
  field: string;
}

export interface TimestampFilterOptions {
  /** Patterns to match timestamp fields (default: common timestamp patterns) */
  timestampPatterns?: RegExp[];
  /** Whether to ignore changes that are only timestamps */
  ignoreTimestampOnly?: boolean;
  /** Whether to show detailed analysis */
  verbose?: boolean;
  /** Custom patterns for specific file types */
  filePatterns?: Record<string, RegExp[]>;
}

export class TimestampFilter {
  private defaultTimestampPatterns = [
    /lastUpdated|lastChecked|timestamp|updated_at|created_at|modified_at/i,
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/, // ISO 8601 format
    /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // Common datetime format
  ];

  private defaultFilePatterns: Record<string, RegExp[]> = {
    '*.yml': [/lastUpdated|lastChecked|timestamp/i],
    '*.yaml': [/lastUpdated|lastChecked|timestamp/i],
    '*.json': [/lastUpdated|lastChecked|timestamp|updated_at|created_at/i],
    '*.md': [/lastUpdated|lastChecked|timestamp/i],
  };

  /**
   * Analyze git diff for timestamp-only changes
   */
  async analyzeTimestampChanges(options: TimestampFilterOptions = {}): Promise<{
    hasOnlyTimestampChanges: boolean;
    timestampChanges: TimestampChange[];
    otherChanges: string[];
    filesWithTimestampOnly: string[];
  }> {
    const {
      timestampPatterns = this.defaultTimestampPatterns,
      filePatterns = this.defaultFilePatterns,
      verbose = false,
    } = options;

    // Get current git diff
    const diffOutput = executeCommand('git diff --unified=0');
    if (!diffOutput.success || !diffOutput.stdout) {
      return {
        hasOnlyTimestampChanges: false,
        timestampChanges: [],
        otherChanges: [],
        filesWithTimestampOnly: [],
      };
    }

    const lines = diffOutput.stdout.split('\n');
    const timestampChanges: TimestampChange[] = [];
    const otherChanges: string[] = [];
    const filesWithTimestampOnly = new Set<string>();
    let currentFile = '';

    for (const line of lines) {
      // Track current file
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (match && match[1]) {
          currentFile = match[1];
        }
        continue;
      }

      // Skip file headers and context lines
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
        continue;
      }

      // Analyze added/removed lines
      if (line.startsWith('+') || line.startsWith('-')) {
        const content = line.substring(1);
        const isTimestampChange = this.isTimestampChange(content, timestampPatterns, currentFile || '', filePatterns);

        if (isTimestampChange) {
          const change = this.extractTimestampChange(line, currentFile || '');
          if (change) {
            timestampChanges.push(change);
          }
        } else {
          otherChanges.push(`${currentFile || 'unknown'}: ${line}`);
        }
      }
    }

    // Group changes by file to identify files with only timestamp changes
    const changesByFile = new Map<string, { timestamps: number; others: number }>();
    
    for (const change of timestampChanges) {
      const current = changesByFile.get(change.file) || { timestamps: 0, others: 0 };
      current.timestamps++;
      changesByFile.set(change.file, current);
    }

    for (const change of otherChanges) {
      const file = change.split(':')[0];
      const current = changesByFile.get(file) || { timestamps: 0, others: 0 };
      current.others++;
      changesByFile.set(file, current);
    }

    // Identify files with only timestamp changes
    for (const [file, counts] of changesByFile) {
      if (counts.timestamps > 0 && counts.others === 0) {
        filesWithTimestampOnly.add(file);
      }
    }

    const hasOnlyTimestampChanges = filesWithTimestampOnly.size > 0 && otherChanges.length === 0;

    if (verbose) {
      console.log(`📊 Timestamp Analysis:`);
      console.log(`   Files with timestamp-only changes: ${Array.from(filesWithTimestampOnly).join(', ')}`);
      console.log(`   Total timestamp changes: ${timestampChanges.length}`);
      console.log(`   Other changes: ${otherChanges.length}`);
      console.log(`   Has only timestamp changes: ${hasOnlyTimestampChanges}`);
    }

    return {
      hasOnlyTimestampChanges,
      timestampChanges,
      otherChanges,
      filesWithTimestampOnly: Array.from(filesWithTimestampOnly),
    };
  }

  /**
   * Check if a line represents a timestamp change
   */
  private isTimestampChange(
    content: string,
    timestampPatterns: RegExp[],
    file: string,
    filePatterns: Record<string, RegExp[]>
  ): boolean {
    // Check file-specific patterns first
    for (const [pattern, patterns] of Object.entries(filePatterns)) {
      if (this.matchesFilePattern(file, pattern)) {
        for (const regex of patterns) {
          if (regex.test(content)) {
            return true;
          }
        }
      }
    }

    // Check general timestamp patterns
    for (const pattern of timestampPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract timestamp change details from a diff line
   */
  private extractTimestampChange(line: string, file: string): TimestampChange | null {
    // Match patterns like: lastUpdated: "2025-07-04T00:42:04Z"
    const timestampPattern = /(\w+):\s*"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"/;
    const match = line.match(timestampPattern);
    
    if (!match || !match[1] || !match[2]) return null;

    const [, field, timestamp] = match;
    const lineNumber = this.extractLineNumber(line);

    return {
      file,
      lineNumber,
      oldTimestamp: timestamp, // This would need to be paired with the corresponding - line
      newTimestamp: timestamp,
      field,
    };
  }

  /**
   * Extract line number from diff line
   */
  private extractLineNumber(line: string): number {
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if file matches a pattern
   */
  private matchesFilePattern(file: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(regexPattern).test(file);
    }
    return file === pattern;
  }

  /**
   * Get recommendations for handling timestamp-only changes
   */
  getRecommendations(analysis: {
    hasOnlyTimestampChanges: boolean;
    timestampChanges: TimestampChange[];
    otherChanges: string[];
    filesWithTimestampOnly: string[];
  }): string[] {
    const recommendations: string[] = [];

    if (analysis.hasOnlyTimestampChanges) {
      recommendations.push(
        '🕐 Only timestamp changes detected. Consider:',
        '   - Skip commit: git reset HEAD~1',
        '   - Update .gitignore to exclude timestamp fields',
        '   - Use --ignore-timestamp-only flag in automation scripts'
      );
    } else if (analysis.filesWithTimestampOnly.length > 0) {
      recommendations.push(
        '⚠️  Mixed changes detected:',
        `   - Files with only timestamps: ${analysis.filesWithTimestampOnly.join(', ')}`,
        '   - Consider staging only non-timestamp changes'
      );
    }

    if (analysis.timestampChanges.length > 0) {
      recommendations.push(
        `📅 ${analysis.timestampChanges.length} timestamp changes found`,
        '   - Review if these are necessary for tracking'
      );
    }

    return recommendations;
  }

  /**
   * Create a git hook to automatically filter timestamp-only commits
   */
  async createGitHook(): Promise<void> {
    const hookContent = `#!/bin/sh
# Pre-commit hook to detect timestamp-only changes

# Run timestamp filter
bun run src/utils/timestampFilter.ts --check

# If only timestamp changes, ask user what to do
if [ $? -eq 0 ]; then
  echo "⚠️  Only timestamp changes detected. Continue with commit? (y/N)"
  read -r response
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "❌ Commit cancelled"
    exit 1
  fi
fi
`;

    const echoResult = executeCommand(`echo '${hookContent}' > .git/hooks/pre-commit`);
    if (!echoResult.success) {
      throw new Error(`Failed to create git hook: ${echoResult.stderr}`);
    }
    const chmodResult = executeCommand('chmod +x .git/hooks/pre-commit');
    if (!chmodResult.success) {
      throw new Error(`Failed to set git hook permissions: ${chmodResult.stderr}`);
    }
  }
}

/**
 * CLI interface for timestamp filter
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filter = new TimestampFilter();

  if (args.includes('--check')) {
    const analysis = await filter.analyzeTimestampChanges({ verbose: true });
    const recommendations = filter.getRecommendations(analysis);
    
    console.log('\n' + recommendations.join('\n'));
    
    // Exit with code 0 if only timestamp changes, 1 otherwise
    process.exit(analysis.hasOnlyTimestampChanges ? 0 : 1);
  }

  if (args.includes('--create-hook')) {
    await filter.createGitHook();
    console.log('✅ Git hook created at .git/hooks/pre-commit');
    return;
  }

  // Default: analyze and show results
  const analysis = await filter.analyzeTimestampChanges({ verbose: true });
  const recommendations = filter.getRecommendations(analysis);
  
  console.log('\n' + recommendations.join('\n'));
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
} 