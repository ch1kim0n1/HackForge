const { STACKS } = require('../stacks');

/**
 * Suggests the best tech stack for a project description.
 * @param {string} description - User's project idea.
 * @returns {Promise<Array>} - Sorted list of recommended stack keys.
 */
const suggestStack = async (description) => {
    try {
        console.log('🧠 Analyzing project requirements...');
        console.log('  - Loading AI recommendation model...');
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

        const catOutput = await classifier(description, categories);
        const bestCategory = catOutput.labels[0];

        console.log(`🎯 Detected Category: ${bestCategory}`);

        let recommendedstacks = [];

        // Simple keyword mapping + category filtering
        if (bestCategory.includes('web')) {
            if (description.includes('python') || description.includes('django') || description.includes('flask')) {
                recommendedstacks = ['react-flask', 'vue-django', 'react-fastapi'];
            } else if (description.includes('go') || description.includes('golang')) {
                recommendedstacks = ['react-go-gin'];
            } else if (description.includes('vue')) {
                recommendedstacks = ['vue-express', 'vue-django'];
            } else if (description.includes('angular')) {
                recommendedstacks = ['angular-express'];
            } else {
                recommendedstacks = ['react-express', 'nextjs', 'svelte-express'];
            }
        } else if (bestCategory.includes('mobile')) {
            if (description.includes('flutter') || description.includes('dart')) {
                recommendedstacks = ['flutter'];
            } else if (description.includes('ios') || description.includes('swift')) {
                recommendedstacks = ['swift-ios'];
            } else if (description.includes('android') || description.includes('kotlin')) {
                recommendedstacks = ['kotlin-android'];
            } else {
                recommendedstacks = ['react-native'];
            }
        } else if (bestCategory.includes('game')) {
            if (description.includes('python')) {
                recommendedstacks = ['pygame'];
            } else {
                recommendedstacks = ['phaser'];
            }
        } else if (bestCategory.includes('data') || bestCategory.includes('ai')) {
            if (description.includes('torch') || description.includes('deep')) {
                recommendedstacks = ['python-pytorch'];
            } else if (description.includes('tensorflow') || description.includes('keras')) {
                recommendedstacks = ['python-tensorflow'];
            } else {
                recommendedstacks = ['python-jupyter'];
            }
        } else if (bestCategory.includes('cli')) {
            if (description.includes('rust')) recommendedstacks = ['rust-cli'];
            else if (description.includes('go')) recommendedstacks = ['go-cli'];
            else if (description.includes('python')) recommendedstacks = ['python-cli'];
            else recommendedstacks = ['python-cli', 'go-cli', 'rust-cli'];
        } else {
            // Fallback
            recommendedstacks = ['react-express', 'python-cli', 'react-native'];
        }

        // Filter out any that don't exist in STACKS
        return recommendedstacks.filter(key => STACKS[key]);

    } catch (error) {
        console.error('⚠ AI Recommendation failed:', error.message);
        return [];
    }
}

module.exports = { suggestStack };
