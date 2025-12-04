
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from '@/lib/firebase/admin';
import Razorpay from 'razorpay';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const signature = headers().get('x-razorpay-signature');

  if (!secret) {
      console.error("Razorpay webhook secret is not configured.");
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }
  
  const body = await req.text();

  try {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(body);
      const digest = shasum.digest('hex');

      if (digest !== signature) {
          console.warn("Invalid webhook signature.");
          return NextResponse.json({ error: 'Invalid signature.' }, { status: 403 });
      }

      const event = JSON.parse(body);
      
      if (event.event === 'payment.captured') {
          const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });

          const paymentEntity = event.payload.payment.entity;
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;
          const amountPaise = paymentEntity.amount;
          const amountINR = amountPaise / 100;
          
          const order = await razorpay.orders.fetch(orderId);
          const { userId, planId, isSetupFeeExpected, couponCode } = order.notes || {};

          if (!userId || !planId) {
              console.error("Webhook Error: Missing userId or planId in order notes.", {orderId, paymentId});
              return NextResponse.json({ error: 'Missing required order notes.' }, { status: 400 });
          }
          
          const firestore = admin.firestore();
          const planDoc = await firestore.collection('plans').doc(planId).get();
          if (!planDoc.exists) {
               console.error(`Webhook Error: Plan with ID ${planId} not found.`);
               return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
          }
          const planData = planDoc.data()!;
          const durationMonths = planData.durationMonths;

          const userRef = firestore.collection('users').doc(userId);
          const subRef = firestore.collection('subscriptions').doc(userId);
          const historyCollectionRef = subRef.collection('history');
          const paymentDocRef = firestore.collection('payments').doc(paymentId);
          
           await firestore.runTransaction(async (tx) => {
              const existingPayment = await tx.get(paymentDocRef);
              if (existingPayment.exists) {
                  console.log(`Payment ${paymentId} already processed.`);
                  return;
              }
      
              tx.set(paymentDocRef, {
                  userId,
                  razorpayPaymentId: paymentId,
                  razorpayOrderId: orderId,
                  amount: amountINR,
                  currency: paymentEntity.currency,
                  isSetupFee: isSetupFeeExpected === 'true',
                  couponUsed: couponCode || null,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  planId: planId,
                  processedBy: 'webhook'
              });
      
              if (isSetupFeeExpected === 'true') {
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
                  couponCode: couponCode || null,
                  lastPaymentId: paymentId,
                  duration: `${durationMonths} months`,
              };
              
              // Add a new document to the history subcollection
              tx.set(historyCollectionRef.doc(), historyData);
      
              // Update the main subscription document
              const subData = {
                  status: 'active',
                  ...historyData // Mirror the latest history entry to the main doc
              };
              
              tx.set(subRef, subData, { merge: true });
          });
      }
      
      return NextResponse.json({ message: 'Webhook processed.' }, { status: 200 });

  } catch (error: any) {
      console.error("Error processing Razorpay webhook:", error);
      return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
