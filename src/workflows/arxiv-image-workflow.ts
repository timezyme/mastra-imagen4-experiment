import { Workflow, Step } from '@mastra/core';
import { z } from 'zod';
import { jsonExtractorTool } from '../tools/json-extractor.js';
import { imagen4GeneratorTool } from '../tools/imagen4-generator.js';
import { promptGeneratorAgent } from '../agents/prompt-generator.js';

// Define the workflow input schema
const workflowInputSchema = z.object({
  jsonFilePath: z.string().describe('Path to the arXiv JSON file'),
  paperId: z.string().describe('arXiv paper ID (e.g., 2502.14902)'),
});

// Step 1: Extract text from JSON file
const extractJsonStep = new Step({
  id: 'extract-json',
  description: 'Extract text from arXiv paper JSON file',
  execute: async ({ context, mastra }) => {
    const { jsonFilePath } = context.machineContext as z.infer<
      typeof workflowInputSchema
    >;

    console.log(`\n📄 Step 1: Extracting text from ${jsonFilePath}...`);

    const result = await mastra.getTool(jsonExtractorTool.id).execute({
      context: { filePath: jsonFilePath },
    });

    console.log(
      `✓ Extracted ${result.extractedSections} of ${result.totalSections} sections`
    );
    console.log(`✓ Extracted text length: ${result.extractedText.length} characters\n`);

    return {
      extractedText: result.extractedText,
      totalSections: result.totalSections,
      extractedSections: result.extractedSections,
    };
  },
});

// Step 2: Generate image prompt using AI agent
const generatePromptStep = new Step({
  id: 'generate-prompt',
  description: 'Generate detailed image prompt using Gemini Flash 2.5',
  execute: async ({ context }) => {
    const { extractedText } = context.stepResults['extract-json'] as {
      extractedText: string;
    };

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
    };
  },
});

// Step 3: Generate image with Imagen4
const generateImageStep = new Step({
  id: 'generate-image',
  description: 'Generate image using Imagen4',
  execute: async ({ context, mastra }) => {
    const { imagePrompt } = context.stepResults['generate-prompt'] as {
      imagePrompt: string;
    };
    const { paperId } = context.machineContext as z.infer<
      typeof workflowInputSchema
    >;

    console.log('🎨 Step 3: Generating image with Imagen4...');

    const outputPath = `./images/arxiv/${paperId}.png`;

    const result = await mastra.getTool(imagen4GeneratorTool.id).execute({
      context: {
        prompt: imagePrompt,
        outputPath,
      },
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
export const arxivImageWorkflow = new Workflow({
  name: 'arxiv-image-generator',
  triggerSchema: workflowInputSchema,
})
  .step(extractJsonStep)
  .step(generatePromptStep)
  .step(generateImageStep)
  .commit();
