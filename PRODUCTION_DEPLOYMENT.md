# Production Deployment

This guide covers deploying Document Insights to Firebase Hosting and Cloud Functions.

## Prerequisites

1. **Firebase CLI** installed and authenticated:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Firebase project** set up (currently `document-insights-96f95`):
   ```bash
   firebase use document-insights-96f95
   ```

3. **Backend environment variables** configured via Firebase Functions secrets:
   ```bash
   firebase functions:secrets:set B2_APPLICATION_KEY_ID
   firebase functions:secrets:set B2_APPLICATION_KEY
   firebase functions:secrets:set B2_BUCKET_ID
   firebase functions:secrets:set B2_BUCKET_NAME
   firebase functions:secrets:set GROK_API_KEY
   ```
   These replace the `server/.env` file used in local development. Values are prompted interactively.

4. **Frontend environment variables** in `.env.local`:
   ```bash
   # Leave empty for production — uses relative paths via Firebase Hosting rewrites
   VITE_API_BASE_URL=

   # Firebase config (these are safe to commit / embed in the frontend)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

## Deploy Everything

```bash
# Build the frontend
npm run build

# Deploy hosting + functions
firebase deploy
```

This will:
- Build and upload the React app to Firebase Hosting
- Deploy the Express API as a Firebase Cloud Function (`api`)
- Run `npm install` in `server/` automatically (configured as a predeploy hook)

## Deploy Individually

```bash
# Frontend only
npm run build
firebase deploy --only hosting

# Backend only
firebase deploy --only functions
```

## How Routing Works

Firebase Hosting rewrites are configured in `firebase.json`:

- `/api/**` → routed to the `api` Cloud Function (Express app)
- `**` → serves `index.html` (SPA client-side routing)

The frontend uses `VITE_API_BASE_URL` (empty in production), so API calls go to `/api/upload`, `/api/documents`, etc. on the same domain. Firebase Hosting forwards them to the Cloud Function.

## Architecture

```
Browser
  │
  ├── Static assets ──→ Firebase Hosting (dist/)
  │
  └── /api/* requests ──→ Cloud Function (server/index.js)
                              │
                              ├── Firebase Auth (token verification)
                              ├── Backblaze B2 (file storage)
                              ├── Firestore (metadata, quotas)
                              └── Grok API (document analysis)
```

## Viewing Logs

```bash
# Stream recent function logs
firebase functions:log

# Or view in Google Cloud Console with filtering:
# https://console.cloud.google.com/logs?project=document-insights-96f95
```

All server-side logging uses `firebase-functions/logger` with structured output. Filter by severity (INFO, WARNING, ERROR) in Cloud Logging.

## Environment Variables Reference

### Backend (Firebase Functions secrets)

| Variable | Description |
|---|---|
| `B2_APPLICATION_KEY_ID` | Backblaze B2 application key ID |
| `B2_APPLICATION_KEY` | Backblaze B2 application key |
| `B2_BUCKET_ID` | Backblaze B2 bucket ID |
| `B2_BUCKET_NAME` | Backblaze B2 bucket name |
| `GROK_API_KEY` | xAI Grok API key for document analysis |

### Frontend (Vite env vars, baked into the build)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | API base URL (empty for production) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Rollback

If a deployment causes issues:

```bash
# List recent hosting releases
firebase hosting:channel:list

# Roll back to previous hosting version
firebase hosting:rollback

# Roll back functions to a previous version (redeploy from a known-good commit)
git checkout <commit> -- server/
firebase deploy --only functions
```

## Troubleshooting

- **"Unexpected end of form" on upload**: The backend uses `busboy` with `req.rawBody` to parse multipart uploads. This is required because Firebase Functions pre-consumes the request body before Express middleware runs.
- **Functions not updating**: Make sure you ran `firebase deploy --only functions`. The emulator does not deploy code.
- **Missing secrets**: Run `firebase functions:secrets:access <SECRET_NAME>` to verify a secret is set. If a secret is missing, the function will crash at runtime with an error like `GROK_API_KEY environment variable is not set`.
- **CORS errors**: The Express app uses the `cors` middleware. If you're calling the API from a different domain, check the CORS configuration in `server/index.js`.
- **Auth errors (401)**: Ensure the Firebase Auth domain is correctly configured and the user's ID token is valid and not expired.
