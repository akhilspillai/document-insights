import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load system message and user prompt templates
const systemMessage = fs.readFileSync(
  path.join(__dirname, '..', 'system_message.txt'),
  'utf-8'
);
const userPromptTemplate = fs.readFileSync(
  path.join(__dirname, '..', 'user_prompt.txt'),
  'utf-8'
);

// Lazily initialize Grok client (xAI uses OpenAI-compatible API)
let grok;
function getGrokClient() {
  if (!grok) {
    if (!process.env.GROK_API_KEY) {
      throw new Error('GROK_API_KEY environment variable is not set');
    }
    grok = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }
  return grok;
}

export async function analyzeDocument(extractedText) {

  // Replace placeholder with extracted text
  const userPrompt = userPromptTemplate.replace('{{EXTRACTED_TEXT}}', extractedText);

  try {
    const response = await getGrokClient().chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from Grok');
    }

    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const analysis = JSON.parse(jsonString);
    return analysis;
  } catch (error) {
    console.error('Grok API error:', error);
    throw new Error(`Failed to analyze document with Grok: ${error.message}`);
  }
}
