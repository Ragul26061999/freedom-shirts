import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const initFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin credentials missing. Skipping initialization during build.');
    return null;
  }

  // Sanitize private key - remove surrounding quotes if present and fix newlines
  const sanitizedPrivateKey = privateKey
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');

  try {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: sanitizedPrivateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
    return null;
  }
};

const app = initFirebaseAdmin();

export const db = app ? getFirestore(app) : ({} as FirebaseFirestore.Firestore);
export const auth = app ? getAuth(app) : ({} as import('firebase-admin/auth').Auth);
