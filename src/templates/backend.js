function express(config) {
  return {
    packageJson: {
      name: `${config.projectName}-backend`,
      version: "1.0.0",
      main: "src/index.js",
      scripts: {
        start: "node src/index.js",
        dev: "node --watch src/index.js"
      },
      dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5"
      }
    },
    files: {
      'src/index.js': `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '${config.projectName}-backend'
  });
});

// Sample data endpoint
app.get('/api/data', (req, res) => {
  res.json({
    message: 'Hello from ${config.projectName} API!',
    description: '${config.projectDescription}',
    stack: {
      frontend: '${config.frontend}',
      backend: 'express'
    },
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: 'Sample Item 1', value: 42 },
      { id: 2, name: 'Sample Item 2', value: 84 },
      { id: 3, name: 'Sample Item 3', value: 126 }
    ]
  });
});

// Example POST endpoint
app.post('/api/data', (req, res) => {
  const { name, value } = req.body;
  
  if (!name || !value) {
    return res.status(400).json({
      error: 'Missing required fields: name and value'
    });
  }

  res.status(201).json({
    message: 'Data created successfully',
    data: {
      id: Date.now(),
      name,
      value,
      createdAt: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: \`Route \${req.method} \${req.path} not found\`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Backend server running on http://localhost:\${PORT}\`);
  console.log(\`📍 Health check: http://localhost:\${PORT}/api/health\`);
  console.log(\`📍 Data endpoint: http://localhost:\${PORT}/api/data\`);
});`
    }
  };
}

function fastapi(config) {
  return {
    requirements: `fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0`,
    files: {
      'src/main.py': `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="${config.projectName} API",
    description="${config.projectDescription}",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class DataItem(BaseModel):
    id: int
    name: str
    value: int

class CreateDataItem(BaseModel):
    name: str
    value: int

class DataResponse(BaseModel):
    message: str
    description: str
    stack: dict
    timestamp: str
    data: List[DataItem]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str

class CreateResponse(BaseModel):
    message: str
    data: dict

# Routes
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "${config.projectName}-backend"
    }

@app.get("/api/data", response_model=DataResponse)
async def get_data():
    """Get sample data"""
    return {
        "message": "Hello from ${config.projectName} API!",
        "description": "${config.projectDescription}",
        "stack": {
            "frontend": "${config.frontend}",
            "backend": "fastapi"
        },
        "timestamp": datetime.now().isoformat(),
        "data": [
            {"id": 1, "name": "Sample Item 1", "value": 42},
            {"id": 2, "name": "Sample Item 2", "value": 84},
            {"id": 3, "name": "Sample Item 3", "value": 126}
        ]
    }

@app.post("/api/data", response_model=CreateResponse, status_code=201)
async def create_data(item: CreateDataItem):
    """Create new data item"""
    return {
        "message": "Data created successfully",
        "data": {
            "id": int(datetime.now().timestamp() * 1000),
            "name": item.name,
            "value": item.value,
            "createdAt": datetime.now().isoformat()
        }
    }

if __name__ == "__main__":
    print("🚀 Starting FastAPI backend server...")
    print("📍 API docs: http://localhost:8000/docs")
    print("📍 Health check: http://localhost:8000/api/health")
    print("📍 Data endpoint: http://localhost:8000/api/data")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )`
    }
  };
}

module.exports = {
  express,
  fastapi
};
