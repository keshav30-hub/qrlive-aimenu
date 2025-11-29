
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error("CRITICAL: Firebase Admin credentials are not set. Ensure the FIREBASE_SERVICE_ACCOUNT_JSON environment variable is populated.");
    throw new Error("Firebase Admin credentials are not set in the environment.");
  }

  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountString);

    // Correctly format the private_key by replacing escaped newlines.
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization failed. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid, single-line JSON string.", error.message);
    throw new Error("Firebase Admin SDK failed to initialize. Check credentials.");
  }
} else {
  adminApp = admin.app();
}

// Export the initialized app instance
export { adminApp };
