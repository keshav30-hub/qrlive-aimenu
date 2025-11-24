
'use client';

import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';


type UrgentFeedback = {
    id: string;
    table: string;
    type: string;
    comment: string;
    time: string;
};

type Task = {
  table: string;
  request: string;
  time: string;
};

type TaskDoc = {
    pendingCalls?: Task[];
};


type TaskNotificationContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  unattendedTaskCount: number;
};

const TaskNotificationContext = createContext<TaskNotificationContextType | undefined>(undefined);

export const useTaskNotification = () => {
  const context = useContext(TaskNotificationContext);
  if (!context) {
    throw new Error('useTaskNotification must be used within a TaskNotificationProvider');
  }
  return context;
};

export const TaskNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, firestore } = useFirebase();
  const router = useRouter();

  const [notification, setNotification] = useState<{title: string, description: string, data: any, onAcknowledge: () => void} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [acknowledgedTaskTimes, setAcknowledgedTaskTimes] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tasksLiveRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'tasks', 'live') : null, [user, firestore]);
  const { data: taskDoc } = useDoc<TaskDoc>(tasksLiveRef);
  const unattendedTasks = taskDoc?.pendingCalls || [];

  const urgentFeedbackRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'urgent_feedback') : null, [user, firestore]);
  const { data: urgentFeedbacks } = useCollection<UrgentFeedback>(urgentFeedbackRef);

  const totalUnattendedCount = (unattendedTasks?.length || 0) + (urgentFeedbacks?.length || 0);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notificationalert.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }
  }, []);

  // Control audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (totalUnattendedCount > 0 && !isMuted) {
      audio.play().catch(error => console.error("Audio playback failed:", error));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    
    return () => {
        if(audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
  }, [totalUnattendedCount, isMuted]);

  // Effect to show notifications for new tasks
  useEffect(() => {
    if (unattendedTasks && unattendedTasks.length > 0) {
      const latestTask = unattendedTasks[unattendedTasks.length - 1];
      if (!acknowledgedTaskTimes.has(latestTask.time)) {
        setNotification({
          title: "New Task Received!",
          description: "A new service request has been received.",
          data: {
            Table: latestTask.table,
            Request: latestTask.request,
            Time: new Date(latestTask.time).toLocaleTimeString(),
          },
          onAcknowledge: () => router.push('/dashboard/tasks'),
        });
        setIsDialogOpen(true);
      }
    }
  }, [unattendedTasks, router, acknowledgedTaskTimes]);
  
  // Effect to show notifications for new urgent feedback
  useEffect(() => {
    if (urgentFeedbacks && urgentFeedbacks.length > 0) {
        const latestFeedback = urgentFeedbacks[0];
        if (!acknowledgedTaskTimes.has(latestFeedback.time)) {
            setNotification({
                title: "Urgent Feedback Received!",
                description: `A ${latestFeedback.type} was submitted.`,
                data: {
                    Table: latestFeedback.table,
                    Comment: latestFeedback.comment,
                    Time: new Date(latestFeedback.time).toLocaleTimeString(),
                },
                onAcknowledge: async () => {
                    if (urgentFeedbackRef) {
                        await deleteDoc(doc(urgentFeedbackRef, latestFeedback.id));
                    }
                    router.push('/dashboard/feedback');
                },
            });
            setIsDialogOpen(true);
        }
    }
  }, [urgentFeedbacks, router, urgentFeedbackRef, acknowledgedTaskTimes]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const closeDialog = () => {
    if (notification?.data.Time) {
      setAcknowledgedTaskTimes(prev => new Set(prev).add(notification.data.Time));
    }
    setIsDialogOpen(false);
    setNotification(null);
  };

  const handleAcknowledge = () => {
      notification?.onAcknowledge();
      closeDialog();
  }

  const value = { 
    isMuted, 
    toggleMute,
    unattendedTaskCount: totalUnattendedCount,
  };

  return (
    <TaskNotificationContext.Provider value={value as any}>
      {children}
      <AlertDialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{notification?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {notification?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            {notification?.data && Object.entries(notification.data).map(([key, value]) => (
              <p key={key}><strong>{key}:</strong> {value}</p>
            ))}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={closeDialog}>Dismiss</Button>
            <AlertDialogAction asChild>
                <Button onClick={handleAcknowledge}>Acknowledge</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TaskNotificationContext.Provider>
  );
};
