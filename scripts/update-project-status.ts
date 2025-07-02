import { promises as fs } from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { callOpenAIChat } from '../src/services/llm';

const ROOT_DIRS = [
  'src/cli',
  'src/services',
  'src/utils',
  'src/core',
  'src/types',
  'scripts',
];
const TEST_DIRS = ['tests', 'test'];
const FOSSIL_KEYWORDS = ['toFossilEntry', 'outputFossil', 'writeFossilToFile'];
const STATUS_TAGS = ['@planned', '@todo', '@blocked', '@documented', '@in-progress', '@implemented', '@tested', '@reviewed', '@deprecated'];

// --- LLM Recommendation Helper ---
async function generateLLMRecommendationsFromYAML(yamlContent: string, apiKey: string): Promise<string[]> {
  try {
    const prompt = `Here is the current project status YAML for my automation codebase:\n\n${yamlContent}\n\nBased on this, generate 3-5 actionable recommendations to improve fossilization, test coverage, and automation quality. Be specific and practical.`;
    const response = await callOpenAIChat({
      model: 'gpt-4',
      apiKey,
      messages: [{ role: 'user', content: prompt }]
    });
    // Parse response into bullet points (assuming LLM returns a markdown list)
    return response.choices[0].message.content
      .split('\n')
      .filter(line => line.trim().startsWith('- '))
      .map(line => line.replace(/^\-\s*/, '').trim());
  } catch (e) {
    return [];
  }
}

function detectStatus(line: string): string | null {
  for (const tag of STATUS_TAGS) {
    if (line.includes(tag)) return tag.replace('@', '');
  }
  return null;
}

function extractCliDetails(content: string) {
  // Extract all commands, options, and required options for a CLI file
  const commandRegex = /\.command\(['"]([\w-]+)['"]/g;
  const optionRegex = /\.option\(['"]([^'"]+)['"]/g;
  const requiredOptionRegex = /\.requiredOption\(['"]([^'"]+)['"]/g;

  const commands: { name: string; options: string[]; required: string[] }[] = [];
  let match;
  // Find all commands
  while ((match = commandRegex.exec(content))) {
    commands.push({ name: match[1], options: [], required: [] });
  }
  // Find all options
  let options: string[] = [];
  while ((match = optionRegex.exec(content))) {
    options.push(match[1]);
  }
  // Find all required options
  let required: string[] = [];
  while ((match = requiredOptionRegex.exec(content))) {
    required.push(match[1]);
  }
  // Assign options/required to all commands (simple heuristic: all options apply to all commands in the file)
  for (const cmd of commands) {
    cmd.options = options;
    cmd.required = required;
  }
  return commands;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(res);
    } else {
      return [res];
    }
  }));
  return files.flat();
}

function extractFunctionsAndClasses(content: string): { classes: { name: string, status: string }[]; functions: { name: string, status: string }[] } {
  const lines = content.split('\n');
  const classes: { name: string, status: string }[] = [];
  const functions: { name: string, status: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match = line.match(/class\s+(\w+)/);
    if (match) {
      let status = 'implemented';
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const tag = detectStatus(lines[j]);
        if (tag) { status = tag; break; }
      }
      classes.push({ name: match[1], status });
    }
    match = line.match(/function\s+(\w+)/);
    if (match) {
      let status = 'implemented';
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const tag = detectStatus(lines[j]);
        if (tag) { status = tag; break; }
      }
      functions.push({ name: match[1], status });
    }
    match = line.match(/export\s+(?:const|let|var)\s+(\w+)\s*=\s*\(/);
    if (match) {
      let status = 'implemented';
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const tag = detectStatus(lines[j]);
        if (tag) { status = tag; break; }
      }
      functions.push({ name: match[1], status });
    }
  }
  return { classes, functions };
}

function detectFossilization(content: string): boolean {
  return FOSSIL_KEYWORDS.some(keyword => content.includes(keyword));
}

async function scanDir(dir: string) {
  const files = await walk(dir);
  const result: any = [];
  for (const file of files) {
    if (!file.match(/\.(ts|js|sh)$/)) continue;
    const relPath = path.relative(process.cwd(), file);
    const content = await fs.readFile(file, 'utf-8');
    const { classes, functions } = extractFunctionsAndClasses(content);
    const fossilized = detectFossilization(content);
    const cliDetails = dir.includes('cli') ? extractCliDetails(content) : [];
    result.push({
      file: relPath,
      classes,
      functions,
      cli_commands: cliDetails.map((c: any) => c.name),
      cli_details: cliDetails,
      fossilized_output: fossilized,
    });
  }
  return result;
}

