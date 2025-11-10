import { createTool } from '@mastra/core';
import { z } from 'zod';
import { GoogleAuth } from 'google-auth-library';
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

// Define API response type
interface Imagen4Response {
  predictions: Array<{
    bytesBase64Encoded: string;
    mimeType?: string;
  }>;
}

export const imagen4GeneratorTool = createTool({
  id: 'imagen4-generator',
  description: `Generate an image using Google's Imagen 4 model via Vertex AI. Takes a text prompt and generates a high-quality image.`,
  inputSchema,
  outputSchema,
  execute: async ({ context }: { context: z.infer<typeof inputSchema> }) => {
    const {
      prompt,
      outputPath,
      width = config.image.width,
      height = config.image.height,
    } = context;

    try {
      // Create the output directory if it doesn't exist
      const dir = dirname(outputPath);
      await mkdir(dir, { recursive: true });

      // Initialize Google Auth
      const auth = new GoogleAuth({
        credentials: {
          client_email: config.google.clientEmail,
          private_key: config.google.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Failed to obtain access token');
      }

      // Construct the API endpoint
      const endpoint = `https://${config.google.region}-aiplatform.googleapis.com/v1/projects/${config.google.projectId}/locations/${config.google.region}/publishers/google/models/imagen-4.0-generate-001:predict`;

      // Prepare the request payload
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: determineAspectRatio(width, height),
          // Imagen 4 uses aspect ratio instead of exact dimensions
        },
      };

      // Make the API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Imagen API request failed: ${response.status} ${errorText}`);
      }

      const result = (await response.json()) as Imagen4Response;

      // Extract the base64-encoded image
      if (!result.predictions || result.predictions.length === 0) {
        throw new Error('No image was generated');
      }

      const prediction = result.predictions[0];
      const imageBase64 = prediction.bytesBase64Encoded;

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      await writeFile(outputPath, imageBuffer);

      return {
        imagePath: outputPath,
        success: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate image with Imagen4: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

/**
 * Determine the aspect ratio based on width and height
 * Imagen 4 supports specific aspect ratios
 */
function determineAspectRatio(width: number, height: number): string {
  const ratio = width / height;

  // Map to closest supported aspect ratio
  // Imagen 4 supports: 1:1, 9:16, 16:9, 3:4, 4:3
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16';
  if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9';
  if (Math.abs(ratio - 3 / 4) < 0.1) return '3:4';
  if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3';

  // Default to square if no close match
  return '1:1';
}
