// Infrastructure and DevOps templates

function terraformAWS(config) {
  return {
    files: {
      'main.tf': `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${config.projectName}-vpc"
    Project     = "${config.projectName}"
    Environment = var.environment
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${config.projectName}-public-subnet"
    Project     = "${config.projectName}"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${config.projectName}-igw"
    Project     = "${config.projectName}"
    Environment = var.environment
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${config.projectName}-public-rt"
    Project     = "${config.projectName}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "web" {
  name        = "${config.projectName}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${config.projectName}-web-sg"
    Project     = "${config.projectName}"
    Environment = var.environment
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}`,
      'variables.tf': `variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "${config.projectName}"
}`,
      'outputs.tf': `output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = aws_subnet.public.id
}

output "security_group_id" {
  description = "Web security group ID"
  value       = aws_security_group.web.id
}`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

Infrastructure as Code with Terraform for AWS.

## Prerequisites

- Terraform 1.0+
- AWS CLI configured
- AWS credentials set up

## Usage

\`\`\`bash
# Initialize Terraform
terraform init

# Plan the infrastructure
terraform plan

# Apply the infrastructure
terraform apply

# Destroy the infrastructure
terraform destroy
\`\`\`

## Configuration

Edit \`variables.tf\` to customize:
- AWS region
- Environment name
- Other parameters

## What's Created

- VPC with public subnet
- Internet Gateway
- Route tables
- Security group for web traffic
`,
      '.gitignore': `.terraform/
*.tfstate
*.tfstate.backup
.terraform.lock.hcl`
    }
  };
}

function kubernetes(config) {
  return {
    files: {
      'deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.projectName}
  labels:
    app: ${config.projectName}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${config.projectName}
  template:
    metadata:
      labels:
        app: ${config.projectName}
    spec:
      containers:
      - name: app
        image: nginx:latest  # Replace with your image
        ports:
        - containerPort: 80
        env:
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5`,
      'service.yaml': `apiVersion: v1
kind: Service
metadata:
  name: ${config.projectName}
  labels:
    app: ${config.projectName}
spec:
  type: LoadBalancer
  selector:
    app: ${config.projectName}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    name: http`,
      'ingress.yaml': `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${config.projectName}
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  rules:
  - host: ${config.projectName}.example.com  # Change this
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${config.projectName}
            port:
              number: 80
  tls:
  - hosts:
    - ${config.projectName}.example.com
    secretName: ${config.projectName}-tls`,
      'configmap.yaml': `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${config.projectName}-config
data:
  APP_NAME: "${config.projectName}"
  APP_ENV: "production"
  LOG_LEVEL: "info"`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

Kubernetes manifests for deploying the application.

## Prerequisites

- kubectl configured
- Kubernetes cluster access

## Deployment

\`\`\`bash
# Apply all manifests
kubectl apply -f .

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/${config.projectName}

# Delete resources
kubectl delete -f .
\`\`\`

## Manifests

- \`deployment.yaml\`: Application deployment with 3 replicas
- \`service.yaml\`: LoadBalancer service
- \`ingress.yaml\`: Ingress for external access
- \`configmap.yaml\`: Configuration data

## Customization

1. Update the container image in \`deployment.yaml\`
2. Adjust resource limits as needed
3. Configure ingress host in \`ingress.yaml\`
`,
      '.gitignore': `secrets.yaml
*.secret`
    }
  };
}

function dockerCompose(config) {
  return {
    files: {
      'docker-compose.yml': `version: '3.8'

services:
  web:
    image: nginx:latest
    container_name: ${config.projectName}-web
    ports:
      - "80:80"
    volumes:
      - ./web:/usr/share/nginx/html:ro
    depends_on:
      - api
    networks:
      - app-network
    restart: unless-stopped

  api:
    image: node:18-alpine
    container_name: ${config.projectName}-api
    working_dir: /app
    volumes:
      - ./api:/app
    command: sh -c "npm install && npm start"
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=${config.projectName}
    depends_on:
      - db
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    container_name: ${config.projectName}-db
    environment:
      - POSTGRES_DB=${config.projectName}
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=changeme
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: ${config.projectName}-redis
    ports:
      - "6379:6379"
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:`,
      'web/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.projectName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 40px;
        }
        h1 { font-size: 48px; margin-bottom: 20px; }
        p { font-size: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔨 ${config.projectName}</h1>
        <p>${config.projectDescription}</p>
        <p>Docker Compose stack is running!</p>
    </div>
</body>
</html>`,
      'api/package.json': `{
  "name": "${config.projectName}-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`,
      'api/index.js': `const express = require('express');
const app = express();
const PORT = 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: '${config.projectName}-api' });
});

app.listen(PORT, () => {
  console.log(\`API running on port \${PORT}\`);
});`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

Multi-container Docker application stack.

## Services

- **web**: Nginx web server (port 80)
- **api**: Node.js API (port 3000)
- **db**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

## Usage

\`\`\`bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Remove volumes
docker-compose down -v
\`\`\`

## Access

- Web: http://localhost
- API: http://localhost:3000
- DB: localhost:5432 (user: admin, pass: changeme)
- Redis: localhost:6379

## Customization

Edit \`docker-compose.yml\` to:
- Add more services
- Change port mappings
- Adjust resource limits
- Configure environment variables
`,
      '.gitignore': `.env
*.log`
    }
  };
}

function ansible(config) {
  return {
    files: {
      'playbook.yml': `---
- name: ${config.projectDescription}
  hosts: all
  become: yes
  
  vars:
    app_name: ${config.projectName}
    app_user: appuser
    app_dir: /opt/{{ app_name }}

  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Install required packages
      package:
        name:
          - git
          - curl
          - wget
        state: present

    - name: Create application user
      user:
        name: "{{ app_user }}"
        system: yes
        create_home: no
        shell: /bin/false

    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'

    - name: Deploy configuration
      template:
        src: config.j2
        dest: "{{ app_dir }}/config.yml"
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0644'

    - name: Ensure service is started
      systemd:
        name: "{{ app_name }}"
        state: started
        enabled: yes
      ignore_errors: yes`,
      'inventory.ini': `[webservers]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

[databases]
db1 ansible_host=192.168.1.20

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_rsa`,
      'templates/config.j2': `---
app_name: {{ app_name }}
environment: production
port: 8080
log_level: info`,
      'ansible.cfg': `[defaults]
inventory = inventory.ini
host_key_checking = False
retry_files_enabled = False
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 86400

[privilege_escalation]
become = True
become_method = sudo
become_user = root`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

Ansible playbooks for configuration management.

## Prerequisites

\`\`\`bash
pip install ansible
\`\`\`

## Usage

\`\`\`bash
# Test connectivity
ansible all -m ping

# Run playbook
ansible-playbook playbook.yml

# Run with specific inventory
ansible-playbook -i inventory.ini playbook.yml

# Check mode (dry run)
ansible-playbook playbook.yml --check

# Limit to specific hosts
ansible-playbook playbook.yml --limit webservers
\`\`\`

## Files

- \`playbook.yml\`: Main playbook
- \`inventory.ini\`: Host inventory
- \`templates/\`: Jinja2 templates
- \`ansible.cfg\`: Ansible configuration

## Customization

1. Update \`inventory.ini\` with your hosts
2. Modify \`playbook.yml\` tasks
3. Add templates in \`templates/\`
`,
      '.gitignore': `*.retry
.vault_pass
inventory/*/`
    }
  };
}

module.exports = {
  terraformAWS,
  kubernetes,
  dockerCompose,
  ansible
};
