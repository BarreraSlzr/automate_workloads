/**
 * Legacy fossil management types for backward compatibility
 * @module types/legacy-fossil
 * 
 * These types are kept for existing code that depends on them.
 * New code should use the consolidated types in core.ts
 */

import { BaseFossil, FossilType, FossilSource, FossilCreator, FossilMetadata, FossilQuery, FossilResult, FossilValidation } from './core';

/**
 * Fossil transformation interface
 */
export interface FossilTransform<T = unknown, U = unknown> {
  transform(fossil: T): U;
  validate(fossil: T): FossilValidation;
}

/**
 * Fossil storage interface
 */
export interface FossilStorage {
  save<T>(fossil: T): Promise<FossilResult<T>>;
  load<T>(fossilId: string): Promise<FossilResult<T>>;
  query<T>(query: FossilQuery): Promise<FossilResult<T[]>>;
  delete(fossilId: string): Promise<FossilResult<void>>;
}

/**
 * Fossil export interface
 */
export interface FossilExport {
  format: 'yaml' | 'json' | 'markdown';
  content: string;
  metadata: FossilMetadata;
}

/**
 * Fossil import interface
 */
export interface FossilImport {
  format: 'yaml' | 'json' | 'markdown';
  content: string;
  validation: FossilValidation;
}

/**
 * Fossil sync interface
 */
export interface FossilSync {
  source: FossilSource;
  target: FossilSource;
  fossils: unknown[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  errors: string[];
}

/**
 * Fossil backup interface
 */
export interface FossilBackup {
  timestamp: string;
  fossils: unknown[];
  metadata: FossilMetadata;
  checksum: string;
}

/**
 * Fossil restore interface
 */
export interface FossilRestore {
  backup: FossilBackup;
  validation: FossilValidation;
  restoredCount: number;
  errors: string[];
}

/**
 * Fossil migration interface
 */
export interface FossilMigration {
  version: string;
  fossils: unknown[];
  changes: string[];
  rollback?: boolean;
}

/**
 * Fossil analytics interface
 */
export interface FossilAnalytics {
  totalFossils: number;
  fossilsByType: Record<FossilType, number>;
  fossilsBySource: Record<FossilSource, number>;
  fossilsByCreator: Record<FossilCreator, number>;
  recentActivity: {
    created: number;
    updated: number;
    deleted: number;
  };
  storageUsage: {
    totalSize: number;
    averageSize: number;
    largestFossil: string;
  };
}

/**
 * Fossil health interface
 */
export interface FossilHealth {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
  lastCheck: string;
}

/**
 * Fossil monitoring interface
 */
export interface FossilMonitoring {
  enabled: boolean;
  interval: number; // seconds
  alerts: {
    enabled: boolean;
    threshold: number;
    recipients: string[];
  };
  metrics: {
    collectionEnabled: boolean;
    retentionDays: number;
  };
}

/**
 * Fossil security interface
 */
export interface FossilSecurity {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotation: boolean;
  };
  access: {
    authentication: boolean;
    authorization: boolean;
    auditLog: boolean;
  };
  compliance: {
    gdpr: boolean;
    sox: boolean;
    hipaa: boolean;
  };
}

/**
 * Fossil performance interface
 */
export interface FossilPerformance {
  readLatency: number; // milliseconds
  writeLatency: number; // milliseconds
  queryLatency: number; // milliseconds
  throughput: {
    readsPerSecond: number;
    writesPerSecond: number;
    queriesPerSecond: number;
  };
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
  };
}

/**
 * Fossil configuration interface
 */
export interface FossilConfig {
  storage: {
    type: 'file' | 'database' | 'cloud';
    path?: string;
    connectionString?: string;
    credentials?: Record<string, string>;
  };
  validation: {
    enabled: boolean;
    strict: boolean;
    customRules?: string[];
  };
  backup: {
    enabled: boolean;
    schedule: string; // cron expression
    retention: number; // days
    location: string;
  };
  monitoring: FossilMonitoring;
  security: FossilSecurity;
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    compressionEnabled: boolean;
  };
}

/**
 * Fossil environment interface
 */
export interface FossilEnvironment {
  name: string;
  config: FossilConfig;
  fossils: unknown[];
  health: FossilHealth;
  analytics: FossilAnalytics;
}

/**
 * Fossil deployment interface
 */
export interface FossilDeployment {
  environment: string;
  version: string;
  fossils: unknown[];
  timestamp: string;
  status: 'deploying' | 'deployed' | 'failed' | 'rolled-back';
  rollbackVersion?: string;
}

/**
 * Fossil version interface
 */
export interface FossilVersion {
  version: string;
  fossils: unknown[];
  changes: string[];
  timestamp: string;
  author: FossilCreator;
  metadata: FossilMetadata;
}

