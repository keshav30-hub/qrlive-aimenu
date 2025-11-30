
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import * as crypto from 'crypto';

admin.initializeApp();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign-in required');

  const userId = context.auth.uid;
  const { planId, baseAmount, couponCode } = data; // baseAmount as number in INR (e.g., 299)
  const userRef = admin.firestore().collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const user = userSnap.data() || {};
  
  // fetch setupFee from config
  const cfgSnap = await admin.firestore().collection('config').doc('payments').get();
  const setupFee = cfgSnap.exists && cfgSnap.data()?.setupFee ? Number(cfgSnap.data()!.setupFee) : 0;

  // compute coupon discount (example, adapt to your coupon collection logic)
  let discount = 0;
  if (couponCode) {
    const cSnap = await admin.firestore().collection('coupons').doc(couponCode).get();
    if (cSnap.exists) {
      const c = cSnap.data();
      // simple example: coupon has { type: 'percent'|'flat', value: number, active: true }
      if (c?.active) {
        if (c.type === 'percent') discount = Math.round(baseAmount * (c.value / 100));
        else if (c.type === 'flat') discount = c.value;
      }
    }
  }

  // Add setupFee only if user.setupFeePaid !== true
  const needsSetupFee = user.setupFeePaid !== true;
  const finalAmountINR = Math.max(0, baseAmount - discount + (needsSetupFee ? setupFee : 0));
  const amountPaise = Math.round(finalAmountINR * 100);

  // Use a unique receipt id for idempotency and easier lookup
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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = data;
  
    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                                    .update(body.toString())
                                    .digest('hex');
  
    if (expectedSignature !== razorpay_signature) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid payment signature');
    }
  
    // Fetch the order from Razorpay to inspect notes/amount (optional but useful)
    const order = await razorpay.orders.fetch(razorpay_order_id);
  
    // Derive whether setup fee was expected from order.notes
    const notes = order.notes || {};
    const isSetupFeeExpected = (notes.isSetupFeeExpected === 'true');
  
    // Get payment details (amount, currency)
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
  
    const amountPaise = payment.amount;
    const amountINR = amountPaise / 100;
  
    const paymentDocRef = admin.firestore().collection('payments').doc(razorpay_payment_id);
    const userRef = admin.firestore().collection('users').doc(userId);
    const subRef = admin.firestore().collection('subscriptions').doc(userId);

  
    // Use transaction to prevent race conditions and ensure idempotency
    await admin.firestore().runTransaction(async (tx) => {
      const existing = await tx.get(paymentDocRef);
      if (existing.exists) {
        // already recorded (idempotent)
        return;
      }
  
      // record payment
      tx.set(paymentDocRef, {
        userId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: amountINR,
        currency: payment.currency,
        isSetupFee: isSetupFeeExpected,
        isSubscription: true, 
        couponUsed: notes.couponCode || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        rawOrderNotes: notes
      });
  
      const userSnap = await tx.get(userRef);
      const user = userSnap.exists ? userSnap.data() : {};
  
      // If setup fee was expected and not yet paid — mark it paid
      if (isSetupFeeExpected && user?.setupFeePaid !== true) {
        tx.update(userRef, { setupFeePaid: true });
      }
  
      // Update subscription document (example: 30 days from now)
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 3600 * 1000);
  
      tx.set(subRef, {
        planId,
        startedAt: now,
        expiresAt,
        status: 'active',
        lastPaymentId: razorpay_payment_id
      }, { merge: true });
    }); // end transaction
  
    return { success: true };
  });
