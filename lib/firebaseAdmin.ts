import * as admin from 'firebase-admin';

import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccount.json');
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
