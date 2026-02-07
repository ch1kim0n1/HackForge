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
        cors: "^2.8.5",
        sqlite3: "^5.1.7"
      }
    },
    files: {
      'src/index.js': `const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database
const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('📦 Connected to SQLite database');
    initializeDatabase();
  }
});

// Create schema if not exists
function initializeDatabase() {
  db.run(\`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  \`, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('✅ Database schema ready');
      
      // Insert sample data if table is empty
      db.get('SELECT COUNT(*) as count FROM items', (err, row) => {
        if (!err && row.count === 0) {
          const stmt = db.prepare('INSERT INTO items (name, value) VALUES (?, ?)');
          stmt.run('Sample Item 1', 42);
          stmt.run('Sample Item 2', 84);
          stmt.run('Sample Item 3', 126);
          stmt.finalize(() => console.log('✅ Sample data inserted'));
        }
      });
    }
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '${config.projectName}-backend',
    database: 'sqlite'
  });
});

// GET all items (database-backed)
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error',
        message: err.message
      });
    }
    
    res.json({
      message: 'Hello from ${config.projectName} API!',
      description: '${config.projectDescription}',
      stack: {
        frontend: '${config.frontend}',
        backend: 'express',
        database: 'sqlite'
      },
      timestamp: new Date().toISOString(),
      data: rows
    });
  });
});

// GET single item by ID
app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        error: 'Database error',
        message: err.message
      });
    }
    
    if (!row) {
      return res.status(404).json({
        error: 'Not found',
        message: \`Item with id \${id} not found\`
      });
    }
    
    res.json(row);
  });
});

// POST create new item
app.post('/api/items', (req, res) => {
  const { name, value } = req.body;
  
  if (!name || value === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: name and value'
    });
  }

  db.run(
    'INSERT INTO items (name, value) VALUES (?, ?)',
    [name, value],
    function(err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          message: err.message
        });
      }
      
      db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({
            error: 'Database error',
            message: err.message
          });
        }
        
        res.status(201).json({
          message: 'Item created successfully',
          data: row
        });
      });
    }
  );
});

// PUT update item by ID
app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { name, value } = req.body;
  
  if (!name && value === undefined) {
    return res.status(400).json({
      error: 'At least one field (name or value) must be provided'
    });
  }
  
  const updates = [];
  const params = [];
  
  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (value !== undefined) {
    updates.push('value = ?');
    params.push(value);
  }
  
  params.push(id);
  
  db.run(
    \`UPDATE items SET \${updates.join(', ')} WHERE id = ?\`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          message: err.message
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: \`Item with id \${id} not found\`
        });
      }
      
      db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({
            error: 'Database error',
            message: err.message
          });
        }
        
        res.json({
          message: 'Item updated successfully',
          data: row
        });
      });
    }
  );
});

// DELETE item by ID
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({
        error: 'Database error',
        message: err.message
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: \`Item with id \${id} not found\`
      });
    }
    
    res.json({
      message: 'Item deleted successfully',
      deletedId: parseInt(id)
    });
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

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('📦 Database connection closed');
    }
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Backend server running on http://localhost:\${PORT}\`);
  console.log(\`📍 Health check: http://localhost:\${PORT}/api/health\`);
  console.log(\`📍 Items CRUD: http://localhost:\${PORT}/api/items\`);
  console.log(\`📊 Database: SQLite (./data.db)\`);
});`,
      'Dockerfile': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]`,
      '.dockerignore': `node_modules
