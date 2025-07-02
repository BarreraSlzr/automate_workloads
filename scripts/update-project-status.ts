#!/usr/bin/env bun

/**
 * Project Status Update Script
 * 
 * Scans the codebase and generates/updates project status YAML with fossilization tracking,
 * test coverage analysis, and LLM-powered recommendations.
 * 
 * @module scripts/update-project-status
 */

import { promises as fs } from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { callOpenAIChat } from '../src/services/llm';
import { 
  UpdateProjectStatusParams,
  UpdateProjectStatusParamsSchema,
  parseCLIArgs,
  ClassInfo,
  FunctionInfo,
  CliCommand,
  FileAnalysis,
  DirectoryScan,
  TestMapping,
  Modules,
  Module,
  ModuleFile,
  DeveloperSummary,
  ProjectStatus
} from '../src/types/cli';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate LLM recommendations from YAML content
 */
async function generateLLMRecommendationsFromYAML(
  yamlContent: string, 
  apiKey: string,
  params: UpdateProjectStatusParams
): Promise<string[]> {
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
      .filter((line: string) => typeof line === 'string' && line.trim().startsWith('- '))
      .map((line: string) => typeof line === 'string' ? line.replace(/^\-\s*/, '').trim() : '');
  } catch (e) {
    if (params.verbose) {
      console.warn('LLM recommendation generation failed:', e);
    }
    return [];
  }
}

/**
 * Detect status from line content
 */
function detectStatus(line: string, statusTags: string[]): string | null {
  for (const tag of statusTags) {
    if (line.includes(tag)) return tag.replace('@', '');
  }
  return null;
}

/**
 * Extract CLI details from file content
 */
