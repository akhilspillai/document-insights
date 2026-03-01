import { logger } from 'firebase-functions';
import { config } from '../config.js';

/**
 * Returns true if the text contains enough non-whitespace content to be considered
 * meaningful native extraction (i.e. the PDF did not need an OCR fallback).
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isTextMeaningful(text) {
  if (!text) return false;
  return text.replace(/\s+/g, '').length >= config.ocrTextThreshold;
}

/**
 * Cleans and normalises raw extracted text before it is sent to the LLM.
 *
 * Steps applied in order:
 *  1. Strip null bytes and non-printable control characters (preserves \n \r \t).
 *  2. Dehyphenate line-wrapped words  (e.g. "recog-\nnition" → "recognition").
 *  3. Collapse runs of spaces/tabs to a single space (newlines are preserved).
 *  4. Collapse 3+ consecutive newlines to a double newline (keeps paragraph breaks).
 *  5. Trim trailing whitespace from each line.
 *  6. Trim the whole string.
 *  7. Truncate to ocrMaxCharsForLlm, preferring a paragraph boundary within
 *     the final 200 characters; log a warning when truncation occurs.
 *
 * @param {string} rawText
 * @param {{ maxChars?: number }} [options]
 * @returns {string}
 */
export function cleanExtractedText(rawText, options = {}) {
  if (!rawText) return '';

  const maxChars = options.maxChars ?? config.ocrMaxCharsForLlm;

  let text = rawText;

  // Step 1: Remove null bytes and non-printable control characters.
  // Keep horizontal tab (0x09), line feed (0x0A), carriage return (0x0D).
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Step 2: Dehyphenate line-wrapped words.
  // Matches a word character, a hyphen, a newline, then another word character.
  text = text.replace(/(\w)-\n(\w)/g, '$1$2');

  // Step 3: Collapse runs of spaces and tabs to a single space.
  text = text.replace(/[ \t]+/g, ' ');

  // Step 4: Collapse 3 or more consecutive newlines to a double newline.
  text = text.replace(/\n{3,}/g, '\n\n');

  // Step 5: Trim trailing whitespace from each line.
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Step 6: Trim the whole string.
  text = text.trim();

  // Step 7: Truncate to maxChars, preferring a paragraph boundary.
  if (text.length > maxChars) {
    logger.warn('Extracted text exceeds character limit — truncating', {
      originalLength: text.length,
      limit: maxChars,
    });

    let truncated = text.slice(0, maxChars);

    // Look for the last paragraph break within the final 200 characters of the slice.
    const lookbackWindow = 200;
    const searchStart = Math.max(0, maxChars - lookbackWindow);
    const lastParagraphBreak = truncated.lastIndexOf('\n\n', maxChars);

    if (lastParagraphBreak >= searchStart) {
      truncated = truncated.slice(0, lastParagraphBreak).trimEnd();
    }

    text = truncated;
  }

  return text;
}
