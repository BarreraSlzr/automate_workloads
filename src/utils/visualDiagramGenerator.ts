/**
 * Visual Diagram Generator
 * 
 * Provides utilities for generating Mermaid diagrams for visual documentation
 * across the automation ecosystem. Supports workflow, architecture, and
 * relationship diagrams for better human audit and understanding.
 */

import { z } from 'zod';
import { 
  WorkflowStepSchema,
  ComponentSchema,
  RiskSchema,
  DependencySchema
} from '../types';

// Import types from schemas
import type { WorkflowStep, Component, Risk, Dependency } from '../types/schemas';

/**
 * Generate a workflow diagram from steps
 */
export function generateWorkflowDiagram(steps: WorkflowStep[]): string {
  if (steps.length === 0) return '';

  const nodes = steps.map((step, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing step ${i + 1} of ${arr.length}`);
    }
    const nodeId = String.fromCharCode(65 + i);
    const style = step.style ? `\n    style ${nodeId} fill:${step.style}` : '';
    return `    ${nodeId}[${step.step}]${style}`;
  });

  const edges = steps.map((_, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing step edge ${i + 1} of ${arr.length}`);
    }
    if (i < steps.length - 1) {
      const from = String.fromCharCode(65 + i);
      const to = String.fromCharCode(66 + i);
      return `    ${from} --> ${to}`;
    }
    return '';
  }).filter(Boolean);

  return [
    'graph TD',
    ...nodes,
    ...edges,
  ].join('\n');
}

/**
 * Generate an architecture diagram from components
 */
export function generateArchitectureDiagram(components: Component[]): string {
  if (components.length === 0) return '';

  const subgraphs = components.map(comp => {
    if (components.indexOf(comp) % 10 === 0 || components.indexOf(comp) === components.length - 1) {
      console.log(`🔄 Processing component ${components.indexOf(comp) + 1} of ${components.length}`);
    }
    const items = comp.items.map((item, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing component item ${i + 1} of ${arr.length}`);
      }
      return `        ${item}`;
    }).join('\n');
    const style = comp.style ? `\n    style ${comp.name} fill:${comp.style}` : '';
    return `    subgraph "${comp.name}"\n${items}\n    end${style}`;
  });

  return [
    'graph TB',
    ...subgraphs,
  ].join('\n');
}

/**
 * Generate a dependency diagram
 */
export function generateDependencyDiagram(dependencies: Dependency[]): string {
  if (dependencies.length === 0) return '';

  const nodes = dependencies.map((dep, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing dependency ${i + 1} of ${arr.length}`);
    }
    const nodeId = String.fromCharCode(65 + i);
    const style = dep.type === 'blocking' ? '#ffebee' : 
                  dep.type === 'dependent' ? '#e3f2fd' : '#fff3e0';
    return `    ${nodeId}[${dep.name}]\n    style ${nodeId} fill:${style}`;
  });

  const edges = dependencies.map((dep, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing dependency edge ${i + 1} of ${arr.length}`);
    }
    if (i < dependencies.length - 1) {
      const from = String.fromCharCode(65 + i);
      const to = String.fromCharCode(66 + i);
      const edgeStyle = dep.type === 'blocking' ? ' --> ' : ' -.-> ';
      return `    ${from}${edgeStyle}${to}`;
    }
    return '';
  }).filter(Boolean);

  return [
    'graph LR',
    ...nodes,
    ...edges,
  ].join('\n');
}

/**
 * Generate a risk assessment diagram
 */
export function generateRiskDiagram(risks: Risk[]): string {
  if (risks.length === 0) return '';

  const nodes = risks.map((risk, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing risk ${i + 1} of ${arr.length}`);
    }
    const baseId = String.fromCharCode(65 + i);
    const impactId = `${baseId}_impact`;
    const probId = `${baseId}_prob`;
    const mitId = `${baseId}_mit`;
    
    const impactColor = risk.impact === 'critical' ? '#ffebee' :
                       risk.impact === 'high' ? '#fff3e0' :
                       risk.impact === 'medium' ? '#e8f5e8' : '#f3e5f5';
    
    return [
      `    ${baseId}[${risk.risk}]`,
      `    ${impactId}[Impact: ${risk.impact}]`,
      `    ${probId}[Probability: ${risk.probability}]`,
      `    ${mitId}[Mitigation: ${risk.mitigation}]`,
      `    style ${baseId} fill:${impactColor}`,
      `    ${baseId} --> ${impactId}`,
      `    ${baseId} --> ${probId}`,
      `    ${impactId} --> ${mitId}`,
      `    ${probId} --> ${mitId}`,
    ].join('\n    ');
  });

  return [
    'graph TD',
    ...nodes,
  ].join('\n    ');
}

/**
 * Generate a sequence diagram
 */
