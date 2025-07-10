// LLM-related type definitions

// Define a minimal local type for OpenAI chat messages
export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatOptions {
  model: string;
  apiKey?: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: any;
}

export interface LLMProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  call: (options: OpenAIChatOptions) => Promise<any>;
  estimateTokens: (messages: ChatCompletionRequestMessage[]) => number;
  estimateCost: (tokens: number, model: string) => number;
}

// Types moved from services/llm.ts
export interface LLMUsageMetrics {
  timestamp: string;
  model: string;
  provider: 'openai' | 'local' | 'fallback';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  success: boolean;
  error?: string;
  context: string;
  purpose: string;
  valueScore: number; // 0-1 score of how valuable this call was
  // New fields for comprehensive tracing
  callId: string; // Unique identifier for this call
  inputHash: string; // Hash of the input for deduplication
  fossilId?: string; // Reference to fossilized data
  sessionId?: string; // Session identifier for grouping calls
  commitRef?: string; // Git commit reference
  traceData?: {
    validation?: any;
    preprocessing?: any;
    qualityAnalysis?: any;
    insights?: any[];
  };
}

export interface LLMOptimizationConfig {
  maxTokensPerCall: number;
  maxCostPerCall: number;
  minValueScore: number;
  enableLocalLLM: boolean;
  enableCaching: boolean;
  cacheExpiryHours: number;
  retryAttempts: number;
  retryDelayMs: number;
  rateLimitDelayMs: number;
  // New intelligent routing options
  preferLocalLLM: boolean;
  testMode: boolean;
  localLLMPriority: number; // 0-1, higher = prefer local more
  complexityThreshold: number; // 0-1, tasks above this use cloud LLM
  costSensitivity: number; // 0-1, higher = more cost sensitive
  // Memory-only mode for tests
  memoryOnly: boolean;
  // New comprehensive tracing options
  enableComprehensiveTracing: boolean;
  enableFossilization: boolean;
  enableConsoleOutput: boolean;
  enableSnapshotExport: boolean;
  fossilStoragePath?: string;
}

export interface LLMCallIntelligence {
  complexity: number; // 0-1, how complex the task is
  requiresContext: boolean; // Does it need external context?
  isCreative: boolean; // Is it creative vs analytical?
  isTimeSensitive: boolean; // Does it need fast response?
  canUseLocal: boolean; // Can local LLM handle this?
  estimatedQuality: number; // 0-1, expected quality from local vs cloud
  costBenefit: number; // 0-1, cost vs benefit ratio
}

// Types moved from services/llmEnhanced.ts
export interface EnhancedLLMOptions {
  enableInputValidation?: boolean;
  enablePreprocessing?: boolean;
  enableQualityAnalysis?: boolean;
  autoFixIssues?: boolean;
  strictMode?: boolean;
  logValidationResults?: boolean;
  enableFossilization?: boolean;
  fossilManagerParams?: Partial<any>; // Will be properly typed when LLMFossilManagerParams is moved
}

export interface EnhancedLLMResult {
  success: boolean;
  response: any;
  validation: any; // Will be properly typed when InputValidationResult is moved
  preprocessing?: any; // Will be properly typed when InputPreprocessingResult is moved
  qualityAnalysis?: any; // Will be properly typed when ContentQualityMetrics is moved
  warnings: string[];
  errors: string[];
  recommendations: string[];
  metadata: {
    originalInput: any;
    processedInput: any;
    validationTime: number;
    preprocessingTime: number;
    llmCallTime: number;
    totalTime: number;
  };
}

// PARAMS OBJECT PATTERN - Define parameter interfaces
export interface CallOpenAIChatParams {
  model: string;
  apiKey: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: any;
}

export interface LLMFossilManagerParams {
  owner: string;
  repo: string;
  commitRef?: string;
  sessionId?: string;
  fossilStoragePath?: string;
  enableAutoFossilization?: boolean;
  enableQualityMetrics?: boolean;
  enableValidationTracking?: boolean;
}

export interface LLMSnapshotExportParams {
  format: 'json' | 'yaml' | 'csv';
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  includeValidation?: boolean;
  includePreprocessing?: boolean;
  filters?: any;
}

export interface LLMSnapshotExportResult {
  outputPath: string;
  entriesExported: number;
  format: string;
  metadata?: any;
}

// Params Object Pattern for Enhanced LLM Service
export const EnhancedLLMServiceParamsSchema = {
  enableValidation: true,
  enablePreprocessing: true,
  enableFossilization: true,
  enableQualityAnalysis: true,
  fossilManagerParams: {
    owner: 'your-org',
    repo: 'your-repo',
    fossilStoragePath: 'fossils/llm_insights/',
    enableAutoFossilization: true,
    enableQualityMetrics: true,
    enableValidationTracking: true
  }
};

export type EnhancedLLMServiceParams = typeof EnhancedLLMServiceParamsSchema;

// Canonical LLM Input Validation Types
export interface ContentQualityMetrics {
  readability: number;
  clarity: number;
  specificity: number;
  completeness: number;
  overall: number;
}

export interface InputValidationResult {
  isValid: boolean;
  success: boolean; // Alias for isValid for test compatibility
  errors: string[];
  warnings: string[];
  sanitizedInput: any;
  processedInput: any; // Alias for sanitizedInput for test compatibility
  recommendations: string[];
  changes?: string[];
}

export type InputPreprocessingResult = InputValidationResult;

// For backward compatibility with validator utility
export type LLMInputValidatorResult = InputValidationResult; 