import { uploadFile, getFileUrl } from '../services/backblazeService.js';
import { saveDocumentMetadata, updateDocumentAnalysis } from '../services/firestoreService.js';
import { extractTextFromPdf } from '../services/pdfService.js';
import { analyzeDocument } from '../services/grokService.js';

export const UploadController = {
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { buffer, originalname, mimetype } = req.file;
      const userId = req.body.userId || null;

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
