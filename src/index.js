const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const templates = require('./templates');

// Opinionated stacks - deterministic and tested
const STACKS = {
  'react-express': {
    name: 'React + Express',
    frontend: 'react',
    backend: 'express',
    description: 'Modern React SPA with Express REST API'
  },
  'vue-express': {
    name: 'Vue.js + Express',
    frontend: 'vue',
    backend: 'express',
    description: 'Vue.js SPA with Express REST API'
  },
  'vanilla-express': {
    name: 'Vanilla JS + Express',
    frontend: 'vanilla',
    backend: 'express',
    description: 'Vanilla JavaScript with Express REST API'
  },
  'react-fastapi': {
    name: 'React + FastAPI',
    frontend: 'react',
    backend: 'fastapi',
    description: 'React SPA with Python FastAPI backend'
  }
};

class MindCoreForge {
  constructor() {
    this.projectPath = null;
    this.config = null;
  }

  async run() {
    console.log(chalk.cyan.bold('\n🔨 MindCore · Forge'));
    console.log(chalk.gray('Hackathon project bootstrapper\n'));

    // Get project configuration
    this.config = await this.getConfiguration();

    // Validate configuration
    this.validateConfig();

    // Create project structure
    await this.createProjectStructure();

    // Generate frontend
    await this.generateFrontend();

    // Generate backend
    await this.generateBackend();

    // Generate root files
    await this.generateRootFiles();

    // Install dependencies
    await this.installDependencies();

    // Final message
    this.printSuccessMessage();
  }

  async getConfiguration() {
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
        choices: Object.keys(STACKS).map(key => ({
          name: `${STACKS[key].name} - ${STACKS[key].description}`,
          value: key
        }))
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

    // Validate stack exists
    if (!this.config.frontend || !this.config.backend) {
      console.error(chalk.red('❌ Invalid stack configuration!'));
      process.exit(1);
    }

    console.log(chalk.green('✓ Configuration valid'));
  }

  async createProjectStructure() {
    console.log(chalk.yellow('📁 Creating project structure...'));

    const { projectName } = this.config;
    this.projectPath = path.resolve(process.cwd(), projectName);

    // Create root directory
    fs.mkdirSync(this.projectPath);

    // Create frontend and backend directories
    fs.mkdirSync(path.join(this.projectPath, 'frontend'));
    fs.mkdirSync(path.join(this.projectPath, 'backend'));

    console.log(chalk.green('✓ Project structure created'));
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

    // Generate README
    const readme = this.generateReadme();
    fs.writeFileSync(path.join(this.projectPath, 'README.md'), readme);

    // Generate .gitignore
    const gitignore = `# Dependencies
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
    fs.writeFileSync(path.join(this.projectPath, '.gitignore'), gitignore);

    // Generate run scripts
    const runScript = this.generateRunScript();
    fs.writeFileSync(path.join(this.projectPath, 'run.sh'), runScript);
    fs.chmodSync(path.join(this.projectPath, 'run.sh'), '755');

    console.log(chalk.green('✓ Root files generated'));
  }

  generateReadme() {
    return `# ${this.config.projectName}

${this.config.projectDescription}

## Stack

- **Frontend**: ${this.config.frontend.toUpperCase()}
- **Backend**: ${this.config.backend.toUpperCase()}

## Project Structure

\`\`\`
${this.config.projectName}/
├── frontend/          # Frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/           # Backend API
│   ├── src/          # Source code
│   └── ${this.config.backend === 'fastapi' ? 'requirements.txt' : 'package.json'}
├── README.md         # This file
└── run.sh            # Quick start script
\`\`\`

## Quick Start

### Prerequisites

${this.config.backend === 'fastapi' 
  ? '- Python 3.8+ (with pip)\n- Node.js 14+ (with npm)'
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
${this.config.backend === 'fastapi' 
  ? `python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python src/main.py`
  : `npm install
npm start`}
\`\`\`

The backend will be available at http://localhost:${this.config.backend === 'fastapi' ? '8000' : '5000'}

## Development

### Frontend
- Development server: \`npm start\`
- Build: \`npm run build\`

### Backend
- Development server: \`npm start\` ${this.config.backend === 'fastapi' ? 'or `python src/main.py`' : ''}

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
    console.log(chalk.yellow('📦 Installing dependencies...'));
    console.log(chalk.gray('This may take a few minutes...\n'));

    try {
      // Install frontend dependencies
      console.log(chalk.cyan('Installing frontend dependencies...'));
      execSync('npm install', {
        cwd: path.join(this.projectPath, 'frontend'),
        stdio: 'inherit'
      });

      // Install backend dependencies
      if (this.config.backend === 'fastapi') {
        console.log(chalk.cyan('\nInstalling backend dependencies (Python)...'));
        
        // Create virtual environment
        execSync('python3 -m venv venv', {
          cwd: path.join(this.projectPath, 'backend'),
          stdio: 'inherit'
        });

        // Install requirements
        const pipInstall = process.platform === 'win32'
          ? 'venv\\Scripts\\pip install -r requirements.txt'
          : 'venv/bin/pip install -r requirements.txt';
        
        execSync(pipInstall, {
          cwd: path.join(this.projectPath, 'backend'),
          stdio: 'inherit'
        });
      } else {
        console.log(chalk.cyan('\nInstalling backend dependencies...'));
        execSync('npm install', {
          cwd: path.join(this.projectPath, 'backend'),
          stdio: 'inherit'
        });
      }

      console.log(chalk.green('\n✓ All dependencies installed'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to install dependencies'));
      throw error;
    }
  }

  printSuccessMessage() {
    console.log('');
    console.log(chalk.green.bold('✨ Success! Your hackathon project is ready!'));
    console.log('');
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  1. cd ${this.config.projectName}`));
    console.log(chalk.white('  2. ./run.sh'));
    console.log('');
    console.log(chalk.gray('Happy hacking! 🚀'));
    console.log('');
  }
}

module.exports = {
  run: async () => {
    const forge = new MindCoreForge();
    await forge.run();
  }
};
