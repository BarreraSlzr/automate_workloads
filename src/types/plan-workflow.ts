export interface Issue {
  number: number;
  title: string;
  body?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  estimatedEffort: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
}

export interface Plan {
  tasks: Task[];
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{
      date: string;
      description: string;
      tasks: string[];
    }>;
  };
  risks: Array<{
    description: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
}

export interface PerIssuePlanOutput {
  perIssueChecklists: Record<string, string>;
  nextStepsPlan: string;
} 