import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Loads a YAML file and returns its JSON representation, optionally validating against a shared type.
 * @param yamlPath Path to the YAML file
 */
export function yamlToJson<T>(yamlPath: string): T {
  const content = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(content);
  return data as T;
} 