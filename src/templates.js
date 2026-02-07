const frontendTemplates = require('./templates/frontend');
const backendTemplates = require('./templates/backend');

function getFrontendTemplate(type, config) {
  const templates = {
    'react': frontendTemplates.react,
    'vue': frontendTemplates.vue,
    'vanilla': frontendTemplates.vanilla
  };

  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown frontend type: ${type}`);
  }

  return template(config);
}

function getBackendTemplate(type, config) {
  const templates = {
    'express': backendTemplates.express,
    'fastapi': backendTemplates.fastapi
  };

  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown backend type: ${type}`);
  }

  return template(config);
}

module.exports = {
  getFrontendTemplate,
  getBackendTemplate
};
