export const config = {
  // Upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
  ],

  // Quota
  analysisLimit: 5,

  // Document queries
  documentsQueryLimit: 20,

  // Grok AI
  grokModel: 'grok-3-latest',
  grokBaseUrl: 'https://api.x.ai/v1',
  grokTemperature: 0.3,

  // Language
  supportedLanguages: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'],
  defaultLanguage: 'en',
};
