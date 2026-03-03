const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const templates = require('./templates');
const {
  STACKS,
  getStacksByCategory,
  resolveStackInput,
  getStackSuggestions
} = require('./stacks');
const { suggestStack } = require('./ml/recommender');
const { enrichProject } = require('./ml/enricher');
const { validateTemplateShape, validateGeneratedProject } = require('./template-contract');

const DEFAULT_WEB_FEATURES = ['env', 'testing', 'cicd'];
const WEB_FEATURE_CHOICES = [
  { name: 'Authentication (JWT/Sessions scaffold)', value: 'auth' },
  { name: 'Database init scaffold', value: 'database' },
  { name: 'API docs scaffold (OpenAPI file)', value: 'api-docs' },
  { name: 'Testing scaffold', value: 'testing' },
  { name: 'CI/CD workflow', value: 'cicd' },
  { name: 'Environment files (.env.example)', value: 'env' }
];

function assertProjectName(projectName) {
  if (!/^[a-z0-9-]+$/.test(projectName)) {
    throw new Error('Project name must be lowercase alphanumeric with hyphens only');
  }

  if (projectName.includes('..') || projectName.includes('/') || projectName.includes('\\')) {
    throw new Error('Project name cannot contain paths or forbidden characters');
  }
}

function unique(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function resolveFeatureList(value) {
  if (Array.isArray(value)) {
    return unique(value);
  }

  if (typeof value === 'string') {
    return unique(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    );
  }

  return [];
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function upsertFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

function ensurePackageDependencies(pkgPath, dependencies = {}, devDependencies = {}) {
  const pkg = readJsonIfExists(pkgPath);
  if (!pkg) {
    return false;
  }

  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.scripts = pkg.scripts || {};

  Object.entries(dependencies).forEach(([name, version]) => {
    if (!pkg.dependencies[name]) {
      pkg.dependencies[name] = version;
    }
  });

  Object.entries(devDependencies).forEach(([name, version]) => {
    if (!pkg.devDependencies[name]) {
      pkg.devDependencies[name] = version;
    }
  });

  writeJson(pkgPath, pkg);
  return true;
}

function ensurePackageScripts(pkgPath, scripts = {}) {
  const pkg = readJsonIfExists(pkgPath);
  if (!pkg) {
    return false;
  }

  pkg.scripts = pkg.scripts || {};
  Object.entries(scripts).forEach(([name, command]) => {
    if (!pkg.scripts[name]) {
      pkg.scripts[name] = command;
    }
  });

  writeJson(pkgPath, pkg);
  return true;
}

function ensureRequirementLines(requirementsPath, lines = []) {
  if (!fs.existsSync(requirementsPath)) {
    return;
  }

  const current = fs.readFileSync(requirementsPath, 'utf8');
  const existing = new Set(
    current
      .split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(Boolean)
      .map(line => line.split('==')[0])
  );

  const additions = lines.filter(line => {
    const name = line.trim().toLowerCase().split('==')[0];
    return !existing.has(name);
  });

  if (additions.length > 0) {
    const suffix = current.endsWith('\n') ? '' : '\n';
    fs.writeFileSync(requirementsPath, `${current}${suffix}${additions.join('\n')}\n`);
  }
}

function appendIfMissing(filePath, snippet) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const current = fs.readFileSync(filePath, 'utf8');
  if (current.includes(snippet.trim())) {
    return false;
  }

  fs.writeFileSync(filePath, `${current}\n${snippet}\n`);
  return true;
}

function insertAfter(source, anchor, snippet) {
  if (source.includes(snippet.trim())) {
    return source;
  }

  const index = source.indexOf(anchor);
  if (index === -1) {
    return source;
  }

  const insertAt = index + anchor.length;
  return `${source.slice(0, insertAt)}\n${snippet}\n${source.slice(insertAt)}`;
}

function insertBefore(source, anchor, snippet) {
  if (source.includes(snippet.trim())) {
    return source;
  }

  const index = source.indexOf(anchor);
  if (index === -1) {
    return source;
  }

  return `${source.slice(0, index)}\n${snippet}\n${source.slice(index)}`;
}

function ensureExecutable(filePath) {
  if (process.platform === 'win32') {
    return;
  }

  try {
    fs.chmodSync(filePath, '755');
  } catch (error) {
    // Ignore chmod failures on restricted filesystems.
  }
}

function resolveOutputDir(outputDir) {
  if (typeof outputDir === 'string' && outputDir.trim().length > 0) {
    return path.resolve(outputDir.trim());
  }

  return process.cwd();
}

class MindCoreForge {
  constructor() {
    this.projectPath = null;
    this.config = null;
  }

  getTargetBaseDir() {
    return resolveOutputDir(this.config.outputDir);
  }

  getTargetProjectPath() {
    return path.join(this.getTargetBaseDir(), this.config.projectName);
  }

  async run(flags = {}) {
    try {
      console.log(chalk.cyan.bold('\n🔨 MindCore · Forge v2'));
      console.log(chalk.gray('All-in-one hackathon starter\n'));

      this.config = await this.getConfiguration(flags);

      if (flags.skipInstall) {
        this.config.skipInstall = true;
      }

      this.validateConfig();
      await this.createProjectStructure();
      await this.generateProject();
      await this.applyWebScaffolds();
      await this.generateRootFiles();
      this.validateGeneratedOutput();
      await this.installDependencies();
      this.printSuccessMessage();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message || error);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async getConfiguration(flags = {}) {
    const stacksByCategory = getStacksByCategory();
    const choices = [];

    Object.entries(stacksByCategory).forEach(([category, stacks]) => {
      choices.push(new inquirer.Separator(`\n=== ${category} ===`));
      stacks.forEach(stack => {
        choices.push({
          name: `${stack.name} (${stack.key}) - ${stack.description}`,
          value: stack.key,
          short: stack.name
        });
      });
    });

    let smartDescription = '';
    let recommendedKeys = [];

    if (flags.smart) {
      console.log(chalk.magenta('🧠 Smart Mode: analyzing requirements...'));
      const smartAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: 'Describe your hackathon idea:',
          validate: input => (input.length > 5 ? true : 'Please provide more detail.')
        }
      ]);

      smartDescription = smartAnswers.description;
      recommendedKeys = await suggestStack(smartDescription);

      if (recommendedKeys.length > 0) {
        console.log(chalk.green(`✓ AI suggests: ${recommendedKeys.join(', ')}`));
      }
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-hackathon-project',
        validate: input => (/^[a-z0-9-]+$/.test(input) ? true : 'Project name must be lowercase alphanumeric with hyphens only')
      },
      {
        type: 'list',
        name: 'stackKey',
        message: 'Choose your stack:',
        choices,
        pageSize: 18,
        default: recommendedKeys[0]
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: 'Brief project description:',
        default: smartDescription || 'A hackathon project'
      }
    ]);

    const resolved = resolveStackInput(answers.stackKey);
    if (!resolved) {
      throw new Error(`Unknown stack selected: ${answers.stackKey}`);
    }

    const config = {
      projectName: answers.projectName,
      projectDescription: answers.projectDescription,
      stack: resolved.key,
      ...resolved.config,
      skipInstall: false,
      outputDir: resolveOutputDir(flags.outputDir),
      folderStructure: 'separate',
      includeDocker: true,
      features: DEFAULT_WEB_FEATURES.slice()
    };

    if (smartDescription) {
      try {
        const enriched = await enrichProject(config.projectName, smartDescription);
        config.projectDescription = enriched.description || config.projectDescription;
        config.enrichedFeatures = enriched.features || [];
        console.log(chalk.green('✓ Project description enriched with AI'));
      } catch (error) {
        console.log(chalk.yellow('⚠ AI enrichment unavailable, using provided description.'));
      }
    }

    if (config.type === 'web' && !config.framework) {
      const webAnswers = await inquirer.prompt([
        {
          type: 'list',
          name: 'folderStructure',
          message: 'Folder structure:',
          choices: [
            { name: 'Separate folders (frontend/ + backend/)', value: 'separate' },
            { name: 'Monorepo apps folders (apps/frontend + apps/backend)', value: 'monorepo' },
            { name: 'Nested backend (frontend/backend)', value: 'nested' }
          ],
          default: 'separate'
        },
        {
          type: 'confirm',
          name: 'includeDocker',
          message: 'Include Docker assets?',
          default: true
        },
        {
          type: 'checkbox',
          name: 'features',
          message: 'Select additional features:',
          choices: WEB_FEATURE_CHOICES,
          default: DEFAULT_WEB_FEATURES
        }
      ]);

      config.folderStructure = webAnswers.folderStructure;
      config.includeDocker = webAnswers.includeDocker;
      config.features = unique(webAnswers.features);
    }

    return config;
  }

  validateConfig() {
    console.log(chalk.yellow('⚡ Validating configuration...'));

    assertProjectName(this.config.projectName);

    if (!this.config.type) {
      throw new Error('Invalid stack configuration: missing type.');
    }

    const targetPath = this.getTargetProjectPath();
    if (fs.existsSync(targetPath)) {
      throw new Error(`Directory '${this.config.projectName}' already exists.`);
    }

    console.log(chalk.green('✓ Configuration valid'));
  }

  getWebLayout() {
    const mode = this.config.folderStructure || 'separate';

    if (mode === 'monorepo') {
      return {
        mode,
        frontendRel: 'apps/frontend',
        backendRel: 'apps/backend'
      };
    }

    if (mode === 'nested') {
      return {
        mode,
        frontendRel: 'frontend',
        backendRel: 'frontend/backend'
      };
    }

    return {
      mode: 'separate',
      frontendRel: 'frontend',
      backendRel: 'backend'
    };
  }

  async createProjectStructure() {
    console.log(chalk.yellow('📁 Creating project structure...'));

    this.projectPath = this.getTargetProjectPath();
    fs.mkdirSync(this.projectPath, { recursive: true });

    if (this.config.type === 'web' && !this.config.framework) {
      const layout = this.getWebLayout();
      fs.mkdirSync(path.join(this.projectPath, layout.frontendRel), { recursive: true });
      fs.mkdirSync(path.join(this.projectPath, layout.backendRel), { recursive: true });
    }

    console.log(chalk.green('✓ Project structure created'));
  }

  validateAndWriteTemplate(basePath, template, templateType) {
    const validation = validateTemplateShape(template, templateType);
    if (!validation.ok) {
      throw new Error(`Template validation failed (${templateType}): ${validation.errors.join('; ')}`);
    }

    if (template.packageJson) {
      writeJson(path.join(basePath, 'package.json'), template.packageJson);
    }

    if (template.requirements) {
      upsertFile(path.join(basePath, 'requirements.txt'), template.requirements);
    }

    if (template.files) {
      Object.entries(template.files).forEach(([relativeFile, content]) => {
        upsertFile(path.join(basePath, relativeFile), content);
      });
    }
  }

  async generateProject() {
    const { type } = this.config;

    if (type === 'web') {
      await this.generateWebProject();
      return;
    }

    await this.generateSingleTemplateProject();
  }

  async generateWebProject() {
    if (this.config.framework) {
      console.log(chalk.yellow('🌐 Generating fullstack project...'));
      const template = templates.getFullstackTemplate(this.config.framework, this.config);
      this.validateAndWriteTemplate(this.projectPath, template, 'web');
      console.log(chalk.green('✓ Fullstack project generated'));
      return;
    }

    const layout = this.getWebLayout();
    const frontendPath = path.join(this.projectPath, layout.frontendRel);
    const backendPath = path.join(this.projectPath, layout.backendRel);

    console.log(chalk.yellow('⚛️  Generating frontend...'));
    const frontendTemplate = templates.getFrontendTemplate(this.config.frontend, this.config);
    this.validateAndWriteTemplate(frontendPath, frontendTemplate, 'web-frontend');
    console.log(chalk.green('✓ Frontend generated'));

    console.log(chalk.yellow('🔧 Generating backend...'));
    const backendTemplate = templates.getBackendTemplate(this.config.backend, this.config);
    this.validateAndWriteTemplate(backendPath, backendTemplate, 'web-backend');
    console.log(chalk.green('✓ Backend generated'));
  }

  async generateSingleTemplateProject() {
    const { type, framework } = this.config;
    console.log(chalk.yellow(`📦 Generating ${type} project...`));

    let template;
    switch (type) {
      case 'mobile':
        template = templates.getMobileTemplate(framework, this.config);
        break;
      case 'cli':
      case 'desktop':
        template = templates.getCLITemplate(framework, this.config);
        break;
      case 'infrastructure':
        template = templates.getInfrastructureTemplate(framework, this.config);
        break;
      case 'datascience':
        template = templates.getDataScienceTemplate(framework, this.config);
        break;
      case 'game':
        template = templates.getGameTemplate(framework, this.config);
        break;
      case 'backend':
        template = templates.getBackendTemplate(framework, this.config);
        break;
      default:
        throw new Error(`Unsupported project type: ${type}`);
    }

    this.validateAndWriteTemplate(this.projectPath, template, type);
    console.log(chalk.green(`✓ ${type} project generated`));
  }

  async applyWebScaffolds() {
    if (this.config.type !== 'web') {
      return;
    }

    if (this.config.framework) {
      this.applyNextJsScaffolds();
      return;
    }

    const layout = this.getWebLayout();
    const frontendPath = path.join(this.projectPath, layout.frontendRel);
    const backendPath = path.join(this.projectPath, layout.backendRel);

    this.ensureBaselineEnvFiles(frontendPath, backendPath);
    this.ensureBaselineLintScripts(frontendPath, backendPath);
    this.ensureBaselineSmokeTests(frontendPath, backendPath);
    this.ensureProductionHardening(frontendPath, backendPath);

    const features = unique(this.config.features);

    if (features.includes('auth')) {
      this.applyAuthScaffold(frontendPath, backendPath);
    }

    if (features.includes('database')) {
      this.applyDatabaseScaffold(backendPath);
    }

    if (features.includes('api-docs')) {
      this.applyApiDocsScaffold(backendPath);
    }

    if (features.includes('testing')) {
      this.applyTestingFeature(frontendPath, backendPath);
    }
  }

  applyNextJsScaffolds() {
    upsertFile(path.join(this.projectPath, '.env.example'), 'NEXT_PUBLIC_API_BASE_URL=http://localhost:3000\n');

    const pkgPath = path.join(this.projectPath, 'package.json');
    const pkg = readJsonIfExists(pkgPath);
    if (pkg) {
      pkg.scripts = pkg.scripts || {};
      if (!pkg.scripts.lint) {
        pkg.scripts.lint = 'next lint --no-lint';
      }
      if (!pkg.scripts.test) {
        pkg.scripts.test = 'node -e "console.log(\'No tests configured yet\')"';
      }
      writeJson(pkgPath, pkg);
    }

    upsertFile(
      path.join(this.projectPath, 'tests', 'api-smoke.md'),
      '# API Smoke\n\n- GET /api/health\n- GET /api/items\n- POST /api/items\n- PUT /api/items/:id\n- DELETE /api/items/:id\n'
    );
  }

  ensureBaselineEnvFiles(frontendPath, backendPath) {
    const backendPort = this.config.backend === 'fastapi' ? 8000 : 5000;

    upsertFile(path.join(this.projectPath, '.env.example'), `API_BASE_URL=http://localhost:${backendPort}\n`);

    if (this.config.frontend === 'react') {
      upsertFile(path.join(frontendPath, '.env.example'), `REACT_APP_API_BASE_URL=http://localhost:${backendPort}\n`);
    } else if (this.config.frontend === 'vue') {
      upsertFile(path.join(frontendPath, '.env.example'), `VUE_APP_API_BASE_URL=http://localhost:${backendPort}\n`);
    } else if (this.config.frontend === 'svelte') {
      upsertFile(path.join(frontendPath, '.env.example'), `VITE_API_BASE_URL=http://localhost:${backendPort}\n`);
    } else if (this.config.frontend === 'angular') {
      upsertFile(path.join(frontendPath, '.env.example'), `API_BASE_URL=http://localhost:${backendPort}\n`);
    } else {
      upsertFile(path.join(frontendPath, '.env.example'), `API_BASE_URL=http://localhost:${backendPort}\n`);
    }

    const backendEnv = `PORT=${backendPort}
CORS_ORIGINS=*
DATABASE_PATH=data.db
JWT_SECRET=change-this-secret
`;
    if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      upsertFile(path.join(backendPath, '.env.example'), backendEnv);
    }

    if (fs.existsSync(path.join(backendPath, 'requirements.txt'))) {
      upsertFile(path.join(backendPath, '.env.example'), backendEnv);
    }
  }

  isExpressBackend(backendPath) {
    return fs.existsSync(path.join(backendPath, 'package.json')) && fs.existsSync(path.join(backendPath, 'src', 'index.js'));
  }

  isFastApiBackend(backendPath) {
    return fs.existsSync(path.join(backendPath, 'requirements.txt')) && fs.existsSync(path.join(backendPath, 'src', 'main.py'));
  }

  isFlaskBackend(backendPath) {
    return fs.existsSync(path.join(backendPath, 'requirements.txt')) && fs.existsSync(path.join(backendPath, 'app.py'));
  }

  isDjangoBackend(backendPath) {
    return fs.existsSync(path.join(backendPath, 'manage.py')) && fs.existsSync(path.join(backendPath, 'config', 'settings.py'));
  }

  isGoBackend(backendPath) {
    return fs.existsSync(path.join(backendPath, 'go.mod')) && fs.existsSync(path.join(backendPath, 'main.go'));
  }

  ensureBaselineLintScripts(frontendPath, backendPath) {
    const frontendPkgPath = path.join(frontendPath, 'package.json');
    ensurePackageScripts(frontendPkgPath, {
      lint: 'node ./tests/lint.frontend.js',
      'test:smoke': 'node --test ./tests/frontend-smoke.test.js'
    });

    const backendPkgPath = path.join(backendPath, 'package.json');
    ensurePackageScripts(backendPkgPath, {
      lint: 'node --check src/index.js',
      'test:smoke': 'node --test ./tests/backend-smoke.test.js'
    });

    if (this.isFastApiBackend(backendPath) || this.isFlaskBackend(backendPath) || this.isDjangoBackend(backendPath)) {
      upsertFile(
        path.join(backendPath, 'scripts', 'lint_backend.py'),
        `import compileall
import pathlib
import sys

TARGETS = [pathlib.Path("src"), pathlib.Path(".")]

ok = True
for target in TARGETS:
    if target.exists():
        ok = compileall.compile_dir(str(target), quiet=1) and ok

if not ok:
    sys.exit("Python lint failed: unable to compile one or more files")
`
      );
    }

    if (this.isGoBackend(backendPath)) {
      const lintScript = path.join(backendPath, 'scripts', 'lint-backend.sh');
      upsertFile(
        lintScript,
        `#!/usr/bin/env bash
set -euo pipefail
go vet ./...
`
      );
      ensureExecutable(lintScript);
    }
  }

  ensureBaselineSmokeTests(frontendPath, backendPath) {
    upsertFile(
      path.join(frontendPath, 'tests', 'smoke.test.md'),
      '# Frontend Smoke Test\n\n1. Start frontend.\n2. Ensure /api/items fetch renders data.\n3. Ensure refresh button updates data.\n'
    );
    upsertFile(
      path.join(frontendPath, 'tests', 'frontend-smoke.test.js'),
      `const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '..', 'src', 'App.js'),
  path.join(__dirname, '..', 'src', 'App.vue'),
  path.join(__dirname, '..', 'public', 'app.js'),
  path.join(__dirname, '..', 'src', 'app', 'app.component.ts'),
  path.join(__dirname, '..', 'src', 'App.svelte')
];

const source = candidates
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\\n');

test('frontend uses /api/items contract', () => {
  assert.ok(source.includes('/api/items'));
});

test('frontend supports configurable API base URL', () => {
  const tokens = ['API_BASE_URL', 'REACT_APP_API_BASE_URL', 'VUE_APP_API_BASE_URL', 'VITE_API_BASE_URL'];
  assert.ok(tokens.some(token => source.includes(token)));
});
`
    );
    upsertFile(
      path.join(frontendPath, 'tests', 'lint.frontend.js'),
      `const fs = require('fs');
const path = require('path');

const roots = [path.join(__dirname, '..', 'src'), path.join(__dirname, '..', 'public')];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const files = fs.readdirSync(root, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile()) continue;
    const full = path.join(root, file.name);
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('<<<<<<<') || content.includes('>>>>>>>')) {
      throw new Error(\`Merge marker detected in \${full}\`);
    }
  }
}
`
    );

    upsertFile(
      path.join(backendPath, 'tests', 'smoke.test.md'),
      '# Backend Smoke Test\n\n1. Start backend.\n2. GET /api/health returns healthy status.\n3. GET /api/items returns array payload.\n'
    );
    upsertFile(
      path.join(backendPath, 'tests', 'backend-smoke.test.js'),
      `const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '..', 'src', 'index.js'),
  path.join(__dirname, '..', 'src', 'main.py'),
  path.join(__dirname, '..', 'app.py'),
  path.join(__dirname, '..', 'main.go'),
  path.join(__dirname, '..', 'api', 'views.py')
];

const source = candidates
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\\n');

test('backend exposes health and items endpoints', () => {
  assert.ok(source.includes('/api/health') || source.includes("path('health'"));
  assert.ok(source.includes('/api/items') || source.includes("path('items'"));
});
`
    );
  }

  ensureProductionHardening(frontendPath, backendPath) {
    upsertFile(
      path.join(this.projectPath, 'ops', 'SLO.md'),
      '# SLO Baseline\n\n- Availability target: 99.5%\n- p95 latency target: < 400ms on /api/items\n- Error budget: 0.5% 5xx responses per 30 days\n'
    );
    upsertFile(
      path.join(this.projectPath, 'ops', 'SECURITY.md'),
      '# Security Baseline\n\n- Enforce CORS via `CORS_ORIGINS`\n- Use `JWT_SECRET` for signed tokens\n- Rate limiting enabled for API paths\n- Set production secrets via environment variables\n'
    );
    upsertFile(
      path.join(this.projectPath, 'ops', 'OBSERVABILITY.md'),
      '# Observability Baseline\n\n- Metrics endpoint: `/metrics`\n- Readiness endpoint: `/api/ready`\n- Health endpoint: `/api/health`\n- Include request latency + request count metrics\n'
    );

    const expressPkgPath = path.join(backendPath, 'package.json');
    const expressIndexPath = path.join(backendPath, 'src', 'index.js');
    if (this.isExpressBackend(backendPath)) {
      ensurePackageDependencies(expressPkgPath, {
        helmet: '^7.1.0',
        'express-rate-limit': '^7.4.0',
        'prom-client': '^15.1.3',
        'pino-http': '^9.0.0'
      });

      let source = fs.readFileSync(expressIndexPath, 'utf8');
      source = insertAfter(
        source,
        "const sqlite3 = require('sqlite3').verbose();",
        "const helmet = require('helmet');\nconst rateLimit = require('express-rate-limit');\nconst pinoHttp = require('pino-http');\nconst client = require('prom-client');"
      );
      source = source.replace(
        'const PORT = process.env.PORT || 5000;',
        "const PORT = Number(process.env.PORT || 5000);\nconst CORS_ORIGINS = process.env.CORS_ORIGINS || '*';"
      );
      source = source.replace(
        "const db = new sqlite3.Database('./data.db', (err) => {",
        "const dbPath = process.env.DATABASE_PATH || './data.db';\nconst db = new sqlite3.Database(dbPath, (err) => {"
      );
      source = insertAfter(source, 'const app = express();', "app.set('trust proxy', 1);");

      if (!source.includes('const requestDuration = new client.Histogram')) {
        const metricsBlock = `const requestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status']
});
const requestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
client.collectDefaultMetrics();`;
        source = insertBefore(source, '// Middleware', metricsBlock);
      }

      if (!source.includes('app.use(helmet());')) {
        source = source.replace(
          'app.use(cors());\napp.use(express.json());',
          `app.use(helmet());
app.use(pinoHttp());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(cors({
  origin: CORS_ORIGINS === '*' ? true : CORS_ORIGINS.split(',').map(item => item.trim())
}));
app.use(express.json());
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const status = String(res.statusCode);
    requestCount.inc({ method: req.method, route, status });
    end({ method: req.method, route, status });
  });
  next();
});`
        );
      }

      if (!source.includes("app.get('/metrics'")) {
        const endpointsBlock = `app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/api/ready', (req, res) => {
  res.json({ status: 'ready' });
});`;
        source = insertBefore(source, '// Health check endpoint', endpointsBlock);
      }

      if (!source.includes("process.on('SIGTERM'")) {
        source = insertBefore(
          source,
          '// Start server',
          "process.on('SIGTERM', () => {\n  db.close(() => process.exit(0));\n});"
        );
      }

      fs.writeFileSync(expressIndexPath, source);
    }

    const requirementsPath = path.join(backendPath, 'requirements.txt');
    const fastapiMainPath = path.join(backendPath, 'src', 'main.py');
    if (this.isFastApiBackend(backendPath)) {
      ensureRequirementLines(requirementsPath, [
        'prometheus-client==0.20.0',
        'python-json-logger==2.0.7'
      ]);

      let py = fs.readFileSync(fastapiMainPath, 'utf8');
      if (!py.includes('import os')) {
        py = py.replace('from datetime import datetime', 'from datetime import datetime\nimport os');
      }
      if (!py.includes('from prometheus_client import')) {
        py = py.replace('import uvicorn', 'import uvicorn\nfrom prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST');
      }
      if (!py.includes('Response')) {
        py = py.replace('from fastapi import FastAPI, HTTPException', 'from fastapi import FastAPI, HTTPException, Response');
      }
      py = py.replace(
        'allow_origins=["*"],',
        'allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")],'
      );
      py = py.replace('DATABASE = "data.db"', 'DATABASE = os.getenv("DATABASE_PATH", "data.db")');

      if (!py.includes('REQUEST_COUNTER = Counter')) {
        const metricsBlock = `REQUEST_COUNTER = Counter('http_requests_total', 'Total HTTP requests', ['method', 'path', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request duration seconds', ['method', 'path'])

@app.middleware("http")
async def metrics_middleware(request, call_next):
    method = request.method
    path = request.url.path
    timer = REQUEST_LATENCY.labels(method=method, path=path).time()
    with timer:
        response = await call_next(request)
    REQUEST_COUNTER.labels(method=method, path=path, status=str(response.status_code)).inc()
    return response

@app.get('/metrics')
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get('/api/ready')
async def ready():
    return {'status': 'ready'}`;
        py = insertBefore(py, '# Routes', metricsBlock);
      }

      fs.writeFileSync(fastapiMainPath, py);
    }

    const flaskAppPath = path.join(backendPath, 'app.py');
    if (this.isFlaskBackend(backendPath)) {
      ensureRequirementLines(requirementsPath, ['prometheus-client==0.20.0']);

      let flask = fs.readFileSync(flaskAppPath, 'utf8');
      if (!flask.includes('import os')) {
        flask = flask.replace('from datetime import datetime', 'from datetime import datetime\nimport os\nimport time');
      }
      if (!flask.includes('from prometheus_client import')) {
        flask = flask.replace(
          'from datetime import datetime',
          "from datetime import datetime\nfrom prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST"
        );
      }
      flask = flask.replace('from flask import Flask, jsonify, request', 'from flask import Flask, jsonify, request, Response');
      flask = flask.replace('CORS(app)', 'CORS(app, origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")])');
      if (!flask.includes('REQUEST_COUNTER = Counter(')) {
        const block = `REQUEST_COUNTER = Counter('http_requests_total', 'Total HTTP requests', ['method', 'path', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request duration seconds', ['method', 'path'])

@app.before_request
def _before_request():
    request._start_time = time.time()

@app.after_request
def _after_request(response):
    path = request.path
    method = request.method
    status = str(response.status_code)
    REQUEST_COUNTER.labels(method=method, path=path, status=status).inc()
    duration = max(time.time() - getattr(request, "_start_time", time.time()), 0)
    REQUEST_LATENCY.labels(method=method, path=path).observe(duration)
    return response

@app.route('/metrics', methods=['GET'])
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

@app.route('/api/ready', methods=['GET'])
def ready():
    return jsonify({'status': 'ready'})`;
        flask = insertBefore(flask, 'items = [', block);
      }
      fs.writeFileSync(flaskAppPath, flask);
    }
  }

  applyAuthScaffold(frontendPath, backendPath) {
    const frontendAuthService = `const DEFAULT_API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.VUE_APP_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  '';

function parseResponse(response) {
  if (!response.ok) {
    throw new Error('Auth request failed');
  }
  return response.json();
}

export function getToken() {
  return localStorage.getItem('hackforge_token');
}

export function setToken(token) {
  localStorage.setItem('hackforge_token', token);
}

export function clearToken() {
  localStorage.removeItem('hackforge_token');
}

export async function register(email, password, apiBaseUrl = DEFAULT_API_BASE_URL) {
  const response = await fetch(\`\${apiBaseUrl}/api/auth/register\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return parseResponse(response);
}

export async function login(email, password, apiBaseUrl = DEFAULT_API_BASE_URL) {
  const response = await fetch(\`\${apiBaseUrl}/api/auth/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const payload = await parseResponse(response);
  if (payload.token) {
    setToken(payload.token);
  }
  return payload;
}

export async function me(apiBaseUrl = DEFAULT_API_BASE_URL) {
  const response = await fetch(\`\${apiBaseUrl}/api/auth/me\`, {
    headers: { Authorization: \`Bearer \${getToken()}\` }
  });
  return parseResponse(response);
}
`;

    if (this.config.frontend === 'vanilla') {
      upsertFile(path.join(frontendPath, 'public', 'auth.js'), frontendAuthService);
    } else if (this.config.frontend === 'angular') {
      upsertFile(
        path.join(frontendPath, 'src', 'app', 'services', 'auth.service.ts'),
        `export class AuthService {
  private readonly tokenKey = 'hackforge_token';
  private readonly baseUrl = (window as any).API_BASE_URL || '';

  getToken(): string {
    return localStorage.getItem(this.tokenKey) || '';
  }

  async login(email: string, password: string): Promise<any> {
    const response = await fetch(\`\${this.baseUrl}/api/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    const payload = await response.json();
    localStorage.setItem(this.tokenKey, payload.token || '');
    return payload;
  }
}
`
      );
    } else {
      upsertFile(path.join(frontendPath, 'src', 'services', 'auth.js'), frontendAuthService);
    }

    const expressIndexPath = path.join(backendPath, 'src', 'index.js');
    if (this.isExpressBackend(backendPath)) {
      ensurePackageDependencies(path.join(backendPath, 'package.json'), {
        bcryptjs: '^2.4.3',
        jsonwebtoken: '^9.0.2'
      });

      upsertFile(
        path.join(backendPath, 'src', 'routes', 'auth.js'),
        `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
}

module.exports = function createAuthRoutes(db) {
  const router = express.Router();

  db.run(\`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  \`);

  router.post('/register', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and password (min 8 chars) are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email.toLowerCase(), passwordHash],
      function onInsert(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'User already exists' });
          }
          return res.status(500).json({ error: 'Database error', message: err.message });
        }
        return res.status(201).json({ id: this.lastID, email: email.toLowerCase() });
      }
    );
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email.toLowerCase()],
      async (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error', message: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = issueToken(row);
        return res.json({
          token,
          user: { id: row.id, email: row.email }
        });
      }
    );
  });

  router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return res.json({ id: payload.sub, email: payload.email });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  });

  return router;
};
`
      );

      let source = fs.readFileSync(expressIndexPath, 'utf8');
      source = source.replace("const authRoutes = require('./routes/auth');", "const createAuthRoutes = require('./routes/auth');");
      source = insertAfter(source, "const sqlite3 = require('sqlite3').verbose();", "const createAuthRoutes = require('./routes/auth');");
      source = source.replace("app.use('/api/auth', authRoutes);", "app.use('/api/auth', createAuthRoutes(db));");
      source = insertAfter(source, 'app.use(express.json());', "app.use('/api/auth', createAuthRoutes(db));");
      fs.writeFileSync(expressIndexPath, source);
      return;
    }

    if (this.isFastApiBackend(backendPath)) {
      ensureRequirementLines(path.join(backendPath, 'requirements.txt'), [
        'PyJWT==2.8.0',
        'passlib[bcrypt]==1.7.4'
      ]);

      upsertFile(
        path.join(backendPath, 'src', 'auth.py'),
        `import os
import sqlite3
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

DATABASE = os.getenv("DATABASE_PATH", "data.db")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def get_conn():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db():
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(tz=timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/register", status_code=201)
def register(payload: RegisterRequest):
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    conn = get_conn()
    try:
        password_hash = pwd_context.hash(payload.password)
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (payload.email.lower(), password_hash),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "email": payload.email.lower()}
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="User already exists") from error
    finally:
        conn.close()


@router.post("/login")
def login(payload: LoginRequest):
    conn = get_conn()
    row = conn.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (payload.email.lower(),),
    ).fetchone()
    conn.close()

    if not row or not pwd_context.verify(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(row["id"], row["email"])
    return {"token": token, "user": {"id": row["id"], "email": row["email"]}}


@router.get("/me")
def me(authorization: str = Header(default="")):
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"id": int(payload["sub"]), "email": payload["email"]}
    except Exception as error:
        raise HTTPException(status_code=401, detail="Invalid token") from error


init_auth_db()
`
      );

      const mainPath = path.join(backendPath, 'src', 'main.py');
      let py = fs.readFileSync(mainPath, 'utf8');
      py = insertAfter(py, 'import uvicorn', 'from auth import router as auth_router');
      py = insertBefore(py, '# Routes', 'app.include_router(auth_router, prefix="/api/auth", tags=["auth"])');
      fs.writeFileSync(mainPath, py);
      return;
    }

    if (this.isFlaskBackend(backendPath)) {
      ensureRequirementLines(path.join(backendPath, 'requirements.txt'), [
        'PyJWT==2.8.0'
      ]);

      const flaskPath = path.join(backendPath, 'app.py');
      let source = fs.readFileSync(flaskPath, 'utf8');
      if (!source.includes("import sqlite3")) {
        source = source.replace('from datetime import datetime', 'from datetime import datetime\nimport os\nimport sqlite3\nimport jwt\nfrom werkzeug.security import generate_password_hash, check_password_hash');
      }
      if (!source.includes('from werkzeug.security import')) {
        source = source.replace('from datetime import datetime', 'from datetime import datetime\nfrom werkzeug.security import generate_password_hash, check_password_hash');
      }
      if (!source.includes('JWT_SECRET =')) {
        source = insertBefore(source, 'items = [', `JWT_SECRET = os.getenv('JWT_SECRET', 'change-this-secret')
DATABASE = os.getenv('DATABASE_PATH', 'data.db')

def auth_conn():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_db():
    with auth_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

init_auth_db()
`);
      }
      if (!source.includes("/api/auth/login")) {
        const authBlock = `
@app.route('/api/auth/register', methods=['POST'])
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get('email') or '').strip().lower()
    password = (payload.get('password') or '').strip()
    if not email or len(password) < 8:
        return jsonify({'error': 'Email and password (min 8 chars) are required'}), 400

    with auth_conn() as conn:
        try:
            hashed_password = generate_password_hash(password)
            conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (email, hashed_password)
            )
            conn.commit()
            return jsonify({'email': email}), 201
        except sqlite3.IntegrityError:
            return jsonify({'error': 'User already exists'}), 409

@app.route('/api/auth/login', methods=['POST'])
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get('email') or '').strip().lower()
    password = (payload.get('password') or '').strip()

    with auth_conn() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            (email,)
        ).fetchone()

    if not row or not check_password_hash(row['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode({'sub': row['id'], 'email': row['email']}, JWT_SECRET, algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': row['id'], 'email': row['email']}})

@app.route('/api/auth/me', methods=['GET'])
def me():
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip()
    if not token:
        return jsonify({'error': 'Missing bearer token'}), 401

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return jsonify({'id': payload['sub'], 'email': payload['email']})
    except Exception:
        return jsonify({'error': 'Invalid token'}), 401
`;
        source = insertBefore(source, "if __name__ == '__main__':", authBlock);
      }
      fs.writeFileSync(flaskPath, source);
      return;
    }

    if (this.isDjangoBackend(backendPath)) {
      ensureRequirementLines(path.join(backendPath, 'requirements.txt'), [
        'djangorestframework-simplejwt==5.3.1'
      ]);

      const settingsPath = path.join(backendPath, 'config', 'settings.py');
      let settings = fs.readFileSync(settingsPath, 'utf8');
      if (!settings.includes('rest_framework_simplejwt.authentication.JWTAuthentication')) {
        settings += `
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}
`;
      }
      fs.writeFileSync(settingsPath, settings);

      const urlsPath = path.join(backendPath, 'api', 'urls.py');
      let urls = fs.readFileSync(urlsPath, 'utf8');
      if (!urls.includes('TokenObtainPairView')) {
        urls = urls.replace(
          'from django.urls import path',
          'from django.urls import path\nfrom rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView'
        );
      }
      if (!urls.includes("path('auth/register'")) {
        urls = urls.replace(
          "    path('items/<int:item_id>', views.item_resource),",
          "    path('items/<int:item_id>', views.item_resource),\n    path('auth/register', views.auth_register),\n    path('auth/login', TokenObtainPairView.as_view()),\n    path('auth/refresh', TokenRefreshView.as_view()),\n    path('auth/me', views.auth_me),"
        );
      }
      fs.writeFileSync(urlsPath, urls);

      const viewsPath = path.join(backendPath, 'api', 'views.py');
      let views = fs.readFileSync(viewsPath, 'utf8');
      if (!views.includes('from django.contrib.auth.models import User')) {
        views = views.replace(
          'from rest_framework.response import Response',
          'from rest_framework.response import Response\nfrom django.contrib.auth.models import User'
        );
      }
      if (!views.includes('def auth_register')) {
        views += `

@api_view(['POST'])
def auth_register(request):
    payload = request.data or {}
    email = (payload.get('email') or '').strip().lower()
    password = payload.get('password') or ''
    if not email or len(password) < 8:
        return Response({'error': 'Email and password (min 8 chars) are required'}, status=400)
    if User.objects.filter(username=email).exists():
        return Response({'error': 'User already exists'}, status=409)

    user = User.objects.create_user(username=email, email=email, password=password)
    return Response({'id': user.id, 'email': user.email}, status=201)


@api_view(['GET'])
def auth_me(request):
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=401)
    return Response({
        'id': request.user.id,
        'email': request.user.email,
        'username': request.user.username
    })
`;
      }
      fs.writeFileSync(viewsPath, views);
      return;
    }

    if (this.isGoBackend(backendPath)) {
      const goModPath = path.join(backendPath, 'go.mod');
      let goMod = fs.readFileSync(goModPath, 'utf8');
      if (!goMod.includes('github.com/golang-jwt/jwt/v5')) {
        if (goMod.includes('require (')) {
          goMod = goMod.replace('require (', 'require (\n\tgithub.com/golang-jwt/jwt/v5 v5.2.1\n\tgolang.org/x/crypto v0.26.0');
        } else {
          goMod += '\nrequire github.com/golang-jwt/jwt/v5 v5.2.1\nrequire golang.org/x/crypto v0.26.0\n';
        }
      }
      fs.writeFileSync(goModPath, goMod);

      upsertFile(
        path.join(backendPath, 'auth.go'),
        `package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthUser struct {
	ID           int    \`json:"id"\`
	Email        string \`json:"email"\`
	PasswordHash string
}

var authUsers = map[string]AuthUser{}
var nextUserID = 1

func authSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "change-this-secret"
	}
	return []byte(secret)
}

func registerAuthRoutes(router *gin.Engine) {
	router.POST("/api/auth/register", func(c *gin.Context) {
		var payload struct {
			Email    string \`json:"email"\`
			Password string \`json:"password"\`
		}
		if err := c.BindJSON(&payload); err != nil || payload.Email == "" || len(payload.Password) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password (min 8 chars) are required"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(payload.Email))
		if _, exists := authUsers[email]; exists {
			c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to hash password"})
			return
		}

		user := AuthUser{ID: nextUserID, Email: email, PasswordHash: string(hash)}
		nextUserID++
		authUsers[email] = user
		c.JSON(http.StatusCreated, gin.H{"id": user.ID, "email": user.Email})
	})

	router.POST("/api/auth/login", func(c *gin.Context) {
		var payload struct {
			Email    string \`json:"email"\`
			Password string \`json:"password"\`
		}
		if err := c.BindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(payload.Email))
		user, exists := authUsers[email]
		if !exists || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":   user.ID,
			"email": user.Email,
		})
		tokenString, err := token.SignedString(authSecret())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to sign token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": tokenString, "user": gin.H{"id": user.ID, "email": user.Email}})
	})

	router.GET("/api/auth/me", func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing bearer token"})
			return
		}
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return authSecret(), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"id": claims["sub"], "email": claims["email"]})
	})
}
`
      );

      const mainPath = path.join(backendPath, 'main.go');
      let main = fs.readFileSync(mainPath, 'utf8');
      main = insertBefore(main, 'router.Run(":5000")', 'registerAuthRoutes(router)');
      fs.writeFileSync(mainPath, main);
      return;
    }

    upsertFile(
      path.join(backendPath, 'auth', 'README.md'),
      '# Auth Setup\n\nAuth feature is enabled with frontend service stubs. Implement backend auth handlers for this stack if needed.\n'
    );
  }

  applyDatabaseScaffold(backendPath) {
    const sql = `CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

    upsertFile(path.join(backendPath, 'db', 'init.sql'), sql);
    upsertFile(path.join(backendPath, 'db', 'migrations', '001_init.sql'), sql);

    const initScriptPath = path.join(backendPath, 'scripts', 'init-db.sh');
    upsertFile(
      initScriptPath,
      `#!/usr/bin/env bash
set -euo pipefail

DB_PATH="\${DATABASE_PATH:-data.db}"
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" < db/init.sql
  echo "Database initialized at $DB_PATH"
else
  echo "sqlite3 CLI not found; use language-specific init script instead."
fi
`
    );
    ensureExecutable(initScriptPath);

    if (this.isExpressBackend(backendPath)) {
      ensurePackageScripts(path.join(backendPath, 'package.json'), {
        'db:init': 'node scripts/migrate.js',
        'db:migrate': 'node scripts/migrate.js'
      });
      upsertFile(
        path.join(backendPath, 'scripts', 'migrate.js'),
        `const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DATABASE_PATH || 'data.db';
const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
const db = new sqlite3.Database(dbPath);

db.exec(sql, error => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(\`Database initialized: \${dbPath}\`);
  db.close();
});
`
      );
    }

    if (this.isFastApiBackend(backendPath) || this.isFlaskBackend(backendPath) || this.isDjangoBackend(backendPath)) {
      upsertFile(
        path.join(backendPath, 'scripts', 'init_db.py'),
        `import os
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sql = (root / 'db' / 'init.sql').read_text(encoding='utf-8')
db_path = os.getenv('DATABASE_PATH', str(root / 'data.db'))

conn = sqlite3.connect(db_path)
conn.executescript(sql)
conn.commit()
conn.close()
print(f'Database initialized: {db_path}')
`
      );
    }
  }

  applyApiDocsScaffold(backendPath) {
    const openapiSpec = `openapi: 3.0.3
info:
  title: HackForge API
  version: 2.0.0
paths:
  /api/health:
    get:
      summary: Health endpoint
      responses:
        '200':
          description: Service health
  /api/items:
    get:
      summary: List items
      responses:
        '200':
          description: Items list
    post:
      summary: Create item
      responses:
        '201':
          description: Created
  /api/items/{id}:
    put:
      summary: Update item
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: Updated
    delete:
      summary: Delete item
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: Deleted
  /api/auth/login:
    post:
      summary: Login endpoint
      responses:
        '200':
          description: Authenticated
`;
    upsertFile(path.join(backendPath, 'docs', 'openapi.yaml'), openapiSpec);

    const expressIndexPath = path.join(backendPath, 'src', 'index.js');
    if (this.isExpressBackend(backendPath)) {
      ensurePackageDependencies(path.join(backendPath, 'package.json'), {
        'swagger-ui-express': '^5.0.1',
        yamljs: '^0.3.0'
      });

      let source = fs.readFileSync(expressIndexPath, 'utf8');
      source = insertAfter(
        source,
        "const client = require('prom-client');",
        "const swaggerUi = require('swagger-ui-express');\nconst YAML = require('yamljs');\nconst path = require('path');"
      );

      if (!source.includes('const openApiSpec = YAML.load')) {
        source = insertBefore(
          source,
          '// Middleware',
          "const openApiSpec = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));"
        );
      }

      if (!source.includes("app.use('/api/docs', swaggerUi.serve")) {
        source = insertAfter(
          source,
          'app.use(express.json());',
          "app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));\napp.get('/api/docs.json', (req, res) => res.json(openApiSpec));"
        );
      }

      fs.writeFileSync(expressIndexPath, source);
    }

    const fastapiMainPath = path.join(backendPath, 'src', 'main.py');
    if (this.isFastApiBackend(backendPath)) {
      let py = fs.readFileSync(fastapiMainPath, 'utf8');
      if (!py.includes('from fastapi.responses import RedirectResponse')) {
        py = insertAfter(py, 'import uvicorn', 'from fastapi.responses import RedirectResponse');
      }
      if (!py.includes("@app.get('/api/docs')")) {
        py = insertBefore(
          py,
          '# Routes',
          "@app.get('/api/docs')\nasync def docs_redirect():\n    return RedirectResponse(url='/docs')"
        );
      }
      fs.writeFileSync(fastapiMainPath, py);
    }

    if (this.isFlaskBackend(backendPath)) {
      const flaskPath = path.join(backendPath, 'app.py');
      let flask = fs.readFileSync(flaskPath, 'utf8');
      if (!flask.includes('send_file')) {
        flask = flask.replace('from flask import Flask, jsonify, request, Response', 'from flask import Flask, jsonify, request, Response, send_file');
        flask = flask.replace('from flask import Flask, jsonify, request', 'from flask import Flask, jsonify, request, send_file');
      }
      if (!flask.includes("@app.route('/api/docs'")) {
        flask = insertBefore(
          flask,
          "if __name__ == '__main__':",
          `@app.route('/api/docs', methods=['GET'])
def api_docs():
    return send_file('docs/openapi.yaml', mimetype='application/yaml')
`
        );
      }
      fs.writeFileSync(flaskPath, flask);
    }

    if (this.isDjangoBackend(backendPath)) {
      const urlsPath = path.join(backendPath, 'api', 'urls.py');
      let urls = fs.readFileSync(urlsPath, 'utf8');
      if (!urls.includes("path('docs'")) {
        urls = urls.replace(
          "    path('items/<int:item_id>', views.item_resource),",
          "    path('items/<int:item_id>', views.item_resource),\n    path('docs', views.api_docs),"
        );
      }
      fs.writeFileSync(urlsPath, urls);

      const viewsPath = path.join(backendPath, 'api', 'views.py');
      let views = fs.readFileSync(viewsPath, 'utf8');
      if (!views.includes('from django.http import HttpResponse')) {
        views = views.replace('from rest_framework.response import Response', 'from rest_framework.response import Response\nfrom django.http import HttpResponse');
      }
      if (!views.includes('def api_docs(request):')) {
        views += `

@api_view(['GET'])
def api_docs(request):
    with open('docs/openapi.yaml', 'r', encoding='utf-8') as handle:
        return HttpResponse(handle.read(), content_type='application/yaml')
`;
      }
      fs.writeFileSync(viewsPath, views);
    }

    if (this.isGoBackend(backendPath)) {
      const mainPath = path.join(backendPath, 'main.go');
      let main = fs.readFileSync(mainPath, 'utf8');
      if (!main.includes(`router.GET("/api/docs"`)) {
        main = insertBefore(
          main,
          'router.Run(":5000")',
          'router.GET("/api/docs", func(c *gin.Context) {\n\t\tc.File("docs/openapi.yaml")\n\t})'
        );
      }
      fs.writeFileSync(mainPath, main);
    }
  }

  applyTestingFeature(frontendPath, backendPath) {
    upsertFile(
      path.join(frontendPath, 'tests', 'api-contract.md'),
      '# Frontend API Contract\n\n- Calls GET /api/items\n- Handles loading, error, success states\n'
    );
    upsertFile(
      path.join(backendPath, 'tests', 'api-contract.md'),
      '# Backend API Contract\n\n- Exposes GET /api/health\n- Exposes CRUD on /api/items\n'
    );

    upsertFile(
      path.join(frontendPath, 'tests', 'api-contract.test.js'),
      `const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'src', 'App.js'),
  path.join(__dirname, '..', 'src', 'App.vue'),
  path.join(__dirname, '..', 'public', 'app.js'),
  path.join(__dirname, '..', 'src', 'App.svelte'),
  path.join(__dirname, '..', 'src', 'app', 'app.component.ts')
].filter(file => fs.existsSync(file));

const source = files.map(file => fs.readFileSync(file, 'utf8')).join('\\n');

test('frontend calls /api/items endpoint', () => {
  assert.ok(source.includes('/api/items'));
});
`
    );

    const frontendPkgPath = path.join(frontendPath, 'package.json');
    ensurePackageScripts(frontendPkgPath, {
      'test:contract': 'node --test ./tests/api-contract.test.js'
    });

    const backendPkgPath = path.join(backendPath, 'package.json');
    if (readJsonIfExists(backendPkgPath)) {
      upsertFile(
        path.join(backendPath, 'tests', 'api-contract.test.js'),
        `const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');

test('backend route contract exists', () => {
  assert.ok(source.includes('/api/health'));
  assert.ok(source.includes('/api/items'));
  assert.ok(source.includes('app.post'));
  assert.ok(source.includes('app.put'));
  assert.ok(source.includes('app.delete'));
});
`
      );
      ensurePackageScripts(backendPkgPath, {
        'test:contract': 'node --test ./tests/api-contract.test.js'
      });
      return;
    }

    if (this.isFastApiBackend(backendPath)) {
      ensureRequirementLines(path.join(backendPath, 'requirements.txt'), [
        'pytest==8.3.3',
        'httpx==0.27.2'
      ]);
      upsertFile(
        path.join(backendPath, 'tests', 'test_api_contract.py'),
        `from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200


def test_items_endpoint():
    response = client.get("/api/items")
    assert response.status_code == 200
`
      );
      return;
    }

    if (this.isFlaskBackend(backendPath)) {
      ensureRequirementLines(path.join(backendPath, 'requirements.txt'), [
        'pytest==8.3.3'
      ]);
      upsertFile(
        path.join(backendPath, 'tests', 'test_api_contract.py'),
        `from app import app


def test_health_endpoint():
    client = app.test_client()
    response = client.get("/api/health")
    assert response.status_code == 200


def test_items_endpoint():
    client = app.test_client()
    response = client.get("/api/items")
    assert response.status_code == 200
`
      );
      return;
    }

    if (this.isDjangoBackend(backendPath)) {
      upsertFile(
        path.join(backendPath, 'api', 'tests.py'),
        `from django.test import TestCase
from rest_framework.test import APIClient


class ApiContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_endpoint(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)

    def test_items_endpoint(self):
        response = self.client.get('/api/items')
        self.assertEqual(response.status_code, 200)
`
      );
      return;
    }

    if (this.isGoBackend(backendPath)) {
      upsertFile(
        path.join(backendPath, 'contract_test.go'),
        `package main

import (
	"os"
	"strings"
	"testing"
)

func TestRouteContract(t *testing.T) {
	content, err := os.ReadFile("main.go")
	if err != nil {
		t.Fatalf("unable to read main.go: %v", err)
	}
	source := string(content)
	required := []string{"/api/health", "/api/items", "POST", "PUT", "DELETE"}
	for _, token := range required {
		if !strings.Contains(source, token) {
			t.Fatalf("missing contract token: %s", token)
		}
	}
}
`
      );
    }
  }

  async generateRootFiles() {
    console.log(chalk.yellow('📝 Generating root files...'));

    const readmePath = path.join(this.projectPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      upsertFile(readmePath, this.generateReadme());
    }

    const gitignorePath = path.join(this.projectPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      upsertFile(gitignorePath, this.generateGitignore());
    }

    if (this.config.type === 'web' && !this.config.framework) {
      this.generateWebRootPackageJson();
      this.generateRunScript();

      if (this.config.includeDocker) {
        this.generateDockerAssets();
      }

      if (unique(this.config.features).includes('cicd')) {
        this.generateGitHubCI();
      }
    } else if (unique(this.config.features).includes('cicd')) {
      this.generateGitHubCI();
    }

    console.log(chalk.green('✓ Root files generated'));
  }

  getBackendCommands() {
    const backendType = this.config.backend;

    if (backendType === 'fastapi') {
      return {
        start: 'python src/main.py',
        dev: 'python src/main.py'
      };
    }

    if (backendType === 'flask') {
      return {
        start: 'python app.py',
        dev: 'python app.py'
      };
    }

    if (backendType === 'django') {
      return {
        start: 'python manage.py runserver 5000',
        dev: 'python manage.py runserver 5000'
      };
    }

    if (backendType === 'go-gin') {
      return {
        start: 'go run main.go',
        dev: 'go run main.go'
      };
    }

    if (backendType === 'spring-boot') {
      return {
        start: './mvnw spring-boot:run',
        dev: './mvnw spring-boot:run'
      };
    }

    return {
      start: 'npm start',
      dev: 'npm run dev'
    };
  }

  generateWebRootPackageJson() {
    const layout = this.getWebLayout();
    const backendCommands = this.getBackendCommands();

    const rootPackage = {
      name: this.config.projectName,
      private: true,
      version: '1.0.0',
      description: this.config.projectDescription,
      scripts: {
        start: 'concurrently "npm:start:*" --names "backend,frontend" --prefix-colors "blue,magenta"',
        'start:backend': `cd ${layout.backendRel} && ${backendCommands.start}`,
        'start:frontend': `cd ${layout.frontendRel} && npm start`,
        dev: 'concurrently "npm:dev:*" --names "backend,frontend" --prefix-colors "blue,magenta"',
        'dev:backend': `cd ${layout.backendRel} && ${backendCommands.dev}`,
        'dev:frontend': `cd ${layout.frontendRel} && npm run dev --if-present || npm start`
      },
      devDependencies: {
        concurrently: '^8.2.2'
      }
    };

    if (layout.mode === 'monorepo') {
      rootPackage.workspaces = ['apps/*'];
    }

    writeJson(path.join(this.projectPath, 'package.json'), rootPackage);
  }

  generateRunScript() {
    const layout = this.getWebLayout();
    const backendType = this.config.backend;
    const backendPort = backendType === 'fastapi' ? 8000 : 5000;

    const backendStartScript = (() => {
      if (backendType === 'fastapi') {
        return `
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python src/main.py &
`;
      }

      if (backendType === 'flask') {
        return `
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python app.py &
`;
      }

      if (backendType === 'django') {
        return `
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python manage.py runserver 5000 &
`;
      }

      if (backendType === 'go-gin') {
        return `
go mod download > /dev/null 2>&1
go run main.go &
`;
      }

      return `
if [ ! -d "node_modules" ]; then
  npm install > /dev/null 2>&1
fi
npm start &
`;
    })();

    const runScript = `#!/usr/bin/env bash
set -e

echo "🔨 MindCore · Forge - Starting your hackathon project"

echo "Starting backend..."
cd "${layout.backendRel}"
${backendStartScript}
BACKEND_PID=$!
cd - >/dev/null

echo "Starting frontend..."
cd "${layout.frontendRel}"
if [ ! -d "node_modules" ]; then
  npm install > /dev/null 2>&1
fi
npm start &
FRONTEND_PID=$!
cd - >/dev/null

echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:${backendPort}"

echo "Press Ctrl+C to stop"
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
`;

    const runScriptPath = path.join(this.projectPath, 'run.sh');
    upsertFile(runScriptPath, runScript);

    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(runScriptPath, '755');
      } catch (error) {
        // Ignore chmod errors on restricted filesystems.
      }
    }
  }

  generateDockerAssets() {
    const layout = this.getWebLayout();
    const backendPort = this.config.backend === 'fastapi' ? 8000 : 5000;

    const compose = `version: '3.8'

services:
  backend:
    build: ./${layout.backendRel}
    restart: unless-stopped
    ports:
      - "${backendPort}:${backendPort}"
    env_file:
      - ./${layout.backendRel}/.env
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:${backendPort}/api/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
    volumes:
      - ./${layout.backendRel}:/app

  frontend:
    build: ./${layout.frontendRel}
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    env_file:
      - ./${layout.frontendRel}/.env
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:3000 || exit 1"]
      interval: 20s
      timeout: 5s
      retries: 5
    volumes:
      - ./${layout.frontendRel}:/app
`;

    upsertFile(path.join(this.projectPath, 'docker-compose.yml'), compose);

    const frontendDockerfile = `FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`;

    upsertFile(path.join(this.projectPath, layout.frontendRel, 'Dockerfile'), frontendDockerfile);

    let backendDockerfile;

    if (this.config.backend === 'fastapi' || this.config.backend === 'flask' || this.config.backend === 'django') {
      const pythonCmd = this.config.backend === 'fastapi'
        ? `["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]`
        : (this.config.backend === 'django'
          ? `["python", "manage.py", "runserver", "0.0.0.0:5000"]`
          : `["python", "app.py"]`);
      backendDockerfile = `FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${backendPort}
CMD ${pythonCmd}
`;
    } else if (this.config.backend === 'go-gin') {
      backendDockerfile = `FROM golang:1.22-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY go.mod ./
RUN go mod download
COPY . .
EXPOSE ${backendPort}
CMD ["go", "run", "main.go"]
`;
    } else {
      backendDockerfile = `FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${backendPort}
CMD ["npm", "start"]
`;
    }

    upsertFile(path.join(this.projectPath, layout.backendRel, 'Dockerfile'), backendDockerfile);
  }

  generateGitHubCI() {
    const layout = this.config.type === 'web' && !this.config.framework ? this.getWebLayout() : null;

    const ci = `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Install dependencies
        run: |
          if [ -f package.json ]; then npm install; fi
          ${layout ? `if [ -f ${layout.frontendRel}/package.json ]; then cd ${layout.frontendRel} && npm install && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/package.json ]; then cd ${layout.backendRel} && npm install && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/requirements.txt ]; then python -m pip install --upgrade pip && python -m pip install -r ${layout.backendRel}/requirements.txt; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/go.mod ]; then cd ${layout.backendRel} && go mod download && cd -; fi` : ''}
          if [ -f requirements.txt ]; then python -m pip install --upgrade pip && python -m pip install -r requirements.txt; fi
          if [ -f go.mod ]; then go mod download; fi

      - name: Lint
        run: |
          npm run lint --if-present
          ${layout ? `if [ -f ${layout.frontendRel}/package.json ]; then cd ${layout.frontendRel} && npm run lint --if-present && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/package.json ]; then cd ${layout.backendRel} && npm run lint --if-present && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/scripts/lint_backend.py ]; then python ${layout.backendRel}/scripts/lint_backend.py; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/go.mod ]; then cd ${layout.backendRel} && go vet ./... && cd -; fi` : ''}
          if [ -f scripts/lint_backend.py ]; then python scripts/lint_backend.py; fi
          if [ -f go.mod ]; then go vet ./...; fi

      - name: Test
        run: |
          npm run test:contract --if-present
          npm run test:smoke --if-present
          npm run test --if-present
          ${layout ? `if [ -f ${layout.frontendRel}/package.json ]; then cd ${layout.frontendRel} && npm run test:contract --if-present && npm run test:smoke --if-present && npm run test --if-present && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/package.json ]; then cd ${layout.backendRel} && npm run test:contract --if-present && npm run test:smoke --if-present && npm run test --if-present && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/requirements.txt ] && [ -d ${layout.backendRel}/tests ]; then cd ${layout.backendRel} && pytest -q && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/manage.py ]; then cd ${layout.backendRel} && python manage.py test && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/go.mod ]; then cd ${layout.backendRel} && go test ./... && cd -; fi` : ''}
          if [ -f requirements.txt ] && [ -d tests ]; then pytest -q; fi
          if [ -f manage.py ]; then python manage.py test; fi
          if [ -f go.mod ]; then go test ./...; fi

      - name: Security audit
        run: |
          if [ -f package-lock.json ]; then npm audit --audit-level=high || true; fi
          ${layout ? `if [ -f ${layout.frontendRel}/package-lock.json ]; then cd ${layout.frontendRel} && npm audit --audit-level=high || true && cd -; fi` : ''}
          ${layout ? `if [ -f ${layout.backendRel}/package-lock.json ]; then cd ${layout.backendRel} && npm audit --audit-level=high || true && cd -; fi` : ''}
          if [ -f requirements.txt ]; then python -m pip install pip-audit && pip-audit -r requirements.txt || true; fi
          ${layout ? `if [ -f ${layout.backendRel}/requirements.txt ]; then python -m pip install pip-audit && pip-audit -r ${layout.backendRel}/requirements.txt || true; fi` : ''}
`;

    upsertFile(path.join(this.projectPath, '.github', 'workflows', 'ci.yml'), ci);
  }

  generateGitignore() {
    return `# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Build artifacts
dist/
build/
target/

# Env
.env
.env.local

# Logs
*.log

# IDE/OS
.vscode/
.idea/
.DS_Store
`;
  }

  generateReadme() {
    if (this.config.type !== 'web') {
      return `# ${this.config.projectName}

${this.config.projectDescription}

## Stack
- ${this.config.name} (${this.config.stack})

## Generated by
MindCore · Forge v2
`;
    }

    const stackLine = this.config.framework
      ? `- **Framework:** ${this.config.framework}`
      : `- **Frontend:** ${this.config.frontend}\n- **Backend:** ${this.config.backend}\n- **Folder Structure:** ${this.config.folderStructure || 'separate'}`;

    return `# ${this.config.projectName}

${this.config.projectDescription}

## Stack
${stackLine}

## API Contract
- GET /api/health
- GET /api/items
- POST /api/items
- PUT /api/items/:id
- DELETE /api/items/:id

## Environment
Copy from .env.example and adjust values for local ports.

## Run
\`\`\`bash
npm start
# or
./run.sh
\`\`\`

Generated by MindCore · Forge v2.
`;
  }

  validateGeneratedOutput() {
    const result = validateGeneratedProject(this.projectPath, this.config);
    if (!result.ok) {
      throw new Error(`Generated project failed contract validation: ${result.errors.join(' | ')}`);
    }
  }

  async installDependencies() {
    if (this.config.skipInstall) {
      console.log(chalk.yellow('\n⚠ Skipping dependency installation (--skip-install used)\n'));
      return;
    }

    console.log(chalk.yellow('📦 Installing dependencies...'));

    try {
      if (this.config.type === 'web' && !this.config.framework) {
        await this.installWebDependencies();
      } else {
        await this.installSingleProjectDependencies(this.projectPath);
      }

      console.log(chalk.green('✓ All dependencies installed'));
    } catch (error) {
      console.error(chalk.yellow('⚠ Dependency installation failed. You can install manually later.'));
    }
  }

  async installWebDependencies() {
    const layout = this.getWebLayout();
    const frontendPath = path.join(this.projectPath, layout.frontendRel);
    const backendPath = path.join(this.projectPath, layout.backendRel);

    if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
      execSync('npm install', { cwd: frontendPath, stdio: 'inherit' });
    }

    if (fs.existsSync(path.join(backendPath, 'requirements.txt'))) {
      execSync(process.platform === 'win32' ? 'python -m venv venv' : 'python3 -m venv venv', {
        cwd: backendPath,
        stdio: 'inherit'
      });

      const pipInstall = process.platform === 'win32'
        ? 'venv\\Scripts\\pip install -r requirements.txt'
        : 'venv/bin/pip install -r requirements.txt';

      execSync(pipInstall, { cwd: backendPath, stdio: 'inherit' });
    } else if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
    } else if (fs.existsSync(path.join(backendPath, 'go.mod'))) {
      execSync('go mod download', { cwd: backendPath, stdio: 'inherit' });
    }
  }

  async installSingleProjectDependencies(projectPath) {
    const pkgPath = path.join(projectPath, 'package.json');
    const reqPath = path.join(projectPath, 'requirements.txt');
    const goModPath = path.join(projectPath, 'go.mod');
    const cargoPath = path.join(projectPath, 'Cargo.toml');
    const pubspecPath = path.join(projectPath, 'pubspec.yaml');

    if (fs.existsSync(pkgPath)) {
      execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
    }

    if (fs.existsSync(reqPath)) {
      execSync(process.platform === 'win32' ? 'python -m venv venv' : 'python3 -m venv venv', {
        cwd: projectPath,
        stdio: 'inherit'
      });

      const pipInstall = process.platform === 'win32'
        ? 'venv\\Scripts\\pip install -r requirements.txt'
        : 'venv/bin/pip install -r requirements.txt';

      execSync(pipInstall, { cwd: projectPath, stdio: 'inherit' });
    }

    if (fs.existsSync(goModPath)) {
      execSync('go mod download', { cwd: projectPath, stdio: 'inherit' });
    }

    if (fs.existsSync(cargoPath)) {
      execSync('cargo build', { cwd: projectPath, stdio: 'inherit' });
    }

    if (fs.existsSync(pubspecPath)) {
      execSync('flutter pub get', { cwd: projectPath, stdio: 'inherit' });
    }
  }

  printSuccessMessage() {
    console.log('');
    console.log(chalk.green.bold('✨ Success! Your hackathon starter is ready.'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  1. cd "${this.projectPath}"`));

    if (this.config.type === 'web' && !this.config.framework) {
      console.log(chalk.white('  2. npm start (or ./run.sh)'));
    } else {
      console.log(chalk.white('  2. Check README.md for stack-specific run commands'));
    }

    console.log('');
  }
}

function createGenerationConfig(options) {
  const {
    projectName,
    stack,
    projectDescription,
    skipInstall,
    outputDir,
    folderStructure,
    includeDocker,
    features
  } = options;

  assertProjectName(projectName);

  const resolved = resolveStackInput(stack);
  if (!resolved) {
    const suggestions = getStackSuggestions(stack)
      .map(item => `${item.key} (${item.name})`)
      .join(', ');

    throw new Error(`Unknown stack: "${stack}". Did you mean: ${suggestions}`);
  }

  const config = {
    projectName,
    projectDescription: projectDescription || 'A hackathon project',
    stack: resolved.key,
    ...resolved.config,
    skipInstall: Boolean(skipInstall),
    outputDir: resolveOutputDir(outputDir),
    folderStructure: folderStructure || 'separate',
    includeDocker: includeDocker === undefined ? true : Boolean(includeDocker),
    features: resolveFeatureList(features)
  };

  if (config.type === 'web' && !config.framework && config.features.length === 0) {
    config.features = DEFAULT_WEB_FEATURES.slice();
  }

  return config;
}

module.exports = {
  run: async flags => {
    const forge = new MindCoreForge();
    await forge.run(flags);
  },

  generate: async options => {
    const {
      dryRun,
      jsonOutput
    } = options;

    const config = createGenerationConfig(options);

    if (dryRun) {
      const result = {
        projectName: config.projectName,
        stack: config.stack,
        stackName: config.name,
        type: config.type,
        category: config.category,
        directory: path.join(config.outputDir, config.projectName),
        folderStructure: config.folderStructure,
        includeDocker: config.includeDocker,
        features: config.features
      };

      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.cyan.bold('\n🔨 MindCore · Forge v2 (dry run)'));
        console.log(chalk.gray('No files will be created.\n'));
        console.log(chalk.white(`  Project:        ${result.projectName}`));
        console.log(chalk.white(`  Stack:          ${result.stackName} (${result.stack})`));
        console.log(chalk.white(`  Type:           ${result.type}`));
        console.log(chalk.white(`  Folder layout:  ${result.folderStructure}`));
        console.log(chalk.white(`  Docker:         ${result.includeDocker ? 'enabled' : 'disabled'}`));
        console.log(chalk.white(`  Features:       ${result.features.join(', ') || 'none'}`));
      }

      return result;
    }

    const forge = new MindCoreForge();
    forge.config = config;

    if (!jsonOutput) {
      console.log(chalk.cyan.bold('\n🔨 MindCore · Forge v2'));
      console.log(chalk.gray('All-in-one hackathon starter\n'));
    }

    forge.validateConfig();
    await forge.createProjectStructure();
    await forge.generateProject();
    await forge.applyWebScaffolds();
    await forge.generateRootFiles();
    forge.validateGeneratedOutput();
    await forge.installDependencies();

    const result = {
      projectName: config.projectName,
      stack: config.stack,
      stackName: config.name,
      type: config.type,
      category: config.category,
      directory: forge.projectPath,
      folderStructure: config.folderStructure,
      includeDocker: config.includeDocker,
      features: config.features
    };

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      forge.printSuccessMessage();
    }

    return result;
  },

  listStacks: () => {
    const grouped = {};

    Object.entries(getStacksByCategory()).forEach(([category, stacks]) => {
      grouped[category] = stacks.map(stack => ({
        key: stack.key,
        name: stack.name,
        description: stack.description,
        type: stack.type,
        aliases: [stack.name]
      }));
    });

    return grouped;
  },

  MindCoreForge
};
