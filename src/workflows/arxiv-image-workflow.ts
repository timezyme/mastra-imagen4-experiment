import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { jsonExtractorTool } from '../tools/json-extractor.js';
import { imagen4GeneratorTool } from '../tools/imagen4-generator.js';
import { promptGeneratorAgent } from '../agents/prompt-generator.js';

// Define the workflow input schema
const workflowInputSchema = z.object({
  jsonFilePath: z.string().describe('Path to the arXiv JSON file'),
  paperId: z.string().describe('arXiv paper ID (e.g., 2502.14902)'),
});

// Define the workflow output schema
const workflowOutputSchema = z.object({
  imagePath: z.string(),
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

// Step 2: Generate image prompt using AI agent
const generatePromptStep = createStep({
  id: 'generate-prompt',
  inputSchema: z.object({
    extractedText: z.string(),
    paperId: z.string(),
  }),
  outputSchema: z.object({
    imagePrompt: z.string(),
    paperId: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { extractedText, paperId } = inputData;

    console.log('🤖 Step 2: Generating image prompt with Gemini Flash 2.5...');
    console.log(`Input text preview: ${extractedText.substring(0, 200)}...\n`);

    const agentResponse = await promptGeneratorAgent.generate(
      `Based on the following arXiv paper content, create a highly detailed, creative, and imaginative image prompt that would produce a stunning visual representation:\n\n${extractedText}`
    );

    const imagePrompt = agentResponse.text;

    console.log('✓ Generated image prompt:');
    console.log(`"${imagePrompt}"\n`);

    return {
      imagePrompt,
      paperId, // Pass through paperId
    };
  },
});

// Step 3: Generate image with Imagen4
const generateImageStep = createStep({
  id: 'generate-image',
  inputSchema: z.object({
    imagePrompt: z.string(),
    paperId: z.string(),
  }),
  outputSchema: z.object({
    imagePath: z.string(),
    success: z.boolean(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { imagePrompt, paperId } = inputData;

    console.log('🎨 Step 3: Generating image with Imagen4...');

    const outputPath = `./images/arxiv/${paperId}.png`;

    const result = await imagen4GeneratorTool.execute({
      context: {
        prompt: imagePrompt,
        outputPath,
      },
      runtimeContext,
    });

    console.log(`✓ Image generated successfully!`);
    console.log(`✓ Saved to: ${result.imagePath}\n`);

    return {
      imagePath: result.imagePath,
      success: result.success,
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
    };
  })
  .then(generatePromptStep)
  .map(async ({ getStepResult }) => {
    const promptResult = getStepResult(generatePromptStep);
    return {
      imagePrompt: promptResult.imagePrompt,
      paperId: promptResult.paperId,
    };
  })
  .then(generateImageStep);
