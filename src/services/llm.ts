// Vercel AI SDK integration is not currently supported in this CLI context. For now, only the fetch-based OpenAI integration is provided.

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

/**
 * callOpenAIChat: Uses fetch to call OpenAI's chat/completions endpoint directly.
 * callVercelAIChat: Uses the Vercel AI SDK ('ai' package) for OpenAI chat completions.
 */

export async function callOpenAIChat({
  model,
  apiKey,
  messages,
  ...options
}: OpenAIChatOptions): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      ...options,
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
} 