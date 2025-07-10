export interface StepResult {
  name: string;
  success: boolean;
  duration: number;
  output: string;
  errors: string[];
  warnings: string[];
} 