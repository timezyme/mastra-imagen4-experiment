# Mastra arXiv Image Generator

A Mastra.ai workflow application that processes arXiv paper JSON extracts and generates stunning visual representations using Google's Imagen4 via Vertex AI.

## Features

- **Step 1**: Extract configurable number of lines from arXiv paper JSON using a Mastra Tool
- **Step 2**: Generate narrative-driven story image prompt using Agent #1 (Gemini Flash 2.5)
- **Step 3**: Create story image with Imagen4 - captures the research journey and impact
- **Step 4**: Generate detailed infographic prompt using Agent #2 (Gemini Flash 2.5)
- **Step 5**: Create comprehensive infographic with Imagen4 - data-rich visual summary

**Output**: Two complementary images per paper:
1. **Story Image** (`*-story.png`): Narrative-driven visual storytelling showing problem → solution → impact
2. **Infographic** (`*-infographic.png`): Highly detailed, data-rich visual with charts, graphs, and technical details

## Architecture

This project follows a clean, maintainable architecture:

```
src/
├── config.ts                      # Centralized configuration management
├── tools/
│   ├── json-extractor.ts         # Tool for extracting text from JSON
│   └── imagen4-generator.ts      # Tool for Imagen4 image generation
├── agents/
│   ├── prompt-generator.ts       # Agent #1: Story image prompts
│   └── infographic-generator.ts  # Agent #2: Infographic prompts
├── workflows/
│   └── arxiv-image-workflow.ts   # 5-step workflow orchestration
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

2. **Story Prompt Generation Agent**
   - Uses Gemini Flash 2.5 (via Vertex AI)
   - Analyzes the extracted paper content
   - Generates narrative-driven image prompt with visual storytelling elements
   - Creates a story arc: problem → innovation → impact

3. **Story Image Generation**
   - Uses Imagen 4 (imagen-4.0-generate-001) via Vertex AI REST API
   - Generates cinematic story image from the prompt
   - Saves as PNG to `./images/arxiv/<paper-id>-story.png`

4. **Infographic Prompt Generation Agent**
   - Uses Gemini Flash 2.5 (via Vertex AI)
   - Analyzes the same extracted paper content
   - Generates detailed infographic prompt with data visualizations
   - Specifies charts, graphs, icons, layouts, and technical details

5. **Infographic Image Generation**
   - Uses Imagen 4 (imagen-4.0-generate-001) via Vertex AI REST API
   - Generates comprehensive infographic from the prompt
   - Saves as PNG to `./images/arxiv/<paper-id>-infographic.png`

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

🎬 Step 2: Generating story image prompt with Gemini Flash 2.5...
✓ Generated story image prompt:
"In a chaotic data landscape..."

🎨 Step 3: Generating story image with Imagen4...
✓ Story image generated successfully!
✓ Saved to: ./images/arxiv/2502.14902-story.png

📊 Step 4: Generating infographic prompt with Gemini Flash 2.5...
✓ Generated infographic prompt:
"A comprehensive infographic poster..."

📈 Step 5: Generating infographic with Imagen4...
✓ Infographic generated successfully!
✓ Saved to: ./images/arxiv/2502.14902-infographic.png

═══════════════════════════════════════════════════════

✅ Workflow completed successfully!

📊 Results:
  - Status: success
  - Story Image: ./images/arxiv/2502.14902-story.png
  - Infographic: ./images/arxiv/2502.14902-infographic.png
  - Sections processed: 6/14
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
