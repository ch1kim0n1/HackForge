#!/bin/bash

# Manual integration test for MindCore · Forge
# This script tests generating a project with each stack

set -e

# Get the directory of this script and set paths relative to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="/tmp/forge-integration-test"

echo "🧪 MindCore · Forge Integration Test"
echo "======================================"
echo ""

# Clean up any previous test
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "Test directory: $TEST_DIR"
echo ""

# Test 1: Generate a React + Express project
echo "Test 1: Generating React + Express project..."
echo ""

# We'll use a non-interactive approach by creating a test script
cat > "$TEST_DIR/test-generate.js" << EOF
const MindCoreForge = require('$FORGE_DIR/src/index.js');
const fs = require('fs');
const path = require('path');

class TestForge {
  async runTest() {
    console.log('Starting test generation...');
    
    // Mock the inquirer to provide test data
    const inquirer = require('inquirer');
    const originalPrompt = inquirer.prompt;
    
    inquirer.prompt = async () => {
      return {
        projectName: 'test-react-express',
        stack: 'react-express',
        projectDescription: 'Test React Express project'
      };
    };
    
    try {
      // Change to test directory
      process.chdir('/tmp/forge-integration-test');
      
      // Run forge
      await MindCoreForge.run();
      
      console.log('\n✅ Project generated successfully');
      
      // Verify structure
      const projectPath = path.join('/tmp/forge-integration-test', 'test-react-express');
      console.log('\nVerifying project structure...');
      
      const expectedFiles = [
        'README.md',
        '.gitignore',
        'run.sh',
        'frontend/package.json',
        'frontend/src/index.js',
        'frontend/src/App.js',
        'frontend/public/index.html',
        'backend/package.json',
        'backend/src/index.js'
      ];
      
      let allFilesExist = true;
      expectedFiles.forEach(file => {
        const filePath = path.join(projectPath, file);
        if (fs.existsSync(filePath)) {
          console.log(`  ✓ ${file}`);
        } else {
          console.log(`  ✗ ${file} NOT FOUND`);
          allFilesExist = false;
        }
      });
      
      if (!allFilesExist) {
        throw new Error('Some expected files are missing');
      }
      
      console.log('\n✅ All expected files exist');
      console.log('\n🎉 Integration test passed!');
      
      // Restore original prompt
      inquirer.prompt = originalPrompt;
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

const test = new TestForge();
test.runTest();
EOF

# Run the test
node "$TEST_DIR/test-generate.js"

echo ""
echo "======================================"
echo "✅ Integration test completed successfully"
