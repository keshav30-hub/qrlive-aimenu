
'use client';

import { doc, getDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// This function ensures we always get a valid Firestore instance.
async function getFirestoreInstance() {
    const { firestore } = initializeFirebase();
    if (!firestore) {
        throw new Error("Firestore is not initialized");
    }
    return firestore;
}

export async function validateCoupon(couponCode: string, planId: string): Promise<{ isValid: boolean; message: string; coupon: DocumentData | null }> {
    const firestore = await getFirestoreInstance();
    const couponRef = doc(firestore, 'coupons', couponCode);
    
    try {
        const couponSnap = await getDoc(couponRef);

        if (!couponSnap.exists()) {
            return { isValid: false, message: 'This coupon code does not exist.', coupon: null };
        }

        const couponData = couponSnap.data();

        // Check if coupon is active
        if (!couponData.isActive) {
            return { isValid: false, message: 'This coupon is no longer active.', coupon: null };
        }

        // Check date validity
        const now = new Date();
        const startDate = (couponData.startDate as Timestamp).toDate();
        const endDate = (couponData.endDate as Timestamp).toDate();

        if (now < startDate) {
            return { isValid: false, message: 'This coupon is not yet active.', coupon: null };
        }
        if (now > endDate) {
            return { isValid: false, message: 'This coupon has expired.', coupon: null };
        }

        // Check usage limit
        if (couponData.usedCount >= couponData.maxUsage) {
            return { isValid: false, message: 'This coupon has reached its maximum usage limit.', coupon: null };
        }

        // Check if coupon is applicable to the selected plan
        if (Array.isArray(couponData.plan) && couponData.plan.length > 0 && !couponData.plan.includes(planId)) {
             return { isValid: false, message: 'This coupon is not valid for the selected plan.', coupon: null };
        }
        
        // All checks passed
        return { isValid: true, message: 'Coupon applied successfully!', coupon: couponData };

    } catch (error) {
        console.error("Error validating coupon: ", error);
        return { isValid: false, message: 'An unexpected error occurred while validating the coupon.', coupon: null };
    }
}
