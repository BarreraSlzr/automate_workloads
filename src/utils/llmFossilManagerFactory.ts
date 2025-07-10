import type { LLMFossilManagerParams } from '../types/llm';

export async function createLLMFossilManagerFactory(params: LLMFossilManagerParams) {
  const { LLMFossilManager } = await import('./llmFossilManager');
  return await LLMFossilManager.create(params);
} 