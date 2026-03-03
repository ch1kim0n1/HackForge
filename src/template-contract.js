const fs = require('fs');
const path = require('path');

function validateTemplateShape(template, type) {
  const errors = [];

  if (!template || typeof template !== 'object') {
    errors.push('Template must be an object.');
    return { ok: false, errors };
  }

  const hasPackageJson = Boolean(template.packageJson);
  const hasRequirements = Boolean(template.requirements);
  const hasFiles = Boolean(template.files && typeof template.files === 'object' && Object.keys(template.files).length > 0);
  const fileKeys = template.files ? Object.keys(template.files) : [];
  const hasManifestInFiles = fileKeys.some(fileName => [
    'go.mod',
    'Cargo.toml',
    'pubspec.yaml',
    'pom.xml',
    'Gemfile',
    'mix.exs',
    'package.json',
    'requirements.txt'
  ].includes(fileName));

  if (!hasFiles) {
    errors.push('Template must contain a non-empty files object.');
  }

  const skipManifestRequirementTypes = new Set(['infrastructure', 'mobile']);

  if (!hasPackageJson && !hasRequirements && !hasManifestInFiles && !skipManifestRequirementTypes.has(type)) {
    errors.push('Template must provide packageJson or requirements unless infrastructure-only.');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function ensureExists(targetPath, label, errors) {
  if (!fs.existsSync(targetPath)) {
    errors.push(`Missing ${label}: ${targetPath}`);
  }
}

function readIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return '';
  }

  return fs.readFileSync(targetPath, 'utf8');
}

function hasKnownManifest(basePath) {
  const manifestNames = new Set([
    'package.json',
    'requirements.txt',
    'go.mod',
    'Cargo.toml',
    'pubspec.yaml',
    'pom.xml',
    'Gemfile',
    'mix.exs',
    'Podfile',
    'build.gradle',
    'build.gradle.kts'
  ]);

  const stack = [basePath];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isFile() && manifestNames.has(entry.name)) {
        return true;
      }

      if (entry.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }

  return false;
}

function containsAnyFile(basePath) {
  const stack = [basePath];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isFile()) {
        return true;
      }
      if (entry.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }

  return false;
}

function inferWebLayout(config) {
  const layout = config.folderStructure || 'separate';

  if (layout === 'monorepo') {
    return {
      frontendRel: 'apps/frontend',
      backendRel: 'apps/backend'
    };
  }

  if (layout === 'nested') {
    return {
      frontendRel: 'frontend',
      backendRel: 'frontend/backend'
    };
  }

  return {
    frontendRel: 'frontend',
    backendRel: 'backend'
  };
}

function validateWebApiContract(projectPath, config, errors) {
  const layout = inferWebLayout(config);
  const frontendPath = path.join(projectPath, layout.frontendRel);
  const backendPath = path.join(projectPath, layout.backendRel);

  const frontendCandidates = [
    path.join(frontendPath, 'src', 'App.js'),
    path.join(frontendPath, 'src', 'App.vue'),
    path.join(frontendPath, 'public', 'app.js'),
    path.join(frontendPath, 'src', 'app', 'app.component.ts'),
    path.join(frontendPath, 'src', 'App.svelte')
  ];

  const frontendSource = frontendCandidates.map(readIfExists).join('\n');
  if (!frontendSource.includes('/api/items')) {
    errors.push('Frontend does not reference /api/items endpoint.');
  }

  const backendCandidates = [
    path.join(backendPath, 'src', 'index.js'),
    path.join(backendPath, 'src', 'main.py'),
    path.join(backendPath, 'app.py'),
    path.join(backendPath, 'main.go'),
    path.join(backendPath, 'api', 'views.py'),
    path.join(backendPath, 'api', 'urls.py'),
    path.join(backendPath, 'config', 'urls.py')
  ];

  const backendSource = backendCandidates.map(readIfExists).join('\n');
  const exposesHealth = backendSource.includes('/api/health') || backendSource.includes("path('health'") || backendSource.includes('"/health"');
  if (!exposesHealth) {
    errors.push('Backend does not expose /api/health endpoint.');
  }

  const exposesItems = backendSource.includes('/api/items') || backendSource.includes("path('items'") || backendSource.includes('"/items"');
  if (!exposesItems) {
    errors.push('Backend does not expose /api/items endpoint.');
  }
}

function validateGeneratedProject(projectPath, config) {
  const errors = [];

  ensureExists(projectPath, 'project directory', errors);

  if (!config || !config.type) {
    errors.push('Missing config.type for generated project validation.');
    return { ok: false, errors };
  }

  if (config.type === 'web') {
    if (config.framework) {
      ensureExists(path.join(projectPath, 'package.json'), 'Next.js package.json', errors);
      const pageJs = readIfExists(path.join(projectPath, 'app', 'page.js'));
      const routeJs = readIfExists(path.join(projectPath, 'app', 'api', 'items', 'route.js'));

      if (!pageJs.includes('/api/items')) {
        errors.push('Next.js page does not reference /api/items.');
      }
      if (!routeJs.includes('GET') || !routeJs.includes('POST')) {
        errors.push('Next.js API route does not expose expected handlers.');
      }
    } else {
      const layout = inferWebLayout(config);
      const frontendPath = path.join(projectPath, layout.frontendRel);
      const backendPath = path.join(projectPath, layout.backendRel);

      ensureExists(frontendPath, 'frontend directory', errors);
      ensureExists(backendPath, 'backend directory', errors);
      ensureExists(path.join(frontendPath, 'package.json'), 'frontend package.json', errors);

      const hasBackendPackage = fs.existsSync(path.join(backendPath, 'package.json'));
      const hasBackendRequirements = fs.existsSync(path.join(backendPath, 'requirements.txt'));
      const hasBackendGoMod = fs.existsSync(path.join(backendPath, 'go.mod'));
      if (!hasBackendPackage && !hasBackendRequirements && !hasBackendGoMod) {
        errors.push('Backend is missing package.json, requirements.txt, or go.mod.');
      }

      validateWebApiContract(projectPath, config, errors);
    }
  } else {
    if (config.type === 'mobile') {
      if (!containsAnyFile(projectPath)) {
        errors.push('Generated mobile project is unexpectedly empty.');
      }
    } else if (config.type === 'infrastructure') {
      if (!containsAnyFile(projectPath)) {
        errors.push('Generated infrastructure project is unexpectedly empty.');
      }
    } else if (!hasKnownManifest(projectPath)) {
      errors.push('Generated project is missing a recognizable dependency manifest.');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTemplateShape,
  validateGeneratedProject
};
