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
    name: 'React + Go/Gin',
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

function normalizeStackToken(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '');
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

const MANUAL_ALIASES = {
  reactgogin: 'react-go',
  reactgo: 'react-go',
  reactgoapi: 'react-go',
  fastapi: 'react-fastapi',
  flask: 'react-flask',
  django: 'vue-django',
  gotgin: 'react-go',
  gogin: 'react-go',
  jupyter: 'python-jupyter',
  pytorch: 'python-pytorch',
  tensorflow: 'python-tensorflow',
  terraform: 'terraform-aws',
  rails: 'rails-api'
};

function buildStackIndex() {
  const index = new Map();

  Object.entries(STACKS).forEach(([key, stack]) => {
    index.set(normalizeStackToken(key), key);
    index.set(normalizeStackToken(stack.name), key);

    if (stack.framework) {
      const frameworkToken = normalizeStackToken(stack.framework);
      if (!index.has(frameworkToken)) {
        index.set(frameworkToken, key);
      }
    }
  });

  Object.entries(MANUAL_ALIASES).forEach(([alias, key]) => {
    if (STACKS[key]) {
      index.set(normalizeStackToken(alias), key);
    }
  });

  return index;
}

const STACK_INDEX = buildStackIndex();

function resolveStackInput(input) {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return null;
  }

  if (STACKS[input]) {
    return { key: input, config: STACKS[input] };
  }

  const normalized = normalizeStackToken(input);
  const resolvedKey = STACK_INDEX.get(normalized);

  if (!resolvedKey || !STACKS[resolvedKey]) {
    return null;
  }

  return { key: resolvedKey, config: STACKS[resolvedKey] };
}

function getStackSuggestions(input, limit = 5) {
  const needle = normalizeStackToken(input);
  const candidates = Object.entries(STACKS).map(([key, stack]) => {
    const keyToken = normalizeStackToken(key);
    const nameToken = normalizeStackToken(stack.name);
    const score = Math.min(levenshtein(needle, keyToken), levenshtein(needle, nameToken));
    return { key, name: stack.name, score };
  });

  return candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(item => ({ key: item.key, name: item.name }));
}

// Group stacks by category for better UX.
function getStacksByCategory() {
  const grouped = {};

  Object.entries(STACKS).forEach(([key, config]) => {
    const category = config.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      key,
      name: config.name,
      description: config.description,
      type: config.type,
      framework: config.framework,
      frontend: config.frontend,
      backend: config.backend,
      category: config.category
    });
  });

  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}

module.exports = {
  STACKS,
  getStacksByCategory,
  resolveStackInput,
  getStackSuggestions
};
