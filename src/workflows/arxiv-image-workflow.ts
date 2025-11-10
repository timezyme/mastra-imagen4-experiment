import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { jsonExtractorTool } from '../tools/json-extractor.js';
import { imagen4GeneratorTool } from '../tools/imagen4-generator.js';
import { promptGeneratorAgent } from '../agents/prompt-generator.js';
import { infographicGeneratorAgent } from '../agents/infographic-generator.js';

// Define the workflow input schema
const workflowInputSchema = z.object({
  jsonFilePath: z.string().describe('Path to the arXiv JSON file'),
  paperId: z.string().describe('arXiv paper ID (e.g., 2502.14902)'),
});

// Define the workflow output schema
const workflowOutputSchema = z.object({
  storyImagePath: z.string(),
  infographicPath: z.string(),
  success: z.boolean(),
  extractedSections: z.number(),
  totalSections: z.number(),
});

// Step 1: Extract text from JSON file
const extractJsonStep = createStep({
  id: 'extract-json',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    extractedText: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
    paperId: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { jsonFilePath, paperId } = inputData;

    console.log(`\n📄 Step 1: Extracting text from ${jsonFilePath}...`);

    const result = await jsonExtractorTool.execute({
      context: { filePath: jsonFilePath },
      runtimeContext,
    });

    console.log(
      `✓ Extracted ${result.extractedSections} of ${result.totalSections} sections`
    );
    console.log(`✓ Extracted text length: ${result.extractedText.length} characters\n`);

    return {
      extractedText: result.extractedText,
      totalSections: result.totalSections,
      extractedSections: result.extractedSections,
      paperId, // Pass through paperId
    };
  },
});

// Step 2: Generate story image prompt using AI agent
const generateStoryPromptStep = createStep({
  id: 'generate-story-prompt',
  inputSchema: z.object({
    extractedText: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  outputSchema: z.object({
    storyPrompt: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  execute: async ({ inputData }) => {
    const { extractedText, paperId, totalSections, extractedSections } = inputData;

    console.log('🎬 Step 2: Generating story image prompt with Gemini Flash 2.5...');
    console.log(`Input text preview: ${extractedText.substring(0, 200)}...\n`);

    const agentResponse = await promptGeneratorAgent.generate(
      `Based on the following arXiv paper content, create a highly detailed, creative, and imaginative image prompt that would produce a stunning visual representation:\n\n${extractedText}`
    );

    const storyPrompt = agentResponse.text;

    console.log('✓ Generated story image prompt:');
    console.log(`"${storyPrompt}"\n`);

    return {
      storyPrompt,
      paperId,
      totalSections,
      extractedSections,
    };
  },
});

// Step 3: Generate story image with Imagen4
const generateStoryImageStep = createStep({
  id: 'generate-story-image',
  inputSchema: z.object({
    storyPrompt: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  outputSchema: z.object({
    storyImagePath: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { storyPrompt, paperId, totalSections, extractedSections } = inputData;

    console.log('🎨 Step 3: Generating story image with Imagen4...');

    const outputPath = `./images/arxiv/${paperId}-story.png`;

    const result = await imagen4GeneratorTool.execute({
      context: {
        prompt: storyPrompt,
        outputPath,
      },
      runtimeContext,
    });

    console.log(`✓ Story image generated successfully!`);
    console.log(`✓ Saved to: ${result.imagePath}\n`);

    return {
      storyImagePath: result.imagePath,
      paperId,
      totalSections,
      extractedSections,
    };
  },
});

// Step 4: Generate infographic prompt using AI agent
const generateInfographicPromptStep = createStep({
  id: 'generate-infographic-prompt',
  inputSchema: z.object({
    storyImagePath: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  outputSchema: z.object({
    infographicPrompt: z.string(),
    storyImagePath: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  execute: async ({ inputData, getStepResult }) => {
    const { storyImagePath, paperId, totalSections, extractedSections } = inputData;

    // Get the original extracted text from step 1
    const extractResult = getStepResult(extractJsonStep);
    const extractedText = extractResult.extractedText;

    console.log('📊 Step 4: Generating infographic prompt with Gemini Flash 2.5...');
    console.log(`Input text preview: ${extractedText.substring(0, 200)}...\n`);

    const agentResponse = await infographicGeneratorAgent.generate(
      `Based on the following arXiv paper content, create a highly detailed infographic prompt that would produce a comprehensive, data-rich visual summary:\n\n${extractedText}`
    );

    const infographicPrompt = agentResponse.text;

    console.log('✓ Generated infographic prompt:');
    console.log(`"${infographicPrompt}"\n`);

    return {
      infographicPrompt,
      storyImagePath,
      paperId,
      totalSections,
      extractedSections,
    };
  },
});

// Step 5: Generate infographic image with Imagen4
const generateInfographicImageStep = createStep({
  id: 'generate-infographic-image',
  inputSchema: z.object({
    infographicPrompt: z.string(),
    storyImagePath: z.string(),
    paperId: z.string(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  outputSchema: z.object({
    infographicPath: z.string(),
    storyImagePath: z.string(),
    success: z.boolean(),
    totalSections: z.number(),
    extractedSections: z.number(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { infographicPrompt, storyImagePath, paperId, totalSections, extractedSections } = inputData;

    console.log('📈 Step 5: Generating infographic with Imagen4...');

    const outputPath = `./images/arxiv/${paperId}-infographic.png`;

    const result = await imagen4GeneratorTool.execute({
      context: {
        prompt: infographicPrompt,
        outputPath,
      },
      runtimeContext,
    });

    console.log(`✓ Infographic generated successfully!`);
    console.log(`✓ Saved to: ${result.imagePath}\n`);

    return {
      infographicPath: result.imagePath,
      storyImagePath,
      success: result.success,
      totalSections,
      extractedSections,
    };
  },
});

// Create and export the workflow
export const arxivImageWorkflow = createWorkflow({
  id: 'arxiv-image-generator',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
})
  .then(extractJsonStep)
  .map(async ({ getStepResult }) => {
    const extractResult = getStepResult(extractJsonStep);
    return {
      extractedText: extractResult.extractedText,
      paperId: extractResult.paperId,
      totalSections: extractResult.totalSections,
      extractedSections: extractResult.extractedSections,
    };
  })
  .then(generateStoryPromptStep)
  .map(async ({ getStepResult }) => {
    const promptResult = getStepResult(generateStoryPromptStep);
    return {
      storyPrompt: promptResult.storyPrompt,
      paperId: promptResult.paperId,
      totalSections: promptResult.totalSections,
      extractedSections: promptResult.extractedSections,
    };
  })
  .then(generateStoryImageStep)
  .map(async ({ getStepResult }) => {
    const imageResult = getStepResult(generateStoryImageStep);
    return {
      storyImagePath: imageResult.storyImagePath,
      paperId: imageResult.paperId,
      totalSections: imageResult.totalSections,
      extractedSections: imageResult.extractedSections,
    };
  })
  .then(generateInfographicPromptStep)
  .map(async ({ getStepResult }) => {
    const infographicPromptResult = getStepResult(generateInfographicPromptStep);
    return {
      infographicPrompt: infographicPromptResult.infographicPrompt,
      storyImagePath: infographicPromptResult.storyImagePath,
      paperId: infographicPromptResult.paperId,
      totalSections: infographicPromptResult.totalSections,
      extractedSections: infographicPromptResult.extractedSections,
    };
  })
  .then(generateInfographicImageStep)
  .commit();
