'use client';

import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  active: boolean;
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
};

async function getFirestoreInstance() {
    const { firestore } = initializeFirebase();
    return firestore;
}


export async function getBusinessDataBySlug(slug: string): Promise<{ businessData: BusinessData | null, userId: string | null }> {
    const firestore = await getFirestoreInstance();
    const usersRef = collection(firestore, 'users');
    // In a real-world scenario, you might have a dedicated field for the URL slug.
    // For this app, we'll query by the businessName, assuming it's unique and used as the slug.
    const q = query(usersRef, where('businessName', '==', slug.replace(/-/g, ' ')), limit(1));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.warn(`No business found for slug: ${slug}`);
            return { businessData: null, userId: null };
        }
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        return {
            businessData: {
                id: userDoc.id,
                name: userData.businessName || 'Unnamed Business',
                logo: userData.logo || 'https://picsum.photos/seed/logo/100/100',
            },
            userId: userDoc.id,
        };
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
            getDocs(query(categoriesRef, where('active', '==', true))),
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
        userId: userId, // associate feedback with the business user
    };

    if (feedback.target === 'Business') {
        feedbackRef = collection(firestore, 'users', userId, 'feedback');
    } else { // AIFA Feedback
        feedbackRef = collection(firestore, 'qrlive-feedback');
    }

    await addDoc(feedbackRef, feedbackData);
}

export async function submitServiceRequest(userId: string, table: string, requestType: string) {
  const firestore = await getFirestoreInstance();
  const tasksRef = collection(firestore, 'users', userId, 'tasks');
  
  const newTask = {
    tableName: table,
    requestType: requestType,
    dateTime: new Date().toISOString(),
    status: 'unattended',
    staff: '',
  };
  
  await addDoc(tasksRef, newTask);
}

    