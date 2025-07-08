#!/usr/bin/env bun

/**
 * Memory Monitoring Demo
 * 
 * This script demonstrates how to use the memory monitoring system
 * to protect your Mac's 8GB RAM from runaway processes.
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Simulate a memory-intensive process
function createMemoryIntensiveProcess() {
  console.log('🚀 Creating memory-intensive process...');
  
  // This will consume memory over time
  const memoryHog = spawn('node', ['-e', `
    console.log('Starting memory-intensive process...');
    const arrays = [];
    let i = 0;
    
    setInterval(() => {
      // Allocate 10MB every second
      arrays.push(new Array(2.5 * 1024 * 1024).fill('x'));
      console.log(\`Allocated \${arrays.length * 10}MB\`);
      
      if (i++ > 30) {
        console.log('Process completed normally');
        process.exit(0);
      }
    }, 1000);
  `], {
    stdio: 'inherit'
  });
  
  return memoryHog;
}

// Demo the memory monitoring system
async function demoMemoryMonitoring() {
  console.log('🔍 Memory Monitoring Demo');
  console.log('========================\n');
  
  console.log('1. Starting memory-intensive process...');
  const process = createMemoryIntensiveProcess();
  
  console.log('2. Process started with PID:', process.pid);
  console.log('3. This process will allocate ~10MB every second');
  console.log('4. The memory monitor should kill it when it exceeds the threshold\n');
  
  // Wait a bit to show the process running
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('5. Process has been running for 5 seconds');
  console.log('6. Check the memory monitor logs in fossils/memory-monitor.log');
  console.log('7. The process should be killed if it exceeds the memory threshold\n');
  
  // Wait for process to complete or be killed
  await new Promise<void>((resolve) => {
    process.on('exit', (code, signal) => {
      console.log('8. Process exited with code:', code, 'signal:', signal);
      if (signal) {
        console.log('✅ Process was killed by memory monitor (as expected)');
      } else {
        console.log('✅ Process completed normally');
      }
      resolve();
    });
  });
  
  console.log('\n🎉 Demo completed!');
  console.log('\nTo run this demo with memory monitoring:');
  console.log('./scripts/monitoring/memory-monitor.sh -t 50 -v bun run examples/memory-monitoring-demo.ts');
}

// Show system memory info
function showSystemMemory() {
  console.log('💾 Current System Memory Info:');
  
  const memUsage = process.memoryUsage();
  console.log('  Current process:');
  console.log(`    Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  console.log(`    Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
  console.log(`    RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
  
  // Try to get system memory info
  try {
    const vmstat = spawn('vm_stat');
    let output = '';
    
    vmstat.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    vmstat.on('close', () => {
      const lines = output.split('\n');
      const stats: Record<string, number> = {};
      
      lines.forEach(line => {
        const match = line.match(/^(.+?):\s+(\d+)/);
        if (match) {
          stats[match[1].trim()] = parseInt(match[2]);
        }
      });
      
      if (stats['Pages free']) {
        const pageSize = 4096;
        const freeMB = Math.round(stats['Pages free'] * pageSize / 1024 / 1024);
        const totalMB = Math.round((stats['Pages wired down'] + stats['Pages active'] + stats['Pages inactive'] + stats['Pages free']) * pageSize / 1024 / 1024);
        
        console.log('  System:');
        console.log(`    Total: ${totalMB}MB`);
        console.log(`    Free: ${freeMB}MB`);
        console.log(`    Used: ${totalMB - freeMB}MB`);
      }
    });
  } catch (error) {
    console.log('  System memory info not available');
  }
}

// Main execution
async function main() {
  console.log('🔍 Memory Monitoring System Demo\n');
  
  showSystemMemory();
  console.log('');
  
  await demoMemoryMonitoring();
}

// Run the demo
if (import.meta.main) {
  main().catch(console.error);
} 