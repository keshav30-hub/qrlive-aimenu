
import * as admin from 'firebase-admin';

// The admin app instance. It's safe to export this directly.
let adminApp: admin.app.App;

// Ensures the Admin SDK is initialized exactly once.
if (!admin.apps.length) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
        // This log helps debug Vercel deployment issues
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_JSON is missing. Cannot initialize Firebase Admin SDK.");
        throw new Error("Missing Firebase Service Account JSON.");
    }
    
    try {
        // Parse the single-line JSON string into a certificate object
        const serviceAccount = JSON.parse(serviceAccountString);

        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized successfully.");

    } catch (error) {
        console.error("Firebase Admin SDK Initialization failed:", error);
        // Throwing the error here ensures the Next.js build fails early if the credential is bad
        throw new Error("Firebase Admin SDK failed to initialize. Check JSON formatting.");
    }
} else {
    // If it's already initialized (e.g., during Next.js hot reload), reuse the existing app.
    adminApp = admin.app();
}

// Export the initialized app instance
export { adminApp };
