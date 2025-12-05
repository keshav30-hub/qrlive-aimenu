
'use client';

import { useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { collection, doc, updateDoc, serverTimestamp, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskNotificationProvider } from '@/context/TaskNotificationContext';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Bell, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type UserProfile = {
    onboarding: boolean;
    adminAccessCode?: string;
    createdAt?: Timestamp;
};

type Subscription = {
    status: 'active' | 'inactive';
    expiresAt?: Timestamp;
}

type Notification = {
    id: string;
    title: string;
    description: string; 
    sentAt: Timestamp; 
    read: boolean;
    link?: string;
};

function AuthRedirect({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const pathname = usePathname();

    const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const subscriptionRef = useMemoFirebase(() => (user ? doc(firestore, 'subscriptions', user.uid) : null), [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
    const { data: subscription, isLoading: isSubscriptionLoading } = useDoc<Subscription>(subscriptionRef);

    const isDataLoading = isUserLoading || isProfileLoading || isSubscriptionLoading;
    
    useEffect(() => {
        // Only run checks when data is no longer loading.
        if (isDataLoading) {
            return;
        }

        // If there's no user, redirect to login.
        if (!user) {
            router.replace('/login');
            return;
        }

        // If user exists but has not completed onboarding, redirect there.
        if (userProfile && userProfile.onboarding === false) {
            router.replace('/onboarding');
            return;
        }
        
        // Check for an active subscription.
        const isSubscriptionActive = 
            subscription?.status === 'active' && 
            subscription.expiresAt && 
            subscription.expiresAt.toDate() > new Date();
        
        // If the subscription is not active and they aren't on the subscription page, redirect them.
        if (!isSubscriptionActive && pathname !== '/dashboard/subscription') {
            router.replace('/dashboard/subscription');
            return;
        }

    // This effect should run whenever any of the core data dependencies change.
    }, [user, userProfile, subscription, isDataLoading, router, pathname]);

    const isLoading = isUserLoading || (user && (isProfileLoading || isSubscriptionLoading));

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    // Determine access based on the same simple, reliable check.
    const hasActiveSubscription = 
        subscription?.status === 'active' && 
        subscription.expiresAt && 
        subscription.expiresAt.toDate() > new Date();

    if (user && userProfile?.onboarding) {
        if (hasActiveSubscription || pathname === '/dashboard/subscription') {
             return (
                <TaskNotificationProvider>
                    {children}
                </TaskNotificationProvider>
            );
        }
    }

    // Fallback loading screen while redirects are processing.
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
}

function NotificationPanel() {
  const { firestore, user } = useFirebase();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const notificationsRef = useMemoFirebase(() => collection(firestore, 'notifications'), [firestore]);
  
  const notificationsQuery = useMemoFirebase(() => {
    if (!notificationsRef || !userProfile?.createdAt) return null;
    return query(
      notificationsRef,
      where('sentAt', '>', userProfile.createdAt),
      orderBy('sentAt', 'desc')
    );
  }, [notificationsRef, userProfile?.createdAt]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  
  const [readNotifications, setReadNotifications] = useState<string[]>([]);

  useEffect(() => {
      if (user?.uid) {
        const storedReadIds = localStorage.getItem(`readNotifications_${user.uid}`);
        if (storedReadIds) {
            setReadNotifications(JSON.parse(storedReadIds));
        }
      }
  }, [user]);

  const unreadCount = (notifications || []).filter(n => !readNotifications.includes(n.id)).length;
  
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (user && !readNotifications.includes(notification.id)) {
        const newReadIds = [...readNotifications, notification.id];
        setReadNotifications(newReadIds);
        localStorage.setItem(`readNotifications_${user.uid}`, JSON.stringify(newReadIds));
    }
  };


  return (
    <>
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p>Loading notifications...</p>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent",
                    !readNotifications.includes(notification.id) && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  {!readNotifications.includes(notification.id) && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.sentAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No new notifications.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedNotification} onOpenChange={(isOpen) => !isOpen && setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
             <DialogDescription>
                {selectedNotification?.sentAt?.toDate().toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <p className="text-sm">{selectedNotification?.description}</p>
             {selectedNotification?.link && (
                 <a href={selectedNotification.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="mt-4 w-full">
                        <ExternalLink className="mr-2 h-4 w-4"/>
                        Visit Link
                    </Button>
                 </a>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSpecialLayout = pathname.startsWith('/dashboard/attendance') || pathname.startsWith('/dashboard/captain') || pathname === '/dashboard/staff';
  const isSubscriptionPage = pathname === '/dashboard/subscription';

  return (
    <AuthRedirect>
      <div className="h-screen overflow-hidden">
        <div className="flex h-full">
          <SidebarProvider>
            {!isSpecialLayout && <AppSidebar />}
            <main className="flex-1 flex flex-col bg-gray-100 dark:bg-black">
              {(!isSpecialLayout && !isSubscriptionPage) && (
                <header className="flex h-16 items-center justify-end border-b bg-background px-4">
                  <NotificationPanel />
                </header>
              )}
               {isSubscriptionPage && <div className="h-16 flex-shrink-0" />}
              <div className={cn("flex-1 overflow-y-auto", !isSpecialLayout && "p-4 md:p-6")}>
                 <div className={cn(!isSpecialLayout && "max-w-7xl mx-auto")}>
                    {children}
                 </div>
              </div>
            </main>
          </SidebarProvider>
        </div>
      </div>
    </AuthRedirect>
  );
}
