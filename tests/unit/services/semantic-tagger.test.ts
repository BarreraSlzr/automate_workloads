import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { SemanticTaggerService } from '../../../src/services/semantic-tagger';
import type { ContextEntry } from '../../../src/types';

describe('SemanticTaggerService', () => {
  let service: SemanticTaggerService;
  let mockEntry: ContextEntry;

  beforeEach(() => {
    service = new SemanticTaggerService();
    
    mockEntry = {
      id: 'test-fossil-1',
      type: 'observation',
      title: 'Repository Health Analysis',
      content: 'Health score: 85/100. Issues: 2. Recommendations: Add tests.',
      tags: ['health', 'analysis'],
      metadata: {
        contentHash: 'test-hash-123',
      },
      source: 'automated',
      version: 1,
      children: [],
      createdAt: '2025-07-01T00:00:00.000Z',
      updatedAt: '2025-07-01T00:00:00.000Z',
    };
  });

  describe('generateSemanticTags', () => {
    it('should generate semantic tags with content hash', async () => {
      const serviceWithoutKey = new SemanticTaggerService('gpt-4', '');
      // Patch callLLM to return predictable result
      serviceWithoutKey['llmService'].callLLM = async () => ({
        choices: [{ message: { content: '{"semanticCategory":"repository-health","confidence":0.95,"concepts":["health"],"sentiment":"neutral","priority":"medium","impact":"medium","stakeholders":["developers"]}' } }]
      });
      const result = await serviceWithoutKey.generateSemanticTags(mockEntry);
      
      expect(result).toBeDefined();
      expect(result?.contentHash).toBe('test-hash-123');
      expect(result?.autoGenerated).toBe(true);
      expect(result?.confidence).toBeGreaterThan(0.5);
    });

    it('should categorize health-related content', async () => {
      const healthEntry = {
        ...mockEntry,
        content: 'Health score: 90/100. Good performance.',
      };
      
      const serviceWithoutKey = new SemanticTaggerService('gpt-4', '');
      serviceWithoutKey['llmService'].callLLM = async () => ({
        choices: [{ message: { content: '{"semanticCategory":"repository-health","confidence":0.95,"concepts":["health"],"sentiment":"neutral","priority":"medium","impact":"medium","stakeholders":["developers"]}' } }]
      });
      const result = await serviceWithoutKey.generateSemanticTags(healthEntry);
      
      expect(result?.semanticCategory).toBe('repository-health');
      expect(result?.concepts?.some(c => c.includes('health'))).toBe(true);
    });

    it('should categorize automation content', async () => {
      const automationEntry = {
        ...mockEntry,
        content: 'Automated workflow for testing and deployment',
        title: 'CI/CD Pipeline Setup',
      };
      
      const serviceWithoutKey = new SemanticTaggerService('gpt-4', '');
      serviceWithoutKey['llmService'].callLLM = async () => ({
        choices: [{ message: { content: '{"semanticCategory":"automation","confidence":0.95,"concepts":["workflow","automated"],"sentiment":"neutral","priority":"medium","impact":"medium","stakeholders":["developers"]}' } }]
      });
      const result = await serviceWithoutKey.generateSemanticTags(automationEntry);
      
      expect(['automation', 'testing']).toContain(result?.semanticCategory);
      if (result?.semanticCategory === 'automation') {
        expect(result?.concepts?.some(c => c.toLowerCase().includes('workflow') || c.toLowerCase().includes('automated'))).toBe(true);
      } else if (result?.semanticCategory === 'testing') {
        expect(result?.concepts?.includes('mock') || result?.concepts?.includes('testing')).toBe(true);
      }
    });
  });

  describe('generateTemporalTags', () => {
    it('should set lifecycle to active for recent entries', () => {
      const recentEntry = {
        ...mockEntry,
        createdAt: new Date().toISOString(),
      };
      
      const result = service.generateTemporalTags(recentEntry);
      
      expect(result?.lifecycle).toBe('active');
      expect(result?.accessCount).toBe(1);
    });

    it('should set lifecycle to archived for old entries', () => {
      const oldEntry = {
        ...mockEntry,
        createdAt: '2023-01-01T00:00:00.000Z',
      };
      
      const result = service.generateTemporalTags(oldEntry);
      
      expect(result?.lifecycle).toBe('archived');
    });

    it('should set expiration for old observation entries', () => {
      const oldObservation = {
        ...mockEntry,
        type: 'observation' as const,
        createdAt: '2025-04-01T00:00:00.000Z', // 90+ days ago
      };
      
      const result = service.generateTemporalTags(oldObservation);
      
      expect(result?.expiresAt).toBeDefined();
    });
  });

  describe('calculateSemanticSimilarity', () => {
    it('should calculate high similarity for similar content', () => {
      const entry1 = {
        ...mockEntry,
        title: 'Health Check',
        content: 'Repository health analysis shows good performance',
      };
      
      const entry2 = {
        ...mockEntry,
        title: 'Health Analysis',
        content: 'Repository health check indicates good performance',
      };
      
      const similarity = (service as any).calculateSemanticSimilarity(entry1, entry2);
      
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('should calculate low similarity for different content', () => {
      const entry1 = {
        ...mockEntry,
        title: 'Health Check',
        content: 'Repository health analysis shows good performance',
      };
      
      const entry2 = {
        ...mockEntry,
        title: 'Security Audit',
        content: 'Security vulnerabilities found in dependencies',
      };
      
      const similarity = (service as any).calculateSemanticSimilarity(entry1, entry2);
      
      expect(similarity).toBeLessThan(0.3);
    });

    it('should return 1.0 for identical content', () => {
      const similarity = (service as any).calculateSemanticSimilarity(mockEntry, mockEntry);
      
      expect(similarity).toBe(1.0);
    });
  });

  describe('findDependencies', () => {
    it('should find dependencies when content mentions other titles', () => {
      const allEntries: ContextEntry[] = [
        {
          ...mockEntry,
          id: 'dep-1',
          title: 'Security Scan',
        },
        {
          ...mockEntry,
          id: 'dep-2',
          title: 'Performance Test',
        },
      ];
      
      const entryWithDeps = {
        ...mockEntry,
        content: 'Based on Security Scan and Performance Test results, we need updates.',
      };
      
      const dependencies = (service as any).findDependencies(entryWithDeps, allEntries);
      
      expect(dependencies).toContain('dep-1');
      expect(dependencies).toContain('dep-2');
    });

    it('should not find dependencies when content does not mention titles', () => {
      const allEntries: ContextEntry[] = [
        {
          ...mockEntry,
          id: 'dep-1',
          title: 'Security Scan',
        },
      ];
      
      const entryWithoutDeps = {
        ...mockEntry,
        content: 'This content does not mention any other fossil titles.',
      };
      
      const dependencies = (service as any).findDependencies(entryWithoutDeps, allEntries);
      
      expect(dependencies).toHaveLength(0);
    });
  });

  describe('Local LLM integration', () => {
    it('should pass enableLocalLLM and routingPreference to LLMService', async () => {
      const service = new SemanticTaggerService('gpt-4', undefined, { enableLocalLLM: true, routingPreference: 'local' });
      expect(service['llmService']['config'].enableLocalLLM).toBe(true);
      expect(service['llmOptions'].routingPreference).toBe('local');
    });
    it('should register a custom local backend if provided', async () => {
      const service = new SemanticTaggerService('gpt-4', undefined, { enableLocalLLM: true, localBackend: 'llama.cpp' });
      // Should have a provider named 'llama.cpp'
      const found = service['llmService']['providers'].some(p => p.name === 'llama.cpp');
      expect(found).toBe(true);
    });
    it('should use routingPreference in callLLM', async () => {
      const service = new SemanticTaggerService('gpt-4', undefined, { routingPreference: 'cloud' });
      // Call generateSemanticTags and check config is set
      await service.generateSemanticTags({
        id: 'test',
        type: 'insight',
        title: 'Test',
        content: 'Test content',
        tags: [],
        metadata: {},
        source: 'manual',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      });
      expect(service['llmService']['config'].preferLocalLLM).toBe(false);
    });
  });

  describe('generateExcerpt', () => {
    it('should prefer local LLM for excerpt generation when available', async () => {
      const service = new SemanticTaggerService('gpt-4', 'test-key', { enableLocalLLM: true, localBackend: 'ollama', routingPreference: 'local' });
      // Patch callLLM to simulate local LLM selection
      service['llmService'].callLLM = async (opts: any) => {
        expect(opts.routingPreference).toBe('local');
        expect(opts.localBackend).toBe('ollama');
        return { choices: [{ message: { content: 'Local summary.' } }] };
      };
      const result = await service.generateExcerpt({
        id: 'id',
        type: 'insight',
        title: 'Test',
        content: 'This is a test content for local LLM.',
        tags: [],
        metadata: {},
        source: 'manual',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      });
      expect(result).toBe('Local summary.');
    });
    it('should fallback to cloud LLM or fallback if local is unavailable', async () => {
      const service = new SemanticTaggerService('gpt-4', 'test-key', { enableLocalLLM: false, routingPreference: 'cloud' });
      // Patch callLLM to simulate cloud LLM selection
      service['llmService'].callLLM = async (opts: any) => {
        expect(opts.routingPreference).toBe('cloud');
        return { choices: [{ message: { content: 'Cloud summary.' } }] };
      };
      const result = await service.generateExcerpt({
        id: 'id',
        type: 'insight',
        title: 'Test',
        content: 'This is a test content for cloud LLM.',
        tags: [],
        metadata: {},
        source: 'manual',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      });
      expect(result).toBe('Cloud summary.');
    });
  });
}); 