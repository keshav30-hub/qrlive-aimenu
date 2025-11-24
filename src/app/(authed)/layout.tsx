
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskNotificationProvider } from '@/context/TaskNotificationContext';
import { useFirebase } from '@/firebase';


type UserProfile = {
    onboarding: boolean;
};

function AuthRedirect({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
    const isDataLoading = isUserLoading || isProfileLoading;

    useEffect(() => {
        if (!isDataLoading) {
            if (!user) {
                router.replace('/login');
            } else if (userProfile && userProfile.onboarding === false) {
                router.replace('/onboarding');
            }
        }
    }, [user, userProfile, isDataLoading, router]);

    const isLoading = isUserLoading || (user && isProfileLoading);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    if (user && userProfile?.onboarding) {
        return (
            <TaskNotificationProvider>
                {children}
            </TaskNotificationProvider>
        );
    }

    // Fallback for cases where user exists but profile doesn't, or redirecting.
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
}


export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRedirect>
        <div className="h-screen overflow-hidden">
            <div className="flex h-full">
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 dark:bg-black">
                {children}
                </main>
            </SidebarProvider>
            </div>
        </div>
    </AuthRedirect>
  );
}
