
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.error("CRITICAL: Firebase Admin environment variable 'FIREBASE_SERVICE_ACCOUNT_JSON' is not set.");
    throw new Error("Missing Firebase Admin environment variables.");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Correctly format the private_key by replacing escaped newlines.
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization failed. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string.", error.message);
    throw new Error("Firebase Admin SDK failed to initialize. Check credentials.");
  }
} else {
  adminApp = admin.app();
}

// Export the initialized app instance
export { adminApp };