npm-debug.log
data.db`
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
import sqlite3
from contextlib import contextmanager

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

# Database setup
DATABASE = "data.db"

@contextmanager
def get_db():
    """Database connection context manager"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initialize database schema"""
    with get_db() as conn:
        conn.execute(\`\`\`
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                value INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        \`\`\`)
        
        # Insert sample data if table is empty
        cursor = conn.execute('SELECT COUNT(*) FROM items')
        if cursor.fetchone()[0] == 0:
            conn.execute("INSERT INTO items (name, value) VALUES (?, ?)", ('Sample Item 1', 42))
            conn.execute("INSERT INTO items (name, value) VALUES (?, ?)", ('Sample Item 2', 84))
            conn.execute("INSERT INTO items (name, value) VALUES (?, ?)", ('Sample Item 3', 126))
            conn.commit()
            print("✅ Sample data inserted")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    print("📦 Initializing SQLite database...")
    init_db()
    print("✅ Database ready")

# Models
class Item(BaseModel):
    id: int
    name: str
    value: int
    created_at: Optional[str] = None

class CreateItem(BaseModel):
    name: str
    value: int

class UpdateItem(BaseModel):
    name: Optional[str] = None
    value: Optional[int] = None

class ItemsResponse(BaseModel):
    message: str
    description: str
    stack: dict
    timestamp: str
    data: List[Item]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    database: str

class CreateResponse(BaseModel):
    message: str
    data: Item

class DeleteResponse(BaseModel):
    message: str
    deletedId: int

# Routes
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "${config.projectName}-backend",
        "database": "sqlite"
    }

@app.get("/api/items", response_model=ItemsResponse)
async def get_items():
    """Get all items from database"""
    with get_db() as conn:
        cursor = conn.execute('SELECT * FROM items ORDER BY created_at DESC')
        rows = cursor.fetchall()
        items = [dict(row) for row in rows]
    
    return {
        "message": "Hello from ${config.projectName} API!",
        "description": "${config.projectDescription}",
        "stack": {
            "frontend": "${config.frontend}",
            "backend": "fastapi",
            "database": "sqlite"
        },
        "timestamp": datetime.now().isoformat(),
        "data": items
    }

@app.get("/api/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get single item by ID"""
    with get_db() as conn:
        cursor = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,))
        row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Item with id {item_id} not found")
    
    return dict(row)

@app.post("/api/items", response_model=CreateResponse, status_code=201)
async def create_item(item: CreateItem):
    """Create new item"""
    with get_db() as conn:
        cursor = conn.execute(
            'INSERT INTO items (name, value) VALUES (?, ?)',
            (item.name, item.value)
        )
        conn.commit()
        item_id = cursor.lastrowid
        
        cursor = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,))
        row = cursor.fetchone()
    
    return {
        "message": "Item created successfully",
        "data": dict(row)
    }

@app.put("/api/items/{item_id}", response_model=CreateResponse)
async def update_item(item_id: int, update: UpdateItem):
    """Update item by ID"""
    if not update.name and update.value is None:
        raise HTTPException(
            status_code=400,
            detail="At least one field (name or value) must be provided"
        )
    
    with get_db() as conn:
        # Check if item exists
        cursor = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Item with id {item_id} not found")
        
        # Build update query
        updates = []
        params = []
        
        if update.name:
            updates.append('name = ?')
            params.append(update.name)
        if update.value is not None:
            updates.append('value = ?')
            params.append(update.value)
        
        params.append(item_id)
        
        conn.execute(
            f'UPDATE items SET {", ".join(updates)} WHERE id = ?',
            params
        )
        conn.commit()
        
        cursor = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,))
        row = cursor.fetchone()
    
    return {
        "message": "Item updated successfully",
        "data": dict(row)
    }

@app.delete("/api/items/{item_id}", response_model=DeleteResponse)
async def delete_item(item_id: int):
    """Delete item by ID"""
    with get_db() as conn:
        cursor = conn.execute('DELETE FROM items WHERE id = ?', (item_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Item with id {item_id} not found")
    
    return {
        "message": "Item deleted successfully",
        "deletedId": item_id
    }

if __name__ == "__main__":
    print("🚀 Starting FastAPI backend server...")
    print("📍 API docs: http://localhost:8000/docs")
    print("📍 Health check: http://localhost:8000/api/health")
    print("📍 Items CRUD: http://localhost:8000/api/items")
    print("📊 Database: SQLite (data.db)")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )`,
      'Dockerfile': `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "src/main.py"]`,
      '.dockerignore': `__pycache__
*.pyc
*.pyo
*.pyd
.Python
env
venv
.env
.venv
pip-log.txt
pip-delete-this-directory.txt
data.db`
    }
  };
}


module.exports = {
  express,
  fastapi
};
