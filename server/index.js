import express from 'express';
import cors from 'cors';
import { DocumentsController } from './controllers/documentsController.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Document insight routes
app.get('/api/documents/count', DocumentsController.getAnalyzedCount);
app.post('/api/documents/analyzed', DocumentsController.markAnalyzed);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Document Insights API listening on http://localhost:${port}`);
});
