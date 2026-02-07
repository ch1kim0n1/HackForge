// Extended web framework templates

function angular(config) {
  return {
    packageJson: {
      name: `${config.projectName}-frontend`,
      version: "1.0.0",
      scripts: {
        start: "ng serve",
        build: "ng build",
        test: "ng test"
      },
      dependencies: {
        "@angular/animations": "^17.0.0",
        "@angular/common": "^17.0.0",
        "@angular/compiler": "^17.0.0",
        "@angular/core": "^17.0.0",
        "@angular/forms": "^17.0.0",
        "@angular/platform-browser": "^17.0.0",
        "@angular/platform-browser-dynamic": "^17.0.0",
        "rxjs": "^7.8.1",
        "tslib": "^2.6.2",
        "zone.js": "^0.14.2"
      },
      devDependencies: {
        "@angular-devkit/build-angular": "^17.0.0",
        "@angular/cli": "^17.0.0",
        "@angular/compiler-cli": "^17.0.0",
        "typescript": "~5.2.2"
      }
    },
    files: {
      'src/index.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${config.projectName}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>`,
      'src/main.ts': `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));`,
      'src/app/app.module.ts': `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`,
      'src/app/app.component.ts': `import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = '${config.projectName}';
  data: any = null;
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.error = null;
    
    this.http.get('http://localhost:${config.backend === 'fastapi' ? '8000' : '5000'}/api/data')
      .subscribe({
        next: (result) => {
          this.data = result;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        }
      });
  }
}`,
      'src/app/app.component.html': `<div class="app">
  <header class="header">
    <h1>🔨 {{ title }}</h1>
    <p>${config.projectDescription}</p>
  </header>

  <main class="main">
    <div class="card">
      <h2>API Status</h2>
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">
        <p>❌ Error: {{ error }}</p>
        <p class="hint">Make sure the backend is running</p>
      </div>
      <div *ngIf="data && !loading && !error" class="success">
        <p>✅ Connected to API</p>
        <pre>{{ data | json }}</pre>
      </div>
      <button (click)="fetchData()">Refresh</button>
    </div>
  </main>
</div>`,
      'src/app/app.component.css': `/* Styles similar to React version */
.app { min-height: 100vh; display: flex; flex-direction: column; }
.header { padding: 2rem; text-align: center; background: rgba(0, 0, 0, 0.2); }
.main { flex: 1; padding: 2rem; max-width: 1200px; margin: 0 auto; }
.card { background: white; padding: 2rem; border-radius: 12px; }
button { background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }`,
      'angular.json': JSON.stringify({
        $schema: "./node_modules/@angular/cli/lib/config/schema.json",
        version: 1,
        newProjectRoot: "projects",
        projects: {
          [config.projectName]: {
            projectType: "application",
            root: "",
            sourceRoot: "src",
            architect: {
              build: {
                builder: "@angular-devkit/build-angular:browser",
                options: {
                  outputPath: "dist",
                  index: "src/index.html",
                  main: "src/main.ts",
                  tsConfig: "tsconfig.app.json"
                }
              },
              serve: {
                builder: "@angular-devkit/build-angular:dev-server",
                options: { port: 3000 }
              }
            }
          }
        }
      }, null, 2)
    }
  };
}

function svelte(config) {
  return {
    packageJson: {
      name: `${config.projectName}-frontend`,
      version: "1.0.0",
      scripts: {
        start: "vite",
        build: "vite build"
      },
      dependencies: {
        "svelte": "^4.2.0"
      },
      devDependencies: {
        "@sveltejs/vite-plugin-svelte": "^3.0.0",
        "vite": "^5.0.0"
      }
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
      'src/main.js': `import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app`,
      'src/App.svelte': `<script>
  import { onMount } from 'svelte';
  
  let data = null;
  let loading = true;
  let error = null;

  async function fetchData() {
    loading = true;
    error = null;
    try {
      const response = await fetch('http://localhost:${config.backend === 'fastapi' ? '8000' : '5000'}/api/data');
      if (!response.ok) throw new Error('Network response was not ok');
      data = await response.json();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchData();
  });
</script>

<div class="app">
  <header class="header">
    <h1>🔨 ${config.projectName}</h1>
    <p>${config.projectDescription}</p>
  </header>

  <main class="main">
    <div class="card">
      <h2>API Status</h2>
      {#if loading}
        <p class="loading">Loading...</p>
      {:else if error}
        <div class="error">
          <p>❌ Error: {error}</p>
          <p class="hint">Make sure the backend is running</p>
        </div>
      {:else if data}
        <div class="success">
          <p>✅ Connected to API</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      {/if}
      <button on:click={fetchData}>Refresh</button>
    </div>
  </main>
</div>

<style>
  /* Similar styles to React version */
  .app { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  .header { padding: 2rem; text-align: center; color: white; }
  .main { padding: 2rem; }
  .card { background: white; padding: 2rem; border-radius: 12px; max-width: 800px; margin: 0 auto; }
  button { background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; margin-top: 1rem; }
</style>`,
      'src/app.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}`,
      'vite.config.js': `import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  server: { port: 3000 }
})`
    }
  };
}

function nextjs(config) {
  return {
    packageJson: {
      name: config.projectName,
      version: "1.0.0",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start"
      },
      dependencies: {
        "next": "^14.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      }
    },
    files: {
      'app/page.js': `'use client'

import { useState, useEffect } from 'react'
import './page.css'

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🔨 ${config.projectName}</h1>
        <p>${config.projectDescription}</p>
      </header>

      <main className="main">
        <div className="card">
          <h2>API Status</h2>
          {loading && <p className="loading">Loading...</p>}
          {error && (
            <div className="error">
              <p>❌ Error: {error}</p>
            </div>
          )}
          {data && !loading && !error && (
            <div className="success">
              <p>✅ Connected to API</p>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
          <button onClick={fetchData}>Refresh</button>
        </div>
      </main>
    </div>
  )
}`,
      'app/page.css': `/* Similar styles to other frameworks */
.app { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.header { padding: 2rem; text-align: center; color: white; }
.main { padding: 2rem; }
.card { background: white; padding: 2rem; border-radius: 12px; max-width: 800px; margin: 0 auto; }`,
      'app/api/data/route.js': `export async function GET() {
  return Response.json({
    message: 'Hello from ${config.projectName} API!',
    description: '${config.projectDescription}',
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: 'Sample Item 1', value: 42 },
      { id: 2, name: 'Sample Item 2', value: 84 }
    ]
  })
}`,
      'app/layout.js': `export const metadata = {
  title: '${config.projectName}',
  description: '${config.projectDescription}',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
    }
  };
}

module.exports = {
  angular,
  svelte,
  nextjs
};
