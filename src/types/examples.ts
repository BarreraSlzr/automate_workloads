// Example/demo type definitions

export interface DemoResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface AutomationEcosystem {
  repository: {
    owner: string;
    repo: string;
  };
  projectId?: string;
  goals: string[];
  context: {
    decisions: Array<{
      title: string;
      content: string;
      tags: string[];
      timestamp: string;
    }>;
    insights: Array<{
      title: string;
      content: string;
      tags: string[];
      timestamp: string;
    }>;
  };
  progress: {
    healthScore: number;
    actionPlanCompletion: number;
    automationCompletion: number;
    totalIssues: number;
    completedIssues: number;
  };
}

export interface ToolUsage {
  tool: string;
  action: string;
  timestamp: string;
  result: string;
  context?: string;
}

export interface ToolImprovement {
  tool: string;
  improvement: string;
  rationale: string;
  impact: 'low' | 'medium' | 'high';
  source: 'usage-pattern' | 'performance-analysis' | 'user-feedback' | 'llm-insight';
} 