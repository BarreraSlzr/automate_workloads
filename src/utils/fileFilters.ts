// Centralized file filter utility for automation scripts
export function isRelevantSourceFile(file: string): boolean {
  return !(
    file.startsWith('.cursor/') ||
    file.startsWith('.vscode/') ||
    file.startsWith('node_modules/') ||
    file.startsWith('temp/') ||
    file.startsWith('dist/') ||
    file.startsWith('build/') ||
    file.includes('~')
  );
} 