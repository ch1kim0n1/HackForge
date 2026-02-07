const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const templates = require('./templates');
const { STACKS, getStacksByCategory } = require('./stacks');

class MindCoreForge {
  constructor() {
    this.projectPath = null;
    this.config = null;
  }

  async run(flags = {}) {
    try {
      console.log(chalk.cyan.bold('\n🔨 MindCore · Forge'));
      console.log(chalk.gray('Hackathon project bootstrapper\n'));

      // Get project configuration
      this.config = await this.getConfiguration();
      
      // Apply flags
      if (flags.skipInstall) {
        this.config.skipInstall = true;
      }

      // Validate configuration
      this.validateConfig();

      // Create project structure based on type
      await this.createProjectStructure();

      // Generate project based on type
      await this.generateProject();

      // Generate root files
      await this.generateRootFiles();

      // Install dependencies
      await this.installDependencies();

      // Final message
      this.printSuccessMessage();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message || error);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async getConfiguration() {
    const stacksByCategory = getStacksByCategory();
    
    // Create choices grouped by category
    const choices = [];
    Object.entries(stacksByCategory).forEach(([category, stacks]) => {
      choices.push(new inquirer.Separator(`\n=== ${category} ===`));
      stacks.forEach(stack => {
        choices.push({
          name: `${stack.name} - ${stack.description}`,
          value: stack.key
        });
      });
    });

    const questions = [
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-hackathon-project',
        validate: (input) => {
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Project name must be lowercase alphanumeric with hyphens only';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'stack',
        message: 'Choose your stack:',
        choices: choices,
        pageSize: 15
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: 'Brief project description:',
        default: 'A hackathon project'
      }
    ];

    const answers = await inquirer.prompt(questions);
    const stackConfig = STACKS[answers.stack];

    return {
      ...answers,
      ...stackConfig
    };
  }

  validateConfig() {
    console.log(chalk.yellow('⚡ Validating configuration...'));

    // Fail fast on invalid project name
    if (fs.existsSync(this.config.projectName)) {
      console.error(chalk.red(`❌ Directory '${this.config.projectName}' already exists!`));
      process.exit(1);
    }

    // Validate stack/framework exists
    if (!this.config.type) {
      console.error(chalk.red('❌ Invalid stack configuration - missing type!'));
      process.exit(1);
    }

    console.log(chalk.green('✓ Configuration valid'));
  }

  async createProjectStructure() {
    console.log(chalk.yellow('📁 Creating project structure...'));

    const { projectName, type } = this.config;
    this.projectPath = path.resolve(process.cwd(), projectName);

    // Create root directory
    fs.mkdirSync(this.projectPath);

    // Create subdirectories based on project type
    if (type === 'web') {
      fs.mkdirSync(path.join(this.projectPath, 'frontend'));
      fs.mkdirSync(path.join(this.projectPath, 'backend'));
    }
    // For other types, the template will handle directory structure

    console.log(chalk.green('✓ Project structure created'));
  }

  async generateProject() {
    const { type } = this.config;

    switch (type) {
      case 'web':
        await this.generateWebProject();
        break;
      case 'mobile':
      case 'cli':
      case 'desktop':
      case 'infrastructure':
      case 'datascience':
      case 'game':
      case 'backend':
        await this.generateSingleTemplateProject();
        break;
      default:
        console.error(chalk.red(`❌ Unknown project type: ${type}`));
        process.exit(1);
    }
  }

  async generateWebProject() {
    // For web projects with frontend/backend
    if (this.config.framework) {
      // Fullstack framework like Next.js
      await this.generateFullstackProject();
    } else {
      // Separate frontend and backend
      await this.generateFrontend();
      await this.generateBackend();
    }
  }

  async generateFullstackProject() {
    console.log(chalk.yellow('🌐 Generating fullstack project...'));

    const template = templates.getFullstackTemplate(this.config.framework, this.config);
    this.writeTemplateFiles(this.projectPath, template);

    console.log(chalk.green('✓ Fullstack project generated'));
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

    this.writeTemplateFiles(this.projectPath, template);

    console.log(chalk.green(`✓ ${type.charAt(0).toUpperCase() + type.slice(1)} project generated`));
  }

  writeTemplateFiles(basePath, template) {
    // Write package.json if exists
    if (template.packageJson) {
      fs.writeFileSync(
        path.join(basePath, 'package.json'),
        JSON.stringify(template.packageJson, null, 2)
      );
    }

    // Write requirements.txt if exists
    if (template.requirements) {
      fs.writeFileSync(
        path.join(basePath, 'requirements.txt'),
        template.requirements
      );
    }

    // Write all other files
    if (template.files) {
      Object.keys(template.files).forEach(fileName => {
        const filePath = path.join(basePath, fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, template.files[fileName]);
      });
    }
  }

  async generateFrontend() {
    console.log(chalk.yellow('⚛️  Generating frontend...'));

    const frontendPath = path.join(this.projectPath, 'frontend');
    const template = templates.getFrontendTemplate(this.config.frontend, this.config);

    // Write package.json
    fs.writeFileSync(
      path.join(frontendPath, 'package.json'),
      JSON.stringify(template.packageJson, null, 2)
    );

    // Create src directory
    fs.mkdirSync(path.join(frontendPath, 'src'));
    fs.mkdirSync(path.join(frontendPath, 'public'));

    // Write source files
    Object.keys(template.files).forEach(fileName => {
      const filePath = path.join(frontendPath, fileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, template.files[fileName]);
    });

    console.log(chalk.green('✓ Frontend generated'));
  }

  async generateBackend() {
    console.log(chalk.yellow('🔧 Generating backend...'));

    const backendPath = path.join(this.projectPath, 'backend');
    const template = templates.getBackendTemplate(this.config.backend, this.config);

    // Write package.json or requirements.txt
    if (template.packageJson) {
      fs.writeFileSync(
        path.join(backendPath, 'package.json'),
        JSON.stringify(template.packageJson, null, 2)
      );
    }

    if (template.requirements) {
      fs.writeFileSync(
        path.join(backendPath, 'requirements.txt'),
        template.requirements
      );
    }

    // Create src directory
    if (!fs.existsSync(path.join(backendPath, 'src'))) {
      fs.mkdirSync(path.join(backendPath, 'src'));
    }

    // Write source files
    Object.keys(template.files).forEach(fileName => {
      const filePath = path.join(backendPath, fileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, template.files[fileName]);
    });

    console.log(chalk.green('✓ Backend generated'));
  }

  async generateRootFiles() {
    console.log(chalk.yellow('📝 Generating root files...'));

    const { type } = this.config;

    // Generate README if template doesn't include one
    const readmePath = path.join(this.projectPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      const readme = this.generateReadme();
      fs.writeFileSync(readmePath, readme);
    }

    // Generate .gitignore if template doesn't include one
    const gitignorePath = path.join(this.projectPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const gitignore = this.generateGitignore();
      fs.writeFileSync(gitignorePath, gitignore);
    }

    // Generate root package.json with concurrently for web projects with separate frontend/backend
    if (type === 'web' && !this.config.framework) {
      const rootPackageJson = {
        name: this.config.projectName,
        version: "1.0.0",
        description: this.config.projectDescription,
        scripts: {},
        devDependencies: {
          "concurrently": "^8.2.2"
        }
      };

      const hasFrontend = fs.existsSync(path.join(this.projectPath, 'frontend'));
      const hasBackend = fs.existsSync(path.join(this.projectPath, 'backend'));

      if (hasFrontend && hasBackend) {
        let backendStart = "npm start";
        let backendDev = "npm run dev";
        
        const bType = this.config.backend;
        if (bType === 'fastapi' || bType === 'flask') {
          backendStart = "python src/main.py";
          backendDev = backendStart;
        } else if (bType === 'go-gin') {
          backendStart = "go run main.go";
          backendDev = backendStart;
        } else if (bType === 'spring-boot') {
          backendStart = "./mvnw spring-boot:run";
          backendDev = backendStart;
        }

        rootPackageJson.scripts.start = "concurrently \"npm:start:*\" --names \"backend,frontend\" --prefix-colors \"blue,magenta\"";
        rootPackageJson.scripts["start:backend"] = `cd backend && ${backendStart}`;
        rootPackageJson.scripts["start:frontend"] = "cd frontend && npm start";
        
        rootPackageJson.scripts.dev = "concurrently \"npm:dev:*\" --names \"backend,frontend\" --prefix-colors \"blue,magenta\"";
        rootPackageJson.scripts["dev:backend"] = `cd backend && ${backendDev}`;
        rootPackageJson.scripts["dev:frontend"] = "cd frontend && npm run dev";
      } else if (hasFrontend) {
        rootPackageJson.scripts.start = "cd frontend && npm start";
        rootPackageJson.scripts.dev = "cd frontend && npm run dev";
      } else if (hasBackend) {
        rootPackageJson.scripts.start = "cd backend && npm start";
        rootPackageJson.scripts.dev = "cd backend && npm run dev";
      }

      fs.writeFileSync(
        path.join(this.projectPath, 'package.json'),
        JSON.stringify(rootPackageJson, null, 2)
      );
    }

    // Generate run script for web projects (Unix only, skip on Windows)
    if (type === 'web' && !this.config.framework) {
      const runScript = this.generateRunScript();
      fs.writeFileSync(path.join(this.projectPath, 'run.sh'), runScript);
      if (process.platform !== 'win32') {
        try { fs.chmodSync(path.join(this.projectPath, 'run.sh'), '755'); } catch (e) { /* ignore on Windows */ }
      }
    }

    // Generate Docker Compose if both frontend and backend exist
    if (type === 'web' && !this.config.framework) {
      this.generateDockerCompose();
    }

    // Generate CI workflow
    this.generateGitHubCI();

    console.log(chalk.green('✓ Root files generated'));
  }

  generateDockerCompose() {
    console.log(chalk.yellow('🐳 Generating Docker Compose...'));
    const compose = `version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "${this.config.backend === 'fastapi' ? '8000:8000' : '5000:5000'}"
    environment:
      - DATABASE_URL=sqlite:///./data.db
    volumes:
      - ./backend:/app
      - /app/node_modules
      - /app/__pycache__
      - /app/venv

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
`;
    fs.writeFileSync(path.join(this.projectPath, 'docker-compose.yml'), compose);
  }

  generateGitHubCI() {
     const ci = `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: |
        if [ -f package.json ]; then npm install; fi
        if [ -d frontend ]; then cd frontend && npm install; fi
        if [ -d backend ] && [ -f backend/package.json ]; then cd backend && npm install; fi

    - name: Build
      run: |
        if [ -d frontend ]; then cd frontend && npm run build --if-present; fi
`;
    const workflowDir = path.join(this.projectPath, '.github', 'workflows');
    fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(path.join(workflowDir, 'ci.yml'), ci);
  }

  generateGitignore() {
    return `# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
.env

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
.DS_Store
`;
  }

  generateReadme() {
    const { type, category, name } = this.config;
    
    if (type !== 'web') {
      // For non-web projects, provide a simple README
      return `# ${this.config.projectName}

${this.config.projectDescription}

## Project Type

**${category}**: ${name}

## Getting Started

See the template-specific files for setup and usage instructions.

---

Generated by **MindCore · Forge** 🚀
`;
    }

    // For web projects, generate detailed README
    return `# ${this.config.projectName}

${this.config.projectDescription}

## Stack

- **Frontend**: ${this.config.frontend ? this.config.frontend.toUpperCase() : this.config.framework}
- **Backend**: ${this.config.backend ? this.config.backend.toUpperCase() : 'Integrated'}

## Project Structure

\`\`\`
${this.config.projectName}/
├── frontend/          # Frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/           # Backend API
│   ├── src/          # Source code
│   └── ${this.config.backend === 'fastapi' || this.config.backend === 'flask' || this.config.backend === 'django' ? 'requirements.txt' : 'package.json'}
├── README.md         # This file
└── run.sh            # Quick start script
\`\`\`

## Quick Start

### Prerequisites

${this.config.backend === 'fastapi' || this.config.backend === 'flask' || this.config.backend === 'django'
  ? '- Python 3.8+ (with pip)\n- Node.js 14+ (with npm)'
  : this.config.backend === 'go-gin'
  ? '- Go 1.21+\n- Node.js 14+ (with npm)'
  : this.config.backend === 'spring-boot'
  ? '- Java 17+\n- Maven\n- Node.js 14+ (with npm)'
  : '- Node.js 14+ (with npm)'}

### Installation & Run

\`\`\`bash
# Make the run script executable (if not already)
chmod +x run.sh

# Run the entire stack
./run.sh
\`\`\`

### Manual Setup

#### Frontend

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

The frontend will be available at http://localhost:3000

#### Backend

\`\`\`bash
cd backend
${this.config.backend === 'fastapi' || this.config.backend === 'flask' || this.config.backend === 'django'
  ? `python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python ${this.config.backend === 'django' ? 'manage.py runserver 5000' : (this.config.backend === 'flask' ? 'app.py' : 'src/main.py')}`
  : this.config.backend === 'go-gin'
  ? `go mod download
go run main.go`
  : this.config.backend === 'spring-boot'
  ? `./mvnw spring-boot:run`
  : `npm install
npm start`}
\`\`\`

The backend will be available at http://localhost:5000

## Development

### Frontend
- Development server: \`npm start\`
- Build: \`npm run build\`

### Backend
- Development server: See backend README

## API Endpoints

- \`GET /api/health\` - Health check endpoint
- \`GET /api/data\` - Sample data endpoint

## Notes

This project was generated using **MindCore · Forge**, a hackathon project bootstrapper.

---

**Happy Hacking! 🚀**
`;
  }

  generateRunScript() {
    const isFastAPI = this.config.backend === 'fastapi';
    
    return `#!/bin/bash

echo "🔨 MindCore · Forge - Starting your hackathon project..."
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
${isFastAPI ? `
if ! command_exists python3; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi
` : ''}

if ! command_exists node; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✓ Prerequisites check passed"
echo ""

# Install and run backend
echo "🔧 Starting backend..."
cd backend

${isFastAPI ? `
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python src/main.py &
` : `
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi
npm start &
`}

BACKEND_PID=$!
cd ..

echo "✓ Backend started (PID: $BACKEND_PID)"
echo ""

# Install and run frontend
echo "⚛️  Starting frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

npm start &
FRONTEND_PID=$!
cd ..

echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "=========================================="
echo "🚀 Your hackathon project is running!"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:${isFastAPI ? '8000' : '5000'}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
`;
  }

  async installDependencies() {
    if (this.config.skipInstall) {
      console.log(chalk.yellow('\n⚠ Skipping dependency installation (--skip-install used)'));
      console.log(chalk.gray('  You will need to run dependency installation commands manually later.\n'));
      return;
    }

    console.log(chalk.yellow('📦 Installing dependencies...'));
    console.log(chalk.gray('This may take a few minutes...\n'));

    const { type } = this.config;

    try {
      if (type === 'web' && !this.config.framework) {
        // Traditional frontend/backend split
        await this.installWebDependencies();
      } else {
        // Single project dependencies
        await this.installSingleProjectDependencies();
      }

      console.log(chalk.green('\n✓ All dependencies installed'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to install dependencies'));
      console.log(chalk.yellow('\nNote: You can manually install dependencies later'));
      // Don't throw - let the process complete
    }
  }

  async installWebDependencies() {
    // Install frontend dependencies
    if (fs.existsSync(path.join(this.projectPath, 'frontend/package.json'))) {
      console.log(chalk.cyan('Installing frontend dependencies...'));
      execSync('npm install', {
        cwd: path.join(this.projectPath, 'frontend'),
        stdio: 'inherit'
      });
    }

    // Install backend dependencies
    const backendPath = path.join(this.projectPath, 'backend');
    if (fs.existsSync(path.join(backendPath, 'requirements.txt'))) {
      console.log(chalk.cyan('\nInstalling backend dependencies (Python)...'));
      
      // Create virtual environment
      execSync(process.platform === 'win32' ? 'python -m venv venv' : 'python3 -m venv venv', {
        cwd: backendPath,
        stdio: 'inherit'
      });

      // Install requirements
      const pipInstall = process.platform === 'win32'
        ? 'venv\\Scripts\\pip install -r requirements.txt'
        : 'venv/bin/pip install -r requirements.txt';
      
      execSync(pipInstall, {
        cwd: backendPath,
        stdio: 'inherit'
      });
    } else if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      console.log(chalk.cyan('\nInstalling backend dependencies...'));
      execSync('npm install', {
        cwd: backendPath,
        stdio: 'inherit'
      });
    } else if (fs.existsSync(path.join(backendPath, 'go.mod'))) {
      console.log(chalk.cyan('\nInstalling backend dependencies (Go)...'));
      execSync('go mod download', {
        cwd: backendPath,
        stdio: 'inherit'
      });
    }
  }

  async installSingleProjectDependencies() {
    const pkgPath = path.join(this.projectPath, 'package.json');
    const reqPath = path.join(this.projectPath, 'requirements.txt');
    const goModPath = path.join(this.projectPath, 'go.mod');
    const cargoPath = path.join(this.projectPath, 'Cargo.toml');
    const pubspecPath = path.join(this.projectPath, 'pubspec.yaml');

    if (fs.existsSync(pkgPath)) {
      console.log(chalk.cyan('Installing Node.js dependencies...'));
      execSync('npm install', {
        cwd: this.projectPath,
        stdio: 'inherit'
      });
    }

    if (fs.existsSync(reqPath)) {
      console.log(chalk.cyan('Installing Python dependencies...'));
      execSync(process.platform === 'win32' ? 'python -m venv venv' : 'python3 -m venv venv', {
        cwd: this.projectPath,
        stdio: 'inherit'
      });
      
      const pipInstall = process.platform === 'win32'
        ? 'venv\\Scripts\\pip install -r requirements.txt'
        : 'venv/bin/pip install -r requirements.txt';
      
      execSync(pipInstall, {
        cwd: this.projectPath,
        stdio: 'inherit'
      });
    }

    if (fs.existsSync(goModPath)) {
      console.log(chalk.cyan('Installing Go dependencies...'));
      execSync('go mod download', {
        cwd: this.projectPath,
        stdio: 'inherit'
      });
    }

    if (fs.existsSync(cargoPath)) {
      console.log(chalk.cyan('Installing Rust dependencies...'));
      execSync('cargo build', {
        cwd: this.projectPath,
        stdio: 'inherit'
      });
    }

    if (fs.existsSync(pubspecPath)) {
      console.log(chalk.cyan('Installing Flutter dependencies...'));
      execSync('flutter pub get', {
        cwd: this.projectPath,
        stdio: 'inherit'
      });
    }
  }

  printSuccessMessage() {
    console.log('');
    console.log(chalk.green.bold('✨ Success! Your hackathon project is ready!'));
    console.log('');
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  1. cd ${this.config.projectName}`));
    
    const { type } = this.config;
    if (type === 'web' && !this.config.framework) {
      console.log(chalk.white('  2. npm start'));
      console.log(chalk.gray('     (or ./run.sh on Linux/macOS)'));
    } else {
      console.log(chalk.white('  2. Check README.md for instructions'));
    }
    
    console.log('');
    console.log(chalk.gray('Happy hacking! 🚀'));
    console.log('');
  }
}

module.exports = {
  run: async (flags) => {
    const forge = new MindCoreForge();
    await forge.run(flags);
  },

  generate: async (options) => {
    const { projectName, stack: stackKey, projectDescription, dryRun, skipInstall, jsonOutput } = options;

    // Validate project name
    if (!/^[a-z0-9-]+$/.test(projectName)) {
      throw new Error('Project name must be lowercase alphanumeric with hyphens only');
    }
    // Security: Prevent path traversal
    if (projectName.includes('..') || projectName.includes('/') || projectName.includes('\\')) {
      throw new Error('Project name cannot contain paths or forbidden characters');
    }

    // Validate stack exists
    const stackConfig = STACKS[stackKey];
    if (!stackConfig) {
      const available = Object.keys(STACKS).join(', ');
      throw new Error(`Unknown stack: "${stackKey}". Available stacks: ${available}`);
    }

    const config = {
      projectName,
      projectDescription: projectDescription || 'A hackathon project',
      stack: stackKey,
      skipInstall,
      ...stackConfig
    };

    if (dryRun) {
      const result = {
        projectName,
        stack: stackKey,
        stackName: stackConfig.name,
        type: stackConfig.type,
        category: stackConfig.category,
        description: projectDescription,
        directory: path.resolve(process.cwd(), projectName),
      };

      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.cyan.bold('\n🔨 MindCore · Forge (dry run)'));
        console.log(chalk.gray('No files will be created.\n'));
        console.log(chalk.white(`  Project:     ${projectName}`));
        console.log(chalk.white(`  Stack:       ${stackConfig.name}`));
        console.log(chalk.white(`  Type:        ${stackConfig.type}`));
        console.log(chalk.white(`  Category:    ${stackConfig.category}`));
        console.log(chalk.white(`  Directory:   ${result.directory}`));
      }
      return result;
    }

    const forge = new MindCoreForge();
    forge.config = config;

    if (!jsonOutput) {
      console.log(chalk.cyan.bold('\n🔨 MindCore · Forge'));
      console.log(chalk.gray('Hackathon project bootstrapper\n'));
    }

    forge.validateConfig();
    await forge.createProjectStructure();
    await forge.generateProject();
    await forge.generateRootFiles();
    await forge.installDependencies();

    const result = {
      projectName,
      stack: stackKey,
      stackName: stackConfig.name,
      type: stackConfig.type,
      category: stackConfig.category,
      directory: forge.projectPath,
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
    Object.entries(STACKS).forEach(([key, stack]) => {
      const category = stack.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = {};
      }
      grouped[category][key] = {
        name: stack.name,
        description: stack.description,
        type: stack.type,
      };
    });
    return grouped;
  },

  MindCoreForge
};
