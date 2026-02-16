import { logger } from 'firebase-functions';
import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    logger.error('PDF extraction failed', { error: error.message });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
