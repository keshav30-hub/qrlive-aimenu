
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
  setDialogsDisabled: (disabled: boolean) => void;
  unlockAudio: () => void;
  isAudioUnlocked: boolean;
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

  const [notification, setNotification] = useState<{title: string, description: string, data: any, onAcknowledge: (status: 'attended' | 'ignored') => void} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [unattendedTaskCount, setUnattendedTaskCount] = useState(0);
  const [dialogsDisabled, setDialogsDisabled] = useState(false);
  
  const [notifiedTaskId, setNotifiedTaskId] = useState<string | null>(null);
  const previouslyNotifiedIds = useRef(new Set<string>());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

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
    const savedMuteState = localStorage.getItem('qrlive-mute-state');
    if (savedMuteState !== null) {
        setIsMuted(JSON.parse(savedMuteState));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notificationalert.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }

    const unlockAudio = () => {
      if (audioRef.current && !audioUnlockedRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioUnlockedRef.current = true;
          console.log("Audio context unlocked.");
          // Clean up the event listener after it has run once
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
        }).catch(err => console.error("Audio unlock failed:", err));
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);


  const unlockAudio = useCallback(() => {
    // This function is now just a placeholder for explicit calls,
    // as the primary unlock is handled by the global event listener.
    if (audioRef.current && !audioUnlockedRef.current) {
        console.log("Attempting explicit audio unlock.");
        audioRef.current.play().then(() => {
            audioRef.current?.pause();
            audioUnlockedRef.current = true;
        }).catch(err => console.error("Explicit audio unlock failed:", err));
    }
  }, []);

  const stopNotifications = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    if (navigator.vibrate) {
        navigator.vibrate(0); // Stop vibration
    }
  }, []);

  // Main notification effect
  useEffect(() => {
    if (dialogsDisabled || isDialogOpen) return;

    const allUnattended = [
        ...(unattendedTasks || []).map(t => ({...t, id: t.time, isFeedback: false})),
        ...(urgentFeedbacks || []).map(fb => ({...fb, request: fb.comment, isFeedback: true}))
    ].sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    const latestNotification = allUnattended.find(
        (item) => !previouslyNotifiedIds.current.has(item.id)
    );

    if (latestNotification) {
        previouslyNotifiedIds.current.add(latestNotification.id);
        
        const data = latestNotification.isFeedback
          ? { Table: latestNotification.table, Comment: latestNotification.request, Time: new Date(latestNotification.time).toLocaleTimeString() }
          : { Table: latestNotification.table, Request: latestNotification.request, Time: new Date(latestNotification.time).toLocaleTimeString() };
        
        setNotifiedTaskId(latestNotification.id);
        setNotification({
            title: latestNotification.isFeedback ? "Urgent Feedback Received!" : "New Task Received!",
            description: latestNotification.isFeedback ? `A ${(latestNotification as UrgentFeedback).type} was submitted.` : "A new service request has been received.",
            data,
            onAcknowledge: async (status: 'attended' | 'ignored') => {
                 setIsAcknowledging(true);
                 try {
                     if (latestNotification.isFeedback) {
                        if (urgentFeedbackRef) await deleteDoc(doc(urgentFeedbackRef, latestNotification.id));
                     } else {
                        if (tasksLiveRef) {
                            const originalTask = (unattendedTasks || []).find(t => t.time === latestNotification.id);
                            if (originalTask) {
                                const updatedTask = { ...originalTask, status, time: new Date().toISOString(), handledBy: 'Admin' };
                                await updateDoc(tasksLiveRef, { 
                                    pendingCalls: arrayRemove(originalTask),
                                    attendedCalls: arrayUnion(updatedTask)
                                });
                            }
                        }
                     }
                 } catch(e) {
                    console.error("Failed to acknowledge task/feedback", e);
                 } finally {
                    setIsAcknowledging(false);
                 }
            }
        });
        setIsDialogOpen(true);

        if (!isMuted && audioUnlockedRef.current) {
            audioRef.current?.play().catch(error => console.error("Audio playback failed:", error));
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]); // Vibrate pattern
            }
        }
    }

  }, [unattendedTasks, urgentFeedbacks, isMuted, dialogsDisabled, isDialogOpen, tasksLiveRef, urgentFeedbackRef]);

  // Effect to close the dialog if the task disappears from the list
  useEffect(() => {
    if (isDialogOpen && notifiedTaskId) {
        const allPendingIds = new Set([
            ...(unattendedTasks || []).map(t => t.time),
            ...(urgentFeedbacks || []).map(fb => fb.id)
        ]);

        if (!allPendingIds.has(notifiedTaskId)) {
            closeDialog();
        }
    }
  }, [unattendedTasks, urgentFeedbacks, isDialogOpen, notifiedTaskId]);


  const toggleMute = () => {
    unlockAudio();
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('qrlive-mute-state', JSON.stringify(newMuteState));
  };
  
  const showNewTask = useCallback((payload: NewTaskPayload) => {
  }, []);

  const closeDialog = () => {
    stopNotifications();
    setIsDialogOpen(false);
    setNotification(null);
    setNotifiedTaskId(null); 
  };

  const handleAcknowledge = async (status: 'attended' | 'ignored') => {
      if(notification?.onAcknowledge) {
        await notification.onAcknowledge(status);
      }
      closeDialog();
  }

  const value: TaskNotificationContextType = { 
    isMuted, 
    toggleMute,
    unattendedTaskCount: totalUnattendedCount,
    setUnattendedTaskCount,
    showNewTask,
    setDialogsDisabled,
    unlockAudio,
    isAudioUnlocked: audioUnlockedRef.current,
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
            <Button variant="destructive" onClick={() => handleAcknowledge('ignored')} disabled={isAcknowledging}>Ignore</Button>
            <AlertDialogAction asChild>
                <Button onClick={() => handleAcknowledge('attended')} disabled={isAcknowledging}>
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
