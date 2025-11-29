
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  if (!projectId || !clientEmail || !privateKeyBase64) {
    console.error("CRITICAL: Missing one or more Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY_BASE64).");
    throw new Error("Missing Firebase Admin environment variables.");
  }

  try {
    // Decode the Base64 private key and replace escaped newlines
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

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
    throw new Error("Firebase Admin SDK failed to initialize.