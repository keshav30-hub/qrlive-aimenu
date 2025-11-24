
'use client';

import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  addDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  isAvailable: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  type: 'veg' | 'non-veg';
  description: string;
  kcal: string;
  tags: string[];
  imageUrl: string;
  imageHint: string;
  available: boolean;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  datetime: string;
  imageUrl: string;
  imageHint: string;
  active: boolean;
};

export type BusinessData = {
    id: string;
    name: string;
    logo: string;
    googleReviewLink?: string;
};

async function getFirestoreInstance() {
    const { firestore } = initializeFirebase();
    return firestore;
}


export async function getBusinessDataBySlug(slug: string): Promise<{ businessData: BusinessData | null, userId: string | null }> {
    const firestore = await getFirestoreInstance();
    const usersRef = collection(firestore, 'users');
    const businessName = slug.replace(/-/g, ' ');
    // First, try querying by business name slug
    const q = query(usersRef, where('businessName', '==', businessName), limit(1));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            return {
                businessData: {
                    id: userDoc.id,
                    name: userData.businessName || 'Unnamed Business',
                    logo: userData.logo || 'https://picsum.photos/seed/logo/100/100',
                    googleReviewLink: userData.googleReviewLink,
                },
                userId: userDoc.id,
            };
        }

        // If no match by slug, try treating the slug as a user ID
        const userDocById = await getDoc(doc(firestore, 'users', slug));
        if (userDocById.exists()) {
            const userData = userDocById.data();
            return {
                businessData: {
                    id: userDocById.id,
                    name: userData.businessName || 'Unnamed Business',
                    logo: userData.logo || 'https://picsum.photos/seed/logo/100/100',
                    googleReviewLink: userData.googleReviewLink,
                },
                userId: userDocById.id,
            };
        }

        // If neither worked, no business found
        console.warn(`No business found for slug or ID: ${slug}`);
        return { businessData: null, userId: null };

    } catch (error) {
        console.error("Error fetching business data:", error);
        return { businessData: null, userId: null };
    }
}

export async function getMenuData(userId: string): Promise<{ categories: Category[], items: MenuItem[] }> {
    const firestore = await getFirestoreInstance();
    const categoriesRef = collection(firestore, 'users', userId, 'menuCategories');
    const itemsRef = collection(firestore, 'users', userId, 'menuItems');

    try {
        const [categoriesSnapshot, itemsSnapshot] = await Promise.all([
            getDocs(query(categoriesRef, where('isAvailable', '==', true))),
            getDocs(query(itemsRef, where('available', '==', true))),
        ]);

        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        
        return { categories, items };
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return { categories: [], items: [] };
    }
}

export async function getEvents(userId: string): Promise<Event[]> {
    const firestore = await getFirestoreInstance();
    const eventsRef = collection(firestore, 'users', userId, 'events');
    try {
        const snapshot = await getDocs(query(eventsRef, where('active', '==', true)));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function submitFeedback(userId: string, feedback: { target: string; rating: number; comment: string; imageUrl?: string | null }) {
    const firestore = await getFirestoreInstance();
    let feedbackRef;

    const feedbackData = {
        rating: feedback.rating,
        comment: feedback.comment,
        imageUrl: feedback.imageUrl || '',
        timestamp: serverTimestamp(),
        restaurantId: userId, 
    };

    if (feedback.target === 'Business') {
        feedbackRef = collection(firestore, 'users', userId, 'feedback');
        await addDoc(feedbackRef, feedbackData);

    } else { // AIFA Feedback
        feedbackRef = collection(firestore, 'aifa_feedback');
        await addDoc(feedbackRef, { ...feedbackData });
    }
}

export async function submitServiceRequest(userId: string, table: string, requestType: string) {
  const firestore = await getFirestoreInstance();
  const tasksLiveRef = doc(firestore, 'users', userId, 'tasks', 'live');
  
  const newCall = {
    table: table,
    request: requestType,
    time: new Date().toISOString(),
    status: 'unattended'
  };

  await setDoc(tasksLiveRef, {
      pendingCalls: arrayUnion(newCall)
  }, { merge: true });
}
