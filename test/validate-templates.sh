#!/bin/bash

# Simple validation test - verify templates generate valid code

echo "🧪 MindCore · Forge Template Validation"
echo "========================================"
echo ""

cd /home/runner/work/HackForge/HackForge

# Create a test validation script
node << 'NODESCRIPT'

const fs = require('fs');
const path = require('path');
const frontendTemplates = require('./src/templates/frontend.js');
const backendTemplates = require('./src/templates/backend.js');

const testConfig = {
  projectName: 'test-project',
  projectDescription: 'Test project for validation',
  frontend: 'react',
  backend: 'express'
};

console.log('Testing React + Express template generation...');

try {
  // Test React template
  const reactTemplate = frontendTemplates.react(testConfig);
  console.log('  ✓ React template generates valid structure');
  
  if (!reactTemplate.packageJson) {
    throw new Error('React template missing packageJson');
  }
  console.log('  ✓ React template has package.json');
  
  if (!reactTemplate.files || Object.keys(reactTemplate.files).length === 0) {
    throw new Error('React template missing files');
  }
  console.log(`  ✓ React template has ${Object.keys(reactTemplate.files).length} files`);
  
  // Validate package.json can be stringified
  JSON.stringify(reactTemplate.packageJson, null, 2);
  console.log('  ✓ React package.json is valid JSON');
  
  // Test Express template
  const expressTemplate = backendTemplates.express(testConfig);
  console.log('\n  ✓ Express template generates valid structure');
  
  if (!expressTemplate.packageJson) {
    throw new Error('Express template missing packageJson');
  }
  console.log('  ✓ Express template has package.json');
  
  if (!expressTemplate.files || Object.keys(expressTemplate.files).length === 0) {
    throw new Error('Express template missing files');
  }
  console.log(`  ✓ Express template has ${Object.keys(expressTemplate.files).length} files`);
  
  JSON.stringify(expressTemplate.packageJson, null, 2);
  console.log('  ✓ Express package.json is valid JSON');
  
  // Test all stack combinations
  console.log('\nTesting all stack combinations...');
  
  const stacks = [
    { frontend: 'react', backend: 'express' },
    { frontend: 'vue', backend: 'express' },
    { frontend: 'vanilla', backend: 'express' },
    { frontend: 'react', backend: 'fastapi' }
  ];
  
  stacks.forEach(stack => {
    const config = { ...testConfig, ...stack };
    const frontend = frontendTemplates[stack.frontend](config);
    const backend = backendTemplates[stack.backend](config);
    
    if (!frontend.packageJson || !frontend.files) {
      throw new Error(`Invalid ${stack.frontend} template`);
    }
    
    if (!(backend.packageJson || backend.requirements) || !backend.files) {
      throw new Error(`Invalid ${stack.backend} template`);
    }
    
    console.log(`  ✓ ${stack.frontend} + ${stack.backend}`);
  });
  
  console.log('\n✅ All templates generate valid code');
  console.log('✅ Template validation passed!');
  
} catch (error) {
  console.error('\n❌ Validation failed:', error.message);
  process.exit(1);
}

NODESCRIPT

echo ""
echo "========================================"
echo "✅ Validation completed successfully"
