import { uploadFile, getFileUrl } from '../services/backblazeService.js';
import { saveDocumentMetadata, updateDocumentAnalysis, getUserAnalysisCount, incrementAnalysisCount } from '../services/firestoreService.js';
import { extractTextFromPdf } from '../services/pdfService.js';
import { analyzeDocument } from '../services/grokService.js';

const ANALYSIS_LIMIT = 2;

export const UploadController = {
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { buffer, originalname, mimetype } = req.file;
      const userId = req.userId;

      // Check quota before processing
      const currentCount = await getUserAnalysisCount(userId);
      if (currentCount >= ANALYSIS_LIMIT) {
        return res.status(403).json({
          error: 'Analysis quota exceeded',
          message: `You have reached the limit of ${ANALYSIS_LIMIT} document analyses.`,
          used: currentCount,
          limit: ANALYSIS_LIMIT,
        });
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

      // Extract text and analyze if it's a PDF
      if (mimetype === 'application/pdf') {
        try {
          // Extract text from PDF
          const pdfData = await extractTextFromPdf(buffer);

          if (pdfData.text && pdfData.text.trim().length > 0) {
            // Analyze with Grok
            analysis = await analyzeDocument(pdfData.text);

            // Update Firestore with analysis
            await updateDocumentAnalysis(result.fileId, analysis);

            // Increment user's analysis count
            await incrementAnalysisCount(userId);
          }
        } catch (analysisError) {
          console.error('PDF analysis error:', analysisError);
          // Don't fail the upload if analysis fails
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
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Failed to upload file',
        message: error.message,
      });
    }
  },
};
