
'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Simple hash function for creating a device ID
const generateDeviceId = async (userAgent: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(userAgent);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 20); // Use a portion of the hash as the ID
};


export async function signInWithGoogle(): Promise<User | null> {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // After sign-in, check and create user document in Firestore
    if (user) {
      await createUserDocument(user);
    }

    return user;
  } catch (error: any) {
    // Don't log an error if the user cancelled the popup
    if (error.code === 'auth/cancelled-popup-request') {
      return null;
    }
    console.error('Error during Google sign-in:', error);
    return null;
  }
}

export async function createUserDocument(user: User) {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const deviceId = await generateDeviceId(navigator.userAgent);
  const deviceRef = doc(firestore, `users/${user.uid}/devices`, deviceId);
  
  try {
    // Only write device info if it's a new device
    const deviceSnap = await getDoc(deviceRef);
    const batch = writeBatch(firestore);

    if (!userSnap.exists()) {
      // User is new, create user, subscription, and device docs in a batch
      const subscriptionRef = doc(firestore, 'subscriptions', user.uid);
      const createdAt = serverTimestamp();
      
      batch.set(userRef, {
          uid: user.uid,
          email: user.email,
          createdAt: createdAt,
          lastLoginAt: createdAt,
          onboarding: false,
          setupFeePaid: false,
      });

      batch.set(subscriptionRef, {
          createdAt: createdAt,
          status: 'inactive',
      });
      
      // Since it's a new user, the device is also new
      batch.set(deviceRef, {
          id: deviceId,
          userAgent: navigator.userAgent,
          lastLoginAt: serverTimestamp(),
          status: 'active',
      });

    } else {
      // User exists, just update last login time
      batch.update(userRef, { lastLoginAt: serverTimestamp() });
      
      // For existing users, only write device data if the device is not yet registered
      if (!deviceSnap.exists()) {
         batch.set(deviceRef, {
            id: deviceId,
            userAgent: navigator.userAgent,
            lastLoginAt: serverTimestamp(),
            status: 'active',
        }, { merge: true });
      }
    }
    
    // Commit the batch only if there are writes
    if (batch['_mutations'].length > 0) {
       await batch.commit();
    }
    
  } catch (e) {
    console.error("Error writing user/device documents: ", e);
    // Re-throw the error to be caught by the caller if needed
    throw e;
  }
}