/**
 * Fossil branch interface
 */
export interface FossilBranch {
  name: string;
  fossils: unknown[];
  parentBranch?: string;
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'merged' | 'deleted';
}

/**
 * Fossil merge interface
 */
export interface FossilMerge {
  sourceBranch: string;
  targetBranch: string;
  fossils: unknown[];
  conflicts: string[];
  resolution: 'automatic' | 'manual' | 'failed';
  timestamp: string;
  author: FossilCreator;
}

/**
 * Fossil collaboration interface
 */
export interface FossilCollaboration {
  users: string[];
  permissions: Record<string, string[]>; // user -> permissions
  roles: Record<string, string[]>; // role -> permissions
  accessLog: {
    user: string;
    action: string;
    timestamp: string;
    fossilId?: string;
  }[];
}

/**
 * Fossil workflow interface
 */
export interface FossilWorkflow {
  name: string;
  steps: {
    name: string;
    type: 'create' | 'update' | 'delete' | 'transform' | 'validate';
    fossils: unknown[];
    conditions?: string[];
    actions: string[];
  }[];
  triggers: {
    type: 'manual' | 'scheduled' | 'event';
    config: Record<string, unknown>;
  }[];
  status: 'active' | 'paused' | 'completed' | 'failed';
}

/**
 * Fossil integration interface
 */
export interface FossilIntegration {
  name: string;
  type: 'github' | 'slack' | 'email' | 'webhook' | 'api';
  config: Record<string, unknown>;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  fossils: unknown[];
}

/**
 * Fossil automation interface
 */
export interface FossilAutomation {
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  fossils: unknown[];
  schedule?: string; // cron expression
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

/**
 * Fossil report interface
 */
export interface FossilReport {
  name: string;
  type: 'summary' | 'detailed' | 'analytics' | 'health';
  fossils: unknown[];
  format: 'markdown' | 'json' | 'yaml' | 'html' | 'pdf';
  schedule?: string; // cron expression
  recipients: string[];
  lastGenerated: string;
  nextGeneration: string;
}

/**
 * Fossil template interface
 */
export interface FossilTemplate {
  name: string;
  description: string;
  type: FossilType;
  structure: Record<string, unknown>;
  validation: Record<string, unknown>;
  examples: unknown[];
  metadata: FossilMetadata;
}

/**
 * Fossil plugin interface
 */
export interface FossilPlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: string[];
  config: Record<string, unknown>;
  enabled: boolean;
  fossils: unknown[];
}

/**
 * Fossil marketplace interface
 */
export interface FossilMarketplace {
  plugins: FossilPlugin[];
  templates: FossilTemplate[];
  integrations: FossilIntegration[];
  categories: string[];
  featured: string[];
  trending: string[];
}

/**
 * Fossil community interface
 */
