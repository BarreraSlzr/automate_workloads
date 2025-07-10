export interface FileInfo {
  path: string;
  status: string;
  size?: number;
  lines?: number;
  lastModified?: string;
  type: 'file' | 'directory';
  extension?: string;
}

export interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface FileFootprint {
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