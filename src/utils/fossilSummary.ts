import * as fs from 'fs/promises';
import * as path from 'path';

const FOSSIL_DIR = path.resolve('.context-fossil/entries');

export interface FossilSummary {
  type: string;
  title: string;
  createdAt: string;
  tags: string[];
  excerpt: string;
}

export async function getFossilSummary(): Promise<FossilSummary[]> {
  const files = await fs.readdir(FOSSIL_DIR);
  const fossils: any[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const fossil = JSON.parse(await fs.readFile(path.join(FOSSIL_DIR, file), 'utf8'));
    fossils.push(fossil);
  }
  // Filter out test/irrelevant repos
  const filtered = fossils.filter(f => !/test-owner\/test-repo|owner\/repo|emmanuelbarrera\/automate_workloads/i.test(f.title));
  // Group by (type, title), keep only the most recent
  const groups: Record<string, any[]> = {};
  const groupKey = (f: any) => `${f.type}||${f.title}`;
  for (const fossil of filtered) {
    const key = groupKey(fossil);
    if (!groups[key]) groups[key] = [];
    groups[key].push(fossil);
  }
  const summary: FossilSummary[] = [];
  for (const group of Object.values(groups)) {
    group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const f = group[0];
    let excerpt = '';
    if (typeof f.content === 'string') {
      excerpt = f.content.replace(/\s+/g, ' ').slice(0, 80).trim();
    } else if (f.content && typeof f.content === 'object') {
      excerpt = JSON.stringify(f.content).replace(/\s+/g, ' ').slice(0, 80).trim();
    }
    summary.push({
      type: f.type,
      title: f.title,
      createdAt: f.createdAt,
      tags: Array.isArray(f.tags) ? f.tags : [],
      excerpt
    });
  }
  summary.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return summary;
} 