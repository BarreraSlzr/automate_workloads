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

// Core LLM service exports
export { 
  LLMService, 
  callOpenAIChat,
  type LLMUsageMetrics,
  type LLMOptimizationConfig,
  type LLMCallIntelligence,
  type ChatCompletionRequestMessage
} from './llm';

// Enhanced LLM service exports
export { 
  EnhancedLLMService, 
  createEnhancedLLMService,
  type EnhancedLLMResult,
  type EnhancedLLMServiceParams
} from './llmEnhanced';

// Import for ServicesTree
import { 
  LLMService, 
  callOpenAIChat,
  type LLMUsageMetrics,
  type LLMOptimizationConfig,
  type LLMCallIntelligence,
  type ChatCompletionRequestMessage
} from './llm';

import { 
  EnhancedLLMService, 
  createEnhancedLLMService,
  type EnhancedLLMResult,
  type EnhancedLLMServiceParams
} from './llmEnhanced';

import { 
  LLMPredictiveMonitoringService, 
  createPredictiveMonitoringService,
  monitorBeforeLLMCall,
  type LLMPredictiveMonitoringConfig,
  type LLMPredictiveMetrics,
  type LLMContextAnalysis,
  type LLMRiskAssessment,
  type LLMPredictiveAlert
} from './llmPredictiveMonitoring';

import { 
  GitHubService,
  loadAndFillAutomationTemplate,
  type GitHubOptions,
  type AutomationTemplateFields
} from './github';

import { 
  VSCodeAIService, 
  createVSCodeAIService,
  callVSCodeAI,
  type VSCodeAIConfig,
  type VSCodeAIProvider,
  type VSCodeAICallOptions,
  type VSCodeAISnapshotOptions,
  type VSCodeAIResponse,
  type VSCodeAIFossil
} from './vscodeAI';

import { 
  SemanticTaggerService 
} from './semantic-tagger';

// LLM Predictive Monitoring exports
export { 
  LLMPredictiveMonitoringService, 
  createPredictiveMonitoringService,
  monitorBeforeLLMCall,
  type LLMPredictiveMonitoringConfig,
  type LLMPredictiveMetrics,
  type LLMContextAnalysis,
  type LLMRiskAssessment,
  type LLMPredictiveAlert
} from './llmPredictiveMonitoring';

// GitHub service exports
export { 
  GitHubService,
  loadAndFillAutomationTemplate,
  type GitHubOptions,
  type AutomationTemplateFields
} from './github';

// VS Code AI service exports
export { 
  VSCodeAIService, 
  createVSCodeAIService,
  callVSCodeAI,
  type VSCodeAIConfig,
  type VSCodeAIProvider,
  type VSCodeAICallOptions,
  type VSCodeAISnapshotOptions,
  type VSCodeAIResponse,
  type VSCodeAIFossil
} from './vscodeAI';

// Semantic Tagger service exports
export { 
  SemanticTaggerService 
} from './semantic-tagger';

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
export const ServicesTree = {
  /**
   * LLM: Core LLM service with intelligent routing, optimization, and fossilization.
   * - LLMService: Main LLM service class with intelligent routing and optimization
   * - callOpenAIChat: Convenience function for direct OpenAI chat calls
   */
  LLM: {
    LLMService,
    callOpenAIChat,
  },
  
  /**
   * LLMEnhanced: Enhanced LLM service with validation, preprocessing, and quality analysis.
   * - EnhancedLLMService: Enhanced LLM service with comprehensive validation and analysis
   * - createEnhancedLLMService: Factory function for creating enhanced LLM service
   */
  LLMEnhanced: {
    EnhancedLLMService,
    createEnhancedLLMService,
  },
  
  /**
   * LLMPredictiveMonitoring: Predictive monitoring for LLM calls with risk assessment.
   * - LLMPredictiveMonitoringService: Service for predictive monitoring and risk assessment
   * - createPredictiveMonitoringService: Factory function for creating monitoring service
   * - monitorBeforeLLMCall: Convenience function for monitoring before LLM calls
   */
  LLMPredictiveMonitoring: {
    LLMPredictiveMonitoringService,
    createPredictiveMonitoringService,
    monitorBeforeLLMCall,
  },
  
  /**
   * GitHub: GitHub service integration using GitHub CLI with fossil-backed operations.
   * - GitHubService: Main GitHub service class for repository operations
   * - loadAndFillAutomationTemplate: Utility for loading and filling automation templates
   */
  GitHub: {
    GitHubService,
    loadAndFillAutomationTemplate,
  },
  
  /**
   * VSCodeAI: VS Code AI integration service for AI-powered development workflows.
   * - VSCodeAIService: Main VS Code AI service class for AI integration
   * - createVSCodeAIService: Factory function for creating VS Code AI service
   * - callVSCodeAI: Convenience function for quick VS Code AI calls
   */
  VSCodeAI: {
    VSCodeAIService,
    createVSCodeAIService,
    callVSCodeAI,
  },
  
  /**
   * SemanticTagger: Semantic tagging service for intelligent fossil tagging and analysis.
   * - SemanticTaggerService: Main semantic tagging service class for intelligent tagging
   */
  SemanticTagger: {
    SemanticTaggerService,
  },
}; 