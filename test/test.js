const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing MindCore · Forge\n');

// Test 1: Check if all required files exist
console.log('Test 1: Checking required files...');
const requiredFiles = [
  'package.json',
  'bin/forge.js',
  'src/index.js',
  'src/stacks.js',
  'src/templates.js',
  'src/templates/frontend.js',
  'src/templates/backend.js',
  'src/templates/webextended.js',
  'src/templates/backendextended.js',
  'src/templates/mobile.js',
  'src/templates/cli.js',
  'src/templates/infrastructure.js',
  'src/templates/datascience.js',
  'src/templates/game.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} NOT FOUND`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing!');
  process.exit(1);
}

console.log('\n✅ All required files exist\n');

// Test 2: Check if templates can be loaded
console.log('Test 2: Checking if templates load...');
try {
  const templates = require('../src/templates');
  console.log('  ✓ Templates module loaded');

  const frontendTemplates = require('../src/templates/frontend');
  console.log('  ✓ Frontend templates loaded');

  const backendTemplates = require('../src/templates/backend');
  console.log('  ✓ Backend templates loaded');

  console.log('\n✅ All templates load successfully\n');
} catch (error) {
  console.error('  ✗ Error loading templates:', error.message);
  console.error('\n❌ Template loading failed!');
  process.exit(1);
}

// Test 3: Check if bin script is executable
console.log('Test 3: Checking if forge script is executable...');
const forgeScript = path.join(__dirname, '..', 'bin/forge.js');
try {
  const stats = fs.statSync(forgeScript);
  const isExecutable = (stats.mode & 0o111) !== 0;
  if (isExecutable) {
    console.log('  ✓ forge.js is executable');
  } else {
    console.log('  ⚠ forge.js is not executable (this may be OK on Windows)');
  }
  console.log('\n✅ Forge script check passed\n');
} catch (error) {
  console.error('  ✗ Error checking forge script:', error.message);
  process.exit(1);
}

// Test 4: Verify template structure
console.log('Test 4: Verifying template structure...');
try {
  const templates = require('../src/templates');
  const frontendTemplates = require('../src/templates/frontend');
  const backendTemplates = require('../src/templates/backend');

  // Check frontend templates
  const frontendTypes = ['react', 'vue', 'vanilla'];
  frontendTypes.forEach(type => {
    if (typeof frontendTemplates[type] === 'function') {
      console.log(`  ✓ Frontend template '${type}' exists`);
      const template = frontendTemplates[type]({ projectName: 'test', backend: 'express', projectDescription: 'test' });
      if (template.packageJson && template.files) {
        console.log(`    ✓ Template '${type}' has valid structure`);
      } else {
        throw new Error(`Template '${type}' has invalid structure`);
      }
    } else {
      throw new Error(`Frontend template '${type}' not found`);
    }
  });

  // Check backend templates
  const backendTypes = ['express', 'fastapi'];
  backendTypes.forEach(type => {
    if (typeof backendTemplates[type] === 'function') {
      console.log(`  ✓ Backend template '${type}' exists`);
      const template = backendTemplates[type]({ projectName: 'test', frontend: 'react', projectDescription: 'test' });
      if (template.packageJson || template.requirements) {
        console.log(`    ✓ Template '${type}' has valid structure`);
      } else {
        throw new Error(`Template '${type}' has invalid structure`);
      }
    } else {
      throw new Error(`Backend template '${type}' not found`);
    }
  });

  console.log('\n✅ All templates have valid structure\n');
} catch (error) {
  console.error('  ✗ Error verifying templates:', error.message);
  console.error('\n❌ Template verification failed!');
  process.exit(1);
}

console.log('🎉 All tests passed!\n');
console.log('MindCore · Forge is ready to use.');
console.log('Run: node bin/forge.js\n');
