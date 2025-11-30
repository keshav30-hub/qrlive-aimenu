
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import admin from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const { userId, planId, baseAmount, couponCode } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const firestore = admin.firestore();
    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userSnap.data() || {};

    const cfgSnap = await firestore.collection('config').doc('payments').get();
    const setupFee = cfgSnap.exists && cfgSnap.data()?.setupFee ? Number(cfgSnap.data()!.setupFee) : 0;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
