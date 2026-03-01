import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import Busboy from 'busboy';
import { DocumentsController } from './controllers/documentsController.js';
import { UploadController } from './controllers/uploadController.js';
import { QuotaController } from './controllers/quotaController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { config } from './config.js';

const app = express();

// Middleware that parses multipart form data using busboy.
// Uses req.rawBody (available in deployed Firebase Functions) or
// pipes the request stream (emulator / local dev).
function parseMultipart(req, res, next) {
  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: config.maxFileSize },
  });

  const fields = {};
  let fileData = null;
  let errorSent = false;

  busboy.on('field', (name, value) => {
    fields[name] = value;
  });

  busboy.on('file', (name, stream, info) => {
    const { filename, mimeType } = info;

    if (!config.allowedMimeTypes.includes(mimeType)) {
      stream.resume(); // drain the stream
      if (!errorSent) {
        errorSent = true;
        return res.status(400).json({ error: 'Invalid file type. Allowed: PDF, Word, Text, PNG, JPEG' });
      }
      return;
    }

    const chunks = [];
    let size = 0;

    stream.on('data', (chunk) => {
      size += chunk.length;
      if (size <= config.maxFileSize) {
        chunks.push(chunk);
      }
    });

    stream.on('limit', () => {
      if (!errorSent) {
        errorSent = true;
        res.status(400).json({ error: `File too large. Maximum size is ${config.maxFileSize / (1024 * 1024)}MB.` });
      }
    });

    stream.on('end', () => {
      if (!errorSent) {
        fileData = {
          fieldname: name,
          originalname: filename,
          mimetype: mimeType,
          buffer: Buffer.concat(chunks),
          size,
        };
      }
    });
  });

  busboy.on('error', (err) => {
    logger.error('Busboy parse error', { error: err.message });
    if (!errorSent) {
      errorSent = true;
      res.status(400).json({ error: err.message });
    }
  });

  busboy.on('finish', () => {
    if (!errorSent) {
      req.file = fileData;
      req.body = { ...req.body, ...fields };
      next();
    }
  });

  // In deployed Firebase Functions, the body is pre-consumed and available as req.rawBody.
  // In the emulator, rawBody may not exist, so pipe the request stream instead.
  if (req.rawBody) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
}

app.use(cors());
app.use(express.json({ type: 'application/json' }));

// Document dashboard route (requires auth)
app.get('/api/documents', authMiddleware, DocumentsController.getDashboard);

// File upload route (requires auth)
app.post('/api/upload', authMiddleware, parseMultipart, UploadController.uploadDocument);

// Quota route (requires auth)
app.get('/api/quota', authMiddleware, QuotaController.getQuota);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled express error', { error: err.message, stack: err.stack });
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Increase memory and timeout to accommodate OCR workloads.
// tesseract.js + sharp + a multi-page image rasterisation can push past the
// default 256 MiB limit, and OCR on a dense multi-page document can exceed
// the default 60 s timeout.
export const api = onRequest({ memory: '512MiB', timeoutSeconds: 120 }, app);
