
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
  collectionGroup,
  FirestoreError,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
  organizers?: string[];
  terms?: string;
  userId?: string; // Add userId to associate event with a user
};

export type RsvpData = {
    name: string;
    email: string;
    mobile: string;
    people: number;
}

export type BusinessData = {
    id: string;
    name: string;
    logo: string;
    businessId?: string;
    googleReviewLink?: string;
};

export type Shift = {
    id: string;
    name: string;
    from: string;
    to: string;
};

export type StaffMemberPublic = {
    id: string;
    name: string;
    shiftId?: string;
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
    const businessMappingRef = doc(firestore, 'businesses', slug);

    try {
        const businessMappingSnap = await getDoc(businessMappingRef);
        if (!businessMappingSnap.exists()) {
            console.warn(`No business mapping found for slug: ${slug}`);
            return { businessData: null, userId: null };
        }

        const ownerUid = businessMappingSnap.data().ownerUid;
        if (!ownerUid) {
            console.warn(`Owner UID missing in business mapping for slug: ${slug}`);
            return { businessData: null, userId: null };
        }

        const userRef = doc(firestore, 'users', ownerUid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.warn(`User document not found for owner UID: ${ownerUid}`);
            return { businessData: null, userId: null };
        }
        
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

    } catch (error) {
        console.error("Error fetching business data by slug:", error);
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
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Event));
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getEventById(eventId: string): Promise<Event | null> {
    const firestore = await getFirestoreInstance();
    // Use a collection group query to find the event where the 'id' field matches.
    const eventsQuery = query(collectionGroup(firestore, 'events'), where('id', '==', eventId), limit(1));
    
    try {
        const snapshot = await getDocs(eventsQuery);
        if (snapshot.empty) {
            console.warn(`Event with ID "${eventId}" not found.`);
            return null;
        }

        const eventDoc = snapshot.docs[0];
        const data = eventDoc.data();
        
        // The parent of the event document is the 'events' collection, its parent is the user document.
        const userId = eventDoc.ref.parent.parent?.id;

        if (!userId) {
            console.error("Could not determine userId for the event.");
            return null;
        }

        return { ...data, id: eventDoc.id, userId } as Event;

    } catch (error) {
        console.error("Error fetching event by ID:", error);
        // Here you might want to handle permission errors specifically if needed
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
             // You can create and emit a custom error for better debugging if you have a system for it
        }
        return null;
    }
}


export async function submitRsvp(userId: string, eventId: string, rsvpData: RsvpData) {
    const firestore = await getFirestoreInstance();
    const rsvpsRef = collection(firestore, 'users', userId, 'events', eventId, 'rsvps');
    await addDoc(rsvpsRef, {
        ...rsvpData,
        status: 'Interested',
        createdAt: serverTimestamp(),
    });
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

    