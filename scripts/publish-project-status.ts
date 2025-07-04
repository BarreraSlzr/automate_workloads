#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { formatISO } from 'date-fns';

const PROJECT_STATUS_YML = path.resolve('fossils/project_status.yml');
const BLOG_MD = path.resolve('fossils/public/blog/project_status.post.md');
const API_JSON = path.resolve('fossils/public/api/project_status_public.json');
const AUDIENCE = 'public';
const SOURCE = 'fossils/project_status.yml';

async function main() {
  // 1. Read and parse YAML
  let ymlRaw: string;
  let yml: any;
  try {
    ymlRaw = await fs.readFile(PROJECT_STATUS_YML, 'utf-8');
    yml = yaml.load(ymlRaw);
  } catch (e) {
    console.error(`❌ Failed to read or parse ${PROJECT_STATUS_YML}:`, e);
    process.exit(1);
  }
  if (!yml || typeof yml !== 'object' || !yml.project_status) {
    console.error(`❌ Invalid or missing project_status in ${PROJECT_STATUS_YML}`);
    process.exit(1);
  }
  const status = yml.project_status;
  const now = formatISO(new Date());

  // 2. Prepare Markdown
  const frontmatter = [
    '---',
    `title: Project Status Report`,
    `date: ${now}`,
    `audience: ${AUDIENCE}`,
    `source: ${SOURCE}`,
    '---',
    ''
  ].join('\n');
  const summary = status.overall_summary
    ? `**Summary:** ${status.overall_summary.files_total || 0} files, ${status.overall_summary.fossilized_outputs || 0} fossilized, ${status.overall_summary.completion_percent || 0}% complete.`
    : '';
  const fossilSummary = status.fossilization_summary
    ? [
        '### Fossilization Summary',
        `- Fossilized Outputs: ${(status.fossilization_summary.fossilized_outputs || []).join(', ') || 'None'}`,
        `- Tests Using Fossils: ${(status.fossilization_summary.tests_using_fossils || []).join(', ') || 'None'}`,
        `- Next to Fossilize: ${(status.fossilization_summary.next_to_fossilize || []).join(', ') || 'None'}`,
        ''
      ].join('\n')
    : '';
  const recommendations = status.recommendations && status.recommendations.length
    ? ['### Recommendations', ...status.recommendations.map((r: string) => `- ${r}`), ''].join('\n')
    : '';
  const devSummary = status.developer_summary
    ? ['### Developer Summary', status.developer_summary, ''].join('\n')
    : '';
  const body = [
    frontmatter,
    '# Project Status',
    '',
    summary,
    '',
    fossilSummary,
    recommendations,
    devSummary
  ].join('\n');

  // 3. Prepare JSON
  const jsonOut = {
    ...yml,
    metadata: {
      audience: AUDIENCE,
      timestamp: now,
      source: SOURCE
    }
  };

  // 4. Write outputs
  try {
    await fs.mkdir(path.dirname(BLOG_MD), { recursive: true });
    await fs.mkdir(path.dirname(API_JSON), { recursive: true });
    await fs.writeFile(BLOG_MD, body, 'utf-8');
    await fs.writeFile(API_JSON, JSON.stringify(jsonOut, null, 2), 'utf-8');
    console.log(`✅ Published:\n- ${BLOG_MD}\n- ${API_JSON}`);
  } catch (e) {
    console.error('❌ Failed to write publication outputs:', e);
    process.exit(1);
  }
}

main(); 