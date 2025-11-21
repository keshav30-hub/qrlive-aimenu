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

const stats = [
  {
    title: 'Menu Items',
    value: '3',
    icon: <BookOpen className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/menu',
  },
  {
    title: 'Categories',
    value: '3',
    icon: <LayoutGrid className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/menu',
  },
    {
    title: 'Combos',
    value: '3',
    icon: <Box className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/menu',
  },
  {
    title: 'Unattended Tasks',
    value: '4',
    icon: <ListTodo className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/tasks',
  },
  {
    title: 'Avg. Feedback',
    value: '3.5',
    icon: <Star className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/feedback',
  },
  {
    title: 'Active Events',
    value: '3',
    icon: <Calendar className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/events',
  },
  {
    title: 'Active Staff',
    value: '4',
    icon: <Users className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/staff',
  },
  {
    title: 'QR Menu Tables',
    value: '5',
    icon: <QrCode className="h-6 w-6 text-muted-foreground" />,
    href: '/dashboard/setupqrmenu',
  },
];

export default function DashboardOverviewPage() {
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
