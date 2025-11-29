
import { NextResponse, type NextRequest } from 'next/server';
import { adminApp } from '@/lib/firebase/server-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface WixPayload {
  email: string;
  wixId: string;
  status: 'active' | 'inactive' | 'pending';
  planName: string;
  startDate: string;
  endDate: string;
}

export async function POST(req: NextRequest) {
  const auth = adminApp.auth();
  const db = adminApp.firestore();

  const expectedSecret = process.env.WIX_SSO_SECRET;
  const receivedSecret = req.headers.get('x-wix-secret');

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

  try {
    let userRecord;
    const userRef = db.collection('users');
    let firebaseUid: string;

    try {
      userRecord = await auth.getUserByEmail(payload.email);
      firebaseUid = userRecord.uid;
      await userRef.doc(firebaseUid).set({
        wixId: payload.wixId,
        email: payload.email,
        lastLoginAt: Timestamp.now(),
      }, { merge: true });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Creating new Firebase user for: ${payload.email}`);
        userRecord = await auth.createUser({
          email: payload.email,
          emailVerified: true,
        });
        firebaseUid = userRecord.uid;
        
        // **FIX:** Create the user document with ALL required fields and default values.
        await userRef.doc(firebaseUid).set({
          uid: firebaseUid,
          wixId: payload.wixId,
          email: payload.email,
          onboarding: true, // Mark as onboarded since data comes from Wix
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          businessName: payload.email.split('@')[0], // Default value
          ownerName: payload.email.split('@')[0], // Default value
          contact: '', // Default value
          address: '', // Default value
          gst: '', // Default value
          businessType: 'restaurant', // Default value
          logo: `https://ui-avatars.com/api/?name=${payload.email.charAt(0)}&color=7F9CF5&background=EBF4FF`, // Default logo
        });
      } else {
        throw error;
      }
    }

    await db.collection('subscriptions').doc(firebaseUid).set({
      planName: payload.planName,
      status: payload.status,
      wixId: payload.wixId,
      startDate: payload.startDate ? Timestamp.fromDate(new Date(payload.startDate)) : null,
      endDate: payload.endDate ? Timestamp.fromDate(new Date(payload.endDate)) : null,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    const customToken = await auth.createCustomToken(firebaseUid, {
      wixId: payload.wixId,
      subscriptionStatus: payload.status,
    });

    const redirectUrl = new URL('/auth/complete', req.nextUrl.origin);
    redirectUrl.searchParams.set('token', customToken);

    return NextResponse.redirect(redirectUrl, { status: 302 });

  } catch (error) {
    console.error('SSO Bridge Error:', error);
    const errorRedirect = new URL('/login?error=sso_failed', req.nextUrl.origin);
    return NextResponse.redirect(errorRedirect, { status: 302 });
  }
}
