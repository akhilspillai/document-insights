// controllers/documentsController.js
// Authenticated controller for dashboard data backed by Firestore.

import { logger } from 'firebase-functions';
import { getUserDocuments, getDocumentById } from '../services/firestoreService.js';

function categorizeInsights(analysis) {
  if (!analysis) return 'informational';

  if (analysis.risk_level === 'high') return 'urgent';
  if (analysis.risk_level === 'medium' || analysis.required_actions?.length > 0)
    return 'actionRequired';

  return 'informational';
}

class DocumentsController {
  // GET /api/documents
  static async getDashboard(req, res) {
    try {
      const docs = await getUserDocuments(req.userId);

      const summary = { informational: 0, actionRequired: 0, urgent: 0 };
      const documents = docs.map((doc) => {
        const cat = categorizeInsights(doc.analysis);
        summary[cat] += 1;

        return {
          id: doc.id,
          name: doc.originalFilename,
          uploadedAt: doc.createdAt?.toDate?.() ?? doc.createdAt,
          category:
            cat === 'urgent'
              ? 'Urgent / penalty risk'
              : cat === 'actionRequired'
              ? 'Action required'
              : 'Informational',
          riskLevel: doc.analysis?.risk_level ?? null,
        };
      });

      res.json({
        totalAnalyzed: documents.length,
        documents,
        summary,
      });
    } catch (err) {
      logger.error('Failed to fetch dashboard data', { error: err.message, userId: req.userId });
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // GET /api/documents/:id
  static async getDocument(req, res) {
    try {
      const doc = await getDocumentById(req.userId, req.params.id);
      res.json({
        id: doc.id,
        name: doc.originalFilename,
        analysis: doc.analysis,
      });
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({ error: err.message });
      }
      logger.error('Failed to fetch document', { error: err.message, userId: req.userId, docId: req.params.id });
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
}

export { DocumentsController };
