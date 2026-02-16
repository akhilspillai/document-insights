# Running Locally with Firebase Emulator

This guide explains how to run both the UI (React frontend) and Firebase Functions (backend API) locally for development and testing.

## Prerequisites

1. **Firebase CLI**: Make sure you have the Firebase CLI installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Dependencies**: Install dependencies for both frontend and backend
   ```bash
   # Install frontend dependencies (from project root)
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Variables**:
   - **Frontend**: `.env.local` in the project root is already configured with:
     - `VITE_API_BASE_URL=http://localhost:5001/document-insights-96f95/us-central1` for local emulator
     - Firebase config variables
   - **Backend**: Configure `.env` in the `server/` directory with your API keys and credentials

## Running the Full Stack (Recommended)

### Option 1: Run Everything Together

From the **project root**, build the frontend and start all emulators:

```bash
# Build the frontend first
npm run build

# Start hosting + functions emulators
firebase emulators:start
```

This will:
- Start the Firebase Hosting emulator at `http://localhost:5000`
- Start the Firebase Functions emulator at `http://localhost:5001`
- Serve your built React app with API routes properly configured
- The Emulator UI will be available at `http://localhost:4000`

### Option 2: Run with Hot Reload (Development) ⭐

**This is the recommended approach for active development.** Run in two terminals:

**Terminal 1** - Frontend dev server:
```bash
npm run dev
```
This starts Vite at `http://localhost:5173` with hot reload

**Terminal 2** - Backend emulator:
```bash
firebase emulators:start --only functions
```
This starts the Functions emulator at `http://localhost:5001`

The frontend is already configured via `.env.local` to connect to the emulator at:
```
http://localhost:5001/document-insights-96f95/us-central1
```

No additional configuration needed - just start both servers and you're ready to go!

## Running Only Functions

If you only need to test the backend API:

```bash
firebase emulators:start --only functions
```

This will:
- Start the Firebase Functions emulator
- Typically run on `http://localhost:5001`
- Make your API available at: `http://localhost:5001/<project-id>/us-central1/api`

## API Endpoints

Once the emulator is running, your API endpoints will be available at:

- **GET** `/api/documents` - Get user's documents dashboard (requires auth)
- **POST** `/api/upload` - Upload a document (requires auth)
- **GET** `/api/quota` - Get user's quota information (requires auth)

## Example Usage

```bash
# Get documents (replace <project-id> with your Firebase project ID)
curl http://localhost:5001/<project-id>/us-central1/api/documents \
  -H "Authorization: Bearer <your-firebase-token>"

# Upload a file
curl -X POST http://localhost:5001/<project-id>/us-central1/api/upload \
  -H "Authorization: Bearer <your-firebase-token>" \
  -F "file=@/path/to/document.pdf"
```

## Additional Emulator Options

### Start specific emulators
```bash
# Only hosting
firebase emulators:start --only hosting

# Only functions
firebase emulators:start --only functions

# Hosting + Functions
firebase emulators:start --only hosting,functions
```

### Emulator UI
The Firebase Emulator UI is available at `http://localhost:4000` by default when running emulators. It provides:
- Function logs and execution history
- Firestore data viewer (if using Firestore)
- Authentication user management

### Export/Import emulator data
```bash
# Export data on shutdown
firebase emulators:start --export-on-exit=./emulator-data

# Import existing data
firebase emulators:start --import=./emulator-data
```

### Custom ports
```bash
# Change hosting port
firebase emulators:start --only hosting --port 3000

# Change functions port
firebase emulators:start --only functions --functions-port 5002
```

## Troubleshooting

- **Port already in use**: Stop any existing emulator instances or use custom port flags
- **"dist not found" error**: Run `npm run build` before starting hosting emulator
- **API 404 errors**: Verify the function rewrites in `firebase.json` are correct
- **Authentication issues**: Make sure Firebase Auth emulator is running if testing auth flows (`firebase emulators:start --only auth,functions,hosting`)
- **Environment variables**:
  - Frontend: Check `.env.local` in project root (includes `VITE_API_BASE_URL` for emulator)
  - Backend: Check `.env` in `server/` directory
  - To switch between local and production: Update `VITE_API_BASE_URL` in `.env.local`
- **API connection issues**: Verify `VITE_API_BASE_URL` in `.env.local` matches your emulator URL
- **CORS errors**: If running Vite dev server separately, CORS is configured in the backend Express app

## Switching to Production

When deploying to production or testing against production:

1. **Update `.env.local`**:
   ```bash
   # Comment out or remove the local emulator URL
   # VITE_API_BASE_URL=http://localhost:5001/document-insights-96f95/us-central1

   # Leave empty to use relative paths (recommended for production)
   VITE_API_BASE_URL=
   ```

2. **Rebuild the frontend**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   firebase deploy
   ```

## Notes

- **Production-like environment**: The emulator runs the Express app wrapped in Firebase Functions, closely matching production
- **Hot reloading**:
  - Functions: Changes to code trigger automatic reloads
  - Hosting: Rebuild frontend with `npm run build` or use Vite dev server
- **Logs**: Function logs appear in the terminal and in the Emulator UI at `http://localhost:4000`
- **API routing**: The hosting emulator automatically routes `/api/**` requests to the functions emulator based on `firebase.json` rewrites
- **Environment variable best practice**: Keep `VITE_API_BASE_URL` set to the emulator URL in `.env.local` (local only), and leave it empty or unset in production builds
