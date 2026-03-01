import { logger } from 'firebase-functions';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { config } from '../config.js';

// ---------------------------------------------------------------------------
// Tesseract worker singleton
// ---------------------------------------------------------------------------
// Firebase Cloud Functions reuses warm instances between invocations. Keeping
// the worker alive at module scope avoids the 100–300 ms startup cost and the
// language-data download on every request. The worker is reinitialised only
// when the requested language changes.

let _worker = null;
let _workerLang = null;

async function getWorker(language) {
  const tessLang = config.tesseractLangMap[language] ?? 'eng';

  if (_worker && _workerLang === tessLang) {
    return _worker;
  }

  // Terminate the existing worker if it was for a different language.
  if (_worker) {
    try {
      await _worker.terminate();
    } catch (err) {
      logger.warn('Failed to terminate previous Tesseract worker', { error: err.message });
    }
  }

  logger.info('Initialising Tesseract worker', { tessLang });
  _worker = await createWorker(tessLang);
  _workerLang = tessLang;
  return _worker;
}

// ---------------------------------------------------------------------------
// Image preprocessing
// ---------------------------------------------------------------------------

/**
 * Preprocesses a raw image buffer with sharp to maximise OCR accuracy.
 * Applies greyscale conversion, contrast normalisation, and a light sharpen.
 * If preprocessing fails for any reason the original buffer is returned so
 * that OCR can still be attempted on the unprocessed image.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<Buffer>}
 */
async function preprocessImageForOcr(imageBuffer) {
  try {
    return await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1 })
      .png()
      .toBuffer();
  } catch (err) {
    logger.warn('Image preprocessing failed — using raw buffer for OCR', {
      error: err.message,
    });
    return imageBuffer;
  }
}

// ---------------------------------------------------------------------------
// PDF rasterisation
// ---------------------------------------------------------------------------

/**
 * Renders each page of a PDF to a PNG buffer using pdfjs-dist.
 * Pages that fail to render are skipped with a warning; the rest are returned.
 * Returns an empty array if the PDF cannot be loaded at all.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Buffer[]>} Array of PNG buffers, one per successfully rendered page.
 */
export async function rasterizePdfToImages(pdfBuffer) {
  // pdfjs-dist is a CommonJS/ESM hybrid. We import the Node-compatible build
  // which does not require a browser DOM. The canvas package provides the
  // NodeCanvasFactory that pdfjs-dist uses for off-screen rendering.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas } = await import('canvas');

  const scale = config.ocrPdfDpi / 72; // PDF points are 1/72 inch

  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      // Disable CMap fetching — not needed for basic text extraction via OCR
      cMapUrl: null,
      cMapPacked: false,
    });
    pdf = await loadingTask.promise;
  } catch (err) {
    logger.error('Failed to load PDF for rasterisation', { error: err.message });
    return [];
  }

  const numPages = pdf.numPages;
  logger.info('Rasterising PDF for OCR', { numPages, dpi: config.ocrPdfDpi });

  const pageBuffers = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(
        Math.round(viewport.width),
        Math.round(viewport.height)
      );
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const pngBuffer = canvas.toBuffer('image/png');
      pageBuffers.push(pngBuffer);

      page.cleanup();
    } catch (err) {
      logger.warn('Failed to rasterise PDF page — skipping', {
        pageNum,
        error: err.message,
      });
    }
  }

  return pageBuffers;
}

// ---------------------------------------------------------------------------
// OCR runners
// ---------------------------------------------------------------------------

/**
 * Runs OCR on an array of image buffers (typically PDF pages already rasterised)
 * and returns the combined text with pages separated by a double newline.
 *
 * @param {Buffer[]} imageBuffers
 * @param {string} language  App language code (e.g. 'en', 'hi').
 * @returns {Promise<string>}
 */
export async function runOcrOnImages(imageBuffers, language = 'en') {
  if (!imageBuffers || imageBuffers.length === 0) return '';

  const worker = await getWorker(language);
  const pageTexts = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    try {
      const processedBuffer = await preprocessImageForOcr(imageBuffers[i]);
      const { data } = await worker.recognize(processedBuffer);
      if (data.text && data.text.trim().length > 0) {
        pageTexts.push(data.text);
      }
    } catch (err) {
      logger.warn('OCR failed for image buffer — skipping', {
        bufferIndex: i,
        error: err.message,
      });
    }
  }

  return pageTexts.join('\n\n');
}

/**
 * Convenience function for running OCR directly on a single JPEG or PNG buffer
 * (i.e. an image uploaded directly, not converted from a PDF).
 *
 * @param {Buffer} imageBuffer
 * @param {string} language  App language code (e.g. 'en', 'hi').
 * @returns {Promise<string>}
 */
export async function runOcrOnBuffer(imageBuffer, language = 'en') {
  const worker = await getWorker(language);
  const processedBuffer = await preprocessImageForOcr(imageBuffer);
  const { data } = await worker.recognize(processedBuffer);
  return data.text ?? '';
}
