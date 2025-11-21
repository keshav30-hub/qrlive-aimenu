'use client';

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
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

type Task = {
  tableName: string;
  requestType: string;
  dateTime: string;
};

type TaskNotificationContextType = {
  showNewTask: (task: Task) => void;
  isMuted: boolean;
  toggleMute: () => void;
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
  const [task, setTask] = useState<Task | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const showNewTask = (newTask: Task) => {
    setTask(newTask);
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
        if (!prev === true && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        return !prev;
    });
  };

  const closeDialog = () => {
    setTask(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <TaskNotificationContext.Provider value={{ showNewTask, isMuted, toggleMute }}>
      {children}
      <audio ref={audioRef} src="/notificationalert.mp3" preload="auto" loop />
      <AlertDialog open={!!task} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Task Received!</AlertDialogTitle>
            <AlertDialogDescription>
              A new service request has been received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p><strong>Table:</strong> {task?.tableName}</p>
            <p><strong>Request:</strong> {task?.requestType}</p>
            <p><strong>Time:</strong> {task?.dateTime}</p>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={closeDialog}>Ignore</Button>
            <AlertDialogAction asChild>
                <Button onClick={closeDialog}>Attend</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TaskNotificationContext.Provider>
  );
};
