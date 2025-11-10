import { Mastra } from '@mastra/core';
import { config, validateConfig } from './config.js';
import { promptGeneratorAgent } from './agents/prompt-generator.js';
import { infographicGeneratorAgent } from './agents/infographic-generator.js';
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
    agents: {
      [promptGeneratorAgent.name]: promptGeneratorAgent,
      [infographicGeneratorAgent.name]: infographicGeneratorAgent,
    },
    workflows: {
      [arxivImageWorkflow.id]: arxivImageWorkflow,
    },
  });

  console.log('✓ Mastra initialized with 2 agents and workflow\n');

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

    // Get the workflow and create a run
    const workflow = mastra.getWorkflow(arxivImageWorkflow.id);
    const run = await workflow.createRunAsync();

    // Execute the workflow
    const result = await run.start({
      inputData: {
        jsonFilePath,
        paperId,
      },
    });

    console.log('═'.repeat(60));
    console.log('\n✅ Workflow completed successfully!\n');
    console.log('📊 Results:');
    console.log(`  - Status: ${result.status}`);

    if (result.status === 'success') {
      console.log(`\n  Story Images:`);
      console.log(`    - Imagen4: ${result.result.storyImageImagen}`);
      console.log(`    - Nano Banana: ${result.result.storyImageNanoBanana}`);
      console.log(`\n  Infographics:`);
      console.log(`    - Imagen4: ${result.result.infographicImagen}`);
      console.log(`    - Nano Banana: ${result.result.infographicNanoBanana}`);
      console.log(`\n  - Sections processed: ${result.result.extractedSections}/${result.result.totalSections}`);
    } else if (result.status === 'failed') {
      console.error(`  - Error: ${result.error}`);
    } else {
      console.error(`  - Unexpected status: ${result.status}`);
    }

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
