
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
import { LogOut, PhoneCall, CheckCircle, XCircle, Info } from 'lucide-react';
import { trackWaiterCall } from '@/lib/gtag';

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

type StaffMember = {
    id: string;
    name: string;
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

export default function CaptainTasksPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const staffId = params.staffId as string;
  
  const staffRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'staff', staffId) : null, [firestore, user, staffId]);
  const tasksLiveRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'tasks', 'live') : null, [firestore, user]);

  const { data: staffMember, isLoading: staffLoading } = useDoc<StaffMember>(staffRef);
  const { data: tasksDoc, isLoading: tasksLoading } = useDoc<TaskDoc>(tasksLiveRef);

  const [currentPage, setCurrentPage] = useState(1);
  const { setDialogsDisabled } = useTaskNotification();
  
  // Disable automatic dialog popups on this page
  useEffect(() => {
    setDialogsDisabled(true);
    // Re-enable them when the component unmounts
    return () => setDialogsDisabled(false);
  }, [setDialogsDisabled]);

  const unattendedTasks = useMemo(() => (tasksDoc?.pendingCalls || []).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()), [tasksDoc]);
  const taskHistory = useMemo(() => (tasksDoc?.attendedCalls || []).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()), [tasksDoc]);


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
    if (!tasksLiveRef || !staffMember) return;
    
    // Find the original task object in the database state to ensure atomicity
    const originalTaskInDb = (tasksDoc?.pendingCalls || []).find(
      t => t.time === taskToUpdate.time && t.table === taskToUpdate.table && t.request === taskToUpdate.request
    );

    if (!originalTaskInDb) {
      toast({ variant: "destructive", title: "Error", description: "Task not found. It may have been attended by another staff member." });
      return;
    }
    
    trackWaiterCall(taskToUpdate.request);

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

  if (staffLoading) {
    return <div className="flex h-screen items-center justify-center">Verifying captain...</div>;
  }
  
  if (!staffMember) {
     return <div className="flex h-screen items-center justify-center">Could not verify staff details. Please go back and try again.</div>;
  }
  

  return (
    <div className="space-y-6 p-4 md:p-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Captain Tasks</h1>
                <p className="text-muted-foreground">Welcome, {staffMember.name}. Here are the service requests.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
       </div>
       
      <Card>
        <CardHeader>
          <CardTitle>Unattended Tasks</CardTitle>
           <CardDescription>Live requests from your customers that need attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              {tasksLoading ? <p>Loading tasks...</p> : unattendedTasks.map((task, index) => (
                <Card key={index} className="w-[280px] border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PhoneCall className="h-5 w-5 text-primary" />
                        {task.table}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-semibold text-base">{task.request}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested at: {new Date(task.time).toLocaleTimeString()}
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
                      <p>No new service requests right now.</p>
                  </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
       <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Data Retention Policy</AlertTitle>
        <AlertDescription>
          Task history records are automatically deleted after 60 days.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Tasks History</CardTitle>
           <CardDescription>Record of all attended and ignored tasks for the day.</CardDescription>
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
