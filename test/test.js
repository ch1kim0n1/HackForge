const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const { generate } = require('../src/index');
const { STACKS } = require('../src/stacks');
const { validateGeneratedProject } = require('../src/template-contract');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hackforge-v2-'));
}

function cleanupTempRoot(rootPath) {
  if (fs.existsSync(rootPath)) {
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
}

async function withCwd(tempRoot, fn) {
  const prev = process.cwd();
  process.chdir(tempRoot);

  try {
    await fn();
  } finally {
    process.chdir(prev);
  }
}

async function testStackResolution() {
  console.log('Test 1: stack resolution (key + friendly name + invalid suggestion)');

  const root = createTempRoot();
  await withCwd(root, async () => {
    const byKey = await generate({
      projectName: 'resolve-key',
      stack: 'react-express',
      projectDescription: 'stack resolution key test',
      skipInstall: true,
      dryRun: true
    });

    const byName = await generate({
      projectName: 'resolve-name',
      stack: 'React + Express',
      projectDescription: 'stack resolution name test',
      skipInstall: true,
      dryRun: true
    });

    assert(byKey.stack === 'react-express', 'Expected key stack to resolve to react-express');
    assert(byName.stack === 'react-express', 'Expected friendly stack name to resolve to react-express');

    let failed = false;
    try {
      await generate({
        projectName: 'resolve-invalid',
        stack: 'react-expres',
        projectDescription: 'invalid stack test',
        skipInstall: true,
        dryRun: true
      });
    } catch (error) {
      failed = true;
      assert(error.message.includes('Did you mean:'), 'Expected unknown stack error with suggestions');
    }

    assert(failed, 'Expected invalid stack to fail');
  });
  cleanupTempRoot(root);

  console.log('  ✓ passed');
}

async function testGenerationMatrix() {
  console.log('Test 2: generation matrix across all stacks');

  const root = createTempRoot();
  await withCwd(root, async () => {
    const stackEntries = Object.entries(STACKS);

    for (const [stackKey, stackConfig] of stackEntries) {
      const projectName = `matrix-${stackKey}`;

      const result = await generate({
        projectName,
        stack: stackKey,
        projectDescription: `matrix test ${stackKey}`,
        skipInstall: true,
        folderStructure: 'separate',
        includeDocker: true,
        features: 'env,testing,cicd'
      });

      const validation = validateGeneratedProject(result.directory, {
        ...stackConfig,
        folderStructure: result.folderStructure,
        framework: stackConfig.framework,
        type: stackConfig.type
      });

      if (!validation.ok) {
        throw new Error(`Validation failed for ${stackKey}: ${validation.errors.join(' | ')}`);
      }
    }
  });

  cleanupTempRoot(root);
  console.log('  ✓ passed');
}

async function testWebOptionBehavior() {
  console.log('Test 3: web options behavior');

  const root = createTempRoot();
  await withCwd(root, async () => {
    const separate = await generate({
      projectName: 'web-separate',
      stack: 'react-express',
      projectDescription: 'separate layout test',
      skipInstall: true,
      folderStructure: 'separate',
      includeDocker: false,
      features: 'env,testing'
    });

    assert(fs.existsSync(path.join(separate.directory, 'frontend')), 'separate: missing frontend/');
    assert(fs.existsSync(path.join(separate.directory, 'backend')), 'separate: missing backend/');
    assert(!fs.existsSync(path.join(separate.directory, 'docker-compose.yml')), 'separate: docker-compose should be absent when includeDocker=false');

    const monorepo = await generate({
      projectName: 'web-monorepo',
      stack: 'react-fastapi',
      projectDescription: 'monorepo layout test',
      skipInstall: true,
      folderStructure: 'monorepo',
      includeDocker: true,
      features: 'env,testing,cicd'
    });

    assert(fs.existsSync(path.join(monorepo.directory, 'apps', 'frontend')), 'monorepo: missing apps/frontend');
    assert(fs.existsSync(path.join(monorepo.directory, 'apps', 'backend')), 'monorepo: missing apps/backend');
    assert(fs.existsSync(path.join(monorepo.directory, 'docker-compose.yml')), 'monorepo: missing docker-compose.yml');

    const nested = await generate({
      projectName: 'web-nested',
      stack: 'react-go',
      projectDescription: 'nested layout test',
      skipInstall: true,
      folderStructure: 'nested',
      includeDocker: true,
      features: 'env,testing,cicd'
    });

    assert(fs.existsSync(path.join(nested.directory, 'frontend')), 'nested: missing frontend/');
    assert(fs.existsSync(path.join(nested.directory, 'frontend', 'backend')), 'nested: missing frontend/backend');
    assert(fs.existsSync(path.join(nested.directory, 'docker-compose.yml')), 'nested: missing docker-compose.yml');
  });

  cleanupTempRoot(root);
  console.log('  ✓ passed');
}

async function testFeatureToggles() {
  console.log('Test 4: feature toggle outputs');

  const root = createTempRoot();
  await withCwd(root, async () => {
    const full = await generate({
      projectName: 'features-full',
      stack: 'react-express',
      projectDescription: 'full features test',
      skipInstall: true,
      features: 'auth,database,api-docs,testing,cicd,env'
    });

    assert(fs.existsSync(path.join(full.directory, '.env.example')), 'full: missing root .env.example');
    assert(fs.existsSync(path.join(full.directory, '.github', 'workflows', 'ci.yml')), 'full: missing CI workflow');
    assert(fs.existsSync(path.join(full.directory, 'backend', 'db', 'init.sql')), 'full: missing database scaffold');
    assert(fs.existsSync(path.join(full.directory, 'backend', 'docs', 'openapi.yaml')), 'full: missing API docs scaffold');
    assert(fs.existsSync(path.join(full.directory, 'frontend', 'tests', 'api-contract.md')), 'full: missing frontend test scaffold');

    const minimal = await generate({
      projectName: 'features-minimal',
      stack: 'react-express',
      projectDescription: 'minimal features test',
      skipInstall: true,
      features: 'env'
    });

    assert(fs.existsSync(path.join(minimal.directory, '.env.example')), 'minimal: missing env scaffold');
    assert(!fs.existsSync(path.join(minimal.directory, '.github', 'workflows', 'ci.yml')), 'minimal: CI workflow should not exist');
    assert(!fs.existsSync(path.join(minimal.directory, 'backend', 'docs', 'openapi.yaml')), 'minimal: API docs should not exist');
  });

  cleanupTempRoot(root);
  console.log('  ✓ passed');
}

function testDocsCommands() {
  console.log('Test 5: docs command validation');

  const repoRoot = path.resolve(__dirname, '..');
  const tempRoot = createTempRoot();

  try {
    const commands = [
      'node bin/forge.js --list-stacks',
      'node bin/forge.js --name docs-key --stack react-express --description "docs test" --dry-run',
      'node bin/forge.js --name docs-friendly --stack "React + Express" --description "docs test" --dry-run',
      'node bin/forge.js --name docs-json --stack spring-boot --description "docs test" --json --dry-run',
      'node bin/forge.js --name docs-web --stack react-fastapi --folder-structure monorepo --features env,testing,cicd --no-docker --dry-run'
    ];

    commands.forEach(command => {
      execSync(command, {
        cwd: repoRoot,
        stdio: 'pipe',
        env: { ...process.env, TMPDIR: tempRoot }
      });
    });
  } finally {
    cleanupTempRoot(tempRoot);
  }

  console.log('  ✓ passed');
}

async function run() {
  console.log('Testing MindCore · Forge v2\n');

  await testStackResolution();
  await testGenerationMatrix();
  await testWebOptionBehavior();
  await testFeatureToggles();
  testDocsCommands();

  console.log('\nAll tests passed.');
}

run().catch(error => {
  console.error('\nTest failure:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
