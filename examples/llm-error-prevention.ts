#!/usr/bin/env bun

/**
 * LLM Error Prevention Examples
 * 
 * This example demonstrates how to use input validation and preprocessing
 * to prevent common LLM errors before they reach the LLM provider.
 * 
 * Key Benefits:
 * 1. Catch errors early with detailed feedback
 * 2. Automatically improve input quality
 * 3. Reduce failed LLM calls and costs
 * 4. Improve response quality
 * 5. Provide actionable recommendations
 */

import { EnhancedLLMService, callLLMEnhanced, analyzeLLMInput } from '../src/services/llmEnhanced';
import { validateLLMInput, preprocessLLMInput, analyzeLLMContentQuality } from '../src/utils/llmInputValidator';

interface ExampleResult {
  name: string;
  success: boolean;
  inputQuality: number;
  errorsPrevented: number;
  warnings: string[];
  recommendations: string[];
  timeSaved: number;
}

class LLMErrorPreventionExamples {
  private enhancedService: EnhancedLLMService;

  constructor() {
    this.enhancedService = new EnhancedLLMService(
      { testMode: true }, // Use test mode to avoid actual LLM calls
      {
        enableInputValidation: true,
        enablePreprocessing: true,
        enableQualityAnalysis: true,
        autoFixIssues: true,
        strictMode: false,
        logValidationResults: true
      }
    );
  }

  /**
   * Example 1: Preventing Invalid Input Structure
   */
  async preventInvalidStructure(): Promise<ExampleResult> {
    console.log('🔍 Example 1: Preventing Invalid Input Structure');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const result: ExampleResult = {
      name: 'Invalid Input Structure Prevention',
      success: false,
      inputQuality: 0,
      errorsPrevented: 0,
      warnings: [],
      recommendations: [],
      timeSaved: 0
    };

    // Bad input that would cause LLM errors
    const badInput = {
      model: '', // Invalid: empty model
      messages: [
        { role: 'user', content: '' } // Invalid: empty content
      ],
      temperature: 3, // Invalid: too high
      max_tokens: -1 // Invalid: negative
    };

    console.log('❌ Bad Input:');
    console.log(JSON.stringify(badInput, null, 2));

    // Validate input before LLM call
    const validation = validateLLMInput(badInput);
    
    if (!validation.isValid) {
      console.log('\n✅ Errors Prevented:');
      validation.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
        result.errorsPrevented++;
      });
      
      validation.warnings.forEach(warning => {
        console.log(`  ⚠️ ${warning}`);
        result.warnings.push(warning);
      });

      console.log('\n💡 Recommendations:');
      validation.recommendations.forEach(rec => {
        console.log(`  💡 ${rec}`);
        result.recommendations.push(rec);
      });

