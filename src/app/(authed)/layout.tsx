
'use client';

import { useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type UserProfile = {
    onboarding: boolean;
};

type Notification = {
    id: string;
    message: string;
    timestamp: any;
    read: boolean;
    link?: string;
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

function NotificationPanel() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const notificationsRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'notifications') : null),
    [firestore, user]
  );

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsRef);

  const sortedNotifications = (notifications || []).sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
  const unreadCount = (notifications || []).filter(n => !n.read).length;
  
  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read && notificationsRef) {
      try {
        const notifDoc = doc(notificationsRef, notification.id);
        await updateDoc(notifDoc, { read: true });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update notification status." });
      }
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
            ) : sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent",
                    !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No notifications yet.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedNotification} onOpenChange={(isOpen) => !isOpen && setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
             <DialogDescription>
                {selectedNotification?.timestamp?.toDate().toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <p className="text-sm">{selectedNotification?.message}</p>
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
  return (
    <AuthRedirect>
        <div className="h-screen overflow-hidden">
            <div className="flex h-full">
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 flex flex-col bg-gray-100 dark:bg-black">
                   <header className="flex h-16 items-center justify-end border-b bg-background px-4">
                        <NotificationPanel />
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
