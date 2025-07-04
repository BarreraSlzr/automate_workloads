// Prompt registry for LLM automation and fossilization
// Each prompt is a named export for easy tracking, improvement, and reuse
// This file is intended to be the single source of truth for all LLM prompt templates

// Versioned prompt and system message registry for workflow-templating
export interface PromptTemplate {
  id: string;
  version: string;
  description: string;
  template: (params: Record<string, any>) => string;
  systemMessage: string;
}

export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  'roadmap-insight-v1': {
    id: 'roadmap-insight',
    version: 'v1',
    description: 'Summarize a completed roadmap task for project reporting, including summary, blockers, recommendations, impact, and excerpt.',
    template: (params: Record<string, any>) => {
      const { task, context = '' } = params;
      return `Summarize the following completed roadmap task for project reporting. Provide:
- summary: one-sentence summary
- blockers: main blockers
- recommendations: actionable next steps
- impact: project impact
- excerpt: one-sentence excerpt

Task: ${task}
Context: ${context}`;
    },
    systemMessage: 'You are an expert project automation assistant. Respond concisely and use the requested structure.'
  },
  // Add more prompts as needed, with versioning
};

// Export specific prompts for easy access
export const PROMPT_ROADMAP_INSIGHT = PROMPT_REGISTRY['roadmap-insight-v1'];

// Usage: PROMPT_REGISTRY['roadmap-insight-v1'] 