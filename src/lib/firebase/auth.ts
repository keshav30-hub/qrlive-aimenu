
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

  if (!userSnap.exists()) {
    // User is new, create user doc. Subscription doc is now created by the verifyPayment cloud function.
    const createdAt = serverTimestamp();
    
    try {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            createdAt: createdAt,
            lastLoginAt: createdAt,
            onboarding: false,
            setupFeePaid: false, // Set the initial setup fee status
        });
    } catch (e) {
        console.error("Error creating user document: ", e);
    }

  } else {
    // User exists, just update last login time
    try {
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error("Error updating last login time: ", e);
    }
  }
}
