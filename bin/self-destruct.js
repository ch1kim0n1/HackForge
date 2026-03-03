#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function isRootPath(targetPath) {
  const resolved = path.resolve(targetPath);
  const parsed = path.parse(resolved);
  return resolved === parsed.root;
}

function safeRealPath(targetPath) {
  try {
    return fs.realpathSync(targetPath);
  } catch (error) {
    return null;
  }
}

function validateDeletionTarget(targetPath) {
  const expectedRepoRoot = safeRealPath(path.resolve(__dirname, '..'));
  const resolvedTarget = safeRealPath(path.resolve(targetPath || ''));

  if (!expectedRepoRoot || !resolvedTarget || resolvedTarget !== expectedRepoRoot) {
    throw new Error('Refusing deletion: target path does not match current HackForge repository path.');
  }

  if (isRootPath(resolvedTarget)) {
    throw new Error('Refusing deletion: target path is filesystem root.');
  }

  const targetStat = fs.lstatSync(resolvedTarget);
  if (!targetStat.isDirectory() || targetStat.isSymbolicLink()) {
    throw new Error('Refusing deletion: target must be a real directory.');
  }

  if (path.basename(resolvedTarget).toLowerCase() !== 'hackforge') {
    throw new Error('Refusing deletion: target folder is not named HackForge.');
  }

  const markerPath = path.join(resolvedTarget, '.hackforge-root');
  if (!fs.existsSync(markerPath)) {
    throw new Error('Refusing deletion: safety marker file is missing.');
  }
  const markerContent = fs.readFileSync(markerPath, 'utf8').trim();
  if (markerContent !== 'hackforge-root-marker-v1') {
    throw new Error('Refusing deletion: marker content mismatch.');
  }

  const packageJsonPath = path.join(resolvedTarget, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Refusing deletion: package.json is missing.');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.name !== '@mindcore/forge') {
    throw new Error('Refusing deletion: package identity mismatch.');
  }

  const forgeEntrypoint = path.join(resolvedTarget, 'bin', 'forge.js');
  if (!fs.existsSync(forgeEntrypoint)) {
    throw new Error('Refusing deletion: forge entrypoint missing.');
  }

  const selfDestructPath = path.join(resolvedTarget, 'bin', 'self-destruct.js');
  const currentScriptPath = safeRealPath(__filename);
  const expectedSelfDestructPath = safeRealPath(selfDestructPath);
  if (!currentScriptPath || !expectedSelfDestructPath || currentScriptPath !== expectedSelfDestructPath) {
    throw new Error('Refusing deletion: self-destruct script identity mismatch.');
  }

  return resolvedTarget;
}

async function main() {
  try {
    const targetPath = validateDeletionTarget(process.argv[2]);

    // Delay allows the current parent process to exit cleanly first.
    await new Promise(resolve => setTimeout(resolve, 2000));

    fs.rmSync(targetPath, { recursive: true, force: false, maxRetries: 3, retryDelay: 250 });
  } catch (error) {
    // Silent failure by design; self-destruct must not remove anything uncertain.
    process.exit(0);
  }
}

main();
