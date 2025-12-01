
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from '@/lib/firebase/admin';
import Razorpay from 'razorpay';
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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId, durationMonths } = await req.json();
    
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Fetch order and payment details to ensure consistency
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes || {};
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amountPaise = payment.amount;
    const amountINR = amountPaise / 100;
    
    const firestore = admin.firestore();
    const paymentDocRef = firestore.collection('payments').doc(razorpay_payment_id);
    const userRef = firestore.collection('users').doc(uid);
    const subRef = firestore.collection('subscriptions').doc(uid);

    // Use a transaction to ensure atomicity
    await firestore.runTransaction(async (tx) => {
      const existingPayment = await tx.get(paymentDocRef);
      if (existingPayment.exists) {
        console.log(`Payment ${razorpay_payment_id} already processed.`);
        return; // Prevent duplicate processing
      }

      // Record the payment
      tx.set(paymentDocRef, {
        userId: uid,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: amountINR,
        currency: payment.currency,
        isSetupFee: notes.isSetupFeeExpected === 'true',
        couponUsed: notes.couponCode || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        planId: planId,
      });

      // Update the setup fee flag if it was part of this payment
      if (notes.isSetupFeeExpected === 'true') {
        tx.update(userRef, { setupFeePaid: true });
      }

      // Create or update the subscription
      const now = admin.firestore.Timestamp.now();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const subData = {
        planId: planId,
        planName: notes.planName, // Assuming planName is passed in notes
        startedAt: now,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        status: 'active',
        lastPaymentId: razorpay_payment_id,
        couponCode: notes.couponCode || null,
        paidAmount: amountINR,
        duration: `${durationMonths} months`
      };
      
      tx.set(subRef, subData, { merge: true });
    });

    return NextResponse.json({ success: true, paymentId: razorpay_payment_id });

  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
