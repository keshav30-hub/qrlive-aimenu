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
} from 'firebase/firestore';

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // After sign-in, check and create user document in Firestore
    if (user) {
      await createUserDocument(user);
    }

    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    return null;
  }
}

export async function createUserDocument(user: User) {
  const db = getFirestore();
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // User is new, create the document
    const createdAt = serverTimestamp();
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      createdAt: createdAt,
      lastLoginAt: createdAt,
      onboarding: false,
    });
  } else {
    // User exists, update last login time
    await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
  }
}

    