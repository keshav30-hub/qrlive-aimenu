
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getFirestore } from 'firebase/firestore';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskNotificationProvider } from '@/context/TaskNotificationContext';

type UserProfile = {
    onboarding: boolean;
};

function AuthRedirect({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = getFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        const isDataLoading = isUserLoading || isProfileLoading;
        
        if (!isDataLoading) {
            if (!user) {
                router.replace('/login');
            } else if (userProfile && userProfile.onboarding === false) {
                router.replace('/onboarding');
            }
        }
    }, [user, userProfile, isDataLoading, router]);

    const isDataLoading = isUserLoading || isProfileLoading;

    if (isDataLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    if (user && userProfile?.onboarding) {
        return <>{children}</>;
    }

    // Fallback loading/null state
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
        <TaskNotificationProvider>
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
        </TaskNotificationProvider>
    </AuthRedirect>
  );
}

    