// Test mapping: map test files to code files/classes/functions they reference
async function mapTestsToFunctions(testDirs: string[], codeFiles: string[]): Promise<Record<string, string[]>> {
  const mapping: Record<string, string[]> = {};
  for (const testDir of testDirs) {
    let testFiles: string[] = [];
    try {
      testFiles = await walk(testDir);
    } catch {}
    for (const testFile of testFiles) {
      if (!testFile.match(/\.(ts|js)$/)) continue;
      const content = await fs.readFile(testFile, 'utf-8');
      for (const codeFile of codeFiles) {
        const codeBase = path.basename(codeFile, path.extname(codeFile));
        if (content.includes(codeBase)) {
          if (!mapping[codeFile]) mapping[codeFile] = [];
          mapping[codeFile].push(testFile);
        }
      }
    }
  }
  return mapping;
}

function toProjectStatusYamlStructure(scanned: any, testMap: Record<string, string[]>): any {
  // Convert scanned structure to match project_status.yml format
  const modules: any = {};
  for (const dir of Object.keys(scanned)) {
    const files = scanned[dir];
    const mod: any = { path: dir, files: [] };
    for (const fileObj of files) {
      const fileEntry: any = {};
      const fileName = path.basename(fileObj.file);
      fileEntry[fileName] = {
        functions: [
          ...fileObj.classes.map((c: any) => `${c.name}: ${c.status}`),
          ...fileObj.functions.map((f: any) => `${f.name}: ${f.status}`),
        ],
        fossilized_output: fileObj.fossilized_output,
      };
      if (fileObj.cli_commands && fileObj.cli_commands.length > 0) {
        fileEntry[fileName].cli_commands = fileObj.cli_commands.map((c: string) => `${c}: implemented`);
      }
      if (fileObj.cli_details && fileObj.cli_details.length > 0) {
        fileEntry[fileName].cli_details = fileObj.cli_details;
      }
      // Add test mapping if available
      if (testMap[fileObj.file]) {
        fileEntry[fileName].tests = testMap[fileObj.file];
      }
      mod.files.push(fileEntry);
    }
    modules[dir.split('/').pop()!] = mod;
  }
  return modules;
}

// Enhanced merge: preserve all top-level fields, only replace modules, and generate LLM recommendations
async function mergeWithExistingYaml(newStatus: any) {
  let existing: any = {};
  try {
    const yml = await fs.readFile('project_status.yml', 'utf-8');
    existing = yaml.load(yml) || {};
  } catch {}
  if (!existing.project_status) existing.project_status = {};
  const preserved = { ...existing.project_status };
  preserved.modules = newStatus;

  // Add overall_summary if missing
  if (!preserved.overall_summary) {
    const moduleKeys = Object.keys(newStatus);
    let filesTotal = 0, fossilizedTotal = 0, testsTotal = 0;
    for (const mod of moduleKeys) {
      for (const file of newStatus[mod].files) {
        const fileKey = Object.keys(file)[0];
        filesTotal++;
        if (file[fileKey].fossilized_output) fossilizedTotal++;
        if (file[fileKey].tests) testsTotal += file[fileKey].tests.length;
      }
    }
    preserved.overall_summary = {
      modules_total: moduleKeys.length,
      files_total: filesTotal,
      fossilized_outputs: fossilizedTotal,
      tests_total: testsTotal,
      completion_percent: Math.round((fossilizedTotal / filesTotal) * 100),
    };
  }

  // Add fossilization_summary if missing
  if (!preserved.fossilization_summary) {
    const fossilized_outputs: string[] = [];
    const tests_using_fossils: string[] = [];
    const next_to_fossilize: string[] = [];
    for (const mod of Object.keys(newStatus)) {
      for (const file of newStatus[mod].files) {
        const fileKey = Object.keys(file)[0];
        if (file[fileKey].fossilized_output) {
          fossilized_outputs.push(fileKey);
          if (file[fileKey].tests) tests_using_fossils.push(...file[fileKey].tests);
        } else {
          next_to_fossilize.push(fileKey);
        }
      }
    }
    preserved.fossilization_summary = {
      fossilized_outputs: [...new Set(fossilized_outputs)],
      tests_using_fossils: [...new Set(tests_using_fossils)],
      next_to_fossilize: [...new Set(next_to_fossilize)],
    };
  }

  // LLM-generated recommendations
  if (!preserved.recommendations) {
    let yamlContent = '';
    try {
      yamlContent = yaml.dump({ project_status: preserved });
    } catch {}
    const apiKey = process.env.OPENAI_API_KEY;
    let llmRecs: string[] | null = null;
    if (apiKey) {
      llmRecs = await generateLLMRecommendationsFromYAML(yamlContent, apiKey);
    }
    preserved.recommendations = llmRecs && llmRecs.length > 0 ? llmRecs : [
      'Increase fossilized outputs for all modules.',
      'Add or update tests for all major CLI and service files.',
      'Review manual notes and keep them outside auto-generated sections.',
      'Automate regular updates of this YAML as part of CI.',
    ];
  }

  return { project_status: preserved };
}

