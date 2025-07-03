import fs from 'fs/promises';

export async function mockCallOpenAIChat() {
  return {
    choices: [{ message: { content: "Mocked LLM response" } }]
  };
}

// Loads mock repo data from a fossil file for test/mock mode
export async function loadMockRepoDataFromFossil(fossilPath = 'fossils/curated_roadmap_demo_2025-07-02.json') {
  const fossil = JSON.parse(await fs.readFile(fossilPath, 'utf-8'));
  // Adapt this to match the expected repo info structure in getRepositoryInfo
  return {
    name: 'automate_workloads',
    owner: 'barreraslzr',
    description: fossil.content?.description || 'Fossilized repo for test',
    language: 'TypeScript',
    stars: 42,
    forks: 7,
    openIssues: fossil.content?.tasks?.length || 1,
    openPRs: 0,
    lastCommit: fossil.createdAt,
    defaultBranch: 'main',
    issues: (fossil.content?.tasks || []).map((t: any, i: number) => ({
      number: i + 1,
      title: t.task,
      labels: (t.labels || []).map((l: any) => ({ name: l, color: 'ededed' })),
      updatedAt: fossil.createdAt
    })),
  };
} 