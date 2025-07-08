#!/usr/bin/env bun

/**
 * @fileoverview Small Utility Consolidation Script
 * @description Consolidates small utility files for better cohesion
 */

import { readFile, writeFile, unlink } from 'fs/promises';
import { glob } from 'glob';

interface SmallUtility {
  file: string;
  content: string;
  size: number;
  category: string;
}

class SmallUtilityConsolidator {
  private readonly SIZE_THRESHOLD = 500; // characters
  private readonly TARGET_FILE = 'src/utils/consolidated-utilities.ts';

  async consolidateSmallUtilities(): Promise<void> {
    console.log('🔧 Consolidating small utilities...');
    
    const smallFiles = await this.findSmallFiles();
    const categorized = this.categorizeFiles(smallFiles);
    
    if (categorized.length === 0) {
      console.log('✅ No small utilities found to consolidate');
      return;
    }
    
    console.log(`📁 Found ${smallFiles.length} small utilities to consolidate`);
    
    // Create consolidated file
    const consolidatedContent = this.createConsolidatedFile(categorized);
    await writeFile(this.TARGET_FILE, consolidatedContent);
    
    console.log(`📄 Created consolidated file: ${this.TARGET_FILE}`);
    
    // Optionally remove original files (commented out for safety)
    // await this.removeOriginalFiles(smallFiles);
    
    console.log('✅ Consolidation complete!');
    console.log('💡 Review the consolidated file and update imports as needed');
  }

  private async findSmallFiles(): Promise<SmallUtility[]> {
    const files = await glob('src/utils/*.ts', { 
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/index.ts', '**/consolidated-utilities.ts'] 
    });
    
    const smallFiles: SmallUtility[] = [];
    
    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      if (content.length < this.SIZE_THRESHOLD) {
        const category = this.determineCategory(file, content);
        smallFiles.push({
          file,
          content,
          size: content.length,
          category
        });
      }
    }
    
    return smallFiles.sort((a, b) => a.category.localeCompare(b.category));
  }

  private determineCategory(file: string, content: string): string {
    const fileName = file.split('/').pop()?.replace('.ts', '') || '';
    
    if (fileName.includes('fossil')) return 'fossil';
    if (fileName.includes('monitor')) return 'monitor';
    if (fileName.includes('cli')) return 'cli';
    if (fileName.includes('timeout')) return 'timeout';
    if (fileName.includes('markdown') || fileName.includes('yaml') || fileName.includes('json')) return 'format';
    if (fileName.includes('checklist')) return 'checklist';
    
    return 'misc';
  }

  private categorizeFiles(files: SmallUtility[]): SmallUtility[] {
    return files.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.file.localeCompare(b.file);
    });
  }

  private createConsolidatedFile(files: SmallUtility[]): string {
    let content = `/**
 * @fileoverview Consolidated Small Utilities
 * @description Automatically consolidated small utility functions
 * @generated ${new Date().toISOString()}
 */

`;

    // Group by category
    const categories = new Map<string, SmallUtility[]>();
    for (const file of files) {
      if (!categories.has(file.category)) {
        categories.set(file.category, []);
      }
      categories.get(file.category)!.push(file);
    }

    // Generate content by category
    for (const [category, categoryFiles] of categories) {
      content += `// ============================================================================\n`;
      content += `// ${category.toUpperCase()} UTILITIES\n`;
      content += `// ============================================================================\n\n`;
      
      for (const file of categoryFiles) {
        const fileName = file.file.split('/').pop()?.replace('.ts', '') || '';
        content += `// From: ${file.file}\n`;
        content += `// Size: ${file.size} characters\n\n`;
        
        // Extract and clean the content
        const cleanedContent = this.cleanContent(file.content, fileName);
        content += cleanedContent;
        content += '\n\n';
      }
    }

    // Add exports
    content += `// ============================================================================\n`;
    content += `// EXPORTS\n`;
    content += `// ============================================================================\n\n`;
    
    for (const file of files) {
      const fileName = file.file.split('/').pop()?.replace('.ts', '') || '';
      const exports = this.extractExports(file.content);
      for (const exportName of exports) {
        content += `export { ${exportName} };\n`;
      }
    }

    return content;
  }

  private cleanContent(content: string, fileName: string): string {
    // Remove file header comments
    let cleaned = content.replace(/^\/\*\*[\s\S]*?\*\/\s*/g, '');
    
    // Remove import statements (they'll be handled separately)
    cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, '');
    
    // Remove export statements (they'll be added at the end)
    cleaned = cleaned.replace(/^export\s+/gm, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return cleaned.trim();
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:function|class|const|interface|type)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      }
    }
    
    return exports;
  }

  private async removeOriginalFiles(files: SmallUtility[]): Promise<void> {
    console.log('🗑️  Removing original files...');
    
    for (const file of files) {
      try {
        await unlink(file.file);
        console.log(`   Removed: ${file.file}`);
      } catch (error) {
        console.warn(`   Warning: Could not remove ${file.file}:`, error);
      }
    }
  }
}

// CLI Interface
async function main() {
  const consolidator = new SmallUtilityConsolidator();
  
  try {
    await consolidator.consolidateSmallUtilities();
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
} 