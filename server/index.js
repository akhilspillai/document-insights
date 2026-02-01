import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { DocumentsController } from './controllers/documentsController.js';
import { UploadController } from './controllers/uploadController.js';
import { QuotaController } from './controllers/quotaController.js';
import { authMiddleware } from './middleware/authMiddleware.js';

const app = express();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Word, Text, PNG, JPEG'));
    }
  },
});

app.use(cors());
app.use(express.json());

// Document dashboard route (requires auth)
app.get('/api/documents', authMiddleware, DocumentsController.getDashboard);

// File upload route (requires auth)
app.post('/api/upload', authMiddleware, upload.single('file'), UploadController.uploadDocument);

// Quota route (requires auth)
app.get('/api/quota', authMiddleware, QuotaController.getQuota);

// Error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export const api = onRequest(app);
