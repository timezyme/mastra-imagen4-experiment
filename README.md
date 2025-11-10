# Mastra arXiv Image Generator

A Mastra.ai workflow application that processes arXiv paper JSON extracts and generates stunning visual representations using Google's Imagen4 via Vertex AI.

## Features

- **Step 1**: Extract configurable number of lines from arXiv paper JSON using a Mastra Tool
- **Step 2**: Generate detailed, creative image prompts using a Mastra Agent powered by Gemini Flash 2.5
- **Step 3**: Create stunning images with Imagen4 (imagen-4.0-generate-001) and save as PNG

## Architecture

This project follows a clean, maintainable architecture:

```
src/
├── config.ts                      # Centralized configuration management
├── tools/
│   ├── json-extractor.ts         # Tool for extracting text from JSON
│   └── imagen4-generator.ts      # Tool for Imagen4 image generation
├── agents/
│   └── prompt-generator.ts       # Agent using Gemini Flash 2.5
├── workflows/
│   └── arxiv-image-workflow.ts   # 3-step workflow orchestration
└── index.ts                       # Application entry point
```

## Prerequisites

- Node.js 18 or higher
- Google Cloud Project with Vertex AI API enabled
- Service account with "Vertex AI User" role

### Setting up Google Cloud

1. Create a Google Cloud project
2. Enable Vertex AI API
3. Create a service account with Vertex AI User role
4. Download the service account JSON key

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Google Cloud credentials:

```bash
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note**: Make sure to keep the quotes and `\n` newline characters in `GOOGLE_PRIVATE_KEY`.

### 3. Prepare test data (optional)

A sample arXiv paper JSON is already included at `arxiv/2502.14902/sections-extract.json`.

To use your own paper:
```bash
mkdir -p arxiv/<paper-id>
# Place your sections-extract.json in that directory
```

## Usage

### Run in development mode

```bash
npm run dev
```

### Build and run in production

```bash
npm run build
npm start
```

### Override default file paths

Set environment variables before running:

```bash
JSON_FILE_PATH=./arxiv/your-paper-id/sections-extract.json PAPER_ID=your-paper-id npm run dev
```

## Configuration

All configuration is managed through environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_PROJECT_ID` | Your GCP project ID | Required |
| `GOOGLE_CLIENT_EMAIL` | Service account email | Required |
| `GOOGLE_PRIVATE_KEY` | Service account private key | Required |
| `GOOGLE_REGION` | Vertex AI region | `us-central1` |
| `JSON_EXTRACT_LINES` | Number of lines to extract | `100` |
| `IMAGE_WIDTH` | Image width (mapped to aspect ratio) | `1024` |
| `IMAGE_HEIGHT` | Image height (mapped to aspect ratio) | `1024` |
| `IMAGE_OUTPUT_DIR` | Directory for saved images | `./images/arxiv` |

**Note on Image Dimensions**: Imagen 4 uses aspect ratios (1:1, 9:16, 16:9, 3:4, 4:3). The application automatically maps your `IMAGE_WIDTH` and `IMAGE_HEIGHT` to the closest supported aspect ratio.

## How It Works

### Workflow Steps

1. **JSON Extraction Tool**
   - Reads the arXiv paper JSON file
   - Extracts the first N lines (configurable) of text from article sections
   - Returns structured text for prompt generation

2. **Prompt Generation Agent**
   - Uses Gemini Flash 2.5 (via Vertex AI)
   - Analyzes the extracted paper content
   - Generates a highly detailed, creative image prompt (3-5 sentences)
   - Designed to create visually stunning representations of research concepts

3. **Image Generation Tool**
   - Uses Imagen 4 (imagen-4.0-generate-001) via Vertex AI REST API
   - Generates high-quality images from the prompt
   - Saves as PNG to `./images/arxiv/<paper-id>.png`

## Example Output

When you run the workflow, you'll see:

```
🚀 Mastra arXiv Image Generator
================================

✓ Configuration validated
✓ Mastra initialized with tools, agents, and workflows

📋 Configuration:
  - JSON file: ./arxiv/2502.14902/sections-extract.json
  - Paper ID: 2502.14902
  - Lines to extract: 100
  - Image size: 1024x1024
  - Output directory: ./images/arxiv

Starting workflow...

═══════════════════════════════════════════════════════

📄 Step 1: Extracting text from ./arxiv/2502.14902/sections-extract.json...
✓ Extracted 6 of 14 sections
✓ Extracted text length: 1234 characters

🤖 Step 2: Generating image prompt with Gemini Flash 2.5...
✓ Generated image prompt:
"A futuristic digital landscape featuring..."

🎨 Step 3: Generating image with Imagen4...
✓ Image generated successfully!
✓ Saved to: ./images/arxiv/2502.14902.png

═══════════════════════════════════════════════════════

✅ Workflow completed successfully!
```

## Development Philosophy

This project follows the principles of:

- ✅ **Architecturally sound**: Clean separation of concerns (tools, agents, workflows)
- ✅ **Code quality**: Modular design with TypeScript type safety
- ❌ **Not over-complicated**: Pragmatic implementation without excessive abstraction
- ❌ **Not over-engineered**: Focus on working code over premature optimization

## Troubleshooting

### Authentication Errors

Make sure your `GOOGLE_PRIVATE_KEY` includes the full key with header and footer:
```
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

### Imagen API Errors

- Verify Vertex AI API is enabled in your GCP project
- Check that your service account has "Vertex AI User" role
- Ensure you're using the GA model: `imagen-4.0-generate-001`

### File Not Found

- Check that your JSON file path is correct
- Verify the JSON structure matches the expected format

## License

MIT

## References

- [Mastra.ai Documentation](https://mastra.ai/docs)
- [Google Vertex AI Imagen 4](https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate-001)
- [Reference Project: timezyme-experiment](https://github.com/timezyme/timezyme-experiment)
