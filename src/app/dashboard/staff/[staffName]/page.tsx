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
import { ChevronLeft, Edit, Eye, EyeOff, X, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


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
      salary: 50000,
      shift: 'Morning Shift',
      active: true,
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
      salary: 35000,
      shift: 'Evening Shift',
      active: true,
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
      salary: 32000,
      shift: 'Morning Shift',
      active: false,
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
      salary: 33000,
      shift: 'Evening Shift',
      active: true,
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
      salary: 52000,
      shift: 'Morning Shift',
      active: true,
    },
  };
  
const pageAccessOptions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'menu', label: 'Menu' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'qr-menu', label: 'QR Menu' },
    { id: 'events', label: 'Events' },
    { id: 'staff', label: 'Staff' },
    { id: 'settings', label: 'Settings' },
];

const shiftOptions = ['Morning Shift', 'Evening Shift'];
  

const generateAttendanceData = (year: number) => {
    const attendance: { [key: number]: { [key: number]: string } } = {};
    const statuses = ['Present', 'Absent', 'Paid Leave', 'Half Day'];
  
    for (let month = 0; month < 12; month++) {
      attendance[month] = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
  
        attendance[month][day] = statuses[Math.floor(Math.random() * statuses.length)];
      }
    }
    return attendance;
};
  
