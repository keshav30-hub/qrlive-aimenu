
// IMPORTANT: This file should only be imported on the SERVER-SIDE.
import * as admin from 'firebase-admin';

// Decode the base64 encoded private key
const decodedPrivateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64 
    ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8') 
    : undefined;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: decodedPrivateKey,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize the Firebase Admin App if it hasn't been already.
if (!admin.apps.length) {
  try {
    // Check if all required service account properties are available
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        console.warn('Firebase Admin SDK not initialized: Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_CLIENT_EMAIL).');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

// Export the initialized services
const auth = admin.auth();
const db = admin.firestore();

export { auth, db, admin as adminApp };
