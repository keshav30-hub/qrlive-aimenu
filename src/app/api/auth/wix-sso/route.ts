import { NextResponse, type NextRequest } from 'next/server';
import { adminApp } from '@/lib/firebase/server-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Destructure required services from the initialized Admin app
const auth = adminApp.auth();
const db = adminApp.firestore();

// Define the expected structure of the incoming data from Wix Velo
interface WixPayload {
  email: string;
  wixId: string;
  status: 'active' | 'inactive' | 'pending';
  planName: string;
  startDate: string; // ISO 8601 string or similar
  endDate: string;   // ISO 8601 string or similar
}

/**
 * POST handler for the Wix SSO Bridge.
 * Receives secure data from Wix Velo, handles authentication, and redirects the user.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. SECURITY VALIDATION
    const expectedSecret = process.env.WIX_SSO_SECRET;
    const receivedSecret = req.headers.get('x-wix-secret'); // Wix will send this in the header

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      console.warn('SSO Unauthorized: Secret mismatch.', { ip: req.ip });
      return new NextResponse(JSON.stringify({ error: 'Unauthorized Access' }), { status: 403 });
    }

    let payload: WixPayload;
    try {
      payload = (await req.json()) as WixPayload;
    } catch (e) {
      return new NextResponse(JSON.stringify({ error: 'Invalid JSON Body' }), { status: 400 });
    }

    if (!payload.email || !payload.wixId) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields (email/wixId)' }), { status: 400 });
    }

    let firebaseUid: string;
    
    // 2. FIND OR CREATE FIREBASE USER (Auth)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(payload.email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Creating new Firebase user for: ${payload.email}`);
        userRecord = await auth.createUser({
          email: payload.email,
          emailVerified: true,
        });
      } else {
        throw error; // Rethrow other Auth errors
      }
    }
    firebaseUid = userRecord.uid;

    // 3. SYNC TO FIRESTORE (User Profile)
    await db.collection('users').doc(firebaseUid).set(
      {
        wixId: payload.wixId,
        email: payload.email,
        onboarding: true,
        lastLoginAt: Timestamp.now(), // Aligned with existing schema
      },
      { merge: true }
    );

    // 4. SYNC SUBSCRIPTION DATA (Dedicated Collection)
    await db.collection('subscriptions').doc(firebaseUid).set(
      {
        planName: payload.planName,
        status: payload.status,
        wixId: payload.wixId,
        startDate: payload.startDate ? Timestamp.fromDate(new Date(payload.startDate)) : null,
        endDate: payload.endDate ? Timestamp.fromDate(new Date(payload.endDate)) : null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    // 5. MINT THE KEYCARD (Custom Token)
    const customToken = await auth.createCustomToken(firebaseUid, {
      wixId: payload.wixId,
      subscriptionStatus: payload.status,
    });

    // 6. REDIRECT TO THE LANDING PAGE
    const redirectUrl = new URL('/auth/complete', req.url);
    redirectUrl.searchParams.set('token', customToken);

    return NextResponse.redirect(redirectUrl, { status: 302 });

  } catch (error) {
    console.error('SSO Bridge Error:', error);
    // On error, redirect the user to a generic login/error page
    const errorRedirect = new URL('/login?error=sso_failed', req.url);
    return NextResponse.redirect(errorRedirect, { status: 302 });
  }
}
