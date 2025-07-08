// Ephemeral Context Management Guide (TypeScript)
// This module exports the ephemeral context management approach for programmatic use.
// See also: ephemeral_context_management.yml, ephemeral_context_management.json

export interface EphemeralContextMetadata {
  source: 'llm' | 'ml' | 'human' | 'compute';
  created_by: string;
  status: 'draft' | 'candidate' | 'promoted' | 'archived';
  deduplication_hash?: string;
  ttl?: string;
  auto_promote?: boolean | number;
  usage_count?: number;
  last_used?: string;
  related?: string[];
  notes?: string;
}

export interface EphemeralContextGuide {
  purpose: string;
  folder_structure: {
    canonical: string[];
    ephemeral: string[];
  };
  naming_convention: {
    pattern: string;
    fields: Record<string, string>;
    example: string[];
  };
  metadata: {
    required: string[];
    optional: string[];
  };
  lifecycle: string[];
  integration: string[];
  best_practices: string[];
  see_also: string[];
}

export const ephemeralContextGuide: EphemeralContextGuide = {
  purpose: 'Provide a scalable, bloat-free, and ML/human-friendly system for managing ephemeral (scratch, draft, temp) data alongside canonical fossils. Enable rapid experimentation, learning, and pattern extraction without polluting the canonical memory or causing storage bloat.',
  folder_structure: {
    canonical: ['fossils/context/', 'fossils/glossary/'],
    ephemeral: ['fossils/ephemeral/', 'fossils/ephemeral/address/']
  },
  naming_convention: {
    pattern: '<prefix>.<tag_summary>.<subtopic>.<topic>.<ext>',
    fields: {
      prefix: 'Source (llm, ml, human, compute)',
      tag_summary: 'Short semantic tag or summary (pattern, insight, glossary, draft)',
      subtopic: 'Optional, for further categorization (naming, traceability, etc.)',
      topic: 'Main topic or goal (transversal, workflow_vs_workload, etc.)',
      ext: 'File extension (yml, md, json, ts)'
    },
    example: [
      'llm.pattern.transversal.naming.yml',
      'human.insight.naming_conventions.md',
      'ml.glossary.traceability.pattern.json',
      'compute.draft.audit.traceability.yml'
    ]
  },
  metadata: {
    required: [
      'source: llm, ml, human, compute',
      'created_by: user, model, process',
      'status: draft, candidate, promoted, archived'
    ],
    optional: [
      'deduplication_hash: Hash for deduplication/traceability',
      'ttl: Time-to-live (auto-expiry)',
      'auto_promote: Boolean or weight/score for promotion',
      'usage_count: How often referenced/used',
      'last_used: Timestamp or event',
      'related: Other glossary/insight files or canonical fossils',
      'notes: Freeform, for human/LLM comments'
    ]
  },
  lifecycle: [
    'creation: Ephemeral files are created during LLM/ML/human/compute processes for drafts, temp logs, or in-progress insights.',
    'deduplication: Deduplication hash or semantic similarity is used to avoid storing near-duplicates.',
    'promotion: Files with high usage, weight, or human/LLM review are promoted to canonical fossils.',
    'cleanup: Files with expired TTL or low usage are deleted by cleanup scripts.',
    'audit: Optionally, keep a log of promotions, deletions, and merges for traceability.'
  ],
  integration: [
    'canonical_reference: Promoted ephemeral files are moved to fossils/context/ or fossils/glossary/ with updated status and metadata.',
    'feedback_loop: ML/LLM periodically reviews ephemeral files for promotion or cleanup.',
    'human_review: Humans can edit, promote, or delete ephemeral files as needed.'
  ],
  best_practices: [
    'Never store ephemeral files in version control; add fossils/ephemeral/ to .gitignore.',
    'Use semantic, source-aware naming for all ephemeral files.',
    'Automate cleanup and promotion with scripts and CI integration.',
    'Keep canonical fossils lean, deduplicated, and ML-ready.',
    'Use YAML/MD for human/LLM-friendly editing; JSON/TS for programmatic use.'
  ],
  see_also: [
    'docs/CANONICAL_FOSSIL_MANAGEMENT_GUIDE.md',
    'docs/CLI_COMMAND_INSIGHTS.md',
    'docs/ADVANCED_FOSSIL_QUERY_PATTERNS_GUIDE.md'
  ]
}; 