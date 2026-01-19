// controllers/documentsController.js
// Simple controller abstraction for document-related API handlers.

let analyzedDocumentsCount = 0;

class DocumentsController {
  // GET /api/documents/count
  static getAnalyzedCount(req, res) {
    res.json({ count: analyzedDocumentsCount });
  }

  // POST /api/documents/analyzed
  static markAnalyzed(req, res) {
    analyzedDocumentsCount += 1;
    res.status(201).json({ count: analyzedDocumentsCount });
  }
}

export { DocumentsController };
