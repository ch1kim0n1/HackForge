# 🔨 MindCore · Forge

MindCore's open source hackathon oriented software. A comprehensive, deterministic, CLI-only hackathon scaffold generator that supports **30+ templates** across diverse hackathon use cases - from web apps to mobile, CLI tools, infrastructure, data science, and games.

## Features

✨ **CLI-First**: Simple interactive prompts to get you started  
🎯 **Deterministic**: Same inputs always generate the same output  
⚡ **Zero Setup Churn**: Generated projects compile and run immediately  
🏗️ **Multi-Domain**: Web, mobile, CLI, infrastructure, data science, games  
📦 **Dependencies Included**: Everything installed and ready to go  
🚫 **No Bloat**: Focus on what matters for hackathons  
📝 **Auto-Generated Docs**: README and scripts created for you

## Supported Templates (30+)

### Web Full-Stack (10)

- **React + Express** - Modern React SPA with Express REST API
- **Vue.js + Express** - Vue.js SPA with Express REST API
- **Angular + Express** - Angular SPA with Express REST API
- **Svelte + Express** - Svelte SPA with Express REST API
- **Vanilla JS + Express** - Pure JavaScript with Express REST API
- **Next.js** - Fullstack React framework with API routes
- **React + FastAPI** - React SPA with Python FastAPI backend
- **React + Flask** - React SPA with Python Flask backend
- **Vue + Django** - Vue.js SPA with Django REST API
- **React + Go/Gin** - React SPA with Go Gin backend

### Mobile Applications (4)

- **React Native** - Cross-platform mobile with Expo
- **Flutter** - Cross-platform mobile with Dart
- **Swift iOS** - Native iOS with SwiftUI
- **Kotlin Android** - Native Android with Jetpack Compose

### CLI & Desktop (4)

- **Go CLI** - Command-line tool with Cobra
- **Python CLI** - Command-line tool with Click
- **Rust CLI** - Fast CLI tool with Clap
- **Electron** - Cross-platform desktop app

### Infrastructure/DevOps (4)

- **Terraform + AWS** - Infrastructure as code for AWS
- **Kubernetes** - Container orchestration manifests
- **Docker Compose** - Multi-container application stack
- **Ansible** - Configuration management playbooks

### Data Science/ML (3)

- **Python + Jupyter** - Data science notebooks
- **Python + PyTorch** - Machine learning with PyTorch
- **Python + TensorFlow** - Machine learning with TensorFlow/Keras

### Game Development (2)

- **Pygame** - 2D games in Python
- **Phaser.js** - Browser-based games

### Backend APIs (3)

- **Spring Boot** - Java REST API
- **Ruby on Rails API** - Rails API-only backend
- **Phoenix** - Elixir Phoenix REST API

## Installation

```bash
# Clone the repository
git clone https://github.com/ch1kim0n1/HackForge.git
cd HackForge

# Install dependencies
npm install
```

## Usage

### Interactive Mode (Recommended)

```bash
# Run the forge tool
node bin/forge.js

# Or if installed globally
npm link
forge
```

The tool will prompt you for:

1. **Project name** - lowercase alphanumeric with hyphens only
2. **Stack/Template choice** - select from 30+ templates organized by category
3. **Project description** - brief description of your hackathon project

### Non-Interactive Mode

Skip prompts and generate directly:

```bash
# Generate with all options specified
forge --name my-app --stack "React + Express" --description "A real-time chat app"

# List all available stacks
forge --list-stacks

# Dry run (validate without creating files)
forge --name test-app --stack "Vue.js + Express" --description "Test" --dry-run

# JSON output (for automation)
forge --name api-service --stack "Spring Boot" --description "REST API" --json
```

**Non-interactive options:**

- `-n, --name <name>` - Project name (lowercase alphanumeric with hyphens)
- `-s, --stack <stack>` - Stack/template name (use `--list-stacks` to see all)
- `-d, --description <desc>` - Project description
- `--list-stacks` - Show all available templates
- `--dry-run` - Validate configuration without creating files
- `--json` - Output progress as JSON (useful for CI/CD)
- `-h, --help` - Show help message

## What Gets Generated

The structure varies by project type:

### Web Projects (with frontend/backend)

```
your-project/
├── frontend/          # Frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Dependencies
├── backend/           # Backend API
│   ├── src/          # Source code
│   └── package.json  # Dependencies (or requirements.txt, go.mod, etc.)
├── README.md         # Auto-generated documentation
├── .gitignore        # Sensible defaults
└── run.sh            # One-command startup script
```

### Other Project Types

Mobile, CLI, infrastructure, data science, and game projects get a single-root structure optimized for that project type with all necessary configuration files, skeleton code, and dependencies.

## Generated Project Features

Each generated project includes:

- ✅ **Working skeleton code** that compiles/runs immediately
- ✅ **All dependencies** configured (package.json, requirements.txt, etc.)
- ✅ **Development scripts** for running, building, testing
- ✅ **Complete README** with setup and usage instructions
- ✅ **Sensible .gitignore** for the technology stack
- ✅ **Project-specific** configuration files

## Quick Start (Generated Projects)

After generating a web project:

```bash
cd your-project
./run.sh  # For web projects with frontend/backend
```

For other project types, see the generated README for specific instructions.

## Language & Framework Coverage

**20+ Languages Supported:**  
JavaScript, TypeScript, Python, Go, Rust, Java, Ruby, Elixir, Kotlin, Swift, Dart, HCL (Terraform), and more

**20+ Frameworks/Tools:**  
React, Vue, Angular, Svelte, Next.js, Express, FastAPI, Flask, Django, Gin, Spring Boot, Rails, Phoenix, React Native, Flutter, Pygame, Phaser, Terraform, Kubernetes, Docker, Ansible, and more

## Philosophy

MindCore · Forge is built on these principles:

1. **Speed First**: Get coding in seconds, not hours
2. **Comprehensive**: Support diverse hackathon projects
3. **Deterministic**: Predictable, reproducible output
4. **Fail Fast**: Invalid configs are rejected immediately
5. **No Surprises**: Generated code compiles and runs immediately
6. **Local Only**: No external dependencies or services required

## Testing

```bash
# Run the test suite
npm test
```

## Requirements

**For the forge tool:**

- Node.js 14+ (with npm)

**For generated projects (depends on template):**

- Node.js 14+ (web, mobile, CLI, games)
- Python 3.8+ (FastAPI, Flask, Django, ML, data science)
- Go 1.21+ (Go CLI, Go backend)
- Rust 1.70+ (Rust CLI)
- Java 17+ (Spring Boot)
- Ruby 3.2+ (Rails)
- Elixir 1.15+ (Phoenix)
- Flutter SDK (Flutter mobile)
- Android Studio (Kotlin Android)
- Xcode (Swift iOS)

## Development

```bash
# Test the forge tool locally
node bin/forge.js

# Run tests
npm test
```

## What MindCore · Forge Focuses On

**Included:**

- ✅ Diverse project templates (30+)
- ✅ Multi-language support (20+)
- ✅ Working skeleton code
- ✅ Dependency management
- ✅ Development scripts
- ✅ Documentation generation

**Intentionally Excluded** (add as needed for your hackathon):

- ❌ Authentication/authorization scaffolding
- ❌ Database schemas and migrations
- ❌ Cloud deployment configurations
- ❌ CI/CD pipelines
- ❌ Advanced security configurations
- ❌ Production optimizations

MindCore · Forge gets you **started fast** - you add the specifics your hackathon project needs.

## License

MIT

---

**Built for hackathons. Ready to code. 🚀**
