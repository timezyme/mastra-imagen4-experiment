import { Mastra } from '@mastra/core';
import { config, validateConfig } from './config.js';
import { jsonExtractorTool } from './tools/json-extractor.js';
import { imagen4GeneratorTool } from './tools/imagen4-generator.js';
import { promptGeneratorAgent } from './agents/prompt-generator.js';
import { arxivImageWorkflow } from './workflows/arxiv-image-workflow.js';

async function main() {
  console.log('🚀 Mastra arXiv Image Generator');
  console.log('================================\n');

  // Validate configuration
  try {
    validateConfig();
    console.log('✓ Configuration validated');
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Initialize Mastra
  const mastra = new Mastra({
    tools: [jsonExtractorTool, imagen4GeneratorTool],
    agents: [promptGeneratorAgent],
    workflows: [arxivImageWorkflow],
  });

  console.log('✓ Mastra initialized with tools, agents, and workflows\n');

  // Example usage - you can modify these parameters
  const jsonFilePath = process.env.JSON_FILE_PATH || './arxiv/2502.14902/sections-extract.json';
  const paperId = process.env.PAPER_ID || '2502.14902';

  console.log('📋 Configuration:');
  console.log(`  - JSON file: ${jsonFilePath}`);
  console.log(`  - Paper ID: ${paperId}`);
  console.log(`  - Lines to extract: ${config.extraction.linesToExtract}`);
  console.log(`  - Image size: ${config.image.width}x${config.image.height}`);
  console.log(`  - Output directory: ${config.image.outputDir}\n`);

  try {
    console.log('Starting workflow...\n');
    console.log('═'.repeat(60));

    // Run the workflow
    const result = await mastra
      .getWorkflow(arxivImageWorkflow.name)
      .execute({
        triggerData: {
          jsonFilePath,
          paperId,
        },
      });

    console.log('═'.repeat(60));
    console.log('\n✅ Workflow completed successfully!\n');
    console.log('📊 Results:');
    console.log(`  - Image saved to: ${result.results['generate-image'].imagePath}`);
    console.log(`  - Sections processed: ${result.results['extract-json'].extractedSections}/${result.results['extract-json'].totalSections}`);

  } catch (error) {
    console.error('\n❌ Workflow failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