export function generateSequenceDiagram(
  participants: Array<{ name: string; label: string }>,
  interactions: Array<{ from: string; to: string; message: string }>
): string {
  if (participants.length === 0 || interactions.length === 0) return '';

  const participantDefs = participants.map((p, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing participant ${i + 1} of ${arr.length}`);
    }
    return `    participant ${p.name} as ${p.label}`;
  });

  const interactionDefs = interactions.map((interaction, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing interaction ${i + 1} of ${arr.length}`);
    }
    return `    ${interaction.from}->>${interaction.to}: ${interaction.message}`;
  });

  return [
    'sequenceDiagram',
    ...participantDefs,
    ...interactionDefs,
  ].join('\n');
}

/**
 * Generate a progress tracking diagram
 */
export function generateProgressDiagram(
  stages: Array<{ name: string; status: 'completed' | 'in-progress' | 'pending' }>
): string {
  if (stages.length === 0) return '';

  const nodes = stages.map((stage, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing stage ${i + 1} of ${arr.length}`);
    }
    const nodeId = String.fromCharCode(65 + i);
    const color = stage.status === 'completed' ? '#e8f5e8' :
                  stage.status === 'in-progress' ? '#fff3e0' : '#ffebee';
    return `    ${nodeId}[${stage.name}]\n    style ${nodeId} fill:${color}`;
  });

  const edges = stages.map((_, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing stage edge ${i + 1} of ${arr.length}`);
    }
    if (i < stages.length - 1) {
      const from = String.fromCharCode(65 + i);
      const to = String.fromCharCode(66 + i);
      return `    ${from} --> ${to}`;
    }
    return '';
  }).filter(Boolean);

  return [
    'graph LR',
    ...nodes,
    ...edges,
  ].join('\n');
}

/**
 * Generate a system overview diagram
 */
export function generateSystemOverviewDiagram(
  systems: Array<{ name: string; components: string[]; connections: Array<{ from: string; to: string }> }>
): string {
  if (systems.length === 0) return '';

  const subgraphs = systems.map((sys, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing system ${i + 1} of ${arr.length}`);
    }
    const items = sys.components.map((comp, i, arr) => {
      if (i % 10 === 0 || i === arr.length - 1) {
        console.log(`🔄 Processing system component ${i + 1} of ${arr.length}`);
      }
      return `        ${comp}`;
    }).join('\n');
    return `    subgraph "${sys.name}"\n${items}\n    end`;
  });

  const connections = systems.flatMap((sys, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing system ${i + 1} of ${arr.length}`);
    }
    return sys.connections.map(conn => `    ${conn.from} --> ${conn.to}`);
  });

  return [
    'graph TB',
    ...subgraphs,
    ...connections,
  ].join('\n');
}

/**
 * Generate a decision tree diagram
 */
export function generateDecisionTreeDiagram(
  decisions: Array<{ question: string; options: Array<{ answer: string; outcome: string }> }>
): string {
  if (decisions.length === 0) return '';

  const nodes: string[] = [];
  const edges: string[] = [];
  let nodeCounter = 0;

  decisions.forEach((decision, decisionIndex, arr) => {
    if (decisionIndex % 10 === 0 || decisionIndex === arr.length - 1) {
      console.log(`🔄 Processing decision ${decisionIndex + 1} of ${arr.length}`);
    }
    const questionId = String.fromCharCode(65 + decisionIndex);
    nodes.push(`    ${questionId}{${decision.question}}`);

    decision.options.forEach((option, optionIndex, arr) => {
      const outcomeId = String.fromCharCode(65 + decisionIndex) + String.fromCharCode(65 + optionIndex);
      nodes.push(`    ${outcomeId}[${option.outcome}]`);
      edges.push(`    ${questionId} -->|${option.answer}| ${outcomeId}`);
    });
  });

  return [
    'graph TD',
    ...nodes,
    ...edges,
  ].join('\n');
}

/**
 * Generate a complete visual issue body with diagrams
 */
export function generateVisualIssueBody(params: {
  title: string;
  purpose: string;
  checklist: string[];
  workflow?: WorkflowStep[];
  dependencies?: Dependency[];
  risks?: Risk[];
  architecture?: Component[];
  metadata?: Record<string, any>;
}): string {
  const { title, purpose, checklist, workflow, dependencies, risks, architecture, metadata } = params;

  const sections = [
    `## 🎯 ${title}`,
    '',
    '### Purpose',
    purpose,
  ];

  // Add workflow diagram if provided
  if (workflow && workflow.length > 0) {
    sections.push(
      '',
      '### Workflow',
      '```mermaid',
      generateWorkflowDiagram(workflow),
      '```'
    );
  }

  // Add architecture diagram if provided
  if (architecture && architecture.length > 0) {
    sections.push(
      '',
      '### Architecture',
      '```mermaid',
      generateArchitectureDiagram(architecture),
      '```'
    );
  }

  // Add dependencies diagram if provided
  if (dependencies && dependencies.length > 0) {
    sections.push(
      '',
      '### Dependencies',
      '```mermaid',
      generateDependencyDiagram(dependencies),
      '```'
    );
  }

  // Add risk assessment if provided
  if (risks && risks.length > 0) {
    sections.push(
      '',
      '### Risk Assessment',
      '```mermaid',
      generateRiskDiagram(risks),
      '```'
    );
  }

  // Add checklist
  sections.push(
    '',
    '### Checklist',
    ...checklist.map(item => `- [ ] ${item}`)
  );

  // Add metadata if provided
  if (metadata && Object.keys(metadata).length > 0) {
    sections.push(
      '',
      '### Metadata',
      '```json',
      JSON.stringify(metadata, null, 2),
      '```'
    );
  }

  return sections.join('\n');
}

