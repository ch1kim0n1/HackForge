/**
 * Enriches the project description and features.
 * @param {string} name - Project name.
 * @param {string} description - User's raw description.
 * @returns {Promise<Object>} - Enhanced description and feature list.
 */
const enrichProject = async (name, description) => {
  try {
    console.log('✨ Enhancing project concept...');
    console.log('  - Loading AI enrichment model...');
    const { pipeline } = await import('@xenova/transformers');
    const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M');

    // 1. Generate a better description
    const descPrompt = `Enhance this hackathon project description to sound professional and exciting for a README.
  Project Name: ${name}
  Raw Description: ${description}
  Enhanced Description: `;

    const descOutput = await generator(descPrompt, {
      max_new_tokens: 100,
      temperature: 0.6,
      repetition_penalty: 1.2
    });

    const enhancedDescription = descOutput[0].generated_text;

    // 2. Generate feature list (simple one-shot generation)
    const featPrompt = `List 3 key technical features for a hackathon project called "${name}" which is: ${description}.
Format as a comma-separated list.
  Features: `;

    const featOutput = await generator(featPrompt, {
      max_new_tokens: 60,
      temperature: 0.5
    });

    const features = featOutput[0].generated_text.split(',').map(f => f.trim());

    return {
      description: enhancedDescription,
      features: features
    };
  } catch (error) {
    console.error('⚠ AI Enrichment failed:', error.message);
    return {
      description: description,
      features: []
    };
  }
}

module.exports = { enrichProject };
