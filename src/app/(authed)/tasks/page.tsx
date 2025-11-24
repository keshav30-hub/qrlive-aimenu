
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTaskNotification } from '@/context/TaskNotificationContext';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Task = {
  table: string;
  request: string;
  time: string;
  status: 'attended' | 'ignored' | 'unattended';
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

const ITEMS_PER_PAGE = 10;

export default function TasksPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const tasksLiveRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'tasks', 'live') : null, [firestore, user]);
  const { data: tasksDoc, isLoading: tasksLoading } = useDoc<TaskDoc>(tasksLiveRef);

  const [currentPage, setCurrentPage] = useState(1);
  const { showNewTask, setUnattendedTaskCount } = useTaskNotification();

  const unattendedTasks = useMemo(() => (tasksDoc?.pendingCalls || []).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()), [tasksDoc]);
  const taskHistory = useMemo(() => (tasksDoc?.attendedCalls || []).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()), [tasksDoc]);

  const prevPendingCallsRef = useRef<Task[]>([]);

  useEffect(() => {
    setUnattendedTaskCount(unattendedTasks.length);

    if (tasksLoading) return;

    if (unattendedTasks.length > 0 && prevPendingCallsRef.current.length === 0) {
      prevPendingCallsRef.current = unattendedTasks;
      return;
    }
    
    if (unattendedTasks.length > prevPendingCallsRef.current.length) {
      const newTasks = unattendedTasks.filter(
        task => !prevPendingCallsRef.current.some(
          prevTask => prevTask.time === task.time && prevTask.table === task.table && prevTask.request === task.request
        )
      );
      
      if (newTasks.length > 0) {
        const latestTask = newTasks.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];
        showNewTask({
          tableName: latestTask.table,
          requestType: latestTask.request,
          dateTime: new Date(latestTask.time).toLocaleTimeString(),
        });
      }
    }

    prevPendingCallsRef.current = unattendedTasks;

  }, [unattendedTasks, showNewTask, tasksLoading, setUnattendedTaskCount]);


  const totalPages = Math.ceil(taskHistory.length / ITEMS_PER_PAGE);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return taskHistory.slice(startIndex, endIndex);
  }, [currentPage, taskHistory]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleUpdateTask = async (taskToUpdate: Task, newStatus: 'attended' | 'ignored') => {
    if (!tasksLiveRef) return;
    
    const updatedTask = { ...taskToUpdate, status: newStatus };

    try {
      await updateDoc(tasksLiveRef, { 
        pendingCalls: arrayRemove(taskToUpdate),
        attendedCalls: arrayUnion(updatedTask)
      });
      toast({ title: "Success", description: `Task marked as ${newStatus}.` });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update task." });
      console.error(e);
    }
  };
  
  const simulateTask = async () => {
    if (!tasksLiveRef) return;
    const sampleTask = {
        table: 'Table 7 (Simulated)',
        request: 'Call Captain',
        time: new Date().toISOString(),
        status: 'unattended' as const
    };
    try {
      await updateDoc(tasksLiveRef, {
        pendingCalls: arrayUnion(sampleTask)
      });
    } catch(e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Could not simulate task." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button onClick={simulateTask} variant="secondary">Simulate New Task</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unattended Tasks</CardTitle>
           <CardDescription>Live requests from your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              {tasksLoading ? <p>Loading tasks...</p> : unattendedTasks.map((task, index) => (
                <Card key={index} className="w-[280px]">
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
                      <p>No unattended tasks right now.</p>
                  </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks History</CardTitle>
           <CardDescription>Record of all attended and ignored tasks.</CardDescription>
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
                {paginatedTasks.map((task, index) => (
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
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            {taskHistory.length === 0 && !tasksLoading && (
              <div className="text-center py-10 text-muted-foreground">
                  <p>No tasks in your history yet.</p>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
