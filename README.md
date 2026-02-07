# MindCore · Forge

MindCore's open source hackathon oriented software. An opinionated, deterministic, CLI-only hackathon scaffold generator used after the idea is chosen to eliminate setup churn and enforce a clean, scalable structure from minute one.

## Features

**CLI-First**: Simple interactive prompts to get you started  
**Deterministic**: Same inputs always generate the same output  
**Zero Setup Churn**: Generated projects compile and run immediately  
**Enforced Structure**: Clean frontend/backend separation  
**Dependencies Included**: Everything installed and ready to go  
**No Bloat**: No Docker, no auth, no game engines, no 3rd party APIs  
**Auto-Generated Docs**: README and scripts created for you

## Opinionated Stacks

MindCore · Forge supports these battle-tested stack combinations:

- **React + Express** - Modern React SPA with Express REST API
- **Vue.js + Express** - Vue.js SPA with Express REST API  
- **Vanilla JS + Express** - Pure JavaScript with Express REST API
- **React + FastAPI** - React SPA with Python FastAPI backend

## Installation

```bash
# Clone the repository
git clone https://github.com/ch1kim0n1/HackForge.git
cd HackForge

# Install dependencies
npm install
```

## Usage

```bash
# Run the forge tool
node bin/forge.js

# Or if installed globally
npm link
forge
```

The tool will prompt you for:
1. **Project name** - lowercase alphanumeric with hyphens only
2. **Stack choice** - select from the opinionated stack list
3. **Project description** - brief description of your hackathon project

## What Gets Generated

```
your-project/
├── frontend/          # Frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Dependencies
├── backend/           # Backend API
│   ├── src/          # Source code
│   └── package.json  # Dependencies (or requirements.txt for Python)
├── README.md         # Auto-generated documentation
├── .gitignore        # Sensible defaults
└── run.sh            # One-command startup script
```

## Generated Project Structure

Each generated project includes:

- ✅ **Working frontend** with API integration
- ✅ **Working backend** with sample endpoints
- ✅ **Health check endpoint** (`/api/health`)
- ✅ **Sample data endpoint** (`/api/data`)
- ✅ **Package scripts** for development
- ✅ **Run script** to start everything at once
- ✅ **Complete README** with setup instructions

## Quick Start (Generated Projects)

After generating a project:

```bash
cd your-project
./run.sh
```

That's it! Your frontend and backend will start automatically.

- Frontend: http://localhost:3000
- Backend: http://localhost:5000 (or 8000 for FastAPI)

## Philosophy

MindCore · Forge is built on these principles:

1. **Speed First**: Get coding in seconds, not hours
2. **Opinionated**: Limited choices = faster decisions
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

- Node.js 14+ (with npm)
- Python 3.8+ (only if using FastAPI backend)

## Development

```bash
# Test the forge tool locally
node bin/forge.js

# Run tests
npm test
```

## What MindCore · Forge Does NOT Include

By design, we exclude:
- ❌ Docker/containerization
- ❌ Authentication/authorization
- ❌ Game engines
- ❌ 3rd party API integrations
- ❌ Complex build configurations
- ❌ Database setup
- ❌ Cloud deployment configs

These are left for you to add based on your specific hackathon needs.

## License

MIT

---

**Built for hackathons. Ready to code. 🚀**
