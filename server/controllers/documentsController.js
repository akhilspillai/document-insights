// controllers/documentsController.js
// Authenticated controller for dashboard data backed by Firestore.

import { getUserDocuments } from '../services/firestoreService.js';

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
      console.error('Failed to fetch dashboard data:', err);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
}

export { DocumentsController };
