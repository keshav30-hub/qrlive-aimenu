
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import admin from '@/lib/firebase/admin';
import { headers } from 'next/headers';

async function getAuthenticatedUid(): Promise<string> {
  const authorization = headers().get('Authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const idToken = authorization.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken.uid;
}

export async function POST(req: Request) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    
    const uid = await getAuthenticatedUid();
    const { planId, baseAmount, couponCode } = await req.json();

    const firestore = admin.firestore();
    const userRef = firestore.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userSnap.data() || {};

    // For this example, we'll hardcode the setup fee.
    // In a real app, this should come from a config collection in Firestore.
    const setupFee = 500; 

    let discount = 0;
    if (couponCode) {
      const cSnap = await firestore.collection('coupons').doc(couponCode).get();
      if (cSnap.exists) {
        const c = cSnap.data();
        if (c?.isActive) {
          if (c.type === 'percentage') discount = Math.round(baseAmount * (c.value / 100));
          else if (c.type === 'flat') discount = c.value;
        }
      }
    }

    const needsSetupFee = user.setupFeePaid !== true;
    const finalAmountINR = Math.max(0, baseAmount - discount + (needsSetupFee ? setupFee : 0));
    const amountPaise = Math.round(finalAmountINR * 100);
    const receipt = `rcpt_${uid.slice(0, 8)}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId: uid,
        planId,
        isSetupFeeExpected: String(needsSetupFee),
        couponCode: couponCode || '',
      }
    });

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmountINR,
      amountPaise,
      currency: order.currency,
      receipt,
      needsSetupFee
    });

  } catch (error: any) {
    console.error('Create Order Error:', error);
    if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || error.error?.description }, { status: 500 });
  }
}