function extractCliDetails(content: string): CliCommand[] {
  const commandRegex = /\.command\(['"]([\w-]+)['"]/g;
  const optionRegex = /\.option\(['"]([^'"]+)['"]/g;
  const requiredOptionRegex = /\.requiredOption\(['"]([^'"]+)['"]/g;

  const commands: CliCommand[] = [];
  let match: RegExpExecArray | null;
  
  // Find all commands
  while ((match = commandRegex.exec(content))) {
    if (match[1]) commands.push({ name: match[1], options: [], required: [] });
  }
  
  // Find all options
  let options: string[] = [];
  while ((match = optionRegex.exec(content))) {
    if (match[1]) options.push(match[1]);
  }
  
  // Find all required options
  let required: string[] = [];
  while ((match = requiredOptionRegex.exec(content))) {
    if (match[1]) required.push(match[1]);
  }
  
  // Assign options/required to all commands (simple heuristic: all options apply to all commands in the file)
  for (const cmd of commands) {
    cmd.options = options;
    cmd.required = required;
  }
  
  return commands;
}

/**
 * Recursively walk directory and return all files
 */
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

/**
 * Extract functions and classes from file content
 */
function extractFunctionsAndClasses(
  content: string, 
  statusTags: string[]
): { classes: ClassInfo[]; functions: FunctionInfo[] } {
  const lines = content.split('\n');
  const classes: ClassInfo[] = [];
  const functions: FunctionInfo[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    let match = line.match(/class\s+(\w+)/);
    if (match && match[1]) {
      let status = 'implemented';
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const tag = detectStatus(lines[j] ?? '', statusTags);
        if (tag) { status = tag; break; }
      }
      classes.push({ name: match[1], status });
    }
    
    match = line.match(/function\s+(\w+)/);
    if (match && match[1]) {
      let status = 'implemented';
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const tag = detectStatus(lines[j] ?? '', statusTags);
        if (tag) { status = tag; break; }
      }
      functions.push({ name: match[1], status });
    }
    
    match = line.match(/export\s+(?:const|let|var)\s+(\w+)\s*=\s*\(/);
    if (match && match[1]) {
      let status = 'implemented';
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const tag = detectStatus(lines[j] ?? '', statusTags);
        if (tag) { status = tag; break; }
      }
      functions.push({ name: match[1], status });
    }
  }
  
  return { classes, functions };
}

/**
 * Detect fossilization in file content
 */
function detectFossilization(content: string, fossilKeywords: string[]): boolean {
  return fossilKeywords.some(keyword => content.includes(keyword));
}

/**
 * Scan directory and analyze files
 */
async function scanDir(dir: string, params: UpdateProjectStatusParams): Promise<DirectoryScan> {
  const files = await walk(dir);
  const result: FileAnalysis[] = [];
  
  for (const file of files) {
    if (!file.match(/\.(ts|js|sh)$/)) continue;
    
    const relPath = path.relative(process.cwd(), file);
    const content = await fs.readFile(file, 'utf-8');
    const { classes, functions } = extractFunctionsAndClasses(content, params.statusTags);
    const fossilized = detectFossilization(content, params.fossilKeywords);
    const cliDetails = dir.includes('cli') ? extractCliDetails(content) : [];
    
    result.push({
      file: relPath,
      classes,
      functions,
      cli_commands: cliDetails.map((c) => c.name),
      cli_details: cliDetails,
      fossilized_output: fossilized,
    });
  }
  
  return result;
}

/**
 * Map test files to code files they reference
 */
async function mapTestsToFunctions(
  testDirs: string[], 
  codeFiles: string[]
): Promise<TestMapping> {
  const mapping: TestMapping = {};
  
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

/**
 * Convert scanned structure to project status YAML format
 */
function toProjectStatusYamlStructure(
  scanned: Record<string, DirectoryScan>, 
  testMap: TestMapping
): Modules {
  const modules: Modules = {};
  
  for (const dir of Object.keys(scanned)) {
    const files = scanned[dir];
    if (!files) continue;
    
    const mod: Module = { path: dir, files: [] };
    
    for (const fileObj of files) {
      const fileName = path.basename(fileObj.file);
      if (!fileName) continue;
      
      const fileEntry: ModuleFile = {
        [fileName]: {
          functions: [
            ...fileObj.classes.map((c) => `${c.name}: ${c.status}`),
            ...fileObj.functions.map((f) => `${f.name}: ${f.status}`),
          ],
          fossilized_output: fileObj.fossilized_output,
        }
      };
      
      if (fileObj.cli_commands && fileObj.cli_commands.length > 0) {
        if (fileEntry[fileName]) {
          fileEntry[fileName].cli_commands = fileObj.cli_commands.map((c: string) => `${c}: implemented`);
        }
      }
      
      if (fileObj.cli_details && fileObj.cli_details.length > 0) {
        if (fileEntry[fileName]) {
          fileEntry[fileName].cli_details = fileObj.cli_details;
        }
      }
      
      // Add test mapping if available
      if (testMap[fileObj.file]) {
        if (fileEntry[fileName]) {
          fileEntry[fileName].tests = testMap[fileObj.file];
        }
      }
      
      mod.files.push(fileEntry);
    }
    
    modules[dir.split('/').pop()!] = mod;
  }
  
  return modules;
}

/**
 * Merge with existing YAML and generate summaries
 */
async function mergeWithExistingYaml(
  newStatus: Modules, 
  params: UpdateProjectStatusParams
): Promise<ProjectStatus> {
  let existing: any = {};
  
  try {
    const yml = await fs.readFile(params.outputPath, 'utf-8');
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
      const moduleData = newStatus[mod];
      if (!moduleData?.files) continue;
      
      for (const file of moduleData.files) {
        const fileKey = Object.keys(file)[0];
        if (!fileKey || !file[fileKey]) continue;
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
      completion_percent: filesTotal > 0 ? Math.round((fossilizedTotal / filesTotal) * 100) : 0,
    };
  }

  // Add fossilization_summary if missing
  if (!preserved.fossilization_summary) {
    const fossilized_outputs: string[] = [];
    const tests_using_fossils: string[] = [];
    const next_to_fossilize: string[] = [];
    
    for (const mod of Object.keys(newStatus)) {
      const moduleData = newStatus[mod];
      if (!moduleData?.files) continue;
      
      for (const file of moduleData.files) {
        const fileKey = Object.keys(file)[0];
        if (!fileKey || !file[fileKey]) continue;
        
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
  if (!preserved.recommendations && params.enableLLM) {
    let yamlContent = '';
    try {
      yamlContent = yaml.dump({ project_status: preserved });
    } catch {}
    
    const apiKey = process.env.OPENAI_API_KEY;
    let llmRecs: string[] | null = null;
    
    if (apiKey) {
      llmRecs = await generateLLMRecommendationsFromYAML(yamlContent, apiKey, params);
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

/**
 * Build developer summary from audit data
 */
function buildDeveloperSummary(audit: Modules): DeveloperSummary {
  const cli: any[] = [];
  const utils: any[] = [];
  const services: any[] = [];
  const examples: any[] = [];
  let testedCLI = 0, testedUtils = 0, testedServices = 0;

  for (const modKey of Object.keys(audit)) {
    const mod = audit[modKey];
    if (!mod) continue;
    
    if (modKey === 'cli') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        if (!fileKey || !file[fileKey]) continue;
        const entry = file[fileKey];
        
        cli.push({
          file: `${mod.path}/${fileKey}`,
          commands: entry.cli_commands ? entry.cli_commands.map((c: string) => c.split(':')[0]).filter(Boolean) : [],
          functions: entry.functions ? entry.functions.map((f: string) => f.split(':')[0]).filter(Boolean) : [],
          hasTests: !!entry.tests,
          testFiles: entry.tests || []
        });
        
        if (entry.tests) testedCLI++;
      }
    } else if (modKey === 'utils') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        if (!fileKey || !file[fileKey]) continue;
        const entry = file[fileKey];
        
        utils.push({
          file: `${mod.path}/${fileKey}`,
          functions: entry.functions ? entry.functions.map((f: string) => f.split(':')[0]).filter(Boolean) : [],
          hasTests: !!entry.tests,
          testFiles: entry.tests || []
        });
        
        if (entry.tests) testedUtils++;
      }
    } else if (modKey === 'services') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        if (!fileKey || !file[fileKey]) continue;
        const entry = file[fileKey];
        
        services.push({
          file: `${mod.path}/${fileKey}`,
          functions: entry.functions ? entry.functions.map((f: string) => f.split(':')[0]).filter(Boolean) : [],
          hasTests: !!entry.tests,
          testFiles: entry.tests || []
        });
        
        if (entry.tests) testedServices++;
      }
    } else if (modKey === 'examples') {
      for (const file of mod.files) {
        const fileKey = Object.keys(file)[0];
        if (!fileKey || !file[fileKey]) continue;
        const entry = file[fileKey];
        
        examples.push({
          file: `${mod.path}/${fileKey}`,
          description: 'Example file', // Default description since not in schema
          demonstrates: [] // Default empty array since not in schema
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
  
  // Generate recommendations
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

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main function to update project status using object parameter pattern
 */
async function updateProjectStatus(params: UpdateProjectStatusParams): Promise<ProjectStatus> {
  if (params.verbose) {
    console.log('🔍 Starting project status update...');
    console.log('Configuration:', JSON.stringify(params, null, 2));
  }

  const scanned: Record<string, DirectoryScan> = {};
  let allCodeFiles: string[] = [];
  
  // Scan all root directories
  for (const dir of params.rootDirs) {
    const absDir = path.resolve(dir);
    try {
      const files = await scanDir(absDir, params);
      scanned[dir] = files;
      allCodeFiles.push(...files.map((f) => f.file));
      
      if (params.verbose) {
        console.log(`📁 Scanned ${dir}: ${files.length} files`);
      }
    } catch (e) {
      if (params.verbose) {
        console.warn(`⚠️  Directory ${dir} not found or error scanning:`, e);
      }
    }
  }
  
  // Map tests to functions
  const testMap = await mapTestsToFunctions(params.testDirs, allCodeFiles);
  if (params.verbose) {
    console.log(`🧪 Mapped ${Object.keys(testMap).length} files to tests`);
  }
  
  // Convert to project status structure
  const modules = toProjectStatusYamlStructure(scanned, testMap);
  
  // Build developer summary
  const developerSummary = buildDeveloperSummary(modules);
  
  // Merge with existing YAML
  const merged = await mergeWithExistingYaml(modules, params);
  merged.developer_summary = developerSummary;
  
  if (params.verbose) {
    console.log('✅ Project status update completed');
    console.log(`📊 Summary: ${merged.project_status.overall_summary?.files_total || 0} files, ${merged.project_status.overall_summary?.fossilized_outputs || 0} fossilized`);
  }
  
  return merged;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

/**
 * Parse command line arguments and run the update
 */
async function main() {
  try {
    // Parse and validate CLI arguments using the centralized schema
    const args = parseCLIArgs(UpdateProjectStatusParamsSchema, process.argv.slice(2));
    
    // Run the update
    const result = await updateProjectStatus(args);
    
    // Output results
    if (args.dryRun) {
      console.log('🔍 Dry run - would write:');
      console.log(yaml.dump(result));
    } else {
      // Ensure output directory exists
      const outputDir = path.dirname(args.outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write to file
      await fs.writeFile(args.outputPath, yaml.dump(result));
      console.log(`💾 Project status written to ${args.outputPath}`);
    }
    
    // LLM Developer Insights
    if (args.enableLLM && !args.dryRun) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const devSummaryYaml = yaml.dump(result.developer_summary);
        const prompt = `Here is a developer summary of our project:\n\n${devSummaryYaml}\n\nPlease provide:\n- The top 3 most urgent and granular test plans (with file/function/class names)\n- Any architectural or documentation gaps you see\n- Suggestions for refactoring or improving code quality\nRespond in markdown.`;
        
        try {
          const response = await callOpenAIChat({
            model: 'gpt-4',
            apiKey,
            messages: [{ role: 'user', content: prompt }]
          });
          console.log('\n🤖 LLM Developer Insights:\n', response.choices[0].message.content);
        } catch (e) {
          console.warn('⚠️  LLM analysis failed:', e);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
} 