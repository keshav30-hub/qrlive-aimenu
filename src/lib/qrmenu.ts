
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
  mrp?: string;
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
    businessId?: string;
    googleReviewLink?: string;
};

// This function ensures we always get a valid Firestore instance.
async function getFirestoreInstance() {
    const { firestore } = initializeFirebase();
    if (!firestore) {
        throw new Error("Firestore is not initialized");
    }
    return firestore;
}


export async function getBusinessDataBySlug(slug: string): Promise<{ businessData: BusinessData | null, userId: string | null }> {
    const firestore = await getFirestoreInstance();
    const usersRef = collection(firestore, 'users');
    
    // Create queries to check against businessName, businessId, and finally userId
    const queries = [
      query(usersRef, where('businessName', '==', slug.replace(/-/g, ' ')), limit(1)),
      query(usersRef, where('businessId', '==', slug), limit(1)),
    ];

    try {
        // Try querying by business name and businessId first
        for (const q of queries) {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                return {
                    businessData: {
                        id: userDoc.id,
                        name: userData.businessName || 'Unnamed Business',
                        logo: userData.logo || 'https://picsum.photos/seed/logo/100/100',
                        businessId: userData.businessId,
                        googleReviewLink: userData.googleReviewLink,
                    },
                    userId: userDoc.id,
                };
            }
        }

        // If no match, try treating the slug as a user ID as a fallback
        const userDocById = await getDoc(doc(firestore, 'users', slug));
        if (userDocById.exists()) {
            const userData = userDocById.data();
            return {
                businessData: {
                    id: userDocById.id,
                    name: userData.businessName || 'Unnamed Business',
                    logo: userData.logo || 'https://picsum.photos/seed/logo/100/100',
                    businessId: userData.businessId,
                    googleReviewLink: userData.googleReviewLink,
                },
                userId: userDocById.id,
            };
        }

        // If nothing worked, no business found
        console.warn(`No business found for slug, business ID, or user ID: ${slug}`);
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

export async function submitFeedback(userId: string, feedback: { target: string; rating: number; comment: string; imageUrl?: string | null }, table: string) {
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

        // If rating is 1 or 2 stars, also add to urgent_feedback
        if (feedback.rating <= 2) {
            const urgentFeedbackRef = collection(firestore, 'users', userId, 'urgent_feedback');
            await addDoc(urgentFeedbackRef, {
                ...feedbackData,
                table: table,
                type: 'Low Rating',
                time: new Date().toISOString(),
            });
        }

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
