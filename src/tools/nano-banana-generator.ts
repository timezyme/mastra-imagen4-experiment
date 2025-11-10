import { createTool } from '@mastra/core';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { config } from '../config.js';

// Define schemas first
const inputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from'),
  outputPath: z.string().describe('Path where the generated image should be saved'),
  width: z.number().optional().describe('Image width (defaults to config value)'),
  height: z.number().optional().describe('Image height (defaults to config value)'),
});

const outputSchema = z.object({
  imagePath: z.string().describe('Path where the image was saved'),
  success: z.boolean().describe('Whether the image generation was successful'),
});

export const nanoBananaGeneratorTool = createTool({
  id: 'nano-banana-generator',
  description: `Generate an image using Google's Nano Banana (Gemini 2.5 Flash Image) model via Vertex AI. Takes a text prompt and generates a high-quality image.`,
  inputSchema,
  outputSchema,
  execute: async ({ context }: { context: z.infer<typeof inputSchema> }) => {
    const {
      prompt,
      outputPath,
    } = context;

    try {
      // Create the output directory if it doesn't exist
      const dir = dirname(outputPath);
      await mkdir(dir, { recursive: true });

      // Initialize GoogleGenAI client for Vertex AI
      const client = new GoogleGenAI({
        vertexai: true,
        project: config.google.projectId,
        location: config.google.region,
        googleAuthOptions: {
          credentials: {
            client_email: config.google.clientEmail,
            private_key: config.google.privateKey,
          },
        },
      });

      // Generate image using Nano Banana (gemini-2.5-flash-image)
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts: [{ text: prompt }],
        }],
      });

      // Extract the image from the response
      let imageData: string | null = null;

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageData = part.inlineData.data;
              break;
            }
          }
        }
      }

      if (!imageData) {
        throw new Error('No image was generated in the response');
      }

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imageData, 'base64');
      await writeFile(outputPath, imageBuffer);

      return {
        imagePath: outputPath,
        success: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate image with Nano Banana: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
