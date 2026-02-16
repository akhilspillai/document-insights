# Document Insights

An AI-powered web app that helps users understand confusing documents in plain English. Upload a PDF and instantly get a breakdown of what it is, why you received it, what you need to do, and the risks of ignoring it.

Built with a focus on Indian financial, legal, and government documents — tax notices, bank statements, insurance policies, and more.

## Features

- **Instant document analysis** — Upload a PDF and get a structured breakdown in seconds
- **Plain-language explanations** — No jargon, just clear answers
- **Risk assessment** — Know if a document is urgent, requires action, or is informational
- **Actionable steps** — Numbered instructions on exactly what to do
- **Professional guidance** — Tells you if you need a CA, lawyer, or banker
- **Dashboard** — Track all your analyzed documents in one place
- **Google sign-in** — Secure authentication with anonymous browsing support

## How It Works

```
Upload PDF → Extract text → AI analysis (Grok) → Structured insights
```

The AI returns a structured analysis including:

| Field | Description |
|-------|-------------|
| Document type & issuer | What the document is and who sent it |
| Summary | Plain-language explanation of why you received it |
| Required actions | Numbered steps with deadlines |
| Risk level | Low, medium, or high |
| Key details | Amounts, dates, reference numbers |
| Consequences | What happens if you ignore it |
| Professional help | Whether you need a CA, lawyer, or banker |

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS 4, Firebase Auth

**Backend:** Express.js on Firebase Cloud Functions (Node 20)

**Services:**

| Service | Purpose |
|---------|---------|
| Firebase Auth | Google + anonymous authentication |
| Firestore | Document metadata and user quotas |
| Backblaze B2 | File storage |
| Grok API (xAI) | AI-powered document analysis |
| pdf-parse | PDF text extraction |

## Project Structure

```
├── src/                           # React frontend
│   ├── App.jsx                    # Main app with upload/analysis flow
│   ├── components/
│   │   ├── DocumentUpload.jsx     # Drag-drop file upload
│   │   ├── DocumentInsights.jsx   # Analysis results display
│   │   ├── ProcessingStatus.jsx   # Upload progress indicator
│   │   └── AuthMenu.jsx           # Sign-in/sign-out menu
│   └── lib/
│       ├── firebase.js            # Firebase client setup
│       └── authGate.js            # Google sign-in logic
│
├── server/                        # Express backend (Cloud Function)
│   ├── index.js                   # Routes and middleware
│   ├── controllers/
│   │   ├── uploadController.js    # Upload + analysis trigger
│   │   ├── documentsController.js # Dashboard data
│   │   └── quotaController.js     # Usage limits
│   ├── services/
│   │   ├── backblazeService.js    # B2 file storage
│   │   ├── firestoreService.js    # Firestore operations
│   │   ├── grokService.js         # Grok AI integration
│   │   └── pdfService.js          # PDF text extraction
│   ├── middleware/
│   │   └── authMiddleware.js      # Token verification
│   ├── system_message.txt         # AI system prompt
│   └── user_prompt.txt            # AI analysis template
│
├── firebase.json                  # Hosting + Functions config
└── vite.config.js                 # Dev server with API proxy
```

## API Endpoints

All endpoints require a Firebase Auth token in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a PDF and trigger analysis |
| GET | `/api/documents` | Get user's document dashboard |
| GET | `/api/quota` | Get usage limits (used/remaining) |

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Auth and Firestore enabled
- Backblaze B2 account and bucket
- Grok API key from xAI

### Install

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install
```

### Configure

1. Create `.env.local` in the project root with your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_API_BASE_URL=
   ```

2. Create `server/.env` with backend secrets:
   ```
   B2_APPLICATION_KEY_ID=...
   B2_APPLICATION_KEY=...
   B2_BUCKET_ID=...
   B2_BUCKET_NAME=...
   GROK_API_KEY=...
   ```

### Run Locally

**Terminal 1** — Frontend with hot reload:
```bash
npm run dev
```

**Terminal 2** — Backend functions emulator:
```bash
firebase emulators:start --only functions
```

The Vite dev server proxies `/api` requests to the Functions emulator automatically.

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for more details on local setup, emulator options, and troubleshooting.

### Deploy to Production

```bash
npm run build
firebase deploy
```

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions, secrets management, architecture overview, and troubleshooting.

## Quota

Each authenticated user gets 5 free document analyses. Quota is tracked in Firestore and checked before each upload to prevent unnecessary processing.
