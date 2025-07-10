#!/usr/bin/env bun

import { z } from 'zod';
import { writeFile, readFile, exists } from 'fs/promises';
import { parseCLIArgs } from '../src/types/cli';
import { executeCommand } from '../src/utils/cli';
import { parseJsonSafe } from '../src/utils/json';

const EvolvingFootprintParams = z.object({
  output: z.string().optional().default('fossils/evolving-footprint.yml'),
  format: z.enum(['yaml', 'json']).optional().default('yaml'),
  update: z.union([z.boolean(), z.string()]).transform(val => val === 'true' || val === true).optional().default(true),
  includeHistory: z.union([z.boolean(), z.string()]).transform(val => val === 'true' || val === true).optional().default(true),
  maxHistoryEntries: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val).optional().default(50),
});

interface FileSnapshot {
  path: string;
  status: string;
  size?: number;
  lines?: number;
  lastModified?: string;
  extension?: string;
}

interface CommitSnapshot {
  timestamp: string;
  commit: string;
  branch: string;
  message: string;
  author: string;
  files: {
    staged: FileSnapshot[];
    unstaged: FileSnapshot[];
    untracked: FileSnapshot[];
  };
  stats: {
    totalFiles: number;
    stagedCount: number;
    unstagedCount: number;
    untrackedCount: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
  };
  gitStatus: string;
}

interface EvolvingFootprint {
  current: CommitSnapshot;
  history: CommitSnapshot[];
  metadata: {
    created: string;
    lastUpdated: string;
    totalCommits: number;
    totalFilesTracked: number;
  };
}

export async function generateEvolvingFootprint(params: z.infer<typeof EvolvingFootprintParams>): Promise<EvolvingFootprint> {
  console.log('🔍 Generating evolving footprint...');
  
  const timestamp = new Date().toISOString();
  
  // Get current git information
  const gitInfo = await getGitInfo();
  
  // Get current file information
  const files = await getFileInfo();
  
  // Calculate current statistics
  const stats = await calculateStats(files);
  
  // Create current snapshot
  const currentSnapshot: CommitSnapshot = {
    timestamp,
    commit: gitInfo.commit,
    branch: gitInfo.branch,
    message: gitInfo.lastCommit.message,
    author: gitInfo.lastCommit.author,
    files,
    stats,
    gitStatus: gitInfo.status,
  };
  
  // Load existing footprint or create new one
  let footprint: EvolvingFootprint;
  
  if (params.update && await exists(params.output)) {
    try {
      const existingContent = await readFile(params.output, 'utf-8');
      footprint = await parseFootprint(existingContent);
      
      // Add current snapshot to history
      footprint.history.unshift(footprint.current);
      
      // Limit history size
      if (footprint.history.length > params.maxHistoryEntries) {
        footprint.history = footprint.history.slice(0, params.maxHistoryEntries);
      }
      
      // Update current snapshot
      footprint.current = currentSnapshot;
      footprint.metadata.lastUpdated = timestamp;
      footprint.metadata.totalCommits++;
      footprint.metadata.totalFilesTracked = Math.max(
        footprint.metadata.totalFilesTracked,
        stats.totalFiles
      );
      
    } catch (error) {
      console.warn('⚠️  Failed to load existing footprint, creating new one:', error);
      footprint = createNewFootprint(currentSnapshot, timestamp);
    }
  } else {
    footprint = createNewFootprint(currentSnapshot, timestamp);
  }
  
  // Write footprint to file
  await writeFootprint({ footprint, outputPath: params.output, format: params.format });
  
  console.log(`✅ Evolving footprint updated: ${params.output}`);
  console.log(`📊 Current: ${stats.totalFiles} files, ${footprint.metadata.totalCommits} commits tracked`);
  console.log(`📈 History: ${footprint.history.length} entries`);
  
  return footprint;
}

function createNewFootprint(currentSnapshot: CommitSnapshot, timestamp: string): EvolvingFootprint {
  return {
    current: currentSnapshot,
    history: [],
    metadata: {
      created: timestamp,
      lastUpdated: timestamp,
      totalCommits: 1,
      totalFilesTracked: currentSnapshot.stats.totalFiles,
    },
  };
}

async function getGitInfo() {
  try {
    const branch = (await executeCommand('git branch --show-current')).stdout.trim();
    const commit = (await executeCommand('git rev-parse HEAD')).stdout.trim();
    const status = (await executeCommand('git status --porcelain')).stdout.trim();
    
    // Get last commit information
    const lastCommitHash = (await executeCommand('git rev-parse HEAD')).stdout.trim();
    const lastCommitMessage = (await executeCommand('git log -1 --pretty=format:%s')).stdout.trim();
    const lastCommitAuthor = (await executeCommand('git log -1 --pretty=format:%an')).stdout.trim();
    const lastCommitDate = (await executeCommand('git log -1 --pretty=format:%ai')).stdout.trim();
    
    return {
      branch,
      commit,
      status,
      lastCommit: {
        hash: lastCommitHash,
        message: lastCommitMessage,
        author: lastCommitAuthor,
        date: lastCommitDate,
      },
    };
  } catch (error) {
    console.warn('⚠️  Not in a git repository or git command failed');
    return {
      branch: 'unknown',
      commit: 'unknown',
      status: '',
      lastCommit: {
        hash: 'unknown',
        message: 'unknown',
        author: 'unknown',
        date: 'unknown',
      },
    };
  }
}

