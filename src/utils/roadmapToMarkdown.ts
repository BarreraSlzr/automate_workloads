import type { E2ERoadmap } from '../types';

export function roadmapToMarkdown(roadmap: E2ERoadmap): string {
  const header = `# E2E Automation & Testing Roadmap\n_Source: ${roadmap.source} | Created: ${roadmap.createdAt}_\n`;
  const tasks = roadmap.tasks.map(task => {
    const statusBox = task.status === 'done' ? 'x' : ' ';
    let md = `- [${statusBox}] **${task.task}**`;
    if (task.recommendation) md += `\n  - Recommendation: ${task.recommendation}`;
    if (task.preference) md += `\n  - Preference: ${task.preference}`;
    return md;
  }).join('\n\n');
  return `${header}\n${tasks}`;
} 