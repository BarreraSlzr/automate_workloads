import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';

export async function runCommand(command: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    if (!command[0]) return reject(new Error('No command specified'));
    const child = spawn(command[0], command.slice(1), { stdio: ['pipe', 'pipe', 'pipe'] }) as ChildProcess;
    let stdout = '', stderr = '';
    if (child.stdout && child.stderr) {
      child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    }
    child.on('close', (exitCode: number) => { resolve({ stdout, stderr, exitCode }); });
  });
}

export async function loadYaml(file: string): Promise<any> {
  const content = await fs.readFile(file, 'utf-8');
  return yaml.load(content);
}

// Add more shared E2E helpers here as needed 