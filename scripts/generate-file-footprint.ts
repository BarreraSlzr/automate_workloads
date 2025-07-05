#!/usr/bin/env bun

import { z } from 'zod';
import { execSync } from 'child_process';
import { writeFile, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { parseCLIArgs } from '../src/types/cli';

const GenerateFileFootprintParams = z.object({
  output: z.string().optional().default('fossils/file-footprint.yml'),
  includeStaged: z.boolean().optional().default(true),
  includeUnstaged: z.boolean().optional().default(true),
  includeUntracked: z.boolean().optional().default(true),
  includeStats: z.boolean().optional().default(true),
  format: z.enum(['yaml', 'json']).optional().default('yaml'),
  fossilize: z.boolean().optional().default(true),
  validate: z.boolean().optional().default(false),
  test: z.boolean().optional().default(false),
});

interface FileFootprint {
  timestamp: string;
  git: {
    branch: string;
    commit: string;
    status: string;
    lastCommit: {
      hash: string;
      message: string;
      author: string;
      date: string;
    };
  };
  files: {
    staged: FileInfo[];
    unstaged: FileInfo[];
    untracked: FileInfo[];
    all: FileInfo[];
  };
  stats: {
    totalFiles: number;
    stagedCount: number;
    unstagedCount: number;
    untrackedCount: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
    fileTypes: Record<string, number>;
  };
  machine: {
    hostname: string;
    username: string;
    workingDirectory: string;
    timestamp: string;
  };
  fossilization: {
    version: string;
    checksum: string;
    validated: boolean;
    testResults?: TestResult[];
  };
}

interface FileInfo {
  path: string;
  status: string;
  size?: number;
  lines?: number;
  lastModified?: string;
  type: 'file' | 'directory';
  extension?: string;
}

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

export async function generateFileFootprint(params: z.infer<typeof GenerateFileFootprintParams>): Promise<FileFootprint> {
  console.log('🔍 Generating file footprint...');
  
  const timestamp = new Date().toISOString();
  
  // Get git information
  const gitInfo = await getGitInfo();
  
  // Get file information
  const files = await getFileInfo(params);
  
  // Calculate statistics
  const stats = await calculateStats(files);
  
  // Get machine information
  const machineInfo = await getMachineInfo();
  
  // Generate checksum for fossilization
  const checksum = await generateChecksum({ gitInfo, files, stats, machineInfo });
  
  // Run tests if requested
  const testResults = params.test ? await runFootprintTests({ files, stats, gitInfo }) : undefined;
  
  const footprint: FileFootprint = {
    timestamp,
    git: gitInfo,
    files,
    stats,
    machine: machineInfo,
    fossilization: {
      version: '1.0.0',
      checksum,
      validated: params.validate ? await validateFootprint({ files, stats, gitInfo }) : false,
      testResults,
    },
  };
  
  // Write footprint to file
  await writeFootprint(footprint, params.output, params.format);
  
  // Fossilize if requested
  if (params.fossilize) {
    await fossilizeFootprint(footprint, params.output);
  }
  
  console.log(`✅ File footprint generated: ${params.output}`);
  console.log(`📊 Summary: ${stats.totalFiles} files tracked`);
  
  if (testResults) {
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    console.log(`🧪 Tests: ${passedTests}/${totalTests} passed`);
  }
  
  return footprint;
}

async function getGitInfo() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    
    // Get last commit information
    const lastCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const lastCommitMessage = execSync('git log -1 --pretty=format:%s', { encoding: 'utf-8' }).trim();
    const lastCommitAuthor = execSync('git log -1 --pretty=format:%an', { encoding: 'utf-8' }).trim();
    const lastCommitDate = execSync('git log -1 --pretty=format:%ai', { encoding: 'utf-8' }).trim();
    
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

async function getFileInfo(params: z.infer<typeof GenerateFileFootprintParams>) {
  const staged: FileInfo[] = [];
  const unstaged: FileInfo[] = [];
  const untracked: FileInfo[] = [];
  const all: FileInfo[] = [];
  
  try {
    // Get git status
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    const statusLines = statusOutput ? statusOutput.split('\n') : [];
    
    for (const line of statusLines) {
      if (!line) continue;
      
      const status = line.substring(0, 2).trim();
      const path = line.substring(3);
      
      const fileInfo = await getFileDetails(path);
      
      if (status && params.includeStaged) {
        staged.push({ ...fileInfo, status });
        all.push({ ...fileInfo, status });
      } else if (!status && params.includeUnstaged) {
        unstaged.push({ ...fileInfo, status: 'M' });
        all.push({ ...fileInfo, status: 'M' });
      }
    }
    
    // Get untracked files
    if (params.includeUntracked) {
      try {
        const untrackedOutput = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' }).trim();
        const untrackedPaths = untrackedOutput ? untrackedOutput.split('\n') : [];
        
        for (const path of untrackedPaths) {
          if (path) {
            const fileInfo = await getFileDetails(path);
            untracked.push({ ...fileInfo, status: '??' });
            all.push({ ...fileInfo, status: '??' });
          }
        }
      } catch (error) {
        console.warn('⚠️  Could not get untracked files');
      }
    }
    
  } catch (error) {
    console.warn('⚠️  Git status command failed, treating as non-git directory');
    
    // If not in git repository, scan all files
    const allFiles = await scanAllFiles('.');
    for (const file of allFiles) {
      all.push({ ...file, status: 'unknown' });
    }
  }
  
  return { staged, unstaged, untracked, all };
}

async function getFileDetails(path: string): Promise<FileInfo> {
  try {
    const stats = await stat(path);
    const isDirectory = stats.isDirectory();
    const extension = isDirectory ? undefined : path.split('.').pop();
    
    let lines: number | undefined;
    if (!isDirectory && stats.size < 10 * 1024 * 1024) { // Only count lines for files < 10MB
      try {
        const content = await readFile(path, 'utf-8');
        lines = content.split('\n').length;
      } catch {
        // Ignore read errors
      }
    }
    
    return {
      path,
      status: '',
      size: stats.size,
      lines,
      lastModified: stats.mtime.toISOString(),
      type: isDirectory ? 'directory' : 'file',
      extension,
    };
  } catch (error) {
    return {
      path,
      status: '',
      type: 'file',
    };
  }
}

async function scanAllFiles(dir: string): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  
  try {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');
    
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push({
            path: fullPath,
            status: '',
            type: 'directory',
          });
          
          // Recursively scan subdirectories (with depth limit)
          if (fullPath.split('/').length < 5) { // Limit depth
            const subFiles = await scanAllFiles(fullPath);
            files.push(...subFiles);
          }
        }
      } else {
        const fileInfo = await getFileDetails(fullPath);
        files.push(fileInfo);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan directory: ${dir}`);
  }
  
  return files;
}

async function calculateStats(files: FileFootprint['files']) {
  const allFiles = files.all;
  const fileTypes: Record<string, number> = {};
  
  let totalLinesAdded = 0;
  let totalLinesDeleted = 0;
  
  // Calculate file type distribution
  for (const file of allFiles) {
    if (file.extension) {
      fileTypes[file.extension] = (fileTypes[file.extension] || 0) + 1;
    }
  }
  
  // Try to get line change statistics from git
  try {
    const diffStats = execSync('git diff --stat', { encoding: 'utf-8' }).trim();
    const lines = diffStats.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
      if (match) {
        totalLinesAdded += parseInt(match[1] ?? "0", 10);
        totalLinesDeleted += parseInt(match[2] ?? "0", 10);
      }
    }
  } catch (error) {
    // Ignore if git diff fails
  }
  
  return {
    totalFiles: allFiles.length,
    stagedCount: files.staged.length,
    unstagedCount: files.unstaged.length,
    untrackedCount: files.untracked.length,
    totalLinesAdded,
    totalLinesDeleted,
    fileTypes,
  };
}

async function getMachineInfo() {
  let hostname = 'unknown';
  let username = 'unknown';
  
  try {
    hostname = execSync('hostname', { encoding: 'utf-8' }).trim();
  } catch {
    // Use default value
  }
  
  try {
    username = execSync('whoami', { encoding: 'utf-8' }).trim();
  } catch {
    // Use default value
  }
  
  const workingDirectory = process.cwd();
  const timestamp = new Date().toISOString();
  
  return {
    hostname,
    username,
    workingDirectory,
    timestamp,
  };
}

async function generateChecksum(data: any): Promise<string> {
  const content = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

async function validateFootprint(params: { files: FileFootprint['files']; stats: FileFootprint['stats']; gitInfo: FileFootprint['git'] }): Promise<boolean> {
  const { files, stats, gitInfo } = params;
  
  // Basic validation checks
  const validations = [
    // Check if total files count matches
    files.all.length === stats.totalFiles,
    
    // Check if staged count matches
    files.staged.length === stats.stagedCount,
    
    // Check if unstaged count matches
    files.unstaged.length === stats.unstagedCount,
    
    // Check if untracked count matches
    files.untracked.length === stats.untrackedCount,
    
    // Check if git info is valid
    gitInfo.branch !== 'unknown',
    gitInfo.commit !== 'unknown',
    
    // Check if machine info is valid
    files.all.length >= 0,
  ];
  
  return validations.every(v => v);
}

async function runFootprintTests(params: { files: FileFootprint['files']; stats: FileFootprint['stats']; gitInfo: FileFootprint['git'] }): Promise<TestResult[]> {
  const { files, stats, gitInfo } = params;
  const results: TestResult[] = [];
  
  // Test 1: File count consistency
  results.push({
    test: 'File count consistency',
    passed: files.all.length === stats.totalFiles,
    message: `Expected ${stats.totalFiles} files, found ${files.all.length}`,
  });
  
  // Test 2: Git repository validity
  results.push({
    test: 'Git repository validity',
    passed: gitInfo.branch !== 'unknown' && gitInfo.commit !== 'unknown',
    message: gitInfo.branch === 'unknown' ? 'Not in a git repository' : 'Git repository valid',
  });
  
  // Test 3: File path validity
  const invalidPaths = files.all.filter(f => !f.path || f.path.includes('..'));
  results.push({
    test: 'File path validity',
    passed: invalidPaths.length === 0,
    message: invalidPaths.length > 0 ? `Found ${invalidPaths.length} invalid paths` : 'All paths valid',
    details: invalidPaths,
  });
  
  // Test 4: File size consistency
  const oversizedFiles = files.all.filter(f => f.size && f.size > 100 * 1024 * 1024); // 100MB
  results.push({
    test: 'File size consistency',
    passed: oversizedFiles.length === 0,
    message: oversizedFiles.length > 0 ? `Found ${oversizedFiles.length} oversized files` : 'All files within size limits',
    details: oversizedFiles,
  });
  
  // Test 5: Line count consistency
  const invalidLineCounts = files.all.filter(f => f.lines && f.lines < 0);
  results.push({
    test: 'Line count consistency',
    passed: invalidLineCounts.length === 0,
    message: invalidLineCounts.length > 0 ? `Found ${invalidLineCounts.length} files with invalid line counts` : 'All line counts valid',
  });
  
  return results;
}

async function fossilizeFootprint(footprint: FileFootprint, outputPath: string) {
  try {
    // Create fossil entry
    const fossilEntry = {
      type: 'file-footprint',
      timestamp: footprint.timestamp,
      data: footprint,
      metadata: {
        version: footprint.fossilization.version,
        checksum: footprint.fossilization.checksum,
        validated: footprint.fossilization.validated,
        source: outputPath,
      },
    };
    
    // Write to fossil directory
    const fossilPath = join(process.cwd(), 'fossils', `footprint-fossil-${footprint.timestamp.replace(/[:.]/g, '-')}.json`);
    await writeFile(fossilPath, JSON.stringify(fossilEntry, null, 2));
    
    console.log(`💾 Footprint fossilized: ${fossilPath}`);
  } catch (error) {
    console.warn('⚠️  Failed to fossilize footprint:', error);
  }
}

async function writeFootprint(footprint: FileFootprint, outputPath: string, format: 'yaml' | 'json') {
  const { mkdir } = await import('fs/promises');
  const { dirname } = await import('path');
  
  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true });
  
  if (format === 'yaml') {
    const yaml = await import('yaml');
    const yamlContent = yaml.stringify(footprint, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 20,
    });
    await writeFile(outputPath, yamlContent);
  } else {
    await writeFile(outputPath, JSON.stringify(footprint, null, 2));
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = parseCLIArgs(GenerateFileFootprintParams, args);
  generateFileFootprint(params).catch(console.error);
} 