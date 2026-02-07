// Extended backend framework templates

function flask(config) {
  return {
    requirements: `Flask==3.0.0
Flask-CORS==4.0.0`,
    files: {
      'app.py': `from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': '${config.projectName}-backend'
    })

@app.route('/api/data')
def get_data():
    return jsonify({
        'message': 'Hello from ${config.projectName} API!',
        'description': '${config.projectDescription}',
        'timestamp': datetime.now().isoformat(),
        'data': [
            {'id': 1, 'name': 'Sample Item 1', 'value': 42},
            {'id': 2, 'name': 'Sample Item 2', 'value': 84},
            {'id': 3, 'name': 'Sample Item 3', 'value': 126}
        ]
    })

if __name__ == '__main__':
    print("🚀 Flask backend starting...")
    print("📍 Health check: http://localhost:5000/api/health")
    print("📍 Data endpoint: http://localhost:5000/api/data")
    app.run(host='0.0.0.0', port=5000, debug=True)`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Setup

\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

## Run

\`\`\`bash
python app.py
\`\`\`

Backend runs at http://localhost:5000
`,
      '.gitignore': `venv/
__pycache__/
*.pyc
.env`
    }
  };
}

function django(config) {
  return {
    requirements: `Django==5.0.0
djangorestframework==3.14.0
django-cors-headers==4.3.0`,
    files: {
      'manage.py': `#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        raise ImportError("Couldn't import Django.")
    execute_from_command_line(sys.argv)`,
      'config/settings.py': `import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-change-this-in-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

STATIC_URL = '/static/'`,
      'config/urls.py': `from django.urls import path, include

urlpatterns = [
    path('api/', include('api.urls')),
]`,
      'api/views.py': `from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime

@api_view(['GET'])
def health(request):
    return Response({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': '${config.projectName}-backend'
    })

@api_view(['GET'])
def get_data(request):
    return Response({
        'message': 'Hello from ${config.projectName} API!',
        'description': '${config.projectDescription}',
        'timestamp': datetime.now().isoformat(),
        'data': [
            {'id': 1, 'name': 'Sample Item 1', 'value': 42},
            {'id': 2, 'name': 'Sample Item 2', 'value': 84}
        ]
    })`,
      'api/urls.py': `from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health),
    path('data', views.get_data),
]`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Setup

\`\`\`bash
pip install -r requirements.txt
python manage.py migrate
\`\`\`

## Run

\`\`\`bash
python manage.py runserver 5000
\`\`\`

Backend runs at http://localhost:5000
`
    }
  };
}

function goGin(config) {
  return {
    files: {
      'go.mod': `module ${config.projectName}

go 1.21

require github.com/gin-gonic/gin v1.9.1

require (
\tgithub.com/gin-contrib/cors v1.5.0
)`,
      'main.go': `package main

import (
\t"net/http"
\t"time"

\t"github.com/gin-contrib/cors"
\t"github.com/gin-gonic/gin"
)

type HealthResponse struct {
\tStatus    string \`json:"status"\`
\tTimestamp string \`json:"timestamp"\`
\tService   string \`json:"service"\`
}

type DataItem struct {
\tID    int    \`json:"id"\`
\tName  string \`json:"name"\`
\tValue int    \`json:"value"\`
}

type DataResponse struct {
\tMessage     string     \`json:"message"\`
\tDescription string     \`json:"description"\`
\tTimestamp   string     \`json:"timestamp"\`
\tData        []DataItem \`json:"data"\`
}

func main() {
\trouter := gin.Default()

\t// CORS middleware
\trouter.Use(cors.Default())

\t// Health check endpoint
\trouter.GET("/api/health", func(c *gin.Context) {
\t\tc.JSON(http.StatusOK, HealthResponse{
\t\t\tStatus:    "healthy",
\t\t\tTimestamp: time.Now().Format(time.RFC3339),
\t\t\tService:   "${config.projectName}-backend",
\t\t})
\t})

\t// Data endpoint
\trouter.GET("/api/data", func(c *gin.Context) {
\t\tc.JSON(http.StatusOK, DataResponse{
\t\t\tMessage:     "Hello from ${config.projectName} API!",
\t\t\tDescription: "${config.projectDescription}",
\t\t\tTimestamp:   time.Now().Format(time.RFC3339),
\t\t\tData: []DataItem{
\t\t\t\t{ID: 1, Name: "Sample Item 1", Value: 42},
\t\t\t\t{ID: 2, Name: "Sample Item 2", Value: 84},
\t\t\t},
\t\t})
\t})

\tprintln("🚀 Go Gin backend starting...")
\tprintln("📍 Health check: http://localhost:5000/api/health")
\tprintln("📍 Data endpoint: http://localhost:5000/api/data")
\trouter.Run(":5000")
}`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Setup

\`\`\`bash
go mod download
\`\`\`

## Run

\`\`\`bash
go run main.go
\`\`\`

Backend runs at http://localhost:5000
`,
      '.gitignore': `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Go workspace
go.work`
    }
  };
}

function springBoot(config) {
  const packageName = config.projectName.replace(/-/g, '');
  
  return {
    files: {
      'pom.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    <groupId>com.${packageName}</groupId>
    <artifactId>${config.projectName}</artifactId>
    <version>1.0.0</version>
    <name>${config.projectName}</name>
    <description>${config.projectDescription}</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`,
      'src/main/java/com/Application.java': `package com.${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("🚀 Spring Boot backend starting...");
        System.out.println("📍 Health check: http://localhost:5000/api/health");
        System.out.println("📍 Data endpoint: http://localhost:5000/api/data");
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("timestamp", Instant.now().toString());
        response.put("service", "${config.projectName}-backend");
        return response;
    }

    @GetMapping("/data")
    public Map<String, Object> getData() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello from ${config.projectName} API!");
        response.put("description", "${config.projectDescription}");
        response.put("timestamp", Instant.now().toString());
        
        List<Map<String, Object>> data = new ArrayList<>();
        data.add(Map.of("id", 1, "name", "Sample Item 1", "value", 42));
        data.add(Map.of("id", 2, "name", "Sample Item 2", "value", 84));
        response.put("data", data);
        
        return response;
    }
}`,
      'src/main/resources/application.properties': `server.port=5000
spring.application.name=${config.projectName}`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Prerequisites
- Java 17+
- Maven

## Run

\`\`\`bash
./mvnw spring-boot:run
\`\`\`

Backend runs at http://localhost:5000
`,
      '.gitignore': `target/
*.class
.mvn/
mvnw
mvnw.cmd`
    }
  };
}

function rails(config) {
  return {
    files: {
      'Gemfile': `source 'https://rubygems.org'

ruby '3.2.0'

gem 'rails', '~> 7.1.0'
gem 'puma', '~> 6.0'
gem 'rack-cors'`,
      'config.ru': `require_relative 'config/environment'
run Rails.application`,
      'config/application.rb': `require_relative 'boot'
require 'rails'
require 'active_model/railtie'
require 'action_controller/railtie'

module ${config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true
    
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete, :options]
      end
    end
  end
end`,
      'config/routes.rb': `Rails.application.routes.draw do
  namespace :api do
    get 'health', to: 'application#health'
    get 'data', to: 'application#data'
  end
end`,
      'app/controllers/api/application_controller.rb': `class Api::ApplicationController < ApplicationController
  def health
    render json: {
      status: 'healthy',
      timestamp: Time.now.iso8601,
      service: '${config.projectName}-backend'
    }
  end

  def data
    render json: {
      message: 'Hello from ${config.projectName} API!',
      description: '${config.projectDescription}',
      timestamp: Time.now.iso8601,
      data: [
        { id: 1, name: 'Sample Item 1', value: 42 },
        { id: 2, name: 'Sample Item 2', value: 84 }
      ]
    }
  end
end`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Setup

\`\`\`bash
bundle install
\`\`\`

## Run

\`\`\`bash
rails server -p 5000
\`\`\`

Backend runs at http://localhost:5000
`,
      '.gitignore': `log/
tmp/
.bundle/`
    }
  };
}

function phoenix(config) {
  return {
    files: {
      'mix.exs': `defmodule ${config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}.MixProject do
  use Mix.Project

  def project do
    [
      app: :${config.projectName.replace(/-/g, '_')},
      version: "1.0.0",
      elixir: "~> 1.15",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      mod: {${config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}.Application, []},
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:phoenix, "~> 1.7.0"},
      {:plug_cowboy, "~> 2.6"},
      {:cors_plug, "~> 3.0"}
    ]
  end
end`,
      'lib/router.ex': `defmodule ${config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}.Router do
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug
  end

  scope "/api", ${config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} do
    pipe_through :api

    get "/health", ApiController, :health
    get "/data", ApiController, :data
  end
end`,
      'lib/api_controller.ex': `defmodule ${config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}.ApiController do
  use Phoenix.Controller

  def health(conn, _params) do
    json(conn, %{
      status: "healthy",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      service: "${config.projectName}-backend"
    })
  end

  def data(conn, _params) do
    json(conn, %{
      message: "Hello from ${config.projectName} API!",
      description: "${config.projectDescription}",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      data: [
        %{id: 1, name: "Sample Item 1", value: 42},
        %{id: 2, name: "Sample Item 2", value: 84}
      ]
    })
  end
end`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Setup

\`\`\`bash
mix deps.get
\`\`\`

## Run

\`\`\`bash
mix phx.server
\`\`\`

Backend runs at http://localhost:5000
`,
      '.gitignore': `_build/
deps/
*.ez`
    }
  };
}

module.exports = {
  flask,
  django,
  goGin,
  springBoot,
  rails,
  phoenix
};