/**
 * Generate a fossil publication with visual elements
 */
export function generateVisualFossilPublication(params: {
  fossil: any;
  includeWorkflow?: boolean;
  includeArchitecture?: boolean;
  includeRelationships?: boolean;
  audience?: 'technical' | 'management' | 'stakeholder';
}): string {
  const { fossil, includeWorkflow = true, includeArchitecture = true, includeRelationships = true, audience = 'technical' } = params;

  const sections = [
    `# 📊 ${fossil.title || 'Fossil Publication'}`,
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Audience**: ${audience}`,
    '',
    '## Overview',
    fossil.description || 'No description available.',
  ];

  // Add workflow diagram for technical audience
  if (includeWorkflow && audience === 'technical') {
    sections.push(
      '',
      '## Workflow',
      '```mermaid',
      generateWorkflowDiagram([
        { step: 'Fossil Creation', type: 'start' },
        { step: 'Content Analysis', type: 'process' },
        { step: 'Visual Generation', type: 'process' },
        { step: 'Publication', type: 'end' },
      ]),
      '```'
    );
  }

  // Add architecture diagram for technical audience
  if (includeArchitecture && audience === 'technical') {
    sections.push(
      '',
      '## System Architecture',
      '```mermaid',
      generateArchitectureDiagram([
        { name: 'Input Layer', items: ['YAML Fossils', 'GitHub Data', 'LLM Context'] },
        { name: 'Processing Layer', items: ['Analysis Engine', 'Visual Generator', 'Publication Script'] },
        { name: 'Output Layer', items: ['Enhanced Markdown', 'API JSON', 'Issue Bodies'] },
      ]),
      '```'
    );
  }

  // Add relationship diagram for all audiences
  if (includeRelationships) {
    sections.push(
      '',
      '## Relationships',
      '```mermaid',
      generateDependencyDiagram([
        { name: 'Core Fossils', type: 'dependent', description: 'Source of truth' },
        { name: 'Generated Outputs', type: 'dependent', description: 'Public content' },
        { name: 'Issue Bodies', type: 'related', description: 'GitHub integration' },
      ]),
      '```'
    );
  }

  // Add fossil content
  sections.push(
    '',
    '## Fossil Content',
    '```json',
    JSON.stringify(fossil, null, 2),
    '```'
  );

  return sections.join('\n');
}

/**
 * Utility to detect if content should include visual elements
 */
export function shouldIncludeVisuals(content: string, audience: string): boolean {
  const visualKeywords = ['workflow', 'process', 'architecture', 'system', 'flow', 'diagram'];
  const hasVisualKeywords = visualKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
  
  const isTechnicalAudience = ['technical', 'developer', 'engineer'].some(term => 
    audience.toLowerCase().includes(term)
  );
  
  return hasVisualKeywords || isTechnicalAudience;
}

/**
 * Extract visual context from content for diagram generation
 */
export function extractVisualContext(content: string): {
  workflows: string[];
  components: string[];
  dependencies: string[];
  risks: string[];
} {
  const workflows: string[] = [];
  const components: string[] = [];
  const dependencies: string[] = [];
  const risks: string[] = [];

  // Simple keyword-based extraction (can be enhanced with LLM)
  const lines = content.split('\n');
  
  lines.forEach((line, i, arr) => {
    if (i % 10 === 0 || i === arr.length - 1) {
      console.log(`🔄 Processing content line ${i + 1} of ${arr.length}`);
    }
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('step') || lowerLine.includes('process') || lowerLine.includes('workflow')) {
      workflows.push(line.trim());
    }
    
    if (lowerLine.includes('component') || lowerLine.includes('service') || lowerLine.includes('module')) {
      components.push(line.trim());
    }
    
    if (lowerLine.includes('depend') || lowerLine.includes('require') || lowerLine.includes('block')) {
      dependencies.push(line.trim());
    }
    
    if (lowerLine.includes('risk') || lowerLine.includes('issue') || lowerLine.includes('problem')) {
      risks.push(line.trim());
    }
  });

  return { workflows, components, dependencies, risks };
} 