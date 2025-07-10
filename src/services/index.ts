import {
  LLMPredictiveMonitoringConfigSchema,
  LLMPredictiveMetricsSchema,
  LLMPredictiveAlertSchema,
} from '../types/schemas';

/**
 * ServicesTree: Centralized Bill of Materials (BOM) for all services in src/services
 * 
 * Organized by conceptual section for discoverability, tooling, and automation.
 * 
 * Usage:
 *   - For introspection, documentation, or programmatic service access.
 *   - Example: ServicesTree.LLM.LLMService
 * 
 * Sections:
 *   - LLM: Core LLM service with intelligent routing, optimization, and fossilization
 *   - LLMEnhanced: Enhanced LLM service with validation, preprocessing, and quality analysis
 *   - LLMPredictiveMonitoring: Predictive monitoring for LLM calls with risk assessment
 *   - GitHub: GitHub service integration using GitHub CLI with fossil-backed operations
 *   - VSCodeAI: VS Code AI integration service for AI-powered development workflows
 *   - SemanticTagger: Semantic tagging service for intelligent fossil tagging and analysis
 */

// ============================================================================
// SERVICE EXPORTS
// ============================================================================

// Core LLM Service
export {
  LLMService,
  callOpenAIChat
} from './llm';

// Enhanced LLM Service
export {
  EnhancedLLMService,
  createEnhancedLLMService,
  callLLMEnhanced,
  analyzeLLMInput
} from './llmEnhanced';

// LLM Predictive Monitoring Service
export {
  LLMPredictiveMonitoringService,
  createPredictiveMonitoringService,
  monitorBeforeLLMCall
} from './llmPredictiveMonitoring';

// GitHub Service
export {
  GitHubService,
  loadAndFillAutomationTemplate
} from './github';

// Semantic Tagger Service
export {
  SemanticTaggerService
} from './semantic-tagger';

// ============================================================================
// SCHEMA EXPORTS (from canonical src/types/schemas)
// ============================================================================

export {
  LLMPredictiveMonitoringConfigSchema,
  LLMPredictiveMetricsSchema,
  LLMPredictiveAlertSchema,
  LLMContextAnalysisSchema,
  LLMRiskAssessmentSchema
} from '../types/schemas'; 