function buildDeveloperSummary(audit: any) {
  // Build a summary similar to functionality-audit.json
  const cli: any[] = [];
  const utils: any[] = [];
  const services: any[] = [];
  const examples: any[] = [];
  let testedCLI = 0, testedUtils = 0, testedServices = 0;

  for (const modKey of Object.keys(audit)) {
    const mod = audit[modKey];
    if (modKey === 'cli') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        const entry = file[fileKey];
        cli.push({
          file: `${mod.path}/${fileKey}`,
          commands: entry.cli_commands ? entry.cli_commands.map((c: string) => c.split(':')[0]) : [],
          functions: entry.functions ? entry.functions.map((f: string) => f.split(':')[0]) : [],
          hasTests: !!entry.tests,
          testFiles: entry.tests || []
        });
        if (entry.tests) testedCLI++;
      }
    } else if (modKey === 'utils') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        const entry = file[fileKey];
        utils.push({
          file: `${mod.path}/${fileKey}`,
          functions: entry.functions ? entry.functions.map((f: string) => f.split(':')[0]) : [],
          hasTests: !!entry.tests,
          testFiles: entry.tests || []
        });
        if (entry.tests) testedUtils++;
      }
    } else if (modKey === 'services') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        const entry = file[fileKey];
        services.push({
          file: `${mod.path}/${fileKey}`,
          functions: entry.functions ? entry.functions.map((f: string) => f.split(':')[0]) : [],
          hasTests: !!entry.tests,
          testFiles: entry.tests || []
        });
        if (entry.tests) testedServices++;
      }
    } else if (modKey === 'examples') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        const entry = file[fileKey];
        examples.push({
          file: `${mod.path}/${fileKey}`,
          description: entry.description || '',
          demonstrates: entry.demonstrates || []
        });
      }
    }
  }
  const summary = {
    totalCLI: cli.length,
    totalUtils: utils.length,
    totalServices: services.length,
    totalExamples: examples.length,
    testedCLI,
    testedUtils,
    testedServices,
    coverage: (cli.length + utils.length + services.length) > 0 ? Math.round(((testedCLI + testedUtils + testedServices) / (cli.length + utils.length + services.length)) * 100) : 0
  };
  // Recommendations
  const untestedCLI = cli.filter(c => !c.hasTests);
  const untestedUtils = utils.filter(u => !u.hasTests);
  const untestedServices = services.filter(s => !s.hasTests);
  const recommendations: string[] = [];
  if (untestedCLI.length > 0) {
    recommendations.push('Priority 1: Test CLI commands');
    untestedCLI.slice(0, 3).forEach(c => {
      recommendations.push(`- ${c.file} (${c.commands.length} commands)`);
    });
  }
  if (untestedUtils.length > 0) {
    recommendations.push('Priority 2: Test utility functions');
    untestedUtils.slice(0, 3).forEach(u => {
      recommendations.push(`- ${u.file} (${u.functions.length} functions)`);
    });
  }
  if (untestedServices.length > 0) {
    recommendations.push('Priority 3: Test services');
    untestedServices.slice(0, 3).forEach(s => {
      recommendations.push(`- ${s.file} (${s.functions.length} functions)`);
    });
  }
  return {
    cli,
    utils,
    services,
    examples,
    summary,
    recommendations
  };
}

async function main() {
  const scanned: any = {};
  let allCodeFiles: string[] = [];
  for (const dir of ROOT_DIRS) {
    const absDir = path.resolve(dir);
    try {
      const files = await scanDir(absDir);
      scanned[dir] = files;
      allCodeFiles.push(...files.map((f: any) => f.file));
    } catch (e) {
      // Directory may not exist
    }
  }
  const testMap = await mapTestsToFunctions(TEST_DIRS, allCodeFiles);
  const modules = toProjectStatusYamlStructure(scanned, testMap);
  const developerSummary = buildDeveloperSummary(modules);
  const merged = await mergeWithExistingYaml(modules);
  (merged as any).developer_summary = developerSummary;
  console.log(yaml.dump(merged));

  // LLM Developer Insights
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const devSummaryYaml = yaml.dump(developerSummary);
    const prompt = `Here is a developer summary of our project:\n\n${devSummaryYaml}\n\nPlease provide:\n- The top 3 most urgent and granular test plans (with file/function/class names)\n- Any architectural or documentation gaps you see\n- Suggestions for refactoring or improving code quality\nRespond in markdown.`;
    try {
      const response = await callOpenAIChat({
        model: 'gpt-4',
        apiKey,
        messages: [{ role: 'user', content: prompt }]
      });
      console.log('\nLLM Developer Insights:\n', response.choices[0].message.content);
    } catch (e) {
      console.warn('LLM analysis failed:', e);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 