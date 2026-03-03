const { STACKS } = require('../stacks');

/**
 * Suggests the best tech stack for a project description.
 * @param {string} description - User's project idea.
 * @returns {Promise<Array<string>>} Sorted list of recommended stack keys.
 */
const suggestStack = async (description) => {
  try {
    console.log('🧠 Analyzing project requirements...');
    console.log('  - Loading AI recommendation model...');

    const normalizedDescription = String(description || '').toLowerCase();
    const { pipeline } = await import('@xenova/transformers');
    const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');

    const categories = [
      'web application website fullstack',
      'mobile app phone android ios',
      'cli tool terminal command line',
      'data science machine learning ai analysis',
      'game video game fun entertainment',
      'backend api server microservice',
      'infrastructure devops cloud deployment'
    ];

    const catOutput = await classifier(normalizedDescription, categories);
    const bestCategory = catOutput.labels[0] || '';

    console.log(`🎯 Detected Category: ${bestCategory}`);

    let recommendedStacks = [];

    if (bestCategory.includes('web')) {
      if (normalizedDescription.includes('python') || normalizedDescription.includes('django') || normalizedDescription.includes('flask')) {
        recommendedStacks = ['react-flask', 'vue-django', 'react-fastapi'];
      } else if (normalizedDescription.includes('go') || normalizedDescription.includes('golang')) {
        recommendedStacks = ['react-go'];
      } else if (normalizedDescription.includes('vue')) {
        recommendedStacks = ['vue-express', 'vue-django'];
      } else if (normalizedDescription.includes('angular')) {
        recommendedStacks = ['angular-express'];
      } else {
        recommendedStacks = ['react-express', 'nextjs', 'svelte-express'];
      }
    } else if (bestCategory.includes('mobile')) {
      if (normalizedDescription.includes('flutter') || normalizedDescription.includes('dart')) {
        recommendedStacks = ['flutter'];
      } else if (normalizedDescription.includes('ios') || normalizedDescription.includes('swift')) {
        recommendedStacks = ['swift-ios'];
      } else if (normalizedDescription.includes('android') || normalizedDescription.includes('kotlin')) {
        recommendedStacks = ['kotlin-android'];
      } else {
        recommendedStacks = ['react-native'];
      }
    } else if (bestCategory.includes('game')) {
      if (normalizedDescription.includes('python')) {
        recommendedStacks = ['pygame'];
      } else {
        recommendedStacks = ['phaser'];
      }
    } else if (bestCategory.includes('data') || bestCategory.includes('ai')) {
      if (normalizedDescription.includes('torch') || normalizedDescription.includes('deep')) {
        recommendedStacks = ['python-pytorch'];
      } else if (normalizedDescription.includes('tensorflow') || normalizedDescription.includes('keras')) {
        recommendedStacks = ['python-tensorflow'];
      } else {
        recommendedStacks = ['python-jupyter'];
      }
    } else if (bestCategory.includes('cli')) {
      if (normalizedDescription.includes('rust')) {
        recommendedStacks = ['rust-cli'];
      } else if (normalizedDescription.includes('go')) {
        recommendedStacks = ['go-cli'];
      } else if (normalizedDescription.includes('python')) {
        recommendedStacks = ['python-cli'];
      } else {
        recommendedStacks = ['python-cli', 'go-cli', 'rust-cli'];
      }
    } else {
      recommendedStacks = ['react-express', 'python-cli', 'react-native'];
    }

    return recommendedStacks.filter(key => STACKS[key]);
  } catch (error) {
    console.error('⚠ AI Recommendation failed:', error.message);
    return [];
  }
};

module.exports = { suggestStack };
