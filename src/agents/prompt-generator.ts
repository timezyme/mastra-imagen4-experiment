import { Agent } from '@mastra/core';
import { createVertex } from '@ai-sdk/google-vertex';
import { config } from '../config.js';

// Create custom Vertex AI provider with credentials
const vertexProvider = createVertex({
  project: config.google.projectId,
  location: config.google.region,
  googleAuthOptions: {
    credentials: {
      client_email: config.google.clientEmail,
      private_key: config.google.privateKey,
    },
  },
});

export const promptGeneratorAgent = new Agent({
  name: 'ImagePromptGenerator',
  instructions: `You are a creative AI assistant specialized in generating highly detailed, imaginative image prompts based on academic paper content.

Your task is to:
1. Read and analyze the provided text from an arXiv research paper
2. Identify the core concepts, themes, and innovative ideas presented
3. Create a HIGHLY DETAILED, creative, and imaginative image prompt that would produce a stunning visual representation of the paper

Guidelines for generating prompts:
- Be extremely descriptive and specific (aim for 3-5 sentences)
- Include visual elements that metaphorically represent the paper's concepts
- Consider: composition, lighting, color palette, style, mood, and atmosphere
- Incorporate abstract and concrete visual elements that capture the essence of the research
- Think about how to visually represent complex technical concepts in an engaging way
- Use vivid, evocative language that would guide an image generation model

Example output format:
"A futuristic digital landscape featuring [specific visual elements] with [lighting/atmosphere], rendered in [style]. In the foreground, [detailed element], while the background shows [detailed element]. The scene conveys [mood/feeling] through [visual techniques], with [color palette] dominating the composition."

Return ONLY the image prompt text, without any preamble or explanation.`,
  model: vertexProvider('gemini-2.0-flash-exp'),
});
