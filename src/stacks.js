// Comprehensive stack definitions for hackathon projects
// Organized by project type: Web, Mobile, CLI, Infrastructure, Data Science, Games, Backend

const STACKS = {
  // === WEB APPLICATIONS ===
  'react-express': {
    name: 'React + Express',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'react',
    backend: 'express',
    description: 'Modern React SPA with Express REST API'
  },
  'vue-express': {
    name: 'Vue.js + Express',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'vue',
    backend: 'express',
    description: 'Vue.js SPA with Express REST API'
  },
  'vanilla-express': {
    name: 'Vanilla JS + Express',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'vanilla',
    backend: 'express',
    description: 'Vanilla JavaScript with Express REST API'
  },
  'react-fastapi': {
    name: 'React + FastAPI',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'react',
    backend: 'fastapi',
    description: 'React SPA with Python FastAPI backend'
  },
  'angular-express': {
    name: 'Angular + Express',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'angular',
    backend: 'express',
    description: 'Angular SPA with Express REST API'
  },
  'svelte-express': {
    name: 'Svelte + Express',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'svelte',
    backend: 'express',
    description: 'Svelte SPA with Express REST API'
  },
  'nextjs': {
    name: 'Next.js',
    type: 'web',
    category: 'Web Full-Stack',
    framework: 'nextjs',
    description: 'Next.js fullstack framework with React'
  },
  'react-flask': {
    name: 'React + Flask',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'react',
    backend: 'flask',
    description: 'React SPA with Python Flask backend'
  },
  'vue-django': {
    name: 'Vue + Django',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'vue',
    backend: 'django',
    description: 'Vue.js SPA with Django REST API'
  },
  'react-go': {
    name: 'React + Go',
    type: 'web',
    category: 'Web Full-Stack',
    frontend: 'react',
    backend: 'go-gin',
    description: 'React SPA with Go Gin backend'
  },

  // === MOBILE APPLICATIONS ===
  'react-native': {
    name: 'React Native',
    type: 'mobile',
    category: 'Mobile App',
    framework: 'react-native',
    description: 'Cross-platform mobile app with React Native'
  },
  'flutter': {
    name: 'Flutter',
    type: 'mobile',
    category: 'Mobile App',
    framework: 'flutter',
    description: 'Cross-platform mobile app with Flutter (Dart)'
  },
  'swift-ios': {
    name: 'Swift iOS',
    type: 'mobile',
    category: 'Mobile App',
    framework: 'swift',
    description: 'Native iOS app with Swift and SwiftUI'
  },
  'kotlin-android': {
    name: 'Kotlin Android',
    type: 'mobile',
    category: 'Mobile App',
    framework: 'kotlin',
    description: 'Native Android app with Kotlin and Jetpack Compose'
  },

  // === CLI/DESKTOP APPLICATIONS ===
  'go-cli': {
    name: 'Go CLI',
    type: 'cli',
    category: 'CLI Tool',
    framework: 'go',
    description: 'Command-line tool in Go with Cobra'
  },
  'python-cli': {
    name: 'Python CLI',
    type: 'cli',
    category: 'CLI Tool',
    framework: 'python-click',
    description: 'Command-line tool in Python with Click'
  },
  'rust-cli': {
    name: 'Rust CLI',
    type: 'cli',
    category: 'CLI Tool',
    framework: 'rust',
    description: 'Fast command-line tool in Rust with Clap'
  },
  'electron': {
    name: 'Electron Desktop',
    type: 'desktop',
    category: 'Desktop App',
    framework: 'electron',
    description: 'Cross-platform desktop app with Electron and React'
  },

  // === INFRASTRUCTURE/DEVOPS ===
  'terraform-aws': {
    name: 'Terraform + AWS',
    type: 'infrastructure',
    category: 'Infrastructure',
    framework: 'terraform',
    description: 'Infrastructure as code with Terraform for AWS'
  },
  'kubernetes': {
    name: 'Kubernetes',
    type: 'infrastructure',
    category: 'Infrastructure',
    framework: 'kubernetes',
    description: 'Kubernetes manifests for containerized apps'
  },
  'docker-compose': {
    name: 'Docker Compose',
    type: 'infrastructure',
    category: 'Infrastructure',
    framework: 'docker-compose',
    description: 'Multi-container Docker application stack'
  },
  'ansible': {
    name: 'Ansible',
    type: 'infrastructure',
    category: 'Infrastructure',
    framework: 'ansible',
    description: 'Configuration management with Ansible playbooks'
  },

  // === DATA SCIENCE / ML ===
  'python-jupyter': {
    name: 'Python + Jupyter',
    type: 'datascience',
    category: 'Data Science',
    framework: 'jupyter',
    description: 'Data science notebook with Jupyter and common libraries'
  },
  'python-pytorch': {
    name: 'Python + PyTorch',
    type: 'datascience',
    category: 'Machine Learning',
    framework: 'pytorch',
    description: 'ML project with PyTorch and training scaffold'
  },
  'python-tensorflow': {
    name: 'Python + TensorFlow',
    type: 'datascience',
    category: 'Machine Learning',
    framework: 'tensorflow',
    description: 'ML project with TensorFlow/Keras'
  },

  // === GAME DEVELOPMENT ===
  'pygame': {
    name: 'Pygame',
    type: 'game',
    category: 'Game',
    framework: 'pygame',
    description: '2D game with Pygame (Python)'
  },
  'phaser': {
    name: 'Phaser.js',
    type: 'game',
    category: 'Game',
    framework: 'phaser',
    description: 'Browser-based 2D game with Phaser.js'
  },

  // === BACKEND/API ONLY ===
  'spring-boot': {
    name: 'Spring Boot',
    type: 'backend',
    category: 'Backend API',
    framework: 'spring-boot',
    description: 'Java REST API with Spring Boot'
  },
  'rails-api': {
    name: 'Ruby on Rails API',
    type: 'backend',
    category: 'Backend API',
    framework: 'rails',
    description: 'Ruby on Rails API-only backend'
  },
  'phoenix': {
    name: 'Phoenix',
    type: 'backend',
    category: 'Backend API',
    framework: 'phoenix',
    description: 'Elixir Phoenix REST API'
  }
};

// Group stacks by category for better UX
function getStacksByCategory() {
  const grouped = {};
  Object.entries(STACKS).forEach(([key, config]) => {
    const category = config.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({ key, ...config });
  });
  return grouped;
}

module.exports = {
  STACKS,
  getStacksByCategory
};
