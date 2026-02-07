# Quick Start Guide

Get started with MindCore · Forge in under 5 minutes.

## Installation

```bash
git clone https://github.com/ch1kim0n1/HackForge.git
cd HackForge
npm install
```

## Create Your First Project

```bash
# Run the forge tool
node bin/forge.js
```

Answer the prompts:
- **Project name**: `my-first-project` (lowercase with hyphens)
- **Stack**: Choose any (React + Express recommended)
- **Description**: Brief description of your project

## What Happens Next

MindCore · Forge will:
1. ✅ Validate your configuration
2. ✅ Create project structure
3. ✅ Generate frontend code
4. ✅ Generate backend code
5. ✅ Install all dependencies
6. ✅ Create run script and docs

This takes 1-2 minutes.

## Run Your Project

```bash
cd my-first-project
./run.sh
```

Open your browser:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000 (or 8000 for FastAPI)

You should see a working app with API integration!

## What You Get

Your project includes:
- ✅ Working frontend with beautiful UI
- ✅ Working backend with REST API
- ✅ Health check endpoint
- ✅ Sample data endpoint
- ✅ All dependencies installed
- ✅ README with instructions
- ✅ One-command startup script

## Next Steps

1. Open the project in your editor
2. Modify `frontend/src/App.js` to customize the UI
3. Modify `backend/src/index.js` to add API endpoints
4. Add features specific to your hackathon project

## Stack Options

Choose based on your preferences:

### React + Express (Recommended)
- Modern, popular, lots of resources
- Great for full-featured web apps

### Vue.js + Express
- Similar to React, simpler syntax
- Great if you prefer Vue

### Vanilla JS + Express
- Pure JavaScript, no framework
- Lightweight, full control

### React + FastAPI
- Python backend with automatic API docs
- Great for data/ML projects

## Common Tasks

### Add a new API endpoint
Edit `backend/src/index.js`:
```javascript
app.get('/api/myendpoint', (req, res) => {
  res.json({ message: 'My data' });
});
```

### Add a new frontend component
Create `frontend/src/MyComponent.js`:
```javascript
function MyComponent() {
  return <div>My Component</div>;
}
export default MyComponent;
```

### Install a new package
```bash
cd frontend  # or backend
npm install package-name
```

## Troubleshooting

**Port in use?**
```bash
kill $(lsof -ti:3000)  # Frontend
kill $(lsof -ti:5000)  # Backend
```

**Need to reinstall?**
```bash
cd frontend  # or backend
rm -rf node_modules
npm install
```

## Philosophy

MindCore · Forge follows these principles:

1. **Speed First** - Get coding immediately
2. **Opinionated** - Limited, tested choices
3. **Deterministic** - Predictable output
4. **Fail Fast** - Clear error messages
5. **No Surprises** - Everything just works

## More Info

- Full documentation: See README.md
- Usage examples: See USAGE.md
- Run demo: `bash demo.sh`
- Run tests: `npm test`

---

**Happy hacking! 🚀**
