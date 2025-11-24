
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BookOpen,
  ListTodo,
  Star,
  Calendar,
  Users,
  QrCode,
  Box,
  LayoutGrid,
} from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';

type MenuItem = { id: string };
type Category = { id: string };
type Combo = { id: string };
type Task = { id: string; status: string };
type Feedback = { id: string; rating: number };
type Event = { id: string; active: boolean };
type Staff = { id: string; active: boolean };
type Table = { id: string };

export default function DashboardOverviewPage() {
  const { firestore, user } = useFirebase();

  const menuItemsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuItems') : null, [firestore, user]);
  const categoriesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuCategories') : null, [firestore, user]);
  const combosRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'combos') : null, [firestore, user]);
  const tasksRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
  const feedbackRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'feedback') : null, [firestore, user]);
  const eventsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'events') : null, [firestore, user]);
  const staffRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff') : null, [firestore, user]);
  const tablesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tables') : null, [firestore, user]);

  const { data: menuItems } = useCollection<MenuItem>(menuItemsRef);
  const { data: categories } = useCollection<Category>(categoriesRef);
  const { data: combos } = useCollection<Combo>(combosRef);
  const { data: tasks } = useCollection<Task>(tasksRef);
  const { data: feedbackList } = useCollection<Feedback>(feedbackRef);
  const { data: events } = useCollection<Event>(eventsRef);
  const { data: staffList } = useCollection<Staff>(staffRef);
  const { data: tables } = useCollection<Table>(tablesRef);

  const unattendedTasksCount = useMemo(() => (tasks || []).filter(t => t.status === 'unattended').length, [tasks]);
  const averageFeedback = useMemo(() => {
    if (!feedbackList || feedbackList.length === 0) return '0.0';
    const totalRating = feedbackList.reduce((acc, f) => acc + f.rating, 0);
    return (totalRating / feedbackList.length).toFixed(1);
  }, [feedbackList]);
  const activeEventsCount = useMemo(() => (events || []).filter(e => e.active).length, [events]);
  const activeStaffCount = useMemo(() => (staffList || []).filter(s => s.active).length, [staffList]);


  const stats = [
    {
      title: 'Menu Items',
      value: menuItems?.length ?? 0,
      icon: <BookOpen className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/menu',
    },
    {
      title: 'Categories',
      value: categories?.length ?? 0,
      icon: <LayoutGrid className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/menu',
    },
      {
      title: 'Combos',
      value: combos?.length ?? 0,
      icon: <Box className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/menu',
    },
    {
      title: 'Unattended Tasks',
      value: unattendedTasksCount,
      icon: <ListTodo className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/tasks',
    },
    {
      title: 'Avg. Feedback',
      value: averageFeedback,
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/feedback',
    },
    {
      title: 'Active Events',
      value: activeEventsCount,
      icon: <Calendar className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/events',
    },
    {
      title: 'Active Staff',
      value: activeStaffCount,
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/staff',
    },
    {
      title: 'QR Menu Tables',
      value: tables?.length ?? 0,
      icon: <QrCode className="h-6 w-6 text-muted-foreground" />,
      href: '/dashboard/setupqrmenu',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
