import { yamlToJson } from '../src/utils/yamlToJson';
import { roadmapToMarkdown } from '../src/utils/roadmapToMarkdown';
import { E2ERoadmap } from '../src/types/e2e-roadmap';
import fs from 'fs';

const yamlPath = 'src/types/e2e-roadmap.yaml';
const jsonPath = 'src/types/e2e-roadmap.json';
const mdPath = 'docs/E2E_ROADMAP.md';

// 1. Load YAML and convert to typed object
const roadmap = yamlToJson<E2ERoadmap>(yamlPath);

// 2. Write JSON for API/automation
fs.writeFileSync(jsonPath, JSON.stringify(roadmap, null, 2));

// 3. Render Markdown for docs/issues
const markdown = roadmapToMarkdown(roadmap);
fs.writeFileSync(mdPath, markdown);

console.log('Fossilized roadmap as Markdown:');
console.log(markdown);
console.log('\nFossilized roadmap as JSON:');
console.log(JSON.stringify(roadmap, null, 2)); 