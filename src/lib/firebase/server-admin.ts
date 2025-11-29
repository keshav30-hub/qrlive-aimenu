
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key from Vercel env vars will have \\n for newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error("CRITICAL: Missing one or more Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).");
    throw new Error("Missing Firebase Admin environment variables.");
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization failed:", error.message);
    throw new Error("Firebase Admin SDK failed to initialize. Check credentials.");
  }
} else {
  adminApp = admin.app();
}

// Export the initialized app instance
export { adminApp };
