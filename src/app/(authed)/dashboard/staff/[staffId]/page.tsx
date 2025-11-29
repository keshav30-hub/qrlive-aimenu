
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
  User,
  Fingerprint,
  Briefcase,
  ChevronLeft,
  ImageIcon,
  Wallet,
  FilePenLine,
  CircleDollarSign,
  Gift,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, getDocs, orderBy, startOfMonth, endOfMonth } from 'firebase/firestore';
import { format, getMonth, startOfYear, endOfYear, eachMonthOfInterval, getDaysInMonth, getYear } from 'date-fns';
import { useCurrency } from '@/hooks/use-currency';

type StaffMember = {
  id: string;
  name: string;
  avatar?: string;
  accessCode?: string;
  shiftId?: string;
  monthlySalary?: number;
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
  date: string; 
  imageUrl?: string;
  captureTime?: Timestamp;
};

type PayrollAdjustment = {
    id: string;
    type: 'bonus' | 'fine';
    amount: number;
    comment: string;
    date: string; // yyyy-MM-dd
};

type UserProfile = {
    createdAt?: Timestamp;
}

const getStatusVariant = (status: AttendanceRecord['status']) => {
  switch (status) {
    case 'Present': return 'default';
    case 'Absent': return 'destructive';
    case 'Half Day':
    case 'Paid Leave': return 'secondary';
    default: return 'outline';
  }
};

