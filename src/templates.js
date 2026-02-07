const frontendTemplates = require('./templates/frontend');
const backendTemplates = require('./templates/backend');
const webExtendedTemplates = require('./templates/webextended');
const backendExtendedTemplates = require('./templates/backendextended');
const mobileTemplates = require('./templates/mobile');
const cliTemplates = require('./templates/cli');
const infrastructureTemplates = require('./templates/infrastructure');
const datascienceTemplates = require('./templates/datascience');
const gameTemplates = require('./templates/game');

function getFrontendTemplate(type, config) {
  const templates = {
    // Original web
    'react': frontendTemplates.react,
    'vue': frontendTemplates.vue,
    'vanilla': frontendTemplates.vanilla,
    // Extended web
    'angular': webExtendedTemplates.angular,
    'svelte': webExtendedTemplates.svelte
  };

  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown frontend type: ${type}`);
  }

  return template(config);
}

function getBackendTemplate(type, config) {
  const templates = {
    // Original backends
    'express': backendTemplates.express,
    'fastapi': backendTemplates.fastapi,
    // Extended backends
    'flask': backendExtendedTemplates.flask,
    'django': backendExtendedTemplates.django,
    'go-gin': backendExtendedTemplates.goGin,
    'spring-boot': backendExtendedTemplates.springBoot,
    'rails': backendExtendedTemplates.rails,
    'phoenix': backendExtendedTemplates.phoenix
  };

  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown backend type: ${type}`);
  }

  return template(config);
}

function getFullstackTemplate(framework, config) {
  const templates = {
    'nextjs': webExtendedTemplates.nextjs
  };

  const template = templates[framework];
  if (!template) {
    throw new Error(`Unknown fullstack framework: ${framework}`);
  }

  return template(config);
}

function getMobileTemplate(framework, config) {
  const templates = {
    'react-native': mobileTemplates.reactNative,
    'flutter': mobileTemplates.flutter,
    'swift': mobileTemplates.swiftIOS,
    'kotlin': mobileTemplates.kotlinAndroid
  };

  const template = templates[framework];
  if (!template) {
    throw new Error(`Unknown mobile framework: ${framework}`);
  }

  return template(config);
}

function getCLITemplate(framework, config) {
  const templates = {
    'go': cliTemplates.goCLI,
    'python-click': cliTemplates.pythonCLI,
    'rust': cliTemplates.rustCLI,
    'electron': cliTemplates.electron
  };

  const template = templates[framework];
  if (!template) {
    throw new Error(`Unknown CLI framework: ${framework}`);
  }

  return template(config);
}

function getInfrastructureTemplate(framework, config) {
  const templates = {
    'terraform': infrastructureTemplates.terraformAWS,
    'kubernetes': infrastructureTemplates.kubernetes,
    'docker-compose': infrastructureTemplates.dockerCompose,
    'ansible': infrastructureTemplates.ansible
  };

  const template = templates[framework];
  if (!template) {
    throw new Error(`Unknown infrastructure framework: ${framework}`);
  }

  return template(config);
}

function getDataScienceTemplate(framework, config) {
  const templates = {
    'jupyter': datascienceTemplates.pythonJupyter,
    'pytorch': datascienceTemplates.pythonPyTorch,
    'tensorflow': datascienceTemplates.pythonTensorFlow
  };

  const template = templates[framework];
  if (!template) {
    throw new Error(`Unknown data science framework: ${framework}`);
  }

  return template(config);
}

function getGameTemplate(framework, config) {
  const templates = {
    'pygame': gameTemplates.pygame,
    'phaser': gameTemplates.phaser
  };

  const template = templates[framework];
  if (!template) {
    throw new Error(`Unknown game framework: ${framework}`);
  }

  return template(config);
}

module.exports = {
  getFrontendTemplate,
  getBackendTemplate,
  getFullstackTemplate,
  getMobileTemplate,
  getCLITemplate,
  getInfrastructureTemplate,
  getDataScienceTemplate,
  getGameTemplate
};
