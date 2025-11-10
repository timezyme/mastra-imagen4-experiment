import { createTool } from '@mastra/core';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { config } from '../config.js';

// Schema for the JSON structure
const ArticleSectionSchema = z.object({
  id: z.string(),
  section: z.string(),
  section_highlights: z.array(z.string()),
  section_keywords: z.string(),
});

const ArxivJsonSchema = z.object({
  article_sections: z.array(ArticleSectionSchema),
});

export const jsonExtractorTool = createTool({
  id: 'json-extractor',
  description: `Extract the first N lines of text from an arXiv paper JSON file. Reads article sections and extracts highlights to create a text summary.`,
  inputSchema: z.object({
    filePath: z.string().describe('Path to the JSON file to extract from'),
    linesToExtract: z
      .number()
      .optional()
      .describe('Number of lines to extract (defaults to config value)'),
  }),
  outputSchema: z.object({
    extractedText: z.string().describe('Extracted text from the JSON file'),
    totalSections: z.number().describe('Total number of sections in the file'),
    extractedSections: z.number().describe('Number of sections extracted'),
  }),
  execute: async ({ context }) => {
    const { filePath, linesToExtract = config.extraction.linesToExtract } = context;

    try {
      // Read the JSON file
      const fileContent = await readFile(filePath, 'utf-8');
      const jsonData = ArxivJsonSchema.parse(JSON.parse(fileContent));

      // Extract text from sections
      const textLines: string[] = [];
      let sectionsProcessed = 0;

      for (const section of jsonData.article_sections) {
        // Add section title
        textLines.push(section.section);

        // Add highlights
        for (const highlight of section.section_highlights) {
          textLines.push(`- ${highlight}`);

          // Check if we've reached the line limit
          if (textLines.length >= linesToExtract) {
            sectionsProcessed++;
            const extractedText = textLines.slice(0, linesToExtract).join('\n');
            return {
              extractedText,
              totalSections: jsonData.article_sections.length,
              extractedSections: sectionsProcessed,
            };
          }
        }

        // Add keywords
        textLines.push(`Keywords: ${section.section_keywords}`);
        textLines.push(''); // Empty line between sections

        sectionsProcessed++;

        // Check if we've reached the line limit after adding keywords
        if (textLines.length >= linesToExtract) {
          const extractedText = textLines.slice(0, linesToExtract).join('\n');
          return {
            extractedText,
            totalSections: jsonData.article_sections.length,
            extractedSections: sectionsProcessed,
          };
        }
      }

      // If we haven't reached the limit, return all text
      const extractedText = textLines.join('\n');
      return {
        extractedText,
        totalSections: jsonData.article_sections.length,
        extractedSections: sectionsProcessed,
      };
    } catch (error) {
      throw new Error(
        `Failed to extract from JSON file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
