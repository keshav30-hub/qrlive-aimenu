
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  User,
  Fingerprint,
  Briefcase,
  ChevronLeft,
  Calendar,
  Clock,
  ImageIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format, getMonth, getYear, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';

type StaffMember = {
  id: string;
  name: string;
  avatar: string;
  accessCode?: string;
  shiftId?: string;
  // Add other fields as necessary, e.g., dob, address, salary
};

type Shift = {
  id: string;
  name: string;
  from: string;
  to: string;
};

type AttendanceRecord = {
  id: string;
  staffId: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Paid Leave';
  date: string; // 'yyyy-MM-dd'
  imageUrl?: string;
  captureTime?: Timestamp;
};

const getStatusVariant = (status: AttendanceRecord['status']) => {
  switch (status) {
    case 'Present': return 'default';
    case 'Absent': return 'destructive';
    case 'Half Day':
    case 'Paid Leave': return 'secondary';
    default: return 'outline';
  }
};

export default function StaffDetailPage() {
  const { user, firestore } = useFirebase();
  const params = useParams();
  const staffId = params.staffId as string;

  const staffDocRef = useMemoFirebase(
    () => (user && staffId ? doc(firestore, 'users', user.uid, 'staff', staffId) : null),
    [firestore, user, staffId]
  );
  const { data: staff, isLoading: staffLoading } = useDoc<StaffMember>(staffDocRef);

  const shiftDocRef = useMemoFirebase(
    () => (user && staff?.shiftId ? doc(firestore, 'users', user.uid, 'shifts', staff.shiftId) : null),
    [firestore, user, staff]
  );
  const { data: shift, isLoading: shiftLoading } = useDoc<Shift>(shiftDocRef);

  const attendanceRef = useMemoFirebase(
    () => (user && staffId ? collection(firestore, 'users', user.uid, 'attendance') : null),
    [firestore, user, staffId]
  );
  
  const currentYear = new Date().getFullYear();
  const startOfCurrentYear = startOfYear(new Date());
  const endOfCurrentYear = endOfYear(new Date());
  
  const attendanceQuery = useMemoFirebase(
    () => attendanceRef ? query(
        attendanceRef, 
        where('staffId', '==', staffId),
        where('date', '>=', format(startOfCurrentYear, 'yyyy-MM-dd')),
        where('date', '<=', format(endOfCurrentYear, 'yyyy-MM-dd'))
    ) : null,
    [attendanceRef, staffId, startOfCurrentYear, endOfCurrentYear]
  );

  const { data: attendanceData, isLoading: attendanceLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  const monthsOfYear = useMemo(() => {
    return eachMonthOfInterval({
        start: startOfCurrentYear,
        end: endOfCurrentYear,
    });
  }, [startOfCurrentYear, endOfCurrentYear]);


  const attendanceByMonth = useMemo(() => {
    const grouped: { [key: number]: AttendanceRecord[] } = {};
    (attendanceData || []).forEach(record => {
      const month = getMonth(new Date(record.date));
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(record);
    });
    return grouped;
  }, [attendanceData]);
  
  if (staffLoading || shiftLoading || attendanceLoading) {
    return <div className="flex h-screen items-center justify-center">Loading staff details...</div>;
  }

  if (!staff) {
    return <div className="flex h-screen items-center justify-center">Staff member not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Staff Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={staff.avatar} alt={staff.name} />
              <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{staff.name}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{staff.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Access Code</p>
                <p className="font-medium font-mono">{staff.accessCode || 'Not Set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Shift</p>
                <p className="font-medium">{shift ? `${shift.name} (${shift.from} - ${shift.to})` : 'Not Assigned'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History - {currentYear}</CardTitle>
          <CardDescription>Monthly breakdown of attendance for the current year.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {monthsOfYear.map(monthDate => {
              const monthIndex = getMonth(monthDate);
              const monthName = format(monthDate, 'MMMM');
              const recordsForMonth = attendanceByMonth[monthIndex] || [];
              const presentCount = recordsForMonth.filter(r => r.status === 'Present').length;
              const absentCount = recordsForMonth.filter(r => r.status === 'Absent').length;
              const halfDayCount = recordsForMonth.filter(r => r.status === 'Half Day').length;

              return (
                <AccordionItem key={monthName} value={monthName}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                        <span>{monthName}</span>
                        <div className="flex gap-4 text-sm">
                            <span>Present: {presentCount}</span>
                            <span>Absent: {absentCount}</span>
                             <span>Half Day: {halfDayCount}</span>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {recordsForMonth.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Capture Time</TableHead>
                            <TableHead>Image</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recordsForMonth.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                            <TableRow key={record.id}>
                              <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(record.status)} className="capitalize">{record.status}</Badge>
                              </TableCell>
                              <TableCell>{record.captureTime ? record.captureTime.toDate().toLocaleTimeString() : '-'}</TableCell>
                              <TableCell>
                                {record.imageUrl ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                           <Button variant="ghost" size="icon">
                                            <ImageIcon className="h-5 w-5" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Attendance for {format(new Date(record.date), 'PPP')}</DialogTitle>
                                            </DialogHeader>
                                                <div className="relative mt-4 h-96 w-full">
                                                <Image src={record.imageUrl} alt={`Attendance for ${staff.name}`} layout="fill" objectFit="contain" />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground p-4">No attendance records for {monthName}.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
