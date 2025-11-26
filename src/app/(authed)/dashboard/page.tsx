
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { ListTodo, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { useTaskNotification } from '@/context/TaskNotificationContext';

type Event = {
  id: string;
  active: boolean;
};

type Feedback = {
  id: string;
};

export default function DashboardPage() {
  const { firestore, user } = useFirebase();

  // Use the count from the context for tasks
  const { unattendedTaskCount } = useTaskNotification();

  // Fetch active events
  const eventsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'events') : null, [firestore, user]);
  const activeEventsQuery = useMemoFirebase(() => eventsRef ? query(eventsRef, where('active', '==', true)) : null, [eventsRef]);
  const { data: activeEvents, isLoading: eventsLoading } = useCollection<Event>(activeEventsQuery);

  // Fetch feedback
  const feedbackRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'feedback') : null, [firestore, user]);
  const { data: feedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackRef);

  const stats = [
    {
      title: 'Unattended Tasks',
      count: unattendedTaskCount,
      icon: <ListTodo className="h-6 w-6 text-destructive" />,
      href: '/dashboard/tasks',
      cta: 'View Tasks',
      loading: false, // Task count is now managed by context
    },
    {
      title: 'Active Events',
      count: activeEvents?.length || 0,
      icon: <Calendar className="h-6 w-6 text-blue-500" />,
      href: '/dashboard/events',
      cta: 'Manage Events',
      loading: eventsLoading,
    },
    {
      title: 'Total Feedback',
      count: feedback?.length || 0,
      icon: <MessageSquare className="h-6 w-6 text-green-500" />,
      href: '/dashboard/feedback',
      cta: 'View Feedback',
      loading: feedbackLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <div className="h-10 w-16 bg-gray-200 animate-pulse rounded-md" />
              ) : (
                <div className="text-4xl font-bold">{stat.count}</div>
              )}
            </CardContent>
            <CardFooter>
                <Link href={stat.href} className='w-full'>
                    <Button variant="outline" className='w-full'>
                        {stat.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
