// LLM-related type definitions

// Define a minimal local type for OpenAI chat messages
export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatOptions {
  model: string;
  apiKey: string;
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