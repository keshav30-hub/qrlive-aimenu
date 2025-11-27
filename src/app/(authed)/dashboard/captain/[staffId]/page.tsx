
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LogOut } from 'lucide-react';
import { useTaskNotification } from '@/context/TaskNotificationContext';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Task = {
  table: string;
  request: string;
  time: string;
  status: 'attended' | 'ignored' | 'unattended';
  handledBy?: string;
};

type StaffMember = {
    id: string;
    name: string;
};

type TaskDoc = {
    pendingCalls: Task[];
    attendedCalls: Task[];
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'attended':
      return 'default';
    case 'ignored':
      return 'destructive';
    case 'unattended':
      return 'secondary';
    default:
      return 'outline';
  }
};


export default function CaptainTasksPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const { staffId } = params;

  const staffDocRef = useMemoFirebase(() => (user && staffId) ? doc(firestore, 'users', user.uid, 'staff', staffId as string) : null, [firestore, user, staffId]);
  const tasksLiveRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'tasks', 'live') : null, [firestore, user]);
  
  const { data: staffMember, isLoading: staffLoading } = useDoc<StaffMember>(staffDocRef);
  const { data: tasksDoc, isLoading: tasksLoading } = useDoc<TaskDoc>(tasksLiveRef);

  const unattendedTasks = useMemo(() => (tasksDoc?.pendingCalls || []).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()), [tasksDoc]);
  const attendedToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return (tasksDoc?.attendedCalls || [])
        .filter(task => task.handledBy === staffMember?.name && task.time.startsWith(today))
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [tasksDoc, staffMember]);

  
  const { setUnattendedTaskCount, setDialogsDisabled } = useTaskNotification();

  useEffect(() => {
    setDialogsDisabled(true); // Disable global popups on this page
    return () => setDialogsDisabled(false); // Re-enable on unmount
  }, [setDialogsDisabled]);

  useEffect(() => {
    setUnattendedTaskCount(unattendedTasks.length);
  }, [unattendedTasks, setUnattendedTaskCount]);

  const handleUpdateTask = async (taskToUpdate: Task, newStatus: 'attended' | 'ignored') => {
    if (!tasksLiveRef || !staffMember) return;
    
    const originalTaskInDb = (tasksDoc?.pendingCalls || []).find(
      t => t.time === taskToUpdate.time && t.table === taskToUpdate.table && t.request === taskToUpdate.request
    );

    if (!originalTaskInDb) {
      toast({ variant: "destructive", title: "Error", description: "Task not found to update." });
      return;
    }

    const updatedTask = { ...originalTaskInDb, status: newStatus, time: new Date().toISOString(), handledBy: staffMember.name };

    try {
      await updateDoc(tasksLiveRef, { 
        pendingCalls: arrayRemove(originalTaskInDb),
        attendedCalls: arrayUnion(updatedTask)
      });
      toast({ title: "Success", description: `Task marked as ${newStatus}.` });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update task." });
      console.error(e);
    }
  };
  
  const handleLogout = () => {
    router.push('/dashboard/captain');
  }

  if (tasksLoading || staffLoading) {
    return <div className="flex h-screen items-center justify-center">Loading tasks...</div>;
  }
  
  return (
    <div className="space-y-6 max-w-lg mx-auto py-6 px-4">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Captain's Dashboard</h1>
            <p className="text-lg text-muted-foreground">Welcome, {staffMember?.name || 'Captain'}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unattended Tasks ({unattendedTasks.length})</CardTitle>
           <CardDescription>Live requests from your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              {tasksLoading ? <p>Loading tasks...</p> : unattendedTasks.map((task, index) => (
                <Card key={index} className="w-[280px] border-primary border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{task.table}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-semibold">{task.request}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(task.time).toLocaleTimeString()}
                    </p>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => handleUpdateTask(task, 'ignored')}>Ignore</Button>
                      <Button onClick={() => handleUpdateTask(task, 'attended')}>Attend</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
               {unattendedTasks.length === 0 && !tasksLoading && (
                  <div className="text-center w-full py-10 text-muted-foreground">
                      <p>No unattended tasks right now. Great job!</p>
                  </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Attended Tasks</CardTitle>
           <CardDescription>Tasks you have handled today.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? <p>Loading history...</p> : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendedToday.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(task.time).toLocaleString()}</TableCell>
                    <TableCell>{task.table}</TableCell>
                    <TableCell>{task.request}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(task.status)}
                        className="capitalize"
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {attendedToday.length === 0 && !tasksLoading && (
              <div className="text-center py-10 text-muted-foreground">
                  <p>You have not attended any tasks today.</p>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
