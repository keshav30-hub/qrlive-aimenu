
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

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes || {};
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amountPaise = payment.amount;
    const amountINR = amountPaise / 100;
    
    const firestore = admin.firestore();
    const paymentDocRef = firestore.collection('payments').doc(razorpay_payment_id);
    const userRef = firestore.collection('users').doc(uid);
    const subRef = firestore.collection('subscriptions').doc(uid);
    const historyCollectionRef = subRef.collection('history');
    const planRef = firestore.collection('plans').doc(planId);

    await firestore.runTransaction(async (tx) => {
      const [existingPayment, planDoc] = await Promise.all([
          tx.get(paymentDocRef),
          tx.get(planRef),
      ]);

      if (existingPayment.exists) {
        console.log(`Payment ${razorpay_payment_id} already processed.`);
        return;
      }
      
      if (!planDoc.exists) {
          throw new Error('Plan not found.');
      }
      const planData = planDoc.data()!;

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
        processedBy: 'client'
      });

      if (notes.isSetupFeeExpected === 'true') {
        tx.update(userRef, { setupFeePaid: true });
      }

      const now = admin.firestore.Timestamp.now();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const historyData = {
          planId: planId,
          planName: planData.name,
          startedAt: now,
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          paidAmount: amountINR,
          couponCode: notes.couponCode || null,
          lastPaymentId: razorpay_payment_id,
          duration: `${durationMonths} months`
      };

      // Add a new document to the history subcollection
      tx.set(historyCollectionRef.doc(), historyData);

      // Update the main subscription document with the latest info
      const subData = {
        status: 'active',
        ...historyData // Mirror the latest history entry to the main doc
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
