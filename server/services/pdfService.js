import { logger } from 'firebase-functions';
import pdfParse from 'pdf-parse';
import { isTextMeaningful } from './textCleaningService.js';
import { rasterizePdfToImages, runOcrOnImages } from './ocrService.js';

/**
 * Extracts text from a PDF buffer.
 *
 * Strategy:
 *  1. Attempt native text extraction with pdf-parse (fast, lossless).
 *  2. If the extracted text fails the meaningfulness threshold (e.g. a scanned
 *     PDF), fall back to OCR: rasterise each page with pdfjs-dist and run
 *     Tesseract on the resulting images.
 *
 * @param {Buffer} buffer       Raw PDF bytes.
 * @param {string} [language]   App language code used to select the correct
 *                              Tesseract language pack for the OCR fallback.
 *                              Defaults to 'en'.
 * @returns {Promise<{ text: string, numPages: number, info: object, extractionMethod: 'native' | 'ocr' }>}
 */
export async function extractTextFromPdf(buffer, language = 'en') {
  let nativeData;

  try {
    nativeData = await pdfParse(buffer);
  } catch (error) {
    logger.error('pdf-parse failed', { error: error.message });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }

  const { text: rawText, numpages: numPages, info } = nativeData;

  // Check whether the native extraction produced meaningful text.
  if (isTextMeaningful(rawText)) {
    logger.info('PDF text extracted natively', {
      numPages,
      charCount: rawText.length,
    });
    return {
      text: rawText,
      numPages,
      info,
      extractionMethod: 'native',
    };
  }

  // Native text is below the threshold — this is likely a scanned PDF.
  // Fall back to OCR.
  logger.info('Native PDF text below threshold — falling back to OCR', {
    numPages,
    nativeCharCount: rawText.replace(/\s+/g, '').length,
  });

  const pageImages = await rasterizePdfToImages(buffer);

  if (pageImages.length === 0) {
    throw new Error('PDF rasterisation produced no pages — cannot perform OCR');
  }

  const ocrText = await runOcrOnImages(pageImages, language);

  logger.info('PDF OCR complete', {
    numPages,
    ocrCharCount: ocrText.length,
  });

  return {
    text: ocrText,
    numPages,
    info,
    extractionMethod: 'ocr',
  };
}
