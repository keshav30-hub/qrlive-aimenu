
// IMPORTANT: This file should only be imported on the SERVER-SIDE.
import * as admin from 'firebase-admin';

// Your service account key file should be stored securely and not exposed to the client.
// We will use environment variables to store the configuration.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  // Use the private key directly from the environment variable.
  // The hosting environment (like Vercel) handles the newline characters correctly.
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize the Firebase Admin App if it hasn't been already.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

export const adminApp = admin;
