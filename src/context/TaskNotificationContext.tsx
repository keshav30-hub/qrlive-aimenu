
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

type Task = {
  tableName: string;
  requestType: string;
  dateTime: string;
};

type TaskNotificationContextType = {
  showNewTask: (task: Task) => void;
  isMuted: boolean;
  toggleMute: () => void;
  unattendedTaskCount: number;
  setUnattendedTaskCount: (count: number) => void;
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
  const [latestTask, setLatestTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [unattendedTaskCount, setUnattendedTaskCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  
  // Effect to manage the audio element
  useEffect(() => {
    // We create the audio element only on the client-side
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notificationalert.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }
  }, []);

  // Effect to control audio playback based on task count and mute state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (unattendedTaskCount > 0 && !isMuted) {
      audio.play().catch(error => console.error("Audio playback failed:", error));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    
    // Cleanup function to pause audio when the component unmounts
    return () => {
        if(audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
  }, [unattendedTaskCount, isMuted]);

  const showNewTask = (newTask: Task) => {
    setLatestTask(newTask);
    setIsDialogOpen(true);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const goToTasks = () => {
    closeDialog();
    router.push('/dashboard/tasks');
  }

  const value = { 
    showNewTask, 
    isMuted, 
    toggleMute,
    unattendedTaskCount,
    setUnattendedTaskCount
  };

  return (
    <TaskNotificationContext.Provider value={value}>
      {children}
      <AlertDialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Task Received!</AlertDialogTitle>
            <AlertDialogDescription>
              A new service request has been received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p><strong>Table:</strong> {latestTask?.tableName}</p>
            <p><strong>Request:</strong> {latestTask?.requestType}</p>
            <p><strong>Time:</strong> {latestTask?.dateTime}</p>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={closeDialog}>Acknowledge</Button>
            <AlertDialogAction asChild>
                <Button onClick={goToTasks}>View Tasks</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TaskNotificationContext.Provider>
  );
};
