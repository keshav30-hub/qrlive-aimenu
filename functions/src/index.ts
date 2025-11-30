
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import * as crypto from 'crypto';

admin.initializeApp();

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

export const createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign-in required');

  const userId = context.auth.uid;
  const { planId, baseAmount, couponCode } = data;
  const userRef = admin.firestore().collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const user = userSnap.data() || {};
  
  const cfgSnap = await admin.firestore().collection('config').doc('payments').get();
  const setupFee = cfgSnap.exists && cfgSnap.data()?.setupFee ? Number(cfgSnap.data()!.setupFee) : 0;

  let discount = 0;
  if (couponCode) {
    const cSnap = await admin.firestore().collection('coupons').doc(couponCode).get();
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
  const receipt = `rcpt_${userId}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      userId,
      planId,
      isSetupFeeExpected: String(needsSetupFee),
      couponCode: couponCode || '',
    }
  });

  return {
    orderId: order.id,
    amount: finalAmountINR,
    amountPaise,
    currency: order.currency,
    receipt,
    needsSetupFee
  };
});


export const verifyPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign-in required');
  
    const userId = context.auth.uid;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId, durationMonths } = data;
  
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', functions.config().razorpay.key_secret)
                                    .update(body.toString())
                                    .digest('hex');
  
    if (expectedSignature !== razorpay_signature) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid payment signature');
    }
  
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes || {};
    const isSetupFeeExpected = (notes.isSetupFeeExpected === 'true');
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amountPaise = payment.amount;
    const amountINR = amountPaise / 100;
  
    const paymentDocRef = admin.firestore().collection('payments').doc(razorpay_payment_id);
    const userRef = admin.firestore().collection('users').doc(userId);
    const subRef = admin.firestore().collection('subscriptions').doc(userId);

    await admin.firestore().runTransaction(async (tx) => {
      const existingPayment = await tx.get(paymentDocRef);
      if (existingPayment.exists) return;
  
      tx.set(paymentDocRef, {
        userId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: amountINR,
        currency: payment.currency,
        isSetupFee: isSetupFeeExpected,
        couponUsed: notes.couponCode || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        planId: planId,
      });
  
      const userSnap = await tx.get(userRef);
      if (isSetupFeeExpected && userSnap.data()?.setupFeePaid !== true) {
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
  
    return { success: true, paymentId: razorpay_payment_id };
  });
