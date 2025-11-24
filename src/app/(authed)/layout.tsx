
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskNotificationProvider } from '@/context/TaskNotificationContext';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Bell, User, Settings, CreditCard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserProfile = {
    onboarding: boolean;
};

const sampleNotifications = [
    {
      icon: <User className="h-5 w-5 text-blue-500" />,
      title: 'New Staff Member Added',
      description: 'John Doe has been added to your staff list.',
      time: '15m ago',
    },
    {
      icon: <Settings className="h-5 w-5 text-gray-500" />,
      title: 'Settings Updated',
      description: 'Your business information has been successfully updated.',
      time: '1h ago',
    },
    {
      icon: <CreditCard className="h-5 w-5 text-green-500" />,
      title: 'Payment Received',
      description: 'A payment of $250 was successfully processed.',
      time: '3h ago',
    },
];

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
  const [open, setOpen] = useState(false);
  return (
    <AuthRedirect>
        <div className="h-screen overflow-hidden">
            <div className="flex h-full">
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 flex flex-col bg-gray-100 dark:bg-black">
                   <header className="flex h-16 items-center justify-end border-b bg-background px-4">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Bell />
                                    <span className="sr-only">Toggle notifications</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                <SheetTitle>Notifications</SheetTitle>
                                </SheetHeader>
                                <div className="mt-4 space-y-4">
                                {sampleNotifications.map((notification, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="mt-1">{notification.icon}</div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4">
                      {children}
                    </div>
                </main>
            </SidebarProvider>
            </div>
        </div>
    </AuthRedirect>
  );
}
