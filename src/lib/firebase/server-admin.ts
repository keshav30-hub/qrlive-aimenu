
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

// Ensures the Admin SDK is initialized exactly once.
if (admin.apps.length === 0) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_JSON is missing. Cannot initialize Firebase Admin SDK.");
    throw new Error("Missing Firebase Service Account JSON.");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization failed:", error.message);
    throw new Error("Firebase Admin SDK failed to initialize. Check JSON formatting.");
  }
} else {
  // If it's already initialized, use the first initialized app.
  adminApp = admin.apps[0]!;
}

// Export the initialized app instance
export { adminApp };