const MonthAttendance = ({ monthDate, staffId }: { monthDate: Date, staffId: string }) => {
    const { user, firestore } = useFirebase();
    const { format: formatCurrency } = useCurrency();
    
    const staffDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'staff', staffId) : null, [firestore, user, staffId]);
    const { data: staff, isLoading: isStaffLoading } = useDoc<StaffMember>(staffDocRef);

    const attendanceRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff', staffId, 'attendance') : null, [firestore, user, staffId]);
    const payrollRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff', staffId, 'payroll') : null, [firestore, user, staffId]);
    
    const monthQuery = useMemoFirebase(() => {
        if (!attendanceRef) return null;
        const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');
        return query(attendanceRef, where('date', '>=', start), where('date', '<=', end));
    }, [attendanceRef, monthDate]);

    const payrollQuery = useMemoFirebase(() => {
        if (!payrollRef) return null;
        const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');
        return query(payrollRef, where('date', '>=', start), where('date', '<=', end));
    }, [payrollRef, monthDate]);

    const { data: recordsForMonth, isLoading: isAttendanceLoading } = useCollection<AttendanceRecord>(monthQuery);
    const { data: adjustmentsForMonth, isLoading: isPayrollLoading } = useCollection<PayrollAdjustment>(payrollQuery);
    
    if (isStaffLoading || isAttendanceLoading || isPayrollLoading) {
        return <div className="p-4 text-center">Loading month data...</div>;
    }
    
    if (!staff) {
        return <div className="p-4 text-center">Could not load staff data.</div>;
    }

    const monthName = format(monthDate, 'MMMM');
    const totalDaysInMonth = getDaysInMonth(monthDate);
    const presentCount = (recordsForMonth || []).filter(r => r.status === 'Present').length;
    const absentCount = totalDaysInMonth - (recordsForMonth || []).length;
    const halfDayCount = (recordsForMonth || []).filter(r => r.status === 'Half Day').length;
    const paidLeaveCount = (recordsForMonth || []).filter(r => r.status === 'Paid Leave').length;

    const totalBonuses = (adjustmentsForMonth || []).filter(a => a.type === 'bonus').reduce((acc, curr) => acc + curr.amount, 0);
    const totalFines = (adjustmentsForMonth || []).filter(a => a.type === 'fine').reduce((acc, curr) => acc + curr.amount, 0);

    const monthlySalary = staff.monthlySalary || 0;
    const perDaySalary = monthlySalary / totalDaysInMonth;
    
    // Half day counts as half salary
    const salaryForDays = perDaySalary * (presentCount + paidLeaveCount + (halfDayCount * 0.5));
    const finalSalary = salaryForDays + totalBonuses - totalFines;

    return (
        <div className="p-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
            <div className='p-2 rounded-md bg-gray-100 dark:bg-gray-800'>
              <p className="text-sm text-muted-foreground">Total Days</p>
              <p className="font-bold text-lg">{totalDaysInMonth}</p>
            </div>
            <div className='p-2 rounded-md bg-green-100 dark:bg-green-900/30'>
              <p className="text-sm text-green-800 dark:text-green-300">Present</p>
              <p className="font-bold text-lg text-green-900 dark:text-green-200">{presentCount}</p>
            </div>
            <div className='p-2 rounded-md bg-red-100 dark:bg-red-900/30'>
               <p className="text-sm text-red-800 dark:text-red-300">Absent</p>
              <p className="font-bold text-lg text-red-900 dark:text-red-200">{absentCount}</p>
            </div>
            <div className='p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30'>
               <p className="text-sm text-yellow-800 dark:text-yellow-300">Half Day / Leave</p>
              <p className="font-bold text-lg text-yellow-900 dark:text-yellow-200">{halfDayCount} / {paidLeaveCount}</p>
            </div>
          </div>

          <Card className='mb-4'>
              <CardHeader className='p-4'>
                  <CardTitle className='text-base'>Salary Calculation for {monthName}</CardTitle>
              </CardHeader>
              <CardContent className='p-4 text-sm space-y-2'>
                  <div className='flex justify-between'><span>Salary Earned (incl. Half Days):</span> <span className='font-medium'>{formatCurrency(salaryForDays)}</span></div>
                  <div className='flex justify-between'><span>Bonuses:</span> <span className='font-medium text-green-600'>+ {formatCurrency(totalBonuses)}</span></div>
                  <div className='flex justify-between'><span>Fines:</span> <span className='font-medium text-destructive'>- {formatCurrency(totalFines)}</span></div>
              </CardContent>
              <CardFooter className='p-4 border-t'>
                <div className='flex justify-between font-bold text-base w-full'><span>Final Salary:</span> <span>{formatCurrency(finalSalary)}</span></div>
              </CardFooter>
          </Card>

          {(adjustmentsForMonth || []).length > 0 && (
             <Card className="mb-4">
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Bonuses & Fines for {monthName}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Comment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {adjustmentsForMonth?.map(adj => (
                                <TableRow key={adj.id}>
                                    <TableCell>{format(new Date(adj.date), 'PPP')}</TableCell>
                                    <TableCell className="capitalize">
                                        <Badge variant={adj.type === 'bonus' ? 'default' : 'destructive'}>{adj.type}</Badge>
                                    </TableCell>
                                    <TableCell>{formatCurrency(adj.amount)}</TableCell>
                                    <TableCell>{adj.comment}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

        {(recordsForMonth || []).length > 0 ? (
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
              {(recordsForMonth || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
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
        </div>
    );
};


export default function StaffDetailPage() {
  const { user, firestore } = useFirebase();
  const params = useParams();
  const staffId = params.staffId as string;
  const { format: formatCurrency } = useCurrency();
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const availableYears = useMemo(() => {
    if (!userProfile?.createdAt) {
      return [currentYear];
    }
    const startYear = getYear(userProfile.createdAt.toDate());
    const years = [];
    for (let i = currentYear; i >= startYear; i--) {
      years.push(i);
    }
    return years;
  }, [userProfile, currentYear]);


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

  const monthsOfYear = useMemo(() => {
    return eachMonthOfInterval({
        start: startOfYear(new Date(selectedYear, 0, 1)),
        end: endOfYear(new Date(selectedYear, 11, 31)),
    });
  }, [selectedYear]);


  if (staffLoading || shiftLoading || isProfileLoading) {
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={staff.avatar} alt={staff.name} />
              <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{staff.name}</CardTitle>
            </div>
          </div>
           <Button variant="outline" onClick={() => router.push('/dashboard/staff')}>
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
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
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                <p className="font-medium">{staff.monthlySalary ? formatCurrency(staff.monthlySalary) : 'Not Set'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>Monthly breakdown of attendance and salary.</CardDescription>
                 </div>
                 {availableYears.length > 0 && (
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a year" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 )}
            </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {monthsOfYear.map(monthDate => {
              const monthName = format(monthDate, 'MMMM');
              return (
                <AccordionItem key={monthName} value={monthName}>
                  <AccordionTrigger>
                    {monthName} {selectedYear}
                  </AccordionTrigger>
                  <AccordionContent>
                      <MonthAttendance monthDate={monthDate} staffId={staffId} />
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

    