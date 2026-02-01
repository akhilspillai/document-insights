import admin from 'firebase-admin';

export function ensureAdminInitialized() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

let db = null;

function getFirestoreDb() {
  if (db) return db;

  ensureAdminInitialized();

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

export async function getUserDocuments(userId) {
  const db = getFirestoreDb();

  const snapshot = await db
    .collection('documents')
    .where('userId', '==', userId)
    .where('analysis', '!=', null)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    originalFilename: doc.data().originalFilename,
    createdAt: doc.data().createdAt,
    analysis: doc.data().analysis,
  }));
}

export async function getUserAnalysisCount(userId) {
  const db = getFirestoreDb();
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return 0;
  return userDoc.data().analysisCount || 0;
}

export async function incrementAnalysisCount(userId) {
  const db = getFirestoreDb();
  const userRef = db.collection('users').doc(userId);

  const newCount = await db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    const current = doc.exists ? (doc.data().analysisCount || 0) : 0;
    const updated = current + 1;
    t.set(userRef, { analysisCount: updated }, { merge: true });
    return updated;
  });

  return newCount;
}
