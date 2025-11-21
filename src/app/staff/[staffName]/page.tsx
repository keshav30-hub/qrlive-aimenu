'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { startOfMonth } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const staffData: { [key: string]: any } = {
    'john-doe': {
      id: '1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      dob: '1990-05-15',
      address: '123 Main St, Anytown, USA',
      accessCode: '123456',
      role: 'Manager',
      pageAccess: ['dashboard', 'menu', 'tasks', 'feedback', 'qr-menu', 'events', 'staff', 'settings'],
    },
    'jane-smith': {
      id: '2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
      dob: '1992-08-22',
      address: '456 Oak Ave, Anytown, USA',
      accessCode: '654321',
      role: 'Captain',
      pageAccess: ['dashboard', 'menu', 'tasks'],
    },
    'alex-johnson': {
      id: '3',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
      dob: '1995-01-30',
      address: '789 Pine Ln, Anytown, USA',
      accessCode: '112233',
      role: 'Captain',
      pageAccess: ['tasks', 'feedback'],
    },
    'emily-white': {
      id: '4',
      name: 'Emily White',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
      dob: '1998-11-10',
      address: '101 Maple Dr, Anytown, USA',
      accessCode: '445566',
      role: 'Captain',
      pageAccess: ['qr-menu', 'events'],
    },
    'michael-brown': {
      id: '5',
      name: 'Michael Brown',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d',
      dob: '1988-03-25',
      address: '212 Birch Rd, Anytown, USA',
      accessCode: '778899',
      role: 'Manager',
      pageAccess: ['dashboard', 'staff', 'settings'],
    },
  };
  
  const pageAccessLabels: { [key: string]: string } = {
    dashboard: 'Dashboard',
    menu: 'Menu',
    tasks: 'Tasks',
    feedback: 'Feedback',
    'qr-menu': 'QR Menu',
    events: 'Events',
    staff: 'Staff',
    settings: 'Settings',
  };
  

const generateAttendanceData = (year: number) => {
    const attendance: { [key: number]: { [key: number]: string } } = {};
    const statuses = ['Present', 'Absent', 'Paid Leave', 'Half Day'];
  
    for (let month = 0; month < 12; month++) {
      attendance[month] = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        // Leave weekends empty
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
  
        attendance[month][day] = statuses[Math.floor(Math.random() * statuses.length)];
      }
    }
    return attendance;
};
  
const currentYear = new Date().getFullYear();
const attendanceData = generateAttendanceData(currentYear);
  

type AttendanceStatus = 'Present' | 'Absent' | 'Paid Leave' | 'Half Day';
const getStatusClass = (status: AttendanceStatus) => {
    switch (status) {
        case 'Present': return 'bg-green-100 text-green-800';
        case 'Absent': return 'bg-red-100 text-red-800';
        case 'Paid Leave': return 'bg-yellow-100 text-yellow-800';
        case 'Half Day': return 'bg-blue-100 text-blue-800';
        default: return '';
    }
};

export default function StaffDetailsPage() {
  const params = useParams();
  const staffName = params.staffName as string;
  const staff = staffData[staffName];

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-2xl font-semibold">Staff member not found.</p>
        <Link href="/staff">
            <Button variant="link">Go back to staff list</Button>
        </Link>
      </div>
    );
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    return new Date(currentYear, i, 1).toLocaleString('default', { month: 'long' });
  });

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/staff">
            <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to Staff</span>
            </Button>
            </Link>
            <h1 className="text-3xl font-bold">Staff Details</h1>
        </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-6 space-y-0">
          <Avatar className="h-24 w-24">
            <AvatarImage src={staff.avatar} alt={staff.name} />
            <AvatarFallback>{staff.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-3xl">{staff.name}</CardTitle>
            <CardDescription className="text-lg">{staff.role}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-6">
          <div>
            <h4 className="font-semibold text-muted-foreground">Date of Birth</h4>
            <p>{new Date(staff.dob).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="font-semibold text-muted-foreground">Access Code</h4>
            <p>******</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-semibold text-muted-foreground">Address</h4>
            <p>{staff.address}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-semibold text-muted-foreground">Page Access</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {staff.pageAccess.map((pageId: string) => (
                <Badge key={pageId} variant="secondary">{pageAccessLabels[pageId] || pageId}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Attendance History - {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {months.map((month, index) => (
                <AccordionItem value={`item-${index}`} key={month}>
                    <AccordionTrigger>{month}</AccordionTrigger>
                    <AccordionContent>
                    <Calendar
                        month={startOfMonth(new Date(currentYear, index))}
                        modifiers={attendanceData[index]}
                        modifiersClassNames={{
                            Present: 'day-present',
                            Absent: 'day-absent',
                            'Paid Leave': 'day-paid-leave',
                            'Half Day': 'day-half-day',
                        }}
                        className="p-0"
                        classNames={{
                            day_selected: "",
                            day_today: "bg-accent text-accent-foreground rounded-md",
                        }}
                        components={{
                            DayContent: ({ date, ...props }) => {
                                const dayOfMonth = date.getDate();
                                const monthIndex = date.getMonth();
                                const status = attendanceData[monthIndex]?.[dayOfMonth] as AttendanceStatus | undefined;
                                
                                if (!status) return <div {...props}>{dayOfMonth}</div>;

                                return (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className={cn("w-full h-full flex items-center justify-center rounded-md", getStatusClass(status))}>
                                                {dayOfMonth}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{status}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            },
                        }}
                    />
                     <div className="mt-4 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-green-200"></div><span>Present</span></div>
                        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-red-200"></div><span>Absent</span></div>
                        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-yellow-200"></div><span>Paid Leave</span></div>
                        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-blue-200"></div><span>Half Day</span></div>
                    </div>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
