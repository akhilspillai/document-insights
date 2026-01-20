import admin from 'firebase-admin';

let db = null;

function getFirestoreDb() {
  if (db) return db;

  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }

  db = admin.firestore();
  return db;
}

export async function saveDocumentMetadata({ fileId, fileName, originalFilename, userId, fileUrl }) {
  const db = getFirestoreDb();

  const docRef = db.collection('documents').doc(fileId);
  await docRef.set({
    fileName,
    originalFilename,
    userId: userId || null,
    fileUrl: fileUrl || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    id: fileId,
    fileName,
    originalFilename,
    userId,
  };
}

export async function updateDocumentAnalysis(fileId, analysis) {
  const db = getFirestoreDb();

  const docRef = db.collection('documents').doc(fileId);
  await docRef.update({
    analysis,
    analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: fileId, analysis };
}
