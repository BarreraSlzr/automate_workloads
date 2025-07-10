// Canonical VSCode AI types

export interface VSCodeAIConfig {
  provider: 'copilot' | 'claude' | 'auto';
  enabled: boolean;
  vscodePath?: string;
  workspacePath?: string;
  useChatInterface: boolean;
  useCommandPalette: boolean;
  timeout: number;
  enableFossilization: boolean;
  fossilStoragePath: string;
  enableSnapshotProcessing: boolean;
  enableDirectCalls: boolean;
  customCommands?: {
    chat?: string;
    analyze?: string;
    explain?: string;
    generate?: string;
  };
}

export interface VSCodeAIProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  call: (options: VSCodeAICallOptions) => Promise<VSCodeAIResponse>;
  processSnapshot: (options: VSCodeAISnapshotOptions) => Promise<VSCodeAIResponse>;
  estimateTokens: (messages: any[]) => number;
  estimateCost: (tokens: number) => number;
}

export interface VSCodeAICallOptions {
  messages: any[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
  purpose?: string;
  valueScore?: number;
  useChat?: boolean;
  useCommandPalette?: boolean;
}

export interface VSCodeAISnapshotOptions {
  snapshotPath: string;
  analysisType: 'summary' | 'insights' | 'recommendations' | 'audit';
  context?: string;
  purpose?: string;
  valueScore?: number;
}

export interface VSCodeAIResponse {
  content: string;
  model: string;
  provider: string;
  tokens: number;
  cost: number;
  duration: number;
  metadata: {
    callId: string;
    inputHash: string;
    sessionId: string;
    timestamp: string;
    success: boolean;
    error?: string;
  };
}

export interface VSCodeAIFossil {
  id: string;
  type: 'vscode-ai-call' | 'vscode-ai-snapshot';
  timestamp: string;
  provider: string;
  model: string;
  input: VSCodeAICallOptions | VSCodeAISnapshotOptions;
  response: VSCodeAIResponse;
  metadata: {
    workspacePath: string;
    fileContext?: string;
    gitBranch?: string;
    gitCommit?: string;
  };
} 