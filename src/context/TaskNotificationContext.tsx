
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
  
  // Keep track of the specific task being shown in the dialog
  const [notifiedTask, setNotifiedTask] = useState<Task | null>(null);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notificationalert.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    
    const stopNotifications = () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };

    if (unattendedTaskCount > 0 && !isMuted) {
      audio?.play().catch(error => console.error("Audio playback failed:", error));
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } else {
      stopNotifications();
    }
    
    return stopNotifications;
  }, [unattendedTaskCount, isMuted]);

  useEffect(() => {
    if (isDialogOpen && notifiedTask) {
        // If the dialog is open for a specific task, check if it's still in the unattended list.
        const taskIsStillPending = unattendedTasks.some(
            task => task.time === notifiedTask.time && task.table === notifiedTask.table && task.request === notifiedTask.request
        );
        // If it's not pending anymore (i.e., someone else handled it), close the dialog.
        if (!taskIsStillPending) {
            closeDialog();
        }
    }
  }, [unattendedTasks, isDialogOpen, notifiedTask]);


  useEffect(() => {
    if (tasksLiveRef && unattendedTasks && unattendedTasks.length > 0) {
      const latestTask = unattendedTasks[unattendedTasks.length - 1];
      
      // Check if the dialog is already open to avoid replacing an active notification
      if (!isDialogOpen) {
        setNotifiedTask(latestTask); // Track the task being notified
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
  }, [tasksLiveRef, unattendedTasks, isDialogOpen]);
  
  useEffect(() => {
    if (urgentFeedbacks && urgentFeedbacks.length > 0) {
        const latestFeedback = urgentFeedbacks[0];
        if (!isDialogOpen) {
            // For simplicity, we can treat urgent feedback similarly, although it doesn't have a task object to track
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
  }, [urgentFeedbacks, urgentFeedbackRef, isDialogOpen]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  const showNewTask = useCallback((payload: NewTaskPayload) => {
  }, []);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setNotification(null);
    setNotifiedTask(null); // Clear the tracked task
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
