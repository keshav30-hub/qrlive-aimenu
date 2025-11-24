
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Task = {
  id: string;
  tableName: string;
  requestType: string;
  dateTime: string;
  status: 'attended' | 'ignored' | 'unattended';
  staff?: string;
};

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
  const tasksRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksRef);

  const [currentPage, setCurrentPage] = useState(1);
  const { showNewTask } = useTaskNotification();

  const unattendedTasks = useMemo(() => (tasks || []).filter(t => t.status === 'unattended'), [tasks]);
  const taskHistory = useMemo(() => (tasks || []).filter(t => t.status !== 'unattended'), [tasks]);

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

  const handleUpdateTask = async (taskId: string, status: 'attended' | 'ignored') => {
    if (!tasksRef) return;
    const taskDoc = doc(tasksRef, taskId);
    try {
      await updateDoc(taskDoc, { status, staff: status === 'attended' ? user?.displayName || 'Admin' : '-' });
      toast({ title: "Success", description: `Task marked as ${status}.` });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update task." });
      console.error(e);
    }
  };
  
  const simulateTask = () => {
    const sampleTask = {
        tableName: 'Table 7',
        requestType: 'Call Captain',
        dateTime: new Date().toLocaleTimeString(),
    };
    showNewTask(sampleTask);
    // In a real app, you'd also add this to firestore
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
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              {tasksLoading ? <p>Loading tasks...</p> : unattendedTasks.map((task) => (
                <Card key={task.id} className="w-[280px]">
                  <CardHeader>
                    <CardTitle className="text-lg">{task.tableName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-semibold">{task.requestType}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.dateTime}
                    </p>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => handleUpdateTask(task.id, 'ignored')}>Ignore</Button>
                      <Button onClick={() => handleUpdateTask(task.id, 'attended')}>Attend</Button>
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
        </CardHeader>
        <CardContent>
          {tasksLoading ? <p>Loading history...</p> : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Table Number</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.id.substring(0, 5)}...</TableCell>
                    <TableCell>{task.dateTime}</TableCell>
                    <TableCell>{task.tableName}</TableCell>
                    <TableCell>{task.requestType}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(task.status)}
                        className="capitalize"
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.staff}</TableCell>
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
