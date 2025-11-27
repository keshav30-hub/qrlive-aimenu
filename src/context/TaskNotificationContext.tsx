
'use client';

import React, { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';
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
import { collection, deleteDoc, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';


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

type NewTaskPayload = {
    tableName: string;
    requestType: string;
    dateTime: string;
};

type TaskNotificationContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  unattendedTaskCount: number;
  setUnattendedTaskCount: (count: number) => void;
  showNewTask: (payload: NewTaskPayload) => void;
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
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [unattendedTaskCount, setUnattendedTaskCount] = useState(0);
  const [acknowledgedTaskTimes, setAcknowledgedTaskTimes] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tasksLiveRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'tasks', 'live') : null, [user, firestore]);
  const { data: taskDoc } = useDoc<TaskDoc>(tasksLiveRef);
  const unattendedTasks = taskDoc?.pendingCalls || [];

  const urgentFeedbackRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'urgent_feedback') : null, [user, firestore]);
  const { data: urgentFeedbacks } = useCollection<UrgentFeedback>(urgentFeedbackRef);

  const totalUnattendedCount = (unattendedTasks?.length || 0) + (urgentFeedbacks?.length || 0);
  
  useEffect(() => {
    setUnattendedTaskCount(totalUnattendedCount);
  }, [totalUnattendedCount]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notificationalert.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }
  }, []);

  // Control audio playback and vibration
  useEffect(() => {
    const audio = audioRef.current;
    
    const stopNotifications = () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0); // Stop any ongoing vibration
      }
    };

    if (unattendedTaskCount > 0 && !isMuted) {
      audio?.play().catch(error => console.error("Audio playback failed:", error));
      if (navigator.vibrate) {
        // A pattern of vibration: 200ms vibration, 100ms pause, 200ms vibration.
        // It will repeat because the audio loops.
        navigator.vibrate([200, 100, 200]);
      }
    } else {
      stopNotifications();
    }
    
    return stopNotifications;
  }, [unattendedTaskCount, isMuted]);

  // Effect to show notifications for new tasks
  useEffect(() => {
    if (tasksLiveRef && unattendedTasks && unattendedTasks.length > 0) {
      const latestTask = unattendedTasks[unattendedTasks.length - 1];
      if (!acknowledgedTaskTimes.has(latestTask.time) && !isDialogOpen) {
        setNotification({
          title: "New Task Received!",
          description: "A new service request has been received.",
          data: {
            Table: latestTask.table,
            Request: latestTask.request,
            Time: new Date(latestTask.time).toLocaleTimeString(),
          },
          onAcknowledge: async () => {
             setIsAcknowledging(true);
             const updatedTask = { ...latestTask, status: 'attended' as const, time: new Date().toISOString(), handledBy: 'Admin' };
             try {
                await updateDoc(tasksLiveRef, { 
                    pendingCalls: arrayRemove(latestTask),
                    attendedCalls: arrayUnion(updatedTask)
                });
                // No redirect here. User stays on the current page.
             } catch(e) {
                console.error("Failed to acknowledge task", e);
             } finally {
                setIsAcknowledging(false);
             }
          },
        });
        setIsDialogOpen(true);
      }
    }
  }, [tasksLiveRef, unattendedTasks, router, acknowledgedTaskTimes, isDialogOpen]);
  
  // Effect to show notifications for new urgent feedback
  useEffect(() => {
    if (urgentFeedbacks && urgentFeedbacks.length > 0) {
        const latestFeedback = urgentFeedbacks[0];
        if (!acknowledgedTaskTimes.has(latestFeedback.time) && !isDialogOpen) {
            setNotification({
                title: "Urgent Feedback Received!",
                description: `A ${latestFeedback.type} was submitted.`,
                data: {
                    Table: latestFeedback.table,
                    Comment: latestFeedback.comment,
                    Time: new Date(latestFeedback.time).toLocaleTimeString(),
                },
                onAcknowledge: async () => {
                    setIsAcknowledging(true);
                    if (urgentFeedbackRef) {
                        try {
                           await deleteDoc(doc(urgentFeedbackRef, latestFeedback.id));
                           // No redirect here
                        } catch(e) {
                           console.error("Failed to acknowledge feedback", e);
                        } finally {
                            setIsAcknowledging(false);
                        }
                    }
                },
            });
            setIsDialogOpen(true);
        }
    }
  }, [urgentFeedbacks, router, urgentFeedbackRef, acknowledgedTaskTimes, isDialogOpen]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  const showNewTask = useCallback((payload: NewTaskPayload) => {
    // This function can be used by other components to manually trigger a notification if needed
    // For now, it's primarily driven by the useEffect hooks above
  }, []);

  const closeDialog = () => {
    if (notification?.data.Time) {
      setAcknowledgedTaskTimes(prev => new Set(prev).add(notification.data.Time));
    }
    setIsDialogOpen(false);
    setNotification(null);
  };

  const handleAcknowledge = async () => {
      if(notification?.onAcknowledge) {
        await notification.onAcknowledge();
      }
      closeDialog();
  }

  const value: TaskNotificationContextType = { 
    isMuted, 
    toggleMute,
    unattendedTaskCount,
    setUnattendedTaskCount,
    showNewTask
  };

  return (
    <TaskNotificationContext.Provider value={value}>
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
            <Button variant="outline" onClick={closeDialog} disabled={isAcknowledging}>Dismiss</Button>
            <AlertDialogAction asChild>
                <Button onClick={handleAcknowledge} disabled={isAcknowledging}>
                    {isAcknowledging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isAcknowledging ? 'Accepting...' : 'Accept'}
                </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TaskNotificationContext.Provider>
  );
};
