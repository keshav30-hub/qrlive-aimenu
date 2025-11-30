
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
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amountPaise = payment.amount;
    const amountINR = amountPaise / 100;
  
    const paymentDocRef = admin.firestore().collection('payments').doc(razorpay_payment_id);
    const userRef = admin.firestore().collection('users').doc(userId);
    const subRef = admin.firestore().collection('subscriptions').doc(userId);

    await admin.firestore().runTransaction(async (tx) => {
      const existingPayment = await tx.get(paymentDocRef);
      if (existingPayment.exists) return; // Prevent duplicate processing
  
      // Create payment document
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
  
      // Update user's setup fee status if it was paid
      if (notes.isSetupFeeExpected === 'true') {
        tx.update(userRef, { setupFeePaid: true });
      }
  
      // Create or update subscription document
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

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
    const secret = functions.config().razorpay.webhook_secret;
    const signature = req.headers['x-razorpay-signature'];

    if (!secret) {
        console.error("Razorpay webhook secret is not configured.");
        res.status(500).send("Webhook secret not configured.");
        return;
    }

    try {
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            console.warn("Invalid webhook signature.");
            res.status(403).send("Invalid signature.");
            return;
        }

        const event = req.body;
        
        if (event.event === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;
            const amountPaise = paymentEntity.amount;
            const amountINR = amountPaise / 100;
            
            const order = await razorpay.orders.fetch(orderId);
            const { userId, planId, isSetupFeeExpected, couponCode } = order.notes || {};

            if (!userId || !planId) {
                console.error("Webhook Error: Missing userId or planId in order notes.", {orderId, paymentId});
                res.status(400).send("Missing required order notes.");
                return;
            }
            
            const planDoc = await admin.firestore().collection('plans').doc(planId).get();
            if (!planDoc.exists) {
                 console.error(`Webhook Error: Plan with ID ${planId} not found.`);
                 res.status(404).send("Plan not found.");
                 return;
            }
            const planData = planDoc.data()!;
            const durationMonths = planData.durationMonths;

            const userRef = admin.firestore().collection('users').doc(userId);
            const subRef = admin.firestore().collection('subscriptions').doc(userId);
            const paymentDocRef = admin.firestore().collection('payments').doc(paymentId);
            
             await admin.firestore().runTransaction(async (tx) => {
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
        
                const subData = {
                    planId: planId,
                    planName: planData.name,
                    startedAt: now,
                    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                    status: 'active',
                    lastPaymentId: paymentId,
                    couponCode: couponCode || null,
                    paidAmount: amountINR,
                    duration: `${durationMonths} months`
                };
                
                tx.set(subRef, subData, { merge: true });
            });
        }
        
        res.status(200).send("Webhook processed.");
    } catch (error) {
        console.error("Error processing Razorpay webhook:", error);
        res.status(500).send("Internal Server Error.");
    }
});