export interface FossilCommunity {
  users: number;
  fossils: number;
  contributions: number;
  discussions: {
    total: number;
    active: number;
    resolved: number;
  };
  feedback: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/**
 * Fossil roadmap interface
 */
export interface FossilRoadmap {
  version: string;
  features: {
    name: string;
    description: string;
    status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    fossils: unknown[];
  }[];
  timeline: {
    phase: string;
    startDate: string;
    endDate: string;
    features: string[];
  }[];
  feedback: {
    feature: string;
    user: string;
    rating: number;
    comment: string;
    timestamp: string;
  }[];
}

/**
 * Fossil changelog interface
 */
export interface FossilChangelog {
  version: string;
  date: string;
  changes: {
    type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
    description: string;
    fossils: unknown[];
  }[];
  contributors: string[];
  breakingChanges: string[];
}

/**
 * Fossil documentation interface
 */
export interface FossilDocumentation {
  version: string;
  sections: {
    title: string;
    content: string;
    fossils: unknown[];
    examples: string[];
  }[];
  api: {
    endpoints: string[];
    schemas: Record<string, unknown>;
    examples: Record<string, unknown>;
  };
  guides: {
    title: string;
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    fossils: unknown[];
  }[];
}

/**
 * Fossil support interface
 */
export interface FossilSupport {
  tickets: {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    fossils: unknown[];
    createdAt: string;
    updatedAt: string;
  }[];
  knowledge: {
    articles: {
      title: string;
      content: string;
      category: string;
      fossils: unknown[];
    }[];
    faqs: {
      question: string;
      answer: string;
      category: string;
      fossils: unknown[];
    }[];
  };
  contact: {
    email: string;
    phone: string;
    chat: string;
    hours: string;
  };
}

/**
 * Fossil license interface
 */
export interface FossilLicense {
  type: 'open-source' | 'commercial' | 'enterprise';
  name: string;
  version: string;
  terms: string;
  restrictions: string[];
  permissions: string[];
  fossils: unknown[];
  validUntil: string;
  features: string[];
}

/**
 * Fossil compliance interface
 */
export interface FossilCompliance {
  standards: {
    name: string;
    version: string;
    status: 'compliant' | 'non-compliant' | 'pending';
    requirements: string[];
    fossils: unknown[];
    lastAudit: string;
    nextAudit: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'suspended';
    fossils: unknown[];
  }[];
  audits: {
    date: string;
    auditor: string;
    scope: string;
    findings: string[];
    recommendations: string[];
    fossils: unknown[];
  }[];
}

/**
 * Fossil governance interface
 */
export interface FossilGovernance {
  policies: {
    name: string;
    description: string;
    rules: string[];
    enforcement: 'automatic' | 'manual' | 'hybrid';
    fossils: unknown[];
  }[];
  approvals: {
    type: string;
    approvers: string[];
    required: number;
    fossils: unknown[];
  }[];
  reviews: {
    fossilId: string;
    reviewer: string;
    status: 'pending' | 'approved' | 'rejected';
    comments: string[];
    timestamp: string;
  }[];
}

/**
 * Fossil lifecycle interface
 */
export interface FossilLifecycle {
  stage: 'development' | 'testing' | 'staging' | 'production' | 'deprecated' | 'archived';
  transitions: {
    from: string;
    to: string;
    conditions: string[];
    actions: string[];
    fossils: unknown[];
  }[];
  retention: {
    policy: string;
    duration: number; // days
    action: 'delete' | 'archive' | 'backup';
    fossils: unknown[];
  };
  archival: {
    location: string;
    format: string;
    compression: boolean;
    encryption: boolean;
    fossils: unknown[];
  };
}

/**
 * Fossil quality interface
 */
export interface FossilQuality {
  metrics: {
    completeness: number; // percentage
    accuracy: number; // percentage
    consistency: number; // percentage
    timeliness: number; // percentage
    validity: number; // percentage
  };
  checks: {
    name: string;
    type: 'validation' | 'verification' | 'reconciliation';
    status: 'passed' | 'failed' | 'warning';
    details: string[];
    fossils: unknown[];
  }[];
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    fossils: unknown[];
    resolution: string;
    status: 'open' | 'in-progress' | 'resolved';
  }[];
}

/**
 * Fossil lineage interface
 */
export interface FossilLineage {
  ancestors: {
    fossilId: string;
    relationship: 'parent' | 'grandparent' | 'ancestor';
    type: FossilType;
    metadata: FossilMetadata;
  }[];
  descendants: {
    fossilId: string;
    relationship: 'child' | 'grandchild' | 'descendant';
    type: FossilType;
    metadata: FossilMetadata;
  }[];
  siblings: {
    fossilId: string;
    relationship: 'sibling' | 'cousin';
    type: FossilType;
    metadata: FossilMetadata;
  }[];
  transformations: {
    from: string;
    to: string;
    type: 'copy' | 'modify' | 'merge' | 'split';
    timestamp: string;
    metadata: FossilMetadata;
  }[];
}

/**
 * Fossil impact interface
 */
export interface FossilImpact {
  scope: 'local' | 'team' | 'organization' | 'global';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected: {
    systems: string[];
    users: string[];
    processes: string[];
    data: string[];
  };
  timeline: {
    detected: string;
    reported: string;
    resolved: string;
    duration: number; // hours
  };
  metrics: {
    downtime: number; // minutes
    errors: number;
    performance: number; // percentage
    userSatisfaction: number; // percentage
  };
  fossils: unknown[];
}

/**
 * Fossil risk interface
 */
export interface FossilRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'compliance' | 'operational' | 'financial' | 'reputational';
  probability: number; // percentage
  impact: number; // percentage
  score: number; // calculated risk score
  mitigation: {
    strategies: string[];
    actions: string[];
    responsible: string[];
    timeline: string;
    fossils: unknown[];
  };
  monitoring: {
    indicators: string[];
    thresholds: Record<string, number>;
    alerts: string[];
    fossils: unknown[];
  };
}

/**
 * Fossil cost interface
 */
export interface FossilCost {
  storage: {
    monthly: number;
    total: number;
    breakdown: Record<string, number>;
  };
  compute: {
    monthly: number;
    total: number;
    breakdown: Record<string, number>;
  };
  network: {
    monthly: number;
    total: number;
    breakdown: Record<string, number>;
  };
  licensing: {
    monthly: number;
    total: number;
    breakdown: Record<string, number>;
  };
  support: {
    monthly: number;
    total: number;
    breakdown: Record<string, number>;
  };
  fossils: unknown[];
}

/**
 * Fossil value interface
 */
