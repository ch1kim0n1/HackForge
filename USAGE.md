# Usage Examples

This document shows examples of using MindCore · Forge to bootstrap hackathon projects.

## Interactive Mode (Recommended)

```bash
# Run the forge tool
node bin/forge.js
```

You'll be prompted for:

1. Project name (e.g., `my-awesome-hackathon`)
2. Stack choice (select from the list)
3. Project description

## Non-Interactive Mode

For automation, CI/CD, or when you already know what you want:

```bash
# Generate directly with all options
forge --name crypto-tracker --stack "React + Express" --description "A cryptocurrency price tracker"

# List all available stacks/templates
forge --list-stacks

# Validate configuration without creating files
forge --name test-project --stack "Next.js" --description "Test" --dry-run

# JSON output for scripting
forge --name my-api --stack "Spring Boot" --description "REST API service" --json
```

### Non-Interactive Options

- `-n, --name <name>` - Project name (lowercase, alphanumeric, hyphens only)
- `-s, --stack <stack>` - Stack/template name (see `--list-stacks`)
- `-d, --description <desc>` - Brief project description
- `--list-stacks` - Display all available templates
- `--dry-run` - Validate inputs without creating files
- `--json` - Output as JSON (for automation)
- `-h, --help` - Show help message

## Example Session (Interactive)

```
🔨 MindCore · Forge
Hackathon project bootstrapper

? Project name: crypto-tracker
? Choose your stack: React + Express - Modern React SPA with Express REST API
? Brief project description: A cryptocurrency price tracker

⚡ Validating configuration...
✓ Configuration valid
📁 Creating project structure...
✓ Project structure created
⚛️  Generating frontend...
✓ Frontend generated
🔧 Generating backend...
✓ Backend generated
📝 Generating root files...
✓ Root files generated
📦 Installing dependencies...
✓ All dependencies installed

✨ Success! Your hackathon project is ready!

Next steps:
  1. cd crypto-tracker
  2. ./run.sh

Happy hacking! 🚀
```

## What Gets Created

After running the tool, you'll have a complete project:

```
crypto-tracker/
├── README.md              # Auto-generated documentation
├── .gitignore            # Sensible defaults
├── run.sh                # One-command startup
├── frontend/
│   ├── package.json      # React dependencies
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js      # Entry point
│       ├── App.js        # Main component with API integration
│       ├── App.css       # Styling
│       └── index.css
└── backend/
    ├── package.json      # Express dependencies
    └── src/
        └── index.js      # API server with endpoints
```

## Running Your Project

### Quick Start (Recommended)

```bash
cd crypto-tracker
./run.sh
```

This starts both frontend and backend automatically.

### Manual Start

#### Frontend

```bash
cd frontend
npm install  # Already done if you used the forge installer
npm start
```

Frontend runs at: http://localhost:3000

#### Backend

```bash
cd backend
npm install  # Already done if you used the forge installer
npm start
```

Backend runs at: http://localhost:5000

## Available Stacks

### 1. React + Express

- **Frontend**: React 18 with create-react-app setup
- **Backend**: Express.js with CORS enabled
- **Best for**: Modern single-page applications

### 2. Vue.js + Express

- **Frontend**: Vue 3 with Vue CLI
- **Backend**: Express.js with CORS enabled
- **Best for**: Component-based SPAs with Vue

### 3. Vanilla JS + Express

- **Frontend**: Pure JavaScript with http-server
- **Backend**: Express.js with CORS enabled
- **Best for**: Lightweight projects, learning, or when you want full control

### 4. React + FastAPI

- **Frontend**: React 18 with create-react-app setup
- **Backend**: Python FastAPI with automatic API docs
- **Best for**: Data science, ML projects, or Python-first teams

## API Endpoints (All Stacks)

Every generated project includes:

- `GET /api/health` - Health check endpoint

  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "service": "your-project-backend"
  }
  ```

- `GET /api/data` - Sample data endpoint

  ```json
  {
    "message": "Hello from your-project API!",
    "data": [...]
  }
  ```

- `POST /api/data` - Sample POST endpoint
  - Accepts: `{ "name": "string", "value": number }`
  - Returns: Created object with ID and timestamp

## Customization

After generation, customize your project:

1. **Update API endpoints** in `backend/src/index.js` or `backend/src/main.py`
2. **Modify frontend** in `frontend/src/App.js` or `frontend/src/App.vue`
3. **Add dependencies** via `npm install` or `pip install`
4. **Update styling** in CSS files
5. **Add routes, components, services** as needed

## Tips for Hackathons

1. **Start with the generated structure** - it works out of the box
2. **Use the health check endpoint** to verify your backend is running
3. **The frontend already has API integration** - just modify the endpoints
4. **Focus on features, not setup** - that's why MindCore · Forge exists
5. **Add dependencies as needed** - the base is intentionally minimal

## Troubleshooting

### Port already in use

```bash
# Kill processes on port 3000 or 5000
kill $(lsof -ti:3000)
kill $(lsof -ti:5000)
```

### Dependencies not installing

```bash
# Clear npm cache and reinstall
cd frontend  # or backend
rm -rf node_modules package-lock.json
npm install
```

### Backend not connecting to frontend

- Check that CORS is enabled (it is by default)
- Verify the backend URL in your frontend code
- Make sure both servers are running

## Advanced: Adding Features

### Database Integration

```bash
# In backend directory
npm install sqlite3  # or mongoose, pg, etc.
```

### State Management (React)

```bash
# In frontend directory
npm install redux react-redux  # or zustand, jotai, etc.
```

### UI Components

```bash
# In frontend directory
npm install @mui/material  # or ant-design, chakra-ui, etc.
```

## Getting Help

- Check the generated README.md in your project
- Read the code - it's intentionally simple and well-structured
- All templates are in the `src/templates/` directory

---

**Built for hackathons. Ready to code. 🚀**
