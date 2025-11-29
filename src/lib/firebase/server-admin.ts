
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  // The entire service account JSON is expected to be in this single environment variable.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.error("CRITICAL: Firebase Admin credentials are not set. The 'FIREBASE_SERVICE_ACCOUNT_JSON' environment variable is missing.");
    throw new Error("Firebase Admin credentials are not set.");
  }

  try {
    // Parse the JSON string into a service account object.
    const serviceAccount = JSON.parse(serviceAccountJson);

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
