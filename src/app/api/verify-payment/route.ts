
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from '@/lib/firebase/admin';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { userId, razorpay_payment_id, razorpay_order_id, razorpay_signature, planId, durationMonths } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
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
    const userRef = firestore.collection('users').doc(userId);
    const subRef = firestore.collection('subscriptions').doc(userId);

    await firestore.runTransaction(async (tx) => {
      const existingPayment = await tx.get(paymentDocRef);
      if (existingPayment.exists) return; // Prevent duplicate processing

      tx.set(paymentDocRef, {
        userId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: amountINR,
        currency: payment.currency,
        isSetupFee: notes.isSetupFeeExpected === 'true',
        couponUsed: notes.couponCode || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        planId: planId,
      });

      if (notes.isSetupFeeExpected === 'true') {
        tx.update(userRef, { setupFeePaid: true });
      }

      const now = admin.firestore.Timestamp.now();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const subData = {
        planId: planId,
        planName: notes.planName,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