export interface FossilValue {
  business: {
    revenue: number;
    costSavings: number;
    efficiency: number; // percentage
    quality: number; // percentage
  };
  technical: {
    performance: number; // percentage
    reliability: number; // percentage
    maintainability: number; // percentage
    scalability: number; // percentage
  };
  user: {
    satisfaction: number; // percentage
    adoption: number; // percentage
    productivity: number; // percentage
    experience: number; // percentage
  };
  strategic: {
    alignment: number; // percentage
    innovation: number; // percentage
    competitive: number; // percentage
    future: number; // percentage
  };
  fossils: unknown[];
}

/**
 * Fossil maturity interface
 */
export interface FossilMaturity {
  level: 'initial' | 'managed' | 'defined' | 'quantitatively-managed' | 'optimizing';
  dimensions: {
    process: number; // 1-5
    technology: number; // 1-5
    people: number; // 1-5
    culture: number; // 1-5
  };
  capabilities: {
    name: string;
    level: number; // 1-5
    description: string;
    fossils: unknown[];
  }[];
  roadmap: {
    current: string;
    target: string;
    timeline: string;
    milestones: string[];
    fossils: unknown[];
  };
}

/**
 * Fossil innovation interface
 */
export interface FossilInnovation {
  ideas: {
    title: string;
    description: string;
    category: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    status: 'proposed' | 'evaluating' | 'approved' | 'in-progress' | 'completed';
    fossils: unknown[];
  }[];
  experiments: {
    name: string;
    hypothesis: string;
    method: string;
    results: string;
    learnings: string[];
    fossils: unknown[];
  }[];
  patents: {
    title: string;
    number: string;
    status: 'pending' | 'granted' | 'rejected';
    description: string;
    fossils: unknown[];
  }[];
}

/**
 * Fossil sustainability interface
 */
export interface FossilSustainability {
  environmental: {
    carbonFootprint: number; // kg CO2
    energyEfficiency: number; // percentage
    renewableEnergy: number; // percentage
    wasteReduction: number; // percentage
  };
  social: {
    diversity: number; // percentage
    inclusion: number; // percentage
    community: number; // percentage
    education: number; // percentage
  };
  governance: {
    transparency: number; // percentage
    accountability: number; // percentage
    ethics: number; // percentage
    compliance: number; // percentage
  };
  fossils: unknown[];
}

/**
 * Fossil resilience interface
 */
export interface FossilResilience {
  redundancy: {
    systems: number; // percentage
    data: number; // percentage
    processes: number; // percentage
    people: number; // percentage
  };
  recovery: {
    time: number; // minutes
    point: number; // minutes
    objective: number; // minutes
    capability: number; // percentage
  };
  adaptability: {
    change: number; // percentage
    learning: number; // percentage
    innovation: number; // percentage
    evolution: number; // percentage
  };
  fossils: unknown[];
}

/**
 * Fossil transformation interface
 */
export interface FossilTransformation {
  digital: {
    automation: number; // percentage
    integration: number; // percentage
    optimization: number; // percentage
    innovation: number; // percentage
  };
  cultural: {
    mindset: number; // percentage
    skills: number; // percentage
    collaboration: number; // percentage
    leadership: number; // percentage
  };
  operational: {
    efficiency: number; // percentage
    quality: number; // percentage
    agility: number; // percentage
    scalability: number; // percentage
  };
  fossils: unknown[];
}

/**
 * Fossil ecosystem interface
 */
export interface FossilEcosystem {
  partners: {
    name: string;
    type: 'technology' | 'service' | 'consulting' | 'academic';
    relationship: 'strategic' | 'tactical' | 'operational';
    contribution: string[];
    fossils: unknown[];
  }[];
  integrations: {
    name: string;
    type: 'api' | 'webhook' | 'database' | 'file';
    status: 'active' | 'inactive' | 'deprecated';
    fossils: unknown[];
  }[];
  marketplace: {
    products: string[];
    services: string[];
    solutions: string[];
    fossils: unknown[];
  };
  community: {
    developers: number;
    contributors: number;
    users: number;
    advocates: number;
    fossils: unknown[];
  };
}

/**
 * Fossil future interface
 */
export interface FossilFuture {
  vision: {
    shortTerm: string; // 1-2 years
    mediumTerm: string; // 3-5 years
    longTerm: string; // 5+ years
  };
  trends: {
    name: string;
    impact: 'low' | 'medium' | 'high';
    probability: number; // percentage
    timeframe: string;
    fossils: unknown[];
  }[];
  scenarios: {
    name: string;
    description: string;
    probability: number; // percentage
    impact: 'low' | 'medium' | 'high';
    fossils: unknown[];
  }[];
  roadmap: {
    phases: {
      name: string;
      duration: string;
      objectives: string[];
      fossils: unknown[];
    }[];
  };
} 