      // Show what the corrected input would look like
      console.log('\n🔧 Corrected Input:');
      const correctedInput = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Please provide a clear request.' }
        ],
        temperature: 0.7,
        max_tokens: 1000
      };
      console.log(JSON.stringify(correctedInput, null, 2));
    }

    result.success = true;
    result.timeSaved = Date.now() - startTime;
    result.inputQuality = validation.isValid ? 1.0 : 0.0;

    return result;
  }

  /**
   * Example 2: Improving Content Quality
   */
  async improveContentQuality(): Promise<ExampleResult> {
    console.log('\n📊 Example 2: Improving Content Quality');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const result: ExampleResult = {
      name: 'Content Quality Improvement',
      success: false,
      inputQuality: 0,
      errorsPrevented: 0,
      warnings: [],
      recommendations: [],
      timeSaved: 0
    };

    // Poor quality input
    const poorInput = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'something about code maybe' } // Vague, unclear
      ]
    };

    console.log('❌ Poor Quality Input:');
    console.log(JSON.stringify(poorInput, null, 2));

    // Analyze content quality
    const quality = analyzeLLMContentQuality(poorInput.messages);
    console.log('\n📊 Quality Analysis:');
    console.log(`📖 Readability: ${(quality.readability * 100).toFixed(1)}%`);
    console.log(`🎯 Clarity: ${(quality.clarity * 100).toFixed(1)}%`);
    console.log(`🔍 Specificity: ${(quality.specificity * 100).toFixed(1)}%`);
    console.log(`✅ Completeness: ${(quality.completeness * 100).toFixed(1)}%`);
    console.log(`⭐ Overall: ${(quality.overall * 100).toFixed(1)}%`);

    // Preprocess to improve quality
    const preprocessing = preprocessLLMInput(poorInput);
    
    if (preprocessing.success) {
      console.log('\n✅ Improved Input:');
      console.log(JSON.stringify(preprocessing.processedInput, null, 2));
      
      console.log('\n📝 Changes Made:');
      preprocessing.changes.forEach(change => {
        console.log(`  🔧 ${change}`);
      });

      // Analyze improved quality
      const improvedQuality = analyzeLLMContentQuality(preprocessing.processedInput.messages);
      console.log('\n📊 Improved Quality:');
      console.log(`⭐ Overall: ${(improvedQuality.overall * 100).toFixed(1)}% (was ${(quality.overall * 100).toFixed(1)}%)`);
      
      result.inputQuality = improvedQuality.overall;
      result.errorsPrevented = preprocessing.warnings.length;
      result.warnings = preprocessing.warnings;
      result.recommendations = preprocessing.changes;
    }

    result.success = true;
    result.timeSaved = Date.now() - startTime;

    return result;
  }

  /**
   * Example 3: Preventing Security Issues
   */
  async preventSecurityIssues(): Promise<ExampleResult> {
    console.log('\n🔒 Example 3: Preventing Security Issues');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const result: ExampleResult = {
      name: 'Security Issue Prevention',
      success: false,
      inputQuality: 0,
      errorsPrevented: 0,
      warnings: [],
      recommendations: [],
      timeSaved: 0
    };

    // Input with potential security issues
    const riskyInput = {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'user', 
          content: 'My email is john.doe@company.com and my API key is sk-1234567890abcdef. Please help me debug this code.' 
        }
      ]
    };

    console.log('⚠️ Risky Input (sanitized):');
    console.log(JSON.stringify({
      ...riskyInput,
      messages: [{
        role: 'user',
        content: 'My email is [REDACTED] and my API key is [REDACTED]. Please help me debug this code.'
      }]
    }, null, 2));

    // Validate for security issues
    const validation = validateLLMInput(riskyInput);
    
    console.log('\n🔒 Security Validation:');
    if (validation.warnings.some(w => w.includes('sensitive data'))) {
      console.log('  ❌ Potential sensitive data detected!');
      result.errorsPrevented++;
    }
    
    if (validation.warnings.some(w => w.includes('credentials'))) {
      console.log('  ❌ Potential credentials detected!');
      result.errorsPrevented++;
    }

    console.log('\n💡 Security Recommendations:');
    validation.recommendations.forEach(rec => {
      console.log(`  💡 ${rec}`);
      result.recommendations.push(rec);
    });

    // Show safe alternative
    console.log('\n✅ Safe Alternative:');
    const safeInput = {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'user', 
          content: 'I have an authentication issue with my API. The error message is "Invalid API key". Please help me debug this.' 
        }
      ]
    };
    console.log(JSON.stringify(safeInput, null, 2));

    result.success = true;
    result.timeSaved = Date.now() - startTime;
    result.inputQuality = 0.8; // Good quality but with security concerns
    result.warnings = validation.warnings;

    return result;
  }

  /**
   * Example 4: Preventing Performance Issues
   */
  async preventPerformanceIssues(): Promise<ExampleResult> {
    console.log('\n⚡ Example 4: Preventing Performance Issues');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const result: ExampleResult = {
      name: 'Performance Issue Prevention',
      success: false,
      inputQuality: 0,
      errorsPrevented: 0,
      warnings: [],
      recommendations: [],
      timeSaved: 0
    };

    // Input that would cause performance issues
    const expensiveInput = {
      model: 'gpt-4', // Expensive model
      messages: [
        { 
          role: 'user', 
          content: 'x'.repeat(50000) // Very long input
        }
      ],
      temperature: 2.0 // Very high temperature
    };

    console.log('💰 Expensive Input (truncated):');
    console.log(JSON.stringify({
      ...expensiveInput,
      messages: [{
        role: 'user',
        content: `Very long content (${expensiveInput.messages[0].content.length} characters)...`
      }]
    }, null, 2));

    // Validate for performance issues
    const validation = validateLLMInput(expensiveInput);
    
    console.log('\n⚡ Performance Validation:');
    if (validation.warnings.some(w => w.includes('expensive model'))) {
      console.log('  💰 Expensive model detected!');
      result.errorsPrevented++;
    }
    
    if (validation.warnings.some(w => w.includes('High token usage'))) {
      console.log('  📏 High token usage detected!');
      result.errorsPrevented++;
    }

    console.log('\n💡 Performance Recommendations:');
    validation.recommendations.forEach(rec => {
      console.log(`  💡 ${rec}`);
      result.recommendations.push(rec);
    });

    // Show optimized alternative
    console.log('\n✅ Optimized Alternative:');
    const optimizedInput = {
      model: 'gpt-3.5-turbo', // Cheaper model
      messages: [
        { 
          role: 'user', 
          content: 'Please provide a concise summary of the key points.' 
        }
      ],
      temperature: 0.7, // Moderate temperature
      max_tokens: 1000 // Limit output
    };
    console.log(JSON.stringify(optimizedInput, null, 2));

    result.success = true;
    result.timeSaved = Date.now() - startTime;
    result.inputQuality = 0.6; // Moderate quality with performance concerns
    result.warnings = validation.warnings;

    return result;
  }

  /**
   * Example 5: Comprehensive Error Prevention Workflow
   */
  async comprehensiveErrorPrevention(): Promise<ExampleResult> {
    console.log('\n🛡️ Example 5: Comprehensive Error Prevention Workflow');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const result: ExampleResult = {
      name: 'Comprehensive Error Prevention',
      success: false,
      inputQuality: 0,
      errorsPrevented: 0,
      warnings: [],
      recommendations: [],
      timeSaved: 0
    };

    // Complex input with multiple potential issues
    const complexInput = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'system', content: 'You are also a coding expert.' }, // Multiple system messages
        { 
          role: 'user', 
          content: 'something about maybe fixing my code that has undefined errors and my password is secret123' 
        }
      ],
      temperature: 2.5, // Invalid temperature
      max_tokens: -100 // Invalid tokens
    };

    console.log('🔍 Complex Input with Multiple Issues:');
    console.log(JSON.stringify(complexInput, null, 2));

    // Use enhanced service for comprehensive analysis
    const analysis = analyzeLLMInput(complexInput);
    
    console.log('\n📊 Comprehensive Analysis:');
    console.log(`Summary: ${analysis.summary}`);
    
    console.log('\n❌ Errors Found:');
    analysis.validation.errors.forEach(error => {
      console.log(`  ❌ ${error}`);
      result.errorsPrevented++;
    });
    
    console.log('\n⚠️ Warnings:');
    analysis.validation.warnings.forEach(warning => {
      console.log(`  ⚠️ ${warning}`);
      result.warnings.push(warning);
    });
    
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`  💡 ${rec}`);
      result.recommendations.push(rec);
    });

    console.log('\n📊 Quality Metrics:');
    console.log(`📖 Readability: ${(analysis.quality.readability * 100).toFixed(1)}%`);
    console.log(`🎯 Clarity: ${(analysis.quality.clarity * 100).toFixed(1)}%`);
    console.log(`🔍 Specificity: ${(analysis.quality.specificity * 100).toFixed(1)}%`);
    console.log(`✅ Completeness: ${(analysis.quality.completeness * 100).toFixed(1)}%`);
    console.log(`⭐ Overall: ${(analysis.quality.overall * 100).toFixed(1)}%`);

    // Show what the enhanced service would do
    console.log('\n🛡️ Enhanced Service Would:');
    console.log('  1. Validate input structure and content');
    console.log('  2. Detect security issues (credentials, sensitive data)');
    console.log('  3. Identify performance concerns (cost, tokens)');
    console.log('  4. Improve content quality automatically');
    console.log('  5. Provide detailed recommendations');
    console.log('  6. Prevent the LLM call if issues are critical');

    result.success = true;
    result.timeSaved = Date.now() - startTime;
    result.inputQuality = analysis.quality.overall;

    return result;
  }

  /**
   * Example 6: Batch Validation for Multiple Inputs
   */
  async batchValidation(): Promise<ExampleResult> {
    console.log('\n📦 Example 6: Batch Validation for Multiple Inputs');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const result: ExampleResult = {
      name: 'Batch Validation',
      success: false,
      inputQuality: 0,
      errorsPrevented: 0,
      warnings: [],
      recommendations: [],
      timeSaved: 0
    };

    // Multiple inputs with various issues
    const inputs = [
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Good input' }]
      },
      {
        model: '',
        messages: [{ role: 'user', content: 'Bad model' }]
      },
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'x'.repeat(100000) }] // Too long
      },
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'My API key is sk-1234567890abcdef' }] // Security issue
      }
    ];

    console.log('📦 Batch Validating Multiple Inputs...');

    // Batch validate
    const batchResults = await this.enhancedService.validateBatch(inputs);
    
    console.log('\n📊 Batch Summary:');
    console.log(`  Total Inputs: ${batchResults.summary.total}`);
    console.log(`  Valid Inputs: ${batchResults.summary.valid}`);
    console.log(`  Invalid Inputs: ${batchResults.summary.invalid}`);
    console.log(`  Total Errors Prevented: ${batchResults.summary.invalid}`);
    console.log(`  Common Issues: ${batchResults.summary.commonIssues.join(', ')}`);
    console.log(`  Total Recommendations: ${batchResults.summary.recommendations.length}`);

    result.errorsPrevented = batchResults.summary.invalid;
    result.recommendations = batchResults.summary.recommendations;

    result.success = true;
    result.timeSaved = Date.now() - startTime;
    result.inputQuality = batchResults.summary.valid / batchResults.summary.total;
    result.recommendations = [`Processed ${batchResults.summary.total} inputs in batch`];

    return result;
  }

  /**
   * Run all examples and generate summary
   */
  async runAllExamples(): Promise<void> {
    console.log('🚀 LLM Error Prevention Examples');
    console.log('=' .repeat(60));
    console.log('This demonstrates how to prevent LLM errors through input validation and preprocessing.\n');

    const examples = [
      this.preventInvalidStructure(),
      this.improveContentQuality(),
      this.preventSecurityIssues(),
      this.preventPerformanceIssues(),
      this.comprehensiveErrorPrevention(),
      this.batchValidation()
    ];

    const results = await Promise.all(examples);

    console.log('\n📊 Summary Report');
    console.log('=' .repeat(60));

    let totalErrorsPrevented = 0;
    let totalWarnings = 0;
    let totalRecommendations = 0;
    let totalTimeSaved = 0;
    let averageQuality = 0;

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}:`);
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   🛡️ Errors Prevented: ${result.errorsPrevented}`);
      console.log(`   ⚠️ Warnings: ${result.warnings.length}`);
      console.log(`   💡 Recommendations: ${result.recommendations.length}`);
      console.log(`   ⏱️ Time Saved: ${result.timeSaved}ms`);
      console.log(`   📊 Quality: ${(result.inputQuality * 100).toFixed(1)}%`);

      totalErrorsPrevented += result.errorsPrevented;
      totalWarnings += result.warnings.length;
      totalRecommendations += result.recommendations.length;
      totalTimeSaved += result.timeSaved;
      averageQuality += result.inputQuality;
    });

    console.log('\n🎯 Overall Impact:');
    console.log(`   🛡️ Total Errors Prevented: ${totalErrorsPrevented}`);
    console.log(`   ⚠️ Total Warnings: ${totalWarnings}`);
    console.log(`   💡 Total Recommendations: ${totalRecommendations}`);
    console.log(`   ⏱️ Total Time Saved: ${totalTimeSaved}ms`);
    console.log(`   📊 Average Quality: ${((averageQuality / results.length) * 100).toFixed(1)}%`);

    console.log('\n💡 Key Benefits:');
    console.log('   • Catch errors before they reach the LLM');
    console.log('   • Improve input quality automatically');
    console.log('   • Prevent security and privacy issues');
    console.log('   • Optimize for cost and performance');
    console.log('   • Provide actionable recommendations');
    console.log('   • Save time and reduce failed calls');

    console.log('\n🔧 Usage in Production:');
    console.log('   • Integrate with existing LLM workflows');
    console.log('   • Use in pre-commit hooks for code generation');
    console.log('   • Apply to user-facing LLM applications');
    console.log('   • Monitor and improve over time');
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  const examples = new LLMErrorPreventionExamples();
  await examples.runAllExamples();
} 