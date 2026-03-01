import { logger } from 'firebase-functions';
import { uploadFile, getFileUrl } from '../services/backblazeService.js';
import { saveDocumentMetadata, updateDocumentAnalysis, getUserAnalysisCount, incrementAnalysisCount } from '../services/firestoreService.js';
import { extractTextFromPdf } from '../services/pdfService.js';
import { runOcrOnBuffer } from '../services/ocrService.js';
import { cleanExtractedText } from '../services/textCleaningService.js';
import { analyzeDocument } from '../services/grokService.js';
import { config } from '../config.js';

export const UploadController = {
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { buffer, originalname, mimetype } = req.file;
      const userId = req.userId;
      const language = req.body?.language || config.defaultLanguage;

      // Check quota before processing (whitelisted users are exempt)
      if (!config.whitelistedUserIds.includes(userId)) {
        const currentCount = await getUserAnalysisCount(userId);
        if (currentCount >= config.analysisLimit) {
          return res.status(403).json({
            error: 'Analysis quota exceeded',
            message: `You have reached the limit of ${config.analysisLimit} document analyses.`,
            used: currentCount,
            limit: config.analysisLimit,
          });
        }
      }

      // Upload to Backblaze B2
      const result = await uploadFile(buffer, originalname, mimetype);
      const fileUrl = await getFileUrl(result.fileName);

      // Save metadata to Firestore
      const docRecord = await saveDocumentMetadata({
        fileId: result.fileId,
        fileName: result.fileName,
        originalFilename: originalname,
        userId,
        fileUrl,
      });

      let analysis = null;

      if (mimetype === 'application/pdf') {
        // ------------------------------------------------------------------
        // PDF path: native extraction with automatic OCR fallback for scanned
        // documents. pdfService handles the fallback decision internally.
        // ------------------------------------------------------------------
        try {
          const pdfData = await extractTextFromPdf(buffer, language);

          logger.info('PDF extraction complete', {
            file: originalname,
            extractionMethod: pdfData.extractionMethod,
            rawCharCount: pdfData.text.length,
          });

          const cleanedText = cleanExtractedText(pdfData.text);

          if (cleanedText.length > 0) {
            analysis = await analyzeDocument(cleanedText, language);
            await updateDocumentAnalysis(result.fileId, analysis);
            await incrementAnalysisCount(userId);
          } else {
            logger.warn('PDF yielded no usable text after cleaning', {
              file: originalname,
              extractionMethod: pdfData.extractionMethod,
            });
          }
        } catch (pdfError) {
          logger.error('PDF analysis failed', {
            error: pdfError.message,
            file: originalname,
          });
          // Do not fail the upload if analysis fails
        }
      } else if (mimetype === 'image/jpeg' || mimetype === 'image/png') {
        // ------------------------------------------------------------------
        // Image path: run OCR directly on the uploaded image buffer.
        // ------------------------------------------------------------------
        try {
          const rawOcrText = await runOcrOnBuffer(buffer, language);

          logger.info('Image OCR complete', {
            file: originalname,
            rawCharCount: rawOcrText.length,
          });

          const cleanedText = cleanExtractedText(rawOcrText);

          if (cleanedText.length > 0) {
            analysis = await analyzeDocument(cleanedText, language);
            await updateDocumentAnalysis(result.fileId, analysis);
            await incrementAnalysisCount(userId);
          } else {
            logger.warn('Image OCR yielded no usable text after cleaning', {
              file: originalname,
            });
          }
        } catch (ocrError) {
          logger.error('Image OCR failed', {
            error: ocrError.message,
            file: originalname,
          });
          // Do not fail the upload if OCR fails
        }
      }

      res.status(201).json({
        success: true,
        file: {
          ...result,
          url: fileUrl,
        },
        document: docRecord,
        analysis,
      });
    } catch (error) {
      logger.error('Upload failed', { error: error.message, stack: error.stack });
      res.status(500).json({
        error: 'Failed to upload file',
        message: error.message,
      });
    }
  },
};
