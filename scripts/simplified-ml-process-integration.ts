#!/usr/bin/env bun

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

interface SimplifiedTaskStatus {
  taskId: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastRun: string;
  successRate: number;
  averageDuration: number;
  recommendations: string[];
}

interface SimplifiedMLProcessSnapshot {
  source: 'ml_process_integration',
  created_by: 'process',
  status: 'completed',
  tag_summary: 'task_monitoring',
  topic: 'ml_process',
  subtopic: 'simplified_integration',
  timestamp: string,
  tasks: SimplifiedTaskStatus[],
  summary: {
    total_tasks: number,
    healthy_tasks: number,
    warning_tasks: number,
    critical_tasks: number,
    overall_health: 'healthy' | 'warning' | 'critical'
  },
  metadata: {
    implementation: 'simplified_ml_process',
    version: '2.0.0',
    integration_type: 'analyzeTaskStatus_streamlined'
  }
}

class SimplifiedMLProcessIntegration {
  private testMonitoringDataFile = 'fossils/monitoring/test_monitoring_data.json';
  private performanceDataFile = 'fossils/performance/performance_data.json';
  private outputFile = 'fossils/monitoring/ml.task.monitoring.simplified.json';

  async generateSimplifiedSnapshot(): Promise<void> {
    console.log('🔧 Generating Simplified ML Process Snapshot...');
    console.log('📋 Streamlining analyzeTaskStatus integration without bloated management\n');

    try {
      // Load monitoring data
      const testMonitoringData = await this.loadTestMonitoringData();
      const performanceData = await this.loadPerformanceData();

      // Generate simplified task status
      const tasks = this.generateSimplifiedTaskStatus(testMonitoringData, performanceData);

      // Create simplified snapshot
      const snapshot = this.createSimplifiedSnapshot(tasks);

      // Save snapshot
      await writeFile(this.outputFile, JSON.stringify(snapshot, null, 2));

      console.log(`✅ Simplified ML Process Snapshot: ${this.outputFile}`);
      console.log(`📊 Tasks analyzed: ${tasks.length}`);
      console.log(`🏥 Overall health: ${snapshot.summary.overall_health}`);
      console.log('🎯 Simplified ML process integration successful!');

    } catch (error) {
      console.error('❌ Error generating simplified snapshot:', error);
    }
  }

  private async loadTestMonitoringData(): Promise<any> {
    if (!existsSync(this.testMonitoringDataFile)) {
      console.log(`⚠️  Test monitoring data not found: ${this.testMonitoringDataFile}`);
      return null;
    }

    const content = await readFile(this.testMonitoringDataFile, 'utf-8');
    return JSON.parse(content);
  }

  private async loadPerformanceData(): Promise<any[]> {
    if (!existsSync(this.performanceDataFile)) {
      console.log(`⚠️  Performance data not found: ${this.performanceDataFile}`);
      return [];
    }

    const content = await readFile(this.performanceDataFile, 'utf-8');
    return JSON.parse(content);
  }

  private generateSimplifiedTaskStatus(testData: any, performanceData: any): SimplifiedTaskStatus[] {
    const tasks = new Map<string, SimplifiedTaskStatus>();

    // Process test monitoring data (simplified structure)
    if (testData && testData.test_results) {
      for (const testResult of testData.test_results) {
        const taskId = testResult.test_name;
        
        if (!tasks.has(taskId)) {
          tasks.set(taskId, {
            taskId,
            name: testResult.test_name,
            status: 'unknown',
            lastRun: new Date().toISOString(),
            successRate: 0,
            averageDuration: 0,
            recommendations: []
          });
        }
        
        const task = tasks.get(taskId)!;
        const duration = testResult.duration_ms || 0;
        
        // Update metrics (simplified)
        if (testResult.status === 'passed') {
          task.successRate += 1;
          task.averageDuration = (task.averageDuration + duration) / 2;
        } else {
          task.successRate -= 1;
        }
      }
    }

    // Process performance data (handle array or single object)
    let perfLogs: any[] = [];
    if (Array.isArray(performanceData)) {
      perfLogs = performanceData;
    } else if (performanceData && typeof performanceData === 'object') {
      perfLogs = [performanceData];
    }
    for (const log of perfLogs) {
      const taskId = log.script;
      
      if (!tasks.has(taskId)) {
        tasks.set(taskId, {
          taskId,
          name: log.script,
          status: 'unknown',
          lastRun: log.timestamp,
          successRate: 0,
          averageDuration: 0,
          recommendations: []
        });
      }
      
      const task = tasks.get(taskId)!;
      
      if (log.exit_code === 0 || log.success) {
        task.successRate += 1;
      } else {
        task.successRate -= 1;
      }
      
      task.averageDuration = (task.averageDuration + (log.execution_time || 0)) / 2;
      
      if (log.timestamp > task.lastRun) {
        task.lastRun = log.timestamp;
      }
    }

    // Calculate simplified status and recommendations
    for (const task of tasks.values()) {
      // Simplified status calculation
      if (task.successRate > 0.8) {
        task.status = 'healthy';
      } else if (task.successRate > 0.5) {
        task.status = 'warning';
      } else {
        task.status = 'critical';
      }
      
      // Simplified recommendations
      if (task.averageDuration > 5000) {
        task.recommendations.push('Consider optimizing performance');
      }
      if (task.successRate < 0.8) {
        task.recommendations.push('Investigate reliability issues');
      }
    }

    return Array.from(tasks.values());
  }

  private createSimplifiedSnapshot(tasks: SimplifiedTaskStatus[]): SimplifiedMLProcessSnapshot {
    const healthyTasks = tasks.filter(t => t.status === 'healthy').length;
    const warningTasks = tasks.filter(t => t.status === 'warning').length;
    const criticalTasks = tasks.filter(t => t.status === 'critical').length;

    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalTasks > 0) {
      overallHealth = 'critical';
    } else if (warningTasks > 0) {
      overallHealth = 'warning';
    }

    return {
      source: 'ml_process_integration',
      created_by: 'process',
      status: 'completed',
      tag_summary: 'task_monitoring',
      topic: 'ml_process',
      subtopic: 'simplified_integration',
      timestamp: new Date().toISOString(),
      tasks,
      summary: {
        total_tasks: tasks.length,
        healthy_tasks: healthyTasks,
        warning_tasks: warningTasks,
        critical_tasks: criticalTasks,
        overall_health: overallHealth
      },
      metadata: {
        implementation: 'simplified_ml_process',
        version: '2.0.0',
        integration_type: 'analyzeTaskStatus_streamlined'
      }
    };
  }
}

async function main() {
  const integration = new SimplifiedMLProcessIntegration();
  await integration.generateSimplifiedSnapshot();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SimplifiedMLProcessIntegration }; 