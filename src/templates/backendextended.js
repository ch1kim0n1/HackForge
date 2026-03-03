// Extended backend framework templates with a unified API contract.

function flask(config) {
  return {
    requirements: `Flask==3.0.0
Flask-CORS==4.0.0`,
    files: {
      'app.py': `from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

items = [
    {'id': 1, 'name': 'Sample Item 1', 'value': 42},
    {'id': 2, 'name': 'Sample Item 2', 'value': 84}
]
next_id = 3

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': '${config.projectName}-backend'
    })

@app.route('/api/items', methods=['GET'])
def list_items():
    return jsonify({
        'message': 'Hello from ${config.projectName} API!',
        'description': '${config.projectDescription}',
        'timestamp': datetime.now().isoformat(),
        'data': items
    })

@app.route('/api/items', methods=['POST'])
def create_item():
    global next_id
    payload = request.get_json(silent=True) or {}

    if 'name' not in payload or 'value' not in payload:
      return jsonify({'error': 'Missing required fields: name and value'}), 400

    item = {
        'id': next_id,
        'name': payload['name'],
        'value': payload['value']
    }

    next_id += 1
    items.insert(0, item)
    return jsonify({'message': 'Item created successfully', 'data': item}), 201

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    payload = request.get_json(silent=True) or {}

    for item in items:
        if item['id'] == item_id:
            if 'name' in payload:
                item['name'] = payload['name']
            if 'value' in payload:
                item['value'] = payload['value']
            return jsonify({'message': 'Item updated successfully', 'data': item})

    return jsonify({'error': 'Not found', 'message': f'Item with id {item_id} not found'}), 404

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    for index, item in enumerate(items):
        if item['id'] == item_id:
            deleted = items.pop(index)
            return jsonify({'message': 'Item deleted successfully', 'data': deleted})

    return jsonify({'error': 'Not found', 'message': f'Item with id {item_id} not found'}), 404

if __name__ == '__main__':
    print('Flask backend starting...')
    print('Health check: http://localhost:5000/api/health')
    print('Items endpoint: http://localhost:5000/api/items')
    app.run(host='0.0.0.0', port=5000, debug=True)
`,
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

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
`,
      'config/settings.py': `from pathlib import Path

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

STATIC_URL = '/static/'
`,
      'config/urls.py': `from django.urls import include, path

urlpatterns = [
    path('api/', include('api.urls')),
]
`,
      'api/views.py': `from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response

items = [
    {'id': 1, 'name': 'Sample Item 1', 'value': 42},
    {'id': 2, 'name': 'Sample Item 2', 'value': 84},
]


def find_item(item_id):
    for item in items:
        if item['id'] == item_id:
            return item
    return None


@api_view(['GET'])
def health(request):
    return Response({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': '${config.projectName}-backend'
    })


@api_view(['GET', 'POST'])
def items_collection(request):
    if request.method == 'GET':
        return Response({
            'message': 'Hello from ${config.projectName} API!',
            'description': '${config.projectDescription}',
            'timestamp': datetime.now().isoformat(),
            'data': items
        })

    payload = request.data or {}
    if 'name' not in payload or 'value' not in payload:
        return Response({'error': 'Missing required fields: name and value'}, status=400)

    next_id = max([item['id'] for item in items], default=0) + 1
    item = {'id': next_id, 'name': payload['name'], 'value': payload['value']}
    items.insert(0, item)
    return Response({'message': 'Item created successfully', 'data': item}, status=201)


@api_view(['PUT', 'DELETE'])
def item_resource(request, item_id):
    item = find_item(item_id)
    if item is None:
        return Response({'error': 'Not found', 'message': f'Item with id {item_id} not found'}, status=404)

    if request.method == 'PUT':
        payload = request.data or {}
        if 'name' in payload:
            item['name'] = payload['name']
        if 'value' in payload:
            item['value'] = payload['value']
        return Response({'message': 'Item updated successfully', 'data': item})

    items.remove(item)
    return Response({'message': 'Item deleted successfully', 'data': item})
`,
      'api/urls.py': `from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health),
    path('items', views.items_collection),
    path('items/<int:item_id>', views.item_resource),
]
`,
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

require (
	github.com/gin-contrib/cors v1.5.0
	github.com/gin-gonic/gin v1.9.1
)
`,
      'main.go': `package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Item struct {
	ID    int    \`json:"id"\`
	Name  string \`json:"name"\`
	Value int    \`json:"value"\`
}

var items = []Item{
	{ID: 1, Name: "Sample Item 1", Value: 42},
	{ID: 2, Name: "Sample Item 2", Value: 84},
}

func main() {
	router := gin.Default()
	router.Use(cors.Default())

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"service": "${config.projectName}-backend",
		})
	})

	router.GET("/api/items", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Hello from ${config.projectName} API!",
			"description": "${config.projectDescription}",
			"timestamp": time.Now().Format(time.RFC3339),
			"data": items,
		})
	})

	router.POST("/api/items", func(c *gin.Context) {
		var payload Item
		if err := c.BindJSON(&payload); err != nil || payload.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields: name and value"})
			return
		}

		nextID := 1
		if len(items) > 0 {
			nextID = items[0].ID + 1
		}

		item := Item{ID: nextID, Name: payload.Name, Value: payload.Value}
		items = append([]Item{item}, items...)
		c.JSON(http.StatusCreated, gin.H{"message": "Item created successfully", "data": item})
	})

	router.PUT("/api/items/:id", func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		var payload Item
		if err := c.BindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
			return
		}

		for i := range items {
			if items[i].ID == id {
				if payload.Name != "" {
					items[i].Name = payload.Name
				}
				if payload.Value != 0 {
					items[i].Value = payload.Value
				}
				c.JSON(http.StatusOK, gin.H{"message": "Item updated successfully", "data": items[i]})
				return
			}
		}

		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})

	router.DELETE("/api/items/:id", func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		for i := range items {
			if items[i].ID == id {
				deleted := items[i]
				items = append(items[:i], items[i+1:]...)
				c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully", "data": deleted})
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})

	router.Run(":5000")
}
`,
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
*.dll
*.so
*.dylib

# Go workspace
go.work
`
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
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>

  <groupId>com.${packageName}</groupId>
  <artifactId>${config.projectName}</artifactId>
  <version>1.0.0</version>

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
</project>
`,
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
  private final List<Map<String, Object>> items = new ArrayList<>();

  public Application() {
    items.add(new HashMap<>(Map.of("id", 1, "name", "Sample Item 1", "value", 42)));
    items.add(new HashMap<>(Map.of("id", 2, "name", "Sample Item 2", "value", 84)));
  }

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    Map<String, String> response = new HashMap<>();
    response.put("status", "healthy");
    response.put("timestamp", Instant.now().toString());
    response.put("service", "${config.projectName}-backend");
    return response;
  }

  @GetMapping("/items")
  public Map<String, Object> listItems() {
    Map<String, Object> response = new HashMap<>();
    response.put("message", "Hello from ${config.projectName} API!");
    response.put("description", "${config.projectDescription}");
    response.put("timestamp", Instant.now().toString());
    response.put("data", items);
    return response;
  }

  @PostMapping("/items")
  public Map<String, Object> createItem(@RequestBody Map<String, Object> payload) {
    int nextId = items.isEmpty() ? 1 : ((Integer) items.get(0).get("id")) + 1;
    Map<String, Object> item = new HashMap<>();
    item.put("id", nextId);
    item.put("name", payload.get("name"));
    item.put("value", payload.get("value"));
    items.add(0, item);

    Map<String, Object> response = new HashMap<>();
    response.put("message", "Item created successfully");
    response.put("data", item);
    return response;
  }

  @PutMapping("/items/{id}")
  public Map<String, Object> updateItem(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
    for (Map<String, Object> item : items) {
      if (item.get("id").equals(id)) {
        if (payload.containsKey("name")) {
          item.put("name", payload.get("name"));
        }
        if (payload.containsKey("value")) {
          item.put("value", payload.get("value"));
        }
        return new HashMap<>(Map.of("message", "Item updated successfully", "data", item));
      }
    }

    return new HashMap<>(Map.of("error", "Not found"));
  }

  @DeleteMapping("/items/{id}")
  public Map<String, Object> deleteItem(@PathVariable Integer id) {
    Iterator<Map<String, Object>> iterator = items.iterator();
    while (iterator.hasNext()) {
      Map<String, Object> item = iterator.next();
      if (item.get("id").equals(id)) {
        iterator.remove();
        return new HashMap<>(Map.of("message", "Item deleted successfully", "data", item));
      }
    }

    return new HashMap<>(Map.of("error", "Not found"));
  }
}
`,
      'src/main/resources/application.properties': `server.port=5000
spring.application.name=${config.projectName}
`,
      'README.md': `# ${config.projectName} Backend

${config.projectDescription}

## Run

\`\`\`bash
./mvnw spring-boot:run
\`\`\`

Backend runs at http://localhost:5000
`
    }
  };
}

function rails(config) {
  const moduleName = config.projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return {
    files: {
      'Gemfile': `source 'https://rubygems.org'

gem 'rails', '~> 7.1.0'
gem 'puma', '~> 6.0'
gem 'rack-cors'
`,
      'config/application.rb': `require_relative 'boot'
require 'rails'
require 'active_model/railtie'
require 'action_controller/railtie'

module ${moduleName}
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
end
`,
      'config/routes.rb': `Rails.application.routes.draw do
  namespace :api do
    get 'health', to: 'application#health'
    get 'items', to: 'application#items'
    post 'items', to: 'application#create_item'
    put 'items/:id', to: 'application#update_item'
    delete 'items/:id', to: 'application#delete_item'
  end
end
`,
      'app/controllers/api/application_controller.rb': `class Api::ApplicationController < ActionController::API
  @@items = [
    { id: 1, name: 'Sample Item 1', value: 42 },
    { id: 2, name: 'Sample Item 2', value: 84 }
  ]

  def health
    render json: {
      status: 'healthy',
      timestamp: Time.now.iso8601,
      service: '${config.projectName}-backend'
    }
  end

  def items
    render json: {
      message: 'Hello from ${config.projectName} API!',
      description: '${config.projectDescription}',
      timestamp: Time.now.iso8601,
      data: @@items
    }
  end

  def create_item
    id = @@items.empty? ? 1 : @@items.first[:id] + 1
    item = { id: id, name: params[:name], value: params[:value] }
    @@items.unshift(item)
    render json: { message: 'Item created successfully', data: item }, status: :created
  end

  def update_item
    item = @@items.find { |entry| entry[:id] == params[:id].to_i }
    return render json: { error: 'Not found' }, status: :not_found unless item

    item[:name] = params[:name] if params.key?(:name)
    item[:value] = params[:value] if params.key?(:value)
    render json: { message: 'Item updated successfully', data: item }
  end

  def delete_item
    item = @@items.find { |entry| entry[:id] == params[:id].to_i }
    return render json: { error: 'Not found' }, status: :not_found unless item

    @@items.delete(item)
    render json: { message: 'Item deleted successfully', data: item }
  end
end
`,
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
`
    }
  };
}

function phoenix(config) {
  const moduleName = config.projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return {
    files: {
      'mix.exs': `defmodule ${moduleName}.MixProject do
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
      mod: {${moduleName}.Application, []},
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
end
`,
      'lib/router.ex': `defmodule ${moduleName}.Router do
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug
  end

  scope "/api", ${moduleName} do
    pipe_through :api

    get "/health", ApiController, :health
    get "/items", ApiController, :items
    post "/items", ApiController, :create_item
    put "/items/:id", ApiController, :update_item
    delete "/items/:id", ApiController, :delete_item
  end
end
`,
      'lib/api_controller.ex': `defmodule ${moduleName}.ApiController do
  use Phoenix.Controller

  @items [
    %{id: 1, name: "Sample Item 1", value: 42},
    %{id: 2, name: "Sample Item 2", value: 84}
  ]

  def health(conn, _params) do
    json(conn, %{
      status: "healthy",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      service: "${config.projectName}-backend"
    })
  end

  def items(conn, _params) do
    json(conn, %{
      message: "Hello from ${config.projectName} API!",
      description: "${config.projectDescription}",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      data: @items
    })
  end

  def create_item(conn, params) do
    json(conn, %{message: "Item created successfully", data: params})
  end

  def update_item(conn, params) do
    json(conn, %{message: "Item updated successfully", data: params})
  end

  def delete_item(conn, params) do
    json(conn, %{message: "Item deleted successfully", data: params})
  end
end
`,
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
`
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
