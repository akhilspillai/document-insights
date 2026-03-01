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
  // Users exempt from analysis quota
  whitelistedUserIds: ['Un1c9UWWcbNrZHGFd1CMvJiCHnU2'],

  // Document queries
  documentsQueryLimit: 20,

  // Grok AI
  grokModel: 'grok-3-latest',
  grokBaseUrl: 'https://api.x.ai/v1',
  grokTemperature: 0.3,

  // Language
  supportedLanguages: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'],
  defaultLanguage: 'en',

  // OCR
  // Minimum non-whitespace character count from pdf-parse before falling back to OCR.
  // 100 chars is a conservative floor — scanned PDFs typically yield near-zero real text.
  ocrTextThreshold: 100,
  // Hard ceiling on characters sent to the LLM. Truncation happens at the last paragraph
  // boundary within the final 200 chars to avoid mid-sentence cuts.
  ocrMaxCharsForLlm: 50000,
  // Effective DPI when rasterizing PDF pages for OCR. 150 is a good balance of speed
  // and legibility; raise to 200 for documents with very small fonts.
  ocrPdfDpi: 150,
  // Maps app language codes to Tesseract language pack identifiers.
  // Marathi uses Devanagari script — adding hin improves shared-glyph recognition.
  tesseractLangMap: {
    en: 'eng',
    hi: 'hin',
    ta: 'tam',
    te: 'tel',
    kn: 'kan',
    ml: 'mal',
    mr: 'mar+hin',
  },
};