async function getFileInfo() {
  const staged: FileSnapshot[] = [];
  const unstaged: FileSnapshot[] = [];
  const untracked: FileSnapshot[] = [];
  
  try {
    // Get staged files
    const stagedOutput = (await executeCommand('git diff --cached --name-only')).stdout.trim();
    if (stagedOutput) {
      for (const path of stagedOutput.split('\n').filter(Boolean)) {
        staged.push(await getFileSnapshot(path, 'A'));
      }
    }
    
    // Get unstaged files
    const unstagedOutput = (await executeCommand('git diff --name-only')).stdout.trim();
    if (unstagedOutput) {
      for (const path of unstagedOutput.split('\n').filter(Boolean)) {
        unstaged.push(await getFileSnapshot(path, 'M'));
      }
    }
    
    // Get untracked files
    const untrackedOutput = (await executeCommand('git ls-files --others --exclude-standard')).stdout.trim();
    if (untrackedOutput) {
      for (const path of untrackedOutput.split('\n').filter(Boolean)) {
        untracked.push(await getFileSnapshot(path, '??'));
      }
    }
  } catch (error) {
    throw new Error('Failed to get file status: ' + error);
  }
  
  return {
    staged,
    unstaged,
    untracked,
  };
}

async function getFileSnapshot(path: string, status: string): Promise<FileSnapshot> {
  try {
    const { stat } = await import('fs/promises');
    const fileStat = await stat(path);
    
    const extension = path.includes('.') ? path.split('.').pop() : undefined;
    
    let lines: number | undefined;
    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(path, 'utf-8');
      lines = content.split('\n').length;
    } catch {
      // File might be binary or unreadable
      lines = undefined;
    }
    
    return {
      path,
      status,
      size: fileStat.size,
      lines,
      lastModified: fileStat.mtime.toISOString(),
      extension,
    };
  } catch (error) {
    return {
      path,
      status,
    };
  }
}

async function calculateStats(files: { staged: FileSnapshot[]; unstaged: FileSnapshot[]; untracked: FileSnapshot[] }) {
  const stagedCount = files.staged.length;
  const unstagedCount = files.unstaged.length;
  const untrackedCount = files.untracked.length;
  const totalFiles = stagedCount + unstagedCount + untrackedCount;
  
  // Get line change statistics for staged files
  let totalLinesAdded = 0;
  let totalLinesDeleted = 0;
  
  try {
    if (stagedCount > 0) {
      const diffStats = (await executeCommand('git diff --cached --stat')).stdout;
      const lastLine = diffStats.split('\n').pop();
      if (lastLine) {
        const addedMatch = lastLine.match(/(\d+) insertions?/);
        const deletedMatch = lastLine.match(/(\d+) deletions?/);
        
        if (addedMatch && addedMatch[1]) totalLinesAdded = parseInt(addedMatch[1]);
        if (deletedMatch && deletedMatch[1]) totalLinesDeleted = parseInt(deletedMatch[1]);
      }
    }
  } catch (error) {
    throw new Error('Failed to get diff stats: ' + error);
  }
  
  return {
    totalFiles,
    stagedCount,
    unstagedCount,
    untrackedCount,
    totalLinesAdded,
    totalLinesDeleted,
  };
}

async function parseFootprint(content: string): Promise<EvolvingFootprint> {
  try {
    // Try YAML first
    const yaml = await import('yaml');
    return yaml.parse(content);
  } catch {
    try {
      // Try JSON
      return parseJsonSafe(content, 'scripts/generate-evolving-footprint:parseFootprint');
    } catch (error) {
      throw new Error('Failed to parse footprint file');
    }
  }
}

async function writeFootprint(params: { footprint: EvolvingFootprint, outputPath: string, format: 'yaml' | 'json' }) {
  const { mkdir } = await import('fs/promises');
  const { dirname } = await import('path');
  
  // Ensure output directory exists
  await mkdir(dirname(params.outputPath), { recursive: true });
  
  if (params.format === 'yaml') {
    const yaml = await import('yaml');
    const yamlContent = yaml.stringify(params.footprint, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 20,
    });
    await writeFile(params.outputPath, yamlContent);
  } else {
    await writeFile(params.outputPath, JSON.stringify(params.footprint, null, 2));
  }
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const params = parseCLIArgs(EvolvingFootprintParams, args);
  
  generateEvolvingFootprint(params)
    .then(() => {
      console.log('✅ Evolving footprint generation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error generating evolving footprint:', error);
      process.exit(1);
    });
} 