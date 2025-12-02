
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, PhoneCall, CheckCircle, XCircle } from 'lucide-react';

type Task = {
  table: string;
  request: string;
  time: string;
  status: 'attended' | 'ignored' | 'unattended';
  handledBy?: string;
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
  const { setUnattendedTaskCount, setDialogsDisabled } = useTaskNotification();
  
  // Enable dialogs on this page
  useEffect(() => {
    setDialogsDisabled(false);
  }, [setDialogsDisabled]);

  const unattendedTasks = useMemo(() => (tasksDoc?.pendingCalls || []).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()), [tasksDoc]);
  const taskHistory = useMemo(() => (tasksDoc?.attendedCalls || []).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()), [tasksDoc]);

  useEffect(() => {
    setUnattendedTaskCount(unattendedTasks.length);
  }, [unattendedTasks, setUnattendedTaskCount]);

  const stats = useMemo(() => {
    const attended = taskHistory.filter(t => t.status === 'attended').length;
    const ignored = taskHistory.filter(t => t.status === 'ignored').length;
    const total = unattendedTasks.length + taskHistory.length;
    return { total, attended, ignored };
  }, [unattendedTasks, taskHistory]);


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
    
    const originalTaskInDb = (tasksDoc?.pendingCalls || []).find(
      t => t.time === taskToUpdate.time && t.table === taskToUpdate.table && t.request === taskToUpdate.request
    );

    if (!originalTaskInDb) {
      toast({ variant: "destructive", title: "Error", description: "Task not found to update. It might have been attended already." });
      return;
    }

    const updatedTask = { ...originalTaskInDb, status: newStatus, time: new Date().toISOString(), handledBy: 'Admin' };

    try {
      // Atomically remove from pending and add to attended
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
  

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tasks</h1>

       <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attended</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
               {tasksLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold">{stats.attended}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ignored</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
               {tasksLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold">{stats.ignored}</div>
              )}
            </CardContent>
          </Card>
        </div>

       <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Data Retention Policy</AlertTitle>
        <AlertDescription>
          Attended and ignored tasks from the history log will be automatically deleted after 60 days.
        </AlertDescription>
      </Alert>

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
                  <TableHead>Handled By</TableHead>
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
                    <TableCell>{task.handledBy || '-'}</TableCell>
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