export default function StaffDetailsPage() {
  const params = useParams();
  const staffName = params.staffName as string;
  const staffMember = staffData[staffName];

  const [staffDetails, setStaffDetails] = useState(staffMember);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(staffMember);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState(() => generateAttendanceData(selectedYear));


  const handleEditClick = () => {
    setEditedDetails(staffDetails);
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    setStaffDetails(editedDetails);
    setIsEditing(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedDetails((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setAttendanceData(generateAttendanceData(year));
  };
  
  const handlePageAccessChange = (pageId: string, checked: boolean) => {
    setEditedDetails((prev: any) => {
      const newPageAccess = checked
        ? [...prev.pageAccess, pageId]
        : prev.pageAccess.filter((id: string) => id !== pageId);
      return { ...prev, pageAccess: newPageAccess };
    });
  };


  const attendanceSummary = useMemo(() => {
    const summary: { [key: string]: any } = {};
    for (let month = 0; month < 12; month++) {
        const monthData = attendanceData[month] || {};
        const daysWithRecord = Object.keys(monthData).map(Number);
        const present = daysWithRecord.filter(day => monthData[day] === 'Present').length;
        const absent = daysWithRecord.filter(day => monthData[day] === 'Absent').length;
        const paidLeave = daysWithRecord.filter(day => monthData[day] === 'Paid Leave').length;
        const halfDay = daysWithRecord.filter(day => monthData[day] === 'Half Day').length;

        const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
        let workingDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayOfWeek = new Date(selectedYear, month, day).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
                workingDays++;
            }
        }

        summary[month] = { totalDays: workingDays, present, absent, paidLeave, halfDay };
    }
    return summary;
  }, [attendanceData, selectedYear]);

  if (!staffDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-2xl font-semibold">Staff member not found.</p>
        <Link href="/dashboard/staff">
            <Button variant="link">Go back to staff list</Button>
        </Link>
      </div>
    );
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    return new Date(selectedYear, i, 1).toLocaleString('default', { month: 'long' });
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/staff">
             <Button size="icon" className="bg-primary text-primary-foreground">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to Staff</span>
            </Button>
            </Link>
            <h1 className="text-3xl font-bold">Staff Details</h1>
        </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-6 space-y-0">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={staffDetails.avatar} alt={staffDetails.name} />
                    <AvatarFallback>{staffDetails.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    {isEditing ? (
                      <Input name="name" value={editedDetails.name} onChange={handleInputChange} className="text-3xl font-bold p-0 border-0 shadow-none focus-visible:ring-0" />
                    ) : (
                      <CardTitle className="text-3xl">{staffDetails.name}</CardTitle>
                    )}
                    {isEditing ? (
                       <Select value={editedDetails.role} onValueChange={(value) => setEditedDetails((prev: any) => ({ ...prev, role: value }))}>
                          <SelectTrigger className="text-lg p-0 border-0 shadow-none focus-visible:ring-0 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Captain">Captain</SelectItem>
                          </SelectContent>
                        </Select>
                    ) : (
                       <CardDescription className="text-lg">{staffDetails.role}</CardDescription>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
               {!isEditing && (
                <div className="flex items-center space-x-2">
                    <Switch id="active-status" checked={staffDetails.active} disabled />
                    <Label htmlFor="active-status">{staffDetails.active ? 'Active' : 'Inactive'}</Label>
                </div>
               )}
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                        <Button variant="outline" onClick={handleCancelClick}><X className="mr-2 h-4 w-4" />Cancel</Button>
                        <Button onClick={handleSaveClick}><Check className="mr-2 h-4 w-4" />Save</Button>
                        </>
                    ) : (
                        <Button variant="outline" size="icon" onClick={handleEditClick}>
                            <Edit className="h-5 w-5" />
                            <span className="sr-only">Edit Staff</span>
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 pt-6">
          <div>
            <h4 className="font-semibold text-muted-foreground">Date of Birth</h4>
            {isEditing ? (
              <Input type="date" name="dob" value={new Date(editedDetails.dob).toISOString().split('T')[0]} onChange={handleInputChange} />
            ) : (
              <p>{new Date(staffDetails.dob).toLocaleDateString()}</p>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-muted-foreground">Salary</h4>
            {isEditing ? (
                <Input type="number" name="salary" value={editedDetails.salary} onChange={handleInputChange} />
            ) : (
                <p>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(staffDetails.salary)}</p>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-muted-foreground">Shift</h4>
             {isEditing ? (
                <Select value={editedDetails.shift} onValueChange={(value) => setEditedDetails((prev: any) => ({ ...prev, shift: value }))}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a shift" />
                    </SelectTrigger>
                    <SelectContent>
                        {shiftOptions.map(shift => (
                            <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <p>{staffDetails.shift}</p>
            )}
          </div>
          <div className="col-span-1 md:col-span-3">
            <h4 className="font-semibold text-muted-foreground">Address</h4>
            {isEditing ? (
                <Textarea name="address" value={editedDetails.address} onChange={handleInputChange} />
            ) : (
                <p>{staffDetails.address}</p>
            )}
          </div>
           <div className="col-span-1">
            <h4 className="font-semibold text-muted-foreground">Access Code</h4>
             {isEditing ? (
                <div className="relative">
                    <Input name="accessCode" type={showAccessCode ? 'text' : 'password'} value={editedDetails.accessCode} onChange={handleInputChange} />
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowAccessCode(!showAccessCode)}>
                        {showAccessCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
             ) : (
                <p>******</p>
             )}
          </div>
           {isEditing && (
            <div className="flex items-center space-x-2 self-end">
                <Switch 
                    id="active-status-edit" 
                    checked={editedDetails.active} 
                    onCheckedChange={(checked) => setEditedDetails((prev: any) => ({...prev, active: checked}))}
                />
                <Label htmlFor="active-status-edit">{editedDetails.active ? 'Active' : 'Inactive'}</Label>
            </div>
           )}
          <div className="col-span-1 md:col-span-3">
            <h4 className="font-semibold text-muted-foreground">Page Access</h4>
             {isEditing ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-md border p-4 mt-2">
                    {pageAccessOptions.map((item) => (
                        <div key={item.id} className="flex flex-row items-center space-x-3">
                            <Checkbox 
                                id={`access-${item.id}`} 
                                checked={editedDetails.pageAccess.includes(item.id)}
                                onCheckedChange={(checked) => handlePageAccessChange(item.id, !!checked)}
                            />
                            <Label htmlFor={`access-${item.id}`} className="font-normal">
                                {item.label}
                            </Label>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                {staffDetails.pageAccess.map((pageId: string) => (
                    <Badge key={pageId} variant="secondary">{pageAccessOptions.find(p => p.id === pageId)?.label || pageId}</Badge>
                ))}
                </div>
             )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Attendance History</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedYear}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {yearOptions.map(year => (
                    <DropdownMenuItem key={year} onSelect={() => handleYearChange(year)}>
                        {year}
                    </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {months.map((month, index) => {
                  const summary = attendanceSummary[index];
                  return (
                    <AccordionItem value={`item-${index}`} key={month}>
                        <AccordionTrigger>{month}</AccordionTrigger>
                        <AccordionContent>
                           {summary.totalDays > 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <p className="text-sm text-muted-foreground">Overall Days</p>
                                  <p className="text-2xl font-bold">{summary.totalDays}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                                  <p className="text-sm text-green-700 dark:text-green-400">Present</p>
                                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">{summary.present}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                                  <p className="text-sm text-red-700 dark:text-red-400">Absent</p>
                                  <p className="text-2xl font-bold text-red-800 dark:text-red-300">{summary.absent}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                  <p className="text-sm text-blue-700 dark:text-blue-400">Half Day</p>
                                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{summary.halfDay}</p>
                                </div>
                               <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                                  <p className="text-sm text-yellow-700 dark:text-yellow-400">Paid Leave</p>
                                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{summary.paidLeave}</p>
                                </div>
                            </div>
                           ) : (
                            <p className="text-muted-foreground">No attendance data recorded for this month.</p>
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
