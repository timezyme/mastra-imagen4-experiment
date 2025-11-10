import 'dotenv/config';

export const config = {
  google: {
    projectId: process.env.GOOGLE_PROJECT_ID || '',
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    region: process.env.GOOGLE_REGION || 'us-central1',
  },
  extraction: {
    linesToExtract: parseInt(process.env.JSON_EXTRACT_LINES || '100', 10),
  },
  image: {
    width: parseInt(process.env.IMAGE_WIDTH || '1024', 10),
    height: parseInt(process.env.IMAGE_HEIGHT || '1024', 10),
    outputDir: process.env.IMAGE_OUTPUT_DIR || './images/arxiv',
  },
} as const;

// Validate required configuration
export function validateConfig() {
  const required = [
    { key: 'GOOGLE_PROJECT_ID', value: config.google.projectId },
    { key: 'GOOGLE_CLIENT_EMAIL', value: config.google.clientEmail },
    { key: 'GOOGLE_PRIVATE_KEY', value: config.google.privateKey },
  ];

  const missing = required.filter((r) => !r.value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map((m) => m.key).join(', ')}`
    );
  }